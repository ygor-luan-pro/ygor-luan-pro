# Implementation Plan: Code Review de Arquivos Modificados

**Branch**: `001-code-review` | **Date**: 2026-04-01 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-code-review/spec.md`

## Summary

Revisar todos os arquivos modificados no working tree, aplicar os critérios de qualidade da constitution do projeto, staged os aprovados e deletar os inúteis. Esta iteração cobriu: rename de domínio (`ygorluanpro.com.br` → `ygorluanacademy.com.br`), extração do `CertificateService`, correção de bug de duplicação de texto e atualização de mocks de teste correspondentes.

## Technical Context

**Language/Version**: TypeScript 5 (strict mode) + Astro 5 (`.astro`) + Deno (supabase/functions/)
**Primary Dependencies**: Astro 5, React 19, Supabase JS v2, Vitest 4, Resend
**Storage**: N/A (processo de review, sem escrita em banco)
**Testing**: `pnpm test:unit` (Vitest 4) — 279 testes passando
**Target Platform**: Vercel (frontend SSR), Supabase Edge Functions (Deno)
**Project Type**: web-service (plataforma de mentoria)
**Performance Goals**: 0 erros TypeScript (`pnpm type-check`), 100% testes passando
**Constraints**: Sem `any`, serviços novos com testes, TDD obrigatório
**Scale/Scope**: ~20 arquivos por ciclo de review

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Princípio | Status | Observação |
|-----------|--------|------------|
| TDD First (§I) | ✅ PASS | `certificate.service.test.ts` criado antes/junto do serviço; 279 testes passando |
| Clean Code & Naming (§II) | ✅ PASS | Nomes descritivos, sem código morto; bug de duplicação corrigido |
| SOLID (§III) | ✅ PASS | `CertificateService` = responsabilidade única; dependências mockáveis |
| KISS & YAGNI (§IV) | ✅ PASS | Sem abstrações desnecessárias; apenas o necessário implementado |
| TypeScript strict / No `any` (§V) | ✅ PASS | Sem `any` em nenhum arquivo staged |
| Security First (§VI) | ✅ PASS | `.env.example` com placeholders apenas; sem secrets expostos |
| No Comments (§VII) | ✅ PASS | Sem comentários inline desnecessários |

**Resultado**: Todos os gates passam. Nenhuma violação identificada.

## Project Structure

### Documentation (this feature)

```text
specs/001-code-review/
├── plan.md              ← este arquivo
├── spec.md              ← especificação
├── research.md          ← decisões e resultado do review
├── data-model.md        ← taxonomia de veredictos
├── quickstart.md        ← guia de execução
├── contracts/
│   └── review-criteria.md  ← critérios de aprovação/rejeição/deleção
└── checklists/
    └── requirements.md  ← checklist de qualidade da spec
```

### Source Code (repositório raiz)

```text
src/
├── services/
│   └── certificate.service.ts   ← novo (extraído de progress/complete.ts e certificado.astro)
├── lib/
│   ├── resend.ts                 ← domain rename
│   └── email-templates/         ← 4 arquivos com domain rename
└── pages/
    ├── api/progress/complete.ts  ← refactor: usa CertificateService
    ├── dashboard/certificado.astro  ← refactor + bug fix
    ├── index.astro               ← domain rename
    ├── obrigado.astro            ← domain rename
    ├── privacidade.astro         ← domain rename
    └── termos.astro              ← domain rename

supabase/functions/
├── send-mentorship-reminders/index.ts  ← domain rename
└── webhook-pagamento/index.ts          ← domain rename

tests/unit/
├── api/
│   ├── progress-authorization.test.ts  ← adiciona mocks para CertificateService
│   └── webhook-cakto.test.ts           ← domain rename no mock
└── services/
    ├── certificate.service.test.ts     ← novo (8 casos de teste)
    └── email.service.test.ts           ← domain rename no mock
```

**Structure Decision**: Single project, sem separação backend/frontend em diretórios separados (Astro SSR híbrido).

## Complexity Tracking

> Nenhuma violação de constitution encontrada. Seção N/A.
