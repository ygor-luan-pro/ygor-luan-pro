import type { APIRoute } from 'astro';
import { createHmac } from 'crypto';
import { payment as mpPayment } from '../../../lib/mercadopago';
import { supabaseAdmin } from '../../../lib/supabase';
import { resend, FROM_EMAIL } from '../../../lib/resend';
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
  if (secret) {
    if (!verifyMpSignature(request.headers, notification.data.id, secret)) {
      return new Response('Unauthorized', { status: 401 });
    }
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

  const tempPassword = crypto.randomUUID();
  const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: tempPassword,
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

  await supabaseAdmin.from('orders').insert({
    user_id: userId,
    payment_id: String(paymentData.id),
    status: 'approved',
    amount: paymentData.transaction_amount ?? 0,
    payment_method: paymentData.payment_method_id ?? null,
    approved_at: new Date().toISOString(),
  });

  const siteUrl = import.meta.env.PUBLIC_SITE_URL ?? 'https://ygorluanpro.com.br';

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Seu acesso ao Ygor Luan Pro está pronto! ✂️',
      html: `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#111;border-radius:12px;overflow:hidden;border:1px solid #222;">
        <tr>
          <td style="background:linear-gradient(135deg,#b87333,#8b5e3c);padding:40px 48px;text-align:center;">
            <p style="margin:0 0 8px;color:#fff8f0;font-size:13px;letter-spacing:3px;text-transform:uppercase;opacity:.8;">Ygor Luan Pro</p>
            <h1 style="margin:0;color:#fff;font-size:28px;font-weight:700;line-height:1.2;">Acesso liberado.<br>Bem-vindo à mentoria.</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:40px 48px;">
            <p style="margin:0 0 24px;color:#ccc;font-size:16px;line-height:1.6;">
              Seu pagamento foi confirmado. A partir de agora você tem acesso completo às aulas gravadas e ao agendamento da sessão 1:1.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#1a1a1a;border-radius:8px;margin-bottom:32px;border:1px solid #2a2a2a;">
              <tr>
                <td style="padding:24px 28px;">
                  <p style="margin:0 0 4px;color:#888;font-size:12px;letter-spacing:2px;text-transform:uppercase;">Suas credenciais de acesso</p>
                  <p style="margin:8px 0 4px;color:#eee;font-size:15px;"><strong style="color:#b87333;">E-mail:</strong> ${email}</p>
                  <p style="margin:4px 0;color:#eee;font-size:15px;"><strong style="color:#b87333;">Senha temporária:</strong> ${tempPassword}</p>
                </td>
              </tr>
            </table>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center">
                  <a href="${siteUrl}/login" style="display:inline-block;background:linear-gradient(135deg,#b87333,#8b5e3c);color:#fff;text-decoration:none;font-size:16px;font-weight:600;padding:16px 40px;border-radius:8px;letter-spacing:.5px;">
                    Acessar a plataforma →
                  </a>
                </td>
              </tr>
            </table>
            <p style="margin:32px 0 0;color:#666;font-size:13px;text-align:center;line-height:1.6;">
              Recomendamos alterar sua senha após o primeiro login.<br>
              Dúvidas? Responda este e-mail.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 48px;border-top:1px solid #1e1e1e;text-align:center;">
            <p style="margin:0;color:#444;font-size:12px;">© 2025 Ygor Luan Pro · Todos os direitos reservados</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    });
  } catch (err) {
    console.error('Webhook: falha ao enviar email de boas-vindas', err);
  }

  return new Response('OK', { status: 200 });
};
