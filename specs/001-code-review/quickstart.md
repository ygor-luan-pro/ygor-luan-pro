# Quickstart: Como executar o Code Review

**Branch**: `001-code-review` | **Date**: 2026-04-01

## Pré-requisitos

- Branch de feature criada (via `/speckit.specify`)
- `pnpm test:unit` passando no estado atual do repositório

---

## Passo a Passo

### 1. Inspecionar arquivos modificados

```sh
git status
git diff HEAD
```

### 2. Para cada arquivo: aplicar os critérios de review

Consulte `contracts/review-criteria.md` para os critérios bloqueantes (C1–C6).

**Se APROVADO** → staged:
```sh
git add <arquivo>
```

**Se REPROVADO com bug corrigível** → corrigir com `Edit`, rodar testes, depois staged:
```sh
pnpm test:unit
git add <arquivo>
```

**Se INÚTIL** → deletar:
```sh
rm <arquivo>
```

### 3. Verificar testes após correções

```sh
pnpm test:unit
pnpm type-check
```

### 4. Confirmar estado do staged

```sh
git status
git diff --staged
```

---

## Sinais de Alerta

| Sinal | Ação |
|-------|------|
| Novo `src/services/*.ts` sem `tests/unit/services/*.test.ts` | Não staged — falta teste |
| `.env.example` com valor real (não placeholder) | Não staged — risco de exposição de secret |
| Texto duplicado no JSX/Astro | Corrigir antes de staged |
| `any` no diff | Não staged — violação C1 |
