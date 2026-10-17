/*
# Quiz duels: async 1v1 challenges between friends

1. New Tables
- `quiz_duels`: um desafiante cria um duelo com 10 perguntas (ids + respostas
  certas); o adversário joga as mesmas perguntas. Vence quem acertar mais
  (desempate: tempo total).
2. Security
- RLS enabled. Policies per verb scoped TO authenticated. Ambos os
  participantes (challenger/ opponent) leem e atualizam o seu lado.
*/

CREATE TABLE IF NOT EXISTS quiz_duels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenger_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  opponent_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenger_name text NOT NULL,
  opponent_name text,
  subject text NOT NULL,
  school_year text,
  questions jsonb NOT NULL,
  challenger_score integer,
  challenger_time integer,
  opponent_score integer,
  opponent_time integer,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','finished','declined')),
  winner_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);

ALTER TABLE quiz_duels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_duels" ON quiz_duels FOR SELECT
  TO authenticated
  USING (challenger_id = auth.uid() OR opponent_id = auth.uid());

CREATE POLICY "insert_duels" ON quiz_duels FOR INSERT
  TO authenticated
  WITH CHECK (challenger_id = auth.uid());

CREATE POLICY "update_own_duels" ON quiz_duels FOR UPDATE
  TO authenticated
  USING (challenger_id = auth.uid() OR opponent_id = auth.uid())
  WITH CHECK (challenger_id = auth.uid() OR opponent_id = auth.uid());

CREATE POLICY "delete_own_duels" ON quiz_duels FOR DELETE
  TO authenticated
  USING (challenger_id = auth.uid() AND status = 'pending');
