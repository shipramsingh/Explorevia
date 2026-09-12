from fastapi import APIRouter, Query
from backend.services.weather_service import get_live_weather

router = APIRouter(prefix="/api", tags=["Weather"])

@router.get("/weather")
async def get_weather(
    lat: float = Query(..., description="Latitude of destination"),
    lon: float = Query(..., description="Longitude of destination"),
    city: str = Query("Destination", description="City name")
):
    """Get live weather condition and 3-day forecast with smart travel warnings."""
    data = await get_live_weather(lat=lat, lon=lon, city_name=city)
    return data
