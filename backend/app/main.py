from fastapi import FastAPI, HTTPException
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import numpy as np
import pickle
from . import schema
import os
from dotenv import load_dotenv

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize MongoDB and load models
    app.client = AsyncIOMotorClient(os.environ["MONGODB_URL"])
    app.db = app.client.get

    # Load weather model
    try:
        with open("app/models/weather_model.pkl", "rb") as f:
            app.state.weather_model = pickle.load(f)
    except Exception as e:
        print(f"Error loading weather model: {e}")
        app.state.weather_model = None

    # Load AEP model
    try:
        with open("app/models/weather_model.pkl", "rb") as f:
            app.state.aep_model = pickle.load(f)
    except Exception as e:
        print(f"Error loading AEP model: {e}")
        app.state.aep_model = None
    
    yield

    # Shutdown: Close MongoDB connection
    app.mongodb_client.close()

app = FastAPI(lifespan=lifespan)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return RedirectResponse(url="/docs")

# Health check endpoint
@app.get("/health")
async def health():
    return {"status": "healthy"}

# MongoDB connection test endpoint
@app.get("/test-db")
async def test_mongodb_connection():
    try:
        collections = await app.mongodb.list_collection_names()
        return JSONResponse(content={"message": "MongoDB connection successful!", "collections": collections}, status_code=200)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"MongoDB connection failed: {str(e)}")

@app.post("/predict/weather")
def predict_weather(data: schema.PredictionInput):
    if app.state.weather_model is None:
        raise HTTPException(status_code=500, detail="Weather model not loaded")
    try:
        features = ['DATE', 'MONTH', 'HOUR', 'BASEL_cloud_cover', 'BASEL_humidity', 'BASEL_pressure',
                    'BASEL_global_radiation', 'BASEL_precipitation', 'BASEL_sunshine']

        input_data = np.array([getattr(data, feat) for feat in features]).reshape(1, -1)
        prediction = app.state.weather_model.predict(input_data)
        response = {
            "BASEL_temp_mean": prediction[0][0],
            "BASEL_temp_min": prediction[0][1],
            "BASEL_temp_max": prediction[0][2]
        }
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict/aep")
async def predict_aep(year: int, month: int, day: int, hour: int, day_of_week: int):
    if app.state.aep_model is None:
        raise HTTPException(status_code=500, detail="AEP model not loaded")
    # Simulating the latest lag & rolling mean values (should be replaced with actual values)
    lag_1 = 20000
    lag_2 = 20500
    lag_3 = 21000
    rolling_mean_3 = 22000
    rolling_mean_6 = 22500
    rolling_mean_12 = 23000

    # Encode cyclic hour feature
    hour_sin = np.sin(2 * np.pi * hour / 24)
    hour_cos = np.cos(2 * np.pi * hour / 24)

    # Prepare input array
    future_data = np.array([[year, month, day, hour, day_of_week,
                             lag_1, lag_2, lag_3, rolling_mean_3, rolling_mean_6, rolling_mean_12, hour_sin, hour_cos]])

    try:
        # Predict
        predicted_aep = app.state.aep_model.predict(future_data)
        return {"Predicted AEP (MWh)": predicted_aep[0]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AEP prediction failed: {str(e)}")