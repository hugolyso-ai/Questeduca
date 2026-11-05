/*
# Proteger campos sensíveis do perfil

1. Problema
- Qualquer utilizador autenticado podia alterar o próprio perfil e definir o seu papel, estado de aprovação ou bloqueio, ou criar um perfil de administrador ao registar-se.

2. Alterações
- Função de gatilho em user_profiles que, para pedidos feitos diretamente pela aplicação (role authenticated) e que não sejam de um administrador:
  - No registo, impede o papel administrador e coloca contas de professor e associação como pendentes.
  - Nas atualizações, repõe o papel, o estado de aprovação, o bloqueio, a data de aprovação e o motivo de rejeição originais.
- Funções SECURITY DEFINER (aprovações, administração) continuam a funcionar porque não correm como authenticated.

3. Notas
- Nenhum dado é apagado nem alterado; apenas se impede a escrita indevida de campos sensíveis.
*/

CREATE OR REPLACE FUNCTION public.protect_user_profile_privileged_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF current_user <> 'authenticated' OR is_admin() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.role = 'admin' THEN
      RAISE EXCEPTION 'Papel não permitido';
    END IF;
    IF NEW.role IN ('teacher', 'association') THEN
      NEW.approval_status := 'pending';
    END IF;
    NEW.approved_at := NULL;
    NEW.rejected_reason := NULL;
  ELSE
    NEW.role := OLD.role;
    NEW.approval_status := OLD.approval_status;
    NEW.is_active := OLD.is_active;
    NEW.approved_at := OLD.approved_at;
    NEW.rejected_reason := OLD.rejected_reason;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_user_profile_privileged_columns ON public.user_profiles;
CREATE TRIGGER protect_user_profile_privileged_columns
BEFORE INSERT OR UPDATE ON public.user_profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_user_profile_privileged_columns();

REVOKE EXECUTE ON FUNCTION public.protect_user_profile_privileged_columns() FROM PUBLIC, anon, authenticated;
