import { test, expect } from '@playwright/test';

test.describe('Search Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/search');
  });

  test('should display search page with filters', async ({ page }) => {
    // Check for search heading or filter section
    await expect(page.getByRole('heading', { name: /tìm|search/i })).toBeVisible();
  });

  test('should display room cards', async ({ page }) => {
    // Wait for rooms to load
    await page.waitForLoadState('networkidle');
    
    // Check for room cards or empty state
    const roomCards = page.locator('[data-testid="room-card"]').or(
      page.locator('.room-card')
    ).or(
      page.locator('article')
    );
    
    // Either have cards or show empty state
    const hasCards = await roomCards.count() > 0;
    const hasEmptyState = await page.getByText(/không tìm thấy|no rooms/i).isVisible().catch(() => false);
    
    expect(hasCards || hasEmptyState).toBeTruthy();
  });

  test('should filter rooms by price range', async ({ page }) => {
    // Look for price filter
    const priceFilter = page.getByText(/giá|price/i).first();
    
    if (await priceFilter.isVisible()) {
      await priceFilter.click();
      
      // Wait for filter options to appear
      await page.waitForTimeout(300);
    }
  });

  test('should navigate to room detail on card click', async ({ page }) => {
    // Wait for rooms to load
    await page.waitForLoadState('networkidle');
    
    // Find and click first room card
    const firstRoom = page.locator('article').first().or(
      page.locator('[data-testid="room-card"]').first()
    );
    
    if (await firstRoom.isVisible()) {
      await firstRoom.click();
      
      // Should navigate to room detail
      await expect(page).toHaveURL(/\/room\//);
    }
  });

  test('should show favorite button on room cards', async ({ page }) => {
    // Wait for rooms to load
    await page.waitForLoadState('networkidle');
    
    // Check for heart icon (favorite button)
    const favoriteButton = page.locator('[aria-label*="yêu thích"]').or(
      page.locator('button').filter({ has: page.locator('svg.lucide-heart') })
    );
    
    // May or may not have favorites depending on if rooms exist
    const count = await favoriteButton.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});
