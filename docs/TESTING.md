# Estrategia de Testes (TDD Seletivo)

## Testing Trophy (2026)

```
         /\
        /  \  E2E (20%) — fluxos criticos end-to-end
       /────\
      /      \  Integration (40%) — limites entre modulos
     /────────\
    /          \  Unit (40%) — logica pura, utils, regras
   /────────────\
  / Static (base) \  types + lint (sempre)
 /──────────────────\
```

Modelo "Testing Trophy" prioriza integration tests: codigo gerado por IA
quebra mais nos limites entre modulos do que dentro de funcoes puras.

## TDD Seletivo

**Dominio critico (TDD obrigatorio — Red -> Green -> Refactor)**:
- `src/services/**` — logica de negocio
- `src/lib/supabase/**` — auth, RLS, queries
- `src/pages/api/**` — handlers, webhooks Cakto
- Migrations SQL com RLS
- Templates de email (snapshot obrigatorio)
- Helpers de checkout, orders, pagamentos

**UI pura / scaffolding (test-after aceito)**:
- Componentes de apresentacao sem estado
- Layouts, estilos, rotas estaticas
- Configuracoes Astro

Cobertura protegida pelo Quality Gate Ratchet — nao regride independente da abordagem.

## Unit Tests

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

  it('deve lancar erro quando aula nao existe', async () => {
    await expect(
      LessonsService.getById('invalid-id')
    ).rejects.toThrow();
  });
});
```

## Integration Tests

```typescript
// tests/integration/auth.test.ts
import { describe, it, expect } from 'vitest';
import { supabase } from '../../src/lib/supabase';

describe('Authentication Flow', () => {
  it('deve fazer login com credenciais validas', async () => {
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

## E2E Tests (Playwright)

```typescript
// tests/e2e/checkout.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Fluxo de Compra', () => {
  test('deve completar compra com sucesso', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Ygor Luan Academy');

    await page.click('button:has-text("Comprar Agora")');
    await expect(page).toHaveURL(/cakto/);
  });
});
```
