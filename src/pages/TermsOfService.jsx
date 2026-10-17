import React from 'react'
import { Link } from 'react-router-dom'
import { Castle } from 'lucide-react'

const Section = ({ title, children }) => (
  <>
    <h2 className="text-xl font-bold text-slate-900 mt-8 mb-2">{title}</h2>
    <div className="space-y-3">{children}</div>
  </>
)

const TermsOfService = () => (
  <div className="min-h-screen bg-gradient-to-br from-[hsl(40,33%,96%)] to-[hsl(38,80%,93%)] py-12 px-4">
    <div className="max-w-3xl mx-auto">
      <Link to="/" className="inline-flex items-center gap-3 mb-8">
        <Castle className="h-8 w-8 text-[hsl(35,92%,45%)]" strokeWidth={2.5} />
        <span className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Cinzel, serif' }}>QUESTEDUCA</span>
      </Link>
      <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 text-slate-700" style={{ fontFamily: 'Nunito, sans-serif' }}>
        <h1 className="text-3xl font-bold text-slate-900 mb-2" style={{ fontFamily: 'Cinzel, serif' }}>Termos e Condições de Utilização</h1>
        <p className="text-sm text-slate-500 mb-6">Última atualização: 17 de outubro de 2026</p>

        <Section title="1. Identificação do prestador">
          <p>A QUESTEDUCA (questeduca.pt) é uma plataforma educativa digital explorada por <strong>Hugo Martins</strong>, marca QUESTEDUCA. Contacto: <strong>info@questeduca.pt</strong>. Estes termos regem a utilização da plataforma, nos termos da lei portuguesa, nomeadamente o Decreto-Lei n.º 7/2004 (comércio eletrónico), o Regulamento (UE) 2016/679 (RGPD) e a Lei n.º 58/2019.</p>
        </Section>

        <Section title="2. Aceitação">
          <p>Ao criar uma conta ou utilizar a plataforma, o utilizador declara que leu, compreendeu e aceita estes Termos, a Política de Privacidade e o Aviso de Cookies. Os utilizadores menores de 16 anos não podem aceitar os termos de forma autónoma: é exigida a aceitação pelo titular das responsabilidades parentais ou pelo encarregado de educação (artigo 15.º da Lei n.º 58/2019).</p>
        </Section>

        <Section title="3. Descrição do serviço">
          <p>A QUESTEDUCA é uma plataforma educativa gamificada, alinhada com o currículo nacional português, destinada a alunos do 1.º ao 9.º ano de escolaridade. Inclui missões curriculares, quizzes, mini-jogos, um mundo virtual de aprendizagem, funcionalidades sociais moderadas e relatórios de progresso para encarregados de educação e professores. O serviço destina-se a utilização em território português.</p>
        </Section>

        <Section title="4. Contas e registos">
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Encarregados de educação:</strong> criam e gerem as contas dos seus educandos, autorizam o registo e mantêm a exatidão dos dados indicados.</li>
            <li><strong>Alunos:</strong> a conta é criada por encarregado de educação ou por professor com autorização registada. A identificação na plataforma faz-se por alcunha (pseudónimo), nunca pelo nome verdadeiro perante terceiros.</li>
            <li><strong>Professores:</strong> o acesso é validado mediante comprovação de vínculo à escola e está sujeito a aprovação.</li>
            <li><strong>Associações de pais:</strong> o acesso está sujeito a validação da entidade.</li>
          </ul>
          <p>O utilizador é responsável pela guarda das credenciais e por toda a atividade realizada na sua conta. Contas com dados falsos ou utilizadas em violação destes termos podem ser suspensas.</p>
        </Section>

        <Section title="5. Subscrições, preços e pagamentos">
          <ul className="list-disc pl-6 space-y-1">
            <li>Existe um plano gratuito e planos pagos (mensais e anuais, individuais e familiares), com as funcionalidades descritas na página de preços.</li>
            <li>Os preços são apresentados em euros, com IVR/IVA à taxa legal incluída quando aplicável. A QUESTEDUCA comunica os preços antes da finalização da compra.</li>
            <li>As subscrições pagas são renovadas automaticamente por períodos iguais, salvo cancelamento prévio pelo utilizador, que pode ser feito a qualquer momento na área de conta.</li>
            <li>Existe um período de demonstração gratuito, quando indicado. No caso de renovação automática em contratos anuais com demonstração gratuita, o consumidor pode rescindir a qualquer momento com reembolso proporcional (artigo 24.º, n.º 6 do Decreto-Lei n.º 7/2004, na redação atual).</li>
          </ul>
        </Section>

        <Section title="6. Direito de livre resolução (consumidores)">
          <p>Nos termos dos artigos 10.º e seguintes do Decreto-Lei n.º 24/2014, o consumidor tem o direito de resolver o contrato no prazo de 14 dias sem necessidade de indicação de motivo. O direito de livre resolução deixa de se aplicar a conteúdos digitais já iniciados com consentimento prévio expresso e reconhecimento de perda do direito (artigo 10.º, n.º 9). Para exercer o direito, envie email para <strong>info@questeduca.pt</strong>. O reembolso é processado pelo mesmo meio de pagamento no prazo máximo de 14 dias.</p>
        </Section>

        <Section title="7. Conformidade do conteúdo (consumidor)">
          <p>Nos termos do Decreto-Lei n.º 84/2021, o conteúdo digital fornecido em contratos de duração continuada deve manter-se conforme durante todo o período de fornecimento. Se o serviço apresentar falta de conformidade, o consumidor tem direito à atualização do conteúdo ou a uma redução proporcional do preço, entre outros direitos previstos na lei.</p>
        </Section>

        <Section title="8. Conduta do utilizador">
          <p>É expressamente proibido:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Usar linguagem ofensiva, discriminatória ou inadequada para menores;</li>
            <li>Praticar assédio, bullying ou qualquer forma de intimidação;</li>
            <li>Tentar aceder a contas de outros utilizadores ou interferir com elas;</li>
            <li>Manipular pontuações, explorar falhas técnicas ou usar ferramentas automatizadas (bots);</li>
            <li>Recolher dados de outros utilizadores ou contactar menores fora da plataforma;</li>
            <li>Copiar, revender ou redistribuir conteúdos da plataforma sem autorização.</li>
          </ul>
          <p>A violação destas regras pode levar a suspensão ou eliminação da conta, sem prejuízo de outras medidas legais.</p>
        </Section>

        <Section title="9. Segurança e moderação de menores">
          <p>A segurança das crianças é prioridade: as interações sociais (amizades, duelos, mensagens) são controladas, exigem aprovação de ambos os lados e podem ser supervisionadas pelos encarregados de educação. Não é permitido o contacto direto entre adultos e alunos através da plataforma. Denúncias de comportamento inadequado são tratadas com prioridade em info@questeduca.pt.</p>
        </Section>

        <Section title="10. Associações de pais">
          <p>As associações de pais registadas e validadas recebem uma percentagem das subscrições pagas por encarregados de educação associados à respetiva escola, conforme condições acordadas. As questões fiscais decorrentes são da responsidade de cada associação.</p>
        </Section>

        <Section title="11. Propriedade intelectual">
          <p>Todos os conteúdos da plataforma (textos, questões, gráficos, código, logótipo, nome) são propriedade da QUESTEDUCA ou dos respetivos licenciantes e estão protegidos pela legislação aplicável. É concedido ao utilizador um direito de uso limitado, pessoal, não exclusivo e não transferível, para fins educativos, durante a vigência da conta.</p>
        </Section>

        <Section title="12. Disponibilidade e alterações">
          <p>Envidamos esforços razoáveis para assegurar a disponibilidade do serviço, mas não garantimos ausência de interrupções. Podemos atualizar funcionalidades e estes termos; as alterações relevantes serão comunicadas com antecedência mínima de 15 dias, permitindo ao utilizador cancelar sem penalização se não aceitar.</p>
        </Section>

        <Section title="13. Responsabilidade">
          <p>A plataforma destina-se a fins educativos. A QUESTEDUCA não responde por perdas indiretas decorrentes da utilização do serviço. Nada nestes termos limita a responsabilidade que não possa ser legalmente excluída, designadamente em caso de dolo ou negligência grave, nem os direitos legais dos consumidores.</p>
        </Section>

        <Section title="14. Resolução de litígios">
          <p>Em caso de litígio de consumo, o consumidor pode recorrer às entidades de resolução alternativa de litígios competentes, designadamente o <strong>CNIACC</strong> (Centro Nacional de Informação e Arbitragem de Conflitos de Consumo, www.cniacc.pt) ou o Centro de Arbitragem de Conflitos de Consumo da sua área. Mais informação: <strong>Livro de Reclamações Eletrónico</strong> em www.livroreclamacoes.pt.</p>
        </Section>

        <Section title="15. Lei aplicável e foro">
          <p>Estes termos são regidos pela lei portuguesa. O foro competente é o do domicílio do consumidor, quando esta qualidade se aplique.</p>
        </Section>

        <Section title="16. Contacto">
          <p>Dúvidas sobre estes termos: <strong>info@questeduca.pt</strong></p>
          <p>QUESTEDUCA (questeduca.pt) — marca de Hugo Martins.</p>
        </Section>
      </div>
    </div>
  </div>
)

export default TermsOfService
