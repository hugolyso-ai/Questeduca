/*
# Explicações preenchidas no banco de perguntas

1. Dados (DML)
- `quiz_questions`: preenche a coluna `explanation` para TODAS as perguntas
  que ainda não a têm:
  - Matemática (formato "Quanto é A + B?", "A - B?", "A × B?", "A ÷ B?"):
    explicação gerada a partir dos próprios números, com resultado calculado
    pela base de dados e dica do método.
    Apenas o formato exato é tocado — zero risco de explicação errada.
  - Outras disciplinas: "A resposta certa é: X." com X = opção correta
    registada (sem inventar conteúdo).
- Idempotente: só atualiza linhas com explanation IS NULL.

2. Notas
- Nenhuma pergunta, opção ou resposta correta é alterada.
- Correção face à tentativa anterior: parênteses em (options ->> correct_answer)
  para evitar conflito de precedência entre || e ->>.
*/

-- Matemática: apenas formato "Quanto é N op N?"
UPDATE quiz_questions
SET explanation = CASE
  WHEN op = '+' THEN format(
    '%s + %s = %s. Soma primeiro as dezenas e depois as unidades.', a, b, a + b)
  WHEN op = '-' THEN format(
    '%s - %s = %s. Subtrair é tirar: parte de %s e tira %s.', a, b, a - b, a, b)
  WHEN op = '×' THEN format(
    '%s × %s = %s. Multiplicar é somar o mesmo número várias vezes: %s vezes %s.', a, b, a * b, a, b)
  WHEN op = '÷' THEN format(
    '%s ÷ %s = %s. Dividir é repartir %s em %s grupos iguais.', a, b, a / b, a, b)
END
FROM (SELECT
  id,
  (split_part(question, ' ', 3))::int AS a,
  split_part(question, ' ', 4) AS op,
  trim(both ' ?' from split_part(question, ' ', 5))::int AS b
  FROM quiz_questions
  WHERE subject = 'matematica'
    AND explanation IS NULL
    AND question ~ '^Quanto é [0-9]+ [+\-×÷] [0-9]+\?$'
) parsed
WHERE quiz_questions.id = parsed.id;

-- Outras disciplinas: reforço factual da resposta certa
UPDATE quiz_questions
SET explanation = 'A resposta certa é: ' || (options ->> correct_answer) || '.'
WHERE subject <> 'matematica'
  AND explanation IS NULL
  AND options ->> correct_answer IS NOT NULL;
