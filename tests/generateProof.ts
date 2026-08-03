import { test, expect } from '@playwright/test';
import { dragAndDropFile } from '../src/test-utils/DragAndDropFile';

test('test proof generation', async ({ page }) => {
  // Real circom proving takes ~2 min on staging.
  test.setTimeout(5 * 60 * 1000);

  // zkemailverify/test_0001_2: navigated by id directly (has no "twitter" in its
  // title/description/slug, so it won't surface under a text search).
  await page.goto('http://localhost:3000/f63c7198-76b1-413c-b785-7655ebdaaec1');
  await page.waitForLoadState('networkidle');

  // check the connect emails page
  await expect(page.getByRole('heading', { name: 'Connect emails' })).toBeVisible();

  // upload the email file. We need another component for this. https://stackoverflow.com/a/77738836
  await dragAndDropFile(
    page,
    '#drag-and-drop-emails',
    'tests/assets/PasswordResetRequest.eml',
    'PasswordResetRequest.eml'
  );

  await expect(page.locator('#uploadedFile')).toBeVisible();
  await page.locator('#uploadedFile').click();
  // This blueprint has no external inputs, so it goes straight to the proving-mode
  // choice - no "Add Inputs" step in between.
  await page.getByTestId('remote-proving').click();

  await expect(page.getByRole('heading', { name: 'View Proof' })).toBeVisible({
    timeout: 4 * 60 * 1000,
  });
  await expect(
    page.locator('div').filter({ hasText: 'View ProofPlease standby,' }).nth(3)
  ).toBeVisible();
  await expect(page.getByText('{"email_sender": ["info@x.com"')).toBeVisible();
  await expect(page.getByRole('img', { name: 'status' })).toBeVisible();
  await expect(page.getByText('{"email_sender": ["info@x.com"')).toBeVisible();
  await expect(page.getByRole('button', { name: '| View' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'download' })).toBeVisible();

  await page.getByRole('button', { name: '| View' }).click();
  await page.waitForLoadState('networkidle');

  await expect(page.locator('#job-id')).toBeVisible();
  await expect(page.locator('#job-id')).not.toBeNull();
  await expect(page.locator('#blueprint-title')).not.toHaveText('-');
  await expect(page.locator('#outputs')).not.toHaveText('-');
  await expect(page.locator('#date-created')).not.toHaveText('-');
  await expect(page.locator('#time-taken')).not.toHaveText('-');
  await expect(page.locator('#status')).not.toHaveText('-');
  await expect(page.getByRole('button', { name: 'Share proof Share Proof' })).toBeVisible();
  await expect(page.locator('div').filter({ hasText: '{ "pi_a": [ "' }).nth(3)).toBeVisible();
});
