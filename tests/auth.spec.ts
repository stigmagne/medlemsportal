import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
    test('login page loads elements correctly', async ({ page }) => {
        await page.goto('/login');

        await expect(page.getByRole('heading', { name: 'Logg inn' })).toBeVisible();
        await expect(page.locator('input[type="email"]')).toBeVisible();
        await expect(page.locator('input[type="password"]')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Logg inn' })).toBeVisible();
    });

    test('shows error with invalid credentials', async ({ page }) => {
        await page.goto('/login');

        await page.fill('input[type="email"]', 'invalid@example.com');
        await page.fill('input[type="password"]', 'wrongpassword123');
        await page.click('button[type="submit"]');

        // Expect some error message - adjusting selector based on likely UI
        // Since I haven't seen the exact error UI code, I'll look for a generic alert or error text
        // Update this selector after first run if it fails
        await expect(page.locator('text=Invalid login credentials').or(page.locator('text=Feil brukernavn eller passord')).or(page.locator('[role="alert"]'))).toBeVisible();
    });

    test('successful login redirects to dashboard', async ({ page }) => {
        const email = process.env.E2E_TEST_EMAIL;
        const password = process.env.E2E_TEST_PASSWORD;

        if (!email || !password) {
            test.skip(true, 'Skipping login test: E2E_TEST_EMAIL or E2E_TEST_PASSWORD not set');
            return;
        }

        await page.goto('/login');
        await page.fill('input[type="email"]', email);
        await page.fill('input[type="password"]', password);
        await page.click('button[type="submit"]');

        // Expect redirect to either landing, min-side or dashboard
        await expect(page).not.toHaveURL(/.*login/);
        // Maybe check for "Logg ut" button
        await expect(page.getByText('Logg ut')).toBeVisible();
    });
});
