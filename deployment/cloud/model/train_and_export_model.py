import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense
from tensorflow.keras.utils import to_categorical
import joblib

# Load dataset
df = pd.read_csv("less_noisy_ecg_dataset.csv")

# Encode categorical features
df['Rhythm'] = LabelEncoder().fit_transform(df['Rhythm'])
df['T_Wave'] = LabelEncoder().fit_transform(df['T_Wave'])
df['Diagnosis'] = LabelEncoder().fit_transform(df['Diagnosis'])

# Features and labels
X = df.drop("Diagnosis", axis=1).values
y = to_categorical(df["Diagnosis"].values)

# Scale features
scaler = StandardScaler()
X = scaler.fit_transform(X)
joblib.dump(scaler, "scaler.pkl")

# Train/test split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Model
model = Sequential([
    Dense(64, activation='relu', input_shape=(X.shape[1],)),
    Dense(64, activation='relu'),
    Dense(y.shape[1], activation='softmax')
])
model.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['accuracy'])
model.fit(X_train, y_train, epochs=50, batch_size=32, validation_data=(X_test, y_test))

# Save model
model.save("ecg_model.h5")
