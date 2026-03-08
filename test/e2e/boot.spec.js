import { test, expect } from '@playwright/test';

test.describe('OS Boot Sequence', () => {

    test('should boot successfully and match desktop visual snapshot', async ({ page }) => {
        // Go to the main page
        await page.goto('/');

        // 1. Check BIOS boot screen is visible
        const bootScreen = page.locator('#boot-screen');
        await expect(bootScreen).toBeVisible();

        // 2. Wait for the boot screen to disappear (meaning boot finished)
        await expect(bootScreen).toBeHidden({ timeout: 15000 }); // Boot can take ~4-8 seconds

        // 3. Desktop should be visible
        const desktop = page.locator('#desktop');
        await expect(desktop).toBeVisible();

        // 4. Ensure Start button is visible
        const startBtn = page.locator('#start-button');
        await expect(startBtn).toBeVisible();

        // Wait a bit for animations/shaders to stabilize
        await page.waitForTimeout(1000);

        // 5. Take full page snapshot for visual regression
        // We mask the clock since time changes
        await expect(page).toHaveScreenshot('desktop-boot.png', {
            mask: [page.locator('.clock')],
            maxDiffPixelRatio: 0.15,
            timeout: 10000
        });
    });

    test('should open start menu on click and match visual snapshot', async ({ page }) => {
        await page.goto('/');

        // Wait for boot 
        await expect(page.locator('#boot-screen')).toBeHidden({ timeout: 15000 });

        const startBtn = page.locator('#start-button');
        const startMenu = page.locator('#start-menu');

        await expect(startMenu).toBeHidden();

        // Click start button
        await startBtn.click();

        // Expect menu to be visible
        await expect(startMenu).toBeVisible();

        // Wait for animation
        await page.waitForTimeout(500);

        // Snapshot
        await expect(page).toHaveScreenshot('start-menu-open.png', {
            mask: [page.locator('.clock')],
            maxDiffPixelRatio: 0.15,
            timeout: 10000
        });
    });
});
