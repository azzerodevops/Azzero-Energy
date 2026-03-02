-- ============================================================
-- Fix reports table: add missing status and error_message columns
-- ============================================================

ALTER TABLE reports ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';
ALTER TABLE reports ADD COLUMN IF NOT EXISTS error_message text;

-- Add check constraint for valid status values
ALTER TABLE reports ADD CONSTRAINT reports_status_check
  CHECK (status IN ('pending', 'generating', 'completed', 'failed'));
