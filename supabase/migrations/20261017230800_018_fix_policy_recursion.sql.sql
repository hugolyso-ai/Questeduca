-- Corrige a recursão infinita nas policies: as de admin consultavam user_profiles
-- dentro da própria policy, bloqueando qualquer SELECT autenticado.
-- Solução: função SECURITY DEFINER is_admin() + reescrita das policies.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

DO $$
DECLARE
  pol RECORD;
  new_qual text;
  new_wc text;
  roles_txt text;
BEGIN
  FOR pol IN
    SELECT schemaname, tablename, policyname, cmd, qual, with_check, roles
    FROM pg_policies
    WHERE schemaname = 'public'
      AND (qual ILIKE '%FROM user_profiles%' OR with_check ILIKE '%FROM user_profiles%')
  LOOP
    -- Substitui o bloco EXISTS(...FROM user_profiles... 'admin'::text))) por public.is_admin()
    new_qual := regexp_replace(
      COALESCE(pol.qual, ''),
      'EXISTS\s*\(\s*SELECT 1\s+FROM\s+user_profiles[\s\S]*?''admin''::text\s*\)\)\)',
      'public.is_admin()',
      'gs'
    );
    new_wc := regexp_replace(
      COALESCE(pol.with_check, ''),
      'EXISTS\s*\(\s*SELECT 1\s+FROM\s+user_profiles[\s\S]*?''admin''::text\s*\)\)\)',
      'public.is_admin()',
      'gs'
    );

    -- Não aplicar se a substituição não resolveu a auto-referência
    CONTINUE WHEN new_qual ILIKE '%FROM user_profiles%' OR new_wc ILIKE '%FROM user_profiles%';

    SELECT string_agg(r, ', ') INTO roles_txt FROM unnest(pol.roles) AS r;

    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);

    IF pol.cmd = 'SELECT' THEN
      EXECUTE format('CREATE POLICY %I ON %I.%I FOR SELECT TO %s USING (%s)',
        pol.policyname, pol.schemaname, pol.tablename, roles_txt, new_qual);
    ELSIF pol.cmd = 'UPDATE' THEN
      EXECUTE format('CREATE POLICY %I ON %I.%I FOR UPDATE TO %s USING (%s) WITH CHECK (%s)',
        pol.policyname, pol.schemaname, pol.tablename, roles_txt, new_qual, new_wc);
    ELSIF pol.cmd = 'DELETE' THEN
      EXECUTE format('CREATE POLICY %I ON %I.%I FOR DELETE TO %s USING (%s)',
        pol.policyname, pol.schemaname, pol.tablename, roles_txt, new_qual);
    ELSIF pol.cmd = 'INSERT' THEN
      EXECUTE format('CREATE POLICY %I ON %I.%I FOR INSERT TO %s WITH CHECK (%s)',
        pol.policyname, pol.schemaname, pol.tablename, roles_txt, new_wc);
    END IF;
  END LOOP;
END $$;