-- Clear existing data
TRUNCATE routes CASCADE;

INSERT INTO routes
  (route_id, vessel_type, fuel_type, year, ghg_intensity,
   fuel_consumption, distance, total_emissions, is_baseline)
VALUES
  ('R001', 'Container',   'HFO', 2024, 91.0,  5000, 12000, 4500, true),
  ('R002', 'BulkCarrier', 'LNG', 2024, 88.0,  4800, 11500, 4200, false),
  ('R003', 'Tanker',      'MGO', 2024, 93.5,  5100, 12500, 4700, false),
  ('R004', 'RoRo',        'HFO', 2025, 89.2,  4900, 11800, 4300, false),
  ('R005', 'Container',   'LNG', 2025, 90.5,  4950, 11900, 4400, false);
