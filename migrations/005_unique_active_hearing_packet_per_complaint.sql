-- Ensure each complaint has at most one active Director's Hearing Packet.
-- Soft-deleted packets are excluded so cases can be recreated after deletion.

CREATE UNIQUE INDEX IF NOT EXISTS idx_packets_unique_active_complaint_id
  ON hearing_packets (complaint_id)
  WHERE complaint_id IS NOT NULL AND deleted_at IS NULL;