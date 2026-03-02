-- ============================================================================
-- Migration 006: Fix Schema Gaps Found by User Simulation Testing
-- Date: 2026-03-02
-- Description: Adds missing columns, enum values, and CHECK constraints
--              that were defined in Drizzle ORM schema but never migrated.
-- ============================================================================

-- 1. Add error_message column to scenarios (CRITICAL - blocks optimizer)
ALTER TABLE public.scenarios ADD COLUMN IF NOT EXISTS error_message text;

-- 2. Add notes column to demands
ALTER TABLE public.demands ADD COLUMN IF NOT EXISTS notes text;

-- 3. Add missing profile_type enum values
DO $$ BEGIN
  ALTER TYPE profile_type ADD VALUE IF NOT EXISTS 'commercial';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE profile_type ADD VALUE IF NOT EXISTS 'residential';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 4. CHECK constraints for data validation
ALTER TABLE public.demands
  ADD CONSTRAINT chk_consumption_positive
  CHECK (annual_consumption_mwh IS NULL OR annual_consumption_mwh::numeric >= 0);

ALTER TABLE public.analysis_resources
  ADD CONSTRAINT chk_price_not_negative
  CHECK (buying_price IS NULL OR buying_price::numeric >= 0);

ALTER TABLE public.analyses
  ADD CONSTRAINT chk_wacc_range
  CHECK (wacc IS NULL OR (wacc::numeric >= 0 AND wacc::numeric <= 1));

ALTER TABLE public.analyses
  ADD CONSTRAINT chk_year_range
  CHECK (year >= 2000 AND year <= 2100);

ALTER TABLE public.scenarios
  ADD CONSTRAINT chk_co2_target_range
  CHECK (co2_target IS NULL OR (co2_target::numeric >= 0 AND co2_target::numeric <= 1));

-- 5. Fix stuck scenarios (reset "running" to "draft")
UPDATE public.scenarios SET status = 'draft' WHERE status = 'running';

-- 6. Fix invalid test data (negative consumption values)
UPDATE public.demands SET annual_consumption_mwh = 0
  WHERE annual_consumption_mwh::numeric < 0;

-- 7. Add HEAT_HIGH_T output to Caldaia a gas (missing - critical for industrial use)
INSERT INTO public.tech_outputs (technology_id, end_use, conversion_factor)
SELECT '7ab7e250-e18f-4ce8-858c-597433c3cb63', 'HEAT_HIGH_T', 0.90
WHERE NOT EXISTS (
  SELECT 1 FROM public.tech_outputs
  WHERE technology_id = '7ab7e250-e18f-4ce8-858c-597433c3cb63'
    AND end_use = 'HEAT_HIGH_T'
);

-- 8. Add HEAT_HIGH_T output to CHP (missing - critical for industrial use)
INSERT INTO public.tech_outputs (technology_id, end_use, conversion_factor)
SELECT '47b42872-8983-4416-8626-0db7949dfc8d', 'HEAT_HIGH_T', 0.20
WHERE NOT EXISTS (
  SELECT 1 FROM public.tech_outputs
  WHERE technology_id = '47b42872-8983-4416-8626-0db7949dfc8d'
    AND end_use = 'HEAT_HIGH_T'
);

-- 9. Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';

-- ============================================================================
-- VERIFICATION QUERIES (run after migration to check)
-- ============================================================================
-- SELECT column_name FROM information_schema.columns WHERE table_name='scenarios' AND column_name='error_message';
-- SELECT column_name FROM information_schema.columns WHERE table_name='demands' AND column_name='notes';
-- SELECT unnest(enum_range(NULL::profile_type));
-- SELECT conname FROM pg_constraint WHERE conrelid = 'demands'::regclass;
