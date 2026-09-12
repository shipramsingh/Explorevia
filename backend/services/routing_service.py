import math
from typing import Tuple, Dict, Any, List

def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great-circle distance between two points in kilometers."""
    R = 6371.0 # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    distance = R * c
    # Real road travel in hilly or urban regions is ~1.3 to 1.4x straight line distance
    return round(distance * 1.35, 2)


def get_transport_metrics(transport_mode: str) -> Dict[str, Any]:
    """Returns average speed in km/h and cost per km factor in INR for Indian travel contexts."""
    mode = transport_mode.lower()
    if "walk" in mode:
        return {"speed_kmh": 4.5, "cost_per_km": 0.0, "base_cost": 0.0}
    elif "bike" in mode or "scooter" in mode:
        return {"speed_kmh": 25.0, "cost_per_km": 5.0, "base_cost": 400.0} # Bike rental daily base
    elif "public" in mode or "bus" in mode or "auto" in mode:
        return {"speed_kmh": 20.0, "cost_per_km": 8.0, "base_cost": 50.0}
    elif "car" in mode or "taxi" in mode or "cab" in mode:
        return {"speed_kmh": 32.0, "cost_per_km": 18.0, "base_cost": 300.0}
    else: # Mixed / default
        return {"speed_kmh": 24.0, "cost_per_km": 12.0, "base_cost": 200.0}


def calculate_transit(lat1: float, lon1: float, lat2: float, lon2: float, transport_mode: str) -> Tuple[float, int, float]:
    """
    Returns (distance_km, duration_minutes, estimated_transit_cost)
    """
    dist_km = haversine_distance_km(lat1, lon1, lat2, lon2)
    metrics = get_transport_metrics(transport_mode)
    
    # Calculate travel duration
    hours = dist_km / max(metrics["speed_kmh"], 1.0)
    minutes = max(int(hours * 60) + 5, 5) # Minimum 5 mins transit with buffer
    
    # Cost calculation for this segment
    segment_cost = round(dist_km * metrics["cost_per_km"], 2)
    return dist_km, minutes, segment_cost
