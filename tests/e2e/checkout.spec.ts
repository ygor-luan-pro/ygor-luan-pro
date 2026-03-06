import { test, expect } from '@playwright/test';

test.describe('Fluxo de Checkout', () => {
  test('exibe erro com e-mail inválido', async ({ page }) => {
    await page.goto('/');

    const emailInput = page.locator('input[type="email"]').first();
    await emailInput.fill('nao-e-email');
    await emailInput.press('Enter');

    const validationMessage = await emailInput.evaluate(
      (el: HTMLInputElement) => el.validationMessage,
    );
    expect(validationMessage).not.toBe('');
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
