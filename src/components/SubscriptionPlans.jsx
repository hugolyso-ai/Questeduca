import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import { toast } from 'sonner'
import { startCheckout, STRIPE_PRODUCT_ID_MONTHLY, STRIPE_PRODUCT_ID_ANNUAL } from '../lib/stripe'
import { Check, Crown, ArrowLeft } from 'lucide-react'

const PLANS = [
  {
    id: 'monthly',
    name: 'Premium Mensal',
    price: '6,99 €',
    period: '/mês',
    highlight: false,
    features: [
      'Todo o conteúdo educativo do 1.º ao 9.º ano',
      'Quizzes ilimitados e missões curriculares',
      'Duelos, ligas mensais e desafios semanais',
      'Relatórios de progresso para os pais',
      'Monitorização das conversas dos filhos',
      'Sem fidelização — cancela quando quiseres',
    ],
  },
  {
    id: 'annual',
    name: 'Premium Anual',
    price: '69,90 €',
    period: '/ano',
    note: 'Equivale a 5,83 €/mês — poupas 16%',
    highlight: true,
    features: [
      'Tudo o que está incluído no plano mensal',
      'Dois meses grátis comparado com o plano mensal',
      'Preço garantido durante 12 meses',
      'Sem fidelização — cancela quando quiseres',
    ],
  },
]

const SubscriptionPlans = () => {
  const [loadingPlan, setLoadingPlan] = useState(null)

  const handleChoosePlan = async (planId) => {
    setLoadingPlan(planId)
    try {
      await startCheckout({
        priceId: planId === 'annual' ? STRIPE_PRODUCT_ID_ANNUAL : STRIPE_PRODUCT_ID_MONTHLY,
        mode: 'subscription',
      })
    } catch (err) {
      toast.error(err.message || 'Erro ao iniciar o pagamento')
      setLoadingPlan(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(40,33%,96%)] to-[hsl(38,80%,93%)] p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 transition"
          style={{ fontFamily: 'Nunito, sans-serif' }}
        >
          <ArrowLeft size={18} /> Voltar
        </button>

        <div className="text-center mb-10">
          <Crown className="w-14 h-14 text-[hsl(35,92%,50%)] mx-auto mb-4" />
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3" style={{ fontFamily: 'Cinzel, serif' }}>
            QUESTEDUCA Premium
          </h1>
          <p className="text-slate-600 max-w-xl mx-auto" style={{ fontFamily: 'Nunito, sans-serif' }}>
            Desbloqueia todo o conteúdo educativo e as funcionalidades sociais para os teus filhos.
            Sem fidelização — cancela quando quiseres.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-3xl shadow-lg p-8 flex flex-col transition ${
                plan.highlight ? 'bg-gradient-to-b from-amber-50 to-orange-50 ring-2 ring-[hsl(35,92%,50%)]' : 'bg-white'
              }`}
            >
              {plan.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-[hsl(35,92%,50%)] text-white text-xs font-bold rounded-full">
                  MELHOR VALOR
                </span>
              )}
              <h2 className="text-xl font-bold text-slate-900 mb-1" style={{ fontFamily: 'Cinzel, serif' }}>
                {plan.name}
              </h2>
              {plan.note && <p className="text-[hsl(28,85%,40%)] text-sm font-semibold mb-2">{plan.note}</p>}
              <div className="mb-6">
                <span className="text-4xl font-bold text-slate-900">{plan.price}</span>
                <span className="text-slate-500">{plan.period}</span>
              </div>
              <ul className="space-y-2 mb-8 flex-1">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-slate-700" style={{ fontFamily: 'Nunito, sans-serif' }}>
                    <Check className="text-[hsl(28,85%,40%)] flex-shrink-0 mt-0.5" size={16} />
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleChoosePlan(plan.id)}
                disabled={loadingPlan !== null}
                className={`w-full px-6 py-4 rounded-full font-bold text-white transition disabled:opacity-60 ${
                  plan.highlight ? 'bg-[hsl(35,92%,50%)] hover:bg-[hsl(33,90%,45%)] shadow-lg' : 'bg-slate-800 hover:bg-slate-700'
                }`}
                style={{ fontFamily: 'Nunito, sans-serif' }}
              >
                {loadingPlan === plan.id ? 'A abrir pagamento...' : 'Escolher este plano'}
              </button>
            </div>
          ))}
        </div>

        <p className="text-center text-slate-500 text-sm mt-8" style={{ fontFamily: 'Nunito, sans-serif' }}>
          Pagamentos seguros processados pela Stripe. Renovação automática — cancela a qualquer momento na área de conta.
        </p>
      </div>
    </div>
  )
}

export default SubscriptionPlans
