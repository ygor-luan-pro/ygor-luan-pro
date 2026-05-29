# SPEC-001: Correções do Code Review PR #2

> Plano para resolver achados do review do PR #2 antes do merge para `main`.

## Objetivo

Corrigir 3 críticos, 5 avisos e 2 sugestões identificados no review do PR #2 para liberar merge seguro para `main`.

## Criterios de Aceitacao

### Críticos (bloqueia merge)

- [ ] **C1** — Validar que Vercel native integration deploya `main` automaticamente. Se sim: nenhuma ação além de confirmar nos checks. Se não: re-introduzir job de deploy em `.github/workflows/ci.yml` ou criar `deploy-production.yml` apontando para Vercel CLI com secrets `VERCEL_TOKEN`/`VERCEL_PROJECT_ID`/`VERCEL_ORG_ID`.
- [ ] **C2** — `src/services/orders.service.ts::getByPaymentId` lança erro quando Supabase retorna `error`. Padrão obrigatório:
  ```ts
  const { data, error } = await supabase
    .from('orders').select('*').eq('payment_id', paymentId).single();
  if (error && error.code !== 'PGRST116') throw new Error(error.message);
  return data;
  ```
  (`PGRST116` = "no rows" em `.single()`, é o único `error.code` aceitável retornando `null`.)
- [ ] **C3** — Testes TDD (Red→Green) para `getByPaymentId` e `getAll` em `tests/unit/services/orders.service.test.ts`. Mínimo:
  - `getByPaymentId` retorna order quando existe
  - `getByPaymentId` retorna `null` em `PGRST116`
  - `getByPaymentId` lança quando erro Supabase ≠ PGRST116
  - `getAll` retorna array vazio sem orders
  - `getAll` retorna orders ordenados (definir critério)
  - `getAll` lança em erro Supabase

### Avisos (não bloqueia, mas resolve no mesmo PR)

- [ ] **A1** — Substituir `console.warn` em `src/lib/rate-limit.ts:80` por `logger.warn(...)` (importar de `src/lib/logger.ts`).
- [ ] **A2** — Validar shape da resposta Upstash em `src/lib/rate-limit.ts`. Trocar cast `as [{result:number},{result:number}]` por narrowing:
  ```ts
  if (!Array.isArray(results) || results.length < 2 || typeof results[0]?.result !== 'number') {
    logger.warn('Upstash unexpected shape', { results });
    return { allowed: true, remaining: max, reset: 0 };
  }
  ```
- [ ] **A3** — Remover bloco JSDoc redundante de `scripts/check-staging-env.js`. Nome do arquivo basta.
- [ ] **A4** — `scripts/check-test-only.js::walk` — remover default mutável. Reescrever sem acumulador externo:
  ```js
  function walk(dir) {
    return readdirSync(dir).flatMap(entry => {
      const full = join(dir, entry);
      return statSync(full).isDirectory() ? walk(full) : [full];
    });
  }
  ```
- [ ] **A5** — Pin `returntocorp/semgrep-action@<sha>` em `.github/workflows/ci.yml`. Obter SHA de `gh api repos/returntocorp/semgrep-action/git/refs/tags/v1 --jq .object.sha`.

### Sugestões (opcionais, P2)

- [ ] **S1** — Extrair `OrdersService.provisionPurchase(input: ProvisionInput)` consolidando: criar/buscar user → upsert profile → upsert order → gerar link signed → disparar email. Handler `webhook/cakto.ts` chama 1 método. Cobertura unitária no service.
- [ ] **S2** — Remover JSDocs redundantes de `scripts/check-branch.js`, `scripts/check-staging-env.js`, `scripts/check-test-only.js`.

## Nao-Objetivos

- Refatorar todos os 91 arquivos do PR. Foco apenas nos achados do review.
- Trocar Vercel native por GitHub Actions deploy (custo > benefício atual).
- Cobertura 100% de orders.service — só os métodos sinalizados.

## Dominio Critico Envolvido

- [x] Auth / RLS (rate-limit toca rate limiting de login)
- [x] Pagamento / Checkout (orders.service, webhook cakto)
- [x] Webhook Cakto (S1)
- [ ] Migration SQL
- [ ] Template de email
- [ ] Nenhum (UI pura)

> TDD obrigatório em C2, C3, A1, A2, S1.

## Riscos / Dependencias

| Risco | Mitigação |
|---|---|
| C1: Vercel native pode não cobrir `main` push (só PRs) | Confirmar via push de teste para `main` em ambiente isolado OU manter `deploy.yml` reintroduzido com secrets. **Verificar antes de mergear**. |
| C2: mudança de contrato em getByPaymentId pode quebrar callers que assumem `null` em erro genérico | Greppar `getByPaymentId` no codebase, ajustar handlers para `try/catch`. |
| A2: narrowing pode falsamente permitir requests em outage Upstash | Decisão de produto: fail-open ou fail-closed. Recomendado fail-open com log (rate-limit não é gate de segurança absoluto). |

## Decisoes Tecnicas

| Decisão | Alternativa descartada | Motivo |
|---|---|---|
| Vercel native p/ deploy | GitHub Actions + Vercel CLI | Já funciona, menos config, sem secrets p/ rotacionar |
| `PGRST116 → null`, resto throw | Sempre throw incluindo PGRST116 | "Not found" é estado válido em `getByPaymentId`, evita try/catch em todo caller |
| Logger centralizado em rate-limit | `console.warn` | Consistência com restante do codebase, observabilidade |
| Pin Semgrep SHA | Pin `@v1` mutável | Pipeline de segurança não pode confiar em tag mutável |
| Dropar S1 do MVP | Refatorar webhook agora | YAGNI — handler funciona, testes existem, refator dá em PR separado |

## Ordem de Execução

1. **Branch nova**: `git checkout -b fix/pr2-review-critical`
2. C2 + C3 (TDD: escrever testes Red → implementar Green)
3. A1, A2 (rate-limit)
4. A3, A4, A5 (scripts + workflow)
5. `pnpm type-check && pnpm test:unit && pnpm test:integration`
6. C1: validar Vercel native cobre main. Se não, reintroduzir workflow.
7. Commit atômico por bloco (C2, A1+A2, A3+A4, A5).
8. PR alvo `staging` (mesma branch do PR #2) ou push direto se PR #2 ainda aberto.
9. S1 e S2 em PR separado pós-merge se houver capacidade.

## Verificação Final

```sh
pnpm type-check
pnpm test:unit
pnpm test:integration
pnpm lint
node scripts/quality-gate.js check
gh pr checks 2 --repo ygor-luan-academy/ygor-luan-academy
```

Tudo verde → liberar merge.
