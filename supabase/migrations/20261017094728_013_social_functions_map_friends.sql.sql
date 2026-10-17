/*
# Funções sociais: diretório de alunos, pins de amigos e amizades com dupla autorização parental

1. Funções (todas SECURITY DEFINER, EXECUTE apenas para authenticated)
- `search_students(p_query, p_district, p_municipality, p_locality)`: diretório público de alunos inscritos (nickname, localização, escola, ano, nível) para o mapa de Portugal. Nunca devolve emails. Exclui o próprio utilizador.
- `get_student_counts_by_district()`: nº de alunos inscritos por distrito (apenas agregados).
- `get_friend_locations()`: localização e nível dos amigos do utilizador atual.
- `send_friend_request(p_to_user_id)`: cria um pedido de amizade em `friend_requests` com status 'pending_parent_req' (requester_parent_ok = false) e notifica o PAI de quem pede para autorizar. Devolve código de resultado ('pending_parent', 'already_friends', 'already_pending', 'not_student', 'self', 'not_found').
- `parent_approve_friend_request(p_request_id)`: o pai aprova o pedido de um filho (emissor OU recetor). Define requester_parent_ok/recipient_parent_ok; quando ambas as autorizações estão ativas, finaliza com status 'accepted', cria a amizade em `friendships` e notifica os dois alunos. Devolve 'accepted' ou 'waiting_other'.
- `parent_reject_friend_request(p_request_id)`: o pai rejeita o pedido (status 'rejected').
2. Segurança
- Nenhuma policy alterada; as funções validam sempre auth.uid() e relações de parentesco em student_profiles.
*/

CREATE OR REPLACE FUNCTION search_students(
  p_query text DEFAULT '',
  p_district text DEFAULT NULL,
  p_municipality text DEFAULT NULL,
  p_locality text DEFAULT NULL
)
RETURNS TABLE (user_id uuid, nickname text, district text, municipality text, locality text, school_name text, school_year int, level int)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT sp.user_id, sp.nickname, sp.district, sp.municipality, sp.locality, sp.school_name,
         sp.school_year::int, COALESCE(gs.level, 1)
  FROM student_profiles sp
  LEFT JOIN game_states gs ON gs.user_id = sp.user_id
  WHERE sp.user_id <> auth.uid()
    AND (p_query = '' OR sp.nickname ILIKE '%' || p_query || '%' OR sp.school_name ILIKE '%' || p_query || '%')
    AND (p_district IS NULL OR sp.district = p_district)
    AND (p_municipality IS NULL OR sp.municipality = p_municipality)
    AND (p_locality IS NULL OR sp.locality = p_locality)
  ORDER BY sp.nickname
  LIMIT 100;
$$;

CREATE OR REPLACE FUNCTION get_student_counts_by_district()
RETURNS TABLE (district text, student_count bigint)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT sp.district, count(*)::bigint
  FROM student_profiles sp
  WHERE sp.district IS NOT NULL AND sp.district <> ''
  GROUP BY sp.district;
$$;

CREATE OR REPLACE FUNCTION get_friend_locations()
RETURNS TABLE (friend_id uuid, nickname text, district text, municipality text, locality text, school_name text, level int)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT sp.user_id, sp.nickname, sp.district, sp.municipality, sp.locality, sp.school_name,
         COALESCE(gs.level, 1)
  FROM friendships f
  JOIN student_profiles sp ON sp.user_id = CASE WHEN f.user1_id = auth.uid() THEN f.user2_id ELSE f.user1_id END
  LEFT JOIN game_states gs ON gs.user_id = sp.user_id
  WHERE f.user1_id = auth.uid() OR f.user2_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION send_friend_request(p_to_user_id uuid)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_from_nick text;
  v_from_parent uuid;
  v_to_nick text;
  v_to_parent uuid;
BEGIN
  SELECT sp.nickname, sp.parent_id INTO v_from_nick, v_from_parent
  FROM student_profiles sp WHERE sp.user_id = auth.uid();
  IF NOT FOUND THEN RETURN 'not_student'; END IF;

  IF p_to_user_id = auth.uid() THEN RETURN 'self'; END IF;

  SELECT sp.nickname, sp.parent_id INTO v_to_nick, v_to_parent
  FROM student_profiles sp WHERE sp.user_id = p_to_user_id;
  IF NOT FOUND THEN RETURN 'not_found'; END IF;

  IF EXISTS (
    SELECT 1 FROM friendships f
    WHERE (f.user1_id = auth.uid() AND f.user2_id = p_to_user_id)
       OR (f.user1_id = p_to_user_id AND f.user2_id = auth.uid())
  ) THEN RETURN 'already_friends'; END IF;

  IF EXISTS (
    SELECT 1 FROM friend_requests r
    WHERE r.status IN ('pending', 'approved', 'pending_parent_req', 'pending_parent_rcp')
      AND ((r.from_user_id = auth.uid() AND r.to_user_id = p_to_user_id)
        OR (r.from_user_id = p_to_user_id AND r.to_user_id = auth.uid()))
  ) THEN RETURN 'already_pending'; END IF;

  INSERT INTO friend_requests (from_user_id, from_nickname, to_user_id, to_nickname, status, requester_parent_ok, recipient_parent_ok)
  VALUES (auth.uid(), v_from_nick, p_to_user_id, v_to_nick, 'pending_parent_req', false, false);

  INSERT INTO notifications (user_id, type, title, message)
  VALUES (v_from_parent, 'friend_request', 'Pedido de Amizade para Autorizar',
    'O seu filho ' || v_from_nick || ' quer adicionar ' || v_to_nick || ' como amigo. Autorize no painel de pais.');

  RETURN 'pending_parent';
END $$;

CREATE OR REPLACE FUNCTION parent_approve_friend_request(p_request_id uuid)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r friend_requests%ROWTYPE;
  v_side text;
  v_other_parent uuid;
BEGIN
  SELECT * INTO r FROM friend_requests WHERE id = p_request_id;
  IF NOT FOUND THEN RETURN 'not_found'; END IF;

  IF EXISTS (SELECT 1 FROM student_profiles sp WHERE sp.user_id = r.from_user_id AND sp.parent_id = auth.uid()) THEN
    v_side := 'requester';
  ELSIF EXISTS (SELECT 1 FROM student_profiles sp WHERE sp.user_id = r.to_user_id AND sp.parent_id = auth.uid()) THEN
    v_side := 'recipient';
  ELSE
    RETURN 'forbidden';
  END IF;

  IF r.status = 'rejected' THEN RETURN 'rejected'; END IF;

  IF v_side = 'requester' THEN
    IF r.requester_parent_ok THEN RETURN 'already'; END IF;
    UPDATE friend_requests SET requester_parent_ok = true WHERE id = p_request_id;
  ELSE
    IF r.recipient_parent_ok THEN RETURN 'already'; END IF;
    UPDATE friend_requests SET recipient_parent_ok = true WHERE id = p_request_id;
  END IF;

  SELECT (SELECT sp.parent_id FROM student_profiles sp WHERE sp.user_id = r.to_user_id)
  INTO v_other_parent;

  SELECT * INTO r FROM friend_requests WHERE id = p_request_id;
  IF r.requester_parent_ok AND r.recipient_parent_ok THEN
    UPDATE friend_requests SET status = 'accepted' WHERE id = p_request_id;
    INSERT INTO friendships (user1_id, user2_id) VALUES (r.from_user_id, r.to_user_id);
    INSERT INTO notifications (user_id, type, title, message) VALUES
      (r.from_user_id, 'friend_request', 'Novo Amigo!', 'Vocês são agora amigos!'),
      (r.to_user_id, 'friend_request', 'Novo Amigo!', 'Vocês são agora amigos!');
    RETURN 'accepted';
  ELSE
    UPDATE friend_requests SET status = 'pending_parent_rcp' WHERE id = p_request_id;
    -- Notifica o pai do recetor (se ainda não aprovou) e o aluno recetor
    IF NOT r.recipient_parent_ok AND v_other_parent IS NOT NULL THEN
      INSERT INTO notifications (user_id, type, title, message)
      VALUES (v_other_parent, 'friend_request', 'Pedido de Amizade para Autorizar',
        'O seu filho ' || r.to_nickname || ' recebeu um pedido de amizade de ' || r.from_nickname || '. Autorize no painel de pais.');
    END IF;
    INSERT INTO notifications (user_id, type, title, message)
    VALUES (r.to_user_id, 'friend_request', 'Pedido de Amizade', r.from_nickname || ' quer ser teu amigo! (à espera da autorização dos teus pais)');
    RETURN 'waiting_other';
  END IF;
END $$;

CREATE OR REPLACE FUNCTION parent_reject_friend_request(p_request_id uuid)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_side text;
  r friend_requests%ROWTYPE;
BEGIN
  SELECT * INTO r FROM friend_requests WHERE id = p_request_id;
  IF NOT FOUND THEN RETURN 'not_found'; END IF;

  IF EXISTS (SELECT 1 FROM student_profiles sp WHERE sp.user_id = r.from_user_id AND sp.parent_id = auth.uid()) THEN
    v_side := 'requester';
  ELSIF EXISTS (SELECT 1 FROM student_profiles sp WHERE sp.user_id = r.to_user_id AND sp.parent_id = auth.uid()) THEN
    v_side := 'recipient';
  ELSE
    RETURN 'forbidden';
  END IF;

  UPDATE friend_requests SET status = 'rejected' WHERE id = p_request_id;
  RETURN 'rejected';
END $$;

REVOKE ALL ON FUNCTION search_students(text, text, text, text) FROM anon, public;
REVOKE ALL ON FUNCTION get_student_counts_by_district() FROM anon, public;
REVOKE ALL ON FUNCTION get_friend_locations() FROM anon, public;
REVOKE ALL ON FUNCTION send_friend_request(uuid) FROM anon, public;
REVOKE ALL ON FUNCTION parent_approve_friend_request(uuid) FROM anon, public;
REVOKE ALL ON FUNCTION parent_reject_friend_request(uuid) FROM anon, public;

GRANT EXECUTE ON FUNCTION search_students(text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_student_counts_by_district() TO authenticated;
GRANT EXECUTE ON FUNCTION get_friend_locations() TO authenticated;
GRANT EXECUTE ON FUNCTION send_friend_request(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION parent_approve_friend_request(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION parent_reject_friend_request(uuid) TO authenticated;
