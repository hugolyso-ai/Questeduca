/*
# School/class rankings: columns + rank view

1. Modified Tables
- `student_profiles`: adiciona `class_name` (text, ex: '5ºA') e `school_year`
  já existia. `school_id`/`school_name` já existiam.
2. Security
- RLS sem alterações; colunas novas herdam as políticas existentes da tabela.
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='student_profiles' AND column_name='class_name') THEN
    ALTER TABLE student_profiles ADD COLUMN class_name text;
  END IF;
END $$;

-- View de ranking: alunos com pontos, agrupável por escola e turma
-- (security_invoker para respeitar as políticas RLS de quem consulta)
DROP VIEW IF EXISTS school_rankings;
CREATE VIEW school_rankings WITH (security_invoker = true) AS
SELECT
  sp.user_id,
  up.name,
  sp.school_id,
  sp.school_name,
  sp.class_name,
  sp.school_year,
  COALESCE(gs.coins, 0) AS coins,
  COALESCE(gs.xp, 0) AS xp,
  COALESCE(gs.level, 1) AS level
FROM student_profiles sp
JOIN user_profiles up ON up.id = sp.user_id
LEFT JOIN game_states gs ON gs.user_id = sp.user_id
WHERE sp.approved_by_parent = true OR sp.approved_by_parent IS NULL;
