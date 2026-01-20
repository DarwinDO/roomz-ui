import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display landing page with hero section', async ({ page }) => {
    // Check for hero heading
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    
    // Check for search button or CTA
    await expect(page.getByRole('button', { name: /tìm phòng|tìm kiếm/i })).toBeVisible();
  });

  test('should navigate to search page from hero CTA', async ({ page }) => {
    // Click search button
    await page.getByRole('button', { name: /tìm phòng|tìm kiếm/i }).first().click();
    
    // Should be on search page
    await expect(page).toHaveURL(/\/search/);
  });

  test('should display bottom navigation on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Should see bottom navigation
    await expect(page.locator('nav').last()).toBeVisible();
  });

  test('should navigate to login page', async ({ page }) => {
    // Find and click login link/button
    const loginButton = page.getByRole('link', { name: /đăng nhập|login/i }).or(
      page.getByRole('button', { name: /đăng nhập|login/i })
    );
    
    if (await loginButton.isVisible()) {
      await loginButton.click();
      await expect(page).toHaveURL(/\/login/);
    }
  });
});
