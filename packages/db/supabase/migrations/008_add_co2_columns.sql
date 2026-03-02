-- ============================================================
-- Migration 008: Add missing columns across multiple tables
-- ============================================================
-- Apply via Supabase Dashboard → SQL Editor:
-- https://supabase.com/dashboard/project/jnxhhjjywwxdahgqgrod/sql

-- 1. scenario_results: CO2 tracking
ALTER TABLE scenario_results ADD COLUMN IF NOT EXISTS co2_baseline double precision DEFAULT 0;
ALTER TABLE scenario_results ADD COLUMN IF NOT EXISTS co2_optimized double precision DEFAULT 0;

-- 2. reports: status tracking
ALTER TABLE reports ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';
ALTER TABLE reports ADD COLUMN IF NOT EXISTS error_message text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'reports_status_check'
  ) THEN
    ALTER TABLE reports ADD CONSTRAINT reports_status_check
      CHECK (status IN ('pending', 'generating', 'completed', 'failed'));
  END IF;
END $$;

-- 3. scenarios: solver error display
ALTER TABLE scenarios ADD COLUMN IF NOT EXISTS error_message text;

-- 4. lighting_zones: relamping fields for LED analysis
ALTER TABLE lighting_zones ADD COLUMN IF NOT EXISTS lux_level double precision;
ALTER TABLE lighting_zones ADD COLUMN IF NOT EXISTS relamping_fixture_type varchar(100);
ALTER TABLE lighting_zones ADD COLUMN IF NOT EXISTS relamping_wattage double precision;
ALTER TABLE lighting_zones ADD COLUMN IF NOT EXISTS relamping_fixture_count integer;
