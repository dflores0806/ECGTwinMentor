# -*- coding: utf-8 -*-
"""ECGTwinMentor_Colab.ipynb

Automatically generated by Colab.

Original file is located at
    https://colab.research.google.com/drive/1hSjApyCGq8gMhT_UpdbnDyEZdG6RMP4L

# ECG Digital Twin - Model Training, Export and Validation
This notebook loads ECG data, preprocesses it, trains a DL model, evaluates it, exports it to multiple formats, and validates its consistency.
"""

# === Imports ===
import os
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import classification_report, confusion_matrix, mean_absolute_error, r2_score
from sklearn.model_selection import train_test_split
from imblearn.over_sampling import SMOTE
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense
from tensorflow.keras.callbacks import EarlyStopping
from tensorflow.keras.models import load_model
import joblib
import tensorflow as tf
#!pip install -q tf2onnx
import tf2onnx
#!pip install -q onnxruntime
import onnxruntime as ort

# === Create output folders ===

# For google drive
#from google.colab import drive
#drive.mount('/content/drive')
#FIG_DIR = "drive/MyDrive/Colab Notebooks/ECGTwinMentor/figures"
#MOD_DIR = "drive/MyDrive/Colab Notebooks/ECGTwinMentor/models"
#DATASET = "drive/MyDrive/Colab Notebooks/ECGTwinMentor/ecg_dataset.csv"

# === For local folder
FIG_DIR = "figures"
MOD_DIR = "models"
DATASET = "ecg_dataset.csv"

os.makedirs(FIG_DIR, exist_ok=True)
os.makedirs(MOD_DIR, exist_ok=True)

# === Load dataset ===
df = pd.read_csv(DATASET)
df.head()

# === Visualize class distribution ===
plt.figure(figsize=(8, 4))
df["Diagnosis"].value_counts().plot(kind="bar", color="skyblue")
plt.title("Diagnosis class distribution")
plt.xlabel("Class")
plt.ylabel("Count")
plt.tight_layout()
plt.savefig(FIG_DIR + "/class_distribution.pdf")
#plt.show()

# === Correlation matrix between ECG parameters ===
plt.figure(figsize=(10, 8))
correlation_matrix = df.corr(numeric_only=True)

sns.heatmap(correlation_matrix, annot=True, fmt=".2f", cmap="coolwarm", square=True)
plt.title("Correlation matrix of ECG parameters")
plt.tight_layout()
plt.savefig(FIG_DIR + "/correlation_matrix.pdf")
#plt.show()

# === Encode categorical variables ===
le_rhythm = LabelEncoder()
le_t_wave = LabelEncoder()
le_diagnosis = LabelEncoder()

df["Rhythm"] = le_rhythm.fit_transform(df["Rhythm"])
df["T_Wave"] = le_t_wave.fit_transform(df["T_Wave"])
df["Diagnosis"] = le_diagnosis.fit_transform(df["Diagnosis"])

X = df.drop("Diagnosis", axis=1)
y = df["Diagnosis"]

# === Standardize features ===
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# === Split data ===
X_train, X_test, y_train, y_test = train_test_split(X_scaled, y, stratify=y, test_size=0.2, random_state=42)

# === Apply SMOTE ===
smote = SMOTE(random_state=42)
X_train_res, y_train_res = smote.fit_resample(X_train, y_train)

# === Define and train model ===
model = Sequential([
    Dense(128, activation='relu', input_shape=(X.shape[1],)),
    Dense(64, activation='relu'),
    Dense(32, activation='relu'),
    Dense(len(np.unique(y)), activation='softmax')
])

model.compile(optimizer='adam', loss='sparse_categorical_crossentropy', metrics=['accuracy'])

history = model.fit(
    X_train_res, y_train_res,
    validation_data=(X_test, y_test),
    epochs=50,
    batch_size=32,
    callbacks=[EarlyStopping(patience=6, restore_best_weights=True)],
    verbose=1
)

# === Plot training history ===
plt.figure(figsize=(12, 5))

plt.figure(figsize=(5, 5))
plt.plot(history.history["loss"], label="Train Loss")
plt.plot(history.history["val_loss"], label="Val Loss")
plt.xlabel("Epochs")
plt.ylabel("Loss")
plt.title("Training and validation loss")
plt.legend()
plt.tight_layout()
plt.savefig(FIG_DIR + "/loss_curve.pdf")
#plt.show()


plt.figure(figsize=(5, 5))
plt.plot(history.history["accuracy"], label="Train Accuracy")
plt.plot(history.history["val_accuracy"], label="Val Accuracy")
plt.xlabel("Epochs")
plt.ylabel("Accuracy")
plt.title("Training and validation accuracy")
plt.legend()
plt.tight_layout()
plt.savefig(FIG_DIR + "/accuracy_curve.pdf")
#plt.show()


# === Evaluate model ===
y_pred = model.predict(X_test)
y_pred_classes = np.argmax(y_pred, axis=1)

print(classification_report(y_test, y_pred_classes, target_names=le_diagnosis.classes_))
print("MAE:", mean_absolute_error(y_test, y_pred_classes))
print("R^2 Score:", r2_score(y_test, y_pred_classes))

# === Confusion Matrix ===
cm = confusion_matrix(y_test, y_pred_classes)
plt.figure(figsize=(5, 5))
sns.heatmap(cm, annot=True, fmt="d", xticklabels=le_diagnosis.classes_, yticklabels=le_diagnosis.classes_)
plt.xlabel("Predicted")
plt.ylabel("Actual")
plt.title("Confusion matrix")
plt.tight_layout()
plt.savefig(FIG_DIR + "/confusion_matrix.pdf")
#plt.show()

# === Predict a random sample from the test set ===
import random

idx = random.randint(0, X_test.shape[0] - 1)
sample = X_test[idx].reshape(1, -1)
true_label = y_test.iloc[idx]
pred_probs = model.predict(sample)
pred_class = np.argmax(pred_probs)
pred_label = le_diagnosis.inverse_transform([pred_class])[0]
true_label_str = le_diagnosis.inverse_transform([true_label])[0]
pred_confidence = pred_probs[0][pred_class]

print("🔍 Selected sample index:", idx)
print("Predicted class:", pred_class, "-", pred_label)
print("True class:", true_label, "-", true_label_str)
print("Predicted probabilities:", pred_probs)
print("🎯 Prediction confidence:", f"{pred_confidence:.2%}")
print("✅ Match:", pred_class == true_label)

# === Save model and encoders ===
model.save(MOD_DIR + "/ecg_model.h5")
joblib.dump(scaler, MOD_DIR + "/scaler.pkl")
joblib.dump(le_rhythm, MOD_DIR + "/le_rhythm.pkl")
joblib.dump(le_t_wave, MOD_DIR + "/le_t_wave.pkl")
joblib.dump(le_diagnosis, MOD_DIR + "/le_diagnosis.pkl")

# === Export to TFLite ===
converter = tf.lite.TFLiteConverter.from_keras_model(model)
tflite_model = converter.convert()
with open(MOD_DIR + "/ecg_model.tflite", "wb") as f:
    f.write(tflite_model)

# === Export to ONNX ===
_ = model.predict(tf.zeros((1, X.shape[1])))
spec = (tf.TensorSpec((None, X.shape[1]), tf.float32, name="input"),)
onnx_model, _ = tf2onnx.convert.from_function(
    tf.function(model),
    input_signature=spec,
    opset=13,
    output_path=MOD_DIR + "/ecg_model.onnx"
)

# === Validate model predictions with per-sample output ===
interpreter = tf.lite.Interpreter(model_path=MOD_DIR + "/ecg_model.tflite")
interpreter.allocate_tensors()
input_details = interpreter.get_input_details()
output_details = interpreter.get_output_details()
onnx_session = ort.InferenceSession(MOD_DIR + "/ecg_model.onnx")
onnx_input_name = onnx_session.get_inputs()[0].name

df_sample = df.sample(n=50)
true_labels = []
pred_h5 = []
pred_tflite = []
pred_onnx = []

print("--- Prediction Results by Sample ---\n")
for i, (_, row) in enumerate(df_sample.iterrows()):
    true_encoded = int(row["Diagnosis"])
    true_str = le_diagnosis.inverse_transform([true_encoded])[0]

    # Rhythm and T_Wave are already encoded
    X_row_df = pd.DataFrame([row.drop("Diagnosis").values], columns=X.columns)
    X_row = scaler.transform(X_row_df)
    X_row = np.array(X_row, dtype=np.float32)

    # HDF5
    h5_probs = model.predict(X_row, verbose=0)
    h5_class = np.argmax(h5_probs)
    pred_h5.append(h5_class)

    # TFLite
    interpreter.set_tensor(input_details[0]['index'], X_row)
    interpreter.invoke()
    tflite_probs = interpreter.get_tensor(output_details[0]['index'])
    tflite_class = np.argmax(tflite_probs)
    pred_tflite.append(tflite_class)

    # ONNX
    onnx_probs = onnx_session.run(None, {onnx_input_name: X_row})[0]
    onnx_class = np.argmax(onnx_probs)
    pred_onnx.append(onnx_class)

    true_labels.append(true_encoded)

    # Print detailed prediction
    print(f"Sample {i+1:02d} - True: {true_str}")
    print(f"  HDF5   → class {h5_class} ({le_diagnosis.inverse_transform([h5_class])[0]}) - {h5_probs}")
    print(f"  TFLite → class {tflite_class} ({le_diagnosis.inverse_transform([tflite_class])[0]}) - {tflite_probs}")
    print(f"  ONNX   → class {onnx_class} ({le_diagnosis.inverse_transform([onnx_class])[0]}) - {onnx_probs}")
    print("")

# === Final report
print("--- HDF5 ---")
print(classification_report(true_labels, pred_h5, target_names=le_diagnosis.classes_))
print("--- TFLite ---")
print(classification_report(true_labels, pred_tflite, target_names=le_diagnosis.classes_))
print("--- ONNX ---")
print(classification_report(true_labels, pred_onnx, target_names=le_diagnosis.classes_))

# === Ending
print("\n" + "="*60)
print("🎉 TRAINING COMPLETE! MODEL SUCCESSFULLY EXPORTED & VALIDATED 🎉")
print("="*60)
print("📁 Models saved in:        " + MOD_DIR)
print("📁 Figures saved in:       " + FIG_DIR)
print("🧪 Validation completed across: HDF5 | TFLite | ONNX")
print("✅ Ready for deployment or further evaluation.")
print("="*60 + "\n")
