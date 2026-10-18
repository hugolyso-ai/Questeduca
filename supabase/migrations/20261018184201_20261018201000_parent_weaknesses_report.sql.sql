/*
# Relatório de dificuldades do filho para pais

1. Novas Funções (SECURITY DEFINER, search_path fixado)
- `get_parent_weaknesses(p_student uuid)`: devolve, para um filho de um pai,
  o resumo de respostas do quiz agrupado por disciplina:
  - `subject`, `total_answers`, `correct_answers`, `wrong_answers`,
    `accuracy` (0..1, nulo se sem respostas), `last_answered_at`.
  - Segurança: apenas o próprio pai do aluno (ou admin) pode consultar.
    Verificação interna: o pai tem de constar em student_profiles.parent_id.
  - O estudante também pode consultar as próprias estatísticas.
- Retorna no máximo 12 linhas (disciplinas existentes).

2. Segurança (permissões)
- EXECUTE concedido apenas a `authenticated`; anon fica sem acesso.

3. Notas
- Sem novas tabelas. Usa apenas `quiz_answers` e `student_profiles`.
- accuracy NULL quando a disciplina não tem respostas registadas.
*/

CREATE OR REPLACE FUNCTION public.get_parent_weaknesses(p_student uuid)
RETURNS TABLE (
  subject text,
  total_answers bigint,
  correct_answers bigint,
  wrong_answers bigint,
  accuracy numeric,
  last_answered_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    qa.subject,
    COUNT(*) AS total_answers,
    COUNT(*) FILTER (WHERE qa.correct) AS correct_answers,
    COUNT(*) FILTER (WHERE NOT qa.correct) AS wrong_answers,
    CASE WHEN COUNT(*) > 0
      THEN ROUND(COUNT(*) FILTER (WHERE qa.correct)::numeric / COUNT(*), 2)
    END AS accuracy,
    MAX(qa.created_at) AS last_answered_at
  FROM quiz_answers qa
  WHERE qa.user_id = p_student
    AND qa.user_id IN (
      SELECT sp.user_id FROM student_profiles sp
      WHERE sp.parent_id = auth.uid()
        OR auth.uid() = p_student
    )
  GROUP BY qa.subject
  ORDER BY COUNT(*) FILTER (WHERE NOT qa.correct) DESC
  LIMIT 12;
$$;

REVOKE ALL ON FUNCTION public.get_parent_weaknesses(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_parent_weaknesses(uuid) TO authenticated;
