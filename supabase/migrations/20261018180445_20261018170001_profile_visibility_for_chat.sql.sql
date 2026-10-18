/*
# Visibilidade de perfis para chat e amigos

1. Segurança (RLS)
- `user_profiles`: duas novas políticas de SELECT:
  - Aluno pode ver o perfil de utilizadores com quem tem amizade confirmada
    (necessário para mostrar nomes no chat e na lista de amigos).
  - Pai/encarregado pode ver o perfil de utilizadores que trocaram mensagens
    com qualquer um dos seus filhos (necessário para identificar as conversas
    no painel de monitorização).
- Nenhum campo sensível é exposto: user_profiles contém apenas nome, email,
  função e estado — sem dados de pagamento nem documentos.

2. Notas
- As políticas existentes (ver o próprio perfil, admin) mantêm-se.
*/

DROP POLICY IF EXISTS "select_profiles_of_friends" ON public.user_profiles;
CREATE POLICY "select_profiles_of_friends" ON public.user_profiles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.friendships f
    WHERE (f.user1_id = auth.uid() AND f.user2_id = user_profiles.id)
       OR (f.user2_id = auth.uid() AND f.user1_id = user_profiles.id)
  )
);

DROP POLICY IF EXISTS "select_profiles_of_child_chat_contacts" ON public.user_profiles;
CREATE POLICY "select_profiles_of_child_chat_contacts" ON public.user_profiles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.chat_messages cm
    JOIN public.student_profiles sp
      ON sp.parent_id = auth.uid()
     AND sp.user_id IN (cm.sender_id, cm.recipient_id)
    WHERE cm.sender_id = user_profiles.id
       OR cm.recipient_id = user_profiles.id
  )
);
