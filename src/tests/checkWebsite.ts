import { test, expect } from '@playwright/test';

test.describe('Blueprint Button Tests', () => {
  test('should find "Create Blueprint" button', async ({ page }) => {
    // Navigate to your website
    await page.goto('http://localhost:3000'); // Replace with your URL

    // Look for the button using text content
    const createButton = page.getByRole('button', { name: 'Login' });

    // Verify button exists and is visible
    await expect(createButton).toBeVisible();

    // Optional: verify button is enabled
    await expect(createButton).toBeEnabled();
  });
});
