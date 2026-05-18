-- Extend inspections table with global_observations and areas_inspected
ALTER TABLE inspections
ADD COLUMN IF NOT EXISTS global_observations text[],
ADD COLUMN IF NOT EXISTS areas_inspected text[];
