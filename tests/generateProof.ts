import { test, expect } from '@playwright/test';
import { dragAndDropFile } from '../src/test-utils/DragAndDropFile';

test('test proof generation', async ({ page }) => {
  test.setTimeout(120000);
  await page.goto('http://localhost:3000/?search=proof+of+twitter');

  await page.waitForLoadState('networkidle');

  await page.getByRole('textbox', { name: 'Search blueprints..' }).click();
  await page.getByRole('textbox', { name: 'Search blueprints..' }).fill('proof of twitter');
  await page.waitForLoadState('networkidle');
  // Matched by id, not title/name: staging has two blueprints both titled "Proof of
  // Twitter" (0fe3a285... and 963fbbe8...). This is the one this test is written
  // against (referenced by id elsewhere in this suite too).
  const proofOfTwitterLink = page.locator('a[href="/0fe3a285-dc6e-4843-b9f6-5f3c27cd3847"]');
  await expect(proofOfTwitterLink).toBeVisible();
  await proofOfTwitterLink.click();

  // check the connect emails page
  await expect(page.getByRole('heading', { name: 'Connect emails' })).toBeVisible();

  // upload the email file. We need another component for this. https://stackoverflow.com/a/77738836
  await dragAndDropFile(
    page,
    '#drag-and-drop-emails',
    'tests/assets/PasswordResetRequest.eml',
    'PasswordResetRequest.eml'
  );

  //   await expect(page.getByRole('img', { name: 'status' })).toBeVisible();
  await expect(page.locator('#uploadedFile')).toBeVisible();
  await page.locator('#uploadedFile').click();
  await expect(page.getByRole('button', { name: 'Add Inputs' })).toBeVisible();
  await page.getByRole('button', { name: 'Add Inputs' }).click();
  await page.getByPlaceholder('Enter Address').click();
  await page.getByPlaceholder('Enter Address').fill('0x00');
  await page.getByTestId('remote-proving').click();

  await page.waitForTimeout(60000);
  await expect(page.getByRole('heading', { name: 'View Proof' })).toBeVisible();
  await expect(
    page.locator('div').filter({ hasText: 'View ProofPlease standby,' }).nth(3)
  ).toBeVisible();
  await expect(page.getByText('{"handle": ["ShubhamAga67450')).toBeVisible();
  await expect(page.getByRole('img', { name: 'status' })).toBeVisible();
  await expect(page.getByText('{"handle": ["ShubhamAga67450')).toBeVisible();
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
