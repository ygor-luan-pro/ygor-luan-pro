# Feature Specification: Code Review de Arquivos Modificados

**Feature Branch**: `001-code-review`
**Created**: 2026-04-01
**Status**: Draft
**Input**: User description: "Analisar e fazer code review de todos os arquivos modificados: staged os 100% ok, deletar os inúteis"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Revisar e staged arquivos aprovados (Priority: P1)

O desenvolvedor quer inspecionar cada arquivo modificado no working tree, verificar conformidade com os padrões do projeto (Clean Code, SOLID, TDD, TypeScript strict, segurança) e adicionar ao staged apenas os arquivos sem problemas.

**Why this priority**: Arquivos com código correto precisam ser staged antes de qualquer commit. Garantir que só código de qualidade entre no histórico é a principal entrega desta tarefa.

**Independent Test**: Pode ser testado rodando `git diff --staged` após a operação e verificando que apenas arquivos 100% conformes aparecem.

**Acceptance Scenarios**:

1. **Given** um arquivo modificado sem violações de qualidade, **When** o review é concluído, **Then** o arquivo é adicionado ao staged
2. **Given** um arquivo com violações, **When** o review é concluído, **Then** o arquivo NÃO é staged e o problema é reportado com clareza
3. **Given** um arquivo com código morto ou sem utilidade para o deploy, **When** o review é concluído, **Then** o arquivo é removido do working tree

---

### User Story 2 - Eliminar arquivos inúteis (Priority: P2)

O desenvolvedor quer remover arquivos que não têm utilidade real (arquivos temporários, experimentos, código morto) para manter o repositório limpo.

**Why this priority**: Evita ruído no diff e no histórico. Complementa o staging dos arquivos aprovados.

**Independent Test**: Após a operação, `git status` não deve mostrar arquivos desnecessários.

**Acceptance Scenarios**:

1. **Given** um arquivo untracked sem relevância para produção, **When** identificado no review, **Then** é deletado do sistema de arquivos
2. **Given** um arquivo modificado que não agrega valor, **When** identificado no review, **Then** é descartado e não incluído em nenhum commit

---

### Edge Cases

- O que acontece se um arquivo tem partes ok e partes com problemas? → Reportar o problema específico; não fazer staged até correção
- Como tratar arquivos de testes com cobertura incompleta? → Reportar como aviso, não bloquear staged se o arquivo em si está correto
- Arquivos `.env.example` com mudanças: verificar se não expõe secrets reais

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O processo DEVE inspecionar cada arquivo listado em `git status` (modificados + untracked relevantes)
- **FR-002**: O processo DEVE verificar conformidade com: TypeScript strict (proibido `any`), Clean Code, SOLID, TDD, segurança (sem injection, sem secrets expostos)
- **FR-003**: Arquivos 100% conformes DEVEM ser adicionados ao staged via `git add <file>`
- **FR-004**: Arquivos sem utilidade para o codebase de produção DEVEM ser deletados
- **FR-005**: Arquivos com problemas DEVEM ter os problemas reportados claramente, sem serem staged

### Key Entities

- **Arquivo modificado** (tracked): arquivo que já existe no repositório e foi alterado
- **Arquivo untracked**: arquivo novo que ainda não foi adicionado ao repositório
- **Staging area**: área intermediária do git onde ficam mudanças prontas para commit

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% dos arquivos modificados são revisados (nenhum ignorado)
- **SC-002**: Apenas arquivos conformes com os padrões do projeto são staged
- **SC-003**: Nenhum arquivo com vulnerabilidade de segurança ou `any` TypeScript é staged
- **SC-004**: Arquivos inúteis são removidos, reduzindo ruído no `git status`
- **SC-005**: O relatório de review cobre cada arquivo com veredicto claro (aprovado / reprovado / deletado)

## Assumptions

- O review segue os padrões definidos no `CLAUDE.md` do projeto
- Arquivos em `supabase/functions/` usam runtime Deno — erros TypeScript de Node não se aplicam
- Arquivos de teste devem existir para cada serviço novo (`src/services/`)
- O `.env.example` pode ter mudanças legítimas mas não deve conter valores reais de secrets
