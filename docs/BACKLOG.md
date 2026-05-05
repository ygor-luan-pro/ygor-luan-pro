# Backlog

Visao rapida do estado do projeto. Quando voltar de outro projeto, bata o olho aqui.

**Ultima atualizacao**: 2026-05-05

---

## Bloqueadores Pre-Producao

Itens obrigatorios antes do deploy em producao. Nenhum feature nova ate resolver estes.

| # | Item | Status | Notas |
|---|------|--------|-------|
| B1 | Rodar migrations no Supabase remoto (`supabase db push`) | A fazer | Inclui 005-008, 010-013, 015-016 |
| B2 | Configurar `CAKTO_WEBHOOK_SECRET` no Vercel | A fazer | Webhook retorna 401 sem ele |
| B3 | Configurar `CAL_WEBHOOK_SECRET` no Vercel | A fazer | Necessario para webhook Cal.com |
| B4 | Configurar webhook no Cal.com apontando para `POST /api/webhook/cal-booking` | A fazer | |
| B5 | Deploy Edge Function: `supabase functions deploy send-mentorship-reminders` | A fazer | Cron de lembretes 24h |
| B6 | Testar fluxo completo de pagamento em sandbox Cakto | A fazer | |
| B7 | Criar imagem OG (`/public/images/og-cover.jpg`) | A fazer | SEO social sharing, 1200x630px |
| B8 | Configurar dominio na Vercel | A fazer | ygorluanacademy.com.br |

---

## Done

Features entregues e testadas.

### MVP
- [x] Landing page com design de producao (Hero, Benefits, Testimonials, FAQ, CTA)
- [x] SEO completo (canonical, Open Graph, Twitter Cards, Schema.org JSON-LD)
- [x] Sitemap automatico (`@astrojs/sitemap`)
- [x] Checkout via Cakto (launch mode R$997)
- [x] Autenticacao completa (Supabase Auth + middleware)
- [x] Dashboard do aluno (aulas, player de video, agendamento, perfil)
- [x] Painel admin (gestao de aulas, alunos, vendas)
- [x] Webhook Cakto (cria usuario + pedido + email de boas-vindas)
- [x] Paginas legais: `/termos` e `/privacidade` (CDC + LGPD)
- [x] Migrations SQL (schema + RLS + functions)
- [x] Security review completo (branch mergeada no main)
- [x] Middleware centralizado auth + autorizacao (`locals.hasAccess`)

### V1.1
- [x] Progresso visual (ProgressTracker com breakdown por modulo)
- [x] Quiz por modulo (QuizService, QuizPlayer, AdminQuizForm, API routes, migration 006)
- [x] Materiais complementares (MaterialsService, AdminMaterialsManager, API routes, migration 005)
- [x] Notificacoes por email (EmailService + 4 templates + Cal.com webhook + Edge Function cron)
- [x] Sistema de avaliacao de aulas (RatingsService, LessonRating island, /admin/avaliacoes, API route)
- [x] Sistema de certificado (migration 012, CertificateService, /dashboard/certificado, /certificado/verificar/[code], /admin/certificados)

### V1.2
- [x] Comunidade (comentarios por aula) — CommentsService, LessonComments island, AdminCommentsManager, moderacao admin

### Auditoria Pre-Lancamento (2026-05-05)
- [x] Quality Gate com ratchet instalado (cobertura 88.91%, violations 0)
- [x] 21 violacoes de acessibilidade corrigidas (labels/inputs, fieldset/legend nos radios)
- [x] Bundle size documentado: 428.5KB / limite 500KB
- [x] Bug CI corrigido: path do bundle check `dist/_astro` -> `dist/client/_astro`
- [x] Astro atualizado para 6.2.2, @astrojs/node 10.0.6, @astrojs/vercel 10.0.6
- [x] Auditoria de seguranca documentada (`docs/SECURITY_AUDIT_2026-05.md`)
- [x] 448 testes unitarios passando

---

## Em Andamento

Nada no momento. Puxe o proximo item do Backlog.

---

## Backlog

Proximo a implementar, em ordem de prioridade.

| # | Feature | Versao | Complexidade | Descricao |
|---|---------|--------|--------------|-----------|
| 1 | Live classes (streaming) | V1.3 | Alta | Aulas ao vivo com notificacao |
| 2 | App mobile (React Native) | V1.3 | Muito Alta | App nativo com acesso ao conteudo |

---

## Futuro

Ideias sem prioridade definida. Avaliar quando V1.2 estiver completa.

| Feature | Descricao |
|---------|-----------|
| Gamificacao | Badges, pontos, ranking entre alunos |
| Programa de afiliados | Comissao para indicacoes |
| Multi-idioma | i18n (pt-BR + en) |
| Marketplace | Permitir outros instrutores venderem |

---

## Checklist de Seguranca

| Item | Status | Notas |
|---|---|---|
| CORS same-origin | ✅ Confirmado | Middleware: POST/PUT/PATCH/DELETE bloqueiam cross-origin |
| Rate limiting | ⚠️ Pendente | `UPSTASH_REDIS_*` nas env vars mas nao verificado em producao |
| CSP headers | ⚠️ Report-Only | Enforce apos 14 dias em producao sem violations — ver `docs/SECURITY_AUDIT_2026-05.md` |
| Dependencias criticas | ✅ 0 encontradas | `pnpm audit --audit-level=critical` limpo |
| Dependencias high | ⚠️ 11 transitivas | Todas em dev tooling, risco zero em producao — decisao documentada |

---

## Como usar este arquivo

1. **Voltando ao projeto?** Leia "Bloqueadores" e "Em Andamento" primeiro
2. **Quer puxar trabalho?** Pegue o item #1 do Backlog (ou resolva um Bloqueador)
3. **Terminou algo?** Mova para "Done" e atualize a data no topo
4. **Nova ideia?** Adicione em "Futuro" e priorize depois
