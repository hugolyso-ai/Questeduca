import React from 'react'
import { Link } from 'react-router-dom'
import { Castle } from 'lucide-react'

const PrivacyPolicy = () => (
  <div className="min-h-screen bg-gradient-to-br from-[hsl(40,33%,96%)] to-[hsl(38,80%,93%)] py-12 px-4">
    <div className="max-w-3xl mx-auto">
      <Link to="/" className="inline-flex items-center gap-3 mb-8">
        <Castle className="h-8 w-8 text-[hsl(35,92%,45%)]" strokeWidth={2.5} />
        <span className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Cinzel, serif' }}>QUESTEDUCA</span>
      </Link>
      <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12">
        <h1 className="text-3xl font-bold text-slate-900 mb-6" style={{ fontFamily: 'Cinzel, serif' }}>Política de Privacidade</h1>
        <div className="prose prose-slate max-w-none space-y-4 text-slate-700" style={{ fontFamily: 'Nunito, sans-serif' }}>
          <p>Última atualização: Janeiro de 2026</p>
          <h2 className="text-xl font-bold text-slate-900">1. Introdução</h2>
          <p>A QUESTEDUCA respeita a privacidade dos seus utilizadores. Esta política descreve como recolhemos, usamos e protegemos os dados pessoais.</p>
          <h2 className="text-xl font-bold text-slate-900">2. Dados Recolhidos</h2>
          <p>Recolhemos: nome, email, distrito, concelho, escola, ano de escolaridade e dados de jogo (progresso, pontuações).</p>
          <h2 className="text-xl font-bold text-slate-900">3. Uso dos Dados</h2>
          <p>Os dados são utilizados para: fornecer o serviço educativo, personalizar a experiência, gerar relatórios para pais e melhorar a plataforma.</p>
          <h2 className="text-xl font-bold text-slate-900">4. Partilha de Dados</h2>
          <p>Não partilhamos dados com terceiros exceto quando exigido por lei. Os dados dos alunos são visíveis apenas para os seus encarregados de educação.</p>
          <h2 className="text-xl font-bold text-slate-900">5. Segurança</h2>
          <p>Utilizamos encriptação e medidas de segurança adequadas para proteger os dados dos utilizadores.</p>
          <h2 className="text-xl font-bold text-slate-900">6. Direitos do Utilizador</h2>
          <p>Pode solicitar acesso, retificação ou eliminação dos seus dados através de info@serv2all.pt.</p>
          <h2 className="text-xl font-bold text-slate-900">7. Contacto</h2>
          <p>Para questões sobre privacidade: info@serv2all.pt</p>
        </div>
      </div>
    </div>
  </div>
)

export default PrivacyPolicy
