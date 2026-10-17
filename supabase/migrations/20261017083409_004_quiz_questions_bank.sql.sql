/*
# Create quiz_questions table (shared question bank)

1. New Tables
- `quiz_questions`: banco partilhado de perguntas por disciplina e ano escolar.
  - `id` (uuid, primary key)
  - `subject` (text, not null): matematica, portugues, estudo_meio, historia, geografia, ciencias, ingles
  - `school_year` (integer, not null): 1 a 9
  - `question` (text, not null)
  - `options` (jsonb, not null): array de 4 opções
  - `correct_answer` (integer, not null): índice da opção correta (0-3)
  - `difficulty` (integer, default 1)
  - `created_at` (timestamp)
  - UNIQUE (subject, school_year, question) para seeds idempotentes
2. Indexes
- Índice em (school_year, subject) para a busca de quizzes.
3. Security
- RLS ativado.
- Leitura (SELECT) permitida a utilizadores autenticados — o banco é partilhado e não contém dados pessoais.
- Sem escrita por clientes (seeds via servidor).
*/

CREATE TABLE IF NOT EXISTS quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text NOT NULL,
  school_year integer NOT NULL,
  question text NOT NULL,
  options jsonb NOT NULL,
  correct_answer integer NOT NULL,
  difficulty integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  UNIQUE (subject, school_year, question)
);

CREATE INDEX IF NOT EXISTS idx_quiz_questions_year_subject
  ON quiz_questions (school_year, subject);

ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_read_quiz_questions" ON quiz_questions;
CREATE POLICY "authenticated_read_quiz_questions"
ON quiz_questions FOR SELECT
TO authenticated
USING (true);
