import { timingSafeEqual } from 'node:crypto';
import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../lib/supabase-admin';
import { EmailService } from '../../../services/email.service';
import type { CaktoWebhookPayload } from '../../../types/cakto.types';

function verifyCaktoSecret(payloadSecret: string, storedSecret: string): boolean {
  if (payloadSecret.length !== storedSecret.length) return false;
  return timingSafeEqual(Buffer.from(payloadSecret), Buffer.from(storedSecret));
}

export const POST: APIRoute = async ({ request }) => {
  const body = (await request.json()) as CaktoWebhookPayload;

  const secret = import.meta.env.CAKTO_WEBHOOK_SECRET;
  if (!secret) {
    console.error('CAKTO_WEBHOOK_SECRET não configurado');
    return new Response('Unauthorized', { status: 401 });
  }
  if (!verifyCaktoSecret(body.secret, secret)) {
    return new Response('Unauthorized', { status: 401 });
  }

  if (body.event !== 'purchase_approved') {
    return new Response('OK', { status: 200 });
  }

  const { email, name } = body.data.customer;
  if (!email) {
    return new Response('Missing customer email', { status: 400 });
  }

  const paymentId = body.data.id;

  const { data: existingOrder } = await supabaseAdmin
    .from('orders')
    .select('id')
    .eq('payment_id', paymentId)
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
    console.error('Webhook Cakto: erro ao criar usuário', createError);
    return new Response('Error creating user', { status: 500 });
  }

  if (!userId) {
    return new Response('Could not resolve user', { status: 500 });
  }

  await supabaseAdmin.from('profiles').upsert({
    id: userId,
    email,
    full_name: name ?? null,
    role: 'student',
  });

  const { error: orderError } = await supabaseAdmin.from('orders').upsert(
    {
      user_id: userId,
      payment_id: paymentId,
      status: 'approved',
      amount: body.data.amount / 100,
      payment_method: body.data.paymentMethod ?? null,
      approved_at: new Date().toISOString(),
    },
    { onConflict: 'payment_id', ignoreDuplicates: true },
  );

  if (orderError) {
    console.error('Webhook Cakto: erro ao criar pedido', orderError);
    return new Response('Error creating order', { status: 500 });
  }

  const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
    type: 'recovery',
    email,
  });

  if (linkError || !linkData?.properties?.action_link) {
    console.error('Webhook Cakto: erro ao gerar link de acesso', linkError);
    return new Response('Error generating access link', { status: 500 });
  }

  void EmailService.sendWelcome(email, name ?? null, linkData.properties.action_link);

  return new Response('OK', { status: 200 });
};
