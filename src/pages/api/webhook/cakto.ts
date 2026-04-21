import { timingSafeEqual } from 'node:crypto';
import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../lib/supabase-admin';
import { EmailService } from '../../../services/email.service';
import type { CaktoWebhookPayload } from '../../../types/cakto.types';

type AllowedTargets = {
  productIds: Set<string>;
  offerIds: Set<string>;
  refIds: Set<string>;
};

function parseAllowedList(value: string | undefined): Set<string> {
  return new Set(
    (value ?? '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
  );
}

function getAllowedTargets(): AllowedTargets {
  return {
    productIds: parseAllowedList(import.meta.env.CAKTO_ALLOWED_PRODUCT_IDS),
    offerIds: parseAllowedList(import.meta.env.CAKTO_ALLOWED_OFFER_IDS),
    refIds: parseAllowedList(import.meta.env.CAKTO_ALLOWED_REF_IDS),
  };
}

function isAllowedTarget(value: string, allowed: Set<string>): boolean {
  return allowed.size === 0 || allowed.has(value);
}

function isAllowedPurchase(payload: CaktoWebhookPayload, allowed: AllowedTargets): boolean {
  return isAllowedTarget(payload.data.product.id, allowed.productIds)
    && isAllowedTarget(payload.data.offer.id, allowed.offerIds)
    && isAllowedTarget(payload.data.refId, allowed.refIds);
}

function verifyCaktoSecret(payloadSecret: string, storedSecret: string): boolean {
  if (payloadSecret.length !== storedSecret.length) return false;
  return timingSafeEqual(Buffer.from(payloadSecret), Buffer.from(storedSecret));
}

function isCustomer(value: unknown): value is CaktoWebhookPayload['data']['customer'] {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.email === 'string'
    && (typeof candidate.name === 'string' || candidate.name === null);
}

function isPayloadData(value: unknown): value is CaktoWebhookPayload['data'] {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  const product = candidate.product as Record<string, unknown> | undefined;
  const offer = candidate.offer as Record<string, unknown> | undefined;

  return typeof candidate.id === 'string'
    && typeof candidate.refId === 'string'
    && typeof candidate.amount === 'number'
    && isCustomer(candidate.customer)
    && typeof product?.id === 'string'
    && typeof product?.name === 'string'
    && typeof offer?.id === 'string'
    && typeof offer?.name === 'string'
    && typeof offer?.price === 'number';
}

function isCaktoWebhookPayload(value: unknown): value is CaktoWebhookPayload {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.event === 'string'
    && typeof candidate.secret === 'string'
    && typeof candidate.sentAt === 'string'
    && isPayloadData(candidate.data);
}

export const POST: APIRoute = async ({ request }) => {
  const payload = await request.json().catch(() => null);

  if (!isCaktoWebhookPayload(payload)) {
    return new Response('Invalid payload', { status: 400 });
  }

  const body = payload;

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

  if (!isAllowedPurchase(body, getAllowedTargets())) {
    return new Response('Forbidden', { status: 403 });
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
