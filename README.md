# ChargeEase EV
### Intelligent Peer-to-Peer Electric Vehicle Charging Ecosystem & Telemetry OS

**ChargeEase EV** is an enterprise-grade, reachability-aware P2P electric vehicle charging platform engineered for high-density metropolitan ecosystems across India (Bengaluru, Delhi-NCR, Mumbai, and Hyderabad).

Built with precision aesthetic principles inspired by Apple and Uber design systems, ChargeEase EV features a dark-graphite palette, modular component architecture, and zero runtime package bloat.

---

## Key Highlights

- **Web App URL:** [http://localhost:3000](http://localhost:3000)
- **Zero External Dependencies:** Built entirely with native Node.js and standard web primitives (Web Audio API, Leaflet, ES6 Modules).
- **Dual Mode System:** Seamlessly switches between **Driver Mode** and **Host Console**.
- **Hackathon Level Engineering:** Clean, modular codebase structured for code reviews, hackathon presentations, and live demos.

---

## Architecture & System Design

```
ChargeEase EV System
│
├── Presentation Layer (Vanilla ES6 Modules + CSS3 System)
│   ├── index.html            Semantic Apple/Uber responsive shell
│   ├── css/main.css          Graphite design tokens & typographic hierarchy
│   ├── css/components.css    Cards, search, drawers, modals, filter chips
│   ├── css/map.css           Leaflet dark-matter pins & reachability overlays
│   ├── css/telemetry.css     Circular SVG gauge & itemized tax billing
│   └── css/host.css          Hardware relay toggle & host analytics
│
├── Client Logic Modules
│   ├── js/app.js             Application orchestrator & tab routing
│   ├── js/reachability.js    Range & 20% safety cushion mathematical engine
│   ├── js/telemetry.js       CC/CV curve simulator & telemetry cockpit
│   ├── js/map.js             Leaflet controller & SVG hardware pins
│   ├── js/reservation.js     15-minute slot lock protection manager
│   ├── js/wallet.js          Digital ledger & mock UPI payment gateway
│   ├── js/host.js            Smart contactor relay controller
│   ├── js/audio.js           Web Audio API synthesizer (acoustic haptics)
│   ├── js/icons.js           Precision SVG vector icon library (Zero emojis)
│   └── js/data.js            Indian EV specifications & city datasets
│
└── Backend Gateway Layer (Node.js Native HTTP Gateway)
    └── server.js             RESTful API endpoints + static file delivery
```

---

## Core Capabilities & Features

### 1. Dual Mode Switcher: Driver & Host
- **Driver Mode:** Real-time charging node discovery, battery-aware reachability calculations, physical QR viewfinder simulation, telemetry monitoring, and wallet settlements.
- **Host Console:** Monetize private residential 16A sockets or dedicated chargers, view live payouts, remotely toggle physical hardware contactor relays, configure dynamic tariffs, and onboard new sockets.

### 2. Reachability-Aware Range Matcher (Core Innovation)
Conventional EV apps route users to the nearest charger geometrically, which often strands drivers in bumper-to-bumper traffic or hilly terrains. ChargeEase EV solves this with an intelligent reachability algorithm:
- Real-world consumption calculations across popular Indian EVs:
  - **Ola S1 Pro Gen 2:** 4.0 kWh pack | 28.57 Wh/km
  - **Ather 450X Gen 3:** 3.7 kWh pack | 33.64 Wh/km
  - **TVS iQube ST:** 5.1 kWh pack | 40.80 Wh/km
  - **Tata Nexon EV Long Range:** 40.5 kWh pack | 126.56 Wh/km
  - **MG ZS EV:** 50.3 kWh pack | 147.94 Wh/km
  - **Hyundai Ioniq 5:** 72.6 kWh pack | 161.33 Wh/km
  - **Mahindra XUV400 EV:** 39.4 kWh pack | 140.71 Wh/km
- **20% Safety Margin Cushion:** Dynamically calculates usable battery vs. reserve cushion.
- **Dynamic Leaflet Visualizer:** Draws a live emerald reachability circle and amber warning boundary around the vehicle's position.
- **Advisory Engine:** Classifies all network nodes as **Reachable with Buffer**, **Buffer at Risk**, or **Beyond Safe Range**.

### 3. Scan, Pay & Charge Experience
- Visual camera viewfinder simulation with animated laser reticle.
- Instant connection via Station ID (e.g., `CE-BLR-01`, `CE-DEL-02`).
- 5-step hardware handshake protocol verification (Connecting -> Protocol Handshake -> Connector Lock -> Earth-Fault Safety Check -> Energize Relay).

### 4. Real-Time Telemetry OS Cockpit
- High-resolution SVG circular progress ring gauge.
- Tabular telemetry metrics: State of Charge (%), Instantaneous Power (kW), Grid Voltage (V), Alternating Current (A), Total Dispensed Energy (kWh), Live Cost (INR), and Elapsed Duration.
- Realistic CC/CV battery kinetics (Constant Current bulk phase up to 80%, linear Constant Voltage taper above 80%).
- Real-time CO2 emissions avoided counter based on Indian power grid displacement factor ($0.82 \text{ kg CO}_2 / \text{kWh}$).

### 5. 15-Minute Slot Lock Guarantee
- Select 1-hour booking windows at any network node.
- Automated 15-minute anti-stranding lock protection with real-time countdown timer.
- Cryptographic booking pass code (e.g., `PASS-8921`) for host gate clearance.

### 6. P2P Host Hardware Remote Relay Switch
- Remote control of physical smart contactors via IoT API endpoint (`POST /api/stations/:id/toggle`).
- Mechanical relay audio feedback powered by the Web Audio API.
- Instant network status updates (switching off isolates node from grid and marks it offline).

### 7. Digital Wallet & UPI Engine
- Stored-value in-app wallet with one-click top-up presets (₹200, ₹500, ₹1,000, ₹2,000).
- Mock integration with Google Pay, PhonePe, Paytm, and BHIM UPI.
- Complete transaction ledger tracking credits and automated session deductions.

### 8. Itemized GST Tax Invoice
- Official tax invoice generated on session completion.
- Breakdown: Energy Charges, ChargeEase Platform Fee, Host Parking Fee, CGST (9%), and SGST (9%).
- Certified environmental savings stamp and PDF export simulation.

---

## API Specifications

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check and server status |
| `GET` | `/api/stations` | Retrieve all charging nodes with coordinates & live status |
| `POST` | `/api/stations` | Onboard a new socket or charger |
| `POST` | `/api/stations/:id/toggle` | Remote hardware relay switch (ON / OFF) |
| `POST` | `/api/reserve` | Create a 15-minute slot lock reservation |
| `POST` | `/api/charge/complete` | Settle charging session and deduct wallet |
| `GET` | `/api/wallet` | Fetch wallet balance and transaction ledger |
| `POST` | `/api/wallet/topup` | Add funds via mock UPI |
| `GET` | `/api/host` | Fetch host earnings and hardware telemetry |

---

## Quick Start & Verification

### Running with Node.js
```bash
# Start server
node server.js
# or
npm start
```
Access the application in any modern browser at:
**[http://localhost:3000](http://localhost:3000)**

### Standalone Browser Execution
`index.html` is fully self-contained with offline fallbacks. You can double-click `index.html` to run locally without a server.

