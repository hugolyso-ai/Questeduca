/*
# QUESTEDUCA Core Schema - Part 1: Profiles & Schools

## Overview
Creates the foundational tables for the QUESTEDUCA educational RTS game:
- user_profiles (extends Supabase auth.users with role, name, etc.)
- parent_profiles (parent-specific data: children, subscriptions)
- student_profiles (student-specific data: school, year, nickname)
- association_profiles (parent association data: code, commissions)
- schools (Portuguese schools with district/municipality/locality hierarchy)
- districts (20 Portuguese districts)

## Security
- All tables have RLS enabled
- Users can read/update their own profile data
- Parent profiles are owner-scoped
- Student profiles: students read their own, parents read their children's
- Association profiles: owner-scoped
- Schools and districts are publicly readable (needed for registration)
*/

-- ============ USER PROFILES ============
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  name text NOT NULL,
  role text NOT NULL DEFAULT 'parent' CHECK (role IN ('admin', 'parent', 'student', 'association')),
  picture text,
  must_change_password boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON user_profiles;
CREATE POLICY "select_own_profile" ON user_profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON user_profiles;
CREATE POLICY "update_own_profile" ON user_profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON user_profiles;
CREATE POLICY "insert_own_profile" ON user_profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

-- ============ PARENT PROFILES ============
CREATE TABLE IF NOT EXISTS parent_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  children_ids uuid[] DEFAULT '{}',
  subscription_type text DEFAULT 'free',
  subscription_expiry timestamptz,
  premium_active boolean DEFAULT false,
  association_code text,
  association_code_registered_at timestamptz,
  first_subscription_date timestamptz,
  credit_balance numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE parent_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_parent" ON parent_profiles;
CREATE POLICY "select_own_parent" ON parent_profiles FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_parent" ON parent_profiles;
CREATE POLICY "insert_own_parent" ON parent_profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_parent" ON parent_profiles;
CREATE POLICY "update_own_parent" ON parent_profiles FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_parent" ON parent_profiles;
CREATE POLICY "delete_own_parent" ON parent_profiles FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============ STUDENT PROFILES ============
CREATE TABLE IF NOT EXISTS student_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  nickname text,
  school_year text,
  school_id text,
  school_name text,
  district text,
  municipality text,
  locality text,
  approved_by_parent boolean DEFAULT false,
  is_premium boolean DEFAULT false,
  coins integer DEFAULT 0,
  diamonds integer DEFAULT 0,
  level integer DEFAULT 1,
  settlement_level text DEFAULT 'village',
  accessibility_settings jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_student" ON student_profiles;
CREATE POLICY "select_own_student" ON student_profiles FOR SELECT
  TO authenticated USING (
    auth.uid() = user_id OR
    auth.uid() = parent_id OR
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "insert_own_student" ON student_profiles;
CREATE POLICY "insert_own_student" ON student_profiles FOR INSERT
  TO authenticated WITH CHECK (
    auth.uid() = user_id OR
    auth.uid() = parent_id
  );

DROP POLICY IF EXISTS "update_own_student" ON student_profiles;
CREATE POLICY "update_own_student" ON student_profiles FOR UPDATE
  TO authenticated USING (
    auth.uid() = user_id OR
    auth.uid() = parent_id OR
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  ) WITH CHECK (
    auth.uid() = user_id OR
    auth.uid() = parent_id OR
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "delete_own_student" ON student_profiles;
CREATE POLICY "delete_own_student" ON student_profiles FOR DELETE
  TO authenticated USING (
    auth.uid() = user_id OR
    auth.uid() = parent_id
  );

-- ============ ASSOCIATION PROFILES ============
CREATE TABLE IF NOT EXISTS association_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  association_name text NOT NULL,
  school_id text,
  school_name text,
  district text,
  municipality text,
  locality text,
  iban text,
  responsible_names text[] DEFAULT '{}',
  association_code text UNIQUE NOT NULL,
  approved boolean DEFAULT false,
  total_commissions numeric DEFAULT 0.0,
  pending_payout numeric DEFAULT 0.0,
  documents_urls text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE association_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_association" ON association_profiles;
CREATE POLICY "select_own_association" ON association_profiles FOR SELECT
  TO authenticated USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "insert_own_association" ON association_profiles;
CREATE POLICY "insert_own_association" ON association_profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_association" ON association_profiles;
CREATE POLICY "update_own_association" ON association_profiles FOR UPDATE
  TO authenticated USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  ) WITH CHECK (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============ DISTRICTS ============
CREATE TABLE IF NOT EXISTS districts (
  district_id text PRIMARY KEY,
  name text NOT NULL,
  color text
);

ALTER TABLE districts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_districts" ON districts;
CREATE POLICY "public_read_districts" ON districts FOR SELECT
  TO anon, authenticated USING (true);

-- ============ SCHOOLS ============
CREATE TABLE IF NOT EXISTS schools (
  school_id text PRIMARY KEY,
  name text NOT NULL,
  district text NOT NULL,
  municipality text NOT NULL,
  locality text,
  cycles text[] DEFAULT '{}'
);

ALTER TABLE schools ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_schools" ON schools;
CREATE POLICY "public_read_schools" ON schools FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_schools" ON schools;
CREATE POLICY "admin_insert_schools" ON schools FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "admin_update_schools" ON schools;
CREATE POLICY "admin_update_schools" ON schools FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "admin_delete_schools" ON schools;
CREATE POLICY "admin_delete_schools" ON schools FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Index for school lookups
CREATE INDEX IF NOT EXISTS idx_schools_district ON schools(district);
CREATE INDEX IF NOT EXISTS idx_schools_municipality ON schools(municipality);
CREATE INDEX IF NOT EXISTS idx_students_district ON student_profiles(district);
CREATE INDEX IF NOT EXISTS idx_students_school_id ON student_profiles(school_id);
CREATE INDEX IF NOT EXISTS idx_students_parent_id ON student_profiles(parent_id);
