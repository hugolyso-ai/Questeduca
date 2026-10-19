/*
# Testes personalizados criados por professores

1. Novas Tabelas
- `teacher_custom_tests`: testes construídos pelo professor
  - `id` (uuid, primary key)
  - `teacher_id` (uuid, professor criador, default auth.uid())
  - `title` (text, título do teste)
  - `discipline` (text, disciplina)
  - `intro_text` (text, texto de introdução opcional)
  - `questions` (jsonb, array de perguntas: tipo single/multiple/open, opções, respostas corretas, pontos)
  - `total_points` (integer, soma dos pontos das perguntas — deve ser 100)
  - `attempts_allowed` (integer, tentativas permitidas, default 1)
  - `time_limit_minutes` (integer, null = sem cronómetro)
  - `target_class` (text, turma alvo normalizada em maiúsculas) / `target_student_id` (uuid, aluno específico)
  - `school_id` (text, escola para validar correspondência de turma)
  - `created_at` (timestamptz)
- `custom_test_submissions`: cada tentativa de um aluno
  - `id` (uuid, primary key)
  - `test_id` (uuid, referência ao teste)
  - `student_id` (uuid, aluno)
  - `attempt` (integer, número da tentativa)
  - `started_at` (timestamptz, início da tentativa), `submitted_at` (timestamptz, entrega)
  - `answers` (jsonb, respostas do aluno)
  - `status` (text: in_progress / submitted / correcting / corrected)
  - `corrections` (jsonb, por pergunta: percentagem atribuída + comentário)
  - `teacher_observations` (text, observações globais do professor)
  - `corrected_at` (timestamptz)

2. Funções (SECURITY DEFINER, verificação server-side)
- `start_custom_test_attempt(p_test_id)`: valida que o aluno é destinatário, que não excedeu as
  tentativas, cria a submissão em curso e devolve os dados do teste + nº de tentativa + início.
- `submit_custom_test_answers(p_submission_id, p_answers)`: valida aluno, estado e cronómetro
  (grace de 120s), grava respostas e notifica o professor.

3. Segurança (RLS)
- `teacher_custom_tests`: professor gerencia os seus testes; alunos leem apenas testes que
  lhes são dirigidos (aluno específico ou turma da sua escola, comparação sem maiúsculas).
- `custom_test_submissions`: aluno vê as suas tentativas; professor vê e corrige as dos seus testes.
*/
CREATE TABLE IF NOT EXISTS teacher_custom_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  discipline text,
  intro_text text,
  questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_points integer NOT NULL DEFAULT 100,
  attempts_allowed integer NOT NULL DEFAULT 1 CHECK (attempts_allowed BETWEEN 1 AND 10),
  time_limit_minutes integer CHECK (time_limit_minutes IS NULL OR (time_limit_minutes BETWEEN 1 AND 240)),
  target_class text,
  target_student_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS custom_test_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id uuid NOT NULL REFERENCES teacher_custom_tests(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  attempt integer NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  submitted_at timestamptz,
  answers jsonb,
  status text NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress','submitted','correcting','corrected')),
  corrections jsonb,
  teacher_observations text,
  corrected_at timestamptz,
  UNIQUE (test_id, student_id, attempt)
);

CREATE INDEX IF NOT EXISTS idx_custom_tests_teacher ON teacher_custom_tests(teacher_id);
CREATE INDEX IF NOT EXISTS idx_custom_tests_class ON teacher_custom_tests(upper(btrim(target_class)));
CREATE INDEX IF NOT EXISTS idx_submissions_test ON custom_test_submissions(test_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student ON custom_test_submissions(student_id);

ALTER TABLE teacher_custom_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_test_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "teacher_crud_own_tests" ON teacher_custom_tests;
CREATE POLICY "teacher_crud_own_tests" ON teacher_custom_tests FOR ALL
  TO authenticated USING (auth.uid() = teacher_id) WITH CHECK (auth.uid() = teacher_id);

DROP POLICY IF EXISTS "student_select_targeted_tests" ON teacher_custom_tests;
CREATE POLICY "student_select_targeted_tests" ON teacher_custom_tests FOR SELECT
  TO authenticated
  USING (
    target_student_id = auth.uid()
    OR (
      target_class IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM student_profiles sp
        WHERE sp.user_id = auth.uid()
          AND upper(btrim(coalesce(sp.class_name, ''))) = upper(btrim(teacher_custom_tests.target_class))
          AND (teacher_custom_tests.school_id IS NULL OR teacher_custom_tests.school_id = sp.school_id)
      )
    )
  );

DROP POLICY IF EXISTS "student_select_own_submissions" ON custom_test_submissions;
CREATE POLICY "student_select_own_submissions" ON custom_test_submissions FOR SELECT
  TO authenticated USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "student_update_own_inprogress" ON custom_test_submissions;
CREATE POLICY "student_update_own_inprogress" ON custom_test_submissions FOR UPDATE
  TO authenticated
  USING (auth.uid() = student_id AND status = 'in_progress')
  WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "teacher_select_test_submissions" ON custom_test_submissions;
CREATE POLICY "teacher_select_test_submissions" ON custom_test_submissions FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM teacher_custom_tests t WHERE t.id = custom_test_submissions.test_id AND t.teacher_id = auth.uid()));

DROP POLICY IF EXISTS "teacher_update_test_submissions" ON custom_test_submissions;
CREATE POLICY "teacher_update_test_submissions" ON custom_test_submissions FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM teacher_custom_tests t WHERE t.id = custom_test_submissions.test_id AND t.teacher_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM teacher_custom_tests t WHERE t.id = custom_test_submissions.test_id AND t.teacher_id = auth.uid()));

CREATE OR REPLACE FUNCTION start_custom_test_attempt(p_test_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_test teacher_custom_tests;
  v_student_class text;
  v_student_school text;
  v_used integer;
  v_attempt integer;
  v_existing custom_test_submissions;
  v_sub custom_test_submissions;
BEGIN
  SELECT * INTO v_test FROM teacher_custom_tests WHERE id = p_test_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Teste não encontrado.';
  END IF;

  SELECT class_name, school_id INTO v_student_class, v_student_school
  FROM student_profiles WHERE user_id = auth.uid();

  IF NOT (
    v_test.target_student_id = auth.uid()
    OR (
      v_test.target_class IS NOT NULL
      AND upper(btrim(coalesce(v_student_class, ''))) = upper(btrim(v_test.target_class))
      AND (v_test.school_id IS NULL OR v_test.school_id = v_student_school)
    )
  ) THEN
    RAISE EXCEPTION 'Este teste não te foi atribuído.';
  END IF;

  SELECT count(*) INTO v_used FROM custom_test_submissions
  WHERE test_id = p_test_id AND student_id = auth.uid() AND status <> 'in_progress';

  IF v_used >= v_test.attempts_allowed THEN
    RAISE EXCEPTION 'Já esgotaste as tuas % tentativas.', v_test.attempts_allowed;
  END IF;

  SELECT * INTO v_existing FROM custom_test_submissions
  WHERE test_id = p_test_id AND student_id = auth.uid() AND status = 'in_progress'
  ORDER BY started_at DESC LIMIT 1;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'submission_id', v_existing.id,
      'attempt', v_existing.attempt,
      'started_at', v_existing.started_at,
      'test', to_jsonb(v_test) - 'questions',
      'questions', v_test.questions
    );
  END IF;

  v_attempt := v_used + 1;
  INSERT INTO custom_test_submissions (test_id, student_id, attempt)
  VALUES (p_test_id, auth.uid(), v_attempt)
  RETURNING * INTO v_sub;

  RETURN jsonb_build_object(
    'submission_id', v_sub.id,
    'attempt', v_sub.attempt,
    'started_at', v_sub.started_at,
    'test', to_jsonb(v_test) - 'questions',
    'questions', v_test.questions
  );
END;
$$;

CREATE OR REPLACE FUNCTION submit_custom_test_answers(p_submission_id uuid, p_answers jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sub custom_test_submissions;
  v_test teacher_custom_tests;
BEGIN
  SELECT * INTO v_sub FROM custom_test_submissions WHERE id = p_submission_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tentativa não encontrada.';
  END IF;
  IF v_sub.student_id <> auth.uid() THEN
    RAISE EXCEPTION 'Sem permissão.';
  END IF;
  IF v_sub.status <> 'in_progress' THEN
    RAISE EXCEPTION 'Esta tentativa já foi entregue.';
  END IF;

  SELECT * INTO v_test FROM teacher_custom_tests WHERE id = v_sub.test_id;

  IF v_test.time_limit_minutes IS NOT NULL THEN
    IF now() - v_sub.started_at > make_interval(mins => v_test.time_limit_minutes) + interval '120 seconds' THEN
      RAISE EXCEPTION 'O tempo do teste já expirou — entrega fora do prazo.';
    END IF;
  END IF;

  UPDATE custom_test_submissions
  SET answers = p_answers, submitted_at = now(), status = 'submitted'
  WHERE id = p_submission_id;

  INSERT INTO notifications (user_id, type, title, message)
  VALUES (v_test.teacher_id, 'custom_test', 'Novo teste para corrigir',
    format('"%s" foi entregue pelo aluno (tentativa %s).', v_test.title, v_sub.attempt));
END;
$$;

GRANT EXECUTE ON FUNCTION start_custom_test_attempt(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION submit_custom_test_answers(uuid, jsonb) TO authenticated;
