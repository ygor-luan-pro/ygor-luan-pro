interface MentorshipReminderData {
  studentName: string | null;
  scheduledAt: Date;
  meetingUrl: string;
}

interface EmailTemplate {
  subject: string;
  html: string;
}

function formatDatePtBR(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'America/Sao_Paulo'
  };
  return date.toLocaleDateString('pt-BR', options);
}

function formatTimePtBR(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo'
  };
  return date.toLocaleTimeString('pt-BR', options);
}

export function mentorshipReminderTemplate(data: MentorshipReminderData): EmailTemplate {
  const displayName = data.studentName || 'Aluno';
  const formattedDate = formatDatePtBR(data.scheduledAt);
  const formattedTime = formatTimePtBR(data.scheduledAt);

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #0a0a0a;
            color: #ffffff;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #0a0a0a;
            padding: 40px 20px;
          }
          .header {
            text-align: center;
            margin-bottom: 40px;
          }
          .logo {
            font-size: 28px;
            font-weight: bold;
            color: #c9a96e;
            margin-bottom: 20px;
          }
          .icon {
            font-size: 48px;
            margin-bottom: 15px;
          }
          .title {
            font-size: 32px;
            font-weight: bold;
            color: #ffffff;
            margin: 0 0 10px 0;
          }
          .subtitle {
            font-size: 16px;
            color: #c9a96e;
            margin: 0;
          }
          .content {
            background-color: #1a1a1a;
            border-left: 4px solid #c9a96e;
            padding: 30px;
            border-radius: 8px;
            margin-bottom: 30px;
          }
          .greeting {
            font-size: 18px;
            color: #ffffff;
            margin-bottom: 20px;
            line-height: 1.6;
          }
          .session-details {
            background-color: #0a0a0a;
            border: 1px solid #333333;
            border-radius: 8px;
            padding: 25px;
            margin: 30px 0;
          }
          .detail-row {
            display: flex;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 1px solid #333333;
          }
          .detail-row:last-child {
            margin-bottom: 0;
            padding-bottom: 0;
            border-bottom: none;
          }
          .detail-icon {
            font-size: 24px;
            margin-right: 15px;
            width: 30px;
            text-align: center;
          }
          .detail-content {
            flex: 1;
          }
          .detail-label {
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #c9a96e;
            margin-bottom: 5px;
            font-weight: bold;
          }
          .detail-value {
            font-size: 16px;
            color: #ffffff;
            font-weight: bold;
          }
          .message {
            color: #cccccc;
            font-size: 14px;
            line-height: 1.6;
            margin-bottom: 20px;
          }
          .cta-button {
            display: inline-block;
            background-color: #c9a96e;
            color: #0a0a0a;
            padding: 14px 32px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: bold;
            font-size: 16px;
            margin: 20px 0;
            text-align: center;
            width: 100%;
            box-sizing: border-box;
          }
          .cta-button:hover {
            background-color: #b8956f;
          }
          .tips {
            background-color: #0a0a0a;
            padding: 20px;
            border-radius: 6px;
            margin: 20px 0;
            font-size: 13px;
            color: #999999;
            line-height: 1.6;
          }
          .footer {
            text-align: center;
            padding-top: 30px;
            border-top: 1px solid #333333;
            color: #888888;
            font-size: 12px;
          }
          .footer a {
            color: #c9a96e;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">Ygor Luan Pro</div>
            <div class="icon">📅</div>
            <h1 class="title">Lembrete importante!</h1>
            <p class="subtitle">Sua mentoria é amanhã</p>
          </div>

          <div class="content">
            <p class="greeting">
              Oi <strong>${displayName}</strong>,
            </p>

            <p class="greeting">
              Este é um lembrete amigável: você tem uma sessão de mentoria 1:1 com Ygor agendada para amanhã! Não percam essa oportunidade de aprofundar suas técnicas e tirar dúvidas diretamente com o especialista.
            </p>

            <div class="session-details">
              <div class="detail-row">
                <div class="detail-icon">📅</div>
                <div class="detail-content">
                  <div class="detail-label">Data</div>
                  <div class="detail-value">${formattedDate}</div>
                </div>
              </div>

              <div class="detail-row">
                <div class="detail-icon">🕐</div>
                <div class="detail-content">
                  <div class="detail-label">Horário</div>
                  <div class="detail-value">${formattedTime}</div>
                </div>
              </div>

              <div class="detail-row">
                <div class="detail-icon">🎥</div>
                <div class="detail-content">
                  <div class="detail-label">Tipo de sessão</div>
                  <div class="detail-value">Mentoria ao vivo</div>
                </div>
              </div>
            </div>

            <p class="message">
              Clique no botão abaixo para acessar sua sessão e estar pronto quando a hora chegar.
            </p>

            <a href="${data.meetingUrl}" class="cta-button">Acessar reunião →</a>

            <div class="tips">
              <strong>💡 Dicas para uma ótima sessão:</strong>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Acesse alguns minutos antes do horário</li>
                <li>Verifique sua conexão de internet e câmera</li>
                <li>Prepare suas dúvidas e tópicos para discutir</li>
              </ul>
            </div>

            <p style="color: #999999; font-size: 13px; margin-top: 20px;">
              Se o botão acima não funcionar, copie e cole este link no seu navegador:
              <br>
              <code style="background-color: #0a0a0a; padding: 8px 12px; border-radius: 4px; display: inline-block; margin-top: 10px; word-break: break-all;">${data.meetingUrl}</code>
            </p>
          </div>

          <div class="footer">
            <p>© 2026 Ygor Luan Pro. Todos os direitos reservados.</p>
            <p>
              <a href="https://ygorluanpro.com.br/privacidade">Política de Privacidade</a> |
              <a href="https://ygorluanpro.com.br/termos">Termos de Serviço</a>
            </p>
          </div>
        </div>
      </body>
    </html>
  `.trim();

  return {
    subject: 'Lembrete: sua mentoria é amanhã!',
    html
  };
}
