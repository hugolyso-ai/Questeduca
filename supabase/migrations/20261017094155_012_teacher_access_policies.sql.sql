/*
# Acesso do professor a alunos e notificações + função de pesquisa por nickname

1. Funções
- `find_student_by_nickname(p_nickname text)`: SECURITY DEFINER; devolve user_id, nickname e ano escolar de alunos cujo nickname corresponda (case-insensitive). Serve para o professor adicionar alunos pelo nickname sem expor a tabela student_profiles inteira. EXECUTE concedido a authenticated.
2. Segurança (novas policies)
- `student_profiles`: SELECT para professores com esse aluno em teacher_students.
- `notifications`: INSERT para professor → aos seus alunos e aos pais desses alunos.
*/

CREATE OR REPLACE FUNCTION find_student_by_nickname(p_nickname text)
RETURNS TABLE (user_id uuid, nickname text, school_year int)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT sp.user_id, sp.nickname, sp.school_year::int
  FROM student_profiles sp
  WHERE lower(sp.nickname) = lower(trim(p_nickname))
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION find_student_by_nickname(text) FROM anon, public;
GRANT EXECUTE ON FUNCTION find_student_by_nickname(text) TO authenticated;

DROP POLICY IF EXISTS "select_students_of_teacher" ON student_profiles;
CREATE POLICY "select_students_of_teacher" ON student_profiles
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM teacher_students ts
    WHERE ts.student_id = student_profiles.user_id AND ts.teacher_id = auth.uid()
  ));

DROP POLICY IF EXISTS "insert_notifications_teacher" ON notifications;
CREATE POLICY "insert_notifications_teacher" ON notifications
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM teacher_students ts
    JOIN student_profiles sp ON sp.user_id = ts.student_id
    WHERE ts.teacher_id = auth.uid()
      AND (notifications.user_id = ts.student_id OR notifications.user_id = sp.parent_id)
  ));
