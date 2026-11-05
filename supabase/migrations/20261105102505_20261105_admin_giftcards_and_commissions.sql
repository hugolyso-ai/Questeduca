/*
# Gestão de gift cards e comissões pelo administrador

1. Novas funções (apenas administradores)
- admin_create_giftcard(p_plan, p_quantity, p_note): gera códigos de gift card para subscrição mensal ou anual. Retorna os códigos criados.
- admin_mark_commission_paid(p_commission_id): marca uma comissão como paga e atualiza o saldo da associação.

2. Coluna nova
- giftcards.plan text DEFAULT 'monthly'.

3. Segurança
- As funções verificam is_admin() e não são executáveis por anon nem PUBLIC.
*/

ALTER TABLE public.giftcards ADD COLUMN IF NOT EXISTS plan text DEFAULT 'monthly';

CREATE OR REPLACE FUNCTION public.admin_create_giftcard(p_plan text, p_quantity integer DEFAULT 1, p_note text DEFAULT NULL)
RETURNS TABLE(code text, plan text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_amount numeric;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Acesso reservado a administradores';
  END IF;
  IF p_plan NOT IN ('monthly', 'annual') THEN
    RAISE EXCEPTION 'Plano inválido';
  END IF;
  IF p_quantity < 1 OR p_quantity > 100 THEN
    RAISE EXCEPTION 'Quantidade inválida';
  END IF;
  v_amount := CASE WHEN p_plan = 'annual' THEN 69.90 ELSE 6.99 END;

  INSERT INTO public.giftcards (code, amount, plan, status, note, created_by)
  SELECT
    upper(substr(md5(gen_random_uuid()::text || random()::text), 1, 4) || '-' ||
           substr(md5(gen_random_uuid()::text || random()::text), 1, 4) || '-' ||
           substr(md5(gen_random_uuid()::text || random()::text), 1, 4)),
    v_amount,
    p_plan,
    'active',
    p_note,
    auth.uid()
  FROM generate_series(1, p_quantity);

  RETURN QUERY
  SELECT g.code, g.plan
  FROM public.giftcards g
  WHERE g.created_by = auth.uid() AND g.plan = p_plan
  ORDER BY g.created_at DESC
  LIMIT p_quantity;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_mark_commission_paid(p_commission_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_assoc_id uuid;
  v_amount numeric;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Acesso reservado a administradores';
  END IF;
  SELECT association_id, amount INTO v_assoc_id, v_amount
  FROM public.commissions WHERE id = p_commission_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Comissão não encontrada';
  END IF;
  UPDATE public.commissions SET paid = true, paid_at = now() WHERE id = p_commission_id;
  UPDATE public.association_profiles
  SET pending_payout = GREATEST(pending_payout - v_amount, 0),
      total_commissions = total_commissions + v_amount
  WHERE id = v_assoc_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_create_giftcard(text, integer, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_mark_commission_paid(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_create_giftcard(text, integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_mark_commission_paid(uuid) TO authenticated;
