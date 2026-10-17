/*
# QUESTEDUCA Core Schema - Part 3: Social, Payments, Quiz, Mini-Games

## Overview
Creates:
- friendships (accepted friend connections between students)
- friend_requests (pending requests requiring parent approval)
- subscriptions (Stripe subscription records)
- payment_transactions (Stripe checkout session tracking)
- giftcards (purchasable/redeemable credit codes)
- commissions (association earnings from subscriptions)
- quiz_answers (per-question answer logging)
- mini_game_scores (mini-game result records)
- weekly_challenges (weekly challenge definitions)
- monthly_league_xp (monthly XP per student for league rankings)

## Security
- Friendships: both parties can read; either can insert; either can delete
- Friend requests: from/to can read; from can insert; to/parent can update
- Subscriptions: owner-scoped; admin can read all
- Payment transactions: owner-scoped; admin can read all
- Giftcards: owner can read their purchased/redeemed; admin can read all
- Commissions: association owner-scoped; admin can read all
- Quiz answers: owner-scoped
- Mini-game scores: owner-scoped
- Weekly challenges: public read; admin write
- Monthly league XP: students read their own; all authenticated can read (for rankings)
*/

-- ============ FRIENDSHIPS ============
CREATE TABLE IF NOT EXISTS friendships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user2_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user1_id, user2_id)
);

ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_friendships" ON friendships;
CREATE POLICY "select_friendships" ON friendships FOR SELECT
  TO authenticated USING (auth.uid() = user1_id OR auth.uid() = user2_id);

DROP POLICY IF EXISTS "insert_friendships" ON friendships;
CREATE POLICY "insert_friendships" ON friendships FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

DROP POLICY IF EXISTS "delete_friendships" ON friendships;
CREATE POLICY "delete_friendships" ON friendships FOR DELETE
  TO authenticated USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- ============ FRIEND REQUESTS ============
CREATE TABLE IF NOT EXISTS friend_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_nickname text,
  to_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_nickname text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  parent_approved boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_friend_requests" ON friend_requests;
CREATE POLICY "select_friend_requests" ON friend_requests FOR SELECT
  TO authenticated USING (
    auth.uid() = from_user_id OR
    auth.uid() = to_user_id OR
    EXISTS (SELECT 1 FROM student_profiles WHERE user_id = friend_requests.to_user_id AND parent_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_friend_requests" ON friend_requests;
CREATE POLICY "insert_friend_requests" ON friend_requests FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = from_user_id);

DROP POLICY IF EXISTS "update_friend_requests" ON friend_requests;
CREATE POLICY "update_friend_requests" ON friend_requests FOR UPDATE
  TO authenticated USING (
    auth.uid() = to_user_id OR
    EXISTS (SELECT 1 FROM student_profiles WHERE user_id = friend_requests.to_user_id AND parent_id = auth.uid())
  ) WITH CHECK (
    auth.uid() = to_user_id OR
    EXISTS (SELECT 1 FROM student_profiles WHERE user_id = friend_requests.to_user_id AND parent_id = auth.uid())
  );

-- ============ SUBSCRIPTIONS ============
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('free','individual_monthly','individual_annual','family_monthly','family_annual')),
  start_date timestamptz DEFAULT now(),
  end_date timestamptz,
  auto_renew boolean DEFAULT false,
  association_code text,
  payment_reference text,
  status text DEFAULT 'active' CHECK (status IN ('active','cancelled','expired')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_subscriptions" ON subscriptions;
CREATE POLICY "select_own_subscriptions" ON subscriptions FOR SELECT
  TO authenticated USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "insert_own_subscriptions" ON subscriptions;
CREATE POLICY "insert_own_subscriptions" ON subscriptions FOR INSERT
  TO authenticated WITH CHECK (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "update_own_subscriptions" ON subscriptions;
CREATE POLICY "update_own_subscriptions" ON subscriptions FOR UPDATE
  TO authenticated USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  ) WITH CHECK (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============ PAYMENT TRANSACTIONS ============
CREATE TABLE IF NOT EXISTS payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text UNIQUE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email text,
  package_id text NOT NULL,
  amount numeric NOT NULL,
  currency text DEFAULT 'eur',
  status text DEFAULT 'pending' CHECK (status IN ('pending','completed','failed','expired')),
  payment_status text DEFAULT 'unpaid' CHECK (status IN ('unpaid','paid')),
  association_code text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz
);

ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_transactions" ON payment_transactions;
CREATE POLICY "select_own_transactions" ON payment_transactions FOR SELECT
  TO authenticated USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "insert_own_transactions" ON payment_transactions;
CREATE POLICY "insert_own_transactions" ON payment_transactions FOR INSERT
  TO authenticated WITH CHECK (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "update_own_transactions" ON payment_transactions;
CREATE POLICY "update_own_transactions" ON payment_transactions FOR UPDATE
  TO authenticated USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  ) WITH CHECK (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============ GIFTCARDS ============
CREATE TABLE IF NOT EXISTS giftcards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  amount numeric NOT NULL,
  currency text DEFAULT 'eur',
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  redeemed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  redeemed_at timestamptz,
  status text DEFAULT 'active' CHECK (status IN ('active','redeemed','expired','deactivated')),
  association_code text,
  note text,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '1 year')
);

ALTER TABLE giftcards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_giftcards" ON giftcards;
CREATE POLICY "select_giftcards" ON giftcards FOR SELECT
  TO authenticated USING (
    auth.uid() = created_by OR
    auth.uid() = redeemed_by OR
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "insert_giftcards" ON giftcards;
CREATE POLICY "insert_giftcards" ON giftcards FOR INSERT
  TO authenticated WITH CHECK (
    auth.uid() = created_by OR
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "update_giftcards" ON giftcards;
CREATE POLICY "update_giftcards" ON giftcards FOR UPDATE
  TO authenticated USING (
    auth.uid() = created_by OR
    auth.uid() = redeemed_by OR
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  ) WITH CHECK (
    auth.uid() = created_by OR
    auth.uid() = redeemed_by OR
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============ COMMISSIONS ============
CREATE TABLE IF NOT EXISTS commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  association_id uuid NOT NULL REFERENCES association_profiles(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  subscription_id uuid REFERENCES subscriptions(id) ON DELETE SET NULL,
  giftcard_id uuid REFERENCES giftcards(id) ON DELETE SET NULL,
  paid boolean DEFAULT false,
  paid_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_commissions" ON commissions;
CREATE POLICY "select_commissions" ON commissions FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM association_profiles WHERE id = commissions.association_id AND user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "insert_commissions" ON commissions;
CREATE POLICY "insert_commissions" ON commissions FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "update_commissions" ON commissions;
CREATE POLICY "update_commissions" ON commissions FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============ QUIZ ANSWERS ============
CREATE TABLE IF NOT EXISTS quiz_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_id text,
  question_id text,
  answer_index integer,
  correct boolean DEFAULT false,
  subject text,
  school_year text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE quiz_answers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_answers" ON quiz_answers;
CREATE POLICY "select_own_answers" ON quiz_answers FOR SELECT
  TO authenticated USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM student_profiles WHERE user_id = quiz_answers.user_id AND parent_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

DROP POLICY IF EXISTS "insert_own_answers" ON quiz_answers;
CREATE POLICY "insert_own_answers" ON quiz_answers FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- ============ MINI-GAME SCORES ============
CREATE TABLE IF NOT EXISTS mini_game_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game_id text NOT NULL,
  score integer NOT NULL DEFAULT 0,
  coins_won integer DEFAULT 0,
  diamonds_won integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE mini_game_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_scores" ON mini_game_scores;
CREATE POLICY "select_own_scores" ON mini_game_scores FOR SELECT
  TO authenticated USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM student_profiles WHERE user_id = mini_game_scores.user_id AND parent_id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_own_scores" ON mini_game_scores;
CREATE POLICY "insert_own_scores" ON mini_game_scores FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- ============ WEEKLY CHALLENGES ============
CREATE TABLE IF NOT EXISTS weekly_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  challenge_type text NOT NULL,
  target_value integer NOT NULL DEFAULT 10,
  reward_coins integer DEFAULT 50,
  reward_diamonds integer DEFAULT 5,
  reward_xp integer DEFAULT 100,
  week_start date NOT NULL,
  week_end date NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE weekly_challenges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_challenges" ON weekly_challenges;
CREATE POLICY "public_read_challenges" ON weekly_challenges FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "admin_write_challenges" ON weekly_challenges;
CREATE POLICY "admin_write_challenges" ON weekly_challenges FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============ WEEKLY CHALLENGE PROGRESS ============
CREATE TABLE IF NOT EXISTS weekly_challenge_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id uuid NOT NULL REFERENCES weekly_challenges(id) ON DELETE CASCADE,
  progress integer DEFAULT 0,
  completed boolean DEFAULT false,
  claimed boolean DEFAULT false,
  UNIQUE(user_id, challenge_id)
);

ALTER TABLE weekly_challenge_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_progress" ON weekly_challenge_progress;
CREATE POLICY "select_own_progress" ON weekly_challenge_progress FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_progress" ON weekly_challenge_progress;
CREATE POLICY "insert_own_progress" ON weekly_challenge_progress FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_progress" ON weekly_challenge_progress;
CREATE POLICY "update_own_progress" ON weekly_challenge_progress FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_friendships_u1 ON friendships(user1_id);
CREATE INDEX IF NOT EXISTS idx_friendships_u2 ON friendships(user2_id);
CREATE INDEX IF NOT EXISTS idx_friend_req_to ON friend_requests(to_user_id, status);
CREATE INDEX IF NOT EXISTS idx_quiz_answers_user ON quiz_answers(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
