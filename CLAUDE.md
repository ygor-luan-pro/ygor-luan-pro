# CLAUDE.md

Plataforma de mentoria para barbeiros (Ygor Luan Academy). Astro 5 + React 19 + Supabase + Cakto.

## Comandos

```sh
pnpm dev              # localhost:4321
pnpm build            # Build producao
pnpm preview          # Preview local
pnpm type-check       # astro check
pnpm test:unit        # Vitest unit
pnpm test:integration # Vitest integration
pnpm test:e2e         # Playwright E2E
```

## Regras Inegociaveis

- **TDD Seletivo**: Red -> Green -> Refactor obrigatorio em **dominio critico** (ver lista abaixo). Codigo de UI puro / scaffolding aceita test-after ou snapshot.
- **Proibido `any`**: Use tipos explicitos, `unknown` com narrowing, generics.
- **Sem comentarios no codigo**: Nomes claros e funcoes pequenas sao a documentacao. Excecao: "por que" nao obvio (invariante, workaround, decisao de produto).
- **Clean Code**: Funcoes pequenas, proposito unico, sem codigo morto.
- **SOLID / KISS / YAGNI**: Sem abstraccoes prematuras, sem overengineering. YAGNI vence SOLID em fase MVP.
- **SDD Leve**: Feature significativa (>2h) requer spec em `docs/specs/SPEC-XXX.md` antes de codar.

## Dominio Critico (TDD obrigatorio)

- `src/services/**` — logica de negocio
- `src/lib/supabase/**` — auth, RLS, queries
- `src/pages/api/**` — handlers, webhooks Cakto
- Migrations SQL com RLS
- Templates de email (snapshot obrigatorio)
- Helpers de checkout, orders, pagamentos
- Qualquer codigo que toque dinheiro, auth ou dados de usuario

## Nomenclatura

- Arquivos: `kebab-case.tsx`
- Components: `PascalCase`
- Functions: `camelCase`
- Constants: `SCREAMING_SNAKE_CASE`
- Types: `PascalCase`

## Harness — Verificacao do Agente

Antes de marcar qualquer tarefa como concluida:

- `pnpm type-check` sem erros
- `pnpm test:unit` — todos os testes passando (488+)
- Codigo em dominio critico: teste TDD escrito primeiro (Red → Green)
- Codigo UI puro: teste pode vir depois, mas cobertura nao pode regredir (Quality Gate)
- Template de email alterado: `pnpm test:unit -u` para atualizar snapshot
- Handler de webhook alterado: fixture em `tests/fixtures/webhooks.ts` ainda valida o contrato
- Migration SQL nova: adicionada em `supabase/migrations/` com numero sequencial
- Feature significativa (>2h): spec em `docs/specs/` antes de implementar

## Docs

- [Projeto e Arquitetura](docs/PROJECT.md)
- [Schema e RLS](docs/DATABASE.md)
- [Fluxos e Padroes](docs/FLOWS.md)
- [Testes](docs/TESTING.md)
- [Deploy e CI/CD](docs/DEPLOYMENT.md)
- [Seguranca](docs/SECURITY.md)
- [Roadmap](docs/ROADMAP.md)
- [Backlog / Kanban](docs/BACKLOG.md)
- [Contribuindo](docs/CONTRIBUTING.md)
- [Design Brief](docs/design-brief.md)

## Security Rules
- CI roda Semgrep SAST em todo PR (regras OWASP)
- `pnpm audit` bloqueia vulnerabilidades critical
- Avoid vulnerable dependencies
- Prefer secure defaults

## Active Technologies
- TypeScript 5 / Node 20 + Astro 5 (SSR), React 19, @supabase/ssr, Vitest 4, @testing-library/react
- Supabase PostgreSQL (tabela `orders`)

## Recent Changes
- 20260425-000000-sem-acesso-ux-gate: Added TypeScript 5 / Node 20 + Astro 5 (SSR), React 19, @supabase/ssr, Vitest 4, @testing-library/react
