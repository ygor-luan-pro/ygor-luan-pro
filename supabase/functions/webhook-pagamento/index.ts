// Supabase Edge Function (Deno) – alternativa ao API route Astro
// Deploy: supabase functions deploy webhook-pagamento
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const MP_ACCESS_TOKEN = Deno.env.get('MERCADOPAGO_ACCESS_TOKEN')!;
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const SITE_URL = Deno.env.get('PUBLIC_SITE_URL') ?? 'https://ygorluanacademy.com.br';

serve(async (req) => {
  const notification = await req.json();

  if (notification.type !== 'payment') {
    return new Response('OK', { status: 200 });
  }

  // Busca dados do pagamento no MP
  const mpRes = await fetch(
    `https://api.mercadopago.com/v1/payments/${notification.data.id}`,
    { headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` } },
  );
  const paymentData = await mpRes.json();

  if (paymentData.status !== 'approved') {
    return new Response('OK', { status: 200 });
  }

  const email = paymentData.payer?.email;
  if (!email) return new Response('Missing email', { status: 400 });

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Idempotência
  const { data: existing } = await supabase
    .from('orders')
    .select('id')
    .eq('payment_id', String(paymentData.id))
    .single();

  if (existing) return new Response('OK', { status: 200 });

  const tempPassword = crypto.randomUUID();
  const { data: authData, error: createError } = await supabase.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
  });

  let userId = authData?.user?.id;

  if (createError?.message?.includes('already registered')) {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();
    userId = profileData?.id;
  }

  if (!userId) return new Response('Could not resolve user', { status: 500 });

  await supabase.from('profiles').upsert({ id: userId, email, role: 'student' });

  await supabase.from('orders').insert({
    user_id: userId,
    payment_id: String(paymentData.id),
    status: 'approved',
    amount: paymentData.transaction_amount ?? 0,
    payment_method: paymentData.payment_method_id ?? null,
    approved_at: new Date().toISOString(),
  });

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'noreply@ygorluanacademy.com.br',
      to: email,
      subject: 'Seu acesso ao Ygor Luan Academy está pronto!',
      html: `<h1>Parabéns!</h1><p>Senha temporária: <strong>${tempPassword}</strong></p><p><a href="${SITE_URL}/login">Acessar agora</a></p>`,
    }),
  });

  return new Response('OK', { status: 200 });
});
