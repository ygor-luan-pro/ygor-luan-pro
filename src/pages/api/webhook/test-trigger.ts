import type { APIRoute } from 'astro';
import { supabaseAdmin } from '../../../lib/supabase';
import { resend, FROM_EMAIL } from '../../../lib/resend';

interface TriggerBody {
  email: string;
  amount?: number;
  paymentId?: string;
}

export const POST: APIRoute = async ({ request }) => {
  const testSecret = import.meta.env.WEBHOOK_TEST_SECRET;
  if (!import.meta.env.DEV || !testSecret) {
    return new Response(null, { status: 404 });
  }

  const authHeader = request.headers.get('x-test-secret');
  if (authHeader !== testSecret) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { email, amount = 997, paymentId = `fake-${Date.now()}` } =
    (await request.json()) as TriggerBody;

  const result = {
    userCreated: false,
    userId: null as string | null,
    orderCreated: false,
    emailSent: false,
  };

  const { data: existingOrder } = await supabaseAdmin
    .from('orders')
    .select('id')
    .eq('payment_id', paymentId)
    .single();

  if (existingOrder) {
    return Response.json({ ...result, skipped: 'order already exists' }, { status: 200 });
  }

  const tempPassword = crypto.randomUUID();
  const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
  });

  let userId = authData?.user?.id ?? null;

  if (createError?.message?.includes('already registered')) {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();
    userId = profile?.id ?? null;
  } else if (!createError) {
    result.userCreated = true;
    result.userId = userId;
  }

  if (!userId) {
    return Response.json({ error: 'Could not resolve user' }, { status: 500 });
  }

  result.userId = userId;

  await supabaseAdmin.from('profiles').upsert({ id: userId, email, role: 'student' });

  await supabaseAdmin.from('orders').insert({
    user_id: userId,
    payment_id: paymentId,
    status: 'approved',
    amount,
    payment_method: 'test',
    approved_at: new Date().toISOString(),
  });

  result.orderCreated = true;

  const siteUrl = import.meta.env.PUBLIC_SITE_URL ?? 'http://localhost:4321';

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: '[TEST] Acesso ao Ygor Luan Pro',
      html: `<p>Teste local. Email: ${email} | Senha: ${tempPassword} | <a href="${siteUrl}/login">Login</a></p>`,
    });
    result.emailSent = true;
  } catch (err) {
    console.error('test-trigger: falha ao enviar email', err);
  }

  return Response.json(result, { status: 200 });
};
