/*
# Helper: cycle for a given school year

1. Plain-English explanation
- Small IMMUTABLE helper mapping a school year (1–9) to its cycle code used in
  `schools.cycles`: years 1–4 -> "1" (1st cycle), years 5–9 -> "2" (2nd/3rd cycles).
- Used by `auto_promote_school_year()` for cycle-aware school persistence.

2. New functions
- `cycle_for_year(p_year integer)` returns text ("1" or "2").

3. Security
- No RLS involved.
*/

CREATE OR REPLACE FUNCTION public.cycle_for_year(p_year integer)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $function$
BEGIN
IF p_year IS NULL THEN
RETURN NULL;
END IF;
IF p_year <= 4 THEN
RETURN '1';
END IF;
RETURN '2';
END $function$;
