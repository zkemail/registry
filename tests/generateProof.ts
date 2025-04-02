import { test, expect } from '@playwright/test';
import { dragAndDropFile } from './utils/DragAndDropFile';

test('test', async ({ page }) => {
  test.setTimeout(120000);
  await page.goto('http://localhost:3000/');

  await page.waitForLoadState('networkidle');

  await page.getByRole('textbox', { name: 'Search blueprints..' }).click();
  await page.getByRole('textbox', { name: 'Search blueprints..' }).fill('proof of twitter');
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('link', { name: 'Proof of Twitter stars Stars' })).toBeVisible();
  await page.getByRole('link', { name: 'Proof of Twitter stars Stars' }).click();

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
