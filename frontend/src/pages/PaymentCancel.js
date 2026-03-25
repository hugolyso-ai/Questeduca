import React from 'react';
import { useNavigate } from 'react-router-dom';
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react';

const PaymentCancel = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-orange-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 md:p-12 shadow-2xl max-w-lg w-full text-center">
        <div className="bg-orange-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
          <XCircle className="text-orange-500" size={48} />
        </div>
        
        <h1 className="text-2xl font-bold text-slate-900 mb-4" style={{ fontFamily: 'Fredoka, sans-serif' }}>
          Pagamento Cancelado
        </h1>
        
        <p className="text-slate-600 mb-8" style={{ fontFamily: 'Nunito, sans-serif' }}>
          O pagamento foi cancelado. Não se preocupe, nenhum valor foi cobrado da sua conta.
          Pode voltar a tentar quando quiser.
        </p>

        <div className="bg-blue-50 rounded-xl p-4 mb-6 text-left">
          <h3 className="font-semibold text-blue-900 mb-2" style={{ fontFamily: 'Fredoka, sans-serif' }}>
            Vantagens Premium
          </h3>
          <ul className="space-y-1 text-sm text-blue-800" style={{ fontFamily: 'Nunito, sans-serif' }}>
            <li>✓ +15% moedas em todos os quizzes</li>
            <li>✓ Mini-jogos exclusivos</li>
            <li>✓ Suporte prioritário</li>
            <li>✓ Até 3 filhos na conta familiar</li>
          </ul>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => navigate('/parent')}
            className="flex-1 py-4 bg-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-300 transition flex items-center justify-center gap-2"
            data-testid="back-to-dashboard-btn"
            style={{ fontFamily: 'Nunito, sans-serif' }}
          >
            <ArrowLeft size={20} />
            Voltar
          </button>
          <button
            onClick={() => navigate('/parent', { state: { openSubscription: true } })}
            className="flex-1 py-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white font-bold rounded-xl hover:opacity-90 transition flex items-center justify-center gap-2"
            data-testid="try-again-btn"
            style={{ fontFamily: 'Nunito, sans-serif' }}
          >
            <RefreshCw size={20} />
            Tentar Novamente
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentCancel;
