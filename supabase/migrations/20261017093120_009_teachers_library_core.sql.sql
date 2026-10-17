/*
# Teachers, student pre-authorization, library books (part 1: core tables)

1. New Tables
- `teacher_profiles`: professor titular com disciplinas (text array), escola e turma.
- `teacher_students`: ligação professor↔aluno (professor adiciona aluno pelo nickname), UNIQUE(teacher_id, student_id).
- `student_authorizations`: autorização prévia de aluno pelo pai (email + nickname), status pending/authorized/revoked.
- `library_books`: livros adicionados/sugeridos por professores (digital ou físico), com observações, direcionados a um aluno ou à turma.
- `book_reads`: registo de leitura/download por aluno.

2. Security
- RLS em todas; policies por verbo TO authenticated; professores gerem os seus registos, alunos/pais leem o que lhes diz respeito.
*/

CREATE TABLE IF NOT EXISTS teacher_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  disciplines text[] NOT NULL DEFAULT '{}',
  school_id text,
  school_name text,
  class_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS teacher_students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(teacher_id, student_id)
);

CREATE TABLE IF NOT EXISTS student_authorizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  student_email text NOT NULL,
  nickname text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','authorized','revoked')),
  authorized_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(nickname, parent_id)
);

CREATE TABLE IF NOT EXISTS library_books (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  author text,
  subject text,
  book_type text NOT NULL DEFAULT 'digital' CHECK (book_type IN ('digital','physical')),
  file_url text,
  notes text,
  target_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS book_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id uuid NOT NULL REFERENCES library_books(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(book_id, user_id)
);

ALTER TABLE teacher_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_authorizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_reads ENABLE ROW LEVEL SECURITY;

-- teacher_profiles
DROP POLICY IF EXISTS "teacher_select_own" ON teacher_profiles;
CREATE POLICY "teacher_select_own" ON teacher_profiles FOR SELECT
  TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS "teacher_insert_own" ON teacher_profiles;
CREATE POLICY "teacher_insert_own" ON teacher_profiles FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "teacher_update_own" ON teacher_profiles;
CREATE POLICY "teacher_update_own" ON teacher_profiles FOR UPDATE
  TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "teacher_delete_own" ON teacher_profiles;
CREATE POLICY "teacher_delete_own" ON teacher_profiles FOR DELETE
  TO authenticated USING (user_id = auth.uid());

-- teacher_students
DROP POLICY IF EXISTS "ts_select_participants" ON teacher_students;
CREATE POLICY "ts_select_participants" ON teacher_students FOR SELECT
  TO authenticated USING (teacher_id = auth.uid() OR student_id = auth.uid());
DROP POLICY IF EXISTS "ts_insert_teacher" ON teacher_students;
CREATE POLICY "ts_insert_teacher" ON teacher_students FOR INSERT
  TO authenticated WITH CHECK (teacher_id = auth.uid());
DROP POLICY IF EXISTS "ts_update_teacher" ON teacher_students;
CREATE POLICY "ts_update_teacher" ON teacher_students FOR UPDATE
  TO authenticated USING (teacher_id = auth.uid()) WITH CHECK (teacher_id = auth.uid());
DROP POLICY IF EXISTS "ts_delete_teacher" ON teacher_students;
CREATE POLICY "ts_delete_teacher" ON teacher_students FOR DELETE
  TO authenticated USING (teacher_id = auth.uid());

-- student_authorizations
DROP POLICY IF EXISTS "sa_select_parent" ON student_authorizations;
CREATE POLICY "sa_select_parent" ON student_authorizations FOR SELECT
  TO authenticated USING (parent_id = auth.uid() OR authorized_user_id = auth.uid());
DROP POLICY IF EXISTS "sa_insert_parent" ON student_authorizations;
CREATE POLICY "sa_insert_parent" ON student_authorizations FOR INSERT
  TO authenticated WITH CHECK (parent_id = auth.uid());
DROP POLICY IF EXISTS "sa_update_parent" ON student_authorizations;
CREATE POLICY "sa_update_parent" ON student_authorizations FOR UPDATE
  TO authenticated USING (parent_id = auth.uid()) WITH CHECK (parent_id = auth.uid());
DROP POLICY IF EXISTS "sa_delete_parent" ON student_authorizations;
CREATE POLICY "sa_delete_parent" ON student_authorizations FOR DELETE
  TO authenticated USING (parent_id = auth.uid());

-- library_books (professor gere; alunos veem os seus/gerais; pais veem dos filhos ou gerais)
DROP POLICY IF EXISTS "lb_select_teacher" ON library_books;
CREATE POLICY "lb_select_teacher" ON library_books FOR SELECT
  TO authenticated USING (teacher_id = auth.uid());
DROP POLICY IF EXISTS "lb_select_targets" ON library_books;
CREATE POLICY "lb_select_targets" ON library_books FOR SELECT
  TO authenticated USING (target_user_id = auth.uid() OR target_user_id IS NULL);
DROP POLICY IF EXISTS "lb_select_parents_of_targets" ON library_books;
CREATE POLICY "lb_select_parents_of_targets" ON library_books FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM student_profiles sp
      WHERE sp.parent_id = auth.uid()
        AND (sp.user_id = library_books.target_user_id OR library_books.target_user_id IS NULL)
    )
  );
DROP POLICY IF EXISTS "lb_insert_teacher" ON library_books;
CREATE POLICY "lb_insert_teacher" ON library_books FOR INSERT
  TO authenticated WITH CHECK (teacher_id = auth.uid());
DROP POLICY IF EXISTS "lb_update_teacher" ON library_books;
CREATE POLICY "lb_update_teacher" ON library_books FOR UPDATE
  TO authenticated USING (teacher_id = auth.uid()) WITH CHECK (teacher_id = auth.uid());
DROP POLICY IF EXISTS "lb_delete_teacher" ON library_books;
CREATE POLICY "lb_delete_teacher" ON library_books FOR DELETE
  TO authenticated USING (teacher_id = auth.uid());

-- book_reads
DROP POLICY IF EXISTS "br_select_own" ON book_reads;
CREATE POLICY "br_select_own" ON book_reads FOR SELECT
  TO authenticated USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM library_books WHERE library_books.id = book_reads.book_id AND library_books.teacher_id = auth.uid())
  );
DROP POLICY IF EXISTS "br_insert_own" ON book_reads;
CREATE POLICY "br_insert_own" ON book_reads FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());

-- Índices
CREATE INDEX IF NOT EXISTS idx_teacher_students_teacher ON teacher_students(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_students_student ON teacher_students(student_id);
CREATE INDEX IF NOT EXISTS idx_library_books_target ON library_books(target_user_id);
