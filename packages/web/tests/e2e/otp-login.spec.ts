import { expect, test } from '@playwright/test';
import { mockOtpLoginFlow } from './helpers/mockApi';

test.describe('OTP login flow', () => {
  test('user can request OTP and verify into search', async ({ page }) => {
    await mockOtpLoginFlow(page);

    await page.goto('/login');

    await page.getByRole('textbox', { name: /Email/i }).fill('otp-user@example.com');
    await page.getByRole('button', { name: /Nhận mã OTP để đăng nhập/i }).click();

    await expect(page.getByRole('heading', { name: /Xác thực email của bạn/i })).toBeVisible();
    await expect(page.locator('#otp-email')).toHaveValue('otp-user@example.com');

    await page.getByRole('textbox', { name: /Ma xac thuc gom sau chu so/i }).fill('123456');
    await page.getByRole('button', { name: /Đăng nhập vào RommZ/i }).click();

    await page.waitForURL('**/search');
    await expect(page.locator('input[role="combobox"]').first()).toBeVisible();
  });
});
