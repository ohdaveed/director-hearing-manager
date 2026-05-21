-- atlas:import ../types/enum_locations_facility_type.sql

CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  address TEXT,
  legacy_location_id TEXT,  -- renamed from location_id in 004
  owner_name TEXT,
  owner_address TEXT,
  owner_phone TEXT,
  owner_email TEXT,
  facility_type locations_facility_type_enum,
  number_of_units NUMERIC,
  number_of_rooms NUMERIC,
  healthy_housing BOOLEAN,
  census_tract TEXT,
  current_fees NUMERIC(10,2),
  inspections TEXT,
  arrizon_open_complaint_inspections_list_1 TEXT,
  block_lot TEXT,
  dba TEXT,
  management_name TEXT,
  responsible_party TEXT,
  responsible_party_phone TEXT,
  responsible_party_email TEXT,
  building_features TEXT[],
  verification_date DATE,
  imported_reports TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);
