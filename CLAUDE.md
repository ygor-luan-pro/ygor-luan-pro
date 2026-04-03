# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Comandos

```sh
pnpm dev              # Servidor local em localhost:4321
pnpm build            # Build de produção para ./dist/
pnpm preview          # Preview do build local
pnpm type-check       # Verifica tipos (astro check)
pnpm test:unit        # Testes unitários (Vitest)
pnpm test:integration # Testes de integração (Vitest)
pnpm test:e2e         # Testes E2E (Playwright)
pnpm test:e2e:ui      # Playwright com UI interativa
```

---

## 🧠 Code Quality Principles

Todos os agentes DEVEM seguir estes princípios ao gerar ou modificar código:

- **Clean Code**: Nomes descritivos, funções pequenas e com propósito único, sem código morto ou comentários desnecessários.
- **SOLID**: Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion. Separe responsabilidades corretamente entre módulos, componentes e funções.
- **KISS**: Prefira soluções simples e diretas. Evite abstrações prematuras ou complexidade desnecessária.
- **YAGNI**: Não implemente funcionalidades "para o futuro". Implemente apenas o que é necessário agora.
- **Proibido `any`**: Nunca use `any` em TypeScript. Use tipos explícitos, `unknown` com narrowing, generics ou utility types quando necessário.
- **Evite overengineering**: Não crie abstrações, wrappers ou camadas extras sem necessidade concreta e imediata.
- **Código testável e manutenível**: Escreva código com dependências injetáveis, funções puras quando possível, e separação clara entre lógica de negócio e infraestrutura.
- **TDD First**: Todo código novo deve começar pelos testes. Escreva o teste que define o comportamento esperado, veja falhar, implemente o mínimo para passar, e então refatore. Isso é inegociável.
- **Sem comentários no código**: Um código bem escrito dispensa comentários. Nomes claros e funções pequenas são a documentação.
- **Decisões arquiteturais**: Explique o racional de escolhas relevantes na resposta ao usuário ou no PR, nunca em comentários no código.

## 🧪 TDD — Metodologia Primária

**TDD é a metodologia #1 do projeto.** Todo código novo ou modificação significativa DEVE seguir o ciclo Red → Green → Refactor.

```
RED ───── Escrever testes ANTES do código. Testes definem o comportamento esperado. Rodar `pnpm test` → devem FALHAR.
GREEN ─── Implementar código MÍNIMO para os testes passarem. Rodar `pnpm test` → devem PASSAR.
REFACTOR ─ Limpar código sem alterar comportamento. Rodar `pnpm test` → devem continuar PASSANDO.
```

---

# Ygor Luan Pro - Plataforma de Mentoria para Barbeiros

## 📋 Visão Geral do Projeto

Plataforma exclusiva de venda de mentoria de barbeiro com curso em vídeo + sessões 1:1. **NÃO é marketplace** - apenas o Ygor Luan pode vender. Sistema focado em conversão, performance e experiência do aluno.

---

## 🎯 Objetivo do Produto

Criar um funil completo:
1. Landing page otimizada (SEO + conversão)
2. Checkout seguro via Cakto
3. Acesso automático após pagamento
4. Área de membros com aulas gravadas
5. Sistema de agendamento para mentoria 1:1

---

## 🛠️ Stack Técnica

### Frontend
- **Framework**: Astro 4+ (SSG/SSR híbrido)
- **UI Components**: React 18+ (Islands Architecture)
- **Styling**: Tailwind CSS
- **Linguagem**: TypeScript (strict mode)

### Backend/BaaS
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage (PDFs, materiais)
- **Serverless**: Supabase Edge Functions (Deno)

### Integrações
- **Pagamento**: Cakto (checkout + webhook)
- **Vídeos**: Vimeo (privado, proteção de conteúdo)
- **Agendamento**: Cal.com (open source)
- **Email**: Resend (transacional)

### Deploy
- **Frontend**: Vercel
- **Backend**: Supabase (gerenciado)
- **CI/CD**: GitHub Actions

---

## 🏗️ Arquitetura do Sistema
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
│  - Storage (arquivos estáticos)             │
│  - Edge Functions (webhooks)                │
└──────────────┬──────────────────────────────┘
               │
               │ Webhooks
               ▼
┌─────────────────────────────────────────────┐
│  CAKTO                                      │
│  - Checkout hosted                          │
│  - Processamento de pagamento               │
│  - Notificações (Webhook)                   │
└─────────────────────────────────────────────┘
```

---

## 📁 Estrutura de Diretórios
```
ygor-luan-academy/
├── src/
│   ├── pages/
│   │   ├── index.astro                 # Landing page (pública)
│   │   ├── login.astro                 # Login
│   │   ├── obrigado.astro              # Pós-compra
│   │   ├── dashboard/
│   │   │   ├── index.astro             # Overview do aluno
│   │   │   ├── aulas.astro             # Lista de aulas
│   │   │   ├── aula/[id].astro         # Player de vídeo
│   │   │   ├── mentoria.astro          # Agendamento 1:1
│   │   │   └── perfil.astro            # Configurações
│   │   └── admin/
│   │       ├── index.astro             # Dashboard admin
│   │       ├── aulas/
│   │       │   ├── index.astro         # Gerenciar aulas
│   │       │   ├── nova.astro          # Criar aula
│   │       │   └── [id]/editar.astro   # Editar aula
│   │       ├── alunos.astro            # Lista de alunos
│   │       └── vendas.astro            # Relatório vendas
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.astro
│   │   │   ├── Footer.astro
│   │   │   └── DashboardLayout.astro
│   │   ├── landing/
│   │   │   ├── Hero.astro
│   │   │   ├── Benefits.astro
│   │   │   ├── Testimonials.astro
│   │   │   ├── FAQ.astro
│   │   │   └── CTA.astro
│   │   └── ui/                         # shadcn/ui components
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       └── ...
│   │
│   ├── islands/                        # React islands (client-side)
│   │   ├── CheckoutButton.tsx          # Botão compra
│   │   ├── LoginForm.tsx               # Form login
│   │   ├── VideoPlayer.tsx             # Player Vimeo
│   │   ├── ProgressTracker.tsx         # Progresso aulas
│   │   ├── CalendarWidget.tsx          # Agendamento
│   │   └── AdminLessonForm.tsx         # CRUD aulas
│   │
│   ├── lib/
│   │   ├── supabase.ts                 # Cliente Supabase
│   │   ├── cakto.ts                    # SDK Cakto
│   │   └── utils.ts                    # Helpers gerais
│   │
│   ├── services/
│   │   ├── auth.service.ts             # Lógica auth
│   │   ├── lessons.service.ts          # CRUD aulas
│   │   ├── users.service.ts            # Gestão usuários
│   │   ├── orders.service.ts           # Pedidos
│   │   └── progress.service.ts         # Progresso aluno
│   │
│   ├── types/
│   │   ├── database.types.ts           # Types do Supabase
│   │   ├── cakto.types.ts              # Types Cakto
│   │   └── index.ts
│   │
│   └── middleware/
│       ├── auth.ts                     # Proteção rotas
│       └── admin.ts                    # Verificação role admin
│
├── supabase/
│   ├── migrations/
│   │   ├── 001_initial_schema.sql      # Schema inicial
│   │   ├── 002_rls_policies.sql        # Políticas RLS
│   │   └── 003_functions.sql           # Functions SQL
│   └── functions/
│       └── webhook-pagamento/
│           └── index.ts                # DEPRECATED (era Mercado Pago)
│
├── tests/
│   ├── unit/
│   │   ├── services/
│   │   └── lib/
│   ├── integration/
│   │   ├── auth.test.ts
│   │   └── payment.test.ts
│   └── e2e/
│       ├── landing.spec.ts
│       ├── checkout.spec.ts
│       └── dashboard.spec.ts
│
├── public/
│   ├── images/
│   ├── fonts/
│   └── robots.txt
│
├── .github/
│   └── workflows/
│       ├── ci.yml                      # Testes + lint
│       └── deploy.yml                  # Deploy automático
│
├── docs/
│   ├── API.md                          # Documentação API
│   ├── DEPLOYMENT.md                   # Guia deploy
│   └── CONTRIBUTING.md                 # Guia contribuição
│
├── .env.example
├── .gitignore
├── astro.config.mjs
├── package.json
├── tsconfig.json
├── tailwind.config.mjs
├── vitest.config.ts
├── playwright.config.ts
└── CLAUDE.md                           # Este arquivo
```

---

## 🗄️ Schema do Banco de Dados

### Tabelas Principais

#### `profiles`
```sql
id          UUID PRIMARY KEY (FK: auth.users)
email       TEXT UNIQUE NOT NULL
full_name   TEXT
avatar_url  TEXT
role        TEXT CHECK (role IN ('student', 'admin')) DEFAULT 'student'
created_at  TIMESTAMP DEFAULT NOW()
updated_at  TIMESTAMP DEFAULT NOW()
```

#### `orders`
```sql
id              UUID PRIMARY KEY DEFAULT uuid_generate_v4()
user_id         UUID REFERENCES profiles(id) ON DELETE CASCADE
payment_id      TEXT UNIQUE NOT NULL
status          TEXT CHECK (status IN ('pending', 'approved', 'rejected', 'refunded'))
amount          DECIMAL(10,2) NOT NULL
payment_method  TEXT
created_at      TIMESTAMP DEFAULT NOW()
approved_at     TIMESTAMP
```

#### `lessons`
```sql
id              UUID PRIMARY KEY DEFAULT uuid_generate_v4()
title           TEXT NOT NULL
slug            TEXT UNIQUE NOT NULL
description     TEXT
video_url       TEXT NOT NULL
thumbnail_url   TEXT
duration_minutes INTEGER
module_number   INTEGER NOT NULL
order_number    INTEGER NOT NULL
is_published    BOOLEAN DEFAULT false
created_at      TIMESTAMP DEFAULT NOW()
updated_at      TIMESTAMP DEFAULT NOW()
```

#### `modules`
```sql
id          UUID PRIMARY KEY DEFAULT uuid_generate_v4()
title       TEXT NOT NULL
description TEXT
order_number INTEGER NOT NULL
created_at  TIMESTAMP DEFAULT NOW()
```

#### `user_progress`
```sql
id              UUID PRIMARY KEY DEFAULT uuid_generate_v4()
user_id         UUID REFERENCES profiles(id) ON DELETE CASCADE
lesson_id       UUID REFERENCES lessons(id) ON DELETE CASCADE
completed       BOOLEAN DEFAULT false
watch_time      INTEGER DEFAULT 0
completed_at    TIMESTAMP
UNIQUE(user_id, lesson_id)
```

#### `mentorship_sessions`
```sql
id              UUID PRIMARY KEY DEFAULT uuid_generate_v4()
user_id         UUID REFERENCES profiles(id) ON DELETE CASCADE
scheduled_at    TIMESTAMP NOT NULL
duration_minutes INTEGER DEFAULT 60
status          TEXT CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show'))
meeting_url     TEXT
notes           TEXT
created_at      TIMESTAMP DEFAULT NOW()
```

#### `materials`
```sql
id          UUID PRIMARY KEY DEFAULT uuid_generate_v4()
lesson_id   UUID REFERENCES lessons(id) ON DELETE CASCADE
title       TEXT NOT NULL
file_url    TEXT NOT NULL
file_type   TEXT
file_size   INTEGER
created_at  TIMESTAMP DEFAULT NOW()
```

---

## 🔐 Row Level Security (RLS) Policies

### Profiles
```sql
-- Usuários veem apenas seu próprio perfil
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Usuários podem atualizar seu próprio perfil
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Admin vê todos os perfis
CREATE POLICY "Admin can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

### Lessons
```sql
-- Apenas alunos pagantes veem aulas publicadas
CREATE POLICY "Paid students can view published lessons"
  ON lessons FOR SELECT
  USING (
    is_published = true 
    AND EXISTS (
      SELECT 1 FROM orders 
      WHERE user_id = auth.uid() 
      AND status = 'approved'
    )
  );

-- Admin pode tudo
CREATE POLICY "Admin can manage lessons"
  ON lessons FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

### User Progress
```sql
-- Usuários veem apenas seu progresso
CREATE POLICY "Users can view own progress"
  ON user_progress FOR SELECT
  USING (auth.uid() = user_id);

-- Usuários podem atualizar seu progresso
CREATE POLICY "Users can update own progress"
  ON user_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can modify own progress"
  ON user_progress FOR UPDATE
  USING (auth.uid() = user_id);
```

---

## 🔄 Fluxo de Compra e Acesso

### 1. Landing → Checkout
```typescript
// islands/CheckoutButton.tsx
const handleCheckout = async () => {
  const checkoutUrl = await createCheckout({
    productId: 'mentoria-completa',
    price: 997,
    buyerEmail: email
  });
  
  window.location.href = checkoutUrl;
};
```

### 2. Cakto → Webhook
```typescript
// src/pages/api/webhook/cakto.ts
export const POST: APIRoute = async ({ request }) => {
  const body = await request.json() as CaktoWebhookPayload;

  // Valida secret
  if (!verifyCaktoSecret(body.secret, import.meta.env.CAKTO_WEBHOOK_SECRET)) {
    return new Response('Unauthorized', { status: 401 });
  }

  if (body.event !== 'purchase_approved') {
    return new Response('OK', { status: 200 });
  }

  const { email, name } = body.data.customer;

  // 1. Criar usuário
  const { data: authData } = await supabaseAdmin.auth.admin.createUser({
    email, password: crypto.randomUUID(), email_confirm: true,
  });

  // 2. Criar perfil
  await supabaseAdmin.from('profiles').upsert({ id: userId, email, full_name: name, role: 'student' });

  // 3. Registrar pedido
  await supabaseAdmin.from('orders').upsert({
    user_id: userId, payment_id: body.data.id,
    status: 'approved', amount: body.data.amount / 100,
  }, { onConflict: 'payment_id', ignoreDuplicates: true });

  // 4. Enviar email com link de acesso
  const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({ type: 'recovery', email });
  void EmailService.sendWelcome(email, name, linkData.properties.action_link);

  return new Response('OK', { status: 200 });
};
```

### 3. Login → Dashboard
```astro
---
// src/pages/dashboard/aulas.astro
const { data: { session } } = await supabase.auth.getSession();

if (!session) {
  return Astro.redirect('/login');
}

// Verifica se tem pedido aprovado
const { data: order } = await supabase
  .from('orders')
  .select('*')
  .eq('user_id', session.user.id)
  .eq('status', 'approved')
  .single();

if (!order) {
  return Astro.redirect('/sem-acesso');
}

// Busca aulas
const lessons = await getLessons();
---
```

---

## 🎨 Padrões de Código

### Nomenclatura
- **Arquivos**: kebab-case (`user-profile.tsx`)
- **Components**: PascalCase (`VideoPlayer.tsx`)
- **Functions**: camelCase (`getUserProfile()`)
- **Constants**: SCREAMING_SNAKE_CASE (`MAX_VIDEO_DURATION`)
- **Types/Interfaces**: PascalCase (`User`, `LessonData`)

### Estrutura de Components
```tsx
// islands/VideoPlayer.tsx
import { useState, useEffect } from 'react';
import type { Lesson } from '../types';

interface VideoPlayerProps {
  lesson: Lesson;
  onComplete: () => void;
}

export default function VideoPlayer({ lesson, onComplete }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  
  useEffect(() => {
    // Side effects aqui
  }, [lesson.id]);
  
  const handleComplete = () => {
    onComplete();
  };
  
  return (
    <div className="video-player">
      {/* JSX */}
    </div>
  );
}
```

### Estrutura de Services
```typescript
// services/lessons.service.ts
import { supabase } from '../lib/supabase';
import type { Lesson } from '../types';

export class LessonsService {
  static async getAll(): Promise<Lesson[]> {
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('is_published', true)
      .order('module_number')
      .order('order_number');
    
    if (error) throw new Error(error.message);
    return data;
  }
  
  static async getById(id: string): Promise<Lesson | null> {
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw new Error(error.message);
    return data;
  }
  
  static async markAsCompleted(userId: string, lessonId: string): Promise<void> {
    const { error } = await supabase
      .from('user_progress')
      .upsert({
        user_id: userId,
        lesson_id: lessonId,
        completed: true,
        completed_at: new Date().toISOString()
      });
    
    if (error) throw new Error(error.message);
  }
}
```

---

## 🧪 Estratégia de Testes (TDD)

### Pirâmide de Testes
```
         /\
        /  \  E2E (10%)
       /────\
      /      \  Integration (20%)
     /────────\
    /          \  Unit (70%)
   /────────────\
```

### Unit Tests
```typescript
// tests/unit/services/lessons.service.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { LessonsService } from '../../../src/services/lessons.service';

describe('LessonsService', () => {
  beforeEach(() => {
    // Setup
  });
  
  it('deve retornar lista de aulas publicadas', async () => {
    const lessons = await LessonsService.getAll();
    
    expect(lessons).toBeInstanceOf(Array);
    expect(lessons.every(l => l.is_published)).toBe(true);
  });
  
  it('deve lançar erro quando aula não existe', async () => {
    await expect(
      LessonsService.getById('invalid-id')
    ).rejects.toThrow();
  });
});
```

### Integration Tests
```typescript
// tests/integration/auth.test.ts
import { describe, it, expect } from 'vitest';
import { supabase } from '../../src/lib/supabase';

describe('Authentication Flow', () => {
  it('deve fazer login com credenciais válidas', async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'password123'
    });
    
    expect(error).toBeNull();
    expect(data.user).toBeDefined();
    expect(data.session).toBeDefined();
  });
  
  it('deve rejeitar login com senha incorreta', async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'wrongpassword'
    });
    
    expect(error).not.toBeNull();
    expect(error?.message).toContain('Invalid');
  });
});
```

### E2E Tests (Playwright)
```typescript
// tests/e2e/checkout.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Fluxo de Compra', () => {
  test('deve completar compra com sucesso', async ({ page }) => {
    // 1. Acessa landing
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Ygor Luan Pro');
    
    // 2. Clica em comprar
    await page.click('button:has-text("Comprar Agora")');
    await expect(page).toHaveURL(/cakto/);
    
    // 3. Preenche dados (mock)
    // ... resto do fluxo
  });
});
```

---

## 🚀 Deploy e CI/CD

### GitHub Actions - CI
```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run linter
        run: pnpm run lint

      - name: Run type check
        run: pnpm run type-check

      - name: Run unit tests
        run: pnpm run test:unit

      - name: Run integration tests
        run: pnpm run test:integration
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
```

### Deploy Automático
```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

---

## 📊 Métricas e Monitoramento

### Performance (Core Web Vitals)
- **LCP**: < 0.5s
- **FID**: < 10ms
- **CLS**: 0

### Business
- Taxa de conversão landing → checkout: > 5%
- Taxa de conclusão checkout: > 80%
- Engajamento (aulas assistidas): > 60%
- NPS: > 50

### Ferramentas
- **Analytics**: Google Analytics 4
- **Performance**: Vercel Analytics
- **Errors**: Sentry
- **Uptime**: Better Uptime

---

## 🔒 Segurança

### Checklist
- [ ] HTTPS obrigatório (Vercel default)
- [ ] RLS habilitado em todas as tabelas
- [ ] Validação de entrada (frontend + backend)
- [ ] Rate limiting (Supabase built-in)
- [ ] CSP headers configurados
- [ ] Secrets no .env (nunca commitar)
- [ ] Sanitização de dados do usuário
- [ ] CORS configurado corretamente

### Variáveis de Ambiente
```bash
# .env.example
PUBLIC_SUPABASE_URL=https://xxx.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...  # NUNCA expor no frontend

PUBLIC_CAKTO_CHECKOUT_URL_MENTORIA=https://pay.cakto.com.br/xxx
PUBLIC_CAKTO_CHECKOUT_URL_VIDEOAULAS=https://pay.cakto.com.br/xxx
CAKTO_WEBHOOK_SECRET=xxx

VIMEO_ACCESS_TOKEN=xxx
RESEND_API_KEY=re_xxx

SITE_URL=https://ygorluanpro.com.br
```

---

## 📚 Recursos e Referências

### Documentação
- [Astro Docs](https://docs.astro.build)
- [Supabase Docs](https://supabase.com/docs)
- [Cakto Developers](https://developers.cakto.com.br)
- [Vimeo API](https://developer.vimeo.com/)

### Tutoriais Relevantes
- [Astro + Supabase Auth](https://docs.astro.build/en/guides/authentication/#using-supabase)
- [Implementing RLS](https://supabase.com/docs/guides/auth/row-level-security)
- [Cakto Webhooks](https://developers.cakto.com.br/webhooks)

---

## 🎯 Roadmap de Features Futuras

### MVP (Semanas 1-6) ✅
- Landing page
- Sistema de pagamento
- Autenticação
- Área do aluno
- Aulas em vídeo
- Painel admin básico

### V1.1 (Semanas 7-10)
- [ ] Sistema de certificado
- [ ] Progresso visual (barra de conclusão)
- [ ] Notificações por email
- [ ] Quiz por módulo
- [ ] Materiais complementares por aula

### V1.2 (Semanas 11-14)
- [ ] Sistema de avaliação de aulas
- [ ] Comunidade (comentários)
- [ ] Live classes (streaming)
- [ ] App mobile (React Native)

### V2.0 (Futuro)
- [ ] Gamificação (badges, pontos)
- [ ] Programa de afiliados
- [ ] Multi-idioma
- [ ] Marketplace (outros instrutores)

---

## 🤝 Contribuindo

### Workflow Git
```bash
# Feature branch
git checkout -b feature/nome-da-feature

# Commits semânticos
git commit -m "feat: adiciona player de vídeo"
git commit -m "fix: corrige bug no checkout"
git commit -m "docs: atualiza README"

# Push e PR
git push origin feature/nome-da-feature
```

### Conventional Commits
- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Documentação
- `style`: Formatação (não afeta código)
- `refactor`: Refatoração
- `test`: Adiciona testes
- `chore`: Manutenção

---

## 📞 Contato e Suporte

**Desenvolvedor**: Seu Nome
**Email**: seu@email.com
**GitHub**: @seu-usuario

**Cliente**: Ygor Luan
**Instagram**: @ygorluan

---

## 📝 Licença

Projeto proprietário - Todos os direitos reservados © 2025 Ygor Luan Pro

---

**Última atualização**: 02/03/2026
**Versão do documento**: 1.0.0

## Active Technologies
- TypeScript 5 (strict mode) + Astro 5 (`.astro`) + Deno (supabase/functions/) + Astro 5, React 19, Supabase JS v2, Vitest 4, Resend (001-code-review)
- N/A (processo de review, sem escrita em banco) (001-code-review)

## Recent Changes
- 001-code-review: Added TypeScript 5 (strict mode) + Astro 5 (`.astro`) + Deno (supabase/functions/) + Astro 5, React 19, Supabase JS v2, Vitest 4, Resend
