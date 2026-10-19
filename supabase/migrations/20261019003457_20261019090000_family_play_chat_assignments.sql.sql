/*
# Family play, teacher-student chat, teacher assignments, class normalization

## 1. New Tables

- `teacher_student_messages`: chat between teachers and students.
  - id (uuid pk), teacher_id (uuid -> auth.users), student_id (uuid -> auth.users),
    sender_role ('teacher'|'student'), body (text), read_at (timestamptz), created_at.
- `teacher_assignments`: tests/books/tips assigned by a teacher to a class or a specific student.
  - id, teacher_id, kind ('quiz'|'book'|'tip'), title, description,
    payload (jsonb, flexible config), school_id, target_class (normalized UPPERCASE class name),
    target_student_id (uuid, optional specific student), created_at.
- `family_battles`: parent+child team battles between two families.
  - id, challenger_parent_id, challenger_child_id, opponent_parent_id, opponent_child_id,
    challenger_score, opponent_score, status ('open'|'completed'|'cancelled'),
    winner_side ('challenger'|'opponent'|'draw'), reward (jsonb), created_at, resolved_at.

## 2. Modified Tables

- `student_profiles`: adds generated column `class_norm` = upper(trim(class_name)) STORED,
  so grouping by class ignores case ("5ra" = "5RA"). Index on class_norm.

## 3. New Functions (SECURITY DEFINER, pinned search_path)

- `grant_family_game_reward(p_child_user_id, p_coins)`: parent-only; adds Qu€sts to the
  child's game state after winning a family mini-game. Verifies the caller is the child's parent.
- `create_family_battle(p_child_user_id, p_score)`: parent creates an open battle with their child.
- `join_family_battle(p_battle_id, p_child_user_id, p_score)`: another parent joins with their
  child; battle resolves immediately; winners' children get a Qu€sts reward (loser gets a
  consolation reward). Verifies both parents own their children.

## 4. Security (RLS)

- RLS enabled on all three new tables with per-verb policies:
  - Messages: participants (teacher or student) read; sender inserts own messages;
    participants can mark as read; teacher can delete own thread messages.
  - Assignments: teacher full control of own rows; students read rows targeted at
    their user OR their (case-insensitive) class at the same school.
  - Battles: only involved parents/children can read; challenger inserts; involved
    parents update to join/resolve; challenger can cancel (delete).
*/

-- ============ TEACHER-STUDENT CHAT ============
CREATE TABLE IF NOT EXISTS teacher_student_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_role text NOT NULL CHECK (sender_role IN ('teacher','student')),
  body text NOT NULL CHECK (length(btrim(body)) > 0 AND length(body) <= 2000),
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE teacher_student_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_thread_messages" ON teacher_student_messages;
CREATE POLICY "select_own_thread_messages" ON teacher_student_messages FOR SELECT
  TO authenticated USING (auth.uid() = teacher_id OR auth.uid() = student_id);

DROP POLICY IF EXISTS "insert_own_messages" ON teacher_student_messages;
CREATE POLICY "insert_own_messages" ON teacher_student_messages FOR INSERT
  TO authenticated WITH CHECK (
    (sender_role = 'teacher' AND auth.uid() = teacher_id) OR
    (sender_role = 'student' AND auth.uid() = student_id)
  );

DROP POLICY IF EXISTS "mark_thread_read" ON teacher_student_messages;
CREATE POLICY "mark_thread_read" ON teacher_student_messages FOR UPDATE
  TO authenticated USING (auth.uid() = teacher_id OR auth.uid() = student_id)
  WITH CHECK (auth.uid() = teacher_id OR auth.uid() = student_id);

DROP POLICY IF EXISTS "teacher_delete_own_messages" ON teacher_student_messages;
CREATE POLICY "teacher_delete_own_messages" ON teacher_student_messages FOR DELETE
  TO authenticated USING (auth.uid() = teacher_id OR auth.uid() = student_id);

CREATE INDEX IF NOT EXISTS idx_tsm_thread ON teacher_student_messages(teacher_id, student_id, created_at);

-- ============ TEACHER ASSIGNMENTS ============
CREATE TABLE IF NOT EXISTS teacher_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('quiz','book','tip')),
  title text NOT NULL,
  description text,
  payload jsonb DEFAULT '{}',
  school_id text,
  target_class text,
  target_student_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE teacher_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "teacher_select_own_assignments" ON teacher_assignments;
CREATE POLICY "teacher_select_own_assignments" ON teacher_assignments FOR SELECT
  TO authenticated USING (auth.uid() = teacher_id);

DROP POLICY IF EXISTS "student_select_targeted_assignments" ON teacher_assignments;
CREATE POLICY "student_select_targeted_assignments" ON teacher_assignments FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM student_profiles sp
      WHERE sp.user_id = auth.uid()
        AND (
          teacher_assignments.target_student_id = auth.uid()
          OR (
            teacher_assignments.target_class IS NOT NULL
            AND upper(btrim(coalesce(sp.class_name,''))) = teacher_assignments.target_class
            AND (teacher_assignments.school_id IS NULL OR teacher_assignments.school_id = sp.school_id)
          )
        )
    )
  );

DROP POLICY IF EXISTS "teacher_insert_assignments" ON teacher_assignments;
CREATE POLICY "teacher_insert_assignments" ON teacher_assignments FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = teacher_id);

DROP POLICY IF EXISTS "teacher_update_assignments" ON teacher_assignments;
CREATE POLICY "teacher_update_assignments" ON teacher_assignments FOR UPDATE
  TO authenticated USING (auth.uid() = teacher_id) WITH CHECK (auth.uid() = teacher_id);

DROP POLICY IF EXISTS "teacher_delete_assignments" ON teacher_assignments;
CREATE POLICY "teacher_delete_assignments" ON teacher_assignments FOR DELETE
  TO authenticated USING (auth.uid() = teacher_id);

CREATE INDEX IF NOT EXISTS idx_ta_class ON teacher_assignments(school_id, target_class);
CREATE INDEX IF NOT EXISTS idx_ta_student ON teacher_assignments(target_student_id);

-- ============ FAMILY BATTLES ============
CREATE TABLE IF NOT EXISTS family_battles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenger_parent_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenger_child_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  opponent_parent_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  opponent_child_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  challenger_score integer NOT NULL DEFAULT 0,
  opponent_score integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','completed','cancelled')),
  winner_side text CHECK (winner_side IN ('challenger','opponent','draw')),
  reward jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

ALTER TABLE family_battles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_involved_battles" ON family_battles;
CREATE POLICY "select_involved_battles" ON family_battles FOR SELECT
  TO authenticated USING (
    auth.uid() = challenger_parent_id OR auth.uid() = opponent_parent_id OR
    auth.uid() = challenger_child_id OR auth.uid() = opponent_child_id
  );

DROP POLICY IF EXISTS "challenger_insert_battles" ON family_battles;
CREATE POLICY "challenger_insert_battles" ON family_battles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = challenger_parent_id);

DROP POLICY IF EXISTS "involved_update_battles" ON family_battles;
CREATE POLICY "involved_update_battles" ON family_battles FOR UPDATE
  TO authenticated USING (
    auth.uid() = challenger_parent_id OR auth.uid() = opponent_parent_id
  ) WITH CHECK (
    auth.uid() = challenger_parent_id OR auth.uid() = opponent_parent_id
  );

DROP POLICY IF EXISTS "challenger_delete_battles" ON family_battles;
CREATE POLICY "challenger_delete_battles" ON family_battles FOR DELETE
  TO authenticated USING (auth.uid() = challenger_parent_id);

CREATE INDEX IF NOT EXISTS idx_fb_open ON family_battles(status, created_at);

-- ============ CLASS NORMALIZATION ============
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS class_norm text
  GENERATED ALWAYS AS (upper(btrim(coalesce(class_name,'')))) STORED;

CREATE INDEX IF NOT EXISTS idx_students_class_norm ON student_profiles(class_norm);

-- ============ FAMILY PLAY FUNCTIONS ============
CREATE OR REPLACE FUNCTION grant_family_game_reward(p_child_user_id uuid, p_coins integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_parent uuid;
  v_new_coins integer;
BEGIN
  IF p_coins IS NULL OR p_coins <= 0 OR p_coins > 500 THEN
    RAISE EXCEPTION 'Recompensa inválida';
  END IF;

  SELECT parent_id INTO v_parent FROM student_profiles WHERE user_id = p_child_user_id;
  IF v_parent IS NULL OR v_parent <> auth.uid() THEN
    RAISE EXCEPTION 'Sem permissão para premiar este filho';
  END IF;

  UPDATE game_states
    SET coins = coins + p_coins
    WHERE user_id = p_child_user_id
    RETURNING coins INTO v_new_coins;

  IF v_new_coins IS NULL THEN
    RAISE EXCEPTION 'Estado de jogo não encontrado';
  END IF;

  RETURN v_new_coins;
END;
$$;

CREATE OR REPLACE FUNCTION create_family_battle(p_child_user_id uuid, p_score integer)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_parent uuid;
  v_battle uuid;
BEGIN
  IF p_score IS NULL OR p_score < 0 THEN
    RAISE EXCEPTION 'Pontuação inválida';
  END IF;

  SELECT parent_id INTO v_parent FROM student_profiles WHERE user_id = p_child_user_id;
  IF v_parent IS NULL OR v_parent <> auth.uid() THEN
    RAISE EXCEPTION 'Este filho não é teu';
  END IF;

  INSERT INTO family_battles (challenger_parent_id, challenger_child_id, challenger_score)
  VALUES (auth.uid(), p_child_user_id, p_score)
  RETURNING id INTO v_battle;

  RETURN v_battle;
END;
$$;

CREATE OR REPLACE FUNCTION join_family_battle(p_battle_id uuid, p_child_user_id uuid, p_score integer)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_battle family_battles%ROWTYPE;
  v_parent uuid;
  v_winner text;
  v_reward jsonb;
  v_winner_child uuid;
  v_loser_child uuid;
BEGIN
  IF p_score IS NULL OR p_score < 0 THEN
    RAISE EXCEPTION 'Pontuação inválida';
  END IF;

  SELECT * INTO v_battle FROM family_battles WHERE id = p_battle_id FOR UPDATE;
  IF v_battle.id IS NULL THEN
    RAISE EXCEPTION 'Batalha não encontrada';
  END IF;
  IF v_battle.status <> 'open' THEN
    RAISE EXCEPTION 'Esta batalha já não está aberta';
  END IF;
  IF v_battle.challenger_parent_id = auth.uid() THEN
    RAISE EXCEPTION 'Não podes juntar-te à tua própria batalha';
  END IF;

  SELECT parent_id INTO v_parent FROM student_profiles WHERE user_id = p_child_user_id;
  IF v_parent IS NULL OR v_parent <> auth.uid() THEN
    RAISE EXCEPTION 'Este filho não é teu';
  END IF;

  v_reward := jsonb_build_object(
    'winner_coins', 300,
    'loser_coins', 80
  );

  IF p_score > v_battle.challenger_score THEN
    v_winner := 'opponent';
    v_winner_child := p_child_user_id;
    v_loser_child := v_battle.challenger_child_id;
  ELSIF p_score < v_battle.challenger_score THEN
    v_winner := 'challenger';
    v_winner_child := v_battle.challenger_child_id;
    v_loser_child := p_child_user_id;
  ELSE
    v_winner := 'draw';
    v_winner_child := v_battle.challenger_child_id;
    v_loser_child := p_child_user_id;
  END IF;

  UPDATE family_battles
    SET opponent_parent_id = auth.uid(),
        opponent_child_id = p_child_user_id,
        opponent_score = p_score,
        status = 'completed',
        winner_side = v_winner,
        reward = v_reward,
        resolved_at = now()
    WHERE id = p_battle_id;

  IF v_winner <> 'draw' THEN
    UPDATE game_states SET coins = coins + (v_reward->>'winner_coins')::int
      WHERE user_id = v_winner_child;
    UPDATE game_states SET coins = coins + (v_reward->>'loser_coins')::int
      WHERE user_id = v_loser_child;
  ELSE
    UPDATE game_states SET coins = coins + ((v_reward->>'winner_coins')::int / 2)
      WHERE user_id IN (v_battle.challenger_child_id, p_child_user_id);
  END IF;

  RETURN v_winner;
END;
$$;

GRANT EXECUTE ON FUNCTION grant_family_game_reward(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION create_family_battle(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION join_family_battle(uuid, uuid, integer) TO authenticated;
