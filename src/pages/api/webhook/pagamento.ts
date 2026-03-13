import type { APIRoute } from 'astro';
import { createHmac } from 'crypto';
import { payment as mpPayment } from '../../../lib/mercadopago';
import { supabaseAdmin } from '../../../lib/supabase';
import { EmailService } from '../../../services/email.service';
import type { MercadoPagoPaymentNotification } from '../../../types/mercadopago.types';

function verifyMpSignature(headers: Headers, paymentId: string, secret: string): boolean {
  const xSignature = headers.get('x-signature') ?? '';
  const xRequestId = headers.get('x-request-id') ?? '';

  const parts = xSignature.split(',');
  const ts = parts.find((p) => p.startsWith('ts='))?.slice(3) ?? '';
  const v1 = parts.find((p) => p.startsWith('v1='))?.slice(3) ?? '';

  if (!ts || !v1) return false;

  const template = `id:${paymentId};request-id:${xRequestId};ts:${ts};`;
  const computed = createHmac('sha256', secret).update(template).digest('hex');

  return computed === v1;
}

export const POST: APIRoute = async ({ request }) => {
  const notification = (await request.json()) as MercadoPagoPaymentNotification;

  if (notification.type !== 'payment') {
    return new Response('OK', { status: 200 });
  }

  const secret = import.meta.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret) {
    console.error('MERCADOPAGO_WEBHOOK_SECRET não configurado');
    return new Response('Unauthorized', { status: 401 });
  }
  if (!verifyMpSignature(request.headers, notification.data.id, secret)) {
    return new Response('Unauthorized', { status: 401 });
  }

  const paymentData = await mpPayment.get({ id: notification.data.id });

  if (paymentData.status !== 'approved') {
    return new Response('OK', { status: 200 });
  }

  const email = paymentData.payer?.email;
  if (!email) {
    return new Response('Missing payer email', { status: 400 });
  }

  const { data: existingOrder } = await supabaseAdmin
    .from('orders')
    .select('id')
    .eq('payment_id', String(paymentData.id))
    .single();

  if (existingOrder) {
    return new Response('OK', { status: 200 });
  }

  const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: crypto.randomUUID(),
    email_confirm: true,
  });

  let userId = authData?.user?.id;

  if (createError?.message?.includes('already registered')) {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();
    userId = profile?.id ?? undefined;
  } else if (createError) {
    console.error('Webhook: erro ao criar usuário', createError);
    return new Response('Error creating user', { status: 500 });
  }

  if (!userId) {
    return new Response('Could not resolve user', { status: 500 });
  }

  await supabaseAdmin.from('profiles').upsert({
    id: userId,
    email,
    role: 'student',
  });

  const { error: orderError } = await supabaseAdmin.from('orders').upsert(
    {
      user_id: userId,
      payment_id: String(paymentData.id),
      status: 'approved',
      amount: paymentData.transaction_amount ?? 0,
      payment_method: paymentData.payment_method_id ?? null,
      approved_at: new Date().toISOString(),
    },
    { onConflict: 'payment_id', ignoreDuplicates: true },
  );

  if (orderError) {
    console.error('Webhook: erro ao criar pedido', orderError);
    return new Response('Error creating order', { status: 500 });
  }

  const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
    type: 'recovery',
    email,
  });

  if (linkError || !linkData?.properties?.action_link) {
    console.error('Webhook: erro ao gerar link de acesso', linkError);
    return new Response('Error generating access link', { status: 500 });
  }

  const recoveryLink = linkData.properties.action_link;

  await EmailService.sendWelcome(email, paymentData.payer?.first_name ?? null, recoveryLink);

  return new Response('OK', { status: 200 });
};
