/*
# Gestão de utilizadores pelo administrador e subscrições oferecidas

1. Novas funções (apenas administradores)
- admin_set_user_blocked(p_user_id, p_blocked): bloqueia ou desbloqueia uma conta (is_active).
- admin_set_approval(p_user_id, p_status): define o estado de aprovação (pending, approved, rejected).
- admin_grant_subscription(p_user_id, p_plan): atribui uma subscrição manual mensal ou anual como oferta. Substitui qualquer subscrição manual ativa anterior.

2. Segurança
- As funções verificam is_admin() antes de qualquer alteração e não são executáveis por anon nem PUBLIC.
- Removidas as políticas que permitiam a cada utilizador inserir ou alterar as próprias subscrições. Apenas a leitura própria e o acesso do administrador se mantêm.
*/

DROP POLICY IF EXISTS "insert_own_subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "update_own_subscriptions" ON subscriptions;

CREATE POLICY "admin_insert_subscriptions" ON subscriptions FOR INSERT
TO authenticated WITH CHECK (is_admin());

CREATE POLICY "admin_update_subscriptions" ON subscriptions FOR UPDATE
TO authenticated USING (is_admin()) WITH CHECK (is_admin());

CREATE OR REPLACE FUNCTION public.admin_set_user_blocked(p_user_id uuid, p_blocked boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Acesso reservado a administradores';
  END IF;
  UPDATE public.user_profiles SET is_active = NOT p_blocked WHERE id = p_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_approval(p_user_id uuid, p_status text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Acesso reservado a administradores';
  END IF;
  IF p_status NOT IN ('pending', 'approved', 'rejected') THEN
    RAISE EXCEPTION 'Estado de aprovação inválido';
  END IF;
  UPDATE public.user_profiles
  SET approval_status = p_status,
      approved_at = CASE WHEN p_status = 'approved' THEN now() ELSE NULL END
  WHERE id = p_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_grant_subscription(p_user_id uuid, p_plan text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Acesso reservado a administradores';
  END IF;
  IF p_plan NOT IN ('monthly', 'annual') THEN
    RAISE EXCEPTION 'Plano inválido';
  END IF;
  UPDATE public.subscriptions
  SET status = 'replaced'
  WHERE user_id = p_user_id AND status = 'active';
  INSERT INTO public.subscriptions (user_id, type, start_date, end_date, status, payment_reference)
  VALUES (
    p_user_id,
    p_plan,
    now(),
    CASE WHEN p_plan = 'annual' THEN now() + interval '1 year' ELSE now() + interval '1 month' END,
    'active',
    'oferta_admin'
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_set_user_blocked(uuid, boolean) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_set_approval(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_grant_subscription(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_user_blocked(uuid, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_approval(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_grant_subscription(uuid, text) TO authenticated;
