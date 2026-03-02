-- ============================================================
-- AzzeroCO2 Energy - Schema Fixes
-- Aligns SQL schema with Drizzle ORM definitions and app code
-- Run AFTER the previous migrations (000-003)
-- ============================================================

-- 1. Add missing 'notes' column to demands table
ALTER TABLE demands ADD COLUMN IF NOT EXISTS notes TEXT;

-- 2. Add missing 'capacity_unit' column to technology_catalog
ALTER TABLE technology_catalog ADD COLUMN IF NOT EXISTS capacity_unit VARCHAR(20);

-- 3. Add 'pptx' to report_format enum (needed by optimizer export)
DO $$ BEGIN
  ALTER TYPE report_format ADD VALUE IF NOT EXISTS 'pptx';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 4. Add unique constraint on scenario_tech_configs(scenario_id, technology_id)
-- Required for the upsert operation in the scenarios server action
DO $$ BEGIN
  ALTER TABLE scenario_tech_configs
    ADD CONSTRAINT scenario_tech_configs_scenario_id_technology_id_unique
    UNIQUE (scenario_id, technology_id);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;
