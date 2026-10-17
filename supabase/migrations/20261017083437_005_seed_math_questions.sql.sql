/*
# Seed quiz question bank (math generators, all years)

1. Data
- Preenche `quiz_questions` com perguntas geradas proceduralmente para
  Matemática (todos os anos 1-9), adaptadas ao ano escolar.
- Idempotente: UNIQUE(subject, school_year, question) evita duplicados.
- Cada disciplina fica com centenas de perguntas; combinada com as outras
  disciplinas e anos, o banco passa das milhares de perguntas.
2. Security
- Sem alterações de RLS.
*/

DO $$
DECLARE
  y INT;
  a INT; b INT; c INT; d INT;
  i INT;
  q TEXT;
  ans TEXT[]; correct_idx INT;
BEGIN
  -- ===== MATEMÁTICA =====
  FOR y IN 1..9 LOOP
    -- Adição
    FOR i IN 1..40 LOOP
      a := (random() * (10 + y * 15))::int + 1;
      b := (random() * (10 + y * 15))::int + 1;
      q := format('Quanto é %s + %s?', a, b);
      ans := ARRAY[ (a+b)::text, ((a+b)+ (1 + (random()*5)::int))::text, ((a+b)- (1 + (random()*3)::int))::text, ((a+b)+ (6 + (random()*8)::int))::text ];
      IF random() < 0.5 THEN ans := ARRAY[ans[3],ans[1],ans[4],ans[2]]; END IF;
      correct_idx := array_position(ans, (a+b)::text);
      INSERT INTO quiz_questions (subject, school_year, question, options, correct_answer, difficulty)
      VALUES ('matematica', y, q, to_jsonb(ans), correct_idx - 1, LEAST(3, (y+2)/3))
      ON CONFLICT (subject, school_year, question) DO NOTHING;
    END LOOP;
    -- Subtração
    FOR i IN 1..40 LOOP
      a := (random() * (10 + y * 15))::int + 10;
      b := (random() * (a - 1))::int + 1;
      q := format('Quanto é %s - %s?', a, b);
      ans := ARRAY[ (a-b)::text, ((a-b)+ (1 + (random()*5)::int))::text, ((a-b)- (1 + (random()*3)::int))::text, ((a-b)+ (6 + (random()*8)::int))::text ];
      IF random() < 0.5 THEN ans := ARRAY[ans[2],ans[4],ans[1],ans[3]]; END IF;
      correct_idx := array_position(ans, (a-b)::text);
      INSERT INTO quiz_questions (subject, school_year, question, options, correct_answer, difficulty)
      VALUES ('matematica', y, q, to_jsonb(ans), correct_idx - 1, LEAST(3, (y+2)/3))
      ON CONFLICT (subject, school_year, question) DO NOTHING;
    END LOOP;
    -- Multiplicação
    FOR i IN 1..40 LOOP
      a := (random() * (4 + y * 2))::int + 1;
      b := (random() * (4 + y * 2))::int + 1;
      q := format('Quanto é %s × %s?', a, b);
      ans := ARRAY[ (a*b)::text, ((a*b)+a)::text, ((a*b)-b)::text, ((a*b)+ (5 + (random()*10)::int))::text ];
      IF random() < 0.5 THEN ans := ARRAY[ans[4],ans[2],ans[1],ans[3]]; END IF;
      correct_idx := array_position(ans, (a*b)::text);
      INSERT INTO quiz_questions (subject, school_year, question, options, correct_answer, difficulty)
      VALUES ('matematica', y, q, to_jsonb(ans), correct_idx - 1, LEAST(3, (y+2)/3))
      ON CONFLICT (subject, school_year, question) DO NOTHING;
    END LOOP;
    -- Divisão exata
    FOR i IN 1..30 LOOP
      b := (random() * (4 + y))::int + 2;
      c := (random() * (3 + y * 3))::int + 1;
      d := b * c;
      q := format('Quanto é %s ÷ %s?', d, b);
      ans := ARRAY[ c::text, (c+1)::text, (c+2)::text, GREATEST(0,(c-1))::text ];
      IF random() < 0.5 THEN ans := ARRAY[ans[2],ans[1],ans[3],ans[4]]; END IF;
      correct_idx := array_position(ans, c::text);
      INSERT INTO quiz_questions (subject, school_year, question, options, correct_answer, difficulty)
      VALUES ('matematica', y, q, to_jsonb(ans), correct_idx - 1, LEAST(3, (y+2)/3))
      ON CONFLICT (subject, school_year, question) DO NOTHING;
    END LOOP;
  END LOOP;
END $$;
