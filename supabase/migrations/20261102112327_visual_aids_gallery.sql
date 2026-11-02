/*
# Visual aids gallery for 1st-year students

1. New Tables
- `visual_aids`: pictures and symbols that help 1st-year students understand theory questions.
  - `id` (uuid, primary key)
  - `keyword` (text, lowercase without accents; matched as a whole word inside the question)
  - `label` (text, the word shown under the picture)
  - `symbol` (text, an emoji shown next to the picture)
  - `image_url` (text, public photo URL)
  - `school_year` (text, the school year the aid is meant for)
  - `created_at` (timestamptz)

2. Security
- Enable RLS on `visual_aids`.
- Grant SELECT only to `authenticated`. Students read the gallery; no client writes are allowed.
- One SELECT policy: the gallery is shared reference content, not per-user data.

3. Notes
- Rows are seeded below for the first set of everyday concepts.
- Additional concepts can be added later through a new migration.
*/

CREATE TABLE IF NOT EXISTS visual_aids (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword text NOT NULL,
  label text NOT NULL,
  symbol text NOT NULL,
  image_url text NOT NULL,
  school_year text NOT NULL DEFAULT '1',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS visual_aids_school_year_idx ON visual_aids (school_year);

ALTER TABLE visual_aids ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON visual_aids TO authenticated;

DROP POLICY IF EXISTS "select_visual_aids" ON visual_aids;
CREATE POLICY "select_visual_aids" ON visual_aids FOR SELECT
  TO authenticated USING (true);

INSERT INTO visual_aids (keyword, label, symbol, image_url, school_year)
SELECT v.keyword, v.label, v.symbol, v.image_url, '1'
FROM (VALUES
  ('sol', 'Sol', '☀️', 'https://images.pexels.com/photos/1686230/pexels-photo-1686230.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'),
  ('lua', 'Lua', '🌙', 'https://images.pexels.com/photos/32088272/pexels-photo-32088272.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'),
  ('agua', 'Água', '💧', 'https://images.pexels.com/photos/6906471/pexels-photo-6906471.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'),
  ('cao', 'Cão', '🐶', 'https://images.pexels.com/photos/20130214/pexels-photo-20130214.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'),
  ('gato', 'Gato', '🐱', 'https://images.pexels.com/photos/33444883/pexels-photo-33444883.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'),
  ('peixe', 'Peixe', '🐟', 'https://images.pexels.com/photos/4498933/pexels-photo-4498933.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'),
  ('arvore', 'Árvore', '🌳', 'https://images.pexels.com/photos/20728280/pexels-photo-20728280.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'),
  ('casa', 'Casa', '🏠', 'https://images.pexels.com/photos/7255396/pexels-photo-7255396.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'),
  ('escola', 'Escola', '🏫', 'https://images.pexels.com/photos/6602623/pexels-photo-6602623.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'),
  ('flor', 'Flor', '🌸', 'https://images.pexels.com/photos/37213367/pexels-photo-37213367.jpeg?auto=compress&cs=tinysrgb&h=650&w=940')
) AS v(keyword, label, symbol, image_url)
WHERE NOT EXISTS (
  SELECT 1 FROM visual_aids WHERE visual_aids.keyword = v.keyword AND visual_aids.school_year = '1'
);
