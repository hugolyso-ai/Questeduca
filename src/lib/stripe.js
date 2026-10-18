import { supabase } from './supabase'

// IDs dos produtos da subscrição Premium no Stripe.
// O servidor de pagamento resolve automaticamente o preço ativo de cada produto.
export const STRIPE_PRODUCT_ID_MONTHLY = 'prod_VSvqF311FwJgS9'
export const STRIPE_PRODUCT_ID_ANNUAL = 'prod_VSvrOM8A8awGkn'

export async function startCheckout({ priceId, mode = 'subscription' } = {}) {
  if (!priceId) {
    throw new Error('O preço da subscrição ainda não foi configurado no Stripe.')
  }

  const origin = window.location.origin + window.location.pathname

  const { data, error } = await supabase.functions.invoke('stripe-checkout', {
    body: {
      price_id: priceId,
      success_url: `${origin}#/payment/success`,
      cancel_url: `${origin}#/payment/cancel`,
      mode,
    },
  })

  if (error) throw error
  if (!data?.url) throw new Error('Não foi possível iniciar o pagamento. Tenta novamente.')

  window.location.href = data.url
}
