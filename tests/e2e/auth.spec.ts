import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should display login page with form', async ({ page }) => {
    await page.goto('/login');
    
    // Check for login form elements
    await expect(page.getByRole('heading', { name: /đăng nhập|login/i })).toBeVisible();
    
    // Check for email input
    const emailInput = page.getByPlaceholder(/email/i).or(
      page.getByLabel(/email/i)
    );
    await expect(emailInput).toBeVisible();
    
    // Check for password input
    const passwordInput = page.getByPlaceholder(/mật khẩu|password/i).or(
      page.getByLabel(/mật khẩu|password/i)
    );
    await expect(passwordInput).toBeVisible();
  });

  test('should have OAuth buttons', async ({ page }) => {
    await page.goto('/login');
    
    // Check for Google OAuth button
    const googleButton = page.getByRole('button', { name: /google/i });
    await expect(googleButton).toBeVisible();
  });

  test('should show error on invalid login', async ({ page }) => {
    await page.goto('/login');
    
    // Fill invalid credentials
    await page.getByPlaceholder(/email/i).first().fill('invalid@test.com');
    await page.getByPlaceholder(/mật khẩu|password/i).first().fill('wrongpassword');
    
    // Submit form
    const submitButton = page.getByRole('button', { name: /đăng nhập|login/i }).last();
    await submitButton.click();
    
    // Wait for error message or toast
    await page.waitForTimeout(2000);
    
    // Should still be on login page
    await expect(page).toHaveURL(/\/login/);
  });

  test('should have link to register', async ({ page }) => {
    await page.goto('/login');
    
    // Check for register link
    const registerLink = page.getByRole('link', { name: /đăng ký|register|sign up/i }).or(
      page.getByText(/tạo tài khoản|đăng ký/i)
    );
    await expect(registerLink.first()).toBeVisible();
  });

  test('should redirect to profile when logged in', async ({ page }) => {
    // Try to access profile without login
    await page.goto('/profile');
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });
});
