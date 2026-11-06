/**
 * ChargeEase EV - Leaflet Dark-Matter Map Engine
 * Custom SVG hardware pins, dynamic reachability perimeter overlays,
 * smooth city navigation, and station inspection triggers.
 */

class MapEngine {
  constructor() {
    this.map = null;
    this.markersGroup = null;
    this.userMarker = null;
    this.safeRangeCircle = null;
    this.grossRangeCircle = null;
    this.currentCity = 'Bengaluru';
    this.userLocation = CITIES.Bengaluru.defaultUserPos;
    this.onStationSelect = null;
  }

  init(containerId, onStationSelectCallback) {
    this.onStationSelect = onStationSelectCallback;
    const cityConfig = CITIES[this.currentCity];

    // Initialize Leaflet map
    this.map = L.map(containerId, {
      center: cityConfig.defaultUserPos,
      zoom: cityConfig.zoom,
      zoomControl: false,
      attributionControl: false
    });

    // ESRI World Dark Gray Canvas - Zero API key, Zero Watermarks, Clean Graphite Theme
    this.baseTileLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      maxNativeZoom: 16,
      attribution: 'Esri, DeLorme, NAVTEQ'
    }).addTo(this.map);

    // High-contrast clean road & neighborhood labels overlay
    this.labelTileLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      maxNativeZoom: 16
    }).addTo(this.map);

    // Zoom control in bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(this.map);

    this.markersGroup = L.layerGroup().addTo(this.map);
    this.renderUserMarker();
  }

  switchTileStyle(styleName = 'esri') {
    if (this.baseTileLayer) this.map.removeLayer(this.baseTileLayer);
    if (this.labelTileLayer) this.map.removeLayer(this.labelTileLayer);
    if (this.osmTileLayer) this.map.removeLayer(this.osmTileLayer);

    const mapEl = document.getElementById('map-container');

    if (styleName === 'osm') {
      if (mapEl) mapEl.classList.add('osm-dark-mode');
      this.osmTileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        subdomains: ['a', 'b', 'c'],
        attribution: '&copy; OpenStreetMap'
      }).addTo(this.map);
    } else {
      if (mapEl) mapEl.classList.remove('osm-dark-mode');
      this.baseTileLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        maxNativeZoom: 16
      }).addTo(this.map);

      this.labelTileLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        maxNativeZoom: 16
      }).addTo(this.map);
    }
  }

  setCity(cityName) {
    if (!CITIES[cityName]) return;
    this.currentCity = cityName;
    const city = CITIES[cityName];
    this.userLocation = city.defaultUserPos;
    this.map.flyTo(city.defaultUserPos, city.zoom, { duration: 1.2 });
    this.renderUserMarker();
  }

  renderUserMarker() {
    if (!this.map) return;

    if (this.userMarker) {
      this.userMarker.setLatLng(this.userLocation);
      return;
    }

    const userHtml = `
      <div class="user-position-marker">
        <div class="user-pulse-ring"></div>
        <div class="user-dot"></div>
      </div>
    `;

    const userIcon = L.divIcon({
      html: userHtml,
      className: 'custom-div-icon',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    this.userMarker = L.marker(this.userLocation, {
      icon: userIcon,
      zIndexOffset: 1000
    }).addTo(this.map);
  }

  /**
   * Updates stations pins on map with state-aware SVG pins
   */
  renderStations(stations) {
    if (!this.map || !this.markersGroup) return;
    this.markersGroup.clearLayers();

    stations.forEach(station => {
      let statusClass = 'available';
      let badgeHtml = '';

      if (station.status === 'IN_USE') {
        statusClass = 'in-use';
        badgeHtml = `<span class="marker-min">${station.inUseRemainingMinutes || 15}m</span>`;
      } else if (station.status === 'OFFLINE') {
        statusClass = 'offline';
      }

      const isFast = station.powerKw >= 22;

      const markerHtml = `
        <div class="station-map-pin ${statusClass}" data-station-id="${station.id}">
          <div class="pin-inner">
            ${isFast ? '<span class="fast-dot">' + ICONS.zap + '</span>' : ''}
            <span class="kw-label">${station.powerKw}kW</span>
          </div>
          ${badgeHtml}
        </div>
      `;

      const customIcon = L.divIcon({
        html: markerHtml,
        className: 'station-div-icon',
        iconSize: [44, 44],
        iconAnchor: [22, 22]
      });

      const marker = L.marker([station.lat, station.lng], { icon: customIcon });

      marker.on('click', () => {
        soundEngine.click();
        if (this.onStationSelect) {
          this.onStationSelect(station);
        }
      });

      this.markersGroup.addLayer(marker);
    });
  }

  /**
   * Visualizes the dynamic safe reachability perimeter
   */
  updateReachabilityOverlay(safeRadiusKm, grossRadiusKm) {
    if (!this.map) return;

    // Remove existing overlays
    if (this.safeRangeCircle) {
      this.map.removeLayer(this.safeRangeCircle);
    }
    if (this.grossRangeCircle) {
      this.map.removeLayer(this.grossRangeCircle);
    }

    if (!safeRadiusKm || safeRadiusKm <= 0) return;

    // Outer Gross range circle (Warning boundary)
    if (grossRadiusKm > safeRadiusKm) {
      this.grossRangeCircle = L.circle(this.userLocation, {
        radius: grossRadiusKm * 1000,
        color: '#F59E0B',
        weight: 1.5,
        dashArray: '5, 8',
        fillColor: '#F59E0B',
        fillOpacity: 0.04
      }).addTo(this.map);
    }

    // Inner Safe range circle (Safe boundary with 20% buffer preserved)
    this.safeRangeCircle = L.circle(this.userLocation, {
      radius: safeRadiusKm * 1000,
      color: '#10B981',
      weight: 1.8,
      fillColor: '#10B981',
      fillOpacity: 0.08
    }).addTo(this.map);
  }

  flyToStation(station) {
    if (!this.map || !station) return;
    this.map.flyTo([station.lat, station.lng], 15, { duration: 1.0 });
  }

  recenterUser() {
    if (!this.map) return;
    this.map.flyTo(this.userLocation, 14, { duration: 0.8 });
  }

  /**
   * Fetch Live GPS Location via Leaflet / Browser Geolocation
   */
  detectLiveLocation(onSuccess, onError) {
    if (!navigator.geolocation) {
      if (onError) onError('Geolocation is not supported by your browser environment.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const accuracy = Math.round(position.coords.accuracy || 20);

        this.userLocation = [lat, lng];
        this.renderUserMarker();

        // Accuracy Circle
        if (this.accuracyCircle) {
          this.map.removeLayer(this.accuracyCircle);
        }
        this.accuracyCircle = L.circle([lat, lng], {
          radius: Math.min(accuracy, 150),
          color: '#3B82F6',
          weight: 1,
          fillColor: '#3B82F6',
          fillOpacity: 0.1
        }).addTo(this.map);

        this.map.flyTo([lat, lng], 14, { duration: 1.2 });
        if (onSuccess) onSuccess([lat, lng], accuracy);
      },
      (error) => {
        console.warn('Geolocation access failed or denied:', error.message);
        if (onError) onError(error.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000
      }
    );
  }
}

const mapEngine = new MapEngine();
