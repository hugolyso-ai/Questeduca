/*
# Reforço de segurança: RLS em teacher_proposals, regras do jogo no servidor

1. Segurança (RLS)
- `teacher_proposals`: RLS ativado (estava DESATIVADO — qualquer pessoa podia ler
  e escrever propostas de estudo). Políticas:
  - SELECT: o professor ve as propostas que criou; o aluno ve as suas.
  - Sem politicas de escrita para clientes (escrita fica para funções do servidor).

2. Novas Funções (SECURITY DEFINER, search_path fixado)
- `send_gift(p_friend uuid, p_kind text, p_amount int)`: envio de presentes entre
  amigos, com todas as regras no servidor:
  - exige amizade confirmada na tabela `friendships`;
  - quantidade limitada a 1..50 (o limite anterior só existia no navegador);
  - debita e credita com SQL atomico (nunca valores enviados pelo cliente);
  - cria notificacao para o destinatario.
  - Erros: 'Só podes enviar presentes a amigos', 'Quantidade inválida',
    'Recursos insuficientes'.
- `send_raid(p_target uuid)`: batalha entre amigos decidida no servidor:
  - exige amizade confirmada;
  - sorteio d20 + poder de ataque/defesa feito na base de dados (o cliente
    ja nao controla o resultado);
  - saque de 10% dos recursos do derrotado transferido atomicamente;
  - regista o ataque em `raids` e notifica o defensor;
  - devolve o resultado (vitoria, valores dos dados, saque).

3. Funções endurecidas
- `notify_new_message`: apenas gatilho interno — EXECUTE retirado a anon e
  authenticated (era chamavel por qualquer pessoa via RPC).
- `auto_promote_school_year`: funcao agendada interna — EXECUTE retirado a
  anon e authenticated.
- `is_admin`: EXECUTE retirado a anon (continua disponivel para authenticated,
  porque as politicas RLS invocam-na).
- `calc_school_year(date)` e `cycle_for_year(int)`: search_path fixado.

4. Notas
- O frontend sera atualizado em separado para chamar send_gift/send_road (RPC).
- Nenhuma tabela foi apagada nem colunas alteradas: apenas trancos e funcoes novas.
*/

-- ===== 1. Fechar teacher_proposals =====
ALTER TABLE public.teacher_proposals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "teacher_reads_own_proposals" ON public.teacher_proposals;
CREATE POLICY "teacher_reads_own_proposals" ON public.teacher_proposals FOR SELECT
TO authenticated
USING (auth.uid() = teacher_id OR auth.uid() = student_id);

-- ===== 2. Presentes controlados pelo servidor =====
CREATE OR REPLACE FUNCTION public.send_gift(p_friend uuid, p_kind text, p_amount int)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_me uuid := auth.uid();
  v_amount int;
  v_kind text;
  v_my_coins int;
  v_my_res jsonb;
  v_have int;
BEGIN
  IF v_me IS NULL THEN
    RAISE EXCEPTION 'Sessão inválida';
  END IF;

  IF p_friend IS NULL OR p_friend = v_me THEN
    RAISE EXCEPTION 'Destinatário inválido';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM friendships f
    WHERE (f.user1_id = v_me AND f.user2_id = p_friend)
       OR (f.user2_id = v_me AND f.user1_id = p_friend)
  ) THEN
    RAISE EXCEPTION 'Só podes enviar presentes a amigos';
  END IF;

  v_amount := LEAST(GREATEST(COALESCE(p_amount, 0), 1), 50);
  v_kind := p_kind;

  IF v_kind NOT IN ('coins', 'wood', 'stone', 'iron', 'food') THEN
    RAISE EXCEPTION 'Tipo de presente inválido';
  END IF;

  SELECT coins, resources INTO v_my_coins, v_my_res
  FROM game_states WHERE user_id = v_me FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Estado de jogo não encontrado';
  END IF;

  IF v_kind = 'coins' THEN
    v_have := v_my_coins;
  ELSE
    v_have := COALESCE((v_my_res ->> v_kind)::int, 0);
  END IF;

  IF v_have < v_amount THEN
    RAISE EXCEPTION 'Recursos insuficientes';
  END IF;

  -- Debita ao remetente
  IF v_kind = 'coins' THEN
    UPDATE game_states SET coins = coins - v_amount WHERE user_id = v_me;
  ELSE
    UPDATE game_states
    SET resources = jsonb_set(v_my_res, ARRAY[v_kind],
      ((COALESCE(v_my_res ->> v_kind, '0')::int) - v_amount)::text::jsonb)
    WHERE user_id = v_me;
  END IF;

  -- Credita ao destinatario (upsert de seguranca)
  INSERT INTO game_states (user_id, coins, diamonds, xp, level, resources)
  VALUES (p_friend, 0, 0, 0, 1, '{}'::jsonb)
  ON CONFLICT (user_id) DO NOTHING;

  IF v_kind = 'coins' THEN
    UPDATE game_states SET coins = coins + v_amount WHERE user_id = p_friend;
  ELSE
    UPDATE game_states
    SET resources = jsonb_set(
      COALESCE(resources, '{}'::jsonb), ARRAY[v_kind],
      ((COALESCE(resources ->> v_kind, '0')::int) + v_amount)::text::jsonb)
    WHERE user_id = p_friend;
  END IF;

  INSERT INTO notifications (user_id, type, message)
  VALUES (
    p_friend,
    'gift',
    'Recebeste ' || v_amount || ' ' ||
    CASE v_kind
      WHEN 'coins' THEN 'moedas'
      WHEN 'wood' THEN 'madeira'
      WHEN 'stone' THEN 'pedra'
      WHEN 'iron' THEN 'ferro'
      ELSE 'comida'
    END || ' de um amigo!'
  );

  RETURN jsonb_build_object('amount', v_amount, 'kind', v_kind);
END;
$$;

-- ===== 2b. Batalhas controladas pelo servidor =====
CREATE OR REPLACE FUNCTION public.send_raid(p_target uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_me uuid := auth.uid();
  v_att_state game_states%ROWTYPE;
  v_def_state game_states%ROWTYPE;
  v_attack_roll int;
  v_defense_roll int;
  v_victory boolean;
  v_loot jsonb;
  v_att_name text;
  v_def_name text;
BEGIN
  IF v_me IS NULL THEN
    RAISE EXCEPTION 'Sessão inválida';
  END IF;

  IF p_target IS NULL OR p_target = v_me THEN
    RAISE EXCEPTION 'Alvo inválido';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM friendships f
    WHERE (f.user1_id = v_me AND f.user2_id = p_target)
       OR (f.user2_id = v_me AND f.user1_id = p_target)
  ) THEN
    RAISE EXCEPTION 'Só podes atacar amigos';
  END IF;

  SELECT * INTO v_att_state FROM game_states WHERE user_id = v_me FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Estado de jogo não encontrado';
  END IF;

  SELECT * INTO v_def_state FROM game_states WHERE user_id = p_target FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'A cidade do adversário não foi encontrada';
  END IF;

  v_attack_roll := floor(random() * 20)::int + 1 + COALESCE(v_att_state.attack_power, 0);
  v_defense_roll := floor(random() * 20)::int + 1 + COALESCE(v_def_state.defense_power, 0);
  v_victory := v_attack_roll > v_defense_roll;

  v_loot := NULL;
  IF v_victory THEN
    v_loot := jsonb_build_object(
      'coins', floor(COALESCE(v_def_state.coins, 0) * 0.1),
      'wood', floor(COALESCE(v_def_state.resources ->> 'wood', '0')::int * 0.1),
      'stone', floor(COALESCE(v_def_state.resources ->> 'stone', '0')::int * 0.1),
      'iron', floor(COALESCE(v_def_state.resources ->> 'iron', '0')::int * 0.1),
      'food', floor(COALESCE(v_def_state.resources ->> 'food', '0')::int * 0.1)
    );

    UPDATE game_states
    SET coins = COALESCE(coins, 0) - (v_loot ->> 'coins')::int,
        resources = jsonb_set(
          jsonb_set(
            jsonb_set(
              jsonb_set(
                COALESCE(resources, '{}'::jsonb),
                '{wood}', (GREATEST(COALESCE(resources ->> 'wood', '0')::int - (v_loot ->> 'wood')::int, 0))::text::jsonb
              ),
              '{stone}', (GREATEST(COALESCE(resources ->> 'stone', '0')::int - (v_loot ->> 'stone')::int, 0))::text::jsonb
            ),
            '{iron}', (GREATEST(COALESCE(resources ->> 'iron', '0')::int - (v_loot ->> 'iron')::int, 0))::text::jsonb
          ),
          '{food}', (GREATEST(COALESCE(resources ->> 'food', '0')::int - (v_loot ->> 'food')::int, 0))::text::jsonb
        )
    WHERE user_id = p_target;

    UPDATE game_states
    SET coins = COALESCE(coins, 0) + (v_loot ->> 'coins')::int,
        resources = jsonb_set(
          jsonb_set(
            jsonb_set(
              jsonb_set(
                COALESCE(resources, '{}'::jsonb),
                '{wood}', (COALESCE(resources ->> 'wood', '0')::int + (v_loot ->> 'wood')::int)::text::jsonb
              ),
              '{stone}', (COALESCE(resources ->> 'stone', '0')::int + (v_loot ->> 'stone')::int)::text::jsonb
            ),
            '{iron}', (COALESCE(resources ->> 'iron', '0')::int + (v_loot ->> 'iron')::int)::text::jsonb
          ),
          '{food}', (COALESCE(resources ->> 'food', '0')::int + (v_loot ->> 'food')::int)::text::jsonb
        )
    WHERE user_id = v_me;
  END IF;

  SELECT name INTO v_att_name FROM user_profiles WHERE id = v_me;
  SELECT name INTO v_def_name FROM user_profiles WHERE id = p_target;

  INSERT INTO raids (attacker_id, attacker_name, defender_id, defender_name,
    attack_power, defense_power, attack_roll, defense_roll, victory, loot)
  VALUES (v_me, COALESCE(v_att_name, 'Anónimo'), p_target, COALESCE(v_def_name, 'Aventureiro'),
    COALESCE(v_att_state.attack_power, 0), COALESCE(v_def_state.defense_power, 0),
    v_attack_roll, v_defense_roll, v_victory, v_loot);

  INSERT INTO notifications (user_id, type, message)
  VALUES (
    p_target,
    'raid',
    CASE WHEN v_victory
      THEN COALESCE(v_att_name, 'Alguém') || ' atacou a tua cidade e venceu! Perdeste recursos.'
      ELSE COALESCE(v_att_name, 'Alguém') || ' atacou a tua cidade mas a tua defesa resistiu!'
    END
  );

  RETURN jsonb_build_object(
    'victory', v_victory,
    'attack_roll', v_attack_roll,
    'defense_roll', v_defense_roll,
    'loot', v_loot,
    'message', CASE WHEN v_victory
      THEN 'Saqueaste recursos com sucesso!'
      ELSE 'A defesa inimiga foi demasiado forte!'
    END
  );
END;
$$;

-- ===== 3. Endurecer funcoes internas =====
REVOKE EXECUTE ON FUNCTION public.notify_new_message() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.auto_promote_school_year() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;

ALTER FUNCTION public.calc_school_year(date) SET search_path = public;
ALTER FUNCTION public.cycle_for_year(int) SET search_path = public;
