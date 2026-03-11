import { expect, test } from '@playwright/test';

test.describe('public smoke flows', () => {
  test('landing page loads and public navigation reaches search', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle(/rommz/i);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    await page.getByRole('button', { name: /Tìm phòng/i }).first().click();

    await expect(page).toHaveURL(/\/search(?:\?.*)?$/);
    await expect(page.getByRole('combobox', { name: /Tìm kiếm địa điểm/i })).toBeVisible();
    await expect(page.getByText(/phòng còn trống/i)).toBeVisible();
  });

  test('protected user routes redirect unauthenticated visitors to login', async ({ page }) => {
    await page.goto('/payment');

    await page.waitForURL('**/login');
    await expect(page.getByLabel('Email').first()).toBeVisible();
  });

  test('protected admin routes redirect unauthenticated visitors to admin login', async ({ page }) => {
    await page.goto('/admin/dashboard');

    await page.waitForURL('**/admin/login');
    await expect(page.getByRole('heading', { name: /Admin/i })).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
  });
});
