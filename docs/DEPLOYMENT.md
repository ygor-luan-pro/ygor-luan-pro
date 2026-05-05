# Deploy e CI/CD

## GitHub Actions - CI

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

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
