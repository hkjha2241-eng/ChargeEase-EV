/**
 * ChargeEase EV - Slot Reservation & 15-Minute Lock Engine
 * Manages guaranteed slot holds with 15-minute countdown locks,
 * security pass generation, and host access codes.
 */

class ReservationEngine {
  constructor() {
    this.reservations = [];
    this.activeLock = null;
    this.countdownInterval = null;
    this.listeners = [];
  }

  onUpdate(callback) {
    this.listeners.push(callback);
  }

  notify() {
    this.listeners.forEach(cb => cb(this.activeLock, this.reservations));
  }

  async createReservation(station, slotTime, date = 'Today') {
    soundEngine.click();
    const lockExpiresAt = Date.now() + 15 * 60 * 1000; // 15-minute lock guarantee
    const passCode = `PASS-${Math.floor(100000 + Math.random() * 900000)}`;

    const newRes = {
      id: `RES-${Math.floor(1000 + Math.random() * 9000)}`,
      stationId: station.id,
      stationName: station.name,
      stationAddress: station.address,
      hostName: station.hostName,
      slotTime: slotTime,
      date: date,
      code: passCode,
      status: 'ACTIVE',
      lockExpiresAt: lockExpiresAt
    };

    // Attempt API save if server is running
    try {
      const res = await fetch('/api/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stationId: station.id, slotTime, date })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.reservation) {
          newRes.id = data.reservation.id;
          newRes.code = data.reservation.code;
        }
      }
    } catch (e) {
      // Local fallback
    }

    this.reservations.unshift(newRes);
    this.activeLock = newRes;
    this.startCountdown();
    soundEngine.success();
    this.notify();
    return newRes;
  }

  startCountdown() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }

    this.countdownInterval = setInterval(() => {
      if (!this.activeLock) {
        clearInterval(this.countdownInterval);
        return;
      }

      const now = Date.now();
      const timeLeftMs = this.activeLock.lockExpiresAt - now;

      if (timeLeftMs <= 0) {
        clearInterval(this.countdownInterval);
        this.activeLock.status = 'EXPIRED';
        this.notify();
        return;
      }

      const minutes = Math.floor(timeLeftMs / 60000);
      const seconds = Math.floor((timeLeftMs % 60000) / 1000);
      this.activeLock.timeLeftFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      this.notify();
    }, 1000);
  }

  cancelReservation(reservationId) {
    soundEngine.click();
    this.reservations = this.reservations.filter(r => r.id !== reservationId);
    if (this.activeLock && this.activeLock.id === reservationId) {
      if (this.countdownInterval) clearInterval(this.countdownInterval);
      this.activeLock = null;
    }
    this.notify();
  }
}

const reservationEngine = new ReservationEngine();

