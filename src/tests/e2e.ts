import { test, expect } from '@playwright/test';

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
  await page.getByLabel('Username or email address').fill('zktestman');
  await page.getByLabel('Username or email address').press('Tab');
  await page.getByLabel('Password').fill('FxV*weH9AzRswWo_kqxgjoN4HknnmB');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();

  // await page.getByRole('button', { name: 'Authorize zkemail' }).click();
  await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Create Blueprint' })).toBeVisible();

  await page.getByRole('link', { name: 'ds 1 Draft wryonik/ds copy' }).click();
  const page1Promise = page.waitForEvent('popup');
  await page.getByText('Generate ProofConnect').click();
  const page1 = await page1Promise;
  await expect(page.getByText('Generate ProofConnect')).toBeVisible();
  await expect(page.getByRole('button', { name: 'commit View all versions' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'commit Past proofs' })).toBeVisible();
});
