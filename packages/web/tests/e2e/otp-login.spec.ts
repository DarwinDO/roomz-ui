import { expect, test } from '@playwright/test';
import { mockOtpLoginFlow } from './helpers/mockApi';

test.describe('OTP login flow', () => {
  test('user can request OTP and verify into search', async ({ page }) => {
    await mockOtpLoginFlow(page);

    await page.goto('/login');

    await page.getByRole('textbox', { name: 'Email' }).fill('otp-user@example.com');
    await page.getByRole('button', { name: /Gửi mã đăng nhập/i }).click();

    await expect(page.getByRole('heading', { name: /Nhập mã OTP/i })).toBeVisible();
    await expect(page.locator('#otp-email')).toHaveValue('otp-user@example.com');

    await page.getByLabel('Mã OTP').fill('123456');
    await page.getByRole('button', { name: /Xác thực và đăng nhập/i }).click();

    await page.waitForURL('**/search');
    await expect(page.locator('input[role="combobox"]').first()).toBeVisible();
  });
});
