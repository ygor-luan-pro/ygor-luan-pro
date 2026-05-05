# Quality Gate com Ratchet

Sistema de catraca para garantir que métricas de qualidade nunca regridam — independente de quem (ou o quê) escreve o código.

---

## Conceito Central

### O Problema

Em projetos onde agentes de IA geram a maior parte do código, a qualidade tende a degradar silenciosamente:

- Cobertura de testes cai gradualmente
- Duplicação aumenta commit a commit
- Arquivos crescem sem limite
- Violações de lint se acumulam

Nenhum item isolado parece crítico. O conjunto vira dívida técnica.

### A Solução: Ratchet (Catraca)

> **Baseline nunca regride. Métricas só avançam.**

Um arquivo `quality-gate-baseline.json` vive no repositório e registra o estado atual das métricas. A cada PR:

1. CI mede as métricas do código novo
2. Compara com o baseline
3. **Piora** → CI falha, PR bloqueado
4. **Melhora** → baseline atualizado automaticamente (catraca avança)
5. **Igual** → CI passa normalmente

O efeito: o projeto só pode ficar igual ou melhor. Nunca pior.

```
baseline.json
     │
     ▼
[ PR aberto ] ──→ CI mede métricas
                        │
              ┌─────────┴──────────┐
           piora                melhora / igual
              │                        │
         ❌ FAIL               ✅ PASS + atualiza baseline
         PR bloqueado               (catraca avança)
```

---

## Métricas Rastreadas

### 1. Cobertura de Testes

| Métrica | O que é |
|---|---|
| **Lines** | % de linhas executadas pelos testes |
| **Statements** | % de statements executados |
| **Functions** | % de funções chamadas nos testes |
| **Branches** | % de branches (if/else, ternários) cobertas |

**Regra da catraca**: se qualquer uma dessas percentagens cair abaixo do baseline → falha.

Exemplo de relatório:

```
Coverage
┌────────────┬──────────┬─────────┬────────┐
│ Metric     │ Baseline │ Current │   Δ    │
├────────────┼──────────┼─────────┼────────┤
│ Lines      │  72.40%  │ 69.10%  │ -3.30% │  ← REGRESSÃO
│ Statements │  71.20%  │ 71.50%  │ +0.30% │
│ Functions  │  68.90%  │ 70.00%  │ +1.10% │
│ Branches   │  61.00%  │ 61.00%  │   —    │
└────────────┴──────────┴─────────┴────────┘
```

### 2. Duplicação

| Métrica | O que é |
|---|---|
| **Percentage** | % do código que é duplicado |
| **Fragments** | Número de blocos duplicados identificados |

**Regra da catraca**: duplicação só pode diminuir ou manter. Nunca aumentar.

### 3. Violations (Violações de Qualidade)

| Métrica | O que é |
|---|---|
| **Quality rule violations** | Violações de regras de lint/estilo |
| **Oversized files** | Arquivos acima do limite de linhas/bytes |

**Diferencial**: o relatório lista **quais arquivos** regrediram, não só o número total:

```
Regressions
• src/services/payment.service.ts grew from 280 to 340 lines (over 300-line limit)
• src/components/Dashboard.tsx grew from 180 to 220 lines (over 200-line limit)
• max-depth violations increased in src/utils/webhook.ts (3 → 7)
```

---

## Pipeline CI Completo

O pipeline roda automaticamente ao abrir ou atualizar um PR.

### Fluxo dos 8 Passos

```
PR aberto / novo push
         │
         ▼
┌─────────────────────────────────────┐
│  1. Install (determinístico)        │
│     pnpm install --frozen-lockfile  │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│  2. Audit CRITICAL                  │
│     pnpm audit --audit-level=critical│
│     ❌ BLOQUEIA se encontrar        │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│  3. Audit HIGH                      │
│     pnpm audit --audit-level=high   │
│     ⚠️ AVISA mas não bloqueia       │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│  4. Type Check                      │
│     pnpm type-check                 │
│     ❌ BLOQUEIA se houver erros TS  │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│  5. Lint                            │
│     pnpm lint                       │
│     ❌ BLOQUEIA se houver erros     │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│  6. Tests + Coverage                │
│     pnpm test:unit --coverage       │
│     ❌ BLOQUEIA se teste falhar     │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│  7. Quality Gate (CORAÇÃO)          │
│     node scripts/quality-gate.js    │
│     ❌ BLOQUEIA se regredir         │
│     ✅ Atualiza baseline se melhorar│
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│  8. Report + Artifacts              │
│     • Sticky comment no PR          │
│     • GitHub Step Summary           │
│     • Upload coverage HTML          │
└─────────────────────────────────────┘
```

### Detalhamento dos Passos Críticos

**Passo 2 vs 3 — Por que dois audits?**

- `--audit-level=critical`: vulnerabilidade crítica = **bloqueio imediato**. Zero tolerância.
- `--audit-level=high`: vulnerabilidade alta = **visibilidade**. Time decide quando resolver sem travar o PR.

**Passo 7 — O script quality-gate.js**

É o coração do sistema. Ele:
1. Lê `coverage/coverage-summary.json` (gerado pelo Vitest/Jest)
2. Lê `quality-gate-baseline.json` do repo
3. Calcula o delta de cada métrica
4. Se qualquer métrica piorou → exit code 1 (CI falha)
5. Se todas melhoraram ou mantiveram → atualiza o baseline e commita
6. Gera o markdown do relatório

**Passo 8 — Sticky Comment**

O bot edita **o mesmo comentário** a cada novo push no PR (não cria comentários novos). Assim o PR tem sempre uma visão atualizada do estado das métricas sem poluição.

---

## O Loop "Babysit"

O grande ganho do sistema é eliminar o desenvolvedor como gargalo manual no ciclo de qualidade.

```
                    ┌─────────────┐
                    │  PR aberto  │
                    └──────┬──────┘
                           │
                           ▼
                    ┌─────────────┐
              ┌────│  CI + QG    │────┐
              │    └─────────────┘    │
           ❌ falhou              ✅ verde
              │                       │
              ▼                       ▼
     ┌────────────────┐    ┌──────────────────┐
     │  Agente IA     │    │ Reviewer humano  │
     │  (babysitter)  │    │ comenta no PR    │
     └───────┬────────┘    └────────┬─────────┘
             │                      │
             │ corrige               │ comentou?
             │ automaticamente       ▼
             │              ┌────────────────┐
             │              │  Agente IA     │
             │              │  resolve e     │
             │              │  marca como    │
             │              │  addressed     │
             │              └───────┬────────┘
             │                      │
             └──────────┬───────────┘
                        │
                        ▼
                   loop até verde
                        │
                        ▼
                  humano aprova ✅
```

**O reviewer humano foca em**:
- Decisões de arquitetura
- Lógica de negócio
- Revisão de segurança

**O agente cuida de**:
- Testes faltando
- Cobertura insuficiente
- Lint / type errors
- Resolução de comentários técnicos

---

## Estrutura de Arquivos

```
projeto/
├── .github/
│   └── workflows/
│       └── quality-gate.yml          # Pipeline CI
├── scripts/
│   └── quality-gate.js              # Script da catraca
├── quality-gate-baseline.json       # Baseline atual (versionado no git)
└── coverage/                        # Gerado pelo Vitest (gitignored)
    └── coverage-summary.json
```

### `quality-gate-baseline.json` — exemplo

```json
{
  "timestamp": "2026-05-04T00:00:00.000Z",
  "coverage": {
    "lines": { "pct": 72.4 },
    "statements": { "pct": 71.2 },
    "functions": { "pct": 68.9 },
    "branches": { "pct": 61.0 }
  },
  "duplication": {
    "percentage": 2.2,
    "fragments": 95
  },
  "violations": {
    "qualityRules": 483,
    "oversizedFiles": 12
  }
}
```

---

## Adaptação por Stack

O conceito é universal. Apenas os comandos mudam:

| Stack | Install | Test + Coverage | Lint |
|---|---|---|---|
| **Node + pnpm** | `pnpm install --frozen-lockfile` | `pnpm test --coverage` | `pnpm lint` |
| **Node + npm** | `npm ci` | `npm run test:coverage:ci` | `npm run lint` |
| **Node + yarn** | `yarn install --frozen-lockfile` | `yarn test --coverage` | `yarn lint` |

| Test Runner | Coverage output |
|---|---|
| **Vitest** | `coverage/coverage-summary.json` (provider: c8 ou v8) |
| **Jest** | `coverage/coverage-summary.json` |
| **Playwright** | relatório separado, integrar manualmente |

---

## Thresholds Sugeridos

### Limites de arquivo (Violations)

| Limite | Nível |
|---|---|
| > 200 linhas | ⚠️ Aviso |
| > 300 linhas | ❌ Regressão |
| > 30 linhas por função | ⚠️ Aviso |
| > 5 de profundidade de nesting | ❌ Regressão |

### Cobertura mínima inicial

Não existe um número mágico. A estratégia correta:

1. Captura a cobertura **atual** do projeto
2. Esse número vira o baseline
3. A partir daí, **só pode subir**

Projetos novos partem do 0% e crescem organicamente. Projetos legados não travam o time tentando atingir 80% do dia para a noite.

---

## Implementação Passo a Passo

### 1. Instalar dependências de coverage

```bash
# Vitest (já incluso — adicionar provider se necessário)
pnpm add -D @vitest/coverage-v8

# ou c8 (alternativa)
pnpm add -D @vitest/coverage-c8
```

### 2. Configurar coverage no `vitest.config.ts`

```ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
      reportsDirectory: './coverage',
    },
  },
})
```

### 3. Capturar baseline inicial

```bash
pnpm test:unit --coverage
node scripts/quality-gate.js init   # cria quality-gate-baseline.json
git add quality-gate-baseline.json
git commit -m "chore: adicionar quality gate baseline inicial"
```

### 4. Criar `scripts/quality-gate.js`

Script responsável por:
- Ler coverage summary
- Comparar com baseline
- Gerar relatório markdown
- Atualizar baseline se melhorou
- Exit code 0 (passou) ou 1 (falhou)

### 5. Criar `.github/workflows/quality-gate.yml`

Workflow que executa os 8 passos em cada PR com:
- `on: [pull_request]`
- `github-script` para sticky comment
- `actions/upload-artifact` para coverage HTML

### 6. Configurar permissões do bot

O workflow precisa de permissão para comentar no PR:

```yaml
permissions:
  pull-requests: write
  contents: write   # para atualizar o baseline
```

---

## Exemplo de Comentário no PR

```markdown
## Quality Gate

**Status: ✅ Passed**

### Coverage
| Metric     | Baseline | Current |    Δ    |
|------------|----------|---------|---------|
| Lines      |  72.40%  |  74.10% | +1.70%  |
| Statements |  71.20%  |  73.00% | +1.80%  |
| Functions  |  68.90%  |  71.20% | +2.30%  |
| Branches   |  61.00%  |  62.50% | +1.50%  |

### Duplication
| Metric     | Baseline | Current |    Δ    |
|------------|----------|---------|---------|
| Percentage |    2.2%  |   2.0%  |  -0.2%  |
| Fragments  |     95   |    93   |    -2   |

### Violations
| Metric              | Baseline | Current |  Δ  |
|---------------------|----------|---------|-----|
| Quality rule viol.  |   483    |   471   | -12 |
| Oversized files     |    12    |    12   |  —  |

🔧 Baseline atualizado automaticamente.
_Generated by scripts/quality-gate.js on 2026-05-04T12:00:00.000Z_
```

---

## Referências

- Conceito apresentado por: [vídeo original](https://www.youtube.com/watch?v=qToBgU8K4Ms)
- Implementação no projeto: `scripts/quality-gate.js` + `.github/workflows/quality-gate.yml`
- Baseline atual: `quality-gate-baseline.json`
