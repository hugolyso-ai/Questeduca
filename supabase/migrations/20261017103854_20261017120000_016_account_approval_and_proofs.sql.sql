/*
# Aprovação de professores e associações + contacto móvel + comprovativo

1. Novas colunas
- `user_profiles.approval_status`: estado de aprovação da conta — 'approved' (por omissão), 'pending', 'rejected'. Afeta apenas contas de professor e de associação.
- `user_profiles.approved_at`: data de aprovação.
- `user_profiles.rejected_reason`: motivo da rejeição (visível ao utilizador).
- `user_profiles.mobile_phone`: contacto móvel pedido no registo de professor/associação.
- `user_profiles.proof_document_name`: nome do ficheiro de comprovativo (cédula/ordem de professores para professores; comprovativo de atividade para associações).
- `user_profiles.proof_document_url`: URL (armazenado em Storage, bucket privado 'proofs').
2. Novas policies
- `user_profiles`: SELECT do admin (acesso a todos os perfis) e UPDATE do admin (aprovar/rejeitar). 
- `teacher_profiles` / `association_profiles`: SELECT/UPDATE do admin para gestão de pendentes.
- Storage bucket privado `proofs`: leitura apenas do dono e do admin; upload do dono.
3. Notas
- Alunos, pais e admin mantêm 'approved'. Apenas professor/associação registados ficam 'pending'.
- Gates de aprovação (bloqueio de dashboards de professor/associação enquanto pendentes) são aplicados na aplicação via ProtectedRoute.
*/

-- Colunas de aprovação e contacto/comprovativo
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'approved';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS approved_at timestamptz;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS rejected_reason text;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS mobile_phone text;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS proof_document_name text;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS proof_document_url text;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_profiles_approval_status_check') THEN
    ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_approval_status_check
      CHECK (approval_status IN ('approved', 'pending', 'rejected'));
  END IF;
END $$;

-- Índice para listagem de pendentes
CREATE INDEX IF NOT EXISTS idx_user_profiles_approval_status ON user_profiles (approval_status) WHERE approval_status <> 'approved';

-- Admin vê todos os perfis e pode aprovar/rejeitar
DROP POLICY IF EXISTS "admin_select_all_profiles" ON user_profiles;
CREATE POLICY "admin_select_all_profiles" ON user_profiles FOR SELECT
TO authenticated
USING (
  auth.uid() = id
  OR EXISTS (SELECT 1 FROM user_profiles up WHERE up.id = auth.uid() AND up.role = 'admin')
);

DROP POLICY IF EXISTS "admin_update_all_profiles" ON user_profiles;
CREATE POLICY "admin_update_all_profiles" ON user_profiles FOR UPDATE
TO authenticated
USING (
  auth.uid() = id
  OR EXISTS (SELECT 1 FROM user_profiles up WHERE up.id = auth.uid() AND up.role = 'admin')
)
WITH CHECK (
  auth.uid() = id
  OR EXISTS (SELECT 1 FROM user_profiles up WHERE up.id = auth.uid() AND up.role = 'admin')
);

-- Admin pode ler/gerir perfis de professor e associação
DROP POLICY IF EXISTS "admin_manage_teacher_profiles" ON teacher_profiles;
CREATE POLICY "admin_manage_teacher_profiles" ON teacher_profiles FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM user_profiles up WHERE up.id = auth.uid() AND up.role = 'admin')
);

DROP POLICY IF EXISTS "admin_update_teacher_profiles" ON teacher_profiles;
CREATE POLICY "admin_update_teacher_profiles" ON teacher_profiles FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM user_profiles up WHERE up.id = auth.uid() AND up.role = 'admin')
)
WITH CHECK (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM user_profiles up WHERE up.id = auth.uid() AND up.role = 'admin')
);

DROP POLICY IF EXISTS "admin_manage_association_profiles" ON association_profiles;
CREATE POLICY "admin_manage_association_profiles" ON association_profiles FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM user_profiles up WHERE up.id = auth.uid() AND up.role = 'admin')
);

DROP POLICY IF EXISTS "admin_update_association_profiles" ON association_profiles;
CREATE POLICY "admin_update_association_profiles" ON association_profiles FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM user_profiles up WHERE up.id = auth.uid() AND up.role = 'admin')
)
WITH CHECK (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM user_profiles up WHERE up.id = auth.uid() AND up.role = 'admin')
);

-- Bucket privado para comprovativos
INSERT INTO storage.buckets (id, name, public)
VALUES ('proofs', 'proofs', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "owner_upload_proofs" ON storage.objects;
CREATE POLICY "owner_upload_proofs" ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'proofs' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "owner_read_proofs" ON storage.objects;
CREATE POLICY "owner_read_proofs" ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'proofs'
  AND (auth.uid()::text = (storage.foldername(name))[1]
    OR EXISTS (SELECT 1 FROM user_profiles up WHERE up.id = auth.uid() AND up.role = 'admin'))
);

DROP POLICY IF EXISTS "owner_delete_proofs" ON storage.objects;
CREATE POLICY "owner_delete_proofs" ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'proofs'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
