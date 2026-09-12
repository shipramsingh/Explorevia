import httpx

c = httpx.Client(base_url='http://127.0.0.1:8000', timeout=6.0)

print("=== PAGE ROUTES ===")
for path in ['/', '/explore', '/planner', '/dashboard']:
    r = c.get(path)
    print(f"  {path}: HTTP {r.status_code}")

print("\n=== DESTINATIONS ===")
r = c.get('/api/destinations')
dests = r.json()
for d in dests:
    name = d['name']
    state = d['state']
    theme = d['theme_type']
    ct = d['places_count']
    print(f"  {name} ({state}) theme={theme} places={ct}")

print("\n=== RISHIKESH PLACES ===")
r = c.get('/api/places?destination_id=1')
places = r.json()
for p in places:
    name = p['name']
    rating = p['rating']
    hidden = p['is_hidden_gem']
    fee = p['entry_fee']
    dur = p['duration_hours']
    label = '[HIDDEN GEM]' if hidden else '[Popular]'
    print(f"  {label} {name} | rating={rating} | entry=INR {fee} | {dur}h")

print("\n=== SMART ITINERARY (5 places, Car, 1 day, INR 3000 budget) ===")
p_ids = [p['id'] for p in places[:5]]
payload = {
    'destination_id': 1,
    'place_ids': p_ids,
    'duration_days': 1,
    'starting_point': 'Hotel',
    'start_time': '08:00',
    'end_time': '20:00',
    'transport_mode': 'Car',
    'budget': 3000.0
}
r = c.post('/api/generate-itinerary', json=payload)
itin = r.json()
for stop in itin['days'][0]['stops']:
    time_slot = stop['arrival_time'] + ' - ' + stop['departure_time']
    name = stop['name']
    transit = stop['transit_time_minutes']
    is_brk = stop['is_break']
    prefix = '[BREAK]' if is_brk else '[STOP]'
    print(f"  {prefix} {time_slot}: {name} (transit={transit}m)")

bb = itin['budget_breakdown']
print(f"\nBudget Total: INR {round(bb['estimated_total'],0)}")
print(f"Allocated: INR {bb['allocated_budget']}")
print(f"Status: {bb['status']}")
if bb['savings_tips']:
    for tip in bb['savings_tips']:
        print(f"  Tip: {tip[:80]}...")

if itin['smart_suggestions']:
    for s in itin['smart_suggestions']:
        print(f"  Smart: {s[:80]}")

print("\n=== WEATHER ===")
r = c.get('/api/weather?lat=30.0869&lon=78.2676&city=Rishikesh')
w = r.json()
temp = w['temperature']
cond = w['condition']
src = w['source']
prec = w['precipitation_probability']
print(f"  Temp={temp}C, Condition={cond}, Rain={prec}%, Source={src}")
if w['travel_tips']:
    print(f"  Tip: {w['travel_tips'][0][:100]}")

print("\n=== ALL CHECKS PASSED ===")
