/**
 * Interactive Leaflet Map Module for Travel Explorer
 */
let currentMap = null;
let currentMarkers = [];
let currentPolyline = null;

const CATEGORY_ICONS = {
  'Adventure': '🏔️',
  'Water Activities': '🌊',
  'Nature': '🌲',
  'Spiritual': '🛕',
  'Scenic Views': '📸',
  'Camping': '🏕️',
  'Hiking': '🥾',
  'Food': '🍴',
  'Local Markets': '🛍️',
  'Hidden Gems': '💎',
  'Start': '🏨',
  'End': '🏁',
  'Default': '📍'
};

function getCategoryEmoji(cat, isHiddenGem) {
  if (isHiddenGem) return '💎';
  return CATEGORY_ICONS[cat] || '📍';
}

function createCustomIcon(cat, isHiddenGem, number = null) {
  const emoji = getCategoryEmoji(cat, isHiddenGem);
  const isNumbered = number !== null;
  
  const html = isNumbered
    ? `<div class="custom-map-marker numbered ${isHiddenGem ? 'gem' : ''}">
         <span class="num-badge">${number}</span>
         <span class="emoji-badge">${emoji}</span>
       </div>`
    : `<div class="custom-map-marker ${isHiddenGem ? 'gem' : ''}">
         <span class="emoji-badge">${emoji}</span>
       </div>`;

  return L.divIcon({
    className: 'custom-leaflet-pin',
    html: html,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    popupAnchor: [0, -20]
  });
}

const TravelMap = {
  init(elementId, center = [30.0869, 78.2676], zoom = 13) {
    const container = document.getElementById(elementId);
    if (!container) return null;

    if (currentMap) {
      currentMap.remove();
      currentMap = null;
    }

    // Initialize Leaflet
    currentMap = L.map(elementId, {
      center: center,
      zoom: zoom,
      zoomControl: true
    });

    // Elegant Dark CartoDB Tiles (fits our adventure dark glassmorphism design)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(currentMap);

    return currentMap;
  },

  clearMarkers() {
    if (currentMarkers && currentMarkers.length > 0) {
      currentMarkers.forEach(m => currentMap.removeLayer(m));
      currentMarkers = [];
    }
    if (currentPolyline) {
      currentMap.removeLayer(currentPolyline);
      currentPolyline = null;
    }
  },

  addPlaceMarkers(places, onPlaceSelect) {
    if (!currentMap || !places || places.length === 0) return;

    this.clearMarkers();
    const group = [];

    places.forEach(place => {
      const icon = createCustomIcon(place.category, place.is_hidden_gem);
      const marker = L.marker([place.latitude, place.longitude], { icon: icon });

      const popupContent = `
        <div class="map-popup-card">
          ${place.image_url ? `<img src="${place.image_url}" alt="${place.name}" class="map-popup-img" />` : ''}
          <div class="map-popup-body">
            <div class="map-popup-title">${place.name}</div>
            <div class="map-popup-meta">
              <span>${getCategoryEmoji(place.category, place.is_hidden_gem)} ${place.category}</span>
              <span>⭐ ${place.rating}</span>
            </div>
            <div class="map-popup-price">${place.entry_fee > 0 ? `₹${place.entry_fee}` : 'Free Entry'} • ${place.duration_hours}h</div>
            <button class="map-popup-btn" onclick="window.onMapAddPlaceClick(${place.id})">+ Add to Trip</button>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, { maxWidth: 260 });
      marker.addTo(currentMap);
      currentMarkers.push(marker);
      group.push([place.latitude, place.longitude]);
    });

    if (group.length > 0) {
      currentMap.fitBounds(group, { padding: [40, 40] });
    }
  },

  drawRoute(routeWaypoints) {
    if (!currentMap || !routeWaypoints || routeWaypoints.length < 2) return;

    this.clearMarkers();
    const latLngs = [];

    routeWaypoints.forEach((wp, index) => {
      latLngs.push([wp.lat, wp.lng]);
      const icon = createCustomIcon(wp.category || 'Default', wp.is_hidden_gem, wp.stop_num);
      const marker = L.marker([wp.lat, wp.lng], { icon: icon });

      marker.bindPopup(`
        <div class="map-popup-body">
          <strong>Stop ${wp.stop_num}: ${wp.name}</strong>
          <div>Day ${wp.day}</div>
        </div>
      `);
      marker.addTo(currentMap);
      currentMarkers.push(marker);
    });

    // Draw route polyline with glowing emerald gradient appearance
    currentPolyline = L.polyline(latLngs, {
      color: '#10b981',
      weight: 5,
      opacity: 0.85,
      dashArray: '8, 8',
      lineJoin: 'round'
    }).addTo(currentMap);

    currentMap.fitBounds(latLngs, { padding: [50, 50] });
  },

  flyTo(lat, lng, zoom = 14) {
    if (currentMap) {
      currentMap.flyTo([lat, lng], zoom, { duration: 1.2 });
    }
  }
};

// Global helper for map popup actions
window.onMapAddPlaceClick = function(placeId) {
  if (window.handlePlaceSelectionToggle) {
    window.handlePlaceSelectionToggle(placeId);
  }
};
