/**
 * ChargeEase EV - Reachability-Aware Range Matcher Engine (Core Hackathon USP)
 * Calculates safe reachable charging nodes considering:
 * - Vehicle battery capacity (kWh)
 * - Real-world efficiency (Wh/km)
 * - Dynamic State of Charge (SoC %)
 * - 20% Uncompromising Safety Cushion (Traffic, AC, Elevation)
 * - Connector compatibility
 */

class ReachabilityEngine {
  constructor() {
    this.selectedVehicle = VEHICLE_DATABASE[3]; // Default: Tata Nexon EV
    this.currentSoc = 42; // Default: 42% SoC
    this.safetyReservePct = 20; // 20% safety margin buffer
  }

  setVehicle(vehicleId) {
    const found = VEHICLE_DATABASE.find(v => v.id === vehicleId);
    if (found) {
      this.selectedVehicle = found;
    }
    return this.calculateMetrics();
  }

  setSoc(socPct) {
    this.currentSoc = Math.max(1, Math.min(100, parseInt(socPct, 10)));
    return this.calculateMetrics();
  }

  calculateMetrics() {
    const vehicle = this.selectedVehicle;
    // Current energy in pack in kWh
    const currentPackEnergyKwh = (vehicle.batteryKwh * this.currentSoc) / 100;
    
    // Gross theoretical range in km based on actual consumption
    const consumptionKwhPerKm = vehicle.consumptionWhPerKm / 1000;
    const grossRangeKm = currentPackEnergyKwh / consumptionKwhPerKm;

    // Safety reserve: 20% of range reserved strictly for unexpected traffic / climate control
    const reserveRangeKm = grossRangeKm * (this.safetyReservePct / 100);

    // Safe net usable range
    const safeUsableRangeKm = Math.max(0, grossRangeKm - reserveRangeKm);

    return {
      vehicle,
      currentSoc: this.currentSoc,
      currentPackEnergyKwh: Math.round(currentPackEnergyKwh * 10) / 10,
      grossRangeKm: Math.round(grossRangeKm * 10) / 10,
      reserveRangeKm: Math.round(reserveRangeKm * 10) / 10,
      safeUsableRangeKm: Math.round(safeUsableRangeKm * 10) / 10
    };
  }

  /**
   * Evaluates station reachability from the current user position
   * @param {Array} stations 
   * @param {Array} userLocation [lat, lng]
   */
  evaluateStations(stations, userLocation) {
    const metrics = this.calculateMetrics();
    const [uLat, uLng] = userLocation;

    const evaluated = stations.map(station => {
      const distanceKm = calculateHaversineDistanceKm(uLat, uLng, station.lat, station.lng);
      
      // Calculate energy required to reach this station
      const energyNeededKwh = distanceKm * (metrics.vehicle.consumptionWhPerKm / 1000);
      const estArrivalSoc = Math.max(0, Math.round(metrics.currentSoc - (energyNeededKwh / metrics.vehicle.batteryKwh) * 100));

      let reachabilityStatus = 'SAFE'; // SAFE, CAUTION, UNREACHABLE
      let statusLabel = 'Safe Buffer';
      let statusColor = 'green';

      if (distanceKm <= metrics.safeUsableRangeKm) {
        reachabilityStatus = 'SAFE';
        statusLabel = 'Reachable with Buffer';
        statusColor = 'emerald';
      } else if (distanceKm <= metrics.grossRangeKm) {
        reachabilityStatus = 'CAUTION';
        statusLabel = 'Buffer At Risk';
        statusColor = 'amber';
      } else {
        reachabilityStatus = 'UNREACHABLE';
        statusLabel = 'Beyond Safe Range';
        statusColor = 'red';
      }

      // Check connector compatibility
      const isCompatible = station.vehicleTypes.includes(metrics.vehicle.category);

      return {
        ...station,
        distanceKm,
        energyNeededKwh: Math.round(energyNeededKwh * 10) / 10,
        estArrivalSoc,
        reachabilityStatus,
        statusLabel,
        statusColor,
        isCompatible
      };
    });

    // Sort by reachability safety first, then status (available first), then distance
    evaluated.sort((a, b) => {
      const order = { SAFE: 1, CAUTION: 2, UNREACHABLE: 3 };
      if (order[a.reachabilityStatus] !== order[b.reachabilityStatus]) {
        return order[a.reachabilityStatus] - order[b.reachabilityStatus];
      }
      if (a.status === 'AVAILABLE' && b.status !== 'AVAILABLE') return -1;
      if (b.status === 'AVAILABLE' && a.status !== 'AVAILABLE') return 1;
      return a.distanceKm - b.distanceKm;
    });

    return {
      metrics,
      evaluated
    };
  }

  /**
   * Generates intelligent dispatch advisory
   */
  generateAdvisory(evaluatedStations) {
    const safeAvailable = evaluatedStations.filter(s => s.reachabilityStatus === 'SAFE' && s.status === 'AVAILABLE' && s.isCompatible);
    
    if (safeAvailable.length > 0) {
      const topPick = safeAvailable[0];
      return {
        type: 'RECOMMENDED',
        title: 'Safe Charging Corridor Locked',
        message: `${topPick.name} is ${topPick.distanceKm} km away. Estimated arrival SoC: ${topPick.estArrivalSoc}%. You preserve your 20% safety margin cushion throughout the trip.`,
        stationId: topPick.id
      };
    }

    const safeAny = evaluatedStations.filter(s => s.reachabilityStatus === 'SAFE' && s.isCompatible);
    if (safeAny.length > 0) {
      const topPick = safeAny[0];
      return {
        type: 'CAUTION',
        title: 'Nearest Safe Station In-Use',
        message: `${topPick.name} is reachable (${topPick.distanceKm} km away), but currently occupied. We recommend holding a 15-min reservation slot now.`,
        stationId: topPick.id
      };
    }

    return {
      type: 'ALERT',
      title: 'Critically Low Battery Alert',
      message: 'No safe charging stations reachable with current 20% safety buffer. Immediate slow charging at nearest residential 16A socket advised.',
      stationId: null
    };
  }
}

const reachabilityEngine = new ReachabilityEngine();

