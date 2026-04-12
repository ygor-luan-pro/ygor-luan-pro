# CLAUDE.md

Plataforma de mentoria para barbeiros (Ygor Luan Pro). Astro 5 + React 19 + Supabase + Cakto.

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

- **TDD First**: Red -> Green -> Refactor. Todo codigo novo comeca pelos testes.
- **Proibido `any`**: Use tipos explicitos, `unknown` com narrowing, generics.
- **Sem comentarios no codigo**: Nomes claros e funcoes pequenas sao a documentacao.
- **Clean Code**: Funcoes pequenas, proposito unico, sem codigo morto.
- **SOLID / KISS / YAGNI**: Sem abstraccoes prematuras, sem overengineering.

## Nomenclatura

- Arquivos: `kebab-case.tsx`
- Components: `PascalCase`
- Functions: `camelCase`
- Constants: `SCREAMING_SNAKE_CASE`
- Types: `PascalCase`

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
