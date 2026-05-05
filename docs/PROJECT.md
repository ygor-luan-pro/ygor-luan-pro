# Ygor Luan Pro - Plataforma de Mentoria para Barbeiros

## Visao Geral

Plataforma exclusiva de venda de mentoria de barbeiro com curso em video + sessoes 1:1. **NAO e marketplace** - apenas o Ygor Luan pode vender. Sistema focado em conversao, performance e experiencia do aluno.

## Licenca e Reuso

O repositorio e publico para referencia tecnica e transparencia, mas o codigo permanece proprietario.
Nao ha permissao para copiar, modificar, distribuir ou usar comercialmente o software sem autorizacao por escrito.

## Objetivo do Produto

Funil completo:
1. Landing page otimizada (SEO + conversao)
2. Checkout seguro via Cakto
3. Acesso automatico apos pagamento
4. Area de membros com aulas gravadas
5. Sistema de agendamento para mentoria 1:1

## Stack Tecnica

### Frontend
- **Framework**: Astro 5 (SSG/SSR hibrido)
- **UI Components**: React 19 (Islands Architecture)
- **Styling**: Tailwind CSS
- **Linguagem**: TypeScript (strict mode)

### Backend/BaaS
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage (PDFs, materiais)
- **Serverless**: Supabase Edge Functions (Deno)

### Integracoes
- **Pagamento**: Cakto (checkout + webhook)
- **Videos**: Vimeo (privado, protecao de conteudo)
- **Agendamento**: Cal.com
- **Email**: Resend (transacional)

### Deploy
- **Frontend**: Vercel
- **Backend**: Supabase (gerenciado)
- **CI/CD**: GitHub Actions

## Arquitetura do Sistema

```
┌─────────────────────────────────────────────┐
│  ASTRO (Frontend)                           │
│  - Landing page (SSG - SEO otimizado)       │
│  - Dashboard (SSR - protegido)              │
│  - Admin panel (SSR - role-based)           │
└──────────────┬──────────────────────────────┘
               │
               │ API Calls (REST + Realtime)
               ▼
┌─────────────────────────────────────────────┐
│  SUPABASE (Backend as a Service)            │
│  - PostgreSQL (dados estruturados)          │
│  - Auth (JWT + RLS)                         │
│  - Storage (arquivos estaticos)             │
│  - Edge Functions (webhooks)                │
└──────────────┬──────────────────────────────┘
               │
               │ Webhooks
               ▼
┌─────────────────────────────────────────────┐
│  CAKTO                                      │
│  - Checkout hosted                          │
│  - Processamento de pagamento               │
│  - Notificacoes (Webhook)                   │
└─────────────────────────────────────────────┘
```

## Estrutura de Diretorios

```
src/
├── pages/           # Rotas (landing, login, dashboard, admin)
├── components/      # Astro components (layout, landing, ui)
├── islands/         # React islands (client-side interactivity)
├── lib/             # Clientes e helpers (supabase, cakto, utils)
├── services/        # Logica de negocio (auth, lessons, users, orders, progress)
├── types/           # TypeScript types (database, cakto)
└── middleware/       # Auth + admin protection

supabase/
├── migrations/      # SQL migrations (001-008)
└── functions/       # Edge Functions (Deno)

tests/
├── unit/            # Vitest unit tests
├── integration/     # Vitest integration tests
└── e2e/             # Playwright E2E tests
```
