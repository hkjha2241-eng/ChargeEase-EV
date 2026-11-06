/**
 * ChargeEase EV - Data Store & Vehicle Taxonomy
 * Complete Indian EV specifications, city coordinates & seed dataset.
 */

const VEHICLE_DATABASE = [
  {
    id: 'ola-s1-pro',
    name: 'Ola S1 Pro (Gen 2)',
    category: '2W',
    batteryKwh: 4.0,
    claimedRangeKm: 195,
    realWorldRangeKm: 140,
    consumptionWhPerKm: 28.57, // 4000Wh / 140km
    maxAcRateKw: 3.3,
    supportsDcFast: false,
    recommendedSocket: '16A 3-Pin Smart Socket'
  },
  {
    id: 'ather-450x',
    name: 'Ather 450X (Gen 3)',
    category: '2W',
    batteryKwh: 3.7,
    claimedRangeKm: 150,
    realWorldRangeKm: 110,
    consumptionWhPerKm: 33.64,
    maxAcRateKw: 3.3,
    supportsDcFast: true,
    recommendedSocket: '16A 3-Pin Smart Socket'
  },
  {
    id: 'tvs-iqube',
    name: 'TVS iQube ST',
    category: '2W',
    batteryKwh: 5.1,
    claimedRangeKm: 145,
    realWorldRangeKm: 125,
    consumptionWhPerKm: 40.80,
    maxAcRateKw: 3.3,
    supportsDcFast: false,
    recommendedSocket: '16A 3-Pin Smart Socket'
  },
  {
    id: 'tata-nexon-ev',
    name: 'Tata Nexon EV Long Range',
    category: '4W',
    batteryKwh: 40.5,
    claimedRangeKm: 465,
    realWorldRangeKm: 320,
    consumptionWhPerKm: 126.56, // 40500Wh / 320km
    maxAcRateKw: 7.2,
    supportsDcFast: true,
    recommendedSocket: 'Type 2 AC or CCS 2 Fast'
  },
  {
    id: 'mg-zs-ev',
    name: 'MG ZS EV Excite/Exclusive',
    category: '4W',
    batteryKwh: 50.3,
    claimedRangeKm: 461,
    realWorldRangeKm: 340,
    consumptionWhPerKm: 147.94,
    maxAcRateKw: 7.4,
    supportsDcFast: true,
    recommendedSocket: 'CCS 2 DC Fast Charger'
  },
  {
    id: 'hyundai-ioniq-5',
    name: 'Hyundai Ioniq 5',
    category: '4W',
    batteryKwh: 72.6,
    claimedRangeKm: 631,
    realWorldRangeKm: 450,
    consumptionWhPerKm: 161.33,
    maxAcRateKw: 11.0,
    supportsDcFast: true,
    recommendedSocket: 'CCS 2 DC Fast Charger'
  },
  {
    id: 'mahindra-xuv400',
    name: 'Mahindra XUV400 EV Pro',
    category: '4W',
    batteryKwh: 39.4,
    claimedRangeKm: 456,
    realWorldRangeKm: 280,
    consumptionWhPerKm: 140.71,
    maxAcRateKw: 7.2,
    supportsDcFast: true,
    recommendedSocket: 'Type 2 AC or CCS 2'
  }
];

const CITIES = {
  Bengaluru: {
    name: 'Bengaluru',
    center: [12.9716, 77.5946],
    defaultUserPos: [12.9352, 77.6245], // Koramangala
    zoom: 12
  },
  'Delhi-NCR': {
    name: 'Delhi-NCR',
    center: [28.6139, 77.2090],
    defaultUserPos: [28.5355, 77.2410], // South Delhi
    zoom: 11
  },
  Mumbai: {
    name: 'Mumbai',
    center: [19.0760, 72.8777],
    defaultUserPos: [19.0728, 72.8797], // BKC
    zoom: 12
  },
  Hyderabad: {
    name: 'Hyderabad',
    center: [17.3850, 78.4867],
    defaultUserPos: [17.4482, 78.3756], // HITEC City
    zoom: 12
  }
};

const SEED_STATIONS = [
  {
    id: 'CE-BLR-01',
    name: 'Koramangala 4th Block Smart Socket',
    hostName: 'Dr. Vikram Malhotra',
    isVerified: true,
    city: 'Bengaluru',
    address: '142, 80 Feet Road, Koramangala 4th Block, Bengaluru, KA 560034',
    lat: 12.9345,
    lng: 77.6265,
    type: '16A 3-Pin Smart Socket',
    powerKw: 3.3,
    voltage: 230,
    currentA: 15,
    vehicleTypes: ['2W', '3W', '4W'],
    tariffPerKwh: 12.50,
    parkingFee: 0,
    status: 'AVAILABLE',
    relayState: 'ON',
    rating: 4.9,
    totalSessions: 184,
    amenities: ['CCTV Monitored', 'Gated Community', 'Covered Parking', 'Restroom Access'],
    accessHours: '24/7 Public Access',
    connectorCount: 1,
    availableSlots: ['12:00 - 13:00', '13:00 - 14:00', '15:00 - 16:00', '18:00 - 19:00']
  },
  {
    id: 'CE-BLR-02',
    name: 'Indiranagar 100ft High-Power Hub',
    hostName: 'Ananya Sharma (Apartment RWA)',
    isVerified: true,
    city: 'Bengaluru',
    address: 'Plot 789, 100 Feet Rd, HAL 2nd Stage, Indiranagar, Bengaluru, KA 560038',
    lat: 12.9719,
    lng: 77.6412,
    type: 'Type 2 AC Charger',
    powerKw: 7.4,
    voltage: 230,
    currentA: 32,
    vehicleTypes: ['4W'],
    tariffPerKwh: 14.00,
    parkingFee: 20,
    status: 'AVAILABLE',
    relayState: 'ON',
    rating: 4.8,
    totalSessions: 320,
    amenities: ['Coffee Shop Nearby', 'High-Speed Wi-Fi', 'Security Guard', 'EV Air Pump'],
    accessHours: '06:00 AM - 11:00 PM',
    connectorCount: 2,
    availableSlots: ['14:00 - 15:00', '16:00 - 17:00', '17:00 - 18:00', '19:00 - 20:00']
  },
  {
    id: 'CE-BLR-03',
    name: 'Whitefield Tech Park CCS2 Fast Charger',
    hostName: 'ChargeEase Enterprise Node',
    isVerified: true,
    city: 'Bengaluru',
    address: 'ITPB Road, Whitefield Main Road, Bengaluru, KA 560066',
    lat: 12.9863,
    lng: 77.7377,
    type: 'CCS 2 DC Fast Charger',
    powerKw: 30.0,
    voltage: 400,
    currentA: 75,
    vehicleTypes: ['4W'],
    tariffPerKwh: 19.50,
    parkingFee: 30,
    status: 'IN_USE',
    relayState: 'ON',
    inUseRemainingMinutes: 18,
    rating: 4.95,
    totalSessions: 890,
    amenities: ['Mall Access', 'Food Court', 'Wheelchair Friendly', '24/7 Security'],
    accessHours: '24/7 Public Access',
    connectorCount: 2,
    availableSlots: ['13:30 - 14:30', '15:00 - 16:00', '17:30 - 18:30']
  },
  {
    id: 'CE-BLR-04',
    name: 'HSR Layout Sector 3 Solar Socket',
    hostName: 'Sunil Rao',
    isVerified: true,
    city: 'Bengaluru',
    address: '52, 14th Main Rd, Sector 3, HSR Layout, Bengaluru, KA 560102',
    lat: 12.9116,
    lng: 77.6389,
    type: '16A 3-Pin Smart Socket (100% Solar)',
    powerKw: 3.3,
    voltage: 230,
    currentA: 15,
    vehicleTypes: ['2W', '3W'],
    tariffPerKwh: 11.00,
    parkingFee: 0,
    status: 'AVAILABLE',
    relayState: 'ON',
    rating: 4.92,
    totalSessions: 142,
    amenities: ['Zero Carbon Solar Power', 'Drinking Water', 'Easy Drive-in Drive-out'],
    accessHours: '07:00 AM - 10:00 PM',
    connectorCount: 1,
    availableSlots: ['12:30 - 13:30', '14:00 - 15:00', '16:00 - 17:00']
  },
  {
    id: 'CE-DEL-01',
    name: 'Connaught Place Inner Circle Pod',
    hostName: 'Rajiv Mehra',
    isVerified: true,
    city: 'Delhi-NCR',
    address: 'Block B, Inner Circle, Connaught Place, New Delhi, DL 110001',
    lat: 28.6329,
    lng: 77.2195,
    type: 'Type 2 AC Charger',
    powerKw: 7.4,
    voltage: 230,
    currentA: 32,
    vehicleTypes: ['4W'],
    tariffPerKwh: 15.50,
    parkingFee: 40,
    status: 'AVAILABLE',
    relayState: 'ON',
    rating: 4.7,
    totalSessions: 412,
    amenities: ['Metro Station Adjacent', 'Valet Assisted', 'CCTV'],
    accessHours: '24/7 Public Access',
    connectorCount: 2,
    availableSlots: ['13:00 - 14:00', '15:00 - 16:00', '18:00 - 19:00']
  },
  {
    id: 'CE-DEL-02',
    name: 'Cyber Hub Phase 2 Fast Point',
    hostName: 'TechPark Infrastructure Pvt Ltd',
    isVerified: true,
    city: 'Delhi-NCR',
    address: 'DLF Cyber City, Phase 2, Sector 24, Gurugram, HR 122002',
    lat: 28.4950,
    lng: 77.0895,
    type: 'CCS 2 DC Fast Charger',
    powerKw: 50.0,
    voltage: 400,
    currentA: 125,
    vehicleTypes: ['4W'],
    tariffPerKwh: 21.00,
    parkingFee: 50,
    status: 'AVAILABLE',
    relayState: 'ON',
    rating: 4.9,
    totalSessions: 1240,
    amenities: ['EV Lounge', 'Starbucks Onsite', 'Fast Wi-Fi', 'Tyre Pressure Check'],
    accessHours: '24/7 Public Access',
    connectorCount: 4,
    availableSlots: ['12:00 - 13:00', '14:00 - 15:00', '16:00 - 17:00', '20:00 - 21:00']
  },
  {
    id: 'CE-DEL-03',
    name: 'Saket Residential 16A Green Socket',
    hostName: 'Pradeep Verma',
    isVerified: false,
    city: 'Delhi-NCR',
    address: 'J-Block, Saket, Near Citywalk Mall, New Delhi, DL 110017',
    lat: 28.5244,
    lng: 77.2167,
    type: '16A 3-Pin Smart Socket',
    powerKw: 3.3,
    voltage: 230,
    currentA: 15,
    vehicleTypes: ['2W', '3W', '4W'],
    tariffPerKwh: 12.00,
    parkingFee: 0,
    status: 'OFFLINE',
    relayState: 'OFF',
    rating: 4.5,
    totalSessions: 67,
    amenities: ['Residential Driveway', 'Covered Portico'],
    accessHours: '08:00 AM - 08:00 PM',
    connectorCount: 1,
    availableSlots: []
  },
  {
    id: 'CE-MUM-01',
    name: 'BKC Financial Center EV Pod',
    hostName: 'Nitin Kothari',
    isVerified: true,
    city: 'Mumbai',
    address: 'G Block, Bandra Kurla Complex, Bandra East, Mumbai, MH 400051',
    lat: 19.0657,
    lng: 72.8687,
    type: 'Type 2 AC Charger',
    powerKw: 11.0,
    voltage: 400,
    currentA: 16,
    vehicleTypes: ['4W'],
    tariffPerKwh: 16.00,
    parkingFee: 30,
    status: 'AVAILABLE',
    relayState: 'ON',
    rating: 4.88,
    totalSessions: 520,
    amenities: ['Covered Basement', '24/7 Security', 'Mobile Connectivity', 'Air Filling'],
    accessHours: '24/7 Public Access',
    connectorCount: 2,
    availableSlots: ['13:00 - 14:00', '14:30 - 15:30', '17:00 - 18:00']
  },
  {
    id: 'CE-MUM-02',
    name: 'Powai Hiranandani Community Socket',
    hostName: 'Meera Iyer',
    isVerified: true,
    city: 'Mumbai',
    address: 'Heritage Building, Hiranandani Gardens, Powai, Mumbai, MH 400076',
    lat: 19.1197,
    lng: 72.9056,
    type: '16A 3-Pin Smart Socket',
    powerKw: 3.3,
    voltage: 230,
    currentA: 15,
    vehicleTypes: ['2W', '3W'],
    tariffPerKwh: 13.00,
    parkingFee: 0,
    status: 'AVAILABLE',
    relayState: 'ON',
    rating: 4.94,
    totalSessions: 210,
    amenities: ['Gated Society', 'Visitors Parking Pass', 'Drinking Water'],
    accessHours: '06:00 AM - 10:30 PM',
    connectorCount: 1,
    availableSlots: ['12:00 - 13:00', '15:00 - 16:00', '18:00 - 19:00']
  },
  {
    id: 'CE-HYD-01',
    name: 'HITEC City Cyber Towers Fast Node',
    hostName: 'Suresh Reddy',
    isVerified: true,
    city: 'Hyderabad',
    address: 'Cyber Towers Quad, HITEC City, Madhapur, Hyderabad, TS 500081',
    lat: 17.4504,
    lng: 78.3808,
    type: 'CCS 2 DC Fast Charger',
    powerKw: 60.0,
    voltage: 400,
    currentA: 150,
    vehicleTypes: ['4W'],
    tariffPerKwh: 20.00,
    parkingFee: 25,
    status: 'AVAILABLE',
    relayState: 'ON',
    rating: 4.96,
    totalSessions: 1120,
    amenities: ['Rapid Charge Bay', 'Cafeteria', 'Restroom', 'Free Tire Air'],
    accessHours: '24/7 Public Access',
    connectorCount: 2,
    availableSlots: ['12:30 - 13:30', '14:00 - 15:00', '16:30 - 17:30']
  }
];

// Calculation Helpers
const FAIR_PRICING_BENCHMARKS = {
  '16A 3-Pin Smart Socket': {
    min: 10.00,
    max: 13.00,
    benchmarkAvg: 12.00,
    discomBaseCost: 7.20,
    hostGrossMargin: '₹4.80/kWh',
    categoryLabel: 'P2P Residential 16A Socket'
  },
  'Type 2 AC Charger': {
    min: 13.00,
    max: 16.00,
    benchmarkAvg: 14.50,
    discomBaseCost: 7.50,
    hostGrossMargin: '₹7.00/kWh',
    categoryLabel: 'Semi-Public Type 2 AC (7.4kW - 22kW)'
  },
  'CCS 2 DC Fast Charger': {
    min: 18.00,
    max: 23.00,
    benchmarkAvg: 20.00,
    discomBaseCost: 8.50,
    hostGrossMargin: '₹11.50/kWh (High Capex Amortization)',
    categoryLabel: 'Commercial DC Fast CCS2 (30kW - 60kW)'
  }
};

/**
 * Fair Pricing Evaluation
 * Benchmarks against CERC/SERC electricity base costs and fuel parity
 */
function evaluateFairPricing(tariffPerKwh, stationType) {
  let matchedKey = '16A 3-Pin Smart Socket';
  if (stationType.includes('Type 2')) matchedKey = 'Type 2 AC Charger';
  else if (stationType.includes('CCS') || stationType.includes('Fast')) matchedKey = 'CCS 2 DC Fast Charger';

  const benchmark = FAIR_PRICING_BENCHMARKS[matchedKey];
  const diffPct = Math.round(((tariffPerKwh - benchmark.benchmarkAvg) / benchmark.benchmarkAvg) * 100);

  let rating = 'FAIR_MARKET';
  let badgeLabel = 'Fair Market Price';
  let badgeClass = 'badge-emerald';

  if (tariffPerKwh < benchmark.min) {
    rating = 'VALUE_SUBSIDIZED';
    badgeLabel = `${Math.abs(diffPct)}% Below Avg (Subsidized)`;
    badgeClass = 'badge-emerald';
  } else if (tariffPerKwh > benchmark.max) {
    rating = 'PREMIUM';
    badgeLabel = `${diffPct}% Above Benchmark (Peak/Premium)`;
    badgeClass = 'badge-amber';
  } else {
    badgeLabel = `${Math.abs(diffPct)}% vs Benchmark (Fair)`;
  }

  // Running cost parity vs Petrol (₹102/L, 14 km/L -> ₹7.28/km)
  // 4W EV consumption ~ 130 Wh/km (0.13 kWh/km)
  const evCarCostPerKm = Math.round(0.13 * tariffPerKwh * 100) / 100;
  // 2W EV consumption ~ 32 Wh/km (0.032 kWh/km)
  const evScooterCostPerKm = Math.round(0.032 * tariffPerKwh * 100) / 100;
  const petrolCarCostPerKm = 7.28;
  const fuelSavingsPct = Math.round(((petrolCarCostPerKm - evCarCostPerKm) / petrolCarCostPerKm) * 100);

  return {
    tariffPerKwh,
    benchmark,
    diffPct,
    rating,
    badgeLabel,
    badgeClass,
    evCarCostPerKm,
    evScooterCostPerKm,
    fuelSavingsPct
  };
}

function calculateHaversineDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

