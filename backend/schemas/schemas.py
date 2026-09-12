from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class DestinationBase(BaseModel):
    name: str
    state: str
    country: str = "India"
    latitude: float
    longitude: float
    theme_type: str = "mountain"
    tagline: Optional[str] = None
    description: Optional[str] = None
    hero_image: Optional[str] = None

class DestinationOut(DestinationBase):
    id: int
    places_count: Optional[int] = 0

    class Config:
        from_attributes = True


class PlaceBase(BaseModel):
    name: str
    category: str
    description: str
    latitude: float
    longitude: float
    rating: float = 4.5
    review_count: int = 100
    open_time: str = "08:00"
    close_time: str = "18:00"
    duration_hours: float = 2.0
    entry_fee: float = 0.0
    is_hidden_gem: bool = False
    popularity_score: float = 80.0
    image_url: Optional[str] = None
    address: Optional[str] = None
    best_time_to_visit: Optional[str] = "Morning / Sunset"
    activity_type: Optional[str] = None

class PlaceOut(PlaceBase):
    id: int
    destination_id: int
    is_favorite: Optional[bool] = False

    class Config:
        from_attributes = True


class ItineraryRequest(BaseModel):
    destination_id: int
    place_ids: List[int]
    duration_days: int = Field(default=1, ge=1, le=7)
    starting_point: str = "Hotel"
    start_time: str = "08:00"
    end_time: str = "20:00"
    transport_mode: str = "Car" # Walking, Bike, Car, Public Transport, Mixed
    budget: Optional[float] = 3000.0
    start_lat: Optional[float] = None
    start_lng: Optional[float] = None


class ItineraryStop(BaseModel):
    stop_number: int
    place_id: Optional[int] = None
    name: str
    category: str
    arrival_time: str
    departure_time: str
    duration_minutes: int
    transit_time_minutes: int
    transit_distance_km: float
    estimated_entry_cost: float
    is_break: bool = False
    latitude: float
    longitude: float
    image_url: Optional[str] = None
    is_hidden_gem: bool = False
    notes: Optional[str] = None


class DayPlan(BaseModel):
    day: int
    date_label: str
    stops: List[ItineraryStop]
    total_travel_time_minutes: int
    total_distance_km: float
    estimated_daily_cost: float


class BudgetBreakdown(BaseModel):
    transportation: float
    entry_tickets: float
    food: float
    activities: float
    miscellaneous: float
    estimated_total: float
    allocated_budget: float
    status: str # "Within Budget", "Slightly Above Budget", "Over Budget"
    savings_tips: List[str] = []


class ItineraryResponse(BaseModel):
    destination_name: str
    duration_days: int
    days: List[DayPlan]
    budget_breakdown: BudgetBreakdown
    warnings: List[str] = []
    smart_suggestions: List[str] = []
    route_coordinates: List[Dict[str, Any]] = [] # [{lat, lng, name, stop_num, day}]


class TripCreate(BaseModel):
    title: str
    destination_id: int
    duration_days: int
    starting_point: str
    transport_mode: str
    budget_allocated: float
    budget_estimated: float
    itinerary_data: Dict[str, Any]
    user_id: Optional[int] = None

class TripOut(BaseModel):
    id: int
    title: str
    destination_id: int
    destination_name: Optional[str] = None
    duration_days: int
    starting_point: str
    transport_mode: str
    budget_allocated: float
    budget_estimated: float
    itinerary_data: Dict[str, Any]
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class UserAuth(BaseModel):
    credential: Optional[str] = None
    email: Optional[str] = None
    name: Optional[str] = None
    avatar_url: Optional[str] = None
    google_id: Optional[str] = None

class UserOut(BaseModel):
    id: int
    email: str
    name: str
    avatar_url: Optional[str] = None

    class Config:
        from_attributes = True


class FavoriteToggle(BaseModel):
    place_id: int
    user_id: int
