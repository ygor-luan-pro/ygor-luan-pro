import { test, expect } from '@playwright/test';

test.describe('Fluxo de Checkout', () => {
  test('exibe link de checkout no hero', async ({ page }) => {
    await page.goto('/');

    const ctaLink = page.locator('a.btn-primary').first();
    await expect(ctaLink).toBeVisible();
    await expect(ctaLink).toHaveText(/Quero começar/);
  });

  test('página de obrigado exibe conteúdo de sucesso', async ({ page }) => {
    await page.goto('/obrigado');
    await expect(page.locator('h1').first()).toContainText('Bem-vindo');
  });

  test('página de obrigado com status=pending exibe conteúdo correto', async ({ page }) => {
    await page.goto('/obrigado?status=pending');
    await expect(page.locator('h1').first()).toContainText('análise');
  });
});
