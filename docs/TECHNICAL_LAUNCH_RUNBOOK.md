# Runbook Tecnico de Lancamento

Ultima atualizacao: 2026-05-26

Objetivo: executar `T1` a `T10` sem ficar pensando no que fazer a seguir.

Use junto com:
- `docs/TECHNICAL_LAUNCH_CHECKLIST.md`
- `docs/TECHNICAL_EXECUTION_PLAN.md`

## Bloco 1 — Banco e Supabase

### R1. Confirmar login e projeto
1. Verificar CLI: `supabase --version`
2. Confirmar projeto linkado: `supabase status` ou o fluxo usado no projeto
3. Confirmar acesso ao projeto remoto correto antes de aplicar migration

Pronto quando:
- voce tem certeza que esta no projeto Supabase certo

### R2. Aplicar migrations remotas
1. Rodar o comando de deploy de schema usado pelo projeto
2. Conferir no dashboard do Supabase:
   - `profiles`
   - `orders`
   - `lessons`
   - `materials`
   - `certificates`
   - functions RPC
3. Confirmar especialmente a migration nova do webhook Cakto

Pronto quando:
- schema remoto bate com o repo
- sem erro de migration

### R3. Validar RPCs e tabelas criticas
Conferir no Supabase Dashboard:
- `get_total_revenue`
- `get_completion_date`
- `get_student_stats`
- `provision_cakto_purchase`

Pronto quando:
- todas aparecem no banco remoto

## Bloco 2 — Vercel

### R4. Configurar env vars
No projeto da Vercel, revisar:

- `PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CAKTO_WEBHOOK_SECRET`
- `CAL_WEBHOOK_SECRET`
- `PUBLIC_CAKTO_CHECKOUT_URL_VIDEOAULAS`
- `PUBLIC_CAKTO_CHECKOUT_URL_MENTORIA`
- `RESEND_API_KEY`
- `PUBLIC_SITE_URL`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `PUBLIC_SENTRY_DSN`
- `SENTRY_DSN`
- `SENTRY_PROJECT`
- `SENTRY_AUTH_TOKEN`

Pronto quando:
- nenhum valor critico falta
- novo deploy sobe sem erro de init

### R5. Fazer deploy e validar health
1. Subir deploy atual
2. Abrir `/api/health`
3. Confirmar status `healthy`

Pronto quando:
- health responde 200

## Bloco 3 — Integracoes externas

### R6. Configurar Cakto
No painel da Cakto:
1. Revisar checkout URL usada no produto certo
2. Revisar secret do webhook
3. Apontar webhook para:
   - `https://SEU_DOMINIO/api/webhook/cakto`
4. Confirmar se `product.id`, `offer.id` e `refId` batem com allowlists, se estiver usando

Pronto quando:
- webhook entrega com 200 em teste real

### R7. Configurar Cal.com
No painel do Cal.com:
1. Configurar webhook para:
   - `https://SEU_DOMINIO/api/webhook/cal-booking`
2. Revisar secret
3. Enviar evento de teste

Pronto quando:
- endpoint responde corretamente

### R8. Deployar Edge Function e cron
1. Deployar `send-mentorship-reminders`
2. Ativar agendamento do cron no Supabase
3. Rodar teste manual de execucao, se possivel

Pronto quando:
- function implantada
- cron ativo

## Bloco 4 — Dominio e ativos publicos

### R9. Dominio final
1. Configurar `ygorluanacademy.com.br` na Vercel
2. Confirmar SSL ativo
3. Validar `PUBLIC_SITE_URL`

Pronto quando:
- dominio abre em HTTPS sem redirecionamento quebrado

### R10. Imagem OG
1. Criar `public/images/og-cover.jpg`
2. Fazer novo deploy
3. Testar preview social

Pronto quando:
- compartilhamento mostra imagem correta

## Bloco 5 — Smoke test rapido

### R11. Navegacao publica
Testar:
- landing desktop
- landing mobile
- CTA principal
- termos
- privacidade
- sitemap

Pronto quando:
- tudo abre sem erro visual ou 404

### R12. Auth
Testar:
- login invalido
- login valido aluno
- login valido admin
- logout
- recuperar senha

Pronto quando:
- todos os fluxos retornam resposta esperada

## Bloco 6 — Fluxo de compra

### R13. Compra sandbox Cakto
Rodar uma compra teste completa.

Conferir em ordem:
1. webhook `purchase_approved`
2. usuario criado em Auth
3. profile criado/atualizado
4. order criada em `orders`
5. email de boas-vindas enviado
6. link de acesso funcionando
7. dashboard acessivel

Pronto quando:
- fluxo fecha sem acao manual

### R14. Jornada do aluno
Depois da compra:
1. abrir aula real
2. validar Vimeo
3. salvar progresso
4. validar quiz
5. validar comentarios
6. baixar material
7. completar aulas e validar certificado
8. testar verificacao publica do certificado
9. testar agendamento Cal.com
10. validar lembrete de mentoria

Pronto quando:
- o aluno consegue ir de compra ate consumo sem bloqueio tecnico

## Bloco 7 — Observabilidade e seguranca real

### R15. Confirmar rate limit
1. Garantir Upstash ativo em producao
2. Validar pelo menos um endpoint protegido por rate limit

Pronto quando:
- rate limit responde como esperado

### R16. Confirmar logs e Sentry
1. Gerar um erro controlado ou observar erro real nao sensivel
2. Verificar captura no Sentry
3. Verificar logs de webhook na Vercel

Pronto quando:
- voce consegue investigar erro sem depender de adivinhacao

## Ordem de Execucao Curta

1. R1-R3 Supabase
2. R4-R5 Vercel
3. R6-R8 integracoes externas
4. R9-R10 dominio e OG
5. R11-R12 smoke test basico
6. R13 compra sandbox
7. R14 jornada do aluno
8. R15-R16 observabilidade final
