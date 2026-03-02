-- ============================================================
-- AzzeroCO2 Energy - Auth Trigger: handle_new_user
-- Creates public.users record and optional organization
-- when a new user signs up via Supabase Auth
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  org_id uuid;
  org_name TEXT;
BEGIN
  -- Insert into public.users table
  INSERT INTO public.users (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');

  -- Always create an organization (fallback to 'La mia organizzazione' if not provided)
  org_name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'organization_name'), ''),
    'La mia organizzazione'
  );

  INSERT INTO public.organizations (name, slug)
  VALUES (
    org_name,
    lower(regexp_replace(org_name, '[^a-zA-Z0-9]+', '-', 'g'))
  )
  RETURNING id INTO org_id;

  INSERT INTO public.user_organizations (user_id, organization_id, role)
  VALUES (NEW.id, org_id, 'admin');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users insert
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
