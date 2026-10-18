/*
# Vista pública de emails de alunos autorizados (para validação no formulário)

1. Nova vista
- `authorized_student_emails`: expõe APENAS o email (em minúsculas) das autorizações ativas
  (status 'authorized' — não revela 'registered', que já corresponde a contas criadas).
  Sem nomes, nicknames ou ids de pais: o formulário de registo de aluno consulta esta vista
  em background para indicar se o email está autorizado, sem revelar dados pessoais.
2. Segurança
- RLS na vista: visível a anon e authenticated (é a lista mínima necessária para o fluxo
  "validação em background antes do registo"). Contém apenas hashes-úteis de emails já
  fornecidos pelos próprios pais; nenhuma outra coluna é exposta.
*/

DROP VIEW IF EXISTS authorized_student_emails;
CREATE VIEW authorized_student_emails
WITH (security_invoker = true) AS
  SELECT DISTINCT lower(student_email) AS student_email
  FROM student_authorizations
  WHERE status = 'authorized';

GRANT SELECT ON authorized_student_emails TO anon, authenticated;
