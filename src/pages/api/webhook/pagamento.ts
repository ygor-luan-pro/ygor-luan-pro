import type { APIRoute } from 'astro';
import { payment as mpPayment } from '../../../lib/mercadopago';
import { supabaseAdmin } from '../../../lib/supabase';
import { resend, FROM_EMAIL } from '../../../lib/resend';
import type { MercadoPagoPaymentNotification } from '../../../types/mercadopago.types';

export const POST: APIRoute = async ({ request }) => {
  const notification = await request.json() as MercadoPagoPaymentNotification;

  // Só processa notificações de pagamento
  if (notification.type !== 'payment') {
    return new Response('OK', { status: 200 });
  }

  const paymentData = await mpPayment.get({ id: notification.data.id });

  if (paymentData.status !== 'approved') {
    return new Response('OK', { status: 200 });
  }

  const email = paymentData.payer?.email;
  if (!email) {
    return new Response('Missing payer email', { status: 400 });
  }

  // Idempotência: verifica se o pedido já foi registrado
  const { data: existingOrder } = await supabaseAdmin
    .from('orders')
    .select('id')
    .eq('payment_id', String(paymentData.id))
    .single();

  if (existingOrder) {
    return new Response('OK', { status: 200 });
  }

  // Cria ou recupera o usuário
  const tempPassword = crypto.randomUUID();
  const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
  });

  let userId = authData?.user?.id;

  if (createError?.message?.includes('already registered')) {
    // Usuário já existe – busca pelo e-mail
    const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
    userId = usersData.users.find((u) => u.email === email)?.id;
  } else if (createError) {
    console.error('Webhook: erro ao criar usuário', createError);
    return new Response('Error creating user', { status: 500 });
  }

  if (!userId) {
    return new Response('Could not resolve user', { status: 500 });
  }

  // Garante que o perfil existe
  await supabaseAdmin.from('profiles').upsert({
    id: userId,
    email,
    role: 'student',
  });

  // Registra o pedido
  await supabaseAdmin.from('orders').insert({
    user_id: userId,
    payment_id: String(paymentData.id),
    status: 'approved',
    amount: paymentData.transaction_amount ?? 0,
    payment_method: paymentData.payment_method_id ?? null,
    approved_at: new Date().toISOString(),
  });

  // Envia e-mail de boas-vindas com senha temporária
  await resend.emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: 'Seu acesso ao Ygor Luan Pro está pronto!',
    html: `
      <h1>Parabéns! Seu acesso está liberado.</h1>
      <p>Acesse a plataforma com as credenciais abaixo:</p>
      <p><strong>E-mail:</strong> ${email}</p>
      <p><strong>Senha temporária:</strong> ${tempPassword}</p>
      <p><a href="${import.meta.env.PUBLIC_SITE_URL}/login">Acessar agora →</a></p>
      <p>Recomendamos alterar sua senha após o primeiro login.</p>
    `,
  });

  return new Response('OK', { status: 200 });
};
