/*
# Correção de permissões de execução de funções (RPC) — 2ª tentativa

1. Segurança (permissões)
- O REVOKE anterior falhou porque existem duas funções com o mesmo nome
  (submit_google_role_request). Esta versão identifica cada função pelo OID,
  o que funciona sempre.
- Correção aplicada a TODAS as funções do schema public:
  - `REVOKE EXECUTE ... FROM PUBLIC` (remove a permissão implícita do grupo
    PUBLIC, que era a razão de anon/authenticated poderem chamar tudo);
  - concessão explícita a `authenticated` APENAS nas funções que o frontend
    usa via RPC: purchase_resources, send_gift, send_raid,
    start_student_signup, complete_student_auth, complete_student_signup,
    is_authorized_student_email, approve_role_request,
    submit_google_role_request (ambas as assinaturas usadas),
    find_student_by_nickname, search_students, get_student_counts_by_district,
    get_friend_locations, send_friend_request, parent_approve_friend_request,
    parent_reject_friend_request, set_child_nickname, is_admin.
- Funções apenas internas (notify_new_message, auto_promote_school_year)
  ficam SEM concessão a clientes: chamáveis só pelo servidor.
- is_admin: concedida a authenticated (necessária às políticas RLS); negada a
  anon.

2. Notas
- Nenhuma função foi apagada nem alterada logicamente.
- As funções com verificação interna de sessão/admin continuam seguras mesmo
  se chamadas diretamente: a validação real acontece dentro delas.
*/

DO $$
DECLARE
  fn record;
BEGIN
  FOR fn IN
    SELECT p.oid, p.proname
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC', fn.oid::regprocedure);
  END LOOP;
END $$;

GRANT EXECUTE ON FUNCTION public.purchase_resources(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_gift(uuid, text, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_raid(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.start_student_signup(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_student_auth() TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_student_signup(date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_authorized_student_email() TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_role_request(uuid, boolean, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.find_student_by_nickname(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_students(text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_student_counts_by_district() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_friend_locations() TO authenticated;
GRANT EXECUTE ON FUNCTION public.send_friend_request(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.parent_approve_friend_request(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.parent_reject_friend_request(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_child_nickname(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- submit_google_role_request: conceder a ambas as assinaturas existentes
DO $$
DECLARE
  fn record;
BEGIN
  FOR fn IN
    SELECT p.oid
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'submit_google_role_request'
  LOOP
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', fn.oid::regprocedure);
  END LOOP;
END $$;
