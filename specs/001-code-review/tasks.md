# Tasks: Code Review de Arquivos Modificados

**Input**: Design documents from `/specs/001-code-review/`
**Prerequisites**: plan.md ✅ spec.md ✅ research.md ✅ data-model.md ✅ contracts/ ✅

**Organization**: Tarefas agrupadas por user story. Cada story pode ser executada e validada de forma independente.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Pode rodar em paralelo (arquivos diferentes, sem dependências)
- **[Story]**: User story correspondente (US1 = staged aprovados, US2 = deletar inúteis)

---

## Phase 1: Setup (Preparação do Review)

**Purpose**: Garantir o estado inicial correto antes de iniciar o review.

- [x] T001 Verificar branch atual com `git branch --show-current` (deve ser a branch de feature)
- [x] T002 Listar todos os arquivos modificados com `git status` e `git diff HEAD`
- [x] T003 [P] Confirmar que `pnpm test:unit` passa antes de qualquer mudança (baseline verde)
- [x] T004 [P] Ler `specs/001-code-review/contracts/review-criteria.md` para interiorizar C1–C6

---

## Phase 2: Foundational (Triagem Inicial)

**Purpose**: Classificar cada arquivo em `approved`, `rejected` ou `deleted` antes de executar ações.

**⚠️ CRITICAL**: Classificar todos os arquivos antes de staged ou deletar qualquer um.

- [x] T005 Listar arquivos tracked modificados e classificar cada um com veredicto preliminar
- [x] T006 [P] Listar arquivos untracked e classificar cada um com veredicto preliminar
- [x] T007 Documentar violações encontradas (se houver) por arquivo — critérios C1–C6 de `contracts/review-criteria.md`

**Checkpoint**: Todos os arquivos têm veredicto atribuído antes de avançar.

---

## Phase 3: User Story 1 — Revisar e Staged Arquivos Aprovados (Priority: P1) 🎯 MVP

**Goal**: Todos os arquivos sem violações adicionados ao staged. Bugs corrigidos antes do staged.

**Independent Test**: `git diff --staged` mostra apenas arquivos que passaram em todos os critérios C1–C6.

### Implementação para User Story 1

- [x] T008 [P] [US1] Para cada arquivo tracked com veredicto `approved`: executar `git add <arquivo>`
- [x] T009 [P] [US1] Para cada arquivo untracked com veredicto `approved`: executar `git add <arquivo>`
- [x] T010 [US1] Para cada arquivo com veredicto `rejected` por bug corrigível: aplicar correção em `src/` ou `tests/`
- [x] T011 [US1] Após correções: rodar `pnpm test:unit` — DEVE passar antes de staged
- [x] T012 [US1] Após correções validadas: executar `git add` para os arquivos corrigidos
- [x] T013 [US1] Confirmar estado final: `git diff --staged` mostra apenas arquivos aprovados

**Checkpoint**: `git diff --staged` não contém nenhum arquivo com `any`, secrets, duplicação ou violação de SOLID.

---

## Phase 4: User Story 2 — Eliminar Arquivos Inúteis (Priority: P2)

**Goal**: Repositório sem arquivos temporários, mortos ou sem utilidade de produção.

**Independent Test**: `git status` não mostra arquivos desnecessários como untracked ou modificados após a limpeza.

### Implementação para User Story 2

- [x] T014 [US2] Listar arquivos com veredicto `deleted` da triagem (Phase 2, T006/T007)
- [x] T015 [P] [US2] Para cada arquivo identificado como inútil: executar `rm <arquivo>`
- [x] T016 [US2] Confirmar remoção: `git status` não mostra os arquivos deletados como untracked
- [x] T017 [US2] Verificar que nenhum arquivo deletado era referenciado por imports ativos em `src/`

**Checkpoint**: `git status` limpo — apenas os arquivos staged (da US1) e nenhum ruído extra.

---

## Phase 5: Polish & Verificação Final

**Purpose**: Garantir integridade antes de considerar o review concluído.

- [x] T018 [P] Rodar `pnpm test:unit` — todos os testes DEVEM passar (279+)
- [x] T019 [P] Rodar `pnpm type-check` — 0 erros TypeScript
- [x] T020 Revisar `git diff --staged` completo uma última vez como sanity check
- [x] T021 Stage de artefatos de tooling (`.specify/`, `specs/`) se fizerem parte da entrega

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: Sem dependências — começa imediatamente
- **Phase 2 (Foundational)**: Depende do Phase 1 — BLOQUEIA US1 e US2
- **US1 (Phase 3)**: Depende do Phase 2 — pode começar após triagem completa
- **US2 (Phase 4)**: Depende do Phase 2 — pode rodar em paralelo com US1 (arquivos distintos)
- **Polish (Phase 5)**: Depende de US1 e US2 completas

### User Story Dependencies

- **US1 (P1)**: Depende do Phase 2. Independente de US2.
- **US2 (P2)**: Depende do Phase 2. Independente de US1 (opera em arquivos distintos).

### Within Each User Story

- Triagem (Phase 2) antes de qualquer `git add` ou `rm`
- Correção de bugs ANTES de staged (T010 → T011 → T012)
- `pnpm test:unit` DEVE passar antes de staged após correções

### Parallel Opportunities

- T003 e T004 (Phase 1) em paralelo
- T005 e T006 (Phase 2) em paralelo
- T008 e T009 (US1 staged) em paralelo
- T018 e T019 (Polish) em paralelo
- US1 e US2 completas em paralelo por diferentes agentes

---

## Parallel Example: User Story 1

```bash
# Staged de arquivos tracked e untracked em paralelo:
Task T008: git add src/services/certificate.service.ts
Task T009: git add tests/unit/services/certificate.service.test.ts

# Verificações de qualidade em paralelo (Polish):
Task T018: pnpm test:unit
Task T019: pnpm type-check
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Completar Phase 1: Setup
2. Completar Phase 2: Triagem
3. Completar Phase 3: US1 (staged aprovados)
4. **STOP e VALIDATE**: `git diff --staged` mostra apenas código aprovado
5. Avançar para US2 se necessário

### Incremental Delivery

1. Setup + Foundational → todos os arquivos classificados
2. US1 → todos os aprovados staged → `pnpm test:unit` verde
3. US2 → inúteis deletados → `git status` limpo
4. Polish → type-check verde → pronto para commit

---

## Notes

- [P] tasks = arquivos diferentes, sem dependências entre si
- Critérios C1–C6 de `contracts/review-criteria.md` são BLOQUEANTES para staged
- Critérios Q1–Q3 são avisos — não bloqueam staged mas devem ser reportados
- Arquivos em `supabase/functions/` usam Deno — erros TS de Node não se aplicam
- Testes em `*.test.ts` podem usar `as never[]` / `as unknown` em mocks Vitest (prática aceita)
- Bug corrigido = reclassificar arquivo como `approved` após correção + testes passando
