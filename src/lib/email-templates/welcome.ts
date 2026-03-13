import type { EmailTemplate } from './types';

interface WelcomeData {
  name: string | null;
  loginUrl: string;
}

export function welcomeTemplate(data: WelcomeData): EmailTemplate {
  const displayName = data.name || 'Aluno';

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
            margin: 0 0 20px 0;
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
          .steps {
            margin: 30px 0;
          }
          .step {
            display: flex;
            margin-bottom: 20px;
            align-items: flex-start;
          }
          .step-number {
            background-color: #c9a96e;
            color: #0a0a0a;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            margin-right: 15px;
            flex-shrink: 0;
            font-size: 14px;
          }
          .step-content {
            flex: 1;
          }
          .step-title {
            font-weight: bold;
            color: #c9a96e;
            margin-bottom: 5px;
            font-size: 16px;
          }
          .step-description {
            color: #cccccc;
            font-size: 14px;
            line-height: 1.5;
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
            margin: 30px 0;
            text-align: center;
          }
          .cta-button:hover {
            background-color: #b8956f;
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
            <h1 class="title">Bem-vindo! 🎉</h1>
            <p class="subtitle">Sua jornada como barbeiro profissional começou</p>
          </div>

          <div class="content">
            <p class="greeting">
              Olá <strong>${displayName}</strong>,
            </p>
            <p class="greeting">
              Parabéns por se juntar à Ygor Luan Pro! Você agora tem acesso a um currículo completo de barbeiraria de alta performance, mentorias 1:1 com Ygor, e uma comunidade de barbeiros profissionais.
            </p>

            <div class="steps">
              <div class="step">
                <div class="step-number">1</div>
                <div class="step-content">
                  <div class="step-title">Criar sua senha</div>
                  <div class="step-description">Clique no botão abaixo para acessar sua conta e criar uma senha segura.</div>
                </div>
              </div>

              <div class="step">
                <div class="step-number">2</div>
                <div class="step-content">
                  <div class="step-title">Explorar as aulas</div>
                  <div class="step-description">Acesse a biblioteca completa de vídeos, documentos e materiais complementares dos módulos.</div>
                </div>
              </div>

              <div class="step">
                <div class="step-number">3</div>
                <div class="step-content">
                  <div class="step-title">Agendar sua mentoria</div>
                  <div class="step-description">Marque sua primeira sessão 1:1 com Ygor para esclarecer dúvidas e traçar seu plano de desenvolvimento.</div>
                </div>
              </div>
            </div>

            <div style="text-align: center;">
              <a href="${data.loginUrl}" class="cta-button">Acessar minha conta</a>
            </div>

            <p style="color: #999999; font-size: 13px; margin-top: 20px;">
              Se o botão acima não funcionar, copie e cole este link no seu navegador:
              <br>
              <code style="background-color: #0a0a0a; padding: 8px 12px; border-radius: 4px; display: inline-block; margin-top: 10px; word-break: break-all;">${data.loginUrl}</code>
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
    subject: 'Bem-vindo à Ygor Luan Pro! 🎉',
    html
  };
}
