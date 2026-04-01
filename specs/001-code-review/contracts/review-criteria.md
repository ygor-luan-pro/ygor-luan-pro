# Contrato: Critérios de Code Review

**Branch**: `001-code-review` | **Date**: 2026-04-01

Este documento define os critérios não-negociáveis que um arquivo deve satisfazer para ser aprovado no code review e staged. Baseia-se diretamente na constitution do projeto.

---

## Critérios Bloqueantes (impedem staged)

| # | Critério | Referência | Como verificar |
|---|----------|------------|----------------|
| C1 | Nenhum uso de `any` TypeScript | Constitution §V | `grep -n ': any\|as any\|<any>'` no diff |
| C2 | Sem secrets reais expostos (chaves, tokens, senhas) | Constitution §VI | Verificar `.env.example` — apenas placeholders |
| C3 | Serviço novo sem arquivo de teste correspondente | Constitution §Testing | `ls tests/unit/services/<nome>.test.ts` |
| C4 | Duplicação de texto ou lógica introduzida pela mudança | Constitution §II | Leitura cuidadosa do diff |
| C5 | Função com mais de uma responsabilidade | Constitution §III | Análise do escopo de cada função |
| C6 | Comentários inline desnecessários adicionados | Constitution §VII | `grep -n '// \|/\*'` no diff |

---

## Critérios de Qualidade (não bloqueantes, reportar como aviso)

| # | Critério | Referência |
|---|----------|------------|
| Q1 | Nomes não descritivos (variáveis de uma letra, genéricas) | Constitution §II |
| Q2 | Arquivo de teste com cobertura parcial | Constitution §Testing |
| Q3 | `console.log` de depuração temporário deixado no código | Constitution §II |

---

## Critérios para Deleção

Um arquivo deve ser deletado (não staged) se:
- É um arquivo temporário sem propósito de produção
- É código morto nunca referenciado
- É duplicata funcional de algo já existente

---

## Escopo Fora deste Contrato

- Arquivos em `supabase/functions/` usam runtime Deno — erros TypeScript de Node não se aplicam
- Arquivos `.spec/` (speckit) são tooling — seguem regras de tooling, não de produção
- Testes podem usar `as never[]` ou `as unknown` para casting em mocks (prática aceita em Vitest)
