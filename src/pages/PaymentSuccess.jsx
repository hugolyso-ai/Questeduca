import React from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, Home } from 'lucide-react'

const PaymentSuccess = () => {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center">
        <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-slate-900 mb-4" style={{ fontFamily: 'Fredoka, sans-serif' }}>
          Pagamento Confirmado!
        </h1>
        <p className="text-slate-600 mb-8" style={{ fontFamily: 'Nunito, sans-serif' }}>
          A sua subscrição foi ativada com sucesso. Obrigado por fazer parte da QUESTEDUCA!
        </p>
        <button
          onClick={() => navigate('/parent/dashboard')}
          className="w-full px-8 py-4 rounded-full font-bold text-white bg-green-500 hover:bg-green-600 shadow-lg transition-all"
          style={{ fontFamily: 'Nunito, sans-serif' }}
        >
          <Home className="inline mr-2" size={20} /> Voltar ao Painel
        </button>
      </div>
    </div>
  )
}

export default PaymentSuccess
