import React from 'react'
import { Link } from 'react-router-dom'

const Section = ({ title, children }) => (
  <>
    <h2 className="text-xl font-bold text-slate-900 mt-8 mb-2">{title}</h2>
    <div className="space-y-3">{children}</div>
  </>
)

const PrivacyPolicy = () => (
  <div className="min-h-screen bg-gradient-to-br from-[hsl(40,33%,96%)] to-[hsl(38,80%,93%)] py-12 px-4">
    <div className="max-w-3xl mx-auto">
      <Link to="/" className="inline-flex items-center gap-3 mb-8">
        <img src="/logo.png" alt="QUESTEDUCA" className="h-10 w-auto" />
        <span className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Cinzel, serif' }}>QUESTEDUCA</span>
      </Link>
      <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 text-slate-700" style={{ fontFamily: 'Nunito, sans-serif' }}>
        <h1 className="text-3xl font-bold text-slate-900 mb-2" style={{ fontFamily: 'Cinzel, serif' }}>Política de Privacidade</h1>
        <p className="text-sm text-slate-500 mb-6">Última atualização: 17 de outubro de 2026</p>

        <div className="bg-amber-50 border-l-4 border-amber-400 rounded-r-xl p-4 mb-8 text-sm">
          <strong>Resumo em linguagem simples:</strong> recolhemos o mínimo de dados necessário para fazer a plataforma funcionar, nunca vendemos os seus dados, os dados dos alunos só são visíveis aos respetivos encarregados de educação e pode pedir a eliminação de tudo a qualquer momento em <strong>info@questeduca.pt</strong>.
        </div>

        <Section title="1. Responsável pelo tratamento">
          <p>O responsável pelo tratamento dos dados pessoais é a <strong>QUESTEDUCA</strong>, doravante "QUESTEDUCA", contactável em <strong>info@questeduca.pt</strong>.</p>
        </Section>

        <Section title="2. Que dados recolhemos">
          <p className="font-bold">2.1. Dados de conta:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Encarregados de educação, professores e associações:</strong> nome, endereço de email e, quando aplicável, a escola/associação que representam.</li>
            <li><strong>Alunos:</strong> alcunha de jogo (pseudónimo), email de autorização fornecido pelo encarregado de educação, distrito, concelho, escola e ano de escolaridade. Não recolhemos o nome verdadeiro do aluno nem dados diretos adicionais além do estritamente necessário.</li>
          </ul>
          <p className="font-bold">2.2. Dados de utilização do serviço:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Progresso educativo: pontuações, missões concluídas, respostas a quizzes, conquistas e posicionamento em rankings.</li>
            <li>Dados técnicos mínimos necessários à segurança da conta (identificador de sessão).</li>
          </ul>
          <p className="font-bold">2.3. Dados de faturação:</p>
          <p>Os pagamentos são processados pela <strong>Stripe Payments Europe, Ltd.</strong>, entidade de pagamento certificada (PCI-DSS) que recolhe e trata diretamente os dados do cartão. A QUESTEDUCA não armazena números de cartão de crédito nem códigos de segurança. Podemos reter o email associado à compra e o comprovativo de faturação, nos termos legais. O tratamento dos dados de pagamento pela Stripe rege-se pela respetiva política de privacidade, disponível no momento da compra.</p>
          <p className="font-bold">2.4. Não recolhemos, por princípio:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Dados sensíveis (saúde, religião, etnia, orientação, opiniões políticas).</li>
            <li>Mais dados do que os necessários para cada finalidade, conforme o princípio da minimização (artigo 5.º, n.º 1, alínea c) do RGPD).</li>
          </ul>
        </Section>

        <Section title="3. Para que usamos os dados (finalidades e fundamentos)">
          <p>Tratamos os dados com as seguintes bases legais, nos termos do Regulamento (UE) 2016/679 (RGPD) e da Lei n.º 58/2019:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Prestar o serviço educativo</strong> (execução do contrato, art.º 6.º, n.º 1, alínea b)): criar e gerir a conta, guardar o progresso, gerar relatórios para os encarregados de educação, permitir o jogo social (amizades, duelos, ligas).</li>
            <li><strong>Cumprir obrigações legais</strong> (art.º 6.º, n.º 1, alínea c)): faturação, contabilidade e cumprimento de obrigações fiscal e comercial.</li>
            <li><strong>Interesse legítimo</strong> (art.º 6.º, n.º 1, alínea f)): garantir a segurança da plataforma, prevenir abusos, fraude e comportamentos inadequados (ex.: bullying, manipulação de pontuações).</li>
            <li><strong>Consentimento</strong> (art.º 6.º, n.º 1, alínea a)): comunicações de marketing e uso de cookies não essenciais. Pode retirar o consentimento a qualquer momento.</li>
          </ul>
        </Section>

        <Section title="4. Menores de idade e consentimento dos encarregados de educação">
          <p>A QUESTEDUCA destina-se a alunos do 1.º ao 9.º ano de escolaridade, incluindo menores de 16 anos. Nos termos do artigo 8.º do RGPD e do artigo 15.º da Lei n.º 58/2019, o tratamento dos dados de menores nesta faixa etária depende do consentimento dado pelo titular das responsabilidades parentais ou encarregado de educação.</p>
          <p>Na prática: é o <strong>encarregado de educação</strong> quem cria a conta do aluno, indica o seu email e autoriza o registo. O professor só pode adicionar um aluno mediante autorização registada. Os alunos não podem criar contas de forma autónoma.</p>
          <p>Os dados dos alunos são visíveis apenas: ao próprio aluno, aos seus encarregados de educação e, no estritamente necessário ao acompanhamento pedagógico, ao professor da turma autorizado.</p>
        </Section>

        <Section title="5. Com quem partilhamos os dados (subcontratantes)">
          <p>Não vendemos nem cedemos dados pessoais. Partilhamos apenas com subcontratantes que nos ajudam a operar o serviço, todos vinculados por contratos de subcontratação nos termos do artigo 28.º do RGPD:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Supabase</strong> (Supabase Inc., com infraestrutura em data centers da Amazon Web Services na União Europeia) — alojamento da base de dados, autenticação e funções de servidor.</li>
            <li><strong>Vercel Inc.</strong> — alojamento da aplicação web.</li>
            <li><strong>Google</strong> — apenas se escolher "Entrar com Google": partilhamos o seu nome e email para criar a conta.</li>
            <li><strong>Stripe Payments Europe, Ltd.</strong> — processamento de pagamentos e subscrições, sem acesso da QUESTEDUCA aos dados completos do cartão.</li>
          </ul>
          <p>Podemos ainda partilhar dados quando exigido por lei ou ordem de autoridade competente.</p>
        </Section>

        <Section title="6. Transferências fora da UE">
          <p>Sempre que um fornecedor se encontre fora do Espaço Económico Europeu, as transferências ficam sujeitas às garantias do capítulo V do RGPD, nomeadamente Cláusulas Contratuais Padrão aprovadas pela Comissão Europeia e complementos de proteção adequados.</p>
        </Section>

        <Section title="7. Conservação dos dados">
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Dados de conta e progresso:</strong> conservados enquanto a conta estiver ativa.</li>
            <li><strong>Após eliminação da conta:</strong> os dados pessoais são eliminados em prazo não superior a 30 dias, exceto o estritamente necessário para cumprir obrigações legais de conservação (ex.: documentos de faturação, a conservar 10 anos nos termos da lei fiscal portuguesa).</li>
            <li><strong>Contas inativas:</strong> podemos eliminar contas sem atividade prolongada, com aviso prévio por email.</li>
          </ul>
        </Section>

        <Section title="8. Os seus direitos">
          <p>Nos termos dos artigos 15.º a 22.º do RGPD, tem o direito de:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Acessar os seus dados e obter uma cópia (art.º 15.º);</li>
            <li>Retificar dados incorretos ou incompletos (art.º 16.º);</li>
            <li>Eliminar os seus dados ("direito a ser esquecido", art.º 17.º);</li>
            <li>Limitar o tratamento (art.º 18.º);</li>
            <li>Portabilidade dos dados num formato estruturado (art.º 20.º);</li>
            <li>Opor-se ao tratamento baseado em interesse legítimo (art.º 21.º);</li>
            <li>Não estar sujeito a decisões automatizadas que lhe produzam efeitos legais (art.º 22.º) — a QUESTEDUCA não realiza este tipo de decisões;</li>
            <li>Retirar o consentimento a qualquer momento, sem afetar a licitude do tratamento anterior.</li>
          </ul>
          <p>Para exercer qualquer destes direitos, envie email para <strong>info@questeduca.pt</strong>. Respondemos no prazo máximo de 30 dias.</p>
          <p>Também pode apresentar reclamação à <strong>Comissão Nacional de Proteção de Dados (CNPD)</strong>, Rua de São Bento 301, 1200-813 Lisboa, geral@cnpd.pt, www.cnpd.pt.</p>
        </Section>

        <Section title="9. Segurança">
          <p>Aplicamos medidas técnicas e organizativas adequadas, incluindo: encriptação em trânsito (HTTPS/TLS) e em repouso, controlo de acesso granular à base de dados (regras de acesso ao nível da linha), autenticação segura, isolamento dos dados de cada utilizador e princípio da minimização de dados. Em caso de violação de dados pessoal com risco para os direitos dos titulares, notificaremos a CNPD no prazo legal de 72 horas e os titulares afetados, quando exigível.</p>
        </Section>

        <Section title="10. Cookies">
          <p>Utilizamos apenas cookies e tecnologias semelhantes estritamente necessários ao funcionamento do serviço (manutenção da sessão de início de sessão e segurança). A base jurídica é o artigo 4.º, alínea f) e o artigo 5.º da Diretiva 2002/58/CE (regra ePrivacy), por se tratarem de cookies isentos de consentimento. Não utilizamos cookies de publicidade nem de rastreio de terceiros. Consulte o nosso <strong>Aviso de Cookies</strong> apresentado na primeira visita e acessível no rodapé do site.</p>
        </Section>

        <Section title="11. Alterações a esta política">
          <p>Podemos atualizar esta política. As alterações relevantes serão comunicadas por email aos utilizadores com antecedência mínima de 15 dias ou através de aviso na plataforma. A data da última atualização encontra-se no topo desta página.</p>
        </Section>

        <Section title="12. Contacto">
          <p>Dúvidas ou pedidos relacionados com privacidade: <strong>info@questeduca.pt</strong></p>
          <p>QUESTEDUCA — Todos os direitos reservados.</p>
        </Section>
      </div>
    </div>
  </div>
)

export default PrivacyPolicy
