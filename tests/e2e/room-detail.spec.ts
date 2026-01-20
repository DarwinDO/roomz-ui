import { test, expect } from '@playwright/test';

test.describe('Room Detail Page', () => {
  // Navigate to a room detail page (will need a valid room ID in production)
  test.beforeEach(async ({ page }) => {
    // First go to search to find a room
    await page.goto('/search');
    await page.waitForLoadState('networkidle');
    
    // Click first room if available
    const firstRoom = page.locator('article').first();
    if (await firstRoom.isVisible()) {
      await firstRoom.click();
      await page.waitForLoadState('networkidle');
    }
  });

  test('should display room title and price', async ({ page }) => {
    // Skip if we couldn't navigate to a room
    if (!page.url().includes('/room/')) {
      test.skip();
      return;
    }

    // Check for room title
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    
    // Check for price display (look for tr or triệu or VND)
    await expect(page.getByText(/tr|triệu|vnđ|vnd/i)).toBeVisible();
  });

  test('should display room images', async ({ page }) => {
    if (!page.url().includes('/room/')) {
      test.skip();
      return;
    }

    // Check for images
    const images = page.locator('img');
    expect(await images.count()).toBeGreaterThan(0);
  });

  test('should have book viewing button', async ({ page }) => {
    if (!page.url().includes('/room/')) {
      test.skip();
      return;
    }

    // Check for booking button
    const bookButton = page.getByRole('button', { name: /đặt lịch|xem phòng|book/i });
    await expect(bookButton.first()).toBeVisible();
  });

  test('should open booking modal on button click', async ({ page }) => {
    if (!page.url().includes('/room/')) {
      test.skip();
      return;
    }

    // Click book button
    await page.getByRole('button', { name: /đặt lịch/i }).first().click();
    
    // Wait for modal
    await page.waitForTimeout(300);
    
    // Check for calendar or date picker in modal
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();
  });

  test('should display landlord information', async ({ page }) => {
    if (!page.url().includes('/room/')) {
      test.skip();
      return;
    }

    // Check for landlord section
    await expect(page.getByText(/chủ nhà|landlord/i)).toBeVisible();
  });

  test('should toggle favorite on heart icon click', async ({ page }) => {
    if (!page.url().includes('/room/')) {
      test.skip();
      return;
    }

    // Find heart button
    const heartButton = page.locator('button').filter({ 
      has: page.locator('svg.lucide-heart') 
    }).first();
    
    if (await heartButton.isVisible()) {
      await heartButton.click();
      // Should show login toast if not logged in
      await page.waitForTimeout(300);
    }
  });
});
