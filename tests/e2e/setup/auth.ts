/**
 * E2E Authentication Setup
 * Creates test user and logs in programmatically
 */

import { createClient } from '@supabase/supabase-js';
import type { Page } from '@playwright/test';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'http://localhost:54321';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Test user credentials
const TEST_USER = {
    email: `test-${Date.now()}@roomz-e2e.com`,
    password: 'TestPassword123!',
    full_name: 'E2E Test User',
};

/**
 * Create a test user via Supabase Admin API
 */
export async function createTestUser() {
    if (!SERVICE_ROLE_KEY) {
        console.warn('SUPABASE_SERVICE_ROLE_KEY not set, skipping user creation');
        return null;
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });

    // Delete existing test user if exists
    const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', TEST_USER.email)
        .single();

    if (existingUser) {
        await supabase.auth.admin.deleteUser(existingUser.id);
    }

    // Create new test user
    const { data: user, error } = await supabase.auth.admin.createUser({
        email: TEST_USER.email,
        password: TEST_USER.password,
        email_confirm: true,
        user_metadata: {
            full_name: TEST_USER.full_name,
        },
    });

    if (error) {
        console.error('Failed to create test user:', error);
        return null;
    }

    console.log('Created test user:', TEST_USER.email);
    return { ...user.user, password: TEST_USER.password };
}

/**
 * Login and get session token
 */
export async function loginTestUser(page: Page) {
    // Navigate to login page first
    await page.goto('/login');

    // Perform login via UI (most reliable for session cookies)
    await page.fill('[data-testid="email-input"]', TEST_USER.email);
    await page.fill('[data-testid="password-input"]', TEST_USER.password);
    await page.click('[data-testid="login-button"]').catch(() => {
        // Fallback to button text if testid not found
        return page.click('button:has-text("Đăng nhập")');
    });

    // Wait for navigation to complete
    await page.waitForURL(/\/(swap|)$/, { timeout: 10000 });

    // Store session data
    const session = await page.evaluate(() => {
        return localStorage.getItem('supabase.auth.token');
    });

    return session;
}

/**
 * Setup auth state for tests
 */
export async function setupAuth(page: Page) {
    // Create user first
    const user = await createTestUser();

    if (!user) {
        // Fallback: try to login with existing credentials
        console.log('Using existing test credentials');
    }

    // Login
    await loginTestUser(page);

    // Verify logged in
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
        throw new Error('Failed to login test user');
    }

    return user;
}

/**
 * Cleanup test user after tests
 */
export async function cleanupTestUser() {
    if (!SERVICE_ROLE_KEY) return;

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });

    // Find and delete test user
    const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('email', TEST_USER.email)
        .single();

    if (user) {
        await supabase.auth.admin.deleteUser(user.id);
        console.log('Cleaned up test user:', TEST_USER.email);
    }
}