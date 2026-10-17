/*
# Fase professor: role 'teacher', fila de emails e policies da biblioteca

1. Alterações
- `user_profiles.role`: estende o CHECK para aceitar 'teacher'.
- Nova tabela `email_queue`: fila de emails a enviar (to_email, subject, body, status pending/sent/failed, error, sent_at). RLS: cada utilizador autenticado só pode ler as suas próprias linhas (to_email = próprio email); nenhuma escrita pelo cliente (a escrita faz o professor via service role... na verdade o cliente insere via policy de INSERT para authenticated — simplificado, com leitura restrita).
2. Notas
- O envio real de email será feito por uma edge function que processa a fila (status pending → sent).
- student_authorizations.status é text (sem CHECK rígido), pelo que nada a alterar aqui.
*/

ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_role_check
  CHECK (role = ANY (ARRAY['admin'::text, 'parent'::text, 'student'::text, 'association'::text, 'teacher'::text]));

CREATE TABLE IF NOT EXISTS email_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  error text,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated_insert_email_queue" ON email_queue;
CREATE POLICY "authenticated_insert_email_queue" ON email_queue
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "users_read_own_email_queue" ON email_queue;
CREATE POLICY "users_read_own_email_queue" ON email_queue
  FOR SELECT TO authenticated USING (lower(to_email) = lower(coalesce(auth.jwt() ->> 'email', '')));
