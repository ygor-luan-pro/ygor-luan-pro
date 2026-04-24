import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

const E2E_EMAIL = process.env.E2E_TEST_EMAIL ?? '';
const E2E_PASSWORD = process.env.E2E_TEST_PASSWORD ?? '';

function firstLessonLink(page: Page) {
  return page.locator('main a[href^="/dashboard/aula/"]').first();
}

async function waitForLoginFormReady(page: Page) {
  await page.waitForFunction(() => {
    const island = document.querySelector('astro-island[component-url="/src/islands/LoginForm.tsx"]');
    return island instanceof HTMLElement && !island.hasAttribute('ssr');
  });
}

test.describe('Proteção de rotas', () => {
  test('redireciona /dashboard para /login se não autenticado', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('redireciona /admin para /login se não autenticado', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/login/);
  });

  test('página de login exibe formulário', async ({ page }) => {
    await page.goto('/login');
    await waitForLoginFormReady(page);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('login com credenciais inválidas exibe erro', async ({ page }) => {
    await page.goto('/login');
    await waitForLoginFormReady(page);
    await page.fill('input[type="email"]', 'invalido@test.com');
    await page.fill('input[type="password"]', 'senhaerrada');
    await Promise.all([
      page.waitForResponse((response) => (
        response.url().includes('/api/auth/login') && response.status() === 401
      )),
      page.click('button[type="submit"]'),
    ]);

    await expect(page.getByText('E-mail ou senha inválidos')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Fluxo do aluno autenticado', () => {
  test.skip(!E2E_EMAIL || !E2E_PASSWORD, 'E2E_TEST_EMAIL e E2E_TEST_PASSWORD não definidos');

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    const response = await page.request.post('/api/auth/login', {
      data: { email: E2E_EMAIL, password: E2E_PASSWORD },
      headers: { Origin: process.env.E2E_ORIGIN ?? 'http://localhost:4321' },
    });
    if (!response.ok()) {
      throw new Error(`Login falhou: ${response.status()} ${await response.text()}`);
    }
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });
  });

  test('dashboard exibe progresso do aluno', async ({ page }) => {
    await expect(page.locator('h1, h2').first()).toBeVisible();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('página de aulas lista os módulos e aulas', async ({ page }) => {
    await page.goto('/dashboard/aulas');
    await expect(page.getByRole('heading', { name: 'Aulas' })).toBeVisible();
    await expect(firstLessonLink(page)).toBeVisible({ timeout: 5000 });
    expect(await page.locator('main a[href^="/dashboard/aula/"]').count()).toBeGreaterThan(0);
  });

  test('navega para o player ao clicar em uma aula', async ({ page }) => {
    await page.goto('/dashboard/aulas');
    await firstLessonLink(page).click();
    await expect(page).toHaveURL(/\/dashboard\/aula\/.+/, { timeout: 5000 });
  });

  test('página do player exibe controle de conclusão da aula', async ({ page }) => {
    await page.goto('/dashboard/aulas');
    await firstLessonLink(page).click();
    await expect(page).toHaveURL(/\/dashboard\/aula\/.+/);
    const completeBtn = page.locator('button', { hasText: /conclu/i });
    const completedMsg = page.locator('p', { hasText: /conclu/i });
    await expect(completeBtn.or(completedMsg)).toBeVisible({ timeout: 5000 });
  });
});
