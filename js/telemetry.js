/**
 * ChargeEase EV - Live Charging Telemetry Engine (ChargeEase OS)
 * High-precision simulation of CC/CV charging curves, hardware metrics,
 * live telemetry updates, session state management, and itemized billing.
 */

class TelemetryEngine {
  constructor() {
    this.activeSession = null;
    this.intervalId = null;
    this.listeners = [];
  }

  onUpdate(callback) {
    this.listeners.push(callback);
  }

  notify() {
    this.listeners.forEach(cb => cb(this.activeSession));
  }

  /**
   * Start a real-time charging session
   */
  startSession(station, vehicle, startSoc = 42) {
    if (this.activeSession && this.activeSession.status === 'CHARGING') {
      return this.activeSession;
    }

    // Determine initial power based on station rating & vehicle capability
    const maxKw = Math.min(station.powerKw, vehicle.supportsDcFast && station.powerKw > 22 ? station.powerKw : (vehicle.maxAcRateKw || 3.3));
    const voltage = station.voltage || 230;
    const currentA = Math.round((maxKw * 1000) / voltage);

    this.activeSession = {
      sessionId: `CE-SESS-${Math.floor(10000 + Math.random() * 90000)}`,
      stationId: station.id,
      stationName: station.name,
      stationAddress: station.address,
      tariffPerKwh: station.tariffPerKwh,
      parkingFee: station.parkingFee || 0,
      hostName: station.hostName,
      vehicleName: vehicle.name,
      batteryKwh: vehicle.batteryKwh,
      startTime: Date.now(),
      elapsedSeconds: 0,
      initialSoc: startSoc,
      currentSoc: startSoc,
      targetSoc: 100,
      powerKw: maxKw,
      maxRatedKw: maxKw,
      voltage: voltage,
      currentA: currentA,
      energyDeliveredKwh: 0.00,
      currentCostInr: 0.00,
      co2OffsetKg: 0.00,
      cleanKmAdded: 0.0,
      status: 'CHARGING', // CHARGING, PAUSED, COMPLETED
      phase: startSoc >= 80 ? 'CV_TAPER' : 'CC_FAST',
      history: [{ time: 0, powerKw: maxKw, voltage: voltage }]
    };

    soundEngine.success();

    // Start 1-second telemetry interval
    this.intervalId = setInterval(() => {
      this.tick();
    }, 1000);

    this.notify();
    return this.activeSession;
  }

  tick() {
    if (!this.activeSession || this.activeSession.status !== 'CHARGING') {
      return;
    }

    const s = this.activeSession;
    s.elapsedSeconds += 1;

    // CC/CV Curve Logic: Above 80% SoC, power linearly tapers down to protect cell chemistry
    if (s.currentSoc >= 80) {
      s.phase = 'CV_TAPER';
      const taperFactor = Math.max(0.2, (100 - s.currentSoc) / 20);
      s.powerKw = Math.round(s.maxRatedKw * taperFactor * 10) / 10;
    } else {
      s.phase = 'CC_FAST';
      // Subtle realistic micro-fluctuations in grid voltage (± 2V)
      s.voltage = 230 + Math.floor(Math.random() * 5 - 2);
    }

    s.currentA = Math.round((s.powerKw * 1000) / s.voltage * 10) / 10;

    // 1 second delta energy in kWh: (powerKw * 1h / 3600s) * speed factor (accelerated for interactive demo UX)
    // Speed factor: 1 demo second = ~60 real seconds of energy flow for instant responsiveness
    const deltaHours = 60 / 3600; 
    const deltaKwh = (s.powerKw * deltaHours);
    s.energyDeliveredKwh = Math.round((s.energyDeliveredKwh + deltaKwh) * 100) / 100;

    // Delta SoC %
    const deltaSoc = (deltaKwh / s.batteryKwh) * 100;
    s.currentSoc = Math.min(100, Math.round((s.currentSoc + deltaSoc) * 10) / 10);

    // Cost calculation
    s.currentCostInr = Math.round((s.energyDeliveredKwh * s.tariffPerKwh) * 100) / 100;

    // Environmental metrics
    s.co2OffsetKg = Math.round(s.energyDeliveredKwh * 0.82 * 100) / 100; // 0.82kg CO2/kWh India grid displacement
    s.cleanKmAdded = Math.round((s.energyDeliveredKwh / (s.batteryKwh / 100)) * 10) / 10;

    // Record waveform telemetry history
    if (!s.history) s.history = [];
    s.history.push({
      time: s.elapsedSeconds,
      powerKw: s.powerKw,
      voltage: s.voltage,
      currentA: s.currentA
    });
    if (s.history.length > 30) {
      s.history.shift();
    }

    // Auto complete at 100%
    if (s.currentSoc >= 100) {
      this.stopSession();
      return;
    }

    this.notify();
  }

  pauseSession() {
    if (!this.activeSession || this.activeSession.status !== 'CHARGING') return;
    this.activeSession.status = 'PAUSED';
    soundEngine.click();
    this.notify();
  }

  resumeSession() {
    if (!this.activeSession || this.activeSession.status !== 'PAUSED') return;
    this.activeSession.status = 'CHARGING';
    soundEngine.click();
    this.notify();
  }

  stopSession() {
    if (!this.activeSession) return null;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    const s = this.activeSession;
    s.status = 'COMPLETED';
    s.endTime = Date.now();

    // Generate Final Itemized Tax Invoice
    const energyCharge = Math.max(10.00, s.currentCostInr);
    const platformFee = 2.50;
    const parkingFee = s.parkingFee || 0;
    const taxableSubtotal = energyCharge + platformFee + parkingFee;
    const cgst9 = Math.round(taxableSubtotal * 0.09 * 100) / 100;
    const sgst9 = Math.round(taxableSubtotal * 0.09 * 100) / 100;
    const totalAmount = Math.round((taxableSubtotal + cgst9 + sgst9) * 100) / 100;

    const invoice = {
      invoiceId: `INV-${Date.now().toString().slice(-6)}`,
      sessionId: s.sessionId,
      stationName: s.stationName,
      stationAddress: s.stationAddress,
      hostName: s.hostName,
      vehicleName: s.vehicleName,
      date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      durationFormatted: this.formatDuration(s.elapsedSeconds),
      energyKwh: s.energyDeliveredKwh || 0.85,
      tariffPerKwh: s.tariffPerKwh,
      energyCharge,
      platformFee,
      parkingFee,
      taxableSubtotal,
      cgst9,
      sgst9,
      totalAmount,
      co2OffsetKg: s.co2OffsetKg || 0.70,
      cleanKmAdded: s.cleanKmAdded || 6.2,
      startSoc: s.initialSoc,
      endSoc: s.currentSoc
    };

    s.invoice = invoice;
    soundEngine.success();
    this.notify();
    return invoice;
  }

  resetSession() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.activeSession = null;
    this.notify();
  }

  formatDuration(totalSec) {
    const hours = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    const pad = n => String(n).padStart(2, '0');
    return `${pad(hours)}:${pad(mins)}:${pad(secs)}`;
  }

  /**
   * Renders real-time dynamic power waveform curve on HTML5 Canvas
   */
  renderPowerCurve(canvas) {
    if (!canvas || !this.activeSession || !this.activeSession.history) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const history = this.activeSession.history;
    if (history.length < 2) return;

    ctx.clearRect(0, 0, width, height);

    // Draw grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1;
    for (let y = 10; y < height; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Determine max power for scaling
    const maxPower = Math.max(10, this.activeSession.maxRatedKw * 1.2);
    const stepX = width / (Math.max(history.length - 1, 10));

    // Fill gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, 'rgba(16, 185, 129, 0.25)');
    gradient.addColorStop(1, 'rgba(16, 185, 129, 0.0)');

    ctx.beginPath();
    ctx.moveTo(0, height);

    history.forEach((pt, idx) => {
      const x = idx * stepX;
      const y = height - (pt.powerKw / maxPower) * (height - 15) - 5;
      if (idx === 0) {
        ctx.lineTo(x, y);
      } else {
        const prevX = (idx - 1) * stepX;
        const prevPt = history[idx - 1];
        const prevY = height - (prevPt.powerKw / maxPower) * (height - 15) - 5;
        const midX = (prevX + x) / 2;
        ctx.bezierCurveTo(midX, prevY, midX, y, x, y);
      }
    });

    const lastX = (history.length - 1) * stepX;
    ctx.lineTo(lastX, height);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw main line stroke
    ctx.beginPath();
    history.forEach((pt, idx) => {
      const x = idx * stepX;
      const y = height - (pt.powerKw / maxPower) * (height - 15) - 5;
      if (idx === 0) {
        ctx.moveTo(x, y);
      } else {
        const prevX = (idx - 1) * stepX;
        const prevPt = history[idx - 1];
        const prevY = height - (prevPt.powerKw / maxPower) * (height - 15) - 5;
        const midX = (prevX + x) / 2;
        ctx.bezierCurveTo(midX, prevY, midX, y, x, y);
      }
    });
    ctx.strokeStyle = '#10B981';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw pulsing current dot at the tip
    const latestPt = history[history.length - 1];
    const tipX = (history.length - 1) * stepX;
    const tipY = height - (latestPt.powerKw / maxPower) * (height - 15) - 5;
    ctx.beginPath();
    ctx.arc(tipX, tipY, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(tipX, tipY, 8, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

const telemetryEngine = new TelemetryEngine();

