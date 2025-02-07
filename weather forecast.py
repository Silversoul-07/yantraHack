import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error
import pickle


df = pd.read_csv("weather_prediction_dataset.csv")

features = ['DATE', 'MONTH', 'HOUR', 'BASEL_cloud_cover', 'BASEL_humidity', 'BASEL_pressure',
            'BASEL_global_radiation', 'BASEL_precipitation', 'BASEL_sunshine']
targets = ['BASEL_temp_mean', 'BASEL_temp_min', 'BASEL_temp_max']

if 'DATE' in df.columns:
    df['DATE'] = pd.to_datetime(df['DATE']).dt.day
if 'HOUR' in df.columns:
    df['HOUR'] = pd.to_datetime(df['HOUR'], format='%H:%M').dt.hour

X_train, X_test, y_train, y_test = train_test_split(df[features], df[targets], test_size=0.2, random_state=42)

model = RandomForestRegressor(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# Evaluate the model
y_pred = model.predict(X_test)
mae = mean_absolute_error(y_test, y_pred)
print(f"Mean Absolute Error: {mae}")

# Save the model
with open("weather_model.pkl", "wb") as f:
    pickle.dump(model, f)
