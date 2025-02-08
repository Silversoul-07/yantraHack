from pydantic import BaseModel

class PredictionInput(BaseModel):
    DATE: int
    MONTH: int
    BASEL_cloud_cover: float = 50
    BASEL_humidity: float = 70
    BASEL_pressure: float = 1010
    BASEL_global_radiation: float = 200
    BASEL_precipitation: float = 5
    BASEL_sunshine: float = 4