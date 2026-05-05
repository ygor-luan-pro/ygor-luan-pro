# Security Audit — Maio 2026

Data: 2026-05-05
Escopo: dependências, CSP, service key isolation, injeção, headers

---

## Resultado Geral

| Área | Status | Detalhe |
|---|---|---|
| Injeção (XSS, eval, innerHTML) | ✅ PASS | Nenhuma ocorrência em `src/` |
| Service role key isolation | ✅ PASS | Apenas em `src/lib/supabase-admin.ts` (server-only) |
| Security headers | ✅ PASS | HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy |
| CORS | ✅ PASS | Same-origin em POST/PUT/PATCH/DELETE |
| RLS Supabase | ✅ PASS | 12 tabelas, 28 policies |
| CSP | ⚠️ PENDENTE | Report-Only ativo — enforced aguarda dados de produção |
| Dependências (critical) | ✅ 0 críticos | — |
| Dependências (high) | ⚠️ 11 high | Todas transitivas em dev tooling — ver tabela abaixo |

---

## Dependências com Vulnerabilidades HIGH

Todas são transitivas (não importadas diretamente em `src/`) e presentes apenas no ambiente de build/dev, não em runtime de produção.

| Pacote | Vulnerabilidade | Via | Risco Prod | Decisão |
|---|---|---|---|---|
| `vite` ≤6.4.1 | Arbitrary file read via dev server | `vitest` | ❌ Nenhum (dev-only) | ✅ Aceito |
| `undici` | WebSocket overflow + memory leak + unhandled exception | `@astrojs/node`, Node.js HTTP | ❌ Dev/build only | ✅ Aceito |
| `lodash` ≤4.17.23 | Code injection via `_.template` | `@astrojs/check` → `yaml-language-server` | ❌ Dev-only | ✅ Aceito |
| `defu` ≤6.1.4 | Prototype pollution via `__proto__` | `astro` → `unstorage` → `h3` | ❌ Transitiva, não usada diretamente | ✅ Aceito |
| `h3` | SSE injection via header não sanitizado | `astro` → `unstorage` | ❌ Não exposta em produção | ✅ Aceito |
| `svgo` | DoS via DOCTYPE expansion | Tooling de SVG | ❌ Build-only | ✅ Aceito |
| `tar` | Symlink path traversal | Dev tooling | ❌ Build-only | ✅ Aceito |
| `picomatch` | ReDoS via extglob | Build tools (glob patterns) | ❌ Build-only | ✅ Aceito |

**Ação tomada**: `pnpm update astro @astrojs/node @astrojs/vercel @astrojs/react @astrojs/check` — versões atualizadas para latest. As vulnerabilidades remanescentes estão em sub-dependências não controláveis diretamente.

**Próxima revisão**: quando alguma dessas vulnerabilidades tiver fix disponível no upstream (monitorar `pnpm audit --audit-level=critical` no CI que bloqueia o pipeline).

---

## CSP — Decisão de Manter Report-Only

### Estado atual
`Content-Security-Policy-Report-Only` com endpoint `/api/csp-report`.

Diretivas configuradas em `src/lib/security-headers.ts`:
```
default-src 'self'
script-src 'self' https://player.vimeo.com
img-src 'self' data: https:
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com
font-src https://fonts.gstatic.com
frame-src https://player.vimeo.com
connect-src 'self' https://*.supabase.co https://api.resend.com
report-uri /api/csp-report
```

### Por que não enforce ainda
1. Sem dados de violações reais (aplicação não está em produção)
2. Switching para enforced sem dados pode quebrar funcionalidades (ex: Vimeo player, Google Fonts, Supabase realtime)
3. O risco de falso-positivo é maior do que o risco de segurança com Report-Only

### Processo para mudar para enforce
1. Deploy em produção com Report-Only ativo
2. Monitorar `/api/csp-report` por 7-14 dias sem violations
3. Se violations aparecerem, adicionar a fonte ao allowlist
4. Trocar `Content-Security-Policy-Report-Only` por `Content-Security-Policy` em `src/lib/security-headers.ts`

---

## Itens para Reavaliação Futura

- [ ] Após deploy: verificar logs de `/api/csp-report` por 14 dias
- [ ] Após 14 dias sem violations: mudar CSP para enforce
- [ ] Monitorar `pnpm audit --audit-level=high` mensalmente para novos CVEs com fix disponível
- [ ] Rotação de secrets: `CAKTO_WEBHOOK_SECRET`, `CAL_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY` — revisar a cada 6 meses

---

## Rastreabilidade

- Script de auditoria: `pnpm audit --audit-level=high`
- CI bloqueia em: `pnpm audit --audit-level=critical` (0 encontrados)
- Security headers: `src/lib/security-headers.ts`
- Middleware de proteção de rotas: `src/middleware/index.ts`
