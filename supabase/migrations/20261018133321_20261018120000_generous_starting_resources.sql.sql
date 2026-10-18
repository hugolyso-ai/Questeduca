/*
# Recursos iniciais generosos para novos alunos

1. Alterações
   - `game_states`: aumenta os valores por omissão de moedas, gemas e recursos,
     para que todos os alunos comecem com recursos suficientes para construir
     várias casas e edifícios produtores (quinta, serração, pedreira, mina, mercado).
   - Atualiza os alunos existentes que ainda têm os valores iniciais antigos baixos
     (nunca alterados pelo jogo) para os novos valores.

2. Novos valores por omissão
   - coins: 300 (antes 100)
   - diamonds: 10 (antes 5)
   - resources: madeira 200, pedra 150, ferro 60, comida 200 (antes 50/30/10/100)

3. Notas
   - A atualização de alunos existentes só atinge quem ainda tem exatamente os
     valores antigos (100 moedas / 5 gemas / 50 madeira / 30 pedra / 10 ferro /
     100 comida) — quem já gastou ou ganhou recursos fica como está.
   - Sem alterações de segurança: as políticas RLS existentes mantêm-se.
*/

ALTER TABLE game_states ALTER COLUMN coins SET DEFAULT 300;
ALTER TABLE game_states ALTER COLUMN diamonds SET DEFAULT 10;

ALTER TABLE game_states
  ALTER COLUMN resources SET DEFAULT '{"wood":200,"stone":150,"iron":60,"food":200}'::jsonb;

UPDATE game_states
SET coins = 300, diamonds = 10,
    resources = '{"wood":200,"stone":150,"iron":60,"food":200}'::jsonb
WHERE coins = 100 AND diamonds = 5
  AND resources = '{"wood":50,"stone":30,"iron":10,"food":100}'::jsonb;
