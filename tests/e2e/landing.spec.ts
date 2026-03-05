import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('exibe o título principal', async ({ page }) => {
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('exibe seção de benefícios', async ({ page }) => {
    await page.locator('#beneficios').scrollIntoViewIfNeeded();
    await expect(page.locator('#beneficios')).toBeVisible();
  });

  test('exibe campo de e-mail no hero', async ({ page }) => {
    await expect(page.locator('input[type="email"]').first()).toBeVisible();
  });

  test('exibe link para login', async ({ page }) => {
    await expect(page.locator('a[href="/login"]')).toBeVisible();
  });

  test('FAQ está presente', async ({ page }) => {
    await page.locator('#faq').scrollIntoViewIfNeeded();
    await expect(page.locator('#faq')).toBeVisible();
  });
});
