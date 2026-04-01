import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;
const FROM_EMAIL = Deno.env.get('RESEND_FROM_EMAIL') ?? 'noreply@ygorluanacademy.com.br';

interface SessionRow {
  id: string;
  scheduled_at: string;
  meeting_url: string | null;
  user_id: string;
}

interface ProfileRow {
  email: string;
  full_name: string | null;
}

function formatDatePtBR(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'America/Sao_Paulo',
  }).format(date);
}

function formatTimePtBR(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo',
  }).format(date);
}

function buildReminderHtml(displayName: string, formattedDate: string, formattedTime: string, meetingUrl: string): string {
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0a; color: #ffffff; margin: 0; padding: 0; }
      .container { max-width: 600px; margin: 0 auto; background-color: #0a0a0a; padding: 40px 20px; }
      .logo { font-size: 28px; font-weight: bold; color: #c9a96e; text-align: center; margin-bottom: 20px; }
      .title { font-size: 32px; font-weight: bold; color: #ffffff; text-align: center; margin: 0 0 10px 0; }
      .subtitle { font-size: 16px; color: #c9a96e; text-align: center; margin: 0 0 40px 0; }
      .content { background-color: #1a1a1a; border-left: 4px solid #c9a96e; padding: 30px; border-radius: 8px; margin-bottom: 30px; }
      .greeting { font-size: 18px; color: #ffffff; margin-bottom: 20px; line-height: 1.6; }
      .session-details { background-color: #0a0a0a; border: 1px solid #333333; border-radius: 8px; padding: 25px; margin: 30px 0; }
      .detail-row { margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px solid #333333; }
      .detail-row:last-child { margin-bottom: 0; padding-bottom: 0; border-bottom: none; }
      .detail-label { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #c9a96e; margin-bottom: 5px; font-weight: bold; }
      .detail-value { font-size: 16px; color: #ffffff; font-weight: bold; }
      .cta-button { display: inline-block; background-color: #c9a96e; color: #0a0a0a; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px; margin: 20px 0; text-align: center; width: 100%; box-sizing: border-box; }
      .footer { text-align: center; padding-top: 30px; border-top: 1px solid #333333; color: #888888; font-size: 12px; }
      .footer a { color: #c9a96e; text-decoration: none; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="logo">Ygor Luan Academy</div>
      <h1 class="title">Lembrete importante!</h1>
      <p class="subtitle">Sua mentoria é amanhã</p>
      <div class="content">
        <p class="greeting">Oi <strong>${displayName}</strong>,</p>
        <p class="greeting">Este é um lembrete amigável: você tem uma sessão de mentoria 1:1 com Ygor agendada para amanhã!</p>
        <div class="session-details">
          <div class="detail-row">
            <div class="detail-label">Data</div>
            <div class="detail-value">${formattedDate}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Horário</div>
            <div class="detail-value">${formattedTime}</div>
          </div>
          <div class="detail-row">
            <div class="detail-label">Tipo de sessão</div>
            <div class="detail-value">Mentoria ao vivo</div>
          </div>
        </div>
        <a href="${meetingUrl}" class="cta-button">Acessar reunião →</a>
      </div>
      <div class="footer">
        <p>© 2026 Ygor Luan Academy. Todos os direitos reservados.</p>
        <p>
          <a href="https://ygorluanacademy.com.br/privacidade">Política de Privacidade</a> |
          <a href="https://ygorluanacademy.com.br/termos">Termos de Serviço</a>
        </p>
      </div>
    </div>
  </body>
</html>`.trim();
}

async function sendReminderEmail(
  email: string,
  name: string | null,
  scheduledAt: Date,
  meetingUrl: string,
): Promise<void> {
  const displayName = name ?? 'Aluno';
  const formattedDate = formatDatePtBR(scheduledAt);
  const formattedTime = formatTimePtBR(scheduledAt);
  const html = buildReminderHtml(displayName, formattedDate, formattedTime, meetingUrl);

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: email,
      subject: 'Lembrete: sua mentoria é amanhã!',
      html,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend error ${res.status}: ${body}`);
  }
}

serve(async () => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: sessions, error: sessionsError } = await supabase
    .from('mentorship_sessions')
    .select('id, scheduled_at, meeting_url, user_id')
    .eq('status', 'scheduled')
    .eq('reminder_sent', false)
    .gte('scheduled_at', new Date(Date.now() + 23 * 60 * 60 * 1000).toISOString())
    .lte('scheduled_at', new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString());

  if (sessionsError) {
    return new Response(JSON.stringify({ error: sessionsError.message }), { status: 500 });
  }

  const rows = (sessions ?? []) as SessionRow[];
  let sent = 0;

  for (const session of rows) {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', session.user_id)
      .single<ProfileRow>();

    if (profileError || !profile) {
      console.error(`Falha ao buscar perfil para sessão ${session.id}:`, profileError);
      continue;
    }

    try {
      await sendReminderEmail(
        profile.email,
        profile.full_name,
        new Date(session.scheduled_at),
        session.meeting_url ?? 'https://ygorluanacademy.com.br/dashboard/mentoria',
      );

      const { error: updateError } = await supabase
        .from('mentorship_sessions')
        .update({ reminder_sent: true })
        .eq('id', session.id);

      if (updateError) throw new Error(`DB update failed: ${updateError.message}`);

      sent++;
    } catch (err) {
      console.error(`Falha ao enviar lembrete para sessão ${session.id}:`, err);
    }
  }

  return new Response(JSON.stringify({ sent }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
});
