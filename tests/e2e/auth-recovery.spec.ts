import { test, expect } from '@playwright/test';

const E2E_EMAIL = process.env.E2E_TEST_EMAIL ?? '';
const E2E_PASSWORD = process.env.E2E_TEST_PASSWORD ?? '';
const E2E_ORIGIN = process.env.E2E_ORIGIN ?? 'http://localhost:4321';

test.describe('Login — proteção e erros', () => {
  test('exibe erro genérico com credenciais inválidas', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'naoexiste@exemplo.com');
    await page.fill('input[type="password"]', 'senhaerrada');
    await page.click('button[type="submit"]');
    await expect(page.getByText(/e-mail ou senha inv/i)).toBeVisible({ timeout: 5000 });
  });

  test('rejeita POST com Origin de outro domínio (403)', async ({ request }) => {
    const res = await request.post('/api/auth/login', {
      data: { email: 'x@x.com', password: 'senha' },
      headers: { 'Content-Type': 'application/json', Origin: 'https://evil.example.com' },
    });
    expect(res.status()).toBe(403);
  });

  test('rate limit: 6 tentativas seguidas retornam 429', async ({ request }) => {
    const payload = { email: 'brute@example.com', password: 'senhaerrada' };
    const headers = { 'Content-Type': 'application/json', Origin: E2E_ORIGIN };
    let lastStatus = 0;
    for (let i = 0; i < 6; i++) {
      const res = await request.post('/api/auth/login', { data: payload, headers });
      lastStatus = res.status();
    }
    expect(lastStatus).toBe(429);
  });
});

test.describe('Redirecionamentos de acesso', () => {
  test('/dashboard sem auth → /login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('/admin sem auth → /login', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Fluxo de reset de senha', () => {
  test.skip(!E2E_EMAIL || !E2E_PASSWORD, 'E2E_TEST_EMAIL e E2E_TEST_PASSWORD não definidos');

  test('form exige senha ≥ 8 chars antes do envio', async ({ page }) => {
    await page.goto('/login');
    const loginRes = await page.request.post('/api/auth/login', {
      data: { email: E2E_EMAIL, password: E2E_PASSWORD },
      headers: { Origin: E2E_ORIGIN },
    });
    if (!loginRes.ok()) test.skip();

    await page.goto('/redefinir-senha?recovery=1');
    await page.waitForSelector('input[type="password"]');
    const [novaSenha, confirmar] = await page.locator('input[type="password"]').all();
    await novaSenha.fill('curta');
    await confirmar.fill('curta');
    await page.click('button[type="submit"]');
    const res = await page.request.post('/api/auth/update-password', {
      data: { password: 'curta', isRecovery: true },
      headers: { 'Content-Type': 'application/json', Origin: E2E_ORIGIN },
    });
    expect(res.status()).toBe(422);
  });
});
