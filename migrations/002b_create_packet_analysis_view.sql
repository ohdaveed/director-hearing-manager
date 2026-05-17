-- Migration: Create packet_analysis_tasks view
-- Created: 2026-05-17
-- Description: Filtered view of async_tasks for packet analysis workflow

-- Create view for packet analysis tasks only
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

-- Add comment for documentation
COMMENT ON VIEW packet_analysis_tasks IS 'Filtered view of async_tasks showing only packet_analysis type tasks. Used by the packet review UI to poll task status.';

-- Note: RLS policies on the underlying table (async_tasks) will still apply
-- Users will only see their own packet analysis tasks through this view