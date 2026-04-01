# Data Model: Code Review de Arquivos Modificados

**Branch**: `001-code-review` | **Date**: 2026-04-01

## Entidades

### FileReviewResult

Representa o resultado da análise de um arquivo durante o code review.

| Campo | Tipo | Descrição |
| ----- | ---- | --------- |
| `path` | `string` | Caminho relativo do arquivo no repositório |
| `status` | `'tracked' \| 'untracked'` | Se o arquivo já existe no git ou é novo |
| `verdict` | `'approved' \| 'rejected' \| 'deleted'` | Decisão do review |
| `action` | `'staged' \| 'deleted' \| 'pending-fix'` | Ação tomada |
| `violations` | `ReviewViolation[]` | Lista de violações encontradas (se rejeitado) |
| `bug_fixed` | `boolean` | Se um bug foi corrigido antes do staged |

### ReviewViolation

| Campo | Tipo | Descrição |
| ----- | ---- | --------- |
| `rule` | `string` | Regra da constitution violada |
| `location` | `string` | Linha/função onde a violação ocorre |
| `description` | `string` | Descrição da violação |
| `severity` | `'blocker' \| 'warning'` | Bloqueia staged se `blocker` |

---

## Taxonomia de Veredictos

```
approved   → arquivo passou em todos os critérios → git add
rejected   → arquivo tem violações bloqueantes → não staged, reportado
deleted    → arquivo não tem utilidade para produção → removido do filesystem
```

---

## Critérios de Review (State Machine)

```
┌─────────────────────────────────────────────────┐
│  INÍCIO: arquivo em `git status`                │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│  Verificar utilidade para produção              │
│  (não é temporário, experimento ou morto?)      │
└─────────────────┬───────────────────────────────┘
           SIM    │           NÃO
                  │            └──→ verdict: 'deleted' → ação: 'deleted'
                  ▼
┌─────────────────────────────────────────────────┐
│  Verificar critérios de qualidade               │
│  (sem `any`, clean code, SOLID, segurança...)   │
└─────────────────┬───────────────────────────────┘
    PASSA         │         FALHA
                  │          └──→ verdict: 'rejected' → ação: 'pending-fix'
                  ▼                 (ou: corrigir bug → re-avaliar)
┌─────────────────────────────────────────────────┐
│  verdict: 'approved' → ação: 'staged' (git add) │
└─────────────────────────────────────────────────┘
```

---

## Relações

- Um `FileReviewResult` pode ter 0..N `ReviewViolation`
- Apenas arquivos com `verdict: 'approved'` têm `action: 'staged'`
- Bug corrigido durante review → `bug_fixed: true` + repassar pelos critérios antes de staged
