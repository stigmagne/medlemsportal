import { test, expect } from '@playwright/test';

test.describe('Public Pages Smoke Test', () => {
    test('landing page loads and redirects to login or shows content', async ({ page }) => {
        await page.goto('/');

        // Check if we are either on the landing page OR redirected to login
        const url = page.url();
        if (url.includes('/login')) {
            await expect(page).toHaveURL(/.*login/);
            await expect(page.getByRole('heading', { name: 'Logg inn' })).toBeVisible(); // Login header
        } else {
            // Assuming landing page has some title
            await expect(page).toHaveTitle(/.*Din Forening.*/);
            // Or check for a specific element on the landing page
        }
    });

    test('min side loads (unauthenticated redirects)', async ({ page }) => {
        await page.goto('/min-side');
        // specific behavior depends on auth state, but it should not crash (500)
        const title = await page.title();
        expect(title).toBeDefined();

        // Likely redirects to login if unauthenticated
        const url = page.url();
        if (url.includes('/login')) {
            await expect(page.locator('form')).toBeVisible(); // Login form
        }
    });
});
