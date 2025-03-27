import { test, expect } from '@playwright/test';
import { dragAndDropFile } from './utils/DragAndDropFile';

test('check draft blueprints without authentication', async ({ page }) => {
  await page.goto('http://localhost:3000/');

  const loginButton = page.getByRole('button', { name: 'Login' });
  await expect(loginButton).toBeVisible();
  await loginButton.click();

  if (await loginButton.isVisible()) {
    console.log('Login button is visible');
    //wait for blueprint card to be visible
    await page.getByTestId('blueprint-card').waitFor();

    // check if there is any component with data-testid="blueprint-status-Draft" and if it is visible fail the test
    const draftBlueprint = page.getByTestId('blueprint-status-Draft');
    console.log(await draftBlueprint.isVisible());
    await expect(draftBlueprint).not.toBeVisible();
  }

  // Login with github
  await page.getByLabel('Username or email address').fill('zktestman00');
  await page.getByLabel('Username or email address').press('Tab');
  await page.getByLabel('Password').fill('FxV*weH9AzRswWo_kqxgjoN4HknnmB');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();

  await page.waitForLoadState('networkidle');

  // await page.getByRole('button', { name: 'Authorize zkemail' }).click();
  await expect(page.getByTestId('profile-info')).toBeVisible();
  await expect(page.getByTestId('create-blueprint-button')).toBeVisible();

  await page.getByTestId('create-blueprint-button').click();

  await page.waitForLoadState('networkidle');
  await expect(page.getByText('You can help improve the')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Submit Blueprint' })).toBeVisible();

  await page.getByRole('textbox', { name: 'Pattern Name' }).click();
  await page.getByRole('textbox', { name: 'Pattern Name' }).fill('test');

  await dragAndDropFile(
    page,
    '#drag-and-drop-emails',
    'tests/assets/PasswordResetRequest.eml',
    'PasswordResetRequest.eml'
  );

  await page.waitForLoadState('networkidle');

  await expect(page.getByTestId('sample-eml-preview-button')).toBeVisible();

  await page.getByRole('textbox', { name: 'Description' }).click();
  await page.getByRole('textbox', { name: 'Description' }).fill('test');

  await page.getByRole('button', { name: 'Next arrow right' }).click();

  await page.waitForTimeout(5000);

  await expect(page.getByRole('textbox', { name: 'Sender domain' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Email Query' })).toBeVisible();
  await page.getByRole('button', { name: '+ View optional details' }).click();
  await expect(page.getByRole('checkbox')).toBeVisible();
  await page.getByRole('button', { name: 'Next arrow right' }).click();

  await page.getByRole('button', { name: 'trash Delete' }).click();
  await page.getByRole('button', { name: 'expand' }).first().click();
  await expect(
    page.getByText('date:Wed, 19 Mar 2025 09:58:03 +0000 from:X <info@x.com> to:Shubham Agarawal <')
  ).toBeVisible();
  await page.getByRole('button', { name: 'collapse' }).click();
  await page.getByRole('button', { name: 'expand' }).nth(1).click();
  await expect(page.getByRole('paragraph').filter({ hasText: '------=' }).nth(1)).toBeVisible();
  await page.getByRole('button', { name: 'collapse' }).click();

  await page.getByRole('checkbox').first().click();

  await page.getByTestId('regex-status').scrollIntoViewIfNeeded();

  await expect(page.getByText('subject: ["Password reset')).toBeVisible();
  await expect(page.getByText('All tests passed. Ready to')).toBeVisible();
  await page.getByRole('button', { name: 'check Submit Blueprint' }).click();
  await expect(page.getByText('In Progress', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'close Cancel Compilation' }).click();
});
