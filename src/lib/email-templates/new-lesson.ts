interface NewLessonData {
  lessonTitle: string;
  moduleName: string;
  lessonUrl: string;
}

interface EmailTemplate {
  subject: string;
  html: string;
}

export function newLessonTemplate(data: NewLessonData): EmailTemplate {
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
          .lesson-card {
            background-color: #0a0a0a;
            border: 1px solid #333333;
            border-radius: 8px;
            padding: 25px;
            margin: 30px 0;
          }
          .lesson-module {
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #c9a96e;
            margin-bottom: 10px;
            font-weight: bold;
          }
          .lesson-title {
            font-size: 24px;
            font-weight: bold;
            color: #ffffff;
            margin: 0 0 20px 0;
            line-height: 1.4;
          }
          .lesson-description {
            color: #cccccc;
            font-size: 14px;
            line-height: 1.6;
            margin-bottom: 25px;
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
            text-align: center;
            width: 100%;
            box-sizing: border-box;
          }
          .cta-button:hover {
            background-color: #b8956f;
          }
          .message {
            font-size: 14px;
            color: #cccccc;
            line-height: 1.6;
            margin-bottom: 20px;
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
            <h1 class="title">Nova aula! 📚</h1>
            <p class="subtitle">Conteúdo exclusivo te aguardando</p>
          </div>

          <div class="content">
            <p class="message">
              Oi! Uma nova aula foi disponibilizada no seu curso. Confira agora mesmo:
            </p>

            <div class="lesson-card">
              <div class="lesson-module">${data.moduleName}</div>
              <h2 class="lesson-title">${data.lessonTitle}</h2>
              <p class="lesson-description">
                Assista este conteúdo para aprofundar seus conhecimentos e dominar novas técnicas de barbeiraria profissional.
              </p>
              <a href="${data.lessonUrl}" class="cta-button">Assistir agora →</a>
            </div>

            <p style="color: #999999; font-size: 13px; margin-top: 30px;">
              Se o botão acima não funcionar, copie e cole este link no seu navegador:
              <br>
              <code style="background-color: #0a0a0a; padding: 8px 12px; border-radius: 4px; display: inline-block; margin-top: 10px; word-break: break-all;">${data.lessonUrl}</code>
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
    subject: `Nova aula disponível: ${data.lessonTitle}`,
    html
  };
}
