/**
 * ChargeEase EV - Route Navigation & Polyline Simulator
 * Renders smooth path coordinates between vehicle location and destination station,
 * calculates traffic-aware ETA and projected arrival SoC, and displays an Uber-style HUD.
 */

class NavigationEngine {
  constructor() {
    this.activeRoute = null;
    this.routeLine = null;
    this.animMarker = null;
    this.navInterval = null;
  }

  /**
   * Generates realistic intermediate street-like waypoints between two points
   */
  generateWaypoints(startLat, startLng, endLat, endLng) {
    const steps = 6;
    const points = [[startLat, startLng]];

    // Create realistic slight road curvature / grid dog-legs
    for (let i = 1; i < steps; i++) {
      const ratio = i / steps;
      // Slight perpendicular jitter to simulate street grid
      const jitterLat = (Math.sin(ratio * Math.PI) * 0.003) * (i % 2 === 0 ? 1 : -1);
      const jitterLng = (Math.cos(ratio * Math.PI) * 0.002) * (i % 2 === 0 ? -1 : 1);
      
      const lat = startLat + (endLat - startLat) * ratio + jitterLat;
      const lng = startLng + (endLng - startLng) * ratio + jitterLng;
      points.push([lat, lng]);
    }

    points.push([endLat, endLng]);
    return points;
  }

  /**
   * Start simulated navigation to target station
   */
  startNavigation(station, userLocation, userVehicle, currentSoc, mapInstance) {
    soundEngine.click();
    this.stopNavigation(mapInstance);

    const [uLat, uLng] = userLocation;
    const waypoints = this.generateWaypoints(uLat, uLng, station.lat, station.lng);
    const distanceKm = calculateHaversineDistanceKm(uLat, uLng, station.lat, station.lng);
    
    // Calculate realistic traffic ETA: ~22 km/h average city speed in Indian metros
    const etaMinutes = Math.max(3, Math.round((distanceKm / 22) * 60));
    
    // Calculate energy required to reach destination
    const energyKwh = (distanceKm * userVehicle.consumptionWhPerKm) / 1000;
    const arrivalSoc = Math.max(1, Math.round(currentSoc - (energyKwh / userVehicle.batteryKwh) * 100));

    // Render animated route polyline
    this.routeLine = L.polyline(waypoints, {
      color: '#10B981',
      weight: 4,
      opacity: 0.9,
      lineCap: 'round',
      lineJoin: 'round',
      dashArray: '1, 10'
    }).addTo(mapInstance);

    // Zoom map to fit the route bounds
    mapInstance.fitBounds(this.routeLine.getBounds(), { padding: [60, 60], maxZoom: 15 });

    // Show Navigation HUD
    this.renderNavHud(station, distanceKm, etaMinutes, arrivalSoc, currentSoc);

    this.activeRoute = {
      station,
      waypoints,
      distanceKm,
      etaMinutes,
      arrivalSoc
    };

    soundEngine.success();
    return this.activeRoute;
  }

  renderNavHud(station, distanceKm, etaMinutes, arrivalSoc, currentSoc) {
    let hud = document.getElementById('navigation-hud');
    if (!hud) {
      hud = document.createElement('div');
      hud.id = 'navigation-hud';
      hud.className = 'navigation-hud';
      document.querySelector('.map-viewport-wrapper').appendChild(hud);
    }

    hud.innerHTML = `
      <div class="nav-hud-card">
        <div class="nav-hud-top">
          <div class="nav-turn-icon">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="3 11 22 2 13 21 11 13 3 11"></polygon></svg>
          </div>
          <div class="nav-direction-wrap">
            <div class="nav-instruction">Proceed towards ${station.name.split(' ')[0]} corridor</div>
            <div class="nav-station-sub">${station.name} • ${station.address.split(',')[0]}</div>
          </div>
          <button id="btn-close-nav" class="btn-icon" title="Exit Navigation">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div class="nav-hud-metrics">
          <div class="nav-metric">
            <span class="nav-metric-val">${etaMinutes} min</span>
            <span class="nav-metric-label">ETA</span>
          </div>
          <div class="nav-metric">
            <span class="nav-metric-val">${distanceKm} km</span>
            <span class="nav-metric-label">Distance</span>
          </div>
          <div class="nav-metric">
            <span class="nav-metric-val text-emerald">${arrivalSoc}%</span>
            <span class="nav-metric-label">Arrival SoC</span>
          </div>
          <div class="nav-metric">
            <span class="nav-metric-val text-emerald">Safe</span>
            <span class="nav-metric-label">Buffer Cushion</span>
          </div>
        </div>

        <div class="nav-hud-actions">
          <button id="btn-nav-arrived" class="btn btn-emerald" style="width: 100%;">
            Arrived at Node - Connect & Charge
          </button>
        </div>
      </div>
    `;

    hud.classList.remove('hidden');

    // Bind HUD events
    document.getElementById('btn-close-nav').addEventListener('click', () => {
      this.stopNavigation(window.chargeEaseApp ? mapEngine.map : null);
    });

    document.getElementById('btn-nav-arrived').addEventListener('click', () => {
      const targetStation = this.activeRoute.station;
      this.stopNavigation(window.chargeEaseApp ? mapEngine.map : null);
      window.chargeEaseApp.switchTab('scan');
      window.chargeEaseApp.executeHandshake(targetStation.id);
    });
  }

  stopNavigation(mapInstance) {
    if (this.routeLine && mapInstance) {
      mapInstance.removeLayer(this.routeLine);
      this.routeLine = null;
    }
    const hud = document.getElementById('navigation-hud');
    if (hud) hud.classList.add('hidden');
    this.activeRoute = null;
  }
}

const navigationEngine = new NavigationEngine();

