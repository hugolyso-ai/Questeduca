/*
# Cycle-aware school persistence on school-year change

1. Plain-English explanation
- Every 1 September, `auto_promote_school_year()` recalculates each student's school year
  from their birth date. Previously the student's school (school_id / school_name) always
  stayed the same. Now the school persists ONLY if it offers the student's new cycle:
  - years 1–4 belong to the 1st cycle ("1")
  - years 5–9 belong to the 2nd/3rd cycles ("2")
- If the student's school exists in the `schools` table and its `cycles` array does NOT
  contain the new cycle, the school reference is cleared (school_id and school_name set
  to NULL), signalling to parents that a new school must be chosen for the child.
- Students whose school is not found in the `schools` catalog keep their school untouched
  (we cannot verify which cycles it offers).
- The previous `school_year` manual-vs-auto logic is preserved unchanged.

2. Modified functions
- `auto_promote_school_year()` — now joins against `schools` to decide whether the school
  reference should persist or be cleared.

3. Security
- No RLS changes; the function is SECURITY DEFINER and performs a bulk maintenance update.

4. Important notes
- The school_name value is lost when cleared; this is intentional per product requirement.
- The promotion still only triggers on 1 September.
*/

CREATE OR REPLACE FUNCTION public.auto_promote_school_year()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
v_count integer;
BEGIN
IF extract(month from current_date)::int <> 9 OR extract(day from current_date)::int <> 1 THEN
RETURN 0;
END IF;

-- Limpa a escola quando o novo ciclo do aluno não existe na mesma escola
UPDATE student_profiles sp
SET school_id = NULL,
    school_name = NULL
FROM schools s
WHERE sp.school_id = s.school_id
  AND sp.birth_date IS NOT NULL
  AND calc_school_year(sp.birth_date) IS NOT NULL
  AND NOT (cycle_for_year(calc_school_year(sp.birth_date)) = ANY (s.cycles));

-- Promove o ano escolar (mantém lógica manual vs automática)
UPDATE student_profiles
SET school_year_auto = calc_school_year(birth_date),
school_year = CASE
WHEN school_year_manual THEN school_year
WHEN calc_school_year(birth_date) IS NOT NULL THEN calc_school_year(birth_date)::text
ELSE school_year
END
WHERE birth_date IS NOT NULL;

GET DIAGNOSTICS v_count = ROW_COUNT;
RETURN v_count;
END $function$;
