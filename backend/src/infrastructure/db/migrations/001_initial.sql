-- Drop in reverse dependency order for clean reruns
DROP TABLE IF EXISTS pool_members CASCADE;
DROP TABLE IF EXISTS pools CASCADE;
DROP TABLE IF EXISTS bank_entries CASCADE;
DROP TABLE IF EXISTS ship_compliance CASCADE;
DROP TABLE IF EXISTS routes CASCADE;

-- Routes: the foundational table
CREATE TABLE routes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id      VARCHAR(10)  NOT NULL UNIQUE,
  vessel_type   VARCHAR(50)  NOT NULL,
  fuel_type     VARCHAR(10)  NOT NULL,
  year          INTEGER      NOT NULL,
  ghg_intensity NUMERIC(8,4) NOT NULL,   -- gCO2e/MJ
  fuel_consumption NUMERIC(10,2) NOT NULL, -- tonnes
  distance      NUMERIC(10,2) NOT NULL,  -- km
  total_emissions NUMERIC(10,2) NOT NULL, -- tonnes
  is_baseline   BOOLEAN      NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Only one baseline allowed at a time
CREATE UNIQUE INDEX idx_routes_single_baseline
  ON routes (is_baseline)
  WHERE is_baseline = true;

-- Computed compliance balance snapshots
CREATE TABLE ship_compliance (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ship_id      VARCHAR(10)  NOT NULL,  -- references route_id
  year         INTEGER      NOT NULL,
  cb_gco2eq    NUMERIC(20,4) NOT NULL, -- can be very large
  computed_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (ship_id, year)
);

-- Banked surplus entries (Article 20)
CREATE TABLE bank_entries (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ship_id        VARCHAR(10)   NOT NULL,
  year           INTEGER       NOT NULL,
  amount_gco2eq  NUMERIC(20,4) NOT NULL CHECK (amount_gco2eq > 0),
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Pool registry (Article 21)
CREATE TABLE pools (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year       INTEGER     NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Pool membership with before/after CB allocations
CREATE TABLE pool_members (
  pool_id           UUID          NOT NULL REFERENCES pools(id) ON DELETE CASCADE,
  ship_id           VARCHAR(10)   NOT NULL,
  cb_before         NUMERIC(20,4) NOT NULL,
  cb_after          NUMERIC(20,4) NOT NULL,
  allocated_surplus NUMERIC(20,4) NOT NULL DEFAULT 0,
  PRIMARY KEY (pool_id, ship_id)
);
