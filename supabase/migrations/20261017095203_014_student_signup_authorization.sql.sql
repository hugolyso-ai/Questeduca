/*
# Fluxo de conta de aluno: entrada com email autorizado + vincular à autorização parental

1. Funções
- `start_student_signup(p_nickname)`: chamada no início do registo de aluno; valida que existe uma autorização ativa (status 'authorized') para o email autenticado com esse nickname; cria o aluno em student_profiles (parent_id, nickname, school_year/school/district da autorização, approved_by_parent = true); liga authorized_user_id; devolve o nickname ou lança erro.
- `complete_student_auth()`: chamada no fim do registo; vincula a autorização ao auth user (authorized_user_id + status 'registered').
2. Segurança
- Ambas SECURITY DEFINER com search_path fixo; exigem sessão autenticada.
*/

CREATE OR REPLACE FUNCTION start_student_signup(p_nickname text)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_auth student_authorizations%ROWTYPE;
  v_email text;
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

  IF lower(v_auth.nickname) <> lower(trim(p_nickname)) THEN
    RAISE EXCEPTION 'O nickname "%s" não corresponde ao autorizado pelo seu pai/encarregado ("%s").', p_nickname, v_auth.nickname;
  END IF;

  INSERT INTO student_profiles (user_id, parent_id, nickname, approved_by_parent)
  VALUES (auth.uid(), v_auth.parent_id, v_auth.nickname, true)
  ON CONFLICT (user_id) DO NOTHING;

  UPDATE student_authorizations
  SET authorized_user_id = auth.uid()
  WHERE id = v_auth.id;

  RETURN v_auth.nickname;
END $$;

CREATE OR REPLACE FUNCTION complete_student_auth()
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_email text;
BEGIN
  v_email := lower(coalesce(auth.jwt() ->> 'email', ''));
  UPDATE student_authorizations
  SET status = 'registered', authorized_user_id = auth.uid()
  WHERE lower(student_email) = v_email AND status = 'authorized';
  RETURN 'ok';
END $$;

REVOKE ALL ON FUNCTION start_student_signup(text) FROM anon, public;
REVOKE ALL ON FUNCTION complete_student_auth() FROM anon, public;
GRANT EXECUTE ON FUNCTION start_student_signup(text) TO authenticated;
GRANT EXECUTE ON FUNCTION complete_student_auth() TO authenticated;
