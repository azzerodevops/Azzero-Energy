-- ============================================================
-- AzzeroCO2 Energy - RLS Policies
-- Multi-tenant row-level security for all 23 tables
-- ============================================================

-- ========================
-- HELPER FUNCTIONS
-- ========================

-- Returns all organization IDs the current user belongs to
CREATE OR REPLACE FUNCTION public.get_user_org_ids()
RETURNS SETOF uuid AS $$
  SELECT organization_id FROM public.user_organizations
  WHERE user_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Returns true if the current user has write access (admin or editor) in the given org
CREATE OR REPLACE FUNCTION public.user_has_write_access(org_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_organizations
    WHERE user_id = auth.uid()
      AND organization_id = org_id
      AND role IN ('admin', 'editor')
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ========================
-- ORGANIZATIONS
-- ========================

CREATE POLICY "Users can view own organizations"
  ON organizations FOR SELECT
  USING (id IN (SELECT public.get_user_org_ids()));

CREATE POLICY "Admins can update own organization"
  ON organizations FOR UPDATE
  USING (id IN (
    SELECT organization_id FROM user_organizations
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- ========================
-- USERS
-- ========================

CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can view org members"
  ON users FOR SELECT
  USING (id IN (
    SELECT uo.user_id FROM user_organizations uo
    WHERE uo.organization_id IN (SELECT public.get_user_org_ids())
  ));

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (id = auth.uid());

-- ========================
-- USER_ORGANIZATIONS
-- ========================

CREATE POLICY "Users can view own org memberships"
  ON user_organizations FOR SELECT
  USING (organization_id IN (SELECT public.get_user_org_ids()));

CREATE POLICY "Admins can manage org memberships"
  ON user_organizations FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM user_organizations
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- ========================
-- SITES
-- ========================

CREATE POLICY "Org members can view sites"
  ON sites FOR SELECT
  USING (organization_id IN (SELECT public.get_user_org_ids()));

CREATE POLICY "Writers can insert sites"
  ON sites FOR INSERT
  WITH CHECK (public.user_has_write_access(organization_id));

CREATE POLICY "Writers can update sites"
  ON sites FOR UPDATE
  USING (public.user_has_write_access(organization_id));

CREATE POLICY "Writers can delete sites"
  ON sites FOR DELETE
  USING (public.user_has_write_access(organization_id));

-- ========================
-- ANALYSES
-- ========================

CREATE POLICY "Org members can view analyses"
  ON analyses FOR SELECT
  USING (organization_id IN (SELECT public.get_user_org_ids()));

CREATE POLICY "Writers can insert analyses"
  ON analyses FOR INSERT
  WITH CHECK (public.user_has_write_access(organization_id));

CREATE POLICY "Writers can update analyses"
  ON analyses FOR UPDATE
  USING (public.user_has_write_access(organization_id));

CREATE POLICY "Writers can delete analyses"
  ON analyses FOR DELETE
  USING (public.user_has_write_access(organization_id));

-- ========================
-- DEMANDS (scoped via analysis -> organization)
-- ========================

CREATE POLICY "Org members can view demands"
  ON demands FOR SELECT
  USING (analysis_id IN (
    SELECT id FROM analyses WHERE organization_id IN (SELECT public.get_user_org_ids())
  ));

CREATE POLICY "Writers can insert demands"
  ON demands FOR INSERT
  WITH CHECK (analysis_id IN (
    SELECT id FROM analyses WHERE public.user_has_write_access(organization_id)
  ));

CREATE POLICY "Writers can update demands"
  ON demands FOR UPDATE
  USING (analysis_id IN (
    SELECT id FROM analyses WHERE public.user_has_write_access(organization_id)
  ));

CREATE POLICY "Writers can delete demands"
  ON demands FOR DELETE
  USING (analysis_id IN (
    SELECT id FROM analyses WHERE public.user_has_write_access(organization_id)
  ));

-- ========================
-- LIGHTING_ZONES (scoped via analysis -> organization)
-- ========================

CREATE POLICY "Org members can view lighting_zones"
  ON lighting_zones FOR SELECT
  USING (analysis_id IN (
    SELECT id FROM analyses WHERE organization_id IN (SELECT public.get_user_org_ids())
  ));

CREATE POLICY "Writers can insert lighting_zones"
  ON lighting_zones FOR INSERT
  WITH CHECK (analysis_id IN (
    SELECT id FROM analyses WHERE public.user_has_write_access(organization_id)
  ));

CREATE POLICY "Writers can update lighting_zones"
  ON lighting_zones FOR UPDATE
  USING (analysis_id IN (
    SELECT id FROM analyses WHERE public.user_has_write_access(organization_id)
  ));

CREATE POLICY "Writers can delete lighting_zones"
  ON lighting_zones FOR DELETE
  USING (analysis_id IN (
    SELECT id FROM analyses WHERE public.user_has_write_access(organization_id)
  ));

-- ========================
-- ANALYSIS_RESOURCES (scoped via analysis -> organization)
-- ========================

CREATE POLICY "Org members can view analysis_resources"
  ON analysis_resources FOR SELECT
  USING (analysis_id IN (
    SELECT id FROM analyses WHERE organization_id IN (SELECT public.get_user_org_ids())
  ));

CREATE POLICY "Writers can insert analysis_resources"
  ON analysis_resources FOR INSERT
  WITH CHECK (analysis_id IN (
    SELECT id FROM analyses WHERE public.user_has_write_access(organization_id)
  ));

CREATE POLICY "Writers can update analysis_resources"
  ON analysis_resources FOR UPDATE
  USING (analysis_id IN (
    SELECT id FROM analyses WHERE public.user_has_write_access(organization_id)
  ));

CREATE POLICY "Writers can delete analysis_resources"
  ON analysis_resources FOR DELETE
  USING (analysis_id IN (
    SELECT id FROM analyses WHERE public.user_has_write_access(organization_id)
  ));

-- ========================
-- ANALYSIS_TECHNOLOGIES (scoped via analysis -> organization)
-- ========================

CREATE POLICY "Org members can view analysis_technologies"
  ON analysis_technologies FOR SELECT
  USING (analysis_id IN (
    SELECT id FROM analyses WHERE organization_id IN (SELECT public.get_user_org_ids())
  ));

CREATE POLICY "Writers can insert analysis_technologies"
  ON analysis_technologies FOR INSERT
  WITH CHECK (analysis_id IN (
    SELECT id FROM analyses WHERE public.user_has_write_access(organization_id)
  ));

CREATE POLICY "Writers can update analysis_technologies"
  ON analysis_technologies FOR UPDATE
  USING (analysis_id IN (
    SELECT id FROM analyses WHERE public.user_has_write_access(organization_id)
  ));

CREATE POLICY "Writers can delete analysis_technologies"
  ON analysis_technologies FOR DELETE
  USING (analysis_id IN (
    SELECT id FROM analyses WHERE public.user_has_write_access(organization_id)
  ));

-- ========================
-- STORAGE_SYSTEMS (scoped via analysis -> organization)
-- ========================

CREATE POLICY "Org members can view storage_systems"
  ON storage_systems FOR SELECT
  USING (analysis_id IN (
    SELECT id FROM analyses WHERE organization_id IN (SELECT public.get_user_org_ids())
  ));

CREATE POLICY "Writers can insert storage_systems"
  ON storage_systems FOR INSERT
  WITH CHECK (analysis_id IN (
    SELECT id FROM analyses WHERE public.user_has_write_access(organization_id)
  ));

CREATE POLICY "Writers can update storage_systems"
  ON storage_systems FOR UPDATE
  USING (analysis_id IN (
    SELECT id FROM analyses WHERE public.user_has_write_access(organization_id)
  ));

CREATE POLICY "Writers can delete storage_systems"
  ON storage_systems FOR DELETE
  USING (analysis_id IN (
    SELECT id FROM analyses WHERE public.user_has_write_access(organization_id)
  ));

-- ========================
-- TIME_SERIES (scoped via analysis -> organization)
-- ========================

CREATE POLICY "Org members can view time_series"
  ON time_series FOR SELECT
  USING (analysis_id IN (
    SELECT id FROM analyses WHERE organization_id IN (SELECT public.get_user_org_ids())
  ));

CREATE POLICY "Writers can insert time_series"
  ON time_series FOR INSERT
  WITH CHECK (analysis_id IN (
    SELECT id FROM analyses WHERE public.user_has_write_access(organization_id)
  ));

CREATE POLICY "Writers can update time_series"
  ON time_series FOR UPDATE
  USING (analysis_id IN (
    SELECT id FROM analyses WHERE public.user_has_write_access(organization_id)
  ));

CREATE POLICY "Writers can delete time_series"
  ON time_series FOR DELETE
  USING (analysis_id IN (
    SELECT id FROM analyses WHERE public.user_has_write_access(organization_id)
  ));

-- ========================
-- SCENARIOS (scoped via analysis -> organization)
-- ========================

CREATE POLICY "Org members can view scenarios"
  ON scenarios FOR SELECT
  USING (analysis_id IN (
    SELECT id FROM analyses WHERE organization_id IN (SELECT public.get_user_org_ids())
  ));

CREATE POLICY "Writers can insert scenarios"
  ON scenarios FOR INSERT
  WITH CHECK (analysis_id IN (
    SELECT id FROM analyses WHERE public.user_has_write_access(organization_id)
  ));

CREATE POLICY "Writers can update scenarios"
  ON scenarios FOR UPDATE
  USING (analysis_id IN (
    SELECT id FROM analyses WHERE public.user_has_write_access(organization_id)
  ));

CREATE POLICY "Writers can delete scenarios"
  ON scenarios FOR DELETE
  USING (analysis_id IN (
    SELECT id FROM analyses WHERE public.user_has_write_access(organization_id)
  ));

-- ========================
-- SCENARIO_TECH_CONFIGS (via scenario -> analysis -> organization)
-- ========================

CREATE POLICY "Org members can view scenario_tech_configs"
  ON scenario_tech_configs FOR SELECT
  USING (scenario_id IN (
    SELECT id FROM scenarios WHERE analysis_id IN (
      SELECT id FROM analyses WHERE organization_id IN (SELECT public.get_user_org_ids())
    )
  ));

CREATE POLICY "Writers can manage scenario_tech_configs"
  ON scenario_tech_configs FOR ALL
  USING (scenario_id IN (
    SELECT id FROM scenarios WHERE analysis_id IN (
      SELECT id FROM analyses WHERE public.user_has_write_access(organization_id)
    )
  ));

-- ========================
-- SCENARIO_RESULTS (via scenario -> analysis -> organization) - read only
-- ========================

CREATE POLICY "Org members can view scenario_results"
  ON scenario_results FOR SELECT
  USING (scenario_id IN (
    SELECT id FROM scenarios WHERE analysis_id IN (
      SELECT id FROM analyses WHERE organization_id IN (SELECT public.get_user_org_ids())
    )
  ));

-- ========================
-- TECH_RESULTS (via scenario_results -> scenario -> analysis -> organization) - read only
-- ========================

CREATE POLICY "Org members can view tech_results"
  ON tech_results FOR SELECT
  USING (scenario_result_id IN (
    SELECT id FROM scenario_results WHERE scenario_id IN (
      SELECT id FROM scenarios WHERE analysis_id IN (
        SELECT id FROM analyses WHERE organization_id IN (SELECT public.get_user_org_ids())
      )
    )
  ));

-- ========================
-- TECHNOLOGY_CATALOG (global + org-scoped)
-- ========================

CREATE POLICY "Anyone can view global technologies"
  ON technology_catalog FOR SELECT
  USING (is_global = true OR organization_id IN (SELECT public.get_user_org_ids()));

CREATE POLICY "Writers can insert org technologies"
  ON technology_catalog FOR INSERT
  WITH CHECK (is_global = false AND public.user_has_write_access(organization_id));

CREATE POLICY "Writers can update org technologies"
  ON technology_catalog FOR UPDATE
  USING (is_global = false AND public.user_has_write_access(organization_id));

-- ========================
-- TECH_INPUTS (readable if technology is visible)
-- ========================

CREATE POLICY "View tech_inputs for visible technologies"
  ON tech_inputs FOR SELECT
  USING (technology_id IN (
    SELECT id FROM technology_catalog
    WHERE is_global = true OR organization_id IN (SELECT public.get_user_org_ids())
  ));

-- ========================
-- TECH_OUTPUTS (readable if technology is visible)
-- ========================

CREATE POLICY "View tech_outputs for visible technologies"
  ON tech_outputs FOR SELECT
  USING (technology_id IN (
    SELECT id FROM technology_catalog
    WHERE is_global = true OR organization_id IN (SELECT public.get_user_org_ids())
  ));

-- ========================
-- NACE_CODES (public read-only reference data)
-- ========================

CREATE POLICY "Anyone can read NACE codes"
  ON nace_codes FOR SELECT
  USING (true);

-- ========================
-- REPORTS (scoped via analysis -> organization)
-- ========================

CREATE POLICY "Org members can view reports"
  ON reports FOR SELECT
  USING (analysis_id IN (
    SELECT id FROM analyses WHERE organization_id IN (SELECT public.get_user_org_ids())
  ));

CREATE POLICY "Writers can create reports"
  ON reports FOR INSERT
  WITH CHECK (analysis_id IN (
    SELECT id FROM analyses WHERE public.user_has_write_access(organization_id)
  ));

-- ========================
-- FILES (org-scoped)
-- ========================

CREATE POLICY "Org members can view files"
  ON files FOR SELECT
  USING (organization_id IN (SELECT public.get_user_org_ids()));

CREATE POLICY "Writers can upload files"
  ON files FOR INSERT
  WITH CHECK (public.user_has_write_access(organization_id));

CREATE POLICY "Writers can delete files"
  ON files FOR DELETE
  USING (public.user_has_write_access(organization_id));

-- ========================
-- AUDIT_LOGS (admins see org logs, users see own actions)
-- ========================

CREATE POLICY "Admins can view org audit logs"
  ON audit_logs FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations
      WHERE user_id = auth.uid() AND role = 'admin'
    )
    OR user_id = auth.uid()
  );

-- ========================
-- SUBSCRIPTIONS (admin-only)
-- ========================

CREATE POLICY "Admins can view subscription"
  ON subscriptions FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM user_organizations
    WHERE user_id = auth.uid() AND role = 'admin'
  ));
