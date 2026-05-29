#!/usr/bin/env node
const REQUIRED_SECRETS = [
  'VERCEL_TOKEN',
  'VERCEL_ORG_ID',
  'VERCEL_PROJECT_ID_STAGING',
  'PUBLIC_SUPABASE_URL_STAGING',
  'PUBLIC_SUPABASE_ANON_KEY_STAGING',
  'SUPABASE_SERVICE_ROLE_KEY_STAGING',
  'CAKTO_WEBHOOK_SECRET_STAGING',
  'RESEND_API_KEY',
];

const OPTIONAL_SECRETS = [
  'PUBLIC_CAKTO_CHECKOUT_URL_MENTORIA',
  'PUBLIC_CAKTO_CHECKOUT_URL_VIDEOAULAS',
  'VIMEO_ACCESS_TOKEN',
];

function checkEnv() {
  const missing = [];

  for (const secret of REQUIRED_SECRETS) {
    if (!process.env[secret]) {
      missing.push(secret);
    }
  }

  if (missing.length > 0) {
    console.error('❌ Variáveis de ambiente de staging faltando:');
    for (const secret of missing) {
      console.error(`   - ${secret}`);
    }
    console.error('\nAdicione-as no GitHub: Settings > Secrets and variables > Actions');
    process.exit(1);
  }

  console.log('✅ Todas as variáveis obrigatórias de staging estão configuradas.');

  const missingOptional = OPTIONAL_SECRETS.filter((s) => !process.env[s]);
  if (missingOptional.length > 0) {
    console.warn('⚠️ Variáveis opcionais não configuradas:');
    for (const secret of missingOptional) {
      console.warn(`   - ${secret}`);
    }
  }
}

checkEnv();
