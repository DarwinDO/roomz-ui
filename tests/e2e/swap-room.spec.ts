/**
 * Swap Room E2E Tests
 * Following Testing Patterns - Critical User Flows
 */

import { test, expect } from '@playwright/test';
import { setupAuth, cleanupTestUser } from './setup/auth';

test.describe('Swap Room Feature', () => {
    test.beforeEach(async ({ page }) => {
        // Create new test user and login
        await setupAuth(page);
    });

    test.afterAll(async () => {
        // Cleanup test user after all tests
        await cleanupTestUser();
    });

    test.describe('SwapRoomPage', () => {
        test('should display sublet listings', async ({ page }) => {
            // Arrange
            await page.goto('/swap');

            // Assert
            await expect(page.locator('text=SwapRoom')).toBeVisible();
            await expect(page.locator('text=Tìm phòng')).toBeVisible();
            await expect(page.locator('text=Tin cho thuê đang mở')).toBeVisible();
        });

        test('should filter sublets by location', async ({ page }) => {
            // Arrange
            await page.goto('/swap');

            // Act
            await page.fill('[placeholder="Tìm kiếm theo khu vực..."]', 'Quận 1');
            await page.waitForTimeout(500); // Debounce

            // Assert
            await expect(page.locator('text=Quận 1')).toBeVisible();
        });

        test('should open apply dialog', async ({ page }) => {
            // Arrange
            await page.goto('/swap');

            // Act
            await page.locator('text=Đăng ký thuê').first().click();

            // Assert
            await expect(page.locator('text=Đăng ký thuê phòng')).toBeVisible();
            await expect(page.locator('text=Ngày dọn vào')).toBeVisible();
        });

        test('should open swap request dialog', async ({ page }) => {
            // Arrange
            await page.goto('/swap');

            // Act
            await page.locator('text=Đề nghị hoán đổi').first().click();

            // Assert
            await expect(page.locator('text=Yêu cầu hoán đổi phòng')).toBeVisible();
        });
    });

    test.describe('SwapMatchesPage', () => {
        test('should display match suggestions', async ({ page }) => {
            // Arrange
            await page.goto('/swap-matches');

            // Assert
            await expect(page.locator('text=Gợi ý hoán đổi')).toBeVisible();
            await expect(page.locator('text=Thuật toán tìm kiếm thông minh')).toBeVisible();
        });

        test('should accept a match', async ({ page }) => {
            // Arrange
            await page.goto('/swap-matches');

            // Wait for matches to load
            await page.waitForSelector('text=Gửi yêu cầu', { timeout: 5000 });

            // Act
            await page.locator('text=Gửi yêu cầu').first().click();

            // Assert
            await expect(page.locator('text=Yêu cầu hoán đổi phòng')).toBeVisible();
        });
    });

    test.describe('SwapRequestsPage', () => {
        test('should display incoming requests', async ({ page }) => {
            // Arrange
            await page.goto('/swap-requests');

            // Assert
            await expect(page.locator('text=Yêu cầu hoán đổi')).toBeVisible();
            await expect(page.locator('text=Đến')).toBeVisible();
            await expect(page.locator('text=Đã gửi')).toBeVisible();
        });

        test('should accept incoming request', async ({ page }) => {
            // Arrange
            await page.goto('/swap-requests');

            // Act - click on Accept if there's a pending request
            const acceptButton = page.locator('text=Chấp nhận').first();
            if (await acceptButton.isVisible().catch(() => false)) {
                await acceptButton.click();

                // Assert
                await expect(page.locator('text=Đã chấp nhận')).toBeVisible();
            }
        });
    });

    test.describe('MySubletsPage', () => {
        test('should display user sublets', async ({ page }) => {
            // Arrange
            await page.goto('/my-sublets');

            // Assert
            await expect(page.locator('text=Tin đăng của tôi')).toBeVisible();
            await expect(page.locator('text=Đang hoạt động')).toBeVisible();
        });

        test('should show stats cards', async ({ page }) => {
            // Arrange
            await page.goto('/my-sublets');

            // Assert
            await expect(page.locator('text=Đang hoạt động')).toBeVisible();
            await expect(page.locator('text=Chờ duyệt')).toBeVisible();
            await expect(page.locator('text=Đơn đăng ký')).toBeVisible();
        });

        test('should navigate to create sublet', async ({ page }) => {
            // Arrange
            await page.goto('/my-sublets');

            // Act
            await page.click('text=Đăng phòng mới');

            // Assert
            await expect(page).toHaveURL(/.*post-room.*/);
        });
    });

    test.describe('End-to-End Flow', () => {
        test('complete swap flow', async ({ page }) => {
            // Step 1: Browse sublets
            await page.goto('/swap');
            await expect(page.locator('text=Tin cho thuê đang mở')).toBeVisible();

            // Step 2: Apply for a sublet
            await page.locator('text=Đăng ký thuê').first().click();
            await page.fill('input[type="date"]', '2024-06-01');
            await page.click('text=Gửi đơn đăng ký');

            // Assert success
            await expect(page.locator('text=Thành công')).toBeVisible();

            // Step 3: Check My Sublets
            await page.goto('/my-sublets');
            await expect(page.locator('text=Tin đăng của tôi')).toBeVisible();

            // Step 4: Check Swap Requests
            await page.goto('/swap-requests');
            await expect(page.locator('text=Yêu cầu hoán đổi')).toBeVisible();
        });
    });
});
