/*
# Friend requests: double parent approval (RLS policies)

1. Modified Tables
- `friend_requests`: as colunas `requester_parent_ok` e `recipient_parent_ok` foram já adicionadas
  (dupla autorização: pai de quem pede + pai de quem recebe). O CHECK de status passa a aceitar
  'pending_parent_req' e 'pending_parent_rcp'. Existe índice único (from_user_id, to_user_id).

2. Security
- Substitui as policies de SELECT/INSERT/UPDATE por versões que também permitem
  aos pais (parent_id em student_profiles) verem os pedidos dos filhos.
  INSERT continua limitado ao próprio (from_user_id = auth.uid()).
*/

DROP POLICY IF EXISTS "select_friend_requests" ON friend_requests;
CREATE POLICY "select_friend_requests" ON friend_requests FOR SELECT
  TO authenticated USING (
    auth.uid() = from_user_id OR
    auth.uid() = to_user_id OR
    EXISTS (SELECT 1 FROM student_profiles WHERE user_id = friend_requests.from_user_id AND parent_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM student_profiles WHERE user_id = friend_requests.to_user_id AND parent_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_friend_requests" ON friend_requests;
CREATE POLICY "insert_friend_requests" ON friend_requests FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = from_user_id);

DROP POLICY IF EXISTS "update_friend_requests" ON friend_requests;
CREATE POLICY "update_friend_requests" ON friend_requests FOR UPDATE
  TO authenticated USING (
    auth.uid() = from_user_id OR
    auth.uid() = to_user_id OR
    EXISTS (SELECT 1 FROM student_profiles WHERE user_id = friend_requests.from_user_id AND parent_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM student_profiles WHERE user_id = friend_requests.to_user_id AND parent_id = auth.uid())
  ) WITH CHECK (
    auth.uid() = from_user_id OR
    auth.uid() = to_user_id OR
    EXISTS (SELECT 1 FROM student_profiles WHERE user_id = friend_requests.from_user_id AND parent_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM student_profiles WHERE user_id = friend_requests.to_user_id AND parent_id = auth.uid())
  );
