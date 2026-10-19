/*
# Testes automáticos enviados por professores

1. Novas Tabelas
- `quiz_tests`: definição do teste automático criado pelo professor
  - `id` (uuid), `teacher_id` (uuid, default auth.uid()), `teacher_name` (text)
  - `title`, `disciplines` (text[], uma ou mais disciplinas)
  - `mode` ('random' = perguntas aleatórias sem validação | 'curated' = professor pré-seleciona)
  - `question_count` (nº de perguntas que cada aluno recebe)
  - `pool_question_ids` (uuid[] — no modo curated, o professor escolhe 2x question_count
    e o sistema distribui aleatoriamente question_count por aluno)
  - `attempts_allowed`, `time_limit_minutes` (null = sem cronómetro)
  - `target_class` / `target_student_id` / `school_id`
  - `retain_until` (date — guardado até ao início do ano letivo seguinte)
- `quiz_test_instances`: cada tentativa de um aluno, com as perguntas sorteadas para ele
  - `question_ids` (uuid[], sorteados no servidor), `answers` (jsonb),
  - `score_percent` (0..100, correção automática), `correct_count`
  - `status` (in_progress | submitted)

2. Funções (SECURITY DEFINER)
- `start_quiz_test_instance(p_test_id)`: valida destinatário e tentativas, sorteia as perguntas
  (do pool curated ou de todas as disciplinas selecionadas) no servidor e devolve as perguntas.
- `submit_quiz_test(p_instance_id, p_answers)`: corrige automaticamente, guarda a nota e
  notifica o professor.
- `revise_custom_test_correction(...)`: ver migration anterior; aqui `revise_submission_once`
  permite ao professor rever UMA vez a correção já terminada, ficando depois bloqueada.

3. Segurança (RLS): professor gere os seus testes; alunos leem os que lhes são dirigidos e
  acedem apenas às suas próprias instâncias.
*/
CREATE TABLE IF NOT EXISTS quiz_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  teacher_name text NOT NULL DEFAULT '',
  title text NOT NULL,
  disciplines text[] NOT NULL DEFAULT '{}',
  mode text NOT NULL DEFAULT 'random' CHECK (mode IN ('random','curated')),
  question_count integer NOT NULL DEFAULT 10 CHECK (question_count BETWEEN 3 AND 20),
  pool_question_ids uuid[] NOT NULL DEFAULT '{}',
  attempts_allowed integer NOT NULL DEFAULT 1 CHECK (attempts_allowed BETWEEN 1 AND 10),
  time_limit_minutes integer CHECK (time_limit_minutes IS NULL OR (time_limit_minutes BETWEEN 1 AND 240)),
  target_class text,
  target_student_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id text,
  retain_until date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS quiz_test_instances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id uuid NOT NULL REFERENCES quiz_tests(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  attempt integer NOT NULL,
  question_ids uuid[] NOT NULL,
  answers jsonb,
  score_percent numeric,
  correct_count integer,
  started_at timestamptz NOT NULL DEFAULT now(),
  submitted_at timestamptz,
  status text NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress','submitted')),
  UNIQUE (test_id, student_id, attempt)
);

CREATE INDEX IF NOT EXISTS idx_quiz_tests_teacher ON quiz_tests(teacher_id);
CREATE INDEX IF NOT EXISTS idx_quiz_instances_test ON quiz_test_instances(test_id);
CREATE INDEX IF NOT EXISTS idx_quiz_instances_student ON quiz_test_instances(student_id);

ALTER TABLE quiz_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_test_instances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "teacher_crud_quiz_tests" ON quiz_tests;
CREATE POLICY "teacher_crud_quiz_tests" ON quiz_tests FOR ALL
  TO authenticated USING (auth.uid() = teacher_id) WITH CHECK (auth.uid() = teacher_id);

DROP POLICY IF EXISTS "student_select_targeted_quiz_tests" ON quiz_tests;
CREATE POLICY "student_select_targeted_quiz_tests" ON quiz_tests FOR SELECT
  TO authenticated
  USING (
    target_student_id = auth.uid()
    OR (
      target_class IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM student_profiles sp
        WHERE sp.user_id = auth.uid()
          AND upper(btrim(coalesce(sp.class_name, ''))) = upper(btrim(quiz_tests.target_class))
          AND (quiz_tests.school_id IS NULL OR quiz_tests.school_id = sp.school_id)
      )
    )
  );

DROP POLICY IF EXISTS "student_select_own_instances" ON quiz_test_instances;
CREATE POLICY "student_select_own_instances" ON quiz_test_instances FOR SELECT
  TO authenticated USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "student_update_own_inprogress_instances" ON quiz_test_instances;
CREATE POLICY "student_update_own_inprogress_instances" ON quiz_test_instances FOR UPDATE
  TO authenticated
  USING (auth.uid() = student_id AND status = 'in_progress')
  WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "teacher_select_instances" ON quiz_test_instances;
CREATE POLICY "teacher_select_instances" ON quiz_test_instances FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM quiz_tests t WHERE t.id = quiz_test_instances.test_id AND t.teacher_id = auth.uid()));

-- Inicia uma tentativa: sorteio das perguntas feito no servidor (diferente para cada aluno)
CREATE OR REPLACE FUNCTION start_quiz_test_instance(p_test_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_test quiz_tests;
  v_student_class text;
  v_student_school text;
  v_used integer;
  v_attempt integer;
  v_pool uuid[];
  v_picked uuid[];
  v_sub quiz_test_instances;
  v_questions jsonb;
BEGIN
  SELECT * INTO v_test FROM quiz_tests WHERE id = p_test_id;
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

  SELECT count(*) INTO v_used FROM quiz_test_instances
  WHERE test_id = p_test_id AND student_id = auth.uid() AND status = 'submitted';

  IF v_used >= v_test.attempts_allowed THEN
    RAISE EXCEPTION 'Já esgotaste as tuas % tentativas.', v_test.attempts_allowed;
  END IF;

  SELECT * INTO v_sub FROM quiz_test_instances
  WHERE test_id = p_test_id AND student_id = auth.uid() AND status = 'in_progress'
  ORDER BY started_at DESC LIMIT 1;

  IF FOUND THEN
    v_picked := v_sub.question_ids;
  ELSE
    IF array_length(v_test.pool_question_ids, 1) > 0 THEN
      v_pool := v_test.pool_question_ids;
    ELSE
      SELECT array_agg(id) INTO v_pool FROM quiz_questions
      WHERE subject = ANY (v_test.disciplines);
    END IF;

    IF v_pool IS NULL OR array_length(v_pool, 1) < v_test.question_count THEN
      RAISE EXCEPTION 'Não há perguntas suficientes nas disciplinas escolhidas.';
    END IF;

    SELECT array_agg(x) INTO v_picked FROM (
      SELECT x FROM unnest(v_pool) AS x ORDER BY random() LIMIT v_test.question_count
    ) s;

    v_attempt := v_used + 1;
    INSERT INTO quiz_test_instances (test_id, student_id, attempt, question_ids)
    VALUES (p_test_id, auth.uid(), v_attempt, v_picked)
    RETURNING * INTO v_sub;
  END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', q.id, 'question', q.question, 'options', q.options,
    'correct_answer', q.correct_answer, 'difficulty', q.difficulty
  ) ORDER BY q.id), '[]'::jsonb) INTO v_questions
  FROM quiz_questions q WHERE q.id = ANY (v_picked);

  RETURN jsonb_build_object(
    'instance_id', v_sub.id,
    'attempt', v_sub.attempt,
    'started_at', v_sub.started_at,
    'test', to_jsonb(v_test),
    'questions', v_questions
  );
END;
$$;

-- Entrega: correção automática + notificação ao professor
CREATE OR REPLACE FUNCTION submit_quiz_test(p_instance_id uuid, p_answers jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inst quiz_test_instances;
  v_test quiz_tests;
  v_correct integer := 0;
  v_total integer;
  v_q record;
  v_idx integer;
  v_ans jsonb;
BEGIN
  SELECT * INTO v_inst FROM quiz_test_instances WHERE id = p_instance_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tentativa não encontrada.';
  END IF;
  IF v_inst.student_id <> auth.uid() THEN
    RAISE EXCEPTION 'Sem permissão.';
  END IF;
  IF v_inst.status <> 'in_progress' THEN
    RAISE EXCEPTION 'Esta tentativa já foi entregue.';
  END IF;

  SELECT * INTO v_test FROM quiz_tests WHERE id = v_inst.test_id;

  IF v_test.time_limit_minutes IS NOT NULL THEN
    IF now() - v_inst.started_at > make_interval(mins => v_test.time_limit_minutes) + interval '120 seconds' THEN
      RAISE EXCEPTION 'O tempo do teste já expirou — entrega fora do prazo.';
    END IF;
  END IF;

  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', q.id, 'question', q.question, 'options', q.options,
    'correct_answer', q.correct_answer
  ) ORDER BY q.id), '[]'::jsonb) INTO v_ans
  FROM quiz_questions q WHERE q.id = ANY (v_inst.question_ids);

  v_total := jsonb_array_length(v_ans);
  FOR v_idx IN 0 .. v_total - 1 LOOP
    SELECT * INTO v_q FROM jsonb_to_recordset(v_ans) AS x(id uuid, correct_answer int)
    WHERE id = (v_ans -> v_idx ->> 'id')::uuid;
    IF (p_answers ->> (v_idx::text))::int IS NOT NULL
       AND (p_answers ->> (v_idx::text))::int = v_q.correct_answer THEN
      v_correct := v_correct + 1;
    END IF;
  END LOOP;

  UPDATE quiz_test_instances
  SET answers = p_answers, submitted_at = now(), status = 'submitted',
      correct_count = v_correct,
      score_percent = CASE WHEN v_total > 0 THEN round(100.0 * v_correct / v_total, 1) ELSE 0 END
  WHERE id = p_instance_id;

  INSERT INTO notifications (user_id, type, title, message)
  VALUES (v_test.teacher_id, 'quiz_test', 'Novo teste respondido',
    format('"%s" foi respondido por um aluno (acertos: %s/%s).', v_test.title, v_correct, v_total));
END;
$$;

-- Revisão única da correção de testes personalizados (após terminada)
CREATE OR REPLACE FUNCTION revise_submission_once(
  p_submission_id uuid,
  p_corrections jsonb,
  p_observations text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_teacher_id uuid;
  v_reviewed boolean;
BEGIN
  SELECT t.teacher_id, (s.corrections ->> '_reviewed')::boolean
  INTO v_teacher_id, v_reviewed
  FROM custom_test_submissions s
  JOIN teacher_custom_tests t ON t.id = s.test_id
  WHERE s.id = p_submission_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tentativa não encontrada.';
  END IF;
  IF v_teacher_id <> auth.uid() THEN
    RAISE EXCEPTION 'Sem permissão.';
  END IF;
  IF v_reviewed THEN
    RAISE EXCEPTION 'A revisão já foi utilizada — a correção está bloqueada.';
  END IF;

  UPDATE custom_test_submissions
  SET corrections = p_corrections || jsonb_build_object('_reviewed', true),
      teacher_observations = p_observations
  WHERE id = p_submission_id;
END;
$$;

GRANT EXECUTE ON FUNCTION start_quiz_test_instance(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION submit_quiz_test(uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION revise_submission_once(uuid, jsonb, text) TO authenticated;
