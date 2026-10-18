/*
# Explicações nas perguntas do quiz (valor educativo)

1. Tabelas modificadas
- `quiz_questions`: nova coluna `explanation` (text, opcional) — texto curto
  que explica por que a resposta certa é a certa. Mostrada ao aluno no fim do
  quiz e nas revisões de erros. Coluna opcional: perguntas sem explicação
  continuam a funcionar normalmente.

2. Notas
- Sem dados perdidos: apenas ADIÇÃO de coluna opcional.
- Preencher explicação é opcional e gradual; o ecrã final do quiz mostra-a
  apenas quando existe.
*/

ALTER TABLE public.quiz_questions ADD COLUMN IF NOT EXISTS explanation text;
