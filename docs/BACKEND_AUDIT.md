# Análise Completa do Backend — Ygor Luan Academy

**Projeto:** Ygor Luan Academy  
**Stack:** Astro 5 (SSR) + React 19 + Supabase + Cakto + Vercel  
**Data:** 2026-05-19  
**Auditor:** OpenCode Agent  

---

## 1. SEGURANÇA

### 🔴 Crítica — Race Condition em Webhook Cakto
- **Descrição:** O webhook `cakto.ts` verifica `existingOrder` antes de criar usuário/order, mas o upsert final também usa `ignoreDuplicates`. Entre a checagem e o upsert, outro request pode processar o mesmo `payment_id`.
- **Impacto:** Pedido duplicado ou usuário duplicado em condições de race.
- **Evidência:** `src/pages/api/webhook/cakto.ts:162-170` (select) e `:206-219` (upsert com `ignoreDuplicates`).
- **Ação:** Usar transação atômica (RPC Postgres) ou idempotency key com bloqueio distribuído (Redis).

### 🔴 Crítica — `checkOrigin: false` no Astro
- **Descrição:** `astro.config.mjs` desabilita verificação de origem embutida do Astro. O projeto implementa `isSameOrigin` manual, mas se alguma rota nova esquecer de verificar, fica vulnerável a CSRF.
- **Impacto:** Risco de CSRF em rotas que não implementam `isSameOrigin` explicitamente.
- **Evidência:** `astro.config.mjs:14`.
- **Ação:** Habilitar `checkOrigin: true` e remover `isSameOrigin` manual, ou manter manual mas auditar 100% das rotas.

### 🟠 Alta — Upload de Materiais sem Validação de Magic Bytes
- **Descrição:** O upload verifica extensão e content-type declarado, mas não valida o conteúdo real do arquivo (magic bytes).
- **Impacto:** Upload de arquivo malicioso com extensão trocada (ex: `.pdf` contendo payload).
- **Evidência:** `src/pages/api/admin/materials/upload.ts:47-56`.
- **Ação:** Adicionar validação de magic bytes para PDF, ZIP, imagens. Usar biblioteca como `file-type`.

### 🟠 Alta — `getClientIp` Confia em `X-Forwarded-For` sem Proxy Verificado
- **Descrição:** A função `getClientIp` usa `x-forwarded-for` diretamente. Se o app rodar fora da Vercel sem proxy confiável, o header pode ser spoofado.
- **Impacto:** Bypass de rate limit por IP falsificado.
- **Evidência:** `src/lib/rate-limit.ts:36-46`.
- **Ação:** Documentar que requer proxy confiável (Vercel ok). Em self-host, validar lista de IPs confiáveis.

### 🟠 Alta — Divergência de CSP entre Vercel e Aplicação
- **Descrição:** `vercel.json` aplica CSP enforcement (`Content-Security-Policy`), enquanto `security-headers.ts` aplica `Content-Security-Policy-Report-Only`. Em produção na Vercel, o header do `vercel.json` provavelmente vence.
- **Impacto:** CSP report-only nunca é efetivo; violações podem passar despercebidas ou o enforcement pode quebrar funcionalidades não testadas.
- **Evidência:** `vercel.json:12-14` vs `src/lib/security-headers.ts:22`.
- **Ação:** Unificar CSP em um só lugar. Remover do `vercel.json` e confiar no middleware, ou vice-versa.

### 🟡 Média — CSP Report Endpoint sem Rate Limit / Validação
- **Descrição:** `/api/csp-report` aceita qualquer JSON e loga sem validação de origem ou rate limit.
- **Impacto:** Possível log flooding / DoS de logs.
- **Evidência:** `src/pages/api/csp-report.ts:4-11`.
- **Ação:** Adicionar rate limit e validar estrutura mínima do report.

### 🟡 Média — Reset Password Retorna Sucesso em Erro
- **Descrição:** `/api/auth/reset-password` retorna `ok: true` mesmo se `AuthService.resetPassword` falhar.
- **Impacto:** Usuário não sabe se o email foi enviado; dificulta debug.
- **Evidência:** `src/pages/api/auth/reset-password.ts:36-44`.
- **Ação:** Considerar logging estruturado (já existe `logger`) e retornar erro genérico apenas após log interno.

### 🟡 Média — `CommentsService.getByLesson` sem Rate Limit
- **Descrição:** GET de comentários pode ser chamado repetidamente sem rate limit.
- **Impacto:** DoS leve em lessons populares.
- **Evidência:** `src/pages/api/lessons/[id]/comments.ts:4-33`.
- **Ação:** Adicionar rate limit por IP para endpoints de leitura pesada.

### 🟢 Baixa — Webhook Cal.com sem Verificação de `Content-Type`
- **Descrição:** Não valida se o request é `application/json` antes de parsing.
- **Impacto:** Baixo; o parsing falha silenciosamente.
- **Evidência:** `src/pages/api/webhook/cal-booking.ts:25-55`.
- **Ação:** Adicionar early return se `Content-Type` não for JSON.

---

## 2. PERFORMANCE

### 🔴 Crítica — `notifyNewLesson` Dispara Emails sem Throttling
- **Descrição:** `EmailService.notifyNewLesson` usa `Promise.allSettled` com map de todos os alunos ativos. Se houver 1000+ alunos, dispara 1000+ requests simultâneos para Resend.
- **Impacto:** Rate limit da Resend, memory spike, timeout do request HTTP.
- **Evidência:** `src/services/email.service.ts:41-60`.
- **Ação:** Implementar batching (ex: 10 emails por vez) ou usar fila (Supabase Queue, Upstash QStash, etc.).

### 🟠 Alta — `getActiveStudents` com N+1 Implícito
- **Descrição:** Busca todos os `orders` aprovados, extrai `user_ids`, depois faz query `IN` em `profiles`. Poderia ser um único JOIN ou RPC.
- **Impacto:** Duas queries para operação que poderia ser uma só.
- **Evidência:** `src/services/email.service.ts:12-30`.
- **Ação:** Criar view ou RPC `get_active_students` no Postgres.

### 🟠 Alta — `CertificateService.getCompletionDate` Carrega Tudo em Memória
- **Descrição:** Carrega todas as aulas publicadas e TODO o progresso do usuário para calcular a data de conclusão.
- **Impacto:** O(n) em memória onde n = total de aulas + progressos.
- **Evidência:** `src/services/certificate.service.ts:26-40`.
- **Ação:** Mover lógica para RPC Postgres (`get_completion_date(p_user_id)`).

### 🟠 Alta — `OrdersService.getTotalRevenue` sem Agregação SQL
- **Descrição:** Busca todos os orders aprovados e soma no JavaScript.
- **Impacto:** Ineficiente; escala linear com volume de vendas.
- **Evidência:** `src/services/orders.service.ts:84-92`.
- **Ação:** Usar `.select('sum(amount)')` ou RPC com `SUM(amount)`.

### 🟡 Média — Múltiplas Queries no Middleware para Cada Request
- **Descrição:** `isAdmin` e `hasActiveAccess` são chamadas no middleware para toda request protegida. Em média, +2 queries por request.
- **Impacto:** Latência adicional em todas as rotas protegidas.
- **Evidência:** `src/middleware/index.ts:89-92`.
- **Ação:** Cachear resultado em claim JWT customizado ou cookie seguro com TTL curto.

### 🟡 Média — Admin Endpoints sem Paginação
- **Descrição:** `getAllAdmin` em Lessons, Orders, Users, Comments, Ratings retorna todos os registros sem paginação.
- **Impacto:** Degradação de performance com crescimento de dados.
- **Evidência:** `src/services/lessons.service.ts:31-40`, `src/services/orders.service.ts:74-82`, etc.
- **Ação:** Adicionar paginação (limit/offset ou cursor) a todos os endpoints admin.

### 🟡 Média — Falta de Cache em Dados Quase-Imutáveis
- **Descrição:** `LessonsService.getAll`, `getAllModules` não possuem cache. Esses dados mudam raramente.
- **Impacto:** Queries desnecessárias ao Supabase.
- **Evidência:** `src/services/lessons.service.ts:19-29`, `:82-87`.
- **Ação:** Adicionar cache em memória (TTL 5min) ou Edge Config da Vercel.

### 🟢 Baixa — `CommentsService.getAllAdmin` Limite Arbitrário de 500
- **Descrição:** Hardcoded limit de 500 sem paginação.
- **Impacto:** Admin não consegue ver comentários além dos 500 mais recentes.
- **Evidência:** `src/services/comments.service.ts:80-90`.
- **Ação:** Implementar paginação com cursor.

---

## 3. DÉBITO TÉCNICO

### 🟠 Alta — Casting `as unknown as` em Services
- **Descrição:** `certificate.service.ts`, `comments.service.ts`, `ratings.service.ts` usam `as unknown as` para contornar tipagem do Supabase.
- **Impacto:** Perda de type safety; refatorações perigosas.
- **Evidência:** `src/services/certificate.service.ts:83-86`, `src/services/comments.service.ts:41`, `src/services/ratings.service.ts:69`.
- **Ação:** Gerar tipos mais precisos do Supabase (`supabase gen types`) ou usar zod para runtime validation.

### 🟠 Alta — Services com Métodos Estáticos e Acoplamento Direto
- **Descrição:** Todos os services usam `static` methods e importam `supabaseAdmin` diretamente. Impede injeção de dependência e dificulta testes unitários puros.
- **Impacto:** Código difícil de mockar sem monkey-patching; impossível trocar implementação (ex: mock repository).
- **Evidência:** Todos os arquivos em `src/services/*.ts`.
- **Ação:** Migrar para instâncias com constructor injection ou factory pattern. Manter interfaces para repositories.

### 🟡 Média — Webhook Cakto com Múltiplas Responsabilidades
- **Descrição:** 246 linhas validando payload, secret, criando usuário, order, link de recuperação e enviando email.
- **Impacto:** Difícil de testar, manter e reutilizar.
- **Evidência:** `src/pages/api/webhook/cakto.ts`.
- **Ação:** Extrair use cases: `ValidateWebhook`, `CreateUserFromPurchase`, `IssueOrder`, `SendWelcomeEmail`.

### 🟡 Média — Erros Genéricos Perdem Contexto
- **Descrição:** `throw new Error(error.message)` em todos os services perde o código do erro do Supabase (`error.code`).
- **Impacto:** Dificulta debug e tratamento de erro específico.
- **Evidência:** `src/services/orders.service.ts:13`, `src/services/lessons.service.ts:27`, etc.
- **Ação:** Criar erro customizado (`DatabaseError`) com `code`, `message`, `details`.

### 🟡 Média — `isCommentsUnavailable` com Magic Strings
- **Descrição:** Hardcoded `PGRST205` e `"lesson_comments"`.
- **Impacto:** Quebra se o Supabase mudar código de erro ou se renomear a tabela.
- **Evidência:** `src/services/comments.service.ts:25-27`.
- **Ação:** Usar constantes tipadas ou verificar por feature (tabela existe) via `information_schema`.

### 🟡 Média — `auth.service.ts` Usa Cliente Anônimo para Update de Profile
- **Descrição:** `updateProfile` usa `supabase` (anon key) em vez de `supabaseAdmin`. Pode falhar se RLS não permitir ou se o usuário não estiver logado no contexto.
- **Impacto:** Comportamento inconsistente entre services.
- **Evidência:** `src/services/auth.service.ts:12-22`.
- **Ação:** Padronizar uso de `supabaseAdmin` para operações de serviço, ou garantir que o contexto sempre tenha sessão ativa.

### 🟢 Baixa — Middleware Duplica Definição de `isApiRoute`
- **Descrição:** Variáveis `isApiPath` (linha 36) e `isApiRoute` (linha 74) verificam a mesma coisa.
- **Impacto:** Código redundante, confuso.
- **Evidência:** `src/middleware/index.ts:36,74`.
- **Ação:** Reutilizar uma única variável.

### 🟢 Baixa — `progress/complete.ts` Fire-and-Forget sem Observabilidade
- **Descrição:** `void EmailService.notifyCertificateAvailable(...)` não aguarda nem loga falha de envio de email.
- **Impacto:** Falha silenciosa de notificação.
- **Evidência:** `src/pages/api/progress/complete.ts:58`.
- **Ação:** Usar `await` com try/catch e logar erro estruturado.

---

## 4. QUALIDADE DE TESTES

### 🟠 Alta — `auth.service.ts` com Cobertura de 30%
- **Descrição:** Apenas 2 testes unitários cobrindo 28.57% das linhas. Código de auth é domínio crítico e exige TDD obrigatório.
- **Impacto:** Bugs em auth podem passar despercebidos.
- **Evidência:** Coverage report: `auth.service.ts | 30 | 33.33 | 100 | 28.57`.
- **Ação:** Escrever testes para `getProfile`, `updateProfile`, `resetPassword` (edge cases: usuário inexistente, erro do Supabase, email inválido).

### 🟠 Alta — `lessons.service.ts` Abaixo do Threshold (77.14%)
- **Descrição:** Cobertura abaixo do threshold de 80% configurado no `vitest.config.ts`.
- **Impacto:** Codecov/quality gate pode falhar se threshold for aplicado estritamente.
- **Evidência:** `lessons.service.ts | 77.14 | 69.23 | 100 | 76.92`.
- **Ação:** Adicionar testes para `getBySlug`, `create`, `update`, `togglePublish`.

### 🟡 Média — `supabase.ts` e `supabase-admin.ts` sem Cobertura
- **Descrição:** 0% coverage em arquivos que criam clientes Supabase.
- **Impacto:** Se variáveis de ambiente forem mal configuradas, não há teste que pegue.
- **Evidência:** `supabase-admin.ts | 0 | 100 | 100 | 0`.
- **Ação:** Testar inicialização e comportamento quando env vars estão ausentes.

### 🟡 Média — Testes E2E Insuficientes para Fluxos Críticos
- **Descrição:** Apenas 5 arquivos de E2E. Não cobrem fluxo completo de compra (webhook Cakto → acesso → certificado).
- **Impacto:** Regressões em fluxos de negócio podem passar.
- **Evidência:** `tests/e2e/*` — apenas auth, dashboard, checkout, landing.
- **Ação:** Adicionar E2E para: (1) webhook Cakto criando acesso, (2) progresso até certificado, (3) admin CRUD completo.

### 🟡 Média — Nenhum Teste de Contrato para Webhooks Externos
- **Descrição:** Fixtures existem (`tests/fixtures/webhooks.ts`), mas não há validação automática de schema contra evolução da API Cakto/Cal.
- **Impacto:** Se Cakto mudar payload, o webhook pode quebrar em produção.
- **Ação:** Adicionar testes de contrato (zod schema validation) no webhook handler.

### 🟢 Baixa — Threshold de Branches em 65%
- **Descrição:** Threshold baixo (65%) para branches, quando statements/functions exigem 80%.
- **Impacto:** Lógica condicional crítica pode não ser testada.
- **Evidência:** `vitest.config.ts:17`.
- **Ação:** Aumentar threshold de branches para 75-80%.

---

## 5. ARQUITETURA & MANUTENIBILIDADE

### 🟠 Alta — Ausência de Camada de Repository
- **Descrição:** Services acessam Supabase diretamente. Não há abstração de persistência.
- **Impacto:** Trocar de banco ou adicionar cache requer refatorar todos os services.
- **Evidência:** Todos os `src/services/*.ts`.
- **Ação:** Introduzir interfaces de repository (ex: `IOrdersRepository`) com implementação `SupabaseOrdersRepository`.

### 🟡 Média — Middleware Monolítico
- **Descrição:** `middleware/index.ts` com 126 linhas fazendo auth, RBAC, origin check, security headers.
- **Impacto:** Difícil de testar isoladamente e de estender.
- **Evidência:** `src/middleware/index.ts`.
- **Ação:** Decompor em middlewares encadeáveis: `authMiddleware`, `rbacMiddleware`, `securityHeadersMiddleware`.

### 🟡 Média — Tipagem do Banco Manual
- **Descrição:** `database.types.ts` parece manual (ou gerado uma vez). Se o schema evoluir, pode divergir.
- **Impacto:** Type safety entre código e banco pode quebrar silenciosamente.
- **Evidência:** `src/types/database.types.ts`.
- **Ação:** Automatizar `supabase gen types` no CI ou pre-commit hook.

### 🟡 Média — Hardcoded URLs e Configs
- **Descrição:** Várias partes usam `import.meta.env.PUBLIC_SITE_URL` diretamente. Se mudar o domínio, múltiplos pontos de alteração.
- **Impacto:** Risco de inconsistência.
- **Evidência:** `src/services/email.service.ts`, `src/pages/api/auth/login.ts`, etc.
- **Ação:** Centralizar URLs em config singleton (`src/config/urls.ts`).

### 🟢 Baixa — `quiz.service.ts` Cast sem Validação
- **Descrição:** `rest.options as string[]` assume formato do banco sem validação.
- **Impacto:** Se o JSON no banco estiver corrompido, erro em runtime.
- **Evidência:** `src/services/quiz.service.ts:19`.
- **Ação:** Usar zod para parse de JSON do banco.

---

## 6. DEVOPS & INFRA

### 🟠 Alta — Sem Endpoint de Health Check
- **Descrição:** Não há `/health`, `/ready` ou `/live` para verificar se a aplicação está saudável.
- **Impacto:** Load balancers e plataformas de deploy não conseguem detectar falhas rápidas.
- **Evidência:** Nenhum arquivo em `src/pages/api/health*`.
- **Ação:** Criar `/api/health` que verifica conectividade com Supabase e Redis (se houver).

### 🟠 Alta — Sem Observabilidade Externa
- **Descrição:** Logs vão para `console.*` (capturados pela Vercel), mas não há Sentry, Datadog, ou similar.
- **Impacto:** Dificuldade para investigar erros em produção, alertas demorados.
- **Evidência:** `src/lib/logger.ts` usa apenas console.
- **Ação:** Integrar com Sentry ou similar para error tracking e tracing.

### 🟡 Média — CI sem Deploy Automático (apenas CI)
- **Descrição:** O workflow `ci.yml` roda testes, mas não faz deploy. Deploy parece manual via Vercel Git integration.
- **Impacto:** Não há CD pipeline auditável; deploys podem não passar por todos os gates.
- **Evidência:** `.github/workflows/ci.yml` — sem job de deploy.
- **Ação:** Adicionar job de deploy staging/production com promoção automática após gates.

### 🟡 Média — `pnpm audit` High Ignorado
- **Descrição:** `pnpm audit --audit-level=high || true` não falha o build.
- **Impacto:** Vulnerabilidades high podem permanecer por semanas.
- **Evidência:** `.github/workflows/ci.yml:104-105`.
- **Ação:** Remover `|| true` e tratar vulnerabilidades high com SLA (ex: 7 dias).

### 🟡 Média — Sem Feature Flags
- **Descrição:** Qualquer merge na main ativa features imediatamente.
- **Impacto:** Não é possível fazer deploy seguro de features em desenvolvimento.
- **Evidência:** Nenhuma biblioteca de feature flags no `package.json`.
- **Ação:** Avaliar PostHog, LaunchDarkly, ou solução simples com env vars.

### 🟢 Baixa — Sem Documentação de Backup/DR
- **Descrição:** Não há documentação de procedimento de backup/restore do Supabase.
- **Impacto:** Em caso de incidente, tempo de recuperação (RTO) não definido.
- **Evidência:** Nenhum arquivo em `docs/` sobre DR.
- **Ação:** Documentar RTO/RPO e procedimentos de backup no `docs/DEPLOYMENT.md`.

---

## Resumo Executivo — Top 5 Prioridades

| # | Prioridade | Dimensão | Gap | Esforço | Impacto |
|---|------------|----------|-----|---------|---------|
| 1 | 🔴 | Segurança | Race condition em webhook Cakto | Médio | **Crítico** |
| 2 | 🔴 | Performance | `notifyNewLesson` sem throttling | Médio | **Crítico** |
| 3 | 🟠 | Performance | Agregações em memória (`getTotalRevenue`, `getCompletionDate`) | Baixo | **Alto** |
| 4 | 🟠 | Qualidade de Testes | Cobertura de `auth.service.ts` em 30% | Baixo | **Alto** |
| 5 | 🟠 | DevOps | Ausência de health check e observabilidade | Baixo | **Alto** |

---

## Matriz de Esforço x Impacto

### Quick Wins (Baixo Esforço, Alto Impacto)
- Adicionar rate limit a `/api/csp-report`
- Corrigir `OrdersService.getTotalRevenue` para usar `SUM` SQL
- Mover `CertificateService.getCompletionDate` para RPC
- Aumentar cobertura de `auth.service.ts`
- Criar endpoint `/api/health`
- Unificar CSP em `vercel.json` ou middleware

### Projetos Médios (Médio Esforço, Alto Impacto)
- Implementar throttling/batch no envio de emails
- Resolver race condition do webhook Cakto (transação atômica)
- Extrair camada de repository nos services
- Decompor middleware monolítico
- Adicionar paginação em todos os endpoints admin
- Integrar Sentry/Datadog

### Investimentos Estratégicos (Alto Esforço, Alto Impacto)
- Migrar services para injeção de dependência (quebrar static methods)
- Implementar fila de jobs para emails e webhooks
- Adicionar testes E2E completos de fluxo de compra
- Feature flags para deploy contínuo seguro
- Automatizar `supabase gen types` no CI
