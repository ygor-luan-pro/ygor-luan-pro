import { test, expect } from '@playwright/test';

const E2E_EMAIL = process.env.E2E_TEST_EMAIL ?? '';
const E2E_PASSWORD = process.env.E2E_TEST_PASSWORD ?? '';

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
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('login com credenciais inválidas exibe erro', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'invalido@test.com');
    await page.fill('input[type="password"]', 'senhaerrada');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=inválidos')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Fluxo do aluno autenticado', () => {
  test.skip(!E2E_EMAIL || !E2E_PASSWORD, 'E2E_TEST_EMAIL e E2E_TEST_PASSWORD não definidos');

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    const response = await page.request.post('/api/auth/login', {
      data: { email: E2E_EMAIL, password: E2E_PASSWORD },
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
    await expect(page.locator('text=Módulo 1')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Módulo 2')).toBeVisible();
    await expect(page.locator('text=Módulo 3')).toBeVisible();
    await expect(page.locator('text=Bem-vindo ao Ygor Luan Pro')).toBeVisible();
  });

  test('navega para o player ao clicar em uma aula', async ({ page }) => {
    await page.goto('/dashboard/aulas');
    await page.locator('text=Bem-vindo ao Ygor Luan Pro').click();
    await expect(page).toHaveURL(/\/dashboard\/aula\/.+/, { timeout: 5000 });
  });

  test('página do player exibe botão de concluir aula', async ({ page }) => {
    await page.goto('/dashboard/aulas');
    await page.locator('text=Bem-vindo ao Ygor Luan Pro').click();
    await expect(page).toHaveURL(/\/dashboard\/aula\/.+/);
    const completeBtn = page.locator('button', { hasText: /conclu/i });
    await expect(completeBtn).toBeVisible({ timeout: 5000 });
  });
});
