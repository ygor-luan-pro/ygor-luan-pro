# Production Runbook

Referencia rapida para operacoes em producao: deploy, rollback, hotfix, secrets, logs.

---

## Deploy

### Deploy normal (via CI)
```bash
git push origin main
# GitHub Actions: type-check -> unit-tests -> quality-gate -> e2e -> Vercel deploy automatico
```

### Deploy manual (emergencia)
```bash
pnpm build
vercel --prod
```

### Verificar deploy
```bash
vercel ls                    # lista deployments
vercel inspect <url>         # detalhes do deployment
```

---

## Rollback

### Via Vercel CLI
```bash
vercel rollback              # reverte para deployment anterior
vercel rollback <deployment-url>  # reverte para deployment especifico
```

### Via GitHub
1. Identificar commit anterior estavel em `git log --oneline`
2. `git revert <commit-sha>` (nao usar reset em main)
3. `git push origin main` — CI faz novo deploy automaticamente

---

## Hotfix

Processo para correcoes criticas sem passar pelo flow normal de PR:

```bash
git checkout main
git pull
# fazer fix minimo
pnpm type-check && pnpm test:unit
git add <arquivos>
git commit -m "fix(<escopo>): <descricao do problema>"
git push origin main
```

Nunca fazer `git push --force` em main.

---

## Secrets e Variaveis de Ambiente

### Ver vars configuradas no Vercel
```bash
vercel env ls
```

### Adicionar/atualizar secret
```bash
vercel env add <NOME>         # interativo, pede o valor
vercel env add <NOME> production  # apenas em producao
```

### Vars obrigatorias em producao

| Variavel | Descricao |
|---|---|
| `PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `PUBLIC_SUPABASE_ANON_KEY` | Chave publica Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave admin Supabase (server-only) |
| `CAKTO_WEBHOOK_SECRET` | HMAC secret para validar webhooks Cakto |
| `CAL_WEBHOOK_SECRET` | HMAC secret para validar webhooks Cal.com |
| `VIMEO_ACCESS_TOKEN` | Token de acesso Vimeo |
| `RESEND_API_KEY` | Chave API Resend (emails) |
| `RESEND_FROM_EMAIL` | Email remetente |
| `PUBLIC_SITE_URL` | URL publica do site (ex: https://ygorluanacademy.com.br) |
| `PUBLIC_CALCOM_LINK` | Link de agendamento Cal.com |
| `PUBLIC_CAKTO_CHECKOUT_URL_VIDEOAULAS` | URL checkout Cakto videoaulas |
| `PUBLIC_CAKTO_CHECKOUT_URL_MENTORIA` | URL checkout Cakto mentoria |
| `PUBLIC_IS_LAUNCH_MODE` | `true` para modo lancamento |

### Rotacao de secrets (a cada 6 meses)
1. Gerar novo secret no painel do servico (Cakto, Cal.com, Supabase)
2. `vercel env add <NOME> production` com novo valor
3. Fazer redeploy: `vercel --prod`
4. Confirmar webhook funcionando nos logs

---

## Logs e Monitoramento

### Ver logs de funcoes Vercel
```bash
vercel logs <url-do-deployment>
vercel logs --follow           # streaming em tempo real
```

### Logs de webhook (mais importante)
```bash
vercel logs --follow | grep "webhook"
```

### Supabase logs
```bash
supabase logs --project-ref <ref>
```

### Verificar se webhook Cakto esta funcionando
- Painel Cakto -> Webhooks -> ver status dos envios recentes
- Vercel logs: procurar por `POST /api/webhook/cakto` e status 200

---

## Banco de Dados

### Aplicar novas migrations
```bash
supabase db push --project-ref <ref>
```

### Ver estado das migrations
```bash
supabase db remote list-migrations --project-ref <ref>
```

### Backup rapido (query direta)
```bash
supabase db dump --project-ref <ref> > backup-$(date +%Y%m%d).sql
```

### Edge Function: lembretes de mentoria
```bash
supabase functions deploy send-mentorship-reminders --project-ref <ref>
supabase functions list --project-ref <ref>
```

---

## Quality Gate Local

Rodar antes de qualquer deploy manual:

```bash
pnpm type-check
pnpm test:unit --coverage
node scripts/quality-gate.js check
pnpm audit --audit-level=critical
```

---

## Incidentes Comuns

### Webhook Cakto retornando 401
- Causa: `CAKTO_WEBHOOK_SECRET` incorreto ou ausente no Vercel
- Fix: `vercel env add CAKTO_WEBHOOK_SECRET production` com valor correto do painel Cakto

### Usuario comprou mas nao recebeu acesso
1. Verificar logs Vercel: `POST /api/webhook/cakto` chegou?
2. Verificar tabela `orders` no Supabase: registro criado?
3. Verificar tabela `profiles`: usuario criado?
4. Se nao chegou: reenviar webhook manualmente no painel Cakto
5. Se chegou com erro: verificar `CAKTO_WEBHOOK_SECRET` e formato do payload

### Email de boas-vindas nao enviado
1. Verificar Resend dashboard: tentativa de envio registrada?
2. Verificar `RESEND_API_KEY` no Vercel
3. Verificar `RESEND_FROM_EMAIL` — deve ser dominio verificado no Resend

### CSP violation em producao
1. Logs chegam em `POST /api/csp-report`
2. Identificar a fonte bloqueada
3. Adicionar ao allowlist em `src/lib/security-headers.ts`
4. Redeploy

---

## Checklist Pre-Deploy (primeira vez em producao)

Ver [BACKLOG.md — Bloqueadores Pre-Producao](BACKLOG.md) para lista completa B1-B8.

Ordem recomendada:
1. `supabase db push` (B1)
4. Configurar todos os secrets no Vercel (B2, B3)
5. Configurar webhook Cal.com (B4)
6. Deploy edge function (B5)
7. Criar OG image (B7)
8. Configurar dominio na Vercel (B8)
9. Testar fluxo completo em sandbox (B6)
10. Monitorar CSP violations por 14 dias antes de enforcar
