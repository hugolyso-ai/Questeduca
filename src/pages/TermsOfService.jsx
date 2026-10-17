import React from 'react'
import { Link } from 'react-router-dom'
import { Castle } from 'lucide-react'

const TermsOfService = () => (
  <div className="min-h-screen bg-gradient-to-br from-[hsl(40,33%,96%)] to-[hsl(38,80%,93%)] py-12 px-4">
    <div className="max-w-3xl mx-auto">
      <Link to="/" className="inline-flex items-center gap-3 mb-8">
        <Castle className="h-8 w-8 text-[hsl(35,92%,45%)]" strokeWidth={2.5} />
        <span className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Cinzel, serif' }}>QUESTEDUCA</span>
      </Link>
      <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12">
        <h1 className="text-3xl font-bold text-slate-900 mb-6" style={{ fontFamily: 'Cinzel, serif' }}>Termos e Condições</h1>
        <div className="prose prose-slate max-w-none space-y-4 text-slate-700" style={{ fontFamily: 'Nunito, sans-serif' }}>
          <p>Última atualização: Janeiro de 2026</p>
          <h2 className="text-xl font-bold text-slate-900">1. Aceitação dos Termos</h2>
          <p>Ao utilizar a QUESTEDUCA, concorda com estes termos e condições. Se não concorda, não utilize o serviço.</p>
          <h2 className="text-xl font-bold text-slate-900">2. Descrição do Serviço</h2>
          <p>A QUESTEDUCA é uma plataforma educativa gamificada para alunos do 1º ao 9º ano em Portugal.</p>
          <h2 className="text-xl font-bold text-slate-900">3. Contas</h2>
          <p>Os pais registam as contas dos alunos. Os alunos menores de 13 anos devem ter permissão dos encarregados de educação.</p>
          <h2 className="text-xl font-bold text-slate-900">4. Subscrições</h2>
          <p>Existem planos gratuitos e pagos. As subscrições podem ser mensais ou anuais, individuais ou familiares.</p>
          <h2 className="text-xl font-bold text-slate-900">5. Conduta do Utilizador</h2>
          <p>Os utilizadores não devem: usar linguagem inadequada, fazer bullying, tentar aceder a contas de outros, ou manipular o sistema de pontuação.</p>
          <h2 className="text-xl font-bold text-slate-900">6. Associações de Pais</h2>
          <p>As associações de pais registadas recebem uma percentagem das subscrições dos pais associados à sua escola.</p>
          <h2 className="text-xl font-bold text-slate-900">7. Cancelamento</h2>
          <p>Pode cancelar a subscrição a qualquer momento. O acesso premium mantém-se até ao fim do período pago.</p>
          <h2 className="text-xl font-bold text-slate-900">8. Contacto</h2>
          <p>Para questões: info@serv2all.pt</p>
        </div>
      </div>
    </div>
  </div>
)

export default TermsOfService
