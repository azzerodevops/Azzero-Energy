-- ============================================
-- AzzeroCO2 Energy - Schema Completo
-- Esegui questo file nel SQL Editor di Supabase
-- Dashboard → SQL Editor → New Query → Incolla → Run
-- ============================================

-- ============================================
-- 1. ENUMS
-- ============================================

DO $$ BEGIN
  CREATE TYPE organization_plan AS ENUM ('free', 'pro', 'enterprise');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'editor', 'viewer');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE analysis_status AS ENUM ('draft', 'ready', 'calculated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE end_use AS ENUM ('ELECTRICITY', 'HEAT_HIGH_T', 'HEAT_MED_T', 'HEAT_LOW_T', 'COLD');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE profile_type AS ENUM ('nace_default', 'custom', 'upload');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE resource_type AS ENUM ('electricity', 'natural_gas', 'biomass', 'diesel', 'lpg', 'solar', 'wind', 'hydrogen');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE storage_type AS ENUM ('battery_lion', 'thermal_hot', 'thermal_cold');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE scenario_status AS ENUM ('draft', 'queued', 'running', 'completed', 'failed', 'outdated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE objective AS ENUM ('cost', 'decarbonization');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE report_format AS ENUM ('pdf', 'docx', 'xlsx', 'pptx');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE subscription_status AS ENUM ('active', 'cancelled', 'past_due', 'trialing');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- 2. TABELLE
-- ============================================

-- Organizations
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  logo_url TEXT,
  plan organization_plan NOT NULL DEFAULT 'free',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Users (ID matches Supabase Auth user ID)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255),
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User <-> Organization (many-to-many)
CREATE TABLE IF NOT EXISTS user_organizations (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'viewer',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, organization_id)
);

-- Sites
CREATE TABLE IF NOT EXISTS sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  address VARCHAR(500),
  city VARCHAR(255),
  province VARCHAR(100),
  country VARCHAR(100) DEFAULT 'Italia',
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  nace_code VARCHAR(10),
  sector VARCHAR(255),
  employees INTEGER,
  area_sqm NUMERIC(12, 2),
  roof_area_sqm NUMERIC(12, 2),
  operating_hours INTEGER,
  working_days JSONB,
  satellite_image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Analyses
CREATE TABLE IF NOT EXISTS analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  year INTEGER NOT NULL,
  wacc NUMERIC(5, 4),
  status analysis_status NOT NULL DEFAULT 'draft',
  wizard_completed BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Energy demands
CREATE TABLE IF NOT EXISTS demands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
  end_use end_use NOT NULL,
  annual_consumption_mwh NUMERIC(12, 4),
  profile_type profile_type DEFAULT 'nace_default',
  hourly_profile JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Lighting zones
CREATE TABLE IF NOT EXISTS lighting_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
  zone_name VARCHAR(255),
  area_sqm NUMERIC(12, 2),
  current_fixture_type VARCHAR(100),
  current_wattage NUMERIC(10, 2),
  fixture_count INTEGER,
  operating_hours_year INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Energy resources per analysis
CREATE TABLE IF NOT EXISTS analysis_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
  resource_type resource_type NOT NULL,
  buying_price NUMERIC(10, 4),
  selling_price NUMERIC(10, 4),
  co2_factor NUMERIC(8, 6),
  max_availability NUMERIC(12, 4),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Technology catalog (global + org-specific)
CREATE TABLE IF NOT EXISTS technology_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  description TEXT,
  capex_per_kw NUMERIC(10, 2),
  maintenance_annual_per_kw NUMERIC(10, 2),
  lifetime INTEGER,
  capacity_factor NUMERIC(5, 4),
  min_size_kw NUMERIC(10, 2),
  max_size_kw NUMERIC(10, 2),
  is_global BOOLEAN DEFAULT TRUE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  capacity_unit VARCHAR(20),
  icon VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Technology inputs (fuel/resource consumed)
CREATE TABLE IF NOT EXISTS tech_inputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  technology_id UUID NOT NULL REFERENCES technology_catalog(id) ON DELETE CASCADE,
  resource_type resource_type NOT NULL,
  conversion_factor NUMERIC(8, 4)
);

-- Technology outputs (energy produced)
CREATE TABLE IF NOT EXISTS tech_outputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  technology_id UUID NOT NULL REFERENCES technology_catalog(id) ON DELETE CASCADE,
  end_use end_use NOT NULL,
  conversion_factor NUMERIC(8, 4)
);

-- Technologies selected for an analysis
CREATE TABLE IF NOT EXISTS analysis_technologies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
  technology_id UUID NOT NULL REFERENCES technology_catalog(id) ON DELETE CASCADE,
  installed_capacity_kw NUMERIC(10, 2),
  is_existing BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Storage systems
CREATE TABLE IF NOT EXISTS storage_systems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
  name VARCHAR(255),
  storage_type storage_type NOT NULL,
  capacity_kwh NUMERIC(12, 2),
  max_charge_kw NUMERIC(10, 2),
  max_discharge_kw NUMERIC(10, 2),
  charge_efficiency NUMERIC(5, 4),
  discharge_efficiency NUMERIC(5, 4),
  self_discharge_rate NUMERIC(5, 4),
  capex_per_kwh NUMERIC(10, 2),
  cycles_lifetime INTEGER,
  min_soc NUMERIC(5, 4),
  max_soc NUMERIC(5, 4),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Optimization scenarios
CREATE TABLE IF NOT EXISTS scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  objective objective DEFAULT 'cost',
  status scenario_status NOT NULL DEFAULT 'draft',
  co2_target NUMERIC(5, 4),
  budget_limit NUMERIC(14, 2),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Scenario technology configurations
CREATE TABLE IF NOT EXISTS scenario_tech_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  technology_id UUID NOT NULL REFERENCES technology_catalog(id) ON DELETE CASCADE,
  min_capacity_kw NUMERIC(10, 2),
  max_capacity_kw NUMERIC(10, 2),
  force_include BOOLEAN DEFAULT FALSE,
  UNIQUE(scenario_id, technology_id)
);

-- Scenario optimization results
CREATE TABLE IF NOT EXISTS scenario_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE UNIQUE,
  total_capex NUMERIC(14, 2),
  total_opex_annual NUMERIC(14, 2),
  total_savings_annual NUMERIC(14, 2),
  payback_years NUMERIC(6, 2),
  irr NUMERIC(6, 4),
  npv NUMERIC(14, 2),
  co2_reduction_percent NUMERIC(6, 4),
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Per-technology results
CREATE TABLE IF NOT EXISTS tech_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_result_id UUID NOT NULL REFERENCES scenario_results(id) ON DELETE CASCADE,
  technology_id UUID NOT NULL REFERENCES technology_catalog(id) ON DELETE CASCADE,
  optimal_capacity_kw NUMERIC(10, 2),
  annual_production_mwh NUMERIC(12, 4),
  capex NUMERIC(14, 2),
  annual_savings NUMERIC(14, 2)
);

-- Time series data
CREATE TABLE IF NOT EXISTS time_series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
  name VARCHAR(255),
  series_type VARCHAR(50),
  data JSONB,
  unit VARCHAR(20),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Generated reports
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
  scenario_id UUID REFERENCES scenarios(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  format report_format NOT NULL,
  file_url TEXT,
  generated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- File uploads
CREATE TABLE IF NOT EXISTS files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  analysis_id UUID REFERENCES analyses(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100),
  size_bytes INTEGER,
  storage_key TEXT NOT NULL,
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- NACE codes (sector classification)
CREATE TABLE IF NOT EXISTS nace_codes (
  code VARCHAR(10) PRIMARY KEY,
  description TEXT NOT NULL,
  section VARCHAR(1) NOT NULL,
  is_energy_relevant BOOLEAN DEFAULT FALSE
);

-- Audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  resource VARCHAR(100) NOT NULL,
  resource_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE UNIQUE,
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  status subscription_status NOT NULL DEFAULT 'trialing',
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 3. INDICI PER PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_sites_organization ON sites(organization_id);
CREATE INDEX IF NOT EXISTS idx_analyses_site ON analyses(site_id);
CREATE INDEX IF NOT EXISTS idx_analyses_organization ON analyses(organization_id);
CREATE INDEX IF NOT EXISTS idx_demands_analysis ON demands(analysis_id);
CREATE INDEX IF NOT EXISTS idx_resources_analysis ON analysis_resources(analysis_id);
CREATE INDEX IF NOT EXISTS idx_analysis_tech_analysis ON analysis_technologies(analysis_id);
CREATE INDEX IF NOT EXISTS idx_storage_analysis ON storage_systems(analysis_id);
CREATE INDEX IF NOT EXISTS idx_scenarios_analysis ON scenarios(analysis_id);
CREATE INDEX IF NOT EXISTS idx_scenario_results_scenario ON scenario_results(scenario_id);
CREATE INDEX IF NOT EXISTS idx_tech_results_scenario ON tech_results(scenario_result_id);
CREATE INDEX IF NOT EXISTS idx_reports_analysis ON reports(analysis_id);
CREATE INDEX IF NOT EXISTS idx_files_organization ON files(organization_id);
CREATE INDEX IF NOT EXISTS idx_files_analysis ON files(analysis_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_organization ON audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_lighting_zones_analysis ON lighting_zones(analysis_id);

-- ============================================
-- 4. RLS (Row Level Security)
-- ============================================

-- Abilita RLS su tutte le tabelle
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE demands ENABLE ROW LEVEL SECURITY;
ALTER TABLE lighting_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE technology_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE tech_inputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tech_outputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_technologies ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage_systems ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenario_tech_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenario_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE tech_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE nace_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. FUNZIONI HELPER PER RLS
-- ============================================

-- Ritorna gli org_id dell'utente corrente
CREATE OR REPLACE FUNCTION get_user_org_ids()
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT organization_id FROM user_organizations WHERE user_id = auth.uid();
$$;

-- Verifica se l'utente ha accesso in scrittura (admin o editor)
CREATE OR REPLACE FUNCTION user_has_write_access(org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_organizations
    WHERE user_id = auth.uid()
      AND organization_id = org_id
      AND role IN ('admin', 'editor')
  );
$$;

-- ============================================
-- 6. POLICY RLS
-- ============================================

-- Users: utente vede solo se stesso
CREATE POLICY "Users: select own" ON users FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users: update own" ON users FOR UPDATE USING (id = auth.uid());

-- Organizations: utente vede le sue org
CREATE POLICY "Orgs: select members" ON organizations FOR SELECT
  USING (id IN (SELECT get_user_org_ids()));

-- User Organizations: utente vede le sue membership
CREATE POLICY "UserOrgs: select own" ON user_organizations FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "UserOrgs: insert admin" ON user_organizations FOR INSERT
  WITH CHECK (user_has_write_access(organization_id));

-- Sites: multi-tenant via organization_id
CREATE POLICY "Sites: select org" ON sites FOR SELECT
  USING (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY "Sites: insert org" ON sites FOR INSERT
  WITH CHECK (user_has_write_access(organization_id));
CREATE POLICY "Sites: update org" ON sites FOR UPDATE
  USING (user_has_write_access(organization_id));
CREATE POLICY "Sites: delete org" ON sites FOR DELETE
  USING (user_has_write_access(organization_id));

-- Analyses: multi-tenant via organization_id
CREATE POLICY "Analyses: select org" ON analyses FOR SELECT
  USING (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY "Analyses: insert org" ON analyses FOR INSERT
  WITH CHECK (user_has_write_access(organization_id));
CREATE POLICY "Analyses: update org" ON analyses FOR UPDATE
  USING (user_has_write_access(organization_id));
CREATE POLICY "Analyses: delete org" ON analyses FOR DELETE
  USING (user_has_write_access(organization_id));

-- Demands: via analysis join
CREATE POLICY "Demands: select" ON demands FOR SELECT
  USING (analysis_id IN (SELECT id FROM analyses WHERE organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "Demands: insert" ON demands FOR INSERT
  WITH CHECK (analysis_id IN (SELECT id FROM analyses WHERE organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "Demands: update" ON demands FOR UPDATE
  USING (analysis_id IN (SELECT id FROM analyses WHERE organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "Demands: delete" ON demands FOR DELETE
  USING (analysis_id IN (SELECT id FROM analyses WHERE organization_id IN (SELECT get_user_org_ids())));

-- Lighting zones: via analysis
CREATE POLICY "Lighting: select" ON lighting_zones FOR SELECT
  USING (analysis_id IN (SELECT id FROM analyses WHERE organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "Lighting: insert" ON lighting_zones FOR INSERT
  WITH CHECK (analysis_id IN (SELECT id FROM analyses WHERE organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "Lighting: update" ON lighting_zones FOR UPDATE
  USING (analysis_id IN (SELECT id FROM analyses WHERE organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "Lighting: delete" ON lighting_zones FOR DELETE
  USING (analysis_id IN (SELECT id FROM analyses WHERE organization_id IN (SELECT get_user_org_ids())));

-- Resources: via analysis
CREATE POLICY "Resources: select" ON analysis_resources FOR SELECT
  USING (analysis_id IN (SELECT id FROM analyses WHERE organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "Resources: insert" ON analysis_resources FOR INSERT
  WITH CHECK (analysis_id IN (SELECT id FROM analyses WHERE organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "Resources: update" ON analysis_resources FOR UPDATE
  USING (analysis_id IN (SELECT id FROM analyses WHERE organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "Resources: delete" ON analysis_resources FOR DELETE
  USING (analysis_id IN (SELECT id FROM analyses WHERE organization_id IN (SELECT get_user_org_ids())));

-- Technology catalog: global visibili a tutti, org-specific alle proprie org
CREATE POLICY "TechCatalog: select" ON technology_catalog FOR SELECT
  USING (is_global = TRUE OR organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY "TechCatalog: insert" ON technology_catalog FOR INSERT
  WITH CHECK (organization_id IN (SELECT get_user_org_ids()));

-- Tech inputs/outputs: segui la policy del catalogo
CREATE POLICY "TechInputs: select" ON tech_inputs FOR SELECT
  USING (technology_id IN (SELECT id FROM technology_catalog WHERE is_global = TRUE OR organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "TechOutputs: select" ON tech_outputs FOR SELECT
  USING (technology_id IN (SELECT id FROM technology_catalog WHERE is_global = TRUE OR organization_id IN (SELECT get_user_org_ids())));

-- Analysis technologies: via analysis
CREATE POLICY "AnalysisTech: select" ON analysis_technologies FOR SELECT
  USING (analysis_id IN (SELECT id FROM analyses WHERE organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "AnalysisTech: insert" ON analysis_technologies FOR INSERT
  WITH CHECK (analysis_id IN (SELECT id FROM analyses WHERE organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "AnalysisTech: update" ON analysis_technologies FOR UPDATE
  USING (analysis_id IN (SELECT id FROM analyses WHERE organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "AnalysisTech: delete" ON analysis_technologies FOR DELETE
  USING (analysis_id IN (SELECT id FROM analyses WHERE organization_id IN (SELECT get_user_org_ids())));

-- Storage systems: via analysis
CREATE POLICY "Storage: select" ON storage_systems FOR SELECT
  USING (analysis_id IN (SELECT id FROM analyses WHERE organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "Storage: insert" ON storage_systems FOR INSERT
  WITH CHECK (analysis_id IN (SELECT id FROM analyses WHERE organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "Storage: update" ON storage_systems FOR UPDATE
  USING (analysis_id IN (SELECT id FROM analyses WHERE organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "Storage: delete" ON storage_systems FOR DELETE
  USING (analysis_id IN (SELECT id FROM analyses WHERE organization_id IN (SELECT get_user_org_ids())));

-- Scenarios: via analysis
CREATE POLICY "Scenarios: select" ON scenarios FOR SELECT
  USING (analysis_id IN (SELECT id FROM analyses WHERE organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "Scenarios: insert" ON scenarios FOR INSERT
  WITH CHECK (analysis_id IN (SELECT id FROM analyses WHERE organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "Scenarios: update" ON scenarios FOR UPDATE
  USING (analysis_id IN (SELECT id FROM analyses WHERE organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "Scenarios: delete" ON scenarios FOR DELETE
  USING (analysis_id IN (SELECT id FROM analyses WHERE organization_id IN (SELECT get_user_org_ids())));

-- Scenario tech configs: via scenario → analysis
CREATE POLICY "ScenarioTechConfig: select" ON scenario_tech_configs FOR SELECT
  USING (scenario_id IN (SELECT id FROM scenarios WHERE analysis_id IN (SELECT id FROM analyses WHERE organization_id IN (SELECT get_user_org_ids()))));
CREATE POLICY "ScenarioTechConfig: insert" ON scenario_tech_configs FOR INSERT
  WITH CHECK (scenario_id IN (SELECT id FROM scenarios WHERE analysis_id IN (SELECT id FROM analyses WHERE organization_id IN (SELECT get_user_org_ids()))));
CREATE POLICY "ScenarioTechConfig: delete" ON scenario_tech_configs FOR DELETE
  USING (scenario_id IN (SELECT id FROM scenarios WHERE analysis_id IN (SELECT id FROM analyses WHERE organization_id IN (SELECT get_user_org_ids()))));

-- Scenario results: via scenario
CREATE POLICY "Results: select" ON scenario_results FOR SELECT
  USING (scenario_id IN (SELECT id FROM scenarios WHERE analysis_id IN (SELECT id FROM analyses WHERE organization_id IN (SELECT get_user_org_ids()))));

-- Tech results: via scenario_result → scenario
CREATE POLICY "TechResults: select" ON tech_results FOR SELECT
  USING (scenario_result_id IN (SELECT id FROM scenario_results WHERE scenario_id IN (SELECT id FROM scenarios WHERE analysis_id IN (SELECT id FROM analyses WHERE organization_id IN (SELECT get_user_org_ids())))));

-- Time series: via analysis
CREATE POLICY "TimeSeries: select" ON time_series FOR SELECT
  USING (analysis_id IN (SELECT id FROM analyses WHERE organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "TimeSeries: insert" ON time_series FOR INSERT
  WITH CHECK (analysis_id IN (SELECT id FROM analyses WHERE organization_id IN (SELECT get_user_org_ids())));

-- Reports: via analysis
CREATE POLICY "Reports: select" ON reports FOR SELECT
  USING (analysis_id IN (SELECT id FROM analyses WHERE organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "Reports: insert" ON reports FOR INSERT
  WITH CHECK (analysis_id IN (SELECT id FROM analyses WHERE organization_id IN (SELECT get_user_org_ids())));
CREATE POLICY "Reports: delete" ON reports FOR DELETE
  USING (analysis_id IN (SELECT id FROM analyses WHERE organization_id IN (SELECT get_user_org_ids())));

-- Files: via organization
CREATE POLICY "Files: select" ON files FOR SELECT
  USING (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY "Files: insert" ON files FOR INSERT
  WITH CHECK (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY "Files: delete" ON files FOR DELETE
  USING (organization_id IN (SELECT get_user_org_ids()));

-- NACE codes: pubblici, tutti possono leggere
CREATE POLICY "NACE: select all" ON nace_codes FOR SELECT USING (TRUE);

-- Audit logs: via organization
CREATE POLICY "AuditLogs: select" ON audit_logs FOR SELECT
  USING (organization_id IN (SELECT get_user_org_ids()));
CREATE POLICY "AuditLogs: insert" ON audit_logs FOR INSERT
  WITH CHECK (organization_id IN (SELECT get_user_org_ids()));

-- Subscriptions: via organization
CREATE POLICY "Subscriptions: select" ON subscriptions FOR SELECT
  USING (organization_id IN (SELECT get_user_org_ids()));

-- ============================================
-- 7. TRIGGER: Crea utente + org alla registrazione
-- ============================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_org_id UUID;
  org_name TEXT;
BEGIN
  -- Inserisci nella tabella users
  INSERT INTO users (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );

  -- Crea organizzazione dal nome fornito in registrazione
  -- Il frontend invia 'organization_name' nei metadata di signUp
  org_name := COALESCE(NEW.raw_user_meta_data->>'organization_name', 'La mia organizzazione');

  INSERT INTO organizations (name, slug)
  VALUES (org_name, lower(regexp_replace(org_name, '[^a-zA-Z0-9]+', '-', 'g')))
  RETURNING id INTO new_org_id;

  -- Associa utente all'organizzazione come admin
  INSERT INTO user_organizations (user_id, organization_id, role)
  VALUES (NEW.id, new_org_id, 'admin');

  RETURN NEW;
END;
$$;

-- Trigger su auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================
-- 8. SEED DATA: Catalogo Tecnologie
-- ============================================

INSERT INTO technology_catalog (name, category, capex_per_kw, maintenance_annual_per_kw, lifetime, capacity_factor, min_size_kw, max_size_kw, is_global, icon) VALUES
  ('Fotovoltaico', 'renewable', 800, 10, 25, 0.15, 1, 10000, TRUE, 'Sun'),
  ('Eolico', 'renewable', 1200, 25, 20, 0.25, 10, 5000, TRUE, 'Wind'),
  ('Caldaia a gas', 'thermal', 100, 5, 20, 0.90, 10, 5000, TRUE, 'Flame'),
  ('Caldaia a biomassa', 'thermal', 300, 15, 20, 0.85, 50, 3000, TRUE, 'TreePine'),
  ('Pompa di calore aria-acqua', 'thermal', 500, 12, 15, 0.35, 5, 1000, TRUE, 'ThermometerSun'),
  ('Pompa di calore geotermica', 'thermal', 800, 10, 25, 0.40, 10, 500, TRUE, 'ThermometerSun'),
  ('Cogeneratore (CHP)', 'cogeneration', 1500, 30, 15, 0.85, 50, 5000, TRUE, 'Cog'),
  ('Trigeneratore (CCHP)', 'cogeneration', 2000, 40, 15, 0.80, 100, 3000, TRUE, 'Cog'),
  ('Chiller ad assorbimento', 'cooling', 400, 10, 20, 0.70, 50, 2000, TRUE, 'Snowflake'),
  ('Chiller elettrico', 'cooling', 250, 8, 15, 0.80, 10, 3000, TRUE, 'Snowflake'),
  ('Cappotto termico', 'envelope', 50, 0, 30, 1.00, 100, 50000, TRUE, 'Home'),
  ('Relamping LED', 'lighting', 3, 0, 15, 1.00, 1, 100000, TRUE, 'Lightbulb'),
  ('Inverter su motori', 'efficiency', 20, 1, 15, 1.00, 5, 1000, TRUE, 'Gauge'),
  ('Compressore aria efficiente', 'efficiency', 150, 5, 15, 0.90, 10, 500, TRUE, 'Gauge'),
  ('Recuperatore di calore', 'efficiency', 200, 5, 20, 0.80, 10, 2000, TRUE, 'ArrowUpDown')
ON CONFLICT DO NOTHING;

-- ============================================
-- FINE! Tutte le 23 tabelle + RLS + trigger + seed
-- ============================================
