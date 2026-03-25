import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, Home } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('checking'); // checking, success, error
  const [paymentData, setPaymentData] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const maxAttempts = 5;

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    
    if (!sessionId) {
      setStatus('error');
      return;
    }

    const checkPaymentStatus = async () => {
      try {
        const response = await axios.get(`${API}/payments/status/${sessionId}`, {
          withCredentials: true
        });
        
        if (response.data.payment_status === 'paid') {
          setStatus('success');
          setPaymentData(response.data);
          return true;
        } else if (response.data.status === 'expired') {
          setStatus('error');
          return true;
        }
        
        return false;
      } catch (error) {
        console.error('Error checking payment:', error);
        if (attempts >= maxAttempts - 1) {
          setStatus('error');
          return true;
        }
        return false;
      }
    };

    // Poll for payment status
    const pollPayment = async () => {
      const completed = await checkPaymentStatus();
      if (!completed && attempts < maxAttempts) {
        setAttempts(prev => prev + 1);
        setTimeout(pollPayment, 2000);
      }
    };

    pollPayment();
  }, [searchParams, attempts]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 md:p-12 shadow-2xl max-w-lg w-full text-center">
        {status === 'checking' && (
          <>
            <div className="bg-blue-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
              <Loader2 className="text-blue-500 animate-spin" size={48} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-4" style={{ fontFamily: 'Fredoka, sans-serif' }}>
              A verificar pagamento...
            </h1>
            <p className="text-slate-600" style={{ fontFamily: 'Nunito, sans-serif' }}>
              Por favor aguarde enquanto confirmamos o seu pagamento.
            </p>
            <div className="mt-6 bg-slate-100 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-blue-500 h-full transition-all duration-500"
                style={{ width: `${(attempts / maxAttempts) * 100}%` }}
              />
            </div>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="bg-green-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="text-green-500" size={48} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-4" style={{ fontFamily: 'Fredoka, sans-serif' }}>
              Pagamento Confirmado!
            </h1>
            <p className="text-slate-600 mb-6" style={{ fontFamily: 'Nunito, sans-serif' }}>
              A sua subscrição Premium foi ativada com sucesso. Obrigado por escolher o QUESTEDUCA!
            </p>
            
            {paymentData && (
              <div className="bg-slate-50 rounded-xl p-4 mb-6 text-left">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-500">Valor:</span>
                  <span className="font-semibold text-slate-900">
                    €{(paymentData.amount_total / 100).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Estado:</span>
                  <span className="font-semibold text-green-600">Pago</span>
                </div>
              </div>
            )}

            <button
              onClick={() => navigate('/parent')}
              className="w-full py-4 bg-gradient-to-r from-green-500 to-teal-500 text-white font-bold rounded-xl hover:opacity-90 transition flex items-center justify-center gap-2"
              data-testid="go-to-dashboard-btn"
              style={{ fontFamily: 'Nunito, sans-serif' }}
            >
              <Home size={20} />
              Ir para o Dashboard
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="bg-red-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
              <XCircle className="text-red-500" size={48} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-4" style={{ fontFamily: 'Fredoka, sans-serif' }}>
              Erro no Pagamento
            </h1>
            <p className="text-slate-600 mb-6" style={{ fontFamily: 'Nunito, sans-serif' }}>
              Não foi possível confirmar o seu pagamento. Se o valor foi debitado, 
              contacte o nosso suporte com o ID da sessão.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => navigate('/parent')}
                className="flex-1 py-4 bg-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-300 transition"
                style={{ fontFamily: 'Nunito, sans-serif' }}
              >
                Voltar
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 py-4 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-600 transition"
                style={{ fontFamily: 'Nunito, sans-serif' }}
              >
                Tentar Novamente
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccess;
