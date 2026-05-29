# Deploy e CI/CD

## GitHub Actions - CI

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, staging]
  pull_request:
    branches: [main, staging]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run linter
        run: pnpm run lint

      - name: Run type check
        run: pnpm run type-check

      - name: Run unit tests
        run: pnpm run test:unit

      - name: Run integration tests
        run: pnpm run test:integration
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
```

## Deploy Automatico

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

## Variaveis de Ambiente

```bash
# .env.example
PUBLIC_SUPABASE_URL=https://xxx.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...  # NUNCA expor no frontend

PUBLIC_CAKTO_CHECKOUT_URL_MENTORIA=https://pay.cakto.com.br/xxx
PUBLIC_CAKTO_CHECKOUT_URL_VIDEOAULAS=https://pay.cakto.com.br/xxx
CAKTO_WEBHOOK_SECRET=xxx

VIMEO_ACCESS_TOKEN=xxx
RESEND_API_KEY=re_xxx

SITE_URL=https://ygorluanacademy.com.br
```

## Metricas e Monitoramento

### Performance (Core Web Vitals)
- **LCP**: < 0.5s
- **FID**: < 10ms
- **CLS**: 0

### Business
- Taxa de conversao landing -> checkout: > 5%
- Taxa de conclusao checkout: > 80%
- Engajamento (aulas assistidas): > 60%
- NPS: > 50

### Ferramentas
- **Analytics**: Google Analytics 4
- **Performance**: Vercel Analytics
- **Errors**: Sentry
- **Uptime**: Better Uptime

---

# Guia: Criar Ambiente de Staging

## O que muda

| Hoje | Depois |
|------|--------|
| `main` -> produção direto | `main` -> produção / `staging` -> staging |
| Sem ambiente de teste | `staging.ygorluanacademy.com.br` isolado |
| Banco de prod exposto a testes | Banco de staging separado |
| Webhook do Cakto só aponta pra prod | Webhook de staging aponta pro staging |

## Passo a passo

### 1. Branch `staging`

```bash
# No seu repo local
git checkout -b staging
git push -u origin staging
```

### 2. Proteger branches no GitHub

Ir em **Settings > Branches > Add branch protection rule**:

**Para `main`:**
- Require a pull request before merging
- Require status checks to pass: `type-check`, `unit-tests`, `quality-gate`
- Require 1 approval

**Para `staging`:**
- Require a pull request before merging
- Require status checks to pass: `type-check`, `unit-tests`

### 3. Criar projeto Vercel de staging

1. Ir em [vercel.com](https://vercel.com) > Add New Project
2. Importar o mesmo repo
3. Nome sugerido: `ygor-luan-academy-staging`
4. Adicionar domínio: `staging.ygorluanacademy.com.br`
5. Ir em **Settings > Environment Variables** e adicionar todas (ver tabela abaixo)

### 4. Criar projeto Supabase de staging

1. Ir em [supabase.com](https://supabase.com) > New Project
2. Nome: `ygor-luan-academy-staging`
3. Rodar todas as migrations do diretório `supabase/migrations/` na ordem numérica
4. Copiar **Project URL** e **anon/public key**

### 5. Webhook do Cakto para staging

1. No painel do Cakto, criar um segundo webhook apontando para:
   `https://staging.ygorluanacademy.com.br/api/webhooks/cakto`
2. Gerar um `CAKTO_WEBHOOK_SECRET` diferente do de produção

### 6. Secrets no GitHub

Ir em **Settings > Secrets and variables > Actions > New repository secret**:

| Secret | Valor |
|--------|-------|
| `VERCEL_TOKEN` | Mesmo token do deploy de prod |
| `VERCEL_ORG_ID` | Mesmo org ID |
| `VERCEL_PROJECT_ID_STAGING` | ID do projeto Vercel de staging (pegar no dashboard) |
| `PUBLIC_SUPABASE_URL_STAGING` | URL do Supabase staging |
| `PUBLIC_SUPABASE_ANON_KEY_STAGING` | Anon key do Supabase staging |
| `SUPABASE_SERVICE_ROLE_KEY_STAGING` | Service role key do Supabase staging |
| `CAKTO_WEBHOOK_SECRET_STAGING` | Segredo do webhook de staging |
| `RESEND_API_KEY` | Pode ser o mesmo de prod |
| `PUBLIC_CAKTO_CHECKOUT_URL_MENTORIA` | Mesmo de prod (ou URL de teste) |
| `PUBLIC_CAKTO_CHECKOUT_URL_VIDEOAULAS` | Mesmo de prod (ou URL de teste) |
| `PUBLIC_SITE_URL` | `https://staging.ygorluanacademy.com.br` |

### 7. Atualizar workflow de deploy de staging

O arquivo `.github/workflows/deploy-staging.yml` já está criado no repo. Ele dispara em push na branch `staging`.

**Importante:** o workflow de staging usa `vercel deploy` sem `--prod` (preview deployment). Isso faz com que o Vercel use as variáveis de ambiente de preview.

### 8. Testar

```bash
# Criar uma feature branch
git checkout -b feature/teste-staging
# fazer uma alteração trivial (ex: adicionar um comentário no README)
git add . && git commit -m "test: staging deploy"
git push -u origin feature/teste-staging
```

Abrir PR para `staging`. Mergear. Verificar em **Actions** se o deploy rodou e acessar `staging.ygorluanacademy.com.br`.

### 9. Fluxo de trabalho diário

```
feature/x  ->  PR para staging  ->  merge  ->  deploy automático em staging  ->  validar
                                                                    |
                                                                    v
                                                               PR para main
                                                                    |
                                                                    v
                                                             merge -> deploy prod
```

**Regras:**
- Nunca commitar direto em `main` ou `staging`
- Sempre abrir PR
- `staging` é para validação. Depois de validado, abrir PR de `staging` -> `main` (ou cherry-pick das features aprovadas)

### 10. Verificar variáveis de staging

```bash
node scripts/check-staging-env.js
```

Rode localmente depois de exportar as variáveis de staging para validar que nada falta.

## Troubleshooting

**Deploy staging falhou com "Project not found"**
- Verificar se `VERCEL_PROJECT_ID_STAGING` está correto no GitHub Secrets

**Banco vazio em staging**
- Rodar migrations na ordem: `supabase/migrations/001_*.sql` até a última

**Webhook do Cakto não chega em staging**
- Verificar se URL do webhook está `https://` (não http)
- Verificar se `CAKTO_WEBHOOK_SECRET_STAGING` bate com o configurado no painel do Cakto

**Emails de staging indo para alunos reais**
- Adicionar prefixo `[STAGING]` no assunto dos emails no código quando `PUBLIC_SITE_URL` contém "staging"
