-- Registo de aluno recuperável: se a conta já existir, entra com as credenciais e
-- conclui a ligação ao pai em vez de falhar. Limpeza do perfil em tentativa falhada
-- só é possível se o próprio utilizador puder apagar a sua linha.

CREATE POLICY "delete_own_profile" ON user_profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = id);