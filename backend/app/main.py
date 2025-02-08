from fastapi import FastAPI, HTTPException, status, Form, Depends, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import numpy as np
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
import os
from PIL import Image
import ee
import geemap
import rasterio
import pandas as pd


ph = PasswordHasher()
secret = "secret"

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)


    # Load weather model
    try:
        app.state.weather_model = joblib.load("app/models/weather_model.pkl")
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

os.makedirs("static", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

# Create necessary directories
os.makedirs("static", exist_ok=True)

# Initialize Earth Engine
try:
    ee.Initialize(project='ee-praveentn1234')
except ee.EEException:
    ee.Authenticate()
    ee.Initialize()

def convert_tif_to_png(input_tif, output_png):
    with rasterio.open(input_tif) as src:
        image_data = src.read()
        image_data = (image_data / image_data.max()) * 255
        image_data = image_data.astype(np.uint8)
        image_rgb = np.transpose(image_data, (1, 2, 0))
        img = Image.fromarray(image_rgb)
        img.save(output_png)

def clean_numeric_data(df):
    """Clean numeric data by replacing inf/nan with None"""
    return df.replace([np.inf, -np.inf], None).fillna(None)

def validate_dataframe(df, value_column):
    """Validate dataframe has required columns and data"""
    if df.empty:
        return pd.DataFrame({'date': [], value_column: [], 'change': []})
    return df

def process_dataframe(df, value_column):
    """Process dataframe with proper NaN handling"""
    # Validate dataframe
    df = validate_dataframe(df, value_column)
    if df.empty:
        return df
        
    # Convert date column
    df['date'] = pd.to_datetime(df['date'])
    
    # Sort by date 
    df = df.sort_values('date')
    
    # Replace inf/-inf with 0 first
    df[value_column] = df[value_column].replace([np.inf, -np.inf], 0)
    
    # Fill remaining NaN with 0
    df[value_column] = df[value_column].fillna(value=0)
    
    # Calculate percent change with method specification
    df['change'] = df[value_column].pct_change().fillna(value=0) * 100
    
    return df

def prepare_json_data(df):
    """Prepare DataFrame for JSON serialization"""
    if df.empty:
        return {'date': [], 'pop': [], 'change': []}
        
    # Round numeric columns
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    df[numeric_cols] = df[numeric_cols].round(6)
    
    # Convert to dict with explicit NaN handling
    return df.where(pd.notnull(df), None).to_dict(orient="list")
@app.post("/process")
async def process(request: Request):
    try:
        data = await request.json()
        if "bounds" not in data:
            raise HTTPException(status_code=400, detail="Invalid request. 'bounds' key is missing.")

        bounds = data["bounds"]
        roi = ee.Geometry.Rectangle(bounds)

        # Land cover processing
        vis_params = {
            "min": 1, "max": 9,
            "palette": ["#1A5BAB", "#358221", "#87D19E", "#FFDB5C", "#ED022A", "#EDE9E4", "#F2FAFF", "#C8C8C8", "#C6AD8D"]
        }
        lc = ee.ImageCollection('projects/sat-io/open-datasets/landcover/ESRI_Global-LULC_10m_TS')\
            .filterDate('2017-01-01', '2017-12-31').mosaic()\
            .remap([1,2,4,5,7,8,9,10,11],[1,2,3,4,5,6,7,8,9]).rename('lc')

        landcover = lc.clip(roi).visualize(**vis_params)
        landcover_tif = "static/landcover.tif"
        landcover_png = "static/landcover.png"

        geemap.ee_export_image(landcover, filename=landcover_tif, scale=30)
        convert_tif_to_png(landcover_tif, landcover_png)

        # Population data processing
        pop_collection = ee.ImageCollection("JRC/GHSL/P2023A/GHS_POP").filterBounds(roi)
        pop_values = pop_collection.map(lambda img: ee.Feature(None, {
            'date': img.date().format('YYYY-MM-dd'),
            'pop': img.reduceRegion(
                reducer=ee.Reducer.sum(),
                geometry=roi,
                scale=500,
                maxPixels=1e13
            ).get("population_count")
        }))

        # Built-up area processing
        built_collection = ee.ImageCollection("JRC/GHSL/P2023A/GHS_BUILT_S").filterBounds(roi)
        built_values = built_collection.map(lambda img: ee.Feature(None, {
            'date': img.date().format('YYYY-MM-dd'),
            'area': img.reduceRegion(
                reducer=ee.Reducer.mean(),
                geometry=roi,
                scale=500,
                maxPixels=1e13
            ).get("built_surface")
        }))

        # Process population data
        feature_list = pop_values.toList(pop_values.size()).getInfo()
        pop_df = pd.DataFrame([
            {'date': item['properties']['date'], 'pop': item['properties']['pop']}
            for item in feature_list if item['properties']['pop'] is not None
        ])
        pop_df = process_dataframe(pop_df, 'pop')
        pop_json = prepare_json_data(pop_df)

        # Process built-up area data  
        built_list = built_values.toList(built_values.size()).getInfo()
        built_df = pd.DataFrame([
            {'date': item['properties']['date'], 'area': item['properties']['area']}
            for item in built_list if item['properties']['area'] is not None
        ])
        built_df = process_dataframe(built_df, 'area')
        built_json = prepare_json_data(built_df)

        return {
            "landcover": landcover_png,
            "population_data": pop_json,
            "built_area_data": built_json
        }

    except Exception as e:
        print(f"Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


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
        adjusted_pred = prediction[0] + 20 + variation

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

    # Define feature names
    feature_names = ['year', 'month', 'day', 'hour', 'day_of_week',
                     'lag_1', 'lag_2', 'lag_3', 'rolling_mean_3', 'rolling_mean_6', 'rolling_mean_12', 'hour_sin', 'hour_cos']

    try:
        # Convert numpy array to DMatrix with feature names
        dmatrix_data = xgb.DMatrix(future_data, feature_names=feature_names)
        
        # Predict and cast prediction to float
        predicted_aep = model.predict(dmatrix_data)
        return {"Predicted AEP (MWh)": float(predicted_aep[0])}
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