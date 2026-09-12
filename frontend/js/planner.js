/**
 * Smart Itinerary & Roadmap Planner Controller
 */
let currentItinerary = null;
let activeDayIndex = 0;

const PlannerController = {
  async init() {
    this.setupEventListeners();
    await this.loadSelectedPlacesAndGenerate();
  },

  setupEventListeners() {
    const generateBtn = document.getElementById('generateItineraryBtn');
    if (generateBtn) {
      generateBtn.addEventListener('click', () => this.generateItinerary());
    }

    const saveTripBtn = document.getElementById('saveTripBtn');
    if (saveTripBtn) {
      saveTripBtn.addEventListener('click', () => this.saveTripToAccount());
    }
  },

  async loadSelectedPlacesAndGenerate() {
    const selected = App.getSelectedPlaces();
    const destination = JSON.parse(localStorage.getItem('active_destination') || 'null');

    const destTitle = document.getElementById('plannerDestTitle');
    if (destTitle && destination) {
      destTitle.textContent = `${destination.name} Smart Roadmap`;
      App.setTheme(destination.theme_type);
    }

    // Set place count preview badge
    const countBadge = document.getElementById('selectedPlacesCountBadge');
    if (countBadge) {
      countBadge.textContent = `${selected.length} Places Selected`;
    }

    // Initialize Map
    const mapCenter = destination ? [destination.latitude, destination.longitude] : [30.0869, 78.2676];
    TravelMap.init('routeMap', mapCenter, 13);

    // If places are selected, automatically generate initial roadmap
    if (selected.length > 0 && destination) {
      await this.generateItinerary();
    } else {
      this.renderEmptyState();
    }
  },

  async generateItinerary() {
    const selected = App.getSelectedPlaces();
    const destination = JSON.parse(localStorage.getItem('active_destination') || 'null');

    if (!destination || selected.length === 0) {
      this.renderEmptyState();
      return;
    }

    const durationDays = parseInt(document.getElementById('planDuration')?.value || '1');
    const startingPoint = document.getElementById('planStartPoint')?.value || 'Hotel';
    const transportMode = document.getElementById('planTransport')?.value || 'Car';
    const startTime = document.getElementById('planStartTime')?.value || '08:00';
    const endTime = document.getElementById('planEndTime')?.value || '20:00';
    const budget = parseFloat(document.getElementById('planBudget')?.value || '3000');

    const payload = {
      destination_id: destination.id,
      place_ids: selected.map(p => p.id),
      duration_days: durationDays,
      starting_point: startingPoint,
      start_time: startTime,
      end_time: endTime,
      transport_mode: transportMode,
      budget: budget
    };

    try {
      App.toast('Calculating optimal roadmap & transit timings...', 'info');
      const response = await API.generateItinerary(payload);
      currentItinerary = response;
      activeDayIndex = 0;

      this.renderItineraryResult(response);
      App.toast('Smart roadmap generated successfully!', 'success');
    } catch (e) {
      console.error(e);
      App.toast('Failed to generate roadmap: ' + e.message, 'warning');
    }
  },

  renderItineraryResult(data) {
    // Render warnings & smart suggestions
    this.renderAlertsAndSuggestions(data);

    // Render day selection tabs
    this.renderDayTabs(data.days);

    // Render timeline for active day
    this.renderTimelineDay(activeDayIndex);

    // Render budget breakdown
    this.renderBudgetCard(data.budget_breakdown);

    // Render Route on Map
    if (data.route_coordinates && data.route_coordinates.length > 0) {
      TravelMap.drawRoute(data.route_coordinates);
    }
  },

  renderAlertsAndSuggestions(data) {
    const suggestContainer = document.getElementById('plannerSuggestions');
    const warningsContainer = document.getElementById('plannerWarnings');

    if (suggestContainer) {
      if (data.smart_suggestions && data.smart_suggestions.length > 0) {
        suggestContainer.innerHTML = data.smart_suggestions.map(s => `
          <div class="suggestion-item-msg">
            <span style="font-size: 1.1rem;">💡</span>
            <span><strong>Smart Recommendation:</strong> ${s}</span>
          </div>
        `).join('');
        suggestContainer.style.display = 'flex';
      } else {
        suggestContainer.style.display = 'none';
      }
    }

    if (warningsContainer) {
      if (data.warnings && data.warnings.length > 0) {
        warningsContainer.innerHTML = data.warnings.map(w => `
          <div class="warning-item-msg">
            <span style="font-size: 1rem;">⚠️</span>
            <span>${w}</span>
          </div>
        `).join('');
        warningsContainer.style.display = 'flex';
      } else {
        warningsContainer.style.display = 'none';
      }
    }
  },

  renderDayTabs(days) {
    const container = document.getElementById('daySelectorTabs');
    if (!container) return;

    if (days.length <= 1) {
      container.innerHTML = `<button class="day-tab-btn active">Day 1 Overview</button>`;
      return;
    }

    container.innerHTML = days.map((day, idx) => `
      <button class="day-tab-btn ${idx === activeDayIndex ? 'active' : ''}" onclick="PlannerController.switchDay(${idx})">
        Day ${day.day} (${day.stops.filter(s => !s.is_break).length} stops)
      </button>
    `).join('');
  },

  switchDay(dayIdx) {
    activeDayIndex = dayIdx;
    document.querySelectorAll('.day-tab-btn').forEach((btn, idx) => {
      if (idx === dayIdx) btn.classList.add('active');
      else btn.classList.remove('active');
    });
    this.renderTimelineDay(dayIdx);
  },

  renderTimelineDay(dayIdx) {
    const timelineEl = document.getElementById('itineraryTimeline');
    if (!timelineEl || !currentItinerary || !currentItinerary.days[dayIdx]) return;

    const day = currentItinerary.days[dayIdx];
    
    let html = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 18px;">
        <h3 style="font-family: var(--font-heading); color: #ffffff; font-size: 1.3rem;">
          ${day.date_label}
        </h3>
        <div style="font-size: 0.85rem; color: var(--text-secondary);">
          🚗 ${day.total_distance_km} km total • ⏱ ~${day.total_travel_time_minutes} mins travel
        </div>
      </div>
    `;

    day.stops.forEach((stop, idx) => {
      // Transit connector before this stop if not first stop
      if (stop.transit_time_minutes > 0) {
        html += `
          <div class="timeline-transit-banner">
            <span>↓</span>
            <span>Transit: <strong>${stop.transit_time_minutes} mins</strong> (${stop.transit_distance_km} km)</span>
          </div>
        `;
      }

      html += `
        <div class="timeline-step">
          <div class="timeline-marker ${stop.is_break ? 'break' : ''}">
            ${stop.is_break ? '🍴' : stop.stop_number}
          </div>

          <div class="timeline-card">
            <div class="timeline-time-row">
              <span class="timeline-slot">${stop.arrival_time} – ${stop.departure_time}</span>
              <span class="badge-category">${stop.category}</span>
            </div>

            <div class="timeline-step-name">${stop.name}</div>
            
            ${stop.notes ? `<div class="timeline-step-notes">${stop.notes}</div>` : ''}

            ${stop.estimated_entry_cost > 0 ? `
              <div style="margin-top: 8px; font-size: 0.82rem; color: var(--accent-hover); font-weight: 600;">
                🎟 Estimated Entry: ₹${stop.estimated_entry_cost}
              </div>
            ` : ''}
          </div>
        </div>
      `;
    });

    timelineEl.innerHTML = html;
  },

  renderBudgetCard(budget) {
    const statusPill = document.getElementById('budgetStatusBadge');
    const tableBody = document.getElementById('budgetTableBody');
    const savingsTipsBox = document.getElementById('budgetSavingsTips');

    if (statusPill) {
      let statusClass = 'within';
      let icon = '🟢';
      if (budget.status === 'Slightly Above Budget') {
        statusClass = 'slightly-above';
        icon = '🟡';
      } else if (budget.status === 'Over Budget') {
        statusClass = 'over';
        icon = '🔴';
      }
      statusPill.className = `budget-status-pill ${statusClass}`;
      statusPill.innerHTML = `${icon} ${budget.status}`;
    }

    if (tableBody) {
      tableBody.innerHTML = `
        <tr>
          <td>Transportation (${document.getElementById('planTransport')?.value || 'Transit'})</td>
          <td>₹${budget.transportation.toLocaleString()}</td>
        </tr>
        <tr>
          <td>Entry Tickets & Passes</td>
          <td>₹${budget.entry_tickets.toLocaleString()}</td>
        </tr>
        <tr>
          <td>Food & Refreshments</td>
          <td>₹${budget.food.toLocaleString()}</td>
        </tr>
        <tr>
          <td>Activities & Adventures</td>
          <td>₹${budget.activities.toLocaleString()}</td>
        </tr>
        <tr>
          <td>Buffer & Miscellaneous</td>
          <td>₹${budget.miscellaneous.toLocaleString()}</td>
        </tr>
        <tr class="budget-total-row">
          <td>Estimated Total</td>
          <td>₹${budget.estimated_total.toLocaleString()}</td>
        </tr>
      `;
    }

    if (savingsTipsBox) {
      if (budget.savings_tips && budget.savings_tips.length > 0) {
        savingsTipsBox.innerHTML = `
          <strong>Cost Optimization Suggestions:</strong>
          <ul style="padding-left: 18px; margin-top: 4px; display: flex; flex-direction: column; gap: 4px;">
            ${budget.savings_tips.map(tip => `<li>${tip}</li>`).join('')}
          </ul>
        `;
        savingsTipsBox.style.display = 'block';
      } else {
        savingsTipsBox.style.display = 'none';
      }
    }
  },

  async saveTripToAccount() {
    if (!currentItinerary) {
      App.toast('No generated itinerary to save', 'warning');
      return;
    }

    const destination = JSON.parse(localStorage.getItem('active_destination') || '{}');
    const title = `${destination.name || 'Trip'} — ${currentItinerary.duration_days} Day Exploration`;

    const payload = {
      title: title,
      destination_id: destination.id || 1,
      duration_days: currentItinerary.duration_days,
      starting_point: document.getElementById('planStartPoint')?.value || 'Hotel',
      transport_mode: document.getElementById('planTransport')?.value || 'Car',
      budget_allocated: currentItinerary.budget_breakdown.allocated_budget,
      budget_estimated: currentItinerary.budget_breakdown.estimated_total,
      itinerary_data: currentItinerary,
      user_id: App.currentUser?.id || 1
    };

    try {
      const res = await API.saveTrip(payload);
      App.toast('Itinerary saved to My Trips!', 'success');
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1000);
    } catch (e) {
      App.toast('Failed to save trip: ' + e.message, 'warning');
    }
  },

  renderEmptyState() {
    const timelineEl = document.getElementById('itineraryTimeline');
    if (timelineEl) {
      timelineEl.innerHTML = `
        <div style="text-align: center; padding: 60px 20px; background: var(--bg-card); border-radius: var(--radius-lg); border: 1px dashed var(--border-glass);">
          <div style="font-size: 2.8rem; margin-bottom: 12px;">🗺️</div>
          <h3 style="font-family: var(--font-heading); font-size: 1.4rem;">No Places Selected Yet</h3>
          <p style="color: var(--text-secondary); max-width: 480px; margin: 8px auto 20px;">
            Return to the explore page, select attractions in your destination, and click "Plan My Trip" to let our smart engine build your day-by-day roadmap.
          </p>
          <a href="/explore" class="btn btn-primary">
            Explore Attractions Now
          </a>
        </div>
      `;
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('itineraryTimeline')) {
    PlannerController.init();
  }
});
