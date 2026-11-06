/**
 * ChargeEase EV - Unified Backend Server & API Gateway
 * Zero external dependencies: Uses native Node.js standard libraries.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = __dirname;

// In-Memory Database Store for demo/hackathon session
const database = {
  stations: [
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
      status: 'AVAILABLE', // AVAILABLE, IN_USE, OFFLINE
      relayState: 'ON', // Hardware relay switch state
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
  ],
  wallet: {
    balance: 840.00,
    currency: 'INR',
    transactions: [
      {
        id: 'TXN-9021',
        type: 'CREDIT',
        title: 'UPI Top-up (Google Pay)',
        amount: 500.00,
        date: '2026-11-05T18:32:00.000Z',
        reference: 'UPI/6382910281/SBIN'
      },
      {
        id: 'TXN-8842',
        type: 'DEBIT',
        title: 'Charging Session @ Koramangala 4th Block',
        amount: 86.25,
        energyKwh: 6.9,
        date: '2026-11-04T14:15:00.000Z',
        reference: 'CE-SESSION-4821'
      },
      {
        id: 'TXN-8510',
        type: 'CREDIT',
        title: 'UPI Top-up (PhonePe)',
        amount: 1000.00,
        date: '2026-11-01T09:20:00.000Z',
        reference: 'UPI/9920182736/HDFC'
      }
    ]
  },
  reservations: [
    {
      id: 'RES-8921',
      stationId: 'CE-BLR-01',
      stationName: 'Koramangala 4th Block Smart Socket',
      slotTime: '13:00 - 14:00',
      date: 'Today',
      code: 'CE-8921',
      status: 'ACTIVE',
      lockExpiresAt: Date.now() + 14 * 60 * 1000 // 14 mins left
    }
  ],
  hostDashboard: {
    hostId: 'HOST-USR-49',
    hostName: 'Dr. Vikram Malhotra',
    ownedStationId: 'CE-BLR-01',
    todayEarnings: 462.50,
    monthlyEarnings: 12480.00,
    totalUnitsDispensedKwh: 998.4,
    activeSessionsCount: 0,
    overallRating: 4.9,
    relayHardwareOnline: true
  }
};

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon'
};

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  });
  res.end(JSON.stringify(data));
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
      if (body.length > 1e6) {
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  // Enable CORS Preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end();
    return;
  }

  // --- API ROUTING ---
  try {
    if (pathname === '/api/health') {
      sendJson(res, 200, { status: 'healthy', app: 'ChargeEase EV', timestamp: new Date().toISOString() });
      return;
    }

    // GET /api/stations
    if (pathname === '/api/stations' && method === 'GET') {
      sendJson(res, 200, {
        success: true,
        count: database.stations.length,
        stations: database.stations
      });
      return;
    }

    // POST /api/stations (Host Onboard Wizard)
    if (pathname === '/api/stations' && method === 'POST') {
      const body = await parseJsonBody(req);
      const newStation = {
        id: `CE-${(body.city || 'BLR').substring(0, 3).toUpperCase()}-${String(database.stations.length + 1).padStart(2, '0')}`,
        name: body.name || 'P2P Private Socket',
        hostName: body.hostName || 'Verified Host',
        isVerified: true,
        city: body.city || 'Bengaluru',
        address: body.address || 'Local Street Address',
        lat: parseFloat(body.lat) || 12.9716,
        lng: parseFloat(body.lng) || 77.5946,
        type: body.type || '16A 3-Pin Smart Socket',
        powerKw: parseFloat(body.powerKw) || 3.3,
        voltage: parseInt(body.voltage) || 230,
        currentA: parseInt(body.currentA) || 15,
        vehicleTypes: body.vehicleTypes || ['2W', '3W', '4W'],
        tariffPerKwh: parseFloat(body.tariffPerKwh) || 12.00,
        parkingFee: parseFloat(body.parkingFee) || 0,
        status: 'AVAILABLE',
        relayState: 'ON',
        rating: 5.0,
        totalSessions: 0,
        amenities: body.amenities || ['Covered Parking', '24/7 Access'],
        accessHours: body.accessHours || '24/7 Public Access',
        connectorCount: 1,
        availableSlots: ['10:00 - 11:00', '12:00 - 13:00', '14:00 - 15:00', '16:00 - 17:00']
      };
      database.stations.unshift(newStation);
      sendJson(res, 201, { success: true, message: 'Station onboarded successfully', station: newStation });
      return;
    }

    // POST /api/stations/:id/toggle (Hardware Relay Remote Switch)
    if (pathname.startsWith('/api/stations/') && pathname.endsWith('/toggle') && method === 'POST') {
      const parts = pathname.split('/');
      const stationId = parts[3];
      const station = database.stations.find(s => s.id === stationId);
      if (!station) {
        sendJson(res, 404, { success: false, error: 'Station not found' });
        return;
      }
      station.relayState = station.relayState === 'ON' ? 'OFF' : 'ON';
      station.status = station.relayState === 'ON' ? 'AVAILABLE' : 'OFFLINE';
      sendJson(res, 200, {
        success: true,
        stationId: station.id,
        relayState: station.relayState,
        status: station.status,
        timestamp: new Date().toISOString()
      });
      return;
    }

    // POST /api/reserve (15-min Lock Slot)
    if (pathname === '/api/reserve' && method === 'POST') {
      const body = await parseJsonBody(req);
      const station = database.stations.find(s => s.id === body.stationId);
      if (!station) {
        sendJson(res, 404, { success: false, error: 'Station not found' });
        return;
      }
      const reservationId = `RES-${Math.floor(1000 + Math.random() * 9000)}`;
      const reservation = {
        id: reservationId,
        stationId: station.id,
        stationName: station.name,
        slotTime: body.slotTime || '14:00 - 15:00',
        date: body.date || 'Today',
        code: `PASS-${Math.floor(100000 + Math.random() * 900000)}`,
        status: 'ACTIVE',
        lockExpiresAt: Date.now() + 15 * 60 * 1000 // 15 mins lock guarantee
      };
      database.reservations.unshift(reservation);
      sendJson(res, 201, { success: true, reservation });
      return;
    }

    // GET /api/wallet
    if (pathname === '/api/wallet' && method === 'GET') {
      sendJson(res, 200, { success: true, wallet: database.wallet });
      return;
    }

    // POST /api/wallet/topup
    if (pathname === '/api/wallet/topup' && method === 'POST') {
      const body = await parseJsonBody(req);
      const amount = parseFloat(body.amount);
      if (isNaN(amount) || amount <= 0) {
        sendJson(res, 400, { success: false, error: 'Invalid top-up amount' });
        return;
      }
      database.wallet.balance += amount;
      const newTxn = {
        id: `TXN-${Math.floor(1000 + Math.random() * 9000)}`,
        type: 'CREDIT',
        title: `UPI Top-up (${body.provider || 'UPI'})`,
        amount: amount,
        date: new Date().toISOString(),
        reference: `UPI/${Math.floor(1000000000 + Math.random() * 9000000000)}/AXIS`
      };
      database.wallet.transactions.unshift(newTxn);
      sendJson(res, 200, { success: true, balance: database.wallet.balance, transaction: newTxn });
      return;
    }

    // POST /api/charge/complete (Deduct wallet & register invoice)
    if (pathname === '/api/charge/complete' && method === 'POST') {
      const body = await parseJsonBody(req);
      const totalAmount = parseFloat(body.totalAmount) || 0;
      const energyKwh = parseFloat(body.energyKwh) || 0;
      const stationName = body.stationName || 'ChargeEase Station';

      // Deduct balance
      database.wallet.balance = Math.max(0, database.wallet.balance - totalAmount);
      const debitTxn = {
        id: `TXN-${Math.floor(1000 + Math.random() * 9000)}`,
        type: 'DEBIT',
        title: `Charging Session @ ${stationName}`,
        amount: totalAmount,
        energyKwh: energyKwh,
        date: new Date().toISOString(),
        reference: `INV-${Math.floor(100000 + Math.random() * 900000)}`
      };
      database.wallet.transactions.unshift(debitTxn);

      // Increment Host earnings
      database.hostDashboard.todayEarnings += totalAmount * 0.85; // 85% payout to host
      database.hostDashboard.monthlyEarnings += totalAmount * 0.85;
      database.hostDashboard.totalUnitsDispensedKwh += energyKwh;

      sendJson(res, 200, {
        success: true,
        remainingBalance: database.wallet.balance,
        transaction: debitTxn,
        invoiceNumber: debitTxn.reference
      });
      return;
    }

    // GET /api/host
    if (pathname === '/api/host' && method === 'GET') {
      sendJson(res, 200, { success: true, host: database.hostDashboard });
      return;
    }
  } catch (err) {
    console.error('API Error:', err);
    sendJson(res, 500, { success: false, error: 'Internal server error' });
    return;
  }

  // --- STATIC FILE SERVING ---
  let safePath = path.normalize(decodeURIComponent(pathname)).replace(/^(\.\.[\/\\])+/, '');
  if (safePath === '/' || safePath === '\\') {
    safePath = '/index.html';
  }

  const filePath = path.join(PUBLIC_DIR, safePath);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // 404 Fallback to index.html for SPA feel or 404
      if (ext === '' || ext === '.html') {
        const indexPath = path.join(PUBLIC_DIR, 'index.html');
        fs.readFile(indexPath, (readErr, content) => {
          if (readErr) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(content);
          }
        });
        return;
      }
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Internal Server Error');
        return;
      }
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    });
  });
});

server.listen(PORT, () => {
  console.log('====================================================');
  console.log('   CHARGEEASE EV - INTELLIGENT P2P EV CHARGING OS   ');
  console.log('====================================================');
  console.log(` Server active on: http://localhost:${PORT}`);
  console.log(` Driver & Host Dual-Mode API Gateway Ready`);
  console.log(` Zero external dependencies. Production Grade.`);
  console.log('====================================================');
});

