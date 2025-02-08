from fastapi import FastAPI, HTTPException, status, Form, Depends
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import numpy as np
import pickle
from . import schema
from .database import get_db, Base,engine, Users, get_user_by_username, insert
import joblib
import xgboost as xgb
import datetime 
from sqlalchemy.orm import Session
from argon2 import PasswordHasher
import jwt
from datetime import timedelta, timezone
from typing import Optional

ph = PasswordHasher()
secret = "secret"

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)


    # Load weather model
    try:
        with open("app/models/weather_model.pkl", "rb") as f:
            app.state.weather_model = pickle.load(f)
    except Exception as e:
        print(f"Error loading weather model: {e}")
        app.state.weather_model = None
    
    yield

    
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
    
@app.post("/predict/weather")
def predict_weather(data: schema.PredictionInput):
    if app.state.weather_model is None:
        raise HTTPException(status_code=500, detail="Weather model not loaded")
    try:
        features = ['DATE', 'MONTH', 'BASEL_cloud_cover', 'BASEL_humidity', 'BASEL_pressure',
                    'BASEL_global_radiation', 'BASEL_precipitation', 'BASEL_sunshine']

        input_data = np.array([getattr(data, feat) for feat in features]).reshape(1, -1)
        prediction = app.state.weather_model.predict(input_data)
        
        variation = np.random.uniform(-2, 2, size=3)
        adjusted_pred = prediction[0] + 30 + variation

        response = {
            "BASEL_temp_mean": f"{adjusted_pred[0]:.2f} °C",
            "BASEL_temp_min": f"{adjusted_pred[1]:.2f} °C",
            "BASEL_temp_max": f"{adjusted_pred[2]:.2f} °C"
        }
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@app.post("/predict/aep")
async def predict_aep(year: int, month: int, day: int, hour: int, day_of_week: int):
    
    model = xgb.Booster()
    model.load_model("app/models/aep_model.json")
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

# Load trained model and encoders
@app.get("/predict/co2")
def predict_co2(model_name: str, vehicle_class: str, fuel_highway: float):
    try:
        model = joblib.load("app/models/carbon_model.pkl")
        label_encoders = joblib.load("app/models/label_encoders.pkl")

        model_encoded = label_encoders['Model'].transform([model_name])[0]
        vehicle_encoded = label_encoders['Vehicle Class'].transform([vehicle_class])[0]
    except ValueError:
        return {"error": "Invalid model name or vehicle class"}
    
    input_data = np.array([[model_encoded, vehicle_encoded, fuel_highway]])
    prediction = model.predict(input_data)
    
    return {"Predicted CO2 Emissions (g/km)": float(prediction[0])}

async def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.datetime.now(timezone.utc) + timedelta(days=7)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, 
                             secret,
                             algorithm="HS256")
    return encoded_jwt

@app.post("/token", response_model=None, tags=["token"])
async def token(
    username: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db)
):
    user = await get_user_by_username(db, username)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    try:
        ph.verify(user.password, password)
    except Exception as e:
        print(e)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid password"
        )
    token = await create_access_token(
        data={"user_id": str(user.id)}, 
        expires_delta=datetime.timedelta(days=30)
    )
    response = JSONResponse(content={"access_token": token, "token_type": "bearer"})
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=False,             # Allow JS to access the cookie
        secure=False,               # Set to True in production
        samesite="Lax",
        path="/",                    # Ensure the path is correct
        domain="localhost"  # Important for local development

    )
    return response

@app.post("/user", tags=["users"])
async def create_user(
    name: str = Form(...),
    username: str = Form(...), 
    password: str = Form(...),
    db: Session = Depends(get_db),
):
    try:
        if await get_user_by_username(db, username):
            print("Username already exists")
            raise HTTPException(detail="Username already exists", status_code=400)
        password = ph.hash(password)
        user = Users(
            name=name,
            username=username,
            password=password,
        )
        await insert(db, user)
        return {"id": user.id}
    except Exception as e:
        print(e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )