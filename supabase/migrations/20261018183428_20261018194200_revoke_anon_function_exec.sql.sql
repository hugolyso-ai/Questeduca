/*
# Retirar EXECUTE a anon em todas as funções (RPC)

1. Segurança (permissões)
- O Supabase concede EXECUTE diretamente ao papel `anon` por predefinição
  (default privileges), por isso o REVOKE ao grupo PUBLIC não bastou.
- Correção: REVOKE ALL em todas as funções do schema public para `anon`.
  Nenhuma rota pública precisa de RPC anónima — o registo e validações anónimas
  usam tabelas/vistas, não funções.
- As concessões a `authenticated` da migração anterior mantêm-se.
*/

DO $$
DECLARE
  fn record;
BEGIN
  FOR fn IN
    SELECT p.oid
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM anon', fn.oid::regprocedure);
  END LOOP;
END $$;
