import React from 'react'
import { useNavigate } from 'react-router-dom'
import { XCircle, Home } from 'lucide-react'

const PaymentCancel = () => {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center">
        <XCircle className="w-20 h-20 text-red-400 mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-slate-900 mb-4" style={{ fontFamily: 'Fredoka, sans-serif' }}>
          Pagamento Cancelado
        </h1>
        <p className="text-slate-600 mb-8" style={{ fontFamily: 'Nunito, sans-serif' }}>
          O pagamento foi cancelado. Pode tentar novamente a qualquer momento.
        </p>
        <button
          onClick={() => navigate('/parent/dashboard')}
          className="w-full px-8 py-4 rounded-full font-bold text-white bg-slate-600 hover:bg-slate-700 shadow-lg transition-all"
          style={{ fontFamily: 'Nunito, sans-serif' }}
        >
          <Home className="inline mr-2" size={20} /> Voltar ao Painel
        </button>
      </div>
    </div>
  )
}

export default PaymentCancel
