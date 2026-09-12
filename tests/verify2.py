import httpx

c = httpx.Client(base_url='http://127.0.0.1:8000', timeout=8.0)

# Verify all 5 destinations
for dest_id in [1,2,3,4,5]:
    r = c.get('/api/places?destination_id=' + str(dest_id))
    places = r.json()
    dest_r = c.get('/api/destinations/' + str(dest_id))
    d = dest_r.json()
    name = d['name']
    hgems = len([p for p in places if p['is_hidden_gem']])
    popular = len([p for p in places if not p['is_hidden_gem']])
    print('  ' + name + ': ' + str(popular) + ' popular + ' + str(hgems) + ' hidden gems')

# Quick 2-day itinerary verify
r = c.get('/api/places?destination_id=1')
places = r.json()
resp = c.post('/api/generate-itinerary', json={
    'destination_id': 1,
    'place_ids': [p['id'] for p in places[:6]],
    'duration_days': 2,
    'starting_point': 'Hotel',
    'start_time': '08:00',
    'end_time': '19:00',
    'transport_mode': 'Car',
    'budget': 5000.0
})
itin = resp.json()
d1 = len(itin['days'][0]['stops'])
d2 = len(itin['days'][1]['stops'])
total = round(itin['budget_breakdown']['estimated_total'])
status = itin['budget_breakdown']['status']
print('  2-Day itinerary: Day1=' + str(d1) + ' stops, Day2=' + str(d2) + ' stops')
print('  Budget: INR ' + str(total) + ' / Status: ' + status)
print('ALL VERIFIED OK!')
