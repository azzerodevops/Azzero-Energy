-- Add error_message column to scenarios table
-- Stores user-facing error details when optimization fails
ALTER TABLE scenarios ADD COLUMN IF NOT EXISTS error_message TEXT;

-- Clear error_message when status changes away from 'failed'
COMMENT ON COLUMN scenarios.error_message IS 'Italian-language error message shown to users when optimization fails';
