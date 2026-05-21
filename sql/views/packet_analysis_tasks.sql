-- atlas:import ../tables/async_tasks.sql

-- Filtered view of async_tasks showing only packet_analysis type tasks.
-- Created by migration 002b.

CREATE OR REPLACE VIEW packet_analysis_tasks AS
SELECT
  id,
  status,
  progress,
  result,
  error,
  created_at,
  updated_at,
  metadata,
  user_id
FROM async_tasks
WHERE task_type = 'packet_analysis';

COMMENT ON VIEW packet_analysis_tasks IS 'Filtered view of async_tasks showing only packet_analysis type tasks. Used by the packet review UI to poll task status.';
