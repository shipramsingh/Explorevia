import math
from datetime import datetime, timedelta
from typing import List, Dict, Any, Tuple
from backend.services.routing_service import calculate_transit, get_transport_metrics
from backend.models.models import Place, Destination

def parse_time_str(time_str: str) -> Tuple[int, int]:
    """Parse 'HH:MM' string to (hour, minute)"""
    try:
        parts = time_str.split(":")
        return int(parts[0]), int(parts[1])
    except Exception:
        return 8, 0

def format_time_ampm(dt: datetime) -> str:
    """Format datetime to '08:30 AM'"""
    return dt.strftime("%I:%M %p")

def time_to_minutes(time_str: str) -> int:
    h, m = parse_time_str(time_str)
    return h * 60 + m

def generate_smart_itinerary(
    destination: Destination,
    places: List[Place],
    duration_days: int = 1,
    starting_point: str = "Hotel",
    start_time_str: str = "08:00",
    end_time_str: str = "20:00",
    transport_mode: str = "Car",
    allocated_budget: float = 3000.0,
    start_lat: float = None,
    start_lng: float = None
) -> Dict[str, Any]:
    """
    Intelligently schedule places into a day-by-day roadmap:
    - Nearest neighbor routing to minimize travel time
    - Enforces attraction opening and closing hours
    - Schedules lunch break around 12:30 PM - 1:30 PM
    - Generates multi-day split if duration_days > 1 or too many places
    - Provides real budget estimation and cost status
    - Provides warnings and suggestions
    """
    warnings = []
    smart_suggestions = []

    if not places:
        return {
            "destination_name": destination.name,
            "duration_days": duration_days,
            "days": [],
            "budget_breakdown": {
                "transportation": 0, "entry_tickets": 0, "food": 0,
                "activities": 0, "miscellaneous": 0, "estimated_total": 0,
                "allocated_budget": allocated_budget, "status": "Within Budget",
                "savings_tips": []
            },
            "warnings": ["No places selected. Please select at least one attraction to plan your trip."],
            "smart_suggestions": [],
            "route_coordinates": []
        }

    # Reference start coordinate
    base_lat = start_lat if start_lat else destination.latitude
    base_lng = start_lng if start_lng else destination.longitude

    # Calculate optimal days recommendation
    total_visit_hours = sum(p.duration_hours for p in places)
    estimated_transit_hours = len(places) * 0.5
    total_needed_hours = total_visit_hours + estimated_transit_hours
    daily_available_hours = (time_to_minutes(end_time_str) - time_to_minutes(start_time_str)) / 60.0
    recommended_days = max(1, math.ceil(total_needed_hours / max(daily_available_hours - 1.5, 4.0)))

    if len(places) > 5 and duration_days == 1:
        smart_suggestions.append(
            f"You selected {len(places)} places ({round(total_needed_hours, 1)} estimated hours). Visiting all of them in 1 day may be exhausting. Recommended plan: {recommended_days} Days."
        )

    # Cluster/partition places across days using geographic proximity
    places_to_visit = list(places)
    day_clusters: List[List[Place]] = [[] for _ in range(duration_days)]

    # Greedy Nearest-Neighbor partition
    current_lat, current_lng = base_lat, base_lng
    day_idx = 0
    max_per_day = math.ceil(len(places_to_visit) / duration_days)

    while places_to_visit:
        # Find closest place to current position
        best_place = None
        best_dist = float("inf")
        for p in places_to_visit:
            d = (p.latitude - current_lat)**2 + (p.longitude - current_lng)**2
            if d < best_dist:
                best_dist = d
                best_place = p
        
        places_to_visit.remove(best_place)
        day_clusters[day_idx].append(best_place)
        current_lat, current_lng = best_place.latitude, best_place.longitude

        if len(day_clusters[day_idx]) >= max_per_day and (day_idx + 1) < duration_days:
            day_idx += 1
            current_lat, current_lng = base_lat, base_lng

    # Now schedule each day chronologically
    days_result = []
    total_transport_cost = 0.0
    total_entry_fees = 0.0
    total_activity_cost = 0.0
    all_route_coords = []
    
    start_hour, start_minute = parse_time_str(start_time_str)
    end_hour, end_minute = parse_time_str(end_time_str)

    for d_idx, day_places in enumerate(day_clusters):
        day_num = d_idx + 1
        day_stops = []
        day_travel_time = 0
        day_distance = 0.0
        day_cost = 0.0

        current_dt = datetime(2026, 1, 1, start_hour, start_minute)
        day_end_dt = datetime(2026, 1, 1, end_hour, end_minute)
        prev_lat, prev_lng = base_lat, base_lng
        stop_counter = 1
        lunch_added = False

        # Add initial departure from starting point
        all_route_coords.append({
            "lat": base_lat,
            "lng": base_lng,
            "name": f"Start from {starting_point}",
            "stop_num": 0,
            "day": day_num,
            "category": "Start"
        })

        for p in day_places:
            # Check if lunch should be scheduled (between 12:30 PM and 1:45 PM)
            if not lunch_added and current_dt.hour >= 12 and current_dt.minute >= 15:
                lunch_start = current_dt
                lunch_end = current_dt + timedelta(minutes=60)
                day_stops.append({
                    "stop_number": stop_counter,
                    "place_id": None,
                    "name": "🍴 Local Food & Refreshment Break",
                    "category": "Food",
                    "arrival_time": format_time_ampm(lunch_start),
                    "departure_time": format_time_ampm(lunch_end),
                    "duration_minutes": 60,
                    "transit_time_minutes": 0,
                    "transit_distance_km": 0.0,
                    "estimated_entry_cost": 0.0,
                    "is_break": True,
                    "latitude": prev_lat,
                    "longitude": prev_lng,
                    "image_url": "https://images.unsplash.com/photo-1543353071-873f17a7a088?w=800&auto=format&fit=crop",
                    "is_hidden_gem": False,
                    "notes": "Enjoy authentic regional cuisine and recharge before afternoon exploration."
                })
                current_dt = lunch_end
                stop_counter += 1
                lunch_added = True

            # Calculate transit from previous location to this place
            transit_km, transit_mins, transit_cost = calculate_transit(
                prev_lat, prev_lng, p.latitude, p.longitude, transport_mode
            )
            day_travel_time += transit_mins
            day_distance += transit_km
            total_transport_cost += transit_cost

            # Arrival time
            arrival_dt = current_dt + timedelta(minutes=transit_mins)

            # Check operating hours
            open_h, open_m = parse_time_str(p.open_time)
            close_h, close_m = parse_time_str(p.close_time)
            place_open_dt = datetime(2026, 1, 1, open_h, open_m)
            place_close_dt = datetime(2026, 1, 1, close_h, close_m)

            timing_note = ""
            if arrival_dt < place_open_dt:
                wait_mins = int((place_open_dt - arrival_dt).total_seconds() / 60)
                arrival_dt = place_open_dt
                timing_note = f"Arriving before opening ({p.open_time}). Short {wait_mins}m wait."
            elif arrival_dt >= place_close_dt:
                warnings.append(
                    f"⚠️ {p.name} closes at {p.close_time}. Scheduled arrival around {format_time_ampm(arrival_dt)} is after closing. Consider visiting earlier or moving to another day."
                )
                timing_note = f"Notice: Place closes at {p.close_time}!"

            visit_mins = int(p.duration_hours * 60)
            departure_dt = arrival_dt + timedelta(minutes=visit_mins)

            if departure_dt > day_end_dt:
                warnings.append(
                    f"Day {day_num} extends past your target end time ({format_time_ampm(day_end_dt)}) while visiting {p.name}."
                )

            # Cost aggregation
            entry_cost = p.entry_fee
            total_entry_fees += entry_cost
            day_cost += entry_cost

            # Activity cost if relevant
            if "Rafting" in p.name or "Bungee" in p.name or "Safari" in p.name or "Camp" in p.name:
                total_activity_cost += 1200.0
                day_cost += 1200.0

            day_stops.append({
                "stop_number": stop_counter,
                "place_id": p.id,
                "name": p.name,
                "category": p.category,
                "arrival_time": format_time_ampm(arrival_dt),
                "departure_time": format_time_ampm(departure_dt),
                "duration_minutes": visit_mins,
                "transit_time_minutes": transit_mins,
                "transit_distance_km": round(transit_km, 1),
                "estimated_entry_cost": entry_cost,
                "is_break": False,
                "latitude": p.latitude,
                "longitude": p.longitude,
                "image_url": p.image_url,
                "is_hidden_gem": p.is_hidden_gem,
                "notes": timing_note if timing_note else f"Recommended visit: {p.duration_hours}h. {p.best_time_to_visit or ''}"
            })

            all_route_coords.append({
                "lat": p.latitude,
                "lng": p.longitude,
                "name": p.name,
                "stop_num": stop_counter,
                "day": day_num,
                "category": p.category,
                "is_hidden_gem": p.is_hidden_gem
            })

            current_dt = departure_dt
            prev_lat, prev_lng = p.latitude, p.longitude
            stop_counter += 1

        # Return to hotel/starting point
        return_km, return_mins, return_cost = calculate_transit(
            prev_lat, prev_lng, base_lat, base_lng, transport_mode
        )
        day_travel_time += return_mins
        day_distance += return_km
        total_transport_cost += return_cost

        return_dt = current_dt + timedelta(minutes=return_mins)
        day_stops.append({
            "stop_number": stop_counter,
            "place_id": None,
            "name": f"Return to {starting_point}",
            "category": "End",
            "arrival_time": format_time_ampm(return_dt),
            "departure_time": format_time_ampm(return_dt),
            "duration_minutes": 0,
            "transit_time_minutes": return_mins,
            "transit_distance_km": round(return_km, 1),
            "estimated_entry_cost": 0.0,
            "is_break": True,
            "latitude": base_lat,
            "longitude": base_lng,
            "image_url": None,
            "is_hidden_gem": False,
            "notes": "Rest and unwind after a great day of discovery."
        })

        days_result.append({
            "day": day_num,
            "date_label": f"Day {day_num} — {destination.name}",
            "stops": day_stops,
            "total_travel_time_minutes": day_travel_time,
            "total_distance_km": round(day_distance, 1),
            "estimated_daily_cost": round(day_cost, 2)
        })

    # Mode base transport factor
    transport_metrics = get_transport_metrics(transport_mode)
    base_vehicle_cost = transport_metrics["base_cost"] * duration_days
    final_transport = round(total_transport_cost + base_vehicle_cost, 2)

    # Food estimate: ~₹700 per person per day
    food_cost = round(700.0 * duration_days, 2)

    # Misc buffer: ~₹300 per day
    misc_cost = round(300.0 * duration_days, 2)

    estimated_total = round(final_transport + total_entry_fees + food_cost + total_activity_cost + misc_cost, 2)

    # Status evaluation
    savings_tips = []
    if estimated_total <= allocated_budget:
        budget_status = "Within Budget"
        smart_suggestions.append(f"Great! Your trip estimated total (₹{estimated_total:,.0f}) is comfortably within your ₹{allocated_budget:,.0f} budget.")
    elif estimated_total <= (allocated_budget * 1.18):
        budget_status = "Slightly Above Budget"
        savings_tips.append("Switch to 2-wheeler/scooter rental or shared public autos to save ₹400-800 on transit.")
        savings_tips.append("Consider packing lunch or dining at revered local street cafes (e.g. Chotiwala / German Bakery) to trim food expenses.")
    else:
        budget_status = "Over Budget"
        savings_tips.append("Switch from private cab to shared public transport or walking between close ghats.")
        savings_tips.append("Prioritize free scenic spots and public ghats over premium commercial adventure packages.")
        savings_tips.append("Spread visits across an additional day or decrease high-fee activities.")

    return {
        "destination_name": destination.name,
        "duration_days": duration_days,
        "days": days_result,
        "budget_breakdown": {
            "transportation": final_transport,
            "entry_tickets": round(total_entry_fees, 2),
            "food": food_cost,
            "activities": round(total_activity_cost, 2),
            "miscellaneous": misc_cost,
            "estimated_total": estimated_total,
            "allocated_budget": allocated_budget,
            "status": budget_status,
            "savings_tips": savings_tips
        },
        "warnings": warnings,
        "smart_suggestions": smart_suggestions,
        "route_coordinates": all_route_coords
    }
