// Processa a fila de emails (email_queue): envia pendentes via Resend e marca como enviados.
// Acionar por cron (agendamento no dashboard Supabase) ou manualmente.
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: pending, error } = await supabase
      .from('email_queue')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(20);

    if (error) throw error;
    if (!pending || pending.length === 0) {
      return new Response(JSON.stringify({ sent: 0, message: 'Fila vazia' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const resendKey = Deno.env.get('RESEND_API_KEY');
    const fromEmail = Deno.env.get('EMAIL_FROM') || 'QUESTEDUCA <onboarding@resend.dev>';
    let sent = 0;
    const errors: string[] = [];

    for (const email of pending) {
      if (!resendKey) {
        await supabase
          .from('email_queue')
          .update({ status: 'failed', error: 'RESEND_API_KEY não configurada' })
          .eq('id', email.id);
        errors.push('sem RESEND_API_KEY');
        continue;
      }

      try {
        const resp = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: fromEmail,
            to: [email.to_email],
            subject: email.subject,
            text: email.body,
          }),
        });
        if (!resp.ok) {
          const detail = await resp.text();
          throw new Error(`Resend ${resp.status}: ${detail.slice(0, 200)}`);
        }
        await supabase
          .from('email_queue')
          .update({ status: 'sent', sent_at: new Date().toISOString() })
          .eq('id', email.id);
        sent++;
      } catch (e) {
        await supabase
          .from('email_queue')
          .update({ status: 'failed', error: String(e.message || e).slice(0, 500) })
          .eq('id', email.id);
        errors.push(String(e.message || e).slice(0, 100));
      }
    }

    return new Response(JSON.stringify({ sent, failed: errors.length, errors }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err.message || err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
