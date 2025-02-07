from pydantic import BaseModel

class PredictionInput(BaseModel):
    DATE: int
    MONTH: int
    HOUR: int
    BASEL_cloud_cover: float
    BASEL_humidity: float
    BASEL_pressure: float
    BASEL_global_radiation: float
    BASEL_precipitation: float
    BASEL_sunshine: float