# Auditoria de Regras de Desenvolvimento vs. Mercado 2026

> Análise crítica das regras atuais do projeto contra a prática de mercado para
> startups que desenvolvem com IA ("vibe coding"). Objetivo: máxima velocidade
> de entrega sem sacrificar qualidade, removendo gargalos onde não há retorno.

Data: 2026-05-10
Stack avaliada: Astro 5 + React 19 + Supabase + Cakto + Vitest + Playwright
Autoria assistida por: Claude Code (Opus 4.7)

---

## 1. Sumário Executivo

| Eixo | Regra Atual | Status vs. Mercado 2026 | Recomendação |
|---|---|---|---|
| TDD obrigatório em tudo | Sim — Red→Green→Refactor para todo código novo | ⚠️ Parcial | Manter para domínio crítico, relaxar em scaffolding/UI |
| Proibido `any` | Sim, sempre | ✅ Alinhado | Manter |
| Sem comentários no código | Sim | ✅ Alinhado | Manter, abrir exceção p/ "por quê" não óbvio |
| SOLID / KISS / YAGNI | Sim | ✅ Alinhado | Manter |
| Conventional Commits | Sim | ✅ Padrão de mercado | Manter |
| Pirâmide 70/20/10 (unit/int/e2e) | Sim | ⚠️ Em revisão pelo mercado | Migrar p/ "Testing Trophy" (mais integration) |
| Quality Gate Ratchet | Sim | ✅✅ Estado-da-arte para vibe coding | Manter e expandir |
| AGENTS.md + CLAUDE.md | Sim | ✅✅ Crítico p/ agentes | Manter, sincronizar |
| Spec-Driven Development (SDD) | ❌ Ausente formal | ⚠️ Gap principal | Adicionar layer leve de specs |
| SAST/Security automatizado | Parcial (`pnpm audit`) | ⚠️ Insuficiente | Adicionar Semgrep/Snyk no CI |
| Feature flags / canary | ❌ Ausente | ⚠️ Faltando p/ velocidade | Avaliar GrowthBook ou flag manual |

**Veredicto**: Stack de regras está **acima da média** para uma startup em 2026.
O Quality Gate Ratchet é o diferencial — poucos projetos têm isso. Principais
gaps são SDD (specs antes do código) e SAST automatizado. Principal gargalo
potencial é TDD universal — mercado evoluiu para TDD seletivo em código de IA.

---

## 2. Contexto de Mercado (2026)

Dados consolidados das pesquisas:

- **92% dos devs nos EUA** adotaram alguma forma de vibe coding.
- **60% do código novo** em 2026 é gerado por IA.
- **40% dos novos MVPs SaaS** são primariamente vibe-coded.
- **25% das startups da YC W25** rodam em código 95%+ gerado por IA.
- **73% mais rápido** time-to-market com vibe coding bem feito.
- **45% do código gerado por IA** tem vulnerabilidade de segurança sem guardrails.
- **Claude Code usa 5.5× menos tokens** que Cursor em tarefas idênticas.
- **Agent Teams (fev/2026)**: agentes coordenando entre si via task list compartilhada.

Conclusões do mercado:
1. Velocidade não é mais diferencial — é commodity.
2. **Diferencial agora é "guardrails"**: testes, specs, quality gates, security scans.
3. Gargalo migrou de "escrever código" para "definir o que construir" (upstream)
   e "validar com usuários reais" (downstream).
4. SDD (Spec-Driven Development) está se tornando padrão complementar ao TDD,
   especialmente para projetos com agentes (Kiro, Spec Kit, Tessl).

---

## 3. Análise Item por Item

### 3.1 TDD First — Red→Green→Refactor obrigatório

**Posição atual**: regra inegociável para todo código novo.

**Mercado 2026**:
- TDD continua sendo a guardrail #1 contra "AI slop".
- **Porém** o mercado evoluiu para **TDD seletivo**: rigoroso em
  *domínio crítico* (pagamento, auth, webhooks, RLS, dados), relaxado em
  *scaffolding* (componentes de UI estáticos, layouts, configs).
- Razão: TDD em todo `<Button />` cria atrito que não devolve qualidade
  proporcional, e bloqueia a velocidade que vibe coding promete.

**Diagnóstico**: regra atual é boa mas pode virar gargalo psicológico.
Devs/agentes podem postergar features simples por "tem que escrever teste primeiro".

**Recomendação**:
- Manter "TDD First" como **default**, não como dogma universal.
- Definir explicitamente o que é **domínio crítico** (lista abaixo) — nesses
  casos TDD é inegociável.
- Aceitar **"test-after"** ou **snapshot tests** em UI pura sem lógica:
  - Componentes de apresentação (sem estado, sem fetch)
  - Estilos / layouts
  - Configurações Astro / rotas estáticas
- Manter cobertura via Quality Gate Ratchet — ele já bloqueia regressão.

**Domínio crítico (TDD inegociável)**:
- `src/services/**` (lógica de negócio)
- `src/lib/supabase/**` (auth, RLS, queries)
- `src/pages/api/**` (handlers, webhooks Cakto)
- Migrations SQL com RLS
- Templates de email (snapshot obrigatório)
- Helpers de checkout, orders, pagamentos

### 3.2 Proibido `any`

✅ **Mantém**. Tipos explícitos são o "contrato" que o agente honra. Sem isso,
hallucination explode. Já está alinhado com mercado e com Astro/React 19.

### 3.3 Sem comentários no código

✅ **Mantém**. Mercado convergiu nessa direção (LLMs adoram poluir com comentário
óbvio). Abrir **exceção explícita** para:
- "Por quê" não óbvio (invariante, bug histórico, decisão de produto).
- Workaround com link p/ issue.
- `// TODO:` com data + responsável.

Sugestão: adicionar essa exceção literal ao `CLAUDE.md`, senão agentes vão
remover comentários úteis em refactors.

### 3.4 Clean Code / SOLID / KISS / YAGNI

✅ **Mantém**. Continua sendo o antídoto contra overengineering — problema
crônico em código gerado por IA, que tende a criar abstrações prematuras.

Cuidado: **YAGNI vence SOLID** quando entram em conflito em fase MVP. Documente.

### 3.5 Pirâmide de Testes 70/20/10

**Posição atual**: 70% unit, 20% integration, 10% E2E.

**Mercado 2026**: comunidade migrou para o "**Testing Trophy**" (Kent C. Dodds):
- Mais integration tests (40-50%)
- Menos unit puro (20-30%)
- E2E focado em fluxo crítico (10-15%)
- Static (types + lint) como base larga

**Por quê**: código de IA quebra mais nos *limites* entre módulos do que dentro
de funções puras. Integration test pega regressão real. Unit test puro
frequentemente vira "teste do mock", não testa nada de útil.

**Recomendação**:
- Reequilibrar metas: 40% unit, 40% integration, 20% E2E.
- **Domínio crítico** (auth, webhook, checkout) → integration test sempre.
- Manter unit test puro só onde há lógica pura genuína (utils, formatters, regras).

### 3.6 Quality Gate Ratchet

✅✅ **Manter e proteger**. Este é o **superpoder** do projeto.

A maioria das startups vibe-coding **não tem** isso. O ratchet é exatamente o
que o mercado chama de "babysit loop" — métricas só sobem, agente é o babá.

Sugestões de expansão (sem virar burocracia):
- Adicionar **bundle size** já presente no doc — bom, manter.
- Adicionar **a11y score** (axe-core) ao ratchet para o frontend.
- Adicionar **performance budget** (Lighthouse CI) quando o app crescer.
- **Não adicionar tudo de uma vez** — incremental, métrica por métrica.

### 3.7 Conventional Commits

✅ **Mantém**. Padrão de mercado, viabiliza changelog automático.

### 3.8 AGENTS.md / CLAUDE.md

✅✅ **Mantém e investe**. Mercado convergiu que **contexto estruturado** é o
diferencial entre vibe coding produtivo e gerador de bug.

Recomendação: garantir que `AGENTS.md` e `CLAUDE.md` permaneçam sincronizados
(hoje têm pequenas divergências em "testes passando 444+ vs 298+"). Criar
script ou hook que mantém alinhado.

---

## 4. Gaps Identificados (o que falta)

### 4.1 Gap #1 — Spec-Driven Development (SDD) leve

**Problema**: hoje features grandes nascem de conversa no chat. Agente perde
contexto entre sessões. Não há "contrato" formal do que está sendo construído.

**Solução proposta** (leve, sem virar Waterfall):
- Template `docs/specs/SPEC-XXX.md` por feature significativa:
  ```
  # SPEC-001: Player de Vídeo Bloqueado
  ## Objetivo (1 frase)
  ## User stories (3-5 bullets)
  ## Critérios de aceitação (lista executável)
  ## Não-objetivos (o que NÃO vamos fazer agora)
  ## Riscos / dependências
  ```
- Agente lê o spec antes de codar. Tarefa só é "done" se cumpre critérios.
- Feature pequena (1-2h) pode pular spec — bom senso.

Ferramentas para considerar (sem adotar agora): **Spec Kit** (open source),
**Kiro** (AWS), **Tessl**.

### 4.2 Gap #2 — SAST automatizado

**Problema**: 45% do código gerado por IA tem vuln. `pnpm audit` pega só
dependências, não código.

**Solução**:
- Adicionar **Semgrep** (free, open source) no CI — roda regras OWASP.
- Ou **Snyk Code** se já há conta corporativa.
- Bloquear PR em achados HIGH/CRITICAL no código gerado.

### 4.3 Gap #3 — Feature flags / canary deploys

**Problema**: para ir rápido em produção sem quebrar usuário pago, precisa
desligar feature em runtime.

**Solução** (escolher uma):
- **GrowthBook** (open source, free tier) — flags + A/B.
- **PostHog feature flags** (já vem com analytics).
- Flag manual via `orders.metadata.beta_features` — KISS, MVP-friendly.

Sem isso, qualquer bug em prod = rollback de deploy. Com isso = `flag.off()`.

### 4.4 Gap #4 — Métrica de "Definition of Done" produto

Quality Gate cuida do código. Falta o "DoD" do **produto**:
- Feature funciona no mobile? (visual regression test)
- Mudança nova foi medida com usuário real? (PostHog event)
- Existe rollback plan?

Recomendação: adicionar checklist curto em `docs/CONTRIBUTING.md`.

---

## 5. O que NÃO recomendo mudar

Estas regras parecem rígidas mas são **boas barreiras** contra a baixa qualidade
típica de vibe coding. Não suavizar:

- **Proibido `any`** — virou epidemia em projetos AI-heavy. Mantenha rígido.
- **Quality Gate Ratchet** — protege a base. Suavizar = abrir Pandora.
- **Conventional Commits** — viabiliza automação futura.
- **AGENTS.md / CLAUDE.md** — não enxugar a ponto de virar genérico.
- **No comments** — manter, com exceção explícita para "por quê" não óbvio.

---

## 6. Plano de Ação Recomendado (priorizado)

| Prioridade | Ação | Esforço | Impacto |
|---|---|---|---|
| P0 | Definir lista de **domínio crítico** onde TDD é inegociável | 1h | Alto — destrava velocidade em UI |
| P0 | Adicionar Semgrep ao CI (SAST) | 2h | Alto — fecha gap de segurança |
| P1 | Criar template `docs/specs/SPEC-template.md` (SDD leve) | 1h | Médio — destrava agentes |
| P1 | Adicionar a11y score ao Quality Gate | 3h | Médio — protege UX |
| P2 | Reequilibrar pirâmide → trophy (40/40/20) | gradual | Médio — long-term quality |
| P2 | Avaliar feature flags (GrowthBook ou flag manual) | 4h | Alto p/ velocidade prod |
| P3 | Sincronizar AGENTS.md ↔ CLAUDE.md via hook | 1h | Baixo — cosmético |

Tempo total estimado P0+P1: ~7h. ROI: destravar velocidade sem perder o teto
de qualidade.

---

## 7. Diagnóstico Final

Suas regras **não são gargalo**. São, na verdade, **mais maduras do que a média
de startups vibe-coding em 2026**. O Quality Gate Ratchet é diferencial real.

Pontos de tensão velocidade vs. qualidade:

1. **TDD universal** — único item que pode virar atrito desnecessário.
   Solução: TDD seletivo (domínio crítico), não TDD relaxado em geral.

2. **Falta SDD** — quando feature cresce, agente perde contexto e gera retrabalho.
   Solução: template de spec leve por feature significativa.

3. **Falta SAST** — risco silencioso em produção.
   Solução: Semgrep no CI.

**Não acelere quebrando o ratchet, o tipo-check ou o TDD em domínio crítico.**
Esses três são o que diferenciam vocês de uma startup vibe-coding média que
ship rápido e morre por bug em produção.

Velocidade real = remover atrito **fora** das guardrails, não diluir as
guardrails. Resumo: **vocês estão certos no espírito, podem ser mais cirúrgicos
no escopo**.

---

## Fontes

- [Vibe Coding 2026: The Complete Guide — DEV Community](https://dev.to/pockit_tools/vibe-coding-in-2026-the-complete-guide-to-ai-pair-programming-that-actually-works-42de)
- [Spec-Driven Development: Stop Vibe Coding, Ship Real Code — Appxlab](https://blog.appxlab.io/2026/03/27/spec-driven-development-ai-coding/)
- [Best Practices for Integrating Vibe Coding in 2026 — Ryz Labs](https://learn.ryzlabs.com/ai-development/best-practices-for-integrating-vibe-coding-in-2026)
- [Build an MVP w/AI in 2026 — startupnotes.eu](https://startupnotes.eu/building-an-mvp-with-ai-in-2026/)
- [The impact of AI on software engineers in 2026 — Pragmatic Engineer](https://newsletter.pragmaticengineer.com/p/the-impact-of-ai-on-software-engineers-2026)
- [Cursor vs Claude Code in 2026 — Particula](https://particula.tech/blog/cursor-vs-claude-code-2026-guide)
- [SDD vs TDD: Why Spec Driven Development Changes the Game — Planu](https://planu.dev/en/blog/sdd-vs-tdd)
- [Beyond TDD: Why Spec-Driven Development is the Next Step — Kinde](https://www.kinde.com/learn/ai-for-software-engineering/best-practice/beyond-tdd-why-spec-driven-development-is-the-next-step/)
- [Vibe Coding, But Production-Ready — Loiane Groner](https://loiane.com/2026/03/vibe-coding-with-specs-driven-feedback-loops/)
- [Spec-Driven Development: From Code to Contract (arXiv Feb 2026)](https://arxiv.org/html/2602.00180v1)
