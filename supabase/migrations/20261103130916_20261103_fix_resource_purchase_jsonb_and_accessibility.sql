/*
# Fix resource purchase JSONB update

1. Purpose
- Corrige a compra de materiais da loja, que falhava porque um número inteiro era passado diretamente para `jsonb_set`, que exige um valor `jsonb`.
- Mantém a compra atómica e a autoridade dos saldos no servidor.

2. Modified database object
- `public.purchase_resources(text)`:
  - Mantém o catálogo e os preços existentes.
  - Atualiza apenas o recurso comprado.
  - Converte explicitamente a nova quantidade para JSONB com `to_jsonb`.
  - Continua a bloquear a linha do estado de jogo durante a compra.

3. Security
- A função continua `SECURITY DEFINER` com `search_path = public`.
- A função usa sempre `auth.uid()` e rejeita chamadas sem sessão.
- Não são alteradas tabelas, colunas, dados existentes, RLS ou permissões.

4. Data safety
- Não elimina nem recria dados.
- O registo da compra e a atualização do saldo continuam na mesma execução atómica da função.
*/

CREATE OR REPLACE FUNCTION public.purchase_resources(p_item text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_res jsonb;
  v_coins int;
  v_diamonds int;
  v_quantity int;
  v_cost_coins int;
  v_cost_diamonds int;
  v_resource text;
  v_new_resource_value int;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Sessão inválida';
  END IF;

  CASE p_item
    WHEN 'wood_small'   THEN v_resource := 'wood';  v_quantity := 50;  v_cost_coins := 30;  v_cost_diamonds := 0;
    WHEN 'wood_medium'  THEN v_resource := 'wood';  v_quantity := 150; v_cost_coins := 75;  v_cost_diamonds := 0;
    WHEN 'wood_large'   THEN v_resource := 'wood';  v_quantity := 400; v_cost_coins := 150; v_cost_diamonds := 5;
    WHEN 'stone_small'  THEN v_resource := 'stone'; v_quantity := 50;  v_cost_coins := 35;  v_cost_diamonds := 0;
    WHEN 'stone_medium' THEN v_resource := 'stone'; v_quantity := 150; v_cost_coins := 85;  v_cost_diamonds := 0;
    WHEN 'stone_large'  THEN v_resource := 'stone'; v_quantity := 400; v_cost_coins := 160; v_cost_diamonds := 5;
    WHEN 'iron_small'   THEN v_resource := 'iron';  v_quantity := 30;  v_cost_coins := 45;  v_cost_diamonds := 0;
    WHEN 'iron_medium'  THEN v_resource := 'iron';  v_quantity := 90;  v_cost_coins := 110; v_cost_diamonds := 0;
    WHEN 'iron_large'   THEN v_resource := 'iron';  v_quantity := 250; v_cost_coins := 200; v_cost_diamonds := 8;
    WHEN 'food_small'   THEN v_resource := 'food';  v_quantity := 50;  v_cost_coins := 20;  v_cost_diamonds := 0;
    WHEN 'food_medium'  THEN v_resource := 'food';  v_quantity := 150; v_cost_coins := 55;  v_cost_diamonds := 0;
    WHEN 'food_large'   THEN v_resource := 'food';  v_quantity := 400; v_cost_coins := 130; v_cost_diamonds := 4;
    ELSE
      RAISE EXCEPTION 'Artigo desconhecido';
  END CASE;

  SELECT coins, diamonds, resources
  INTO v_coins, v_diamonds, v_res
  FROM public.game_states
  WHERE user_id = v_user
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Estado de jogo não encontrado';
  END IF;

  IF v_coins < v_cost_coins THEN
    RAISE EXCEPTION 'Moedas insuficientes';
  END IF;

  IF v_diamonds < v_cost_diamonds THEN
    RAISE EXCEPTION 'Diamantes insuficientes';
  END IF;

  v_new_resource_value := COALESCE((v_res ->> v_resource)::int, 0) + v_quantity;

  UPDATE public.game_states
  SET coins = coins - v_cost_coins,
      diamonds = diamonds - v_cost_diamonds,
      resources = jsonb_set(
        COALESCE(v_res, '{}'::jsonb),
        ARRAY[v_resource],
        to_jsonb(v_new_resource_value),
        true
      )
  WHERE user_id = v_user;

  INSERT INTO public.shop_purchases (user_id, item_id, quantity, cost_coins, cost_diamonds)
  VALUES (v_user, p_item, v_quantity, v_cost_coins, v_cost_diamonds);

  SELECT coins, diamonds, resources
  INTO v_coins, v_diamonds, v_res
  FROM public.game_states
  WHERE user_id = v_user;

  RETURN jsonb_build_object(
    'coins', v_coins,
    'diamonds', v_diamonds,
    'resources', v_res
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.purchase_resources(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.purchase_resources(text) TO authenticated;