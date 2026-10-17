/*
# QUESTEDUCA Core Schema - Part 2: Game State, Visits, Raids, Notifications

## Overview
Creates game-related tables:
- visit_permissions (friend city visit requests) — created BEFORE game_states since game_states RLS references it
- game_states (per-student RTS state: resources, buildings, stats, streaks)
- raids (attack history between students)
- notifications (in-app notifications)

## Security
- Visit permissions: owner and visitor can read; owner can update; visitor can insert
- Game states: students read/update their own; admin full access; friends can view via visit permissions
- Raids: attacker and defender can read their own
- Notifications: owner-scoped CRUD
*/

-- ============ VISIT PERMISSIONS (must come before game_states) ============
CREATE TABLE IF NOT EXISTS visit_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  visitor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  visitor_name text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now(),
  responded_at timestamptz,
  UNIQUE(owner_id, visitor_id)
);

ALTER TABLE visit_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_visit_perms" ON visit_permissions;
CREATE POLICY "select_visit_perms" ON visit_permissions FOR SELECT
  TO authenticated USING (
    auth.uid() = owner_id OR
    auth.uid() = visitor_id
  );

DROP POLICY IF EXISTS "insert_visit_perms" ON visit_permissions;
CREATE POLICY "insert_visit_perms" ON visit_permissions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = visitor_id);

DROP POLICY IF EXISTS "update_visit_perms" ON visit_permissions;
CREATE POLICY "update_visit_perms" ON visit_permissions FOR UPDATE
  TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- ============ GAME STATES ============
CREATE TABLE IF NOT EXISTS game_states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  coins integer DEFAULT 100,
  diamonds integer DEFAULT 5,
  xp integer DEFAULT 0,
  level integer DEFAULT 1,
  resources jsonb DEFAULT '{"wood":50,"stone":30,"iron":10,"food":100}',
  buildings jsonb DEFAULT '{}',
  roads jsonb DEFAULT '[]',
  population integer DEFAULT 10,
  max_population integer DEFAULT 20,
  defense_power integer DEFAULT 5,
  attack_power integer DEFAULT 0,
  production_timers jsonb DEFAULT '{}',
  quizzes_today integer DEFAULT 0,
  last_quiz_date date,
  last_resource_collection timestamptz,
  current_streak integer DEFAULT 0,
  longest_streak integer DEFAULT 0,
  last_streak_date date,
  streak_claimed_today boolean DEFAULT false,
  city_name text DEFAULT 'Minha Cidade',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE game_states ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_game" ON game_states;
CREATE POLICY "select_own_game" ON game_states FOR SELECT
  TO authenticated USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin') OR
    EXISTS (SELECT 1 FROM visit_permissions WHERE owner_id = game_states.user_id AND visitor_id = auth.uid() AND status = 'approved')
  );

DROP POLICY IF EXISTS "insert_own_game" ON game_states;
CREATE POLICY "insert_own_game" ON game_states FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_game" ON game_states;
CREATE POLICY "update_own_game" ON game_states FOR UPDATE
  TO authenticated USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  ) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_game" ON game_states;
CREATE POLICY "delete_own_game" ON game_states FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============ RAIDS ============
CREATE TABLE IF NOT EXISTS raids (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attacker_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  attacker_name text,
  defender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  defender_name text,
  attack_power integer DEFAULT 0,
  defense_power integer DEFAULT 0,
  attack_roll integer DEFAULT 0,
  defense_roll integer DEFAULT 0,
  victory boolean DEFAULT false,
  loot jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE raids ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_raids" ON raids;
CREATE POLICY "select_own_raids" ON raids FOR SELECT
  TO authenticated USING (
    auth.uid() = attacker_id OR
    auth.uid() = defender_id
  );

DROP POLICY IF EXISTS "insert_own_raids" ON raids;
CREATE POLICY "insert_own_raids" ON raids FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = attacker_id);

-- ============ NOTIFICATIONS ============
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  data jsonb DEFAULT '{}',
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_notifications" ON notifications;
CREATE POLICY "select_own_notifications" ON notifications FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_notifications" ON notifications;
CREATE POLICY "insert_own_notifications" ON notifications FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_notifications" ON notifications;
CREATE POLICY "update_own_notifications" ON notifications FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_notifications" ON notifications;
CREATE POLICY "delete_own_notifications" ON notifications FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_raids_attacker ON raids(attacker_id);
CREATE INDEX IF NOT EXISTS idx_raids_defender ON raids(defender_id);
