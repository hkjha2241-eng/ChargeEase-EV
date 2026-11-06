/**
 * ChargeEase EV - Master Application Controller
 * High-performance, zero-vibe-code architecture.
 * Clean modular event orchestration, dual mode management, and state reactivity.
 */

class ChargeEaseApp {
  constructor() {
    this.currentMode = 'DRIVER'; // 'DRIVER' | 'HOST'
    this.currentTab = 'explore'; // 'explore', 'range', 'scan', 'telemetry', 'reservations', 'wallet', 'garage'
    this.stations = [...SEED_STATIONS];
    this.filteredStations = [...SEED_STATIONS];
    this.selectedStation = null;
    this.activeFilter = 'ALL';
    this.searchQuery = '';
    this.userVehicle = VEHICLE_DATABASE[3]; // Tata Nexon EV
    this.userSoc = 42;
  }

  async init() {
    // 1. Fetch live stations from server or fallback to seed
    await this.fetchStations();

    // 2. Initialize Leaflet Map
    mapEngine.init('map-container', (station) => {
      this.openStationDrawer(station);
    });

    // 3. Render Stations on Map & Sidebar
    this.applyFilters();

    // 4. Bind Reachability Engine
    reachabilityEngine.setVehicle(this.userVehicle.id);
    reachabilityEngine.setSoc(this.userSoc);
    this.updateReachabilityUI();

    // 5. Setup Listeners for Telemetry, Wallet, Reservations, and Host
    this.setupSubscribers();

    // 6. Bind UI Event Listeners
    this.bindDomEvents();

    console.log('ChargeEase EV Core Engine initialized.');
  }

  async fetchStations() {
    try {
      const res = await fetch('/api/stations');
      if (res.ok) {
        const data = await res.json();
        if (data.stations && data.stations.length > 0) {
          this.stations = data.stations;
        }
      }
    } catch (e) {
      // Offline fallback using SEED_STATIONS
      this.stations = [...SEED_STATIONS];
    }
  }

  setupSubscribers() {
    // Telemetry updates
    telemetryEngine.onUpdate((session) => {
      this.renderTelemetryUI(session);
      this.updateActiveSessionPill(session);
    });

    // Wallet updates
    walletEngine.onUpdate((balance, txns) => {
      this.renderWalletUI(balance, txns);
    });

    // Reservation updates
    reservationEngine.onUpdate((activeLock, list) => {
      this.renderReservationsUI(activeLock, list);
    });

    // Host updates
    hostEngine.onUpdate((hostData) => {
      this.renderHostUI(hostData);
    });
  }

  // Dual Mode Switcher: Driver <-> Host
  setMode(mode) {
    if (this.currentMode === mode) return;
    soundEngine.click();
    this.currentMode = mode;

    const driverContainer = document.getElementById('driver-workspace');
    const hostContainer = document.getElementById('host-workspace');
    const modePillDriver = document.getElementById('btn-mode-driver');
    const modePillHost = document.getElementById('btn-mode-host');

    if (mode === 'HOST') {
      driverContainer.classList.add('hidden');
      hostContainer.classList.remove('hidden');
      modePillHost.classList.add('active');
      modePillDriver.classList.remove('active');
      this.renderHostUI(hostEngine.hostData);
    } else {
      hostContainer.classList.add('hidden');
      driverContainer.classList.remove('hidden');
      modePillDriver.classList.add('active');
      modePillHost.classList.remove('active');
      setTimeout(() => mapEngine.map?.invalidateSize(), 150);
    }
  }

  // Switch Driver Views
  switchTab(tabId) {
    soundEngine.click();
    this.currentTab = tabId;

    // Update Tab navigation buttons
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });

    // Switch view containers
    const views = ['view-explore', 'view-range', 'view-scan', 'view-telemetry', 'view-reservations', 'view-wallet', 'view-garage'];
    views.forEach(v => {
      const el = document.getElementById(v);
      if (el) el.classList.add('hidden');
    });

    const activeView = document.getElementById(`view-${tabId}`);
    if (activeView) activeView.classList.remove('hidden');

    // Tab specific lifecycle triggers
    if (tabId === 'explore') {
      setTimeout(() => mapEngine.map?.invalidateSize(), 100);
    } else if (tabId === 'range') {
      this.updateReachabilityUI();
    } else if (tabId === 'scan') {
      this.initScanView();
    }
  }

  // Filters & Search
  applyFilters() {
    let result = [...this.stations];

    // City filter
    result = result.filter(s => s.city === mapEngine.currentCity);

    // Chip filter
    if (this.activeFilter === '2W') {
      result = result.filter(s => s.vehicleTypes.includes('2W') || s.vehicleTypes.includes('3W'));
    } else if (this.activeFilter === 'FAST') {
      result = result.filter(s => s.powerKw >= 22 || s.type.includes('CCS'));
    } else if (this.activeFilter === 'VERIFIED') {
      result = result.filter(s => s.isVerified);
    } else if (this.activeFilter === 'AVAILABLE') {
      result = result.filter(s => s.status === 'AVAILABLE');
    }

    // Search query
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.address.toLowerCase().includes(q) ||
        s.type.toLowerCase().includes(q)
      );
    }

    this.filteredStations = result;
    mapEngine.renderStations(this.filteredStations);
    this.renderStationsList(this.filteredStations);
  }

  renderStationsList(stations) {
    const container = document.getElementById('station-cards-container');
    if (!container) return;

    if (stations.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">${ICONS.search}</div>
          <p class="empty-title">No charging nodes found</p>
          <p class="empty-desc">Try clearing your filters or switching city.</p>
        </div>
      `;
      return;
    }

    const [uLat, uLng] = mapEngine.userLocation;

    container.innerHTML = stations.map(s => {
      const dist = calculateHaversineDistanceKm(uLat, uLng, s.lat, s.lng);
      const isFast = s.powerKw >= 22;
      const fairPricing = evaluateFairPricing(s.tariffPerKwh, s.type);
      
      let statusBadge = `<span class="badge badge-emerald">Available</span>`;
      if (s.status === 'IN_USE') {
        statusBadge = `<span class="badge badge-amber">In Use (${s.inUseRemainingMinutes || 15}m)</span>`;
      } else if (s.status === 'OFFLINE') {
        statusBadge = `<span class="badge badge-muted">Host Offline</span>`;
      }

      return `
        <div class="station-card" data-station-id="${s.id}">
          <div class="station-card-top">
            <div class="station-title-wrap">
              <h4 class="station-name">${s.name}</h4>
              <p class="station-address">${s.address}</p>
            </div>
            ${statusBadge}
          </div>
          <div class="station-card-specs">
            <span class="spec-pill">${isFast ? ICONS.zap : ICONS.battery} ${s.powerKw} kW</span>
            <span class="spec-pill">${s.type.split(' ')[0]} ${s.type.includes('CCS') ? 'CCS2' : 'Socket'}</span>
            <span class="spec-pill">${dist} km</span>
            <span class="badge ${fairPricing.badgeClass}" style="font-size:10px;">${fairPricing.badgeLabel}</span>
          </div>
          <div class="station-card-footer">
            <div class="tariff-tag">
              <span class="tariff-val">${formatCurrency(s.tariffPerKwh)}</span>
              <span class="tariff-unit">/ kWh</span>
            </div>
            <button class="btn btn-sm btn-subtle btn-inspect" data-station-id="${s.id}">
              Details ${ICONS.chevronRight}
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Attach card clicks
    container.querySelectorAll('.station-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.btn-inspect')) return;
        const sId = card.dataset.stationId;
        const station = this.stations.find(s => s.id === sId);
        if (station) {
          mapEngine.flyToStation(station);
          this.openStationDrawer(station);
        }
      });
    });

    container.querySelectorAll('.btn-inspect').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const sId = btn.dataset.stationId;
        const station = this.stations.find(s => s.id === sId);
        if (station) {
          mapEngine.flyToStation(station);
          this.openStationDrawer(station);
        }
      });
    });
  }

  openStationDrawer(station) {
    this.selectedStation = station;
    const drawer = document.getElementById('station-drawer');
    if (!drawer) return;

    const [uLat, uLng] = mapEngine.userLocation;
    const dist = calculateHaversineDistanceKm(uLat, uLng, station.lat, station.lng);

    document.getElementById('drawer-station-name').textContent = station.name;
    document.getElementById('drawer-station-address').textContent = station.address;
    document.getElementById('drawer-host-name').textContent = station.hostName;
    document.getElementById('drawer-verified-badge').classList.toggle('hidden', !station.isVerified);
    document.getElementById('drawer-rating').textContent = `${station.rating} (${station.totalSessions} sessions)`;
    document.getElementById('drawer-power').textContent = `${station.powerKw} kW (${station.voltage}V / ${station.currentA}A)`;
    document.getElementById('drawer-type').textContent = station.type;
    document.getElementById('drawer-tariff').textContent = `${formatCurrency(station.tariffPerKwh)} / kWh`;
    document.getElementById('drawer-parking').textContent = station.parkingFee > 0 ? `${formatCurrency(station.parkingFee)} / hr` : 'Free Parking';
    document.getElementById('drawer-access').textContent = station.accessHours;
    document.getElementById('drawer-distance').textContent = `${dist} km away`;

    // Amenities
    const amenitiesContainer = document.getElementById('drawer-amenities');
    amenitiesContainer.innerHTML = station.amenities.map(a => `
      <span class="amenity-chip">${ICONS.checkCircle} ${a}</span>
    `).join('');

    // Slot picker
    const slotContainer = document.getElementById('drawer-slots');
    if (station.availableSlots && station.availableSlots.length > 0) {
      slotContainer.innerHTML = station.availableSlots.map((slot, idx) => `
        <button class="slot-chip ${idx === 0 ? 'selected' : ''}" data-slot="${slot}">${slot}</button>
      `).join('');

      slotContainer.querySelectorAll('.slot-chip').forEach(btn => {
        btn.addEventListener('click', () => {
          slotContainer.querySelectorAll('.slot-chip').forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
        });
      });
    } else {
      slotContainer.innerHTML = `<span class="text-muted text-sm">No reservations available today.</span>`;
    }

    // Fair Pricing Evaluation
    const fairPricing = evaluateFairPricing(station.tariffPerKwh, station.type);
    const badgeEl = document.getElementById('drawer-fair-pricing-badge');
    const descEl = document.getElementById('drawer-fair-pricing-desc');
    if (badgeEl && descEl) {
      badgeEl.className = `badge ${fairPricing.badgeClass}`;
      badgeEl.textContent = fairPricing.badgeLabel;
      descEl.textContent = `Regulated rate for ${station.type}. Estimated EV running cost: ~₹${fairPricing.evCarCostPerKm}/km (${fairPricing.fuelSavingsPct}% savings vs petrol @ ₹102/L).`;
    }

    // Action button states
    const btnStartCharge = document.getElementById('btn-drawer-charge');
    const btnReserve = document.getElementById('btn-drawer-reserve');

    if (station.status === 'OFFLINE') {
      btnStartCharge.disabled = true;
      btnStartCharge.textContent = 'Station Offline';
      btnReserve.disabled = true;
    } else {
      btnStartCharge.disabled = false;
      btnStartCharge.textContent = 'Start Charging Session';
      btnReserve.disabled = false;
    }

    drawer.classList.remove('hidden');
    soundEngine.click();
  }

  closeStationDrawer() {
    const drawer = document.getElementById('station-drawer');
    if (drawer) drawer.classList.add('hidden');
    this.selectedStation = null;
  }

  // Reachability Engine UI Bindings (USP)
  updateReachabilityUI() {
    const res = reachabilityEngine.evaluateStations(this.stations, mapEngine.userLocation);
    const metrics = res.metrics;
    const evaluated = res.evaluated;
    const advisory = reachabilityEngine.generateAdvisory(evaluated);

    // Update summary telemetry numbers
    document.getElementById('range-current-soc').textContent = `${metrics.currentSoc}%`;
    document.getElementById('range-pack-energy').textContent = `${metrics.currentPackEnergyKwh} kWh`;
    document.getElementById('range-gross-km').textContent = `${metrics.grossRangeKm} km`;
    document.getElementById('range-buffer-km').textContent = `${metrics.reserveRangeKm} km (20%)`;
    document.getElementById('range-safe-km').textContent = `${metrics.safeUsableRangeKm} km`;

    // Update Leaflet dynamic reachability overlay
    mapEngine.updateReachabilityOverlay(metrics.safeUsableRangeKm, metrics.grossRangeKm);

    // Render Advisory Banner
    const advisoryBox = document.getElementById('range-advisory-banner');
    if (advisoryBox) {
      advisoryBox.className = `advisory-banner advisory-${advisory.type.toLowerCase()}`;
      advisoryBox.innerHTML = `
        <div class="advisory-icon">${advisory.type === 'ALERT' ? ICONS.alertCircle : (advisory.type === 'CAUTION' ? ICONS.alertTriangle : ICONS.shieldCheck)}</div>
        <div class="advisory-content">
          <div class="advisory-title">${advisory.title}</div>
          <div class="advisory-desc">${advisory.message}</div>
        </div>
      `;
    }

    // Render Reachability Station Cards
    const reachList = document.getElementById('reachability-stations-list');
    if (reachList) {
      reachList.innerHTML = evaluated.map(s => {
        let badgeClass = 'badge-emerald';
        let badgeIcon = ICONS.shieldCheck;
        if (s.reachabilityStatus === 'CAUTION') {
          badgeClass = 'badge-amber';
          badgeIcon = ICONS.alertTriangle;
        } else if (s.reachabilityStatus === 'UNREACHABLE') {
          badgeClass = 'badge-red';
          badgeIcon = ICONS.alertCircle;
        }

        return `
          <div class="reach-card ${s.reachabilityStatus.toLowerCase()}">
            <div class="reach-card-left">
              <div class="reach-card-title-row">
                <span class="reach-name">${s.name}</span>
                <span class="badge ${badgeClass}">${badgeIcon} ${s.statusLabel}</span>
              </div>
              <div class="reach-meta-row">
                <span>${s.distanceKm} km away</span>
                <span>Requires ${s.energyNeededKwh} kWh</span>
                <span>Arrival SoC: <strong>${s.estArrivalSoc}%</strong></span>
              </div>
            </div>
            <button class="btn btn-sm btn-primary btn-reach-action" data-station-id="${s.id}">
              Inspect
            </button>
          </div>
        `;
      }).join('');

      reachList.querySelectorAll('.btn-reach-action').forEach(btn => {
        btn.addEventListener('click', () => {
          const s = this.stations.find(st => st.id === btn.dataset.stationId);
          if (s) {
            this.switchTab('explore');
            mapEngine.flyToStation(s);
            this.openStationDrawer(s);
          }
        });
      });
    }
  }

  // Scan & Hardware Handshake View
  initScanView() {
    const scannerBox = document.getElementById('scanner-viewport');
    const handshakeBox = document.getElementById('handshake-progress-box');
    if (scannerBox) scannerBox.classList.remove('hidden');
    if (handshakeBox) handshakeBox.classList.add('hidden');
  }

  async executeHandshake(stationId) {
    const station = this.stations.find(s => s.id === stationId);
    if (!station) {
      alert(`Invalid Station ID: ${stationId}. Try CE-BLR-01, CE-BLR-02, or CE-DEL-02.`);
      return;
    }

    soundEngine.click();
    const scannerBox = document.getElementById('scanner-viewport');
    const handshakeBox = document.getElementById('handshake-progress-box');
    scannerBox.classList.add('hidden');
    handshakeBox.classList.remove('hidden');

    const steps = [
      { id: 'hs-step-1', text: `Connecting to hardware node @ ${station.id}...` },
      { id: 'hs-step-2', text: 'Authenticating ChargeEase protocol handshake...' },
      { id: 'hs-step-3', text: 'Engaging physical connector latch lock...' },
      { id: 'hs-step-4', text: 'Earth-fault & electrical safety check verified...' },
      { id: 'hs-step-5', text: 'Energizing relay contactors. Power flow active.' }
    ];

    for (let i = 0; i < steps.length; i++) {
      const stepEl = document.getElementById(steps[i].id);
      if (stepEl) {
        stepEl.classList.add('active');
        soundEngine.click();
      }
      await new Promise(r => setTimeout(r, 600));
      if (stepEl) {
        stepEl.classList.remove('active');
        stepEl.classList.add('done');
      }
    }

    soundEngine.success();
    // Launch Charging Session in Telemetry Engine
    telemetryEngine.startSession(station, this.userVehicle, this.userSoc);
    this.switchTab('telemetry');
  }

  // Live Telemetry UI Rendering
  renderTelemetryUI(session) {
    const emptyTelemetry = document.getElementById('telemetry-empty-state');
    const activeTelemetry = document.getElementById('telemetry-active-view');

    if (!session || session.status === 'COMPLETED') {
      if (emptyTelemetry) emptyTelemetry.classList.remove('hidden');
      if (activeTelemetry) activeTelemetry.classList.add('hidden');
      return;
    }

    if (emptyTelemetry) emptyTelemetry.classList.add('hidden');
    if (activeTelemetry) activeTelemetry.classList.remove('hidden');

    // Circular gauge animation
    const circle = document.getElementById('telemetry-gauge-circle');
    const circumference = 2 * Math.PI * 85; // r=85
    if (circle) {
      const offset = circumference - (session.currentSoc / 100) * circumference;
      circle.style.strokeDashoffset = offset;
    }

    // Metric numbers
    document.getElementById('tel-soc').textContent = `${Math.round(session.currentSoc)}%`;
    document.getElementById('tel-power').textContent = `${session.powerKw} kW`;
    document.getElementById('tel-voltage').textContent = `${session.voltage} V`;
    document.getElementById('tel-current').textContent = `${session.currentA} A`;
    document.getElementById('tel-energy').textContent = `${session.energyDeliveredKwh.toFixed(2)} kWh`;
    document.getElementById('tel-cost').textContent = formatCurrency(session.currentCostInr);
    document.getElementById('tel-time').textContent = telemetryEngine.formatDuration(session.elapsedSeconds);
    document.getElementById('tel-station-name').textContent = session.stationName;
    document.getElementById('tel-co2').textContent = `${session.co2OffsetKg.toFixed(2)} kg`;
    document.getElementById('tel-clean-km').textContent = `${session.cleanKmAdded.toFixed(1)} km`;

    // Render dynamic power waveform canvas
    const canvas = document.getElementById('telemetry-power-chart');
    if (canvas) {
      telemetryEngine.renderPowerCurve(canvas);
    }

    // Pause/Resume button state
    const btnPause = document.getElementById('btn-tel-pause');
    if (btnPause) {
      btnPause.innerHTML = session.status === 'PAUSED' ? `${ICONS.play} Resume` : `${ICONS.pause} Pause`;
    }
  }

  updateActiveSessionPill(session) {
    const pill = document.getElementById('header-active-session-pill');
    if (!pill) return;
    if (session && session.status === 'CHARGING') {
      pill.classList.remove('hidden');
      pill.innerHTML = `<span class="pulse-dot"></span> Charging ${Math.round(session.currentSoc)}%`;
    } else {
      pill.classList.add('hidden');
    }
  }

  // Invoice Modal
  showInvoiceModal(invoice) {
    const modal = document.getElementById('invoice-modal');
    if (!modal || !invoice) return;

    document.getElementById('inv-id').textContent = invoice.invoiceId;
    document.getElementById('inv-date').textContent = `${invoice.date} ${invoice.time}`;
    document.getElementById('inv-station').textContent = invoice.stationName;
    document.getElementById('inv-host').textContent = invoice.hostName;
    document.getElementById('inv-vehicle').textContent = invoice.vehicleName;
    document.getElementById('inv-duration').textContent = invoice.durationFormatted;
    document.getElementById('inv-energy').textContent = `${invoice.energyKwh} kWh`;
    document.getElementById('inv-tariff').textContent = `${formatCurrency(invoice.tariffPerKwh)}/kWh`;
    document.getElementById('inv-energy-charge').textContent = formatCurrency(invoice.energyCharge);
    document.getElementById('inv-platform-fee').textContent = formatCurrency(invoice.platformFee);
    document.getElementById('inv-parking-fee').textContent = formatCurrency(invoice.parkingFee);
    document.getElementById('inv-cgst').textContent = formatCurrency(invoice.cgst9);
    document.getElementById('inv-sgst').textContent = formatCurrency(invoice.sgst9);
    document.getElementById('inv-total').textContent = formatCurrency(invoice.totalAmount);
    document.getElementById('inv-co2').textContent = `${invoice.co2OffsetKg} kg`;

    // Auto deduct wallet
    walletEngine.deductSession(invoice.totalAmount, invoice.energyKwh, invoice.stationName);

    modal.classList.remove('hidden');
  }

  // Reservations UI
  renderReservationsUI(activeLock, list) {
    const banner = document.getElementById('active-lock-banner');
    if (activeLock && activeLock.status === 'ACTIVE') {
      banner.classList.remove('hidden');
      document.getElementById('lock-station-name').textContent = activeLock.stationName;
      document.getElementById('lock-slot-time').textContent = activeLock.slotTime;
      document.getElementById('lock-pass-code').textContent = activeLock.code;
      document.getElementById('lock-timer').textContent = activeLock.timeLeftFormatted || '15:00';
    } else {
      banner.classList.add('hidden');
    }

    const listContainer = document.getElementById('reservations-history-list');
    if (listContainer) {
      if (list.length === 0) {
        listContainer.innerHTML = `<div class="empty-state"><p class="empty-desc">No active or prior reservations.</p></div>`;
      } else {
        listContainer.innerHTML = list.map(r => `
          <div class="reservation-card">
            <div class="res-card-top">
              <span class="res-station-name">${r.stationName}</span>
              <span class="badge ${r.status === 'ACTIVE' ? 'badge-emerald' : 'badge-muted'}">${r.status}</span>
            </div>
            <div class="res-meta">
              <span>Time: <strong>${r.slotTime}</strong></span>
              <span>Pass Code: <strong>${r.code}</strong></span>
            </div>
            ${r.status === 'ACTIVE' ? `
              <div class="res-actions">
                <button class="btn btn-sm btn-subtle btn-cancel-res" data-res-id="${r.id}">Cancel Hold</button>
                <button class="btn btn-sm btn-primary btn-claim-res" data-station-id="${r.stationId}">Start Charging</button>
              </div>
            ` : ''}
          </div>
        `).join('');

        listContainer.querySelectorAll('.btn-cancel-res').forEach(btn => {
          btn.addEventListener('click', () => reservationEngine.cancelReservation(btn.dataset.resId));
        });

        listContainer.querySelectorAll('.btn-claim-res').forEach(btn => {
          btn.addEventListener('click', () => {
            const s = this.stations.find(st => st.id === btn.dataset.stationId);
            if (s) {
              this.switchTab('scan');
              this.executeHandshake(s.id);
            }
          });
        });
      }
    }
  }

  // Wallet UI
  renderWalletUI(balance, transactions) {
    document.getElementById('header-wallet-balance').textContent = formatCurrency(balance);
    document.getElementById('wallet-display-balance').textContent = formatCurrency(balance);

    const ledger = document.getElementById('wallet-ledger-container');
    if (ledger) {
      ledger.innerHTML = transactions.map(t => `
        <div class="ledger-row">
          <div class="ledger-left">
            <div class="ledger-icon ${t.type.toLowerCase()}">${t.type === 'CREDIT' ? ICONS.arrowUpRight : ICONS.battery}</div>
            <div>
              <div class="ledger-title">${t.title}</div>
              <div class="ledger-date">${new Date(t.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} • ${t.reference}</div>
            </div>
          </div>
          <div class="ledger-amount ${t.type.toLowerCase()}">
            ${t.type === 'CREDIT' ? '+' : '-'}${formatCurrency(t.amount)}
          </div>
        </div>
      `).join('');
    }
  }

  // Host UI
  renderHostUI(hostData) {
    document.getElementById('host-today-rev').textContent = formatCurrency(hostData.todayEarnings);
    document.getElementById('host-month-rev').textContent = formatCurrency(hostData.monthlyEarnings);
    document.getElementById('host-units').textContent = `${hostData.totalUnitsDispensedKwh.toFixed(1)} kWh`;
    document.getElementById('host-rating').textContent = `${hostData.overallRating} ★`;
    document.getElementById('host-tariff-input').value = hostData.currentTariffPerKwh;

    const relayToggle = document.getElementById('host-relay-switch');
    const relayStatusLabel = document.getElementById('host-relay-status-label');
    if (relayToggle) {
      relayToggle.checked = hostData.relayHardwareOnline;
    }
    if (relayStatusLabel) {
      relayStatusLabel.textContent = hostData.relayHardwareOnline ? 'POWER ACTIVE (230V ONLINE)' : 'GRID DISCONNECTED (RELAY OFF)';
      relayStatusLabel.className = `relay-status-text ${hostData.relayHardwareOnline ? 'online' : 'offline'}`;
    }
  }

  // Bind All Click and Input Events
  bindDomEvents() {
    // Mode Switcher
    document.getElementById('btn-mode-driver').addEventListener('click', () => this.setMode('DRIVER'));
    document.getElementById('btn-mode-host').addEventListener('click', () => this.setMode('HOST'));

    // Driver Tabs
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        if (tab) this.switchTab(tab);
      });
    });

    // City Selector
    document.getElementById('city-selector').addEventListener('change', (e) => {
      soundEngine.click();
      mapEngine.setCity(e.target.value);
      this.applyFilters();
      this.updateReachabilityUI();
    });

    // Recenter Button
    document.getElementById('btn-recenter').addEventListener('click', () => {
      soundEngine.click();
      mapEngine.recenterUser();
    });

    // Search input
    document.getElementById('search-input').addEventListener('input', (e) => {
      this.searchQuery = e.target.value;
      this.applyFilters();
    });

    // Filter Chips
    document.querySelectorAll('.filter-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        soundEngine.click();
        document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        this.activeFilter = chip.dataset.filter;
        this.applyFilters();
      });
    });

    // Live GPS Location Detection
    const btnGps = document.getElementById('btn-detect-gps');
    if (btnGps) {
      btnGps.addEventListener('click', () => {
        soundEngine.click();
        btnGps.classList.add('loading');
        btnGps.innerHTML = `<span>Locating...</span>`;
        mapEngine.detectLiveLocation(
          (coords, accuracy) => {
            btnGps.classList.remove('loading');
            btnGps.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polygon points="12 2 15 8 12 6 9 8 12 2"></polygon></svg><span>Live GPS</span>`;
            soundEngine.success();
            this.handleLiveLocationFound(coords, accuracy);
          },
          (err) => {
            btnGps.classList.remove('loading');
            btnGps.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polygon points="12 2 15 8 12 6 9 8 12 2"></polygon></svg><span>Live GPS</span>`;
            soundEngine.warning();
            alert(`GPS Access: ${err}\nFalling back to current selected city coordinates.`);
            this.handleLiveLocationFound(mapEngine.userLocation, 50);
          }
        );
      });
    }

    // Fair Pricing Modal
    const btnFairPricing = document.getElementById('btn-fair-pricing');
    if (btnFairPricing) {
      btnFairPricing.addEventListener('click', () => {
        soundEngine.click();
        document.getElementById('fair-pricing-modal').classList.remove('hidden');
      });
    }

    // Toggle Basemap Style (ESRI Dark / OSM Dark)
    let currentTileMode = 'esri';
    const btnToggleTiles = document.getElementById('btn-toggle-tiles');
    if (btnToggleTiles) {
      btnToggleTiles.addEventListener('click', () => {
        soundEngine.click();
        currentTileMode = currentTileMode === 'esri' ? 'osm' : 'esri';
        mapEngine.switchTileStyle(currentTileMode);
      });
    }

    // Hackathon Pitch Scenarios Modal
    const btnPitch = document.getElementById('btn-pitch-demo');
    const modalPitch = document.getElementById('pitch-scenarios-modal');
    if (btnPitch && modalPitch) {
      btnPitch.addEventListener('click', () => {
        soundEngine.click();
        modalPitch.classList.remove('hidden');
      });
    }

    const btnClosePitch = document.getElementById('btn-close-pitch-modal');
    if (btnClosePitch && modalPitch) {
      btnClosePitch.addEventListener('click', () => {
        modalPitch.classList.add('hidden');
      });
    }

    // Keyboard shortcut 'P' to toggle pitch scenarios
    window.addEventListener('keydown', (e) => {
      if (e.key === 'p' || e.key === 'P') {
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
          if (modalPitch) modalPitch.classList.toggle('hidden');
        }
      }
    });

    // Pitch Scenario 1: Low Battery (12% SoC)
    const trigLowBat = document.getElementById('trigger-scenario-low-bat');
    if (trigLowBat) {
      trigLowBat.addEventListener('click', () => {
        if (modalPitch) modalPitch.classList.add('hidden');
        this.userSoc = 12;
        const slider = document.getElementById('soc-slider');
        const label = document.getElementById('soc-slider-val');
        if (slider) slider.value = 12;
        if (label) label.textContent = '12%';
        reachabilityEngine.setSoc(12);
        this.switchTab('range');
        this.updateReachabilityUI();
        soundEngine.warning();
      });
    }

    // Pitch Scenario 2: Safe Commute (45% SoC)
    const trigSafe = document.getElementById('trigger-scenario-safe-commute');
    if (trigSafe) {
      trigSafe.addEventListener('click', () => {
        if (modalPitch) modalPitch.classList.add('hidden');
        this.userSoc = 45;
        const slider = document.getElementById('soc-slider');
        const label = document.getElementById('soc-slider-val');
        if (slider) slider.value = 45;
        if (label) label.textContent = '45%';
        reachabilityEngine.setSoc(45);
        this.switchTab('explore');
        this.updateReachabilityUI();
        soundEngine.success();
      });
    }

    // Pitch Scenario 3: DC Fast Charging (50 kW)
    const trigFast = document.getElementById('trigger-scenario-fast-charge');
    if (trigFast) {
      trigFast.addEventListener('click', () => {
        if (modalPitch) modalPitch.classList.add('hidden');
        const fastStation = this.stations.find(s => s.powerKw >= 30) || this.stations[0];
        this.switchTab('telemetry');
        telemetryEngine.startSession(fastStation, this.userVehicle, 42);
      });
    }

    // Pitch Scenario 4: Host Contactor Relay Toggle
    const trigHost = document.getElementById('trigger-scenario-host-relay');
    if (trigHost) {
      trigHost.addEventListener('click', () => {
        if (modalPitch) modalPitch.classList.add('hidden');
        this.setMode('HOST');
        const relaySwitch = document.getElementById('host-relay-switch');
        if (relaySwitch) {
          relaySwitch.click();
        }
      });
    }

    const btnClosePricing = document.getElementById('btn-close-pricing-modal');
    if (btnClosePricing) {
      btnClosePricing.addEventListener('click', () => {
        document.getElementById('fair-pricing-modal').classList.add('hidden');
      });
    }

    const btnCloseLoc = document.getElementById('btn-close-loc-modal');
    if (btnCloseLoc) {
      btnCloseLoc.addEventListener('click', () => {
        document.getElementById('location-analysis-modal').classList.add('hidden');
      });
    }

    // Drawer Navigate Route
    const btnDrawerNav = document.getElementById('btn-drawer-nav');
    if (btnDrawerNav) {
      btnDrawerNav.addEventListener('click', () => {
        if (!this.selectedStation) return;
        navigationEngine.startNavigation(
          this.selectedStation,
          mapEngine.userLocation,
          this.userVehicle,
          this.userSoc,
          mapEngine.map
        );
        this.closeStationDrawer();
      });
    }

    // Drawer Close
    document.getElementById('btn-close-drawer').addEventListener('click', () => this.closeStationDrawer());

    // Drawer Reserve
    document.getElementById('btn-drawer-reserve').addEventListener('click', async () => {
      if (!this.selectedStation) return;
      const selectedSlot = document.querySelector('.slot-chip.selected')?.dataset.slot || '14:00 - 15:00';
      await reservationEngine.createReservation(this.selectedStation, selectedSlot);
      this.closeStationDrawer();
      this.switchTab('reservations');
    });

    // Drawer Start Charge
    document.getElementById('btn-drawer-charge').addEventListener('click', () => {
      if (!this.selectedStation) return;
      const st = this.selectedStation;
      this.closeStationDrawer();
      this.switchTab('scan');
      this.executeHandshake(st.id);
    });

    // Vehicle Garage Selector
    const vehicleSelect = document.getElementById('vehicle-selector');
    if (vehicleSelect) {
      vehicleSelect.innerHTML = VEHICLE_DATABASE.map(v => `
        <option value="${v.id}" ${v.id === this.userVehicle.id ? 'selected' : ''}>
          ${v.name} (${v.batteryKwh} kWh, ${v.category})
        </option>
      `).join('');

      vehicleSelect.addEventListener('change', (e) => {
        soundEngine.click();
        this.userVehicle = VEHICLE_DATABASE.find(v => v.id === e.target.value);
        reachabilityEngine.setVehicle(this.userVehicle.id);
        this.updateReachabilityUI();
        this.renderGarageUI();
      });
    }

    // SoC Slider
    const socSlider = document.getElementById('soc-slider');
    const socValLabel = document.getElementById('soc-slider-val');
    if (socSlider) {
      socSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        this.userSoc = val;
        socValLabel.textContent = `${val}%`;
        reachabilityEngine.setSoc(val);
        this.updateReachabilityUI();
      });
    }

    // Manual Station ID Form Submit
    document.getElementById('form-manual-scan').addEventListener('submit', (e) => {
      e.preventDefault();
      const input = document.getElementById('manual-station-id');
      const sId = input.value.trim().toUpperCase();
      if (sId) {
        this.executeHandshake(sId);
      }
    });

    // Telemetry Controls
    document.getElementById('btn-tel-pause').addEventListener('click', () => {
      if (telemetryEngine.activeSession?.status === 'PAUSED') {
        telemetryEngine.resumeSession();
      } else {
        telemetryEngine.pauseSession();
      }
    });

    document.getElementById('btn-tel-stop').addEventListener('click', () => {
      const invoice = telemetryEngine.stopSession();
      if (invoice) {
        this.showInvoiceModal(invoice);
      }
    });

    // Invoice Close
    document.getElementById('btn-close-invoice').addEventListener('click', () => {
      document.getElementById('invoice-modal').classList.add('hidden');
      telemetryEngine.resetSession();
      this.switchTab('explore');
    });

    // Audio Mute Toggle
    const btnMute = document.getElementById('btn-toggle-audio');
    if (btnMute) {
      btnMute.addEventListener('click', () => {
        const muted = soundEngine.toggleMute();
        btnMute.innerHTML = muted ? ICONS.volumeX : ICONS.volume2;
      });
    }

    // Wallet Topup Presets
    document.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.getElementById('topup-amount-input').value = btn.dataset.amount;
      });
    });

    document.getElementById('form-topup').addEventListener('submit', async (e) => {
      e.preventDefault();
      const amount = document.getElementById('topup-amount-input').value;
      const provider = document.querySelector('input[name="upi-provider"]:checked')?.value || 'Google Pay';
      await walletEngine.topUp(amount, provider);
      document.getElementById('topup-amount-input').value = '';
    });

    // Host Relay Switch
    document.getElementById('host-relay-switch').addEventListener('change', async (e) => {
      await hostEngine.toggleHardwareRelay();
      // Update seed station status
      const owned = this.stations.find(s => s.id === hostEngine.hostData.ownedStationId);
      if (owned) {
        owned.status = hostEngine.hostData.relayHardwareOnline ? 'AVAILABLE' : 'OFFLINE';
        mapEngine.renderStations(this.filteredStations);
      }
    });

    // Host Tariff Update
    document.getElementById('btn-save-tariff').addEventListener('click', () => {
      const val = document.getElementById('host-tariff-input').value;
      if (hostEngine.updateTariff(val)) {
        alert('Tariff updated successfully. Network nodes notified.');
      }
    });

    // Host Onboard Wizard Form
    document.getElementById('form-onboard-socket').addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = {
        name: document.getElementById('onboard-name').value,
        city: document.getElementById('onboard-city').value,
        address: document.getElementById('onboard-address').value,
        lat: parseFloat(document.getElementById('onboard-lat').value),
        lng: parseFloat(document.getElementById('onboard-lng').value),
        type: document.getElementById('onboard-type').value,
        powerKw: parseFloat(document.getElementById('onboard-power').value),
        tariffPerKwh: parseFloat(document.getElementById('onboard-tariff').value),
        accessHours: document.getElementById('onboard-hours').value
      };

      const created = await hostEngine.onboardCharger(formData);
      this.stations.unshift(created);
      this.applyFilters();
      alert(`Success! "${created.name}" is now live on the ChargeEase P2P Network.`);
      document.getElementById('form-onboard-socket').reset();
    });

    // Initial Garage render
    this.renderGarageUI();
  }

  renderGarageUI() {
    const v = this.userVehicle;
    document.getElementById('garage-vehicle-name').textContent = v.name;
    document.getElementById('garage-pack').textContent = `${v.batteryKwh} kWh`;
    document.getElementById('garage-claimed').textContent = `${v.claimedRangeKm} km`;
    document.getElementById('garage-real').textContent = `${v.realWorldRangeKm} km`;
    document.getElementById('garage-efficiency').textContent = `${v.consumptionWhPerKm.toFixed(1)} Wh/km`;
    document.getElementById('garage-recommended-socket').textContent = v.recommendedSocket;
  }

  handleLiveLocationFound([lat, lng], accuracy = 20) {
    this.userLocation = [lat, lng];
    mapEngine.userLocation = [lat, lng];
    mapEngine.renderUserMarker();
    this.applyFilters();
    this.updateReachabilityUI();
    this.analyzeLocationAndNearbyChargers(lat, lng, accuracy);
  }

  analyzeLocationAndNearbyChargers(lat, lng, accuracy) {
    const coordsStr = `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;
    document.getElementById('loc-coords-display').textContent = coordsStr;
    document.getElementById('loc-accuracy-badge').textContent = `±${accuracy}m High Precision`;

    // Evaluate stations relative to this exact point
    const res = reachabilityEngine.evaluateStations(this.stations, [lat, lng]);
    const evaluated = res.evaluated;

    // Detect closest corridor
    const topStation = evaluated[0];
    if (topStation) {
      document.getElementById('loc-corridor-desc').textContent = `${topStation.name.split(' ')[0]} / ${topStation.city} EV Corridor`;
      document.getElementById('loc-verdict-text').textContent = `Nearest node is "${topStation.name}" (${topStation.distanceKm} km away). Safe arrival SoC: ${topStation.estArrivalSoc}%.`;
    }

    // Render Top 3 Ranked Nearby Stations
    const listEl = document.getElementById('loc-nearby-list');
    if (listEl) {
      const top3 = evaluated.slice(0, 3);
      listEl.innerHTML = top3.map((s, idx) => {
        const fair = evaluateFairPricing(s.tariffPerKwh, s.type);
        const isFast = s.powerKw >= 22;
        return `
          <div style="background: var(--bg-card); border: 1px solid var(--border-subtle); padding: 12px; border-radius: var(--radius-md); display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-weight: 700; color: #FFFFFF; font-size: 13px;">#${idx + 1} ${s.name}</span>
                <span class="badge ${s.status === 'AVAILABLE' ? 'badge-emerald' : 'badge-amber'}">${s.status}</span>
              </div>
              <div style="font-size: 11px; color: var(--text-secondary); margin-top: 4px;">
                <span>${s.distanceKm} km</span> • <span>${s.powerKw} kW ${isFast ? 'CCS2' : 'AC'}</span> • <span>Arrival SoC: <strong>${s.estArrivalSoc}%</strong></span>
              </div>
              <div style="margin-top: 4px;">
                <span class="badge ${fair.badgeClass}" style="font-size: 9px;">${fair.badgeLabel}</span>
              </div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 14px; font-weight: 800; color: #FFFFFF;">${formatCurrency(s.tariffPerKwh)}<span style="font-size: 10px; color: var(--text-muted);">/kWh</span></div>
              <button class="btn btn-sm btn-subtle btn-loc-inspect" data-station-id="${s.id}" style="margin-top: 6px;">
                View
              </button>
            </div>
          </div>
        `;
      }).join('');

      listEl.querySelectorAll('.btn-loc-inspect').forEach(btn => {
        btn.addEventListener('click', () => {
          const s = this.stations.find(st => st.id === btn.dataset.stationId);
          if (s) {
            document.getElementById('location-analysis-modal').classList.add('hidden');
            this.switchTab('explore');
            mapEngine.flyToStation(s);
            this.openStationDrawer(s);
          }
        });
      });
    }

    document.getElementById('location-analysis-modal').classList.remove('hidden');
  }
}

// Global bootstrap
window.chargeEaseApp = new ChargeEaseApp();
window.addEventListener('DOMContentLoaded', () => {
  window.chargeEaseApp.init();
});

