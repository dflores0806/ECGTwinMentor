import os
import io
import uuid
import base64
import json
import matplotlib
import matplotlib.pyplot as plt
import joblib
import pandas as pd
import random
from pathlib import Path
from datetime import datetime
from collections import defaultdict, Counter
from dotenv import load_dotenv
from io import StringIO
import csv

from fastapi import FastAPI, Request
from fastapi.responses import FileResponse
from fastapi import BackgroundTasks
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, HTTPException, Header

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from pydantic import BaseModel
import numpy as np
import tensorflow as tf

from Crypto.Cipher import AES

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"]
)

# Load users
ENV_PATH = Path(".env")
if not ENV_PATH.exists():
    with open(ENV_PATH, "w") as f:
        f.write(
    'USERS_JSON={"admin": {"password": "admin123", "role": "admin"}, '
    '"demo": {"password": "demo", "role": "user"}}'
)
load_dotenv()

USERS_JSON = os.getenv("USERS_JSON")
USERS = json.loads(USERS_JSON)

# Logs
os.makedirs("logs", exist_ok=True)
STATISTICS_PATH = Path("logs/statistics.jsonl")

# Model settings
TFLITE_PATH = "ecg_model.tflite"
KERAS_MODEL_PATH = "ecg_model.h5"

# AES settings
SECRET_KEY = b'e4799ebc8be0f6bc973ab7fc966d6d4a'  # 32 bytes for AES-256
IV = b'trEMHBkonQFqJAIA'                          # 16 bytes for AES-CBC

# Initialize limiter
limiter = Limiter(key_func=get_remote_address)
#limiter = Limiter(key_func=get_remote_address, default_limits=["1/minute"])
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Load model and scaler
model = tf.keras.models.load_model("ecg_model.h5")
scaler = joblib.load("scaler.pkl")
df = pd.read_csv("ecg_dataset.csv")

class EncryptedRequest(BaseModel):
    data: str  # base64 encoded encrypted data

def decrypt_payload(encrypted_b64: str) -> dict:
    encrypted_bytes = base64.b64decode(encrypted_b64)
    cipher = AES.new(SECRET_KEY, AES.MODE_CBC, IV)
    decrypted = cipher.decrypt(encrypted_bytes)
    unpadded = decrypted.rstrip(b'\x00').rstrip(b'\x01').rstrip(b'\x02').rstrip(b'\x03').rstrip(b'\x04').rstrip(b'\x05').rstrip(b'\x06').rstrip(b'\x07').rstrip(b'\x08').rstrip(b'\x09').rstrip(b'\x0a').rstrip(b'\x0b').rstrip(b'\x0c').rstrip(b'\x0d').rstrip(b'\x0e').rstrip(b'\x0f')
    return json.loads(unpadded.decode('utf-8'))

# Define label mapping
label_map = {
    0: "Atrial Fibrillation",
    1: "Bradycardia",
    2: "Heart Block",
    3: "Myocardial Infarction",
    4: "Normal",
    5: "Tachycardia"
}

# Encoding dictionaries (must match training)
rhythm_map = {"Sinus": 0, "Bradycardia": 1, "Tachycardia": 2, "Atrial Fibrillation": 3}
twave_map = {"Normal": 0, "Inverted": 1, "Peaked": 2, "Flattened": 3}
matplotlib.use('agg')

class ECGInput(BaseModel):
    Heart_Rate: float
    PR_Interval: float
    QRS_Duration: float
    ST_Segment: float
    QTc_Interval: float
    Electrical_Axis: float
    Rhythm: str
    T_Wave: str
    user_diagnosis: str

def generate_ecg_image(data, cycles: int = 3) -> str:
    fs = 1000
    cycle_duration = 60 / float(data['Heart_Rate'])
    samples_per_cycle = int(fs * cycle_duration)
    t = np.linspace(0, cycle_duration, samples_per_cycle)

    def synthetic_ecg(t, pr, qrs, qt, st):
        pr = float(pr)
        qrs = float(qrs)
        qt = float(qt)
        st = float(st)

        ecg = np.zeros_like(t)
        p_start = int(0.1 * fs)
        p_peak = p_start + int(0.04 * fs)
        qrs_start = p_start + int(pr / 1000 * fs)
        qrs_peak = qrs_start + int(qrs / 2000 * fs)
        t_peak = qrs_start + int(qt / 1000 * fs)

        # función para acceso seguro
        def safe(arr, idx):
            return arr[min(max(0, idx), len(arr) - 1)]

        ecg += np.exp(-((t - safe(t, p_peak)) ** 2) / (2 * (0.015 ** 2))) * 0.1
        ecg += -np.exp(-((t - safe(t, qrs_peak - 5)) ** 2) / (2 * (0.004 ** 2))) * 0.15
        ecg += np.exp(-((t - safe(t, qrs_peak)) ** 2) / (2 * (0.01 ** 2))) * 1.0
        ecg += -np.exp(-((t - safe(t, qrs_peak + 5)) ** 2) / (2 * (0.004 ** 2))) * 0.2
        ecg += np.exp(-((t - safe(t, t_peak)) ** 2) / (2 * (0.04 ** 2))) * 0.3
        return ecg

    ecg_wave = synthetic_ecg(t, data['PR_Interval'], data['QRS_Duration'], data['QTc_Interval'], data['ST_Segment'])
    ecg_long = np.tile(ecg_wave, cycles)
    t_long = np.linspace(0, cycle_duration * cycles, len(ecg_long))

    filename = f"ecg_{uuid.uuid4().hex}.png"
    output_dir = os.path.join(os.path.dirname(__file__), "generated_ecgs")
    os.makedirs(output_dir, exist_ok=True)
    filepath = os.path.join(output_dir, filename)

    #plt.figure(figsize=(12, 3))
    plt.plot(t_long, ecg_long, color='orange', linewidth=2)
    plt.title("Simulated ECG")
    plt.xlabel("Time (s)")
    plt.ylabel("Amplitude (a.u.)")
    plt.grid(True)
    plt.tight_layout()
    plt.savefig(filepath)
    plt.close()
    return filepath

#############
# ENDPOINTS #
#############

# Login
class LoginRequest(BaseModel):
    username: str
    password: str

@app.post("/login")
def login_user(login: LoginRequest):
    user = USERS.get(login.username)
    if not user or user["password"] != login.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return {
        "username": login.username,
        "role": user["role"],
        "token": f"{login.username}::{login.password}"
    }


# Predict with uer data    
@app.post("/predict")
@limiter.limit("100/minute")
async def secure_predict(request: Request, ecgdata: EncryptedRequest):
    try:
        # Decrypt data and create ECG object       
        decrypted_data = decrypt_payload(ecgdata.data)   
        ecg_input = ECGInput(**decrypted_data)    
        
        print("ECG=", ecg_input)
        
        x = np.array([[
            ecg_input.Heart_Rate,
            ecg_input.PR_Interval,
            ecg_input.QRS_Duration,
            ecg_input.ST_Segment,
            ecg_input.QTc_Interval,
            ecg_input.Electrical_Axis,
            rhythm_map.get(ecg_input.Rhythm, 0),
            twave_map.get(ecg_input.T_Wave, 0)
        ]])
        x_scaled = scaler.transform(x)
        prediction = model.predict(x_scaled)
        predicted_class = int(np.argmax(prediction))
        label = label_map.get(predicted_class, "Unknown")
        
        # Save log
        selected_diagnosis = ecg_input.user_diagnosis

        log_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "input": decrypted_data,
            "model_prediction": label,
            "user_diagnosis": selected_diagnosis,
            "match": label == selected_diagnosis
        }

        with open(STATISTICS_PATH, "a") as f:
            f.write(json.dumps(log_entry) + "\n")
        
        # Return prediction result
        return {"prediction": label}

    except Exception as e:
        print("Error=", str(e))
        return {"error": str(e)}


# Generate pathology sample
class DiagnosisRequest(BaseModel):
    diagnosis: str
    
@app.post("/samples/random")
async def get_random_sample(data: DiagnosisRequest):
    filtered = df[df["Diagnosis"] == data.diagnosis]
    if filtered.empty:
        return {"error": "No samples found for that diagnosis"}
    
    sample = filtered.sample(1).iloc[0]

    return {
        "Heart_Rate": sample["Heart_Rate"],
        "PR_Interval": sample["PR_Interval"],
        "QRS_Duration": sample["QRS_Duration"],
        "ST_Segment": sample["ST_Segment"],
        "QTc_Interval": sample["QTc_Interval"],
        "Electrical_Axis": sample["Electrical_Axis"],
        "Rhythm": sample["Rhythm"],
        "T_Wave": sample["T_Wave"]
    }

# Download tflite model
@app.get("/models/tflite/download")
@limiter.limit("50/minute")
def convert_and_download_model(request: Request):
    # Verifica si el modelo Keras existe
    if not os.path.exists(KERAS_MODEL_PATH):
        raise HTTPException(status_code=404, detail="Keras model file not found")

    # Convertir el modelo a TensorFlow Lite si aún no existe
    if not os.path.exists(TFLITE_PATH):
        try:
            model = tf.keras.models.load_model(KERAS_MODEL_PATH)
            converter = tf.lite.TFLiteConverter.from_keras_model(model)
            tflite_model = converter.convert()
            with open(TFLITE_PATH, "wb") as f:
                f.write(tflite_model)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Model conversion failed: {e}")

    # Retornar el archivo como descarga
    return FileResponse(
        path=TFLITE_PATH,
        filename="ecg_model.tflite",
        media_type="application/octet-stream"
    )

# Get stats
@app.get("/stats/summary")
async def get_prediction_stats():
    total = 0
    correct = 0
    by_diagnosis = Counter()
    by_date = defaultdict(lambda: {"correct": 0, "incorrect": 0})
    confusions = Counter()

    if os.path.exists(STATISTICS_PATH):
        with open(STATISTICS_PATH, "r") as f:
            for line in f:
                try:
                    entry = json.loads(line)
                    total += 1
                    if entry.get("match"):
                        correct += 1
                    user_diag = entry.get("user_diagnosis", "Unknown")
                    model_diag = entry.get("model_prediction", "Unknown")
                    timestamp = entry.get("timestamp")
                    by_diagnosis[user_diag] += 1
                    if timestamp:
                        date = datetime.fromisoformat(timestamp).date().isoformat()
                        if entry.get("match"):
                            by_date[date]["correct"] += 1
                        else:
                            by_date[date]["incorrect"] += 1
                    if user_diag != model_diag:
                        confusions[(user_diag, model_diag)] += 1
                except:
                    continue

    return {
        "total": total,
        "accuracy": round(correct / total, 4) if total else 0.0,
        "by_diagnosis": dict(by_diagnosis),
        "by_date": dict(by_date),
        "confusions": [{"user": u, "model": m, "count": c} for (u, m), c in confusions.most_common(5)]
    }

@app.get("/stats/export/csv")
def export_stats_csv(x_token: str = Header(...)):
    try:
        username, password = x_token.split("::")
        user = USERS.get(username)
        if not user or user["password"] != password or user["role"] != "admin":
            raise HTTPException(status_code=403, detail="Forbidden")
    except:
        raise HTTPException(status_code=403, detail="Invalid token format")
    
    if not os.path.exists(STATISTICS_PATH):
        raise HTTPException(status_code=404, detail="No statistics found")

    with open(STATISTICS_PATH, "r") as f:
        data = [json.loads(line) for line in f if line.strip()]

    if not data:
        raise HTTPException(status_code=204, detail="No data available")

    # Convert to CSV
    output = StringIO()
    writer = csv.DictWriter(output, fieldnames=data[0].keys())
    writer.writeheader()
    writer.writerows(data)

    # Generate filename with timestamp
    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    filename = f"ECGTM_stats_{timestamp}.csv"

    output.seek(0)
    return StreamingResponse(
        output,
        media_type="text/csv",
        headers={"content-disposition": f"attachment; filename={filename}"}
    )

@app.delete("/stats")
async def clear_statistics(x_token: str = Header(...)):
    try:
        username, password = x_token.split("::")
        user = USERS.get(username)
        if not user or user["password"] != password or user["role"] != "admin":
            raise HTTPException(status_code=403, detail="Forbidden")
    except:
        raise HTTPException(status_code=403, detail="Invalid token format")

    with open(STATISTICS_PATH, "w") as f:
        try:
            if os.path.exists(STATISTICS_PATH):
                open(STATISTICS_PATH, "w").close() 
            return JSONResponse(content={"message": "Statistics cleared."}, status_code=200)
        except Exception as e:
            return JSONResponse(content={"error": str(e)}, status_code=500)