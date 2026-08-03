import { test, expect } from '@playwright/test';
import { dragAndDropFile } from '../../src/test-utils/DragAndDropFile';

test('test proof generation for kusama_grant_paseo_e2e', async ({ page }) => {
  // Real circom proving takes ~2 min on staging.
  test.setTimeout(5 * 60 * 1000);

  // zkemailverify/kusama_grant_paseo_e2e: compiled and deployed to Paseo through
  // the current pipeline (unlike test_0001_2, exercised by ../generateProof.ts,
  // which predates it). Navigated by id directly, same reasoning as that test.
  await page.goto('http://localhost:3000/e94e7f93-7575-4e26-a147-de894b19ce3e');
  await page.waitForLoadState('networkidle');

  // check the connect emails page
  await expect(page.getByRole('heading', { name: 'Connect emails' })).toBeVisible();

  // upload the email file. We need another component for this. https://stackoverflow.com/a/77738836
  await dragAndDropFile(
    page,
    '#drag-and-drop-emails',
    'tests/kusama/assets/Password_reset_request.eml',
    'Password_reset_request.eml'
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

  // Confirms the verifier this proof would be checked against is deployed to
  // Paseo specifically, not just some address.
  const verifierLink = page.locator('a', {
    hasText: '0x72616B78d29d0cccBfEec1bf00E108885286D2f3',
  });
  await expect(verifierLink).toBeVisible();
  await expect(verifierLink).toHaveAttribute('href', /blockscout-testnet\.polkadot\.io/);
});
