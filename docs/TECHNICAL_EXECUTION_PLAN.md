# Plano de Execucao Tecnica

Ultima atualizacao: 2026-05-26

Objetivo: fechar a parte tecnica do projeto com foco em lancamento confiavel, nao em arquitetura perfeita.

Runbook pratico: ver `docs/TECHNICAL_LAUNCH_RUNBOOK.md`.

## Definicao de Pronto

Considerar a parte tecnica pronta para lancar quando estes pontos forem verdadeiros:

1. `pnpm pr-check` passa localmente.
2. Migrations remotas do Supabase aplicadas sem erro.
3. Vercel com todas as env vars corretas.
4. Webhooks externos configurados e autenticando.
5. Compra sandbox ponta a ponta funcionando.
6. `Sentry`, `/api/health` e logs de webhook confirmados em producao.
7. Race condition do webhook Cakto resolvida.

## Regras de Priorizacao

- Primeiro: tudo que bloqueia venda, acesso ou pagamento.
- Depois: tudo que reduz risco de incidente ou cegueira operacional.
- Por ultimo: qualidade estrutural e refactors nao bloqueadores.

## Fase 1 — Operacao de Lancamento

Objetivo: subir o ambiente real corretamente e validar integracoes.

### T1. Aplicar migrations remotas no Supabase
- Tipo: Operacao
- Impacto: Critico
- Esforco: Baixo
- Dependencias: acesso ao projeto Supabase remoto
- Passos:
  1. Rodar `supabase db push` ou fluxo equivalente do projeto.
  2. Confirmar que migrations `001` a `017` estao aplicadas.
  3. Validar tabelas, RLS, functions e RPCs principais.
- Definicao de pronto:
  - sem erro de migration
  - schema remoto compativel com o codigo atual

### T2. Configurar env vars de producao na Vercel
- Tipo: Operacao
- Impacto: Critico
- Esforco: Baixo
- Dependencias: T1 recomendada
- Escopo:
  - `PUBLIC_SUPABASE_URL`
  - `PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `CAKTO_WEBHOOK_SECRET`
  - `CAL_WEBHOOK_SECRET`
  - `RESEND_API_KEY`
  - `UPSTASH_REDIS_*`
  - `PUBLIC_SITE_URL`
  - `PUBLIC_SENTRY_DSN`, `SENTRY_DSN`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` se Sentry ficar ativo
- Definicao de pronto:
  - deploy sobe sem env faltando
  - auth, webhook e email conseguem inicializar

### T3. Configurar integracoes externas
- Tipo: Operacao
- Impacto: Critico
- Esforco: Baixo
- Dependencias: T2
- Escopo:
  - webhook Cakto -> `/api/webhook/cakto`
  - webhook Cal.com -> `/api/webhook/cal-booking`
  - deploy da Edge Function `send-mentorship-reminders`
  - ativacao do cron de lembretes
- Definicao de pronto:
  - requests externas chegam com autenticacao valida
  - edge function implantada e acionavel

### T4. Configurar dominio e ativos publicos
- Tipo: Operacao
- Impacto: Medio
- Esforco: Baixo
- Dependencias: T2
- Escopo:
  - dominio `ygorluanacademy.com.br`
  - imagem OG final em `/public/images/og-cover.jpg`
- Definicao de pronto:
  - dominio responde em HTTPS
  - preview social funciona

## Fase 2 — Codigo Critico Antes de Abrir Venda

Objetivo: remover riscos tecnicos com impacto em dinheiro, acesso ou seguranca.

### T5. Resolver race condition do webhook Cakto
- Tipo: Codigo
- Impacto: Critico
- Esforco: Medio
- Dependencias: T1
- Evidencia atual:
  - `src/pages/api/webhook/cakto.ts` ainda cria usuario/perfil/pedido em passos separados
  - `orders.upsert(... onConflict: payment_id)` reduz duplicidade, mas nao torna o fluxo todo atomico
- Caminho recomendado:
  1. mover o trecho critico para RPC/transacao no Postgres
  2. garantir idempotencia por `payment_id`
  3. manter envio de email apenas quando a compra for efetivamente nova
- Definicao de pronto:
  - requests duplicadas/concorrrentes para o mesmo `payment_id` nao geram estado inconsistente
  - teste cobrindo comportamento idempotente

### T6. Adicionar validacao por magic bytes no upload de materiais
- Tipo: Codigo
- Impacto: Alto
- Esforco: Baixo a Medio
- Dependencias: nenhuma
- Evidencia atual:
  - `src/pages/api/admin/materials/upload.ts` valida extensao e MIME declarado, nao conteudo real
- Caminho recomendado:
  1. validar assinatura minima para PDF, PNG, JPG, ZIP
  2. rejeitar arquivo com extensao permitida e conteudo divergente
- Definicao de pronto:
  - upload falha para arquivo adulterado
  - testes unitarios cobrindo tipos aceitos e rejeitados

### T7. Confirmar rate limit e observabilidade em producao
- Tipo: Operacao
- Impacto: Alto
- Esforco: Baixo
- Dependencias: T2
- Escopo:
  - confirmar Upstash Redis ativo
  - confirmar `/api/health` respondendo em producao
  - confirmar Sentry capturando um erro de teste
  - confirmar logs de webhook visiveis na Vercel
- Definicao de pronto:
  - pelo menos um teste real de cada item executado e registrado

## Fase 3 — Validacao Ponta a Ponta

Objetivo: garantir que o produto vende, entrega acesso e sustenta o aluno real.

### T8. Rodar smoke test manual de producao
- Tipo: Operacao
- Impacto: Critico
- Esforco: Baixo
- Dependencias: T1-T4
- Escopo minimo:
  - landing desktop e mobile
  - CTA ate checkout
  - login invalido
  - login de aluno
  - login de admin
  - aula real
  - logout
  - recuperar senha
  - paginas legais
  - sitemap
  - preview social
- Definicao de pronto:
  - sem erro bloqueador nos fluxos principais

### T9. Rodar compra sandbox ponta a ponta
- Tipo: Operacao
- Impacto: Critico
- Esforco: Medio
- Dependencias: T1-T4, T7
- Fluxo esperado:
  1. compra na Cakto
  2. webhook `purchase_approved`
  3. usuario criado no Auth
  4. profile criado/atualizado
  5. order criada
  6. email de boas-vindas enviado
  7. link de acesso/reset funcional
  8. dashboard acessivel
- Definicao de pronto:
  - fluxo completo concluido sem intervencao manual

### T10. Validar jornada do aluno apos compra
- Tipo: Operacao
- Impacto: Alto
- Esforco: Medio
- Dependencias: T9
- Escopo:
  - videos Vimeo abrem
  - progresso salva
  - quiz funciona
  - comentarios funcionam
  - materiais baixam
  - certificado libera e valida publicamente
  - Cal.com registra agendamento
  - lembrete de mentoria dispara
- Definicao de pronto:
  - jornada completa validada com dados reais ou sandbox realista

## Fase 4 — Confianca e Cobertura Minima

Objetivo: deixar os riscos criticos menos dependentes de teste manual.

### T11. Adicionar teste de contrato para webhooks externos
- Tipo: Codigo
- Impacto: Alto
- Esforco: Medio
- Dependencias: T5 opcional, T9 recomendada
- Escopo:
  - Cakto
  - Cal.com
- Definicao de pronto:
  - payload quebrado ou schema inesperado falha em teste automatizado

### T12. Adicionar E2E minimo do fluxo compra -> acesso -> certificado
- Tipo: Codigo
- Impacto: Alto
- Esforco: Medio
- Dependencias: T9-T10
- Definicao de pronto:
  - pelo menos um fluxo critico automatizado roda em CI/local

## Fase 5 — Pos-Lancamento Nao Bloqueador

Objetivo: melhorar robustez sem atrasar abertura de venda.

### T13. Paginacao nos endpoints admin
- Tipo: Codigo
- Impacto: Medio
- Esforco: Medio
- Dependencias: nenhuma

### T14. Melhorar geracao automatica de tipos Supabase no CI
- Tipo: Codigo
- Impacto: Medio
- Esforco: Baixo
- Dependencias: nenhuma

### T15. Reduzir casts `as unknown as` restantes
- Tipo: Codigo
- Impacto: Medio
- Esforco: Medio
- Dependencias: T14 ajuda

### T16. Documentar backup/restore com RTO/RPO
- Tipo: Docs/Operacao
- Impacto: Medio
- Esforco: Baixo
- Dependencias: acesso ao plano operacional de infra

## O Que Nao Fazer Agora

Nao priorizar antes do lancamento:

- live classes
- app mobile
- refactor grande de services
- injeccao de dependencia em toda a base
- repository pattern amplo
- decomposicao arquitetural por estetica

## Ordem de Ataque Recomendada

1. T1 Aplicar migrations remotas
2. T2 Configurar env vars na Vercel
3. T3 Configurar webhooks, Edge Function e cron
4. T4 Configurar dominio e OG image
5. T5 Resolver race condition do webhook Cakto
6. T6 Validar magic bytes no upload
7. T7 Confirmar rate limit, health, Sentry e logs
8. T8 Rodar smoke test manual
9. T9 Rodar compra sandbox ponta a ponta
10. T10 Validar jornada completa do aluno
11. T11 Testes de contrato de webhook
12. T12 E2E minimo dos fluxos criticos

## Critico vs Nao Bloqueador

### Critico para abrir venda
- T1
- T2
- T3
- T5
- T7
- T8
- T9
- T10

### Importante, mas pode entrar logo apos liberar venda
- T4
- T6
- T11
- T12
- T13
- T14
- T15
- T16
