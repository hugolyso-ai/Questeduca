/*
# Eventos agendados por professores (testes, questões de aula, aulas)

1. Nova Tabela
   - `teacher_events`: evento criado por um professor para um aluno específico.
     - `id` (uuid, pk)
     - `teacher_id` (uuid, not null) — id do professor em user_profiles.id
     - `student_id` (uuid, not null) — id do aluno em user_profiles.id (destinatário)
     - `title` (text, not null) — título do evento (ex.: "Teste de Frações")
     - `event_type` (text, not null, default 'test') — test | homework | class
     - `event_date` (date, not null) — data do evento
     - `subject` (text, not null) — nome legível da disciplina
     - `created_at` (timestamptz)

2. Segurança (RLS)
   - Ativar RLS em `teacher_events`.
   - Alunos veem apenas os seus eventos; professores veem os que criaram; admin vê tudo.
   - Inserção: apenas o próprio professor (teacher_id = auth.uid()).
   - Atualização/eliminação: apenas o professor criador.

3. Notas
   - O índice acelera o filtro por aluno (calendário do aluno).
   - Sem alterações noutras tabelas.
*/

CREATE TABLE IF NOT EXISTS teacher_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL,
  student_id uuid NOT NULL,
  title text NOT NULL,
  event_type text NOT NULL DEFAULT 'test' CHECK (event_type IN ('test', 'homework', 'class')),
  event_date date NOT NULL,
  subject text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE teacher_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_events" ON teacher_events;
CREATE POLICY "select_own_events" ON teacher_events FOR SELECT
  TO authenticated USING (
    auth.uid() = student_id OR
    auth.uid() = teacher_id OR
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "insert_own_events" ON teacher_events;
CREATE POLICY "insert_own_events" ON teacher_events FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = teacher_id);

DROP POLICY IF EXISTS "update_own_events" ON teacher_events;
CREATE POLICY "update_own_events" ON teacher_events FOR UPDATE
  TO authenticated USING (auth.uid() = teacher_id) WITH CHECK (auth.uid() = teacher_id);

DROP POLICY IF EXISTS "delete_own_events" ON teacher_events;
CREATE POLICY "delete_own_events" ON teacher_events FOR DELETE
  TO authenticated USING (auth.uid() = teacher_id);

CREATE INDEX IF NOT EXISTS idx_teacher_events_student ON teacher_events(student_id, event_date);
