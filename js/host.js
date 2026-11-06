/**
 * ChargeEase EV - P2P Host Console & Smart Relay Hardware Controller
 * Real-time host telemetry, remote IoT relay contactor toggle,
 * tariff configuration, and socket onboarding pipeline.
 */

class HostEngine {
  constructor() {
    this.hostData = {
      hostId: 'HOST-USR-49',
      hostName: 'Dr. Vikram Malhotra',
      ownedStationId: 'CE-BLR-01',
      todayEarnings: 462.50,
      monthlyEarnings: 12480.00,
      totalUnitsDispensedKwh: 998.4,
      activeSessionsCount: 0,
      overallRating: 4.9,
      relayHardwareOnline: true,
      currentTariffPerKwh: 12.50
    };
    this.listeners = [];
  }

  onUpdate(callback) {
    this.listeners.push(callback);
  }

  notify() {
    this.listeners.forEach(cb => cb(this.hostData));
  }

  /**
   * Remote Hardware Relay Contactor Switch (IoT Simulation)
   */
  async toggleHardwareRelay(stationId) {
    soundEngine.click();
    const currentState = this.hostData.relayHardwareOnline;
    const newState = !currentState;
    
    // Play mechanical relay snap sound
    soundEngine.relaySwitch(newState);

    try {
      const res = await fetch(`/api/stations/${stationId || this.hostData.ownedStationId}/toggle`, {
        method: 'POST'
      });
      if (res.ok) {
        const data = await res.json();
        this.hostData.relayHardwareOnline = data.relayState === 'ON';
        this.notify();
        return this.hostData.relayHardwareOnline;
      }
    } catch (e) {
      // Local fallback
    }

    this.hostData.relayHardwareOnline = newState;
    this.notify();
    return this.hostData.relayHardwareOnline;
  }

  updateTariff(newTariff) {
    const parsed = parseFloat(newTariff);
    if (!isNaN(parsed) && parsed > 0) {
      this.hostData.currentTariffPerKwh = parsed;
      soundEngine.click();
      this.notify();
      return true;
    }
    return false;
  }

  /**
   * Host Onboarding Wizard: Register new physical socket or charger
   */
  async onboardCharger(formData) {
    soundEngine.click();
    const newStation = {
      name: formData.name,
      hostName: this.hostData.hostName,
      isVerified: true,
      city: formData.city,
      address: formData.address,
      lat: parseFloat(formData.lat) || 12.9716,
      lng: parseFloat(formData.lng) || 77.5946,
      type: formData.type || '16A 3-Pin Smart Socket',
      powerKw: parseFloat(formData.powerKw) || 3.3,
      voltage: parseInt(formData.voltage) || 230,
      currentA: parseInt(formData.currentA) || 15,
      vehicleTypes: formData.vehicleTypes || ['2W', '3W', '4W'],
      tariffPerKwh: parseFloat(formData.tariffPerKwh) || 12.00,
      parkingFee: parseFloat(formData.parkingFee) || 0,
      amenities: formData.amenities || ['Covered Parking', '24/7 Security'],
      accessHours: formData.accessHours || '24/7 Public Access'
    };

    try {
      const res = await fetch('/api/stations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStation)
      });
      if (res.ok) {
        const data = await res.json();
        soundEngine.success();
        return data.station;
      }
    } catch (e) {
      // Fallback
    }

    newStation.id = `CE-${formData.city.substring(0, 3).toUpperCase()}-${Math.floor(10 + Math.random() * 90)}`;
    newStation.status = 'AVAILABLE';
    newStation.relayState = 'ON';
    newStation.rating = 5.0;
    newStation.totalSessions = 0;
    newStation.availableSlots = ['10:00 - 11:00', '13:00 - 14:00', '16:00 - 17:00'];
    soundEngine.success();
    return newStation;
  }
}

const hostEngine = new HostEngine();

