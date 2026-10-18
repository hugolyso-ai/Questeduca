/*
# Loja de materiais + Chat monitorizado entre amigos

1. Novas Tabelas
- `shop_purchases`: registo de compras na loja interna
  - `id` (uuid, chave primária)
  - `user_id` (uuid, dono da compra, ligado a auth.users)
  - `item_id` (text: ex. 'wood_small', 'stone_large', 'iron_diamond')
  - `quantity` (int: unidades de material compradas)
  - `cost_coins`, `cost_diamonds` (int: preço pago)
  - `created_at`
- `chat_messages`: mensagens de chat entre alunos amigos
  - `id` (uuid, chave primária)
  - `sender_id`, `recipient_id` (uuid, ligados a auth.users)
  - `body` (text, 1 a 500 caracteres)
  - `read_at` (timestamptz, nulo enquanto não lida)
  - `created_at`

2. Novas Funções (SECURITY DEFINER, search_path fixado)
- `purchase_resources(p_item text)`: compra atómica de material de construção.
  Verifica saldo de moedas/diamantes, debita o custo e credita o material
  numa única operação transacional. Erros: 'Moedas insuficientes',
  'Diamantes insuficientes', 'Artigo desconhecido'.
- `notify_new_message()`: gatilho que cria uma notificação para o destinatário
  de cada nova mensagem de chat.

3. Segurança (RLS)
- RLS ativado em `shop_purchases` e `chat_messages`.
- `shop_purchases`: cada utilizador vê/apaga apenas as próprias compras;
  inserções apenas pela função (sem política de INSERT para clientes).
- `chat_messages`:
  - SELECT: participantes da conversa OU pai/encarregado de qualquer um deles
    (monitorização parental de leitura, sem edição).
  - INSERT: apenas mensagens enviadas pelo próprio (sender_id = auth.uid())
    para um utilizador com amizade confirmada na tabela `friendships`.
  - UPDATE: apenas o destinatário pode marcar a mensagem como lida.
  - Sem DELETE (preservação de dados).

4. Notas
- Preços da loja centralizados na função `purchase_resources`.
- O chat só é possível entre amigos confirmados (dupla aprovação já exigida
  pelas regras existentes de pedidos de amizade).
*/

-- ===== Tabela: compras da loja =====
CREATE TABLE IF NOT EXISTS public.shop_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id text NOT NULL,
  quantity int NOT NULL,
  cost_coins int NOT NULL DEFAULT 0,
  cost_diamonds int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.shop_purchases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_purchases" ON public.shop_purchases;
CREATE POLICY "select_own_purchases" ON public.shop_purchases FOR SELECT
TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_purchases" ON public.shop_purchases;
CREATE POLICY "delete_own_purchases" ON public.shop_purchases FOR DELETE
TO authenticated USING (auth.uid() = user_id);

-- ===== Tabela: mensagens de chat =====
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 500),
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_pair
ON public.chat_messages (sender_id, recipient_id, created_at);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_chat_participants_or_parents" ON public.chat_messages;
CREATE POLICY "select_chat_participants_or_parents" ON public.chat_messages FOR SELECT
TO authenticated
USING (
  auth.uid() = sender_id
  OR auth.uid() = recipient_id
  OR EXISTS (
    SELECT 1 FROM public.student_profiles sp
    WHERE sp.parent_id = auth.uid()
      AND sp.user_id IN (chat_messages.sender_id, chat_messages.recipient_id)
  )
);

DROP POLICY IF EXISTS "insert_chat_to_friends_only" ON public.chat_messages;
CREATE POLICY "insert_chat_to_friends_only" ON public.chat_messages FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1 FROM public.friendships f
    WHERE (f.user1_id = auth.uid() AND f.user2_id = recipient_id)
       OR (f.user2_id = auth.uid() AND f.user1_id = recipient_id)
  )
);

DROP POLICY IF EXISTS "update_chat_mark_read" ON public.chat_messages;
CREATE POLICY "update_chat_mark_read" ON public.chat_messages FOR UPDATE
TO authenticated
USING (auth.uid() = recipient_id)
WITH CHECK (auth.uid() = recipient_id);

-- ===== Função: compra de materiais =====
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
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Sessão inválida';
  END IF;

  -- Catálogo: id => (quantidade, custo_moedas, custo_diamantes)
  CASE p_item
    WHEN 'wood_small'   THEN v_quantity := 50;  v_cost_coins := 30;  v_cost_diamonds := 0;
    WHEN 'wood_medium'  THEN v_quantity := 150; v_cost_coins := 75;  v_cost_diamonds := 0;
    WHEN 'wood_large'   THEN v_quantity := 400; v_cost_coins := 150; v_cost_diamonds := 5;
    WHEN 'stone_small'  THEN v_quantity := 50;  v_cost_coins := 35;  v_cost_diamonds := 0;
    WHEN 'stone_medium' THEN v_quantity := 150; v_cost_coins := 85;  v_cost_diamonds := 0;
    WHEN 'stone_large'  THEN v_quantity := 400; v_cost_coins := 160; v_cost_diamonds := 5;
    WHEN 'iron_small'   THEN v_quantity := 30;  v_cost_coins := 45;  v_cost_diamonds := 0;
    WHEN 'iron_medium'  THEN v_quantity := 90;  v_cost_coins := 110; v_cost_diamonds := 0;
    WHEN 'iron_large'   THEN v_quantity := 250; v_cost_coins := 200; v_cost_diamonds := 8;
    WHEN 'food_small'   THEN v_quantity := 50;  v_cost_coins := 20;  v_cost_diamonds := 0;
    WHEN 'food_medium'  THEN v_quantity := 150; v_cost_coins := 55;  v_cost_diamonds := 0;
    WHEN 'food_large'   THEN v_quantity := 400; v_cost_coins := 130; v_cost_diamonds := 4;
    ELSE
      RAISE EXCEPTION 'Artigo desconhecido';
  END CASE;

  SELECT coins, diamonds, resources
  INTO v_coins, v_diamonds, v_res
  FROM game_states
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

  UPDATE game_states
  SET coins = coins - v_cost_coins,
      diamonds = diamonds - v_cost_diamonds,
      resources = jsonb_set(
        jsonb_set(
          jsonb_set(
            jsonb_set(
              COALESCE(resources, '{}'::jsonb),
              CASE WHEN p_item LIKE 'wood%' THEN '{wood}' ELSE '{x}' END,
              (COALESCE(resources->>'wood', '0')::int + CASE WHEN p_item LIKE 'wood%' THEN v_quantity ELSE 0 END)
            ),
            CASE WHEN p_item LIKE 'stone%' THEN '{stone}' ELSE '{x}' END,
            (COALESCE(resources->>'stone', '0')::int + CASE WHEN p_item LIKE 'stone%' THEN v_quantity ELSE 0 END)
          ),
          CASE WHEN p_item LIKE 'iron%' THEN '{iron}' ELSE '{x}' END,
          (COALESCE(resources->>'iron', '0')::int + CASE WHEN p_item LIKE 'iron%' THEN v_quantity ELSE 0 END)
        ),
        CASE WHEN p_item LIKE 'food%' THEN '{food}' ELSE '{x}' END,
        (COALESCE(resources->>'food', '0')::int + CASE WHEN p_item LIKE 'food%' THEN v_quantity ELSE 0 END)
      )
  WHERE user_id = v_user;

  INSERT INTO shop_purchases (user_id, item_id, quantity, cost_coins, cost_diamonds)
  VALUES (v_user, p_item, v_quantity, v_cost_coins, v_cost_diamonds);

  SELECT coins, diamonds, resources INTO v_coins, v_diamonds, v_res
  FROM game_states WHERE user_id = v_user;

  RETURN jsonb_build_object(
    'coins', v_coins,
    'diamonds', v_diamonds,
    'resources', v_res
  );
END;
$$;

-- ===== Gatilho: notificação de nova mensagem =====
CREATE OR REPLACE FUNCTION public.notify_new_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO notifications (user_id, type, title, message)
  VALUES (
    NEW.recipient_id,
    'chat',
    'Nova mensagem',
    'Recebeste uma mensagem nova de um amigo!'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_new_message ON public.chat_messages;
CREATE TRIGGER trg_notify_new_message
AFTER INSERT ON public.chat_messages
FOR EACH ROW EXECUTE FUNCTION public.notify_new_message();
