import httpx
import json

def run_tests():
    c = httpx.Client(base_url='http://127.0.0.1:8000', timeout=6.0)

    print("Checking root page...")
    r0 = c.get('/')
    assert r0.status_code == 200, f"Root failed: {r0.status_code}"
    print("Root page served successfully!")

    # 1. Search location
    print("Testing /api/search-location...")
    r1 = c.get('/api/search-location?q=Rishikesh')
    assert r1.status_code == 200, f"Search failed: {r1.text}"
    dest = r1.json()['results'][0]
    print(f"Destination found: {dest['name']} ({dest['state']}) Theme: {dest['theme_type']}")

    # 2. Get Places
    print("Testing /api/places...")
    r2 = c.get(f"/api/places?destination_id={dest['id']}")
    assert r2.status_code == 200, f"Places failed: {r2.text}"
    places = r2.json()
    print(f"Attractions found: {len(places)}")
    assert len(places) >= 5

    # 3. Generate Itinerary
    print("Testing /api/generate-itinerary...")
    selected_ids = [p['id'] for p in places[:5]]
    payload = {
        'destination_id': dest['id'],
        'place_ids': selected_ids,
        'duration_days': 1,
        'starting_point': 'Hotel',
        'start_time': '08:00',
        'end_time': '20:00',
        'transport_mode': 'Car',
        'budget': 3000.0
    }
    r3 = c.post('/api/generate-itinerary', json=payload)
    assert r3.status_code == 200, f"Itinerary failed: {r3.text}"
    itin = r3.json()
    print(f"Roadmap generated! Days: {len(itin['days'])}, Day 1 Stops: {len(itin['days'][0]['stops'])}")
    print(f"Budget Breakdown: Total = INR {itin['budget_breakdown']['estimated_total']}, Status = {itin['budget_breakdown']['status']}")

    # 4. Weather API
    print("Testing /api/weather...")
    r4 = c.get(f"/api/weather?lat={dest['latitude']}&lon={dest['longitude']}&city=Rishikesh")
    assert r4.status_code == 200, f"Weather failed: {r4.text}"
    w = r4.json()
    print(f"Weather: {w['temperature']}°C, {w['condition']} ({w['source']})")

    # 5. Trips CRUD
    print("Testing /api/trips save...")
    trip_payload = {
        'title': 'Rishikesh 1 Day Quick Exploration',
        'destination_id': dest['id'],
        'duration_days': 1,
        'starting_point': 'Hotel',
        'transport_mode': 'Car',
        'budget_allocated': 3000.0,
        'budget_estimated': itin['budget_breakdown']['estimated_total'],
        'itinerary_data': itin,
        'user_id': 1
    }
    r5 = c.post('/api/trips', json=trip_payload)
    assert r5.status_code == 200, f"Trip save failed: {r5.text}"
    saved_trip = r5.json()
    print(f"Saved Trip ID: {saved_trip['id']}, Title: {saved_trip['title']}")

    # 6. Favorites
    print("Testing /api/favorites/toggle...")
    r6 = c.post('/api/favorites/toggle', json={'place_id': places[0]['id'], 'user_id': 1})
    assert r6.status_code == 200
    print(f"Favorites Toggle Result: {r6.json()['message']}")

    print("\n[SUCCESS] ALL BACKEND TESTS PASSED WITH 100% SUCCESS!")

if __name__ == '__main__':
    run_tests()
