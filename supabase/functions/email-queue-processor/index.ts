// Processa a fila de emails (email_queue): envia pendentes via SMTP (webdomain01.dnscpanel.com, SSL porta 465)
// com a conta info@questeduca.pt e marca como enviados.
import { createClient } from 'npm:@supabase/supabase-js@2';
import nodemailer from 'npm:nodemailer@10.1.2';

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

    const smtpHost = Deno.env.get('SMTP_HOST') || 'webdomain01.dnscpanel.com';
    const smtpPort = parseInt(Deno.env.get('SMTP_PORT') || '465', 10);
    const smtpUser = Deno.env.get('SMTP_USER') || 'info@questeduca.pt';
    const smtpPass = Deno.env.get('SMTP_PASS') || 'Questmail*';
    const smtpFrom = Deno.env.get('SMTP_FROM') || 'QUESTEDUCA <info@questeduca.pt>';

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: true,
      auth: { user: smtpUser, pass: smtpPass },
    });

    let sent = 0;
    const errors: string[] = [];

    for (const email of pending) {
      try {
        await transporter.sendMail({
          from: smtpFrom,
          to: email.to_email,
          subject: email.subject,
          text: email.body,
          html: email.body.replace(/\n/g, '<br>'),
        });
        await supabase
          .from('email_queue')
          .update({ status: 'sent', sent_at: new Date().toISOString() })
          .eq('id', email.id);
        sent++;
      } catch (e) {
        await supabase
          .from('email_queue')
          .update({ status: 'failed', error: String((e as Error).message || e).slice(0, 500) })
          .eq('id', email.id);
        errors.push(String((e as Error).message || e).slice(0, 100));
      }
    }

    transporter.close();

    return new Response(JSON.stringify({ sent, failed: errors.length, errors }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String((err as Error).message || err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
