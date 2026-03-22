# FuelEU Maritime Compliance Platform

A full-stack compliance dashboard implementing the FuelEU Maritime
Regulation (EU 2023/1805). Ships sailing EU waters must meet annual
GHG intensity targets — this platform tracks, calculates, and manages
their compliance balance (CB), banking surplus (Article 20), and
pooling arrangements (Article 21).

---

## Architecture Summary

This project follows **Hexagonal Architecture** (Ports & Adapters /
Clean Architecture) strictly on both frontend and backend.

### Core Principle

The dependency rule is enforced at every layer:

```
Inbound Adapters → Application (Use-Cases) → Domain
                                    ↑
                              Outbound Adapters
                         (implement port interfaces)
```

The `core/` directory has zero knowledge of Express, PostgreSQL,
React, or Axios. It contains only TypeScript interfaces, pure
functions, and use-case orchestrators. This means every use-case can
be unit-tested without spinning up a database or HTTP server.

### Backend Structure

```
backend/src/
├── core/
│   ├── domain/          # Entities + value objects (pure TS)
│   │   ├── Route.ts
│   │   ├── ComplianceTarget.ts  ← CB formula lives here
│   │   ├── ShipCompliance.ts
│   │   ├── BankEntry.ts
│   │   ├── Pool.ts
│   │   └── PoolMember.ts
│   ├── application/     # Use-cases (orchestrate domain + ports)
│   │   ├── ComputeCB.ts
│   │   ├── SetBaseline.ts
│   │   ├── CompareRoutes.ts
│   │   ├── BankSurplus.ts
│   │   ├── ApplyBanked.ts
│   │   └── CreatePool.ts
│   └── ports/           # Repository interfaces (no implementation)
│       ├── RouteRepository.ts
│       ├── ComplianceRepository.ts
│       ├── BankRepository.ts
│       └── PoolRepository.ts
├── adapters/
│   ├── inbound/http/    # Express controllers (parse → use-case → respond)
│   └── outbound/postgres/ # pg implementations of repository ports
├── infrastructure/
│   ├── db/              # Migrations, seeds, pg pool
│   └── server/          # Express app factory, error middleware, entry point
└── shared/
    └── errors.ts        # Domain error types
```

### Frontend Structure

```
frontend/src/
├── core/
│   ├── domain/          # TS types only (no React)
│   ├── application/     # React hooks (useRoutes, useBanking, etc.)
│   └── ports/
│       └── ApiPort.ts   # Interface for all API calls
├── adapters/
│   ├── ui/              # React tab components
│   └── infrastructure/  # HttpApiAdapter (only place axios lives)
├── infrastructure/
│   └── api/
│       └── apiClient.ts # Singleton adapter instance
└── shared/
    └── components/      # Badge, KpiCard, ErrorBanner, LoadingSpinner
```

### Core Formula

```
Energy in Scope (MJ)  = fuelConsumption (t) × 41,000 MJ/t
Compliance Balance    = (Target − Actual GHG Intensity) × Energy
Target (2025)         = 89.3368 gCO₂e/MJ

Positive CB → Surplus
Negative CB → Deficit
```

---

## Setup & Run Instructions

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm 9+

### 1. Clone and install

```bash
git clone <your-repo-url>
cd fueleu-maritime

# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 2. Configure environment

**Backend** — create `backend/.env`:
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/fueleu
PORT=3001
NODE_ENV=development
```

**Backend test** — create `backend/.env.test`:
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/fueleu_test
PORT=3002
NODE_ENV=test
```

**Frontend** — create `frontend/.env`:
```env
VITE_API_URL=http://localhost:3001
```

### 3. Create databases

```sql
CREATE DATABASE fueleu;
CREATE DATABASE fueleu_test;
```

### 4. Run migrations and seed

```bash
cd backend
npm run migrate   # creates all 5 tables
npm run seed      # inserts R001–R005, sets R001 as baseline
```

### 5. Start the servers

```bash
# Terminal 1 — backend
cd backend && npm run dev

# Terminal 2 — frontend
cd frontend && npm run dev
```

Backend runs at `http://localhost:3001`
Frontend runs at `http://localhost:5173`

---

## API Reference

### Routes

```
GET  /routes                         List all routes (filterable)
GET  /routes?vesselType=Container    Filter by vessel type
GET  /routes?fuelType=LNG            Filter by fuel type
GET  /routes?year=2024               Filter by year
GET  /routes/comparison              Baseline vs all routes
POST /routes/:routeId/baseline       Set a new baseline route
```

### Compliance

```
GET  /compliance/cb?shipId=R002&year=2024
     Compute and store CB for a ship/year

GET  /compliance/adjusted-cb?shipId=R002&year=2024
     CB after applying banked surplus
```

### Banking (Article 20)

```
GET  /banking/records?shipId=R002&year=2024
     View all bank entries and total banked

POST /banking/bank
     Body: { shipId, year, amount }
     Bank a positive CB surplus

POST /banking/apply
     Body: { shipId, year, amount }
     Apply banked surplus to a deficit
```

### Pooling (Article 21)

```
POST /pools
     Body: { year, memberShipIds: string[] }
     Create a pool with greedy CB allocation
```

### Sample Requests & Responses

**Compute CB for surplus ship R002:**
```bash
curl "http://localhost:3001/compliance/cb?shipId=R002&year=2024"
```
```json
{
  "data": {
    "shipId": "R002",
    "year": 2024,
    "cbGco2eq": 263082240,
    "isSurplus": true,
    "ghgIntensity": 88,
    "energyInScope": 196800000
  }
}
```

**Bank 100,000 gCO₂eq from R002:**
```bash
curl -X POST http://localhost:3001/banking/bank \
  -H "Content-Type: application/json" \
  -d '{"shipId":"R002","year":2024,"amount":100000}'
```
```json
{
  "data": {
    "shipId": "R002",
    "year": 2024,
    "amountBanked": 100000,
    "totalBanked": 100000,
    "cbRemaining": 263082240
  }
}
```

**Create a pool (R002 surplus covers R001 deficit):**
```bash
curl -X POST http://localhost:3001/pools \
  -H "Content-Type: application/json" \
  -d '{"year":2024,"memberShipIds":["R001","R002"]}'
```
```json
{
  "data": {
    "poolId": "3f2a...",
    "year": 2024,
    "poolSum": -77873760,
    "members": [
      { "shipId": "R001", "cbBefore": -340956000, "cbAfter": 0, "allocatedSurplus": 340956000 },
      { "shipId": "R002", "cbBefore": 263082240, "cbAfter": 0, "allocatedSurplus": 0 }
    ]
  }
}
```

---

## How to Execute Tests

### Unit tests (no database required)

```bash
cd backend
npx jest src/__tests__/unit --verbose
```

### Integration tests (requires PostgreSQL running)

```bash
cd backend
npx jest src/__tests__/integration --verbose --runInBand
```

`--runInBand` is required — integration tests share a database
connection and must not run in parallel.

### All tests with coverage

```bash
cd backend
npm run test -- --coverage
```

### What is tested

| Suite | Count | Type |
|---|---|---|
| ComputeCB | 5 | Unit |
| CompareRoutes | 6 | Unit |
| BankSurplus | 6 | Unit |
| ApplyBanked | 6 | Unit |
| CreatePool | 7 | Unit |
| Routes API | 7 | Integration |
| Compliance API | 5 | Integration |
| Banking API | 8 | Integration |
| Pools API | 6 | Integration |

---

## Seed Data

| Ship | Vessel | Fuel | Year | GHG Intensity | vs Target | Status |
|---|---|---|---|---|---|---|
| R001 | Container | HFO | 2024 | 91.00 | +1.66 | ❌ Deficit (baseline) |
| R002 | BulkCarrier | LNG | 2024 | 88.00 | −1.34 | ✅ Surplus |
| R003 | Tanker | MGO | 2024 | 93.50 | +4.16 | ❌ Deficit |
| R004 | RoRo | HFO | 2025 | 89.20 | −0.14 | ✅ Surplus (tiny) |
| R005 | Container | LNG | 2025 | 90.50 | +1.16 | ❌ Deficit |

Target: **89.3368 gCO₂e/MJ** (2% below 91.16 per EU 2023/1805 Annex IV)

---

## Screenshots

**Routes Tab** — filterable table with GHG intensity colour-coded
green/red vs target. Set Baseline button triggers `POST /routes/:id/baseline`.

**Compare Tab** — bar chart with EU target reference line. Bars are
green (compliant) or red (non-compliant). Table shows % diff vs
baseline and ✅/❌ status per route.

**Banking Tab** — KPI cards showing current CB, total banked, and
GHG intensity. Bank and Apply actions are disabled when the relevant
balance is zero. Bank history table shows all entries with FIFO
deduction.

**Pooling Tab** — ship selector with toggle buttons. "Load CBs"
fetches adjusted CB per ship. Pool Sum indicator turns green/red
based on validity. "Create Pool" is disabled when pool sum < 0.
After creation, shows before/after CB per member.

---

## Reference

Fuel EU Maritime Regulation (EU) 2023/1805
- Annex IV — GHG intensity calculation methodology
- Article 20 — Banking of compliance surplus
- Article 21 — Pooling of compliance balance
