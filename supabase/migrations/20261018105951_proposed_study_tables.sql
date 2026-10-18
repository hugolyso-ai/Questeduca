/*
# Estudo Proposto: quizzes de professores com relatório-teste

1. Novas Tabelas
- `teacher_proposals`: proposta de estudo criada por um professor para um aluno específico.
  - `id` (uuid, pk)
  - `teacher_id` (uuid, not null) — id do professor (user_profiles.id)
  - `student_id` (uuid, not null) — id do aluno (user_profiles.id)
  - `subject` (text, not null) — id da disciplina (ex.: 'matemicos')
  - `subject_label` (text, not null) — nome legível (ex.: 'Matemática')
  - `topics` (jsonb, not null, default '[]') — matérias/tópicos selecionados
  - `is_active` (boolean, default true)
  - `created_at` (timestamptz)
- `student_tests`: uma versão de teste gerada por um aluno a partir de uma proposta.
  - `id` (uuid, pk)
  - `proposal_id` (uuid, not null, fk -> teacher_proposals, on delete cascade)
  - `student_id` (uuid, not null)
  `teacher_id` (uuid, not null)
  - `version_number` (integer, not null) — 1..4
  - `question_ids` (jsonb) — ids das 25 perguntas
  - `questions_snapshot` (jsonb) — cópia das perguntas
  - `score`, `max_score`, `correct_count` (integer, nullable)
  - `status` (text, default 'in_progress')
  - `started_at`, `finished_at` (timestamptz)
- `student_test_answers`: resposta do aluno a cada pergunta de um teste.
  - `id` (uuid, pk)
  - `test_id` (uuid, not null, fk -> student_tests, on delete cascade)
  - `question_id` (uuid, nullable)
  - `question_text`, `options` (jsonb), `correct_answer` (integer) — snapshot
  - `chosen_index` (integer, not null)
  - `is_correct` (boolean)
  - `points` (integer) — cotação da pergunta
  - `order_index` (integer) — posição no teste
2. RLS
  - Aluno vê as próprias políticas/proprias tabelas.
  - Professor vê tudo o que diz respeito às suas próprias políticas.
*/
CREATE TABLE IF NOT EXISTS teacher_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  teacher_id uuid NOT NULL,
  schema_version int NOT NULL DEFAULT 1,
  inserted_at timestamptz default now()
);
