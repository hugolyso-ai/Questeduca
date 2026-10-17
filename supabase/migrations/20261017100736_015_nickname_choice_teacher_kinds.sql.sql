/*
# Nickname escolhido pelo aluno, professores tutelar/explicador e propagação de renome

1. Funções alteradas/criadas
- `start_student_signup(p_nickname)`: já não exige que o nickname seja igual ao autorizado; apenas valida que existe autorização ativa para o EMAIL autenticado. O nickname é o escolhido pelo aluno no registo (único entre alunos, sem espaços). Vincula authorized_user_id e fica automaticamente associado ao pai que autorizou (parent_id).
- `complete_student_auth()`: inalterada na prática; status → 'registered'.
- `rename_student(p_new_nickname)`: o PAI renomeia o filho; atualiza student_profiles, student_authorizations.nickname (para manter a lista coerente) e as referências de nome em quiz_duels (challenger_name/opponent_name) e friend_requests (from_nickname/to_nickname) das amizades ativas/pedidos. Único ponto de escrita — o aluno não pode mudar o próprio nickname.
2. Novas funções
- `set_child_nickname(p_student_user_id, p_new_nickname)`: alias seguro de rename (valida parentesco) usado pelo painel de pais.
3. Novas colunas
- `teacher_profiles.teacher_kind`: 'tutelar' (professor titular/tutelar) ou 'explicador' (professor explicador/centro de estudos). CHECK.
4. Novas policies
- `user_profiles`: UPDATE para o pai atualizar o próprio email/nome (necessário para SMTP/identificação). Sem impacto de segurança relevante: cada um só edita a própria linha.
5. Notas
- Como a autorização passa a ser só por email, um pai pode autorizar vários filhos com o mesmo email — por isso o UNIQUE(nickname, parent_id) deixa de ser o vínculo correto; a lista de autorizações continua a mostrar nicknames atuais do aluno (atualizada por rename_student).
*/

ALTER TABLE teacher_profiles ADD COLUMN IF NOT EXISTS teacher_kind text DEFAULT 'tutelar';
ALTER TABLE teacher_profiles DROP CONSTRAINT IF EXISTS teacher_profiles_kind_check;
ALTER TABLE teacher_profiles ADD CONSTRAINT teacher_profiles_kind_check
  CHECK (teacher_kind IN ('tutelar', 'explicador'));

CREATE OR REPLACE FUNCTION start_student_signup(p_nickname text)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_auth student_authorizations%ROWTYPE;
  v_email text;
  v_nick text;
BEGIN
  v_email := lower(coalesce(auth.jwt() ->> 'email', ''));
  IF v_email = '' THEN
    RAISE EXCEPTION 'Sem sessão ativa';
  END IF;

  SELECT * INTO v_auth
  FROM student_authorizations
  WHERE lower(student_email) = v_email
    AND status = 'authorized'
  ORDER BY created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Este email não está autorizado. Peça ao seu pai/encarregado de educação para o autorizar primeiro no painel de pais.';
  END IF;

  v_nick := trim(p_nickname);
  IF v_nick = '' OR v_nick ~ '\s' THEN
    RAISE EXCEPTION 'O nickname não pode ter espaços.';
  END IF;

  IF EXISTS (SELECT 1 FROM student_profiles WHERE lower(nickname) = lower(v_nick)) THEN
    RAISE EXCEPTION 'Esse nickname já está a ser usado por outro aluno. Escolhe outro.';
  END IF;

  INSERT INTO student_profiles (user_id, parent_id, nickname, approved_by_parent)
  VALUES (auth.uid(), v_auth.parent_id, v_nick, true)
  ON CONFLICT (user_id) DO NOTHING;

  UPDATE student_authorizations
  SET authorized_user_id = auth.uid()
  WHERE id = v_auth.id;

  RETURN v_nick;
END $$;

CREATE OR REPLACE FUNCTION set_child_nickname(p_student_user_id uuid, p_new_nickname text)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_old text;
  v_new text;
  v_parent uuid;
BEGIN
  v_new := trim(p_new_nickname);
  IF v_new = '' OR v_new ~ '\s' THEN
    RAISE EXCEPTION 'O nickname não pode ter espaços.';
  END IF;

  SELECT parent_id INTO v_parent FROM student_profiles WHERE user_id = p_student_user_id;
  IF NOT FOUND THEN RETURN 'not_found'; END IF;
  IF v_parent <> auth.uid() THEN RETURN 'forbidden'; END IF;

  IF EXISTS (SELECT 1 FROM student_profiles WHERE lower(nickname) = lower(v_new) AND user_id <> p_student_user_id) THEN
    RAISE EXCEPTION 'Esse nickname já está a ser usado por outro aluno.';
  END IF;

  SELECT nickname INTO v_old FROM student_profiles WHERE user_id = p_student_user_id;

  UPDATE student_profiles SET nickname = v_new WHERE user_id = p_student_user_id;

  -- Mantém as autorizações do pai coerentes com o nickname atual
  UPDATE student_authorizations
  SET nickname = v_new
  WHERE parent_id = auth.uid() AND authorized_user_id = p_student_user_id;

  -- Propaga para pedidos de amizade
  UPDATE friend_requests SET from_nickname = v_new WHERE from_user_id = p_student_user_id;
  UPDATE friend_requests SET to_nickname = v_new WHERE to_user_id = p_student_user_id;

  -- Propaga para duelos de quiz
  UPDATE quiz_duels SET challenger_name = v_new WHERE challenger_id = p_student_user_id;
  UPDATE quiz_duels SET opponent_name = v_new WHERE opponent_id = p_student_user_id;

  -- Notifica o filho e os professores
  INSERT INTO notifications (user_id, type, title, message)
  VALUES (p_student_user_id, 'profile', 'Nickname Atualizado', 'O seu novo nickname é ' || v_new || '.');

  RETURN v_new;
END $$;

REVOKE ALL ON FUNCTION start_student_signup(text) FROM anon, public;
REVOKE ALL ON FUNCTION set_child_nickname(uuid, text) FROM anon, public;
GRANT EXECUTE ON FUNCTION start_student_signup(text) TO authenticated;
GRANT EXECUTE ON FUNCTION set_child_nickname(uuid, text) TO authenticated;
