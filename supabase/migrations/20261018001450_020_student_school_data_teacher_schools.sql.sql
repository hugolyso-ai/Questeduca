/*
# Dados escolares do aluno + professor com várias escolas e anos

1. Novas colunas — `student_profiles`
- `birth_date` (date): data de nascimento do aluno (introduzida no registo; idade calculada a partir dela).
- `school_year_auto` (integer): ano escolar calculado automaticamente a partir da idade.
- `school_year_manual` (boolean): assinala se os pais já alteraram o ano à mão (bloqueia a promoção automática).

2. Novas colunas — `teacher_profiles` e `role_selection_requests`
- `teaching_years` (integer[]): anos escolares que leciona (1.º ao 9.º).
- `schools` (jsonb): lista de escolas do professor; cada entrada {school_id, school_name, district, municipality, locality}.
  O antigo `school_id`/`school_name`/`class_name` mantém-se para compatibilidade.

3. Funções novas/alteradas
- `is_authorized_student_email()`: recriada (DROP + CREATE) para passar a devolver { authorized, parent_id } —
  usada na validação em background no formulário de registo de aluno.
- `start_student_signup(p_nickname)`: passa a exigir APENAS email autorizado (status 'authorized' ou 'registered');
  nickname continuo único entre alunos. Vincula ao pai que autorizou.
- `calc_school_year(p_birth_date)`: ano escolar pela idade (idade atingida em 31/12 do ano letivo; 6 anos → 1.º ano).
- `complete_student_signup(p_birth_date)`: guarda nascimento + ano automático no perfil do aluno autenticado.
- `auto_promote_school_year()`: a 1 de setembro recalcula o ano automático de todos os alunos não-editados manualmente.
- `approve_role_request(...)`: recriada para copiar `teaching_years` e `schools` para teacher_profiles.
- `submit_google_role_request(...)`: recriada com novos parâmetros p_teaching_years e p_schools (teacher).

4. Segurança
- Sem alterações de policies; funções SECURITY DEFINER com search_path fixo; EXECUTE revogado de anon/public
  e concedido a authenticated.
*/

-- ============ COLUNAS NOVAS ============
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS birth_date date;
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS school_year_auto integer;
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS school_year_manual boolean NOT NULL DEFAULT false;

ALTER TABLE teacher_profiles ADD COLUMN IF NOT EXISTS teaching_years integer[] NOT NULL DEFAULT '{}';
ALTER TABLE teacher_profiles ADD COLUMN IF NOT EXISTS schools jsonb NOT NULL DEFAULT '[]';

ALTER TABLE role_selection_requests ADD COLUMN IF NOT EXISTS teaching_years integer[] NOT NULL DEFAULT '{}';
ALTER TABLE role_selection_requests ADD COLUMN IF NOT EXISTS schools jsonb NOT NULL DEFAULT '[]';

-- ============ CÁLCULO DO ANO ESCOLAR ============
CREATE OR REPLACE FUNCTION calc_school_year(p_birth_date date)
RETURNS integer
LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
  v_month int := extract(month from current_date)::int;
  v_year int := extract(year from current_date)::int;
  v_ref int := CASE WHEN v_month >= 9 THEN v_year ELSE v_year - 1 END;
  v_age_ref int;
BEGIN
  IF p_birth_date IS NULL THEN
    RETURN NULL;
  END IF;
  v_age_ref := v_ref - extract(year from p_birth_date)::int;
  IF v_age_ref < 6 THEN RETURN NULL; END IF;
  RETURN LEAST(v_age_ref - 5, 12);
END $$;

-- ============ VALIDAÇÃO EM BACKGROUND (drop para mudar o tipo de retorno) ============
DROP FUNCTION IF EXISTS is_authorized_student_email();

CREATE OR REPLACE FUNCTION is_authorized_student_email()
RETURNS TABLE (authorized boolean, parent_id uuid)
LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE AS $$
  SELECT EXISTS (
    SELECT 1
    FROM student_authorizations sa
    WHERE lower(sa.student_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      AND sa.status IN ('authorized', 'registered')
  ), NULL::uuid;
$$;

REVOKE ALL ON FUNCTION is_authorized_student_email() FROM anon, public;
GRANT EXECUTE ON FUNCTION is_authorized_student_email() TO authenticated;

-- ============ REGISTO DE ALUNO: valida APENAS o email ============
CREATE OR REPLACE FUNCTION start_student_signup(p_nickname text)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_auth student_authorizations%ROWTYPE;
  v_email text;
  v_nick text := trim(p_nickname);
BEGIN
  v_email := lower(coalesce(auth.jwt() ->> 'email', ''));
  IF v_email = '' THEN
    RAISE EXCEPTION 'Sem sessão ativa';
  END IF;

  SELECT * INTO v_auth
  FROM student_authorizations
  WHERE lower(student_email) = v_email
    AND status IN ('authorized', 'registered')
  ORDER BY created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Este email não está autorizado. Peça ao seu pai/encarregado de educação para o autorizar primeiro no painel de pais.';
  END IF;

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

-- ============ FINALIZAÇÃO DO REGISTO: nascimento → ano escolar automático ============
CREATE OR REPLACE FUNCTION complete_student_signup(p_birth_date date)
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_year integer;
BEGIN
  IF p_birth_date IS NULL THEN
    RAISE EXCEPTION 'Indique a data de nascimento.';
  END IF;
  IF p_birth_date > current_date THEN
    RAISE EXCEPTION 'A data de nascimento não pode ser no futuro.';
  END IF;

  v_year := calc_school_year(p_birth_date);

  UPDATE student_profiles
  SET birth_date = p_birth_date,
      school_year_auto = v_year,
      school_year = CASE WHEN school_year_manual THEN school_year ELSE coalesce(v_year::text, school_year) END
  WHERE user_id = auth.uid();

  RETURN v_year;
END $$;

REVOKE ALL ON FUNCTION complete_student_signup(date) FROM anon, public;
GRANT EXECUTE ON FUNCTION complete_student_signup(date) TO authenticated;

-- ============ PROMOÇÃO AUTOMÁTICA DE ANO NO INÍCIO DE CADA ANO LETIVO ============
CREATE OR REPLACE FUNCTION auto_promote_school_year()
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_count integer;
BEGIN
  IF extract(month from current_date)::int <> 9 OR extract(day from current_date)::int <> 1 THEN
    RETURN 0;
  END IF;

  UPDATE student_profiles
  SET school_year_auto = calc_school_year(birth_date),
      school_year = CASE
        WHEN school_year_manual THEN school_year
        WHEN calc_school_year(birth_date) IS NOT NULL THEN calc_school_year(birth_date)::text
        ELSE school_year
      END
  WHERE birth_date IS NOT NULL;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END $$;

REVOKE ALL ON FUNCTION auto_promote_school_year() FROM anon, public;
GRANT EXECUTE ON FUNCTION auto_promote_school_year() TO authenticated;

-- ============ APROVAÇÃO DE PROFESSOR: copia anos e escolas ============
CREATE OR REPLACE FUNCTION approve_role_request(p_user_id uuid, p_approve boolean, p_reason text DEFAULT NULL::text)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_req role_selection_requests%ROWTYPE;
  v_admin uuid := auth.uid();
  v_name text;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE id = v_admin AND role = 'admin') THEN
    RAISE EXCEPTION 'Apenas o administrador pode executar esta ação.';
  END IF;

  SELECT * INTO v_req FROM role_selection_requests WHERE user_id = p_user_id;
  IF NOT FOUND THEN
    RETURN 'not_found';
  END IF;

  IF p_approve THEN
    IF v_req.chosen_role = 'teacher' THEN
      v_name := coalesce((SELECT name FROM user_profiles WHERE id = p_user_id), 'Professor');
      INSERT INTO user_profiles (id, email, name, role, mobile_phone, proof_document_name, proof_document_url, approval_status, approved_at)
      VALUES (p_user_id, v_req.email, v_name, 'teacher', v_req.mobile_phone,
              v_req.proof_document_name, v_req.proof_document_url, 'approved', now())
      ON CONFLICT (id) DO UPDATE SET role = 'teacher', approval_status = 'approved', approved_at = now(),
        rejected_reason = NULL, mobile_phone = v_req.mobile_phone,
        proof_document_name = v_req.proof_document_name, proof_document_url = v_req.proof_document_url;

      INSERT INTO teacher_profiles (user_id, disciplines, school_id, school_name, class_name, teacher_kind, teaching_years, schools)
      VALUES (p_user_id, coalesce(v_req.disciplines,'{}'), v_req.school_id, v_req.school_name, v_req.class_name,
              coalesce(v_req.teacher_kind,'tutelar'), coalesce(v_req.teaching_years,'{}'),
              CASE WHEN jsonb_array_length(coalesce(v_req.schools,'[]'::jsonb)) > 0
                   THEN coalesce(v_req.schools,'[]'::jsonb)
                   ELSE CASE WHEN v_req.school_id IS NOT NULL
                        THEN jsonb_build_array(jsonb_build_object(
                              'school_id', v_req.school_id, 'school_name', v_req.school_name,
                              'district', NULL, 'municipality', NULL, 'locality', NULL))
                        ELSE '[]'::jsonb END
              END)
      ON CONFLICT (user_id) DO UPDATE SET disciplines = coalesce(v_req.disciplines,'{}'),
        school_id = v_req.school_id, school_name = v_req.school_name, class_name = v_req.class_name,
        teacher_kind = coalesce(v_req.teacher_kind,'tutelar'),
        teaching_years = coalesce(v_req.teaching_years,'{}'),
        schools = CASE WHEN jsonb_array_length(coalesce(v_req.schools,'[]'::jsonb)) > 0
                   THEN coalesce(v_req.schools,'[]'::jsonb)
                   ELSE CASE WHEN v_req.school_id IS NOT NULL
                        THEN jsonb_build_array(jsonb_build_object(
                              'school_id', v_req.school_id, 'school_name', v_req.school_name,
                              'district', NULL, 'municipality', NULL, 'locality', NULL))
                        ELSE '[]'::jsonb END
              END;

    ELSIF v_req.chosen_role = 'association' THEN
      v_name := coalesce((SELECT name FROM user_profiles WHERE id = p_user_id), coalesce(v_req.association_name,'Associação'));
      INSERT INTO user_profiles (id, email, name, role, mobile_phone, proof_document_name, proof_document_url, approval_status, approved_at)
      VALUES (p_user_id, v_req.email, v_name, 'association', v_req.mobile_phone,
              v_req.proof_document_name, v_req.proof_document_url, 'approved', now())
      ON CONFLICT (id) DO UPDATE SET role = 'association', approval_status = 'approved', approved_at = now(),
        rejected_reason = NULL, mobile_phone = v_req.mobile_phone,
        proof_document_name = v_req.proof_document_name, proof_document_url = v_req.proof_document_url;

      INSERT INTO association_profiles (user_id, association_name, district, municipality, locality, school_id, school_name,
        iban, responsible_names, association_code, approved)
      VALUES (p_user_id, v_req.association_name, v_req.district, v_req.municipality, v_req.locality,
        v_req.school_id, v_req.school_name, v_req.iban, coalesce(v_req.responsible_names,'{}'),
        coalesce(v_req.association_code, upper(substr(md5(random()::text),1,8))), true)
      ON CONFLICT (user_id) DO UPDATE SET association_name = v_req.association_name, approved = true;
    END IF;

    UPDATE role_selection_requests SET reviewed_at = now(), reviewed_by = v_admin WHERE user_id = p_user_id;
    INSERT INTO notifications (user_id, type, title, message)
    VALUES (p_user_id, 'approval', 'Conta aprovada', 'A sua conta foi aprovada pelo administrador. Já pode entrar.');
    RETURN 'approved';

  ELSE
    UPDATE user_profiles SET approval_status = 'rejected', rejected_reason = p_reason WHERE id = p_user_id;
    UPDATE role_selection_requests SET reviewed_at = now(), reviewed_by = v_admin, rejected_reason = p_reason WHERE user_id = p_user_id;
    INSERT INTO notifications (user_id, type, title, message)
    VALUES (p_user_id, 'approval', 'Conta rejeitada', coalesce(p_reason, 'A sua conta não foi aprovada pelo administrador.'));
    RETURN 'rejected';
  END IF;
END $$;

REVOKE ALL ON FUNCTION approve_role_request(uuid, boolean, text) FROM anon, public;
GRANT EXECUTE ON FUNCTION approve_role_request(uuid, boolean, text) TO authenticated;

-- ============ SUBMISSÃO DO PEDIDO VIA GOOGLE: novos campos do professor ============
CREATE OR REPLACE FUNCTION submit_google_role_request(
  p_chosen_role text,
  p_mobile_phone text DEFAULT NULL,
  p_proof_name text DEFAULT NULL,
  p_proof_url text DEFAULT NULL,
  p_school_id text DEFAULT NULL,
  p_school_name text DEFAULT NULL,
  p_class_name text DEFAULT NULL,
  p_teacher_kind text DEFAULT NULL,
  p_disciplines text[] DEFAULT NULL,
  p_association_name text DEFAULT NULL,
  p_district text DEFAULT NULL,
  p_municipality text DEFAULT NULL,
  p_locality text DEFAULT NULL,
  p_iban text DEFAULT NULL,
  p_responsible_names text[] DEFAULT NULL,
  p_association_code text DEFAULT NULL,
  p_teaching_years integer[] DEFAULT NULL,
  p_schools jsonb DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_email text;
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Sem sessão ativa';
  END IF;

  SELECT lower(coalesce(email,'')) INTO v_email FROM user_profiles WHERE id = v_uid;
  IF coalesce(v_email,'') = '' THEN
    v_email := lower(coalesce(auth.jwt() ->> 'email',''));
  END IF;

  IF p_chosen_role = 'student' THEN
    PERFORM start_student_signup(NULL);
    UPDATE user_profiles SET role = 'student', approval_status = 'approved' WHERE id = v_uid;
    DELETE FROM role_selection_requests WHERE user_id = v_uid;
    RETURN 'student';

  ELSIF p_chosen_role = 'parent' THEN
    UPDATE user_profiles SET role = 'parent', approval_status = 'approved' WHERE id = v_uid;
    INSERT INTO parent_profiles (user_id) VALUES (v_uid) ON CONFLICT (user_id) DO NOTHING;
    DELETE FROM role_selection_requests WHERE user_id = v_uid;
    RETURN 'parent';

  ELSIF p_chosen_role = 'teacher' THEN
    IF p_mobile_phone IS NULL OR trim(p_mobile_phone) = '' THEN
      RAISE EXCEPTION 'Indique o contacto móvel.';
    END IF;
    IF p_proof_name IS NULL OR trim(p_proof_name) = '' THEN
      RAISE EXCEPTION 'Anexe o comprovativo (cédula profissional ou declaração da escola).';
    END IF;

    INSERT INTO role_selection_requests (user_id, email, chosen_role, mobile_phone, proof_document_name, proof_document_url,
      school_id, school_name, class_name, teacher_kind, disciplines, teaching_years, schools)
    VALUES (v_uid, v_email, 'teacher', trim(p_mobile_phone), p_proof_name, p_proof_url,
      p_school_id, p_school_name, p_class_name, coalesce(p_teacher_kind,'tutelar'), coalesce(p_disciplines,'{}'),
      coalesce(p_teaching_years,'{}'), coalesce(p_schools,'[]'::jsonb))
    ON CONFLICT (user_id) DO UPDATE SET
      chosen_role = 'teacher', email = excluded.email, mobile_phone = excluded.mobile_phone,
      proof_document_name = excluded.proof_document_name, proof_document_url = excluded.proof_document_url,
      school_id = excluded.school_id, school_name = excluded.school_name, class_name = excluded.class_name,
      teacher_kind = excluded.teacher_kind, disciplines = excluded.disciplines,
      teaching_years = excluded.teaching_years, schools = excluded.schools,
      created_at = now(), reviewed_at = NULL, reviewed_by = NULL, rejected_reason = NULL;

    UPDATE user_profiles SET role = 'pending_teacher', approval_status = 'pending', mobile_phone = trim(p_mobile_phone)
    WHERE id = v_uid;
    RETURN 'pending_teacher';

  ELSIF p_chosen_role = 'association' THEN
    IF p_mobile_phone IS NULL OR trim(p_mobile_phone) = '' THEN
      RAISE EXCEPTION 'Indique o contacto móvel.';
    END IF;
    IF p_proof_name IS NULL OR trim(p_proof_name) = '' THEN
      RAISE EXCEPTION 'Anexe o comprovativo da atividade da associação.';
    END IF;

    INSERT INTO role_selection_requests (user_id, email, chosen_role, mobile_phone, proof_document_name, proof_document_url,
      association_name, district, municipality, locality, iban, responsible_names, association_code)
    VALUES (v_uid, v_email, 'association', trim(p_mobile_phone), p_proof_name, p_proof_url,
      p_association_name, p_district, p_municipality, p_locality, p_iban, coalesce(p_responsible_names,'{}'),
      coalesce(p_association_code, upper(substr(md5(random()::text),1,8))))
    ON CONFLICT (user_id) DO UPDATE SET
      chosen_role = 'association', email = excluded.email, mobile_phone = excluded.mobile_phone,
      proof_document_name = excluded.proof_document_name, proof_document_url = excluded.proof_document_url,
      association_name = excluded.association_name, district = excluded.district,
      municipality = excluded.municipality, locality = excluded.locality, iban = excluded.iban,
      responsible_names = excluded.responsible_names, association_code = excluded.association_code,
      created_at = now(), reviewed_at = NULL, reviewed_by = NULL, rejected_reason = NULL;

    UPDATE user_profiles SET role = 'pending_association', approval_status = 'pending', mobile_phone = trim(p_mobile_phone)
    WHERE id = v_uid;
    RETURN 'pending_association';

  END IF;

  RAISE EXCEPTION 'Papel inválido';
END $$;

REVOKE ALL ON FUNCTION submit_google_role_request(text, text, text, text, text, text, text, text, text[], text, text, text, text, text, text[], text, integer[], jsonb) FROM anon, public;
GRANT EXECUTE ON FUNCTION submit_google_role_request(text, text, text, text, text, text, text, text, text[], text, text, text, text, text, text[], text, integer[], jsonb) TO authenticated;
