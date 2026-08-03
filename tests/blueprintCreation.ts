import { test, expect } from '@playwright/test';
import { dragAndDropFile } from '../src/test-utils/DragAndDropFile';

test('check draft blueprints without authentication', async ({ page }) => {
  await page.goto('http://localhost:3000/');

  const loginButton = page.getByRole('button', { name: 'Login' });
  await expect(loginButton).toBeVisible();
  // await loginButton.click();

  if (await loginButton.isVisible()) {
    console.log('Login button is visible');
    //wait for blueprint card to be visible
    // await page.getByTestId('blueprint-card').waitFor();

    // check if there is any component with data-testid="blueprint-status-Draft" and if it is visible fail the test
    const draftBlueprint = page.getByTestId('blueprint-status-Draft');
    console.log(await draftBlueprint.isVisible());
    await expect(draftBlueprint).not.toBeVisible();
  }

  const authStorage = {
    state: {
      username: 'zktestman00',
      // Re-signed with the staging JWT_SECRET for github_username "zktestman00", exp 2046-01-01.
      // The previous token expired 2025-06-25, which is why this test started failing in CI.
      token:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjIzOTgzNzc2MDAsImdpdGh1Yl91c2VybmFtZSI6InprdGVzdG1hbjAwIn0._SkwY7_uVAabXB0Fq1qjWpwj2PnooQKL0z5hrl8a0nE',
      isAdmin: false,
    },
    version: 0,
  };

  await page.evaluate(
    (storage) => {
      localStorage.setItem('auth-storage', storage);
    },
    JSON.stringify(authStorage)
  );

  await page.reload();

  await page.waitForLoadState('networkidle');

  // await page.getByRole('button', { name: 'Authorize zkemail' }).click();
  await expect(page.getByTestId('profile-info')).toBeVisible();
  await expect(page.getByTestId('create-blueprint-button')).toBeVisible();

  await page.getByTestId('create-blueprint-button').click();

  await page.waitForLoadState('networkidle');
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
  // await page.getByRole('button', { name: '+ View optional details' }).click();
  await expect(page.getByRole('checkbox')).toBeVisible();
  await page.getByRole('button', { name: 'Next arrow right' }).click();

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
  await page.waitForLoadState('networkidle');
  await expect(page.getByText('In Progress', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'close Cancel Compilation' }).click();
});
