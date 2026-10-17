/*
# Fluxo de registo Google (escolha de papel) - tabela de pedidos

1. Nova tabela
- `role_selection_requests`: guarda a escolha de papel (e dados de professor/associação) de um utilizador que entrou via Google sem email de aluno autorizado. 
  - user_id (uuid, PK), email, chosen_role ('student'|'parent'|'teacher'|'association'), mobile_phone, proof_document_name, proof_document_url, school_id, school_name, class_name, teacher_kind, disciplines (text[]), association_name, district, municipality, locality, iban, responsible_names (text[]), association_code, created_at, reviewed_at, reviewed_by, rejected_reason.
2. Policies
- RLS em `role_selection_requests`: utilizador lê/escreve apenas o seu pedido; admin lê e atualiza todos.
*/

CREATE TABLE IF NOT EXISTS role_selection_requests (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  chosen_role text NOT NULL CHECK (chosen_role IN ('student','parent','teacher','association')),
  mobile_phone text,
  proof_document_name text,
  proof_document_url text,
  school_id text,
  school_name text,
  class_name text,
  teacher_kind text CHECK (teacher_kind IN ('tutelar','explicador')),
  disciplines text[],
  association_name text,
  district text,
  municipality text,
  locality text,
  iban text,
  responsible_names text[],
  association_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid,
  rejected_reason text
);

ALTER TABLE role_selection_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_role_request" ON role_selection_requests;
CREATE POLICY "select_own_role_request" ON role_selection_requests FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "insert_own_role_request" ON role_selection_requests;
CREATE POLICY "insert_own_role_request" ON role_selection_requests FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_role_request" ON role_selection_requests;
CREATE POLICY "update_own_role_request" ON role_selection_requests FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
)
WITH CHECK (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
);
