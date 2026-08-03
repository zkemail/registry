import { test, expect } from '@playwright/test';
import { dragAndDropFile } from '../src/test-utils/DragAndDropFile';

test('test back button in proofs page', async ({ page }) => {
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
  await page.getByRole('button', { name: 'proofs Past proofs' }).click();
  await expect(page.getByRole('heading', { name: 'Past Proofs' })).toBeVisible();
  await expect(page.getByText('1|View{"email_sender": ["')).toBeVisible();
  await page.getByRole('button', { name: 'back test_0001' }).click();
  await expect(
    page.getByText('Generate ProofPast proofsConnect emailsSelect emailsView and')
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Connect emails' })).toBeVisible();
});

test('test back button in generate proof steps', async ({ page }) => {
  test.setTimeout(60 * 1000);

  // Reuses a real, already-completed proof (id below) against the same blueprint
  // instead of generating a fresh one, since this test only cares about back-button
  // navigation from the "View and verify" step, not proof generation itself.
  await page.goto(
    'http://localhost:3000/f63c7198-76b1-413c-b785-7655ebdaaec1?step=3&proofId=2d655dea-4f62-4369-8307-3abf4228147b'
  );
  await expect(page.getByRole('heading', { name: 'View Proof' })).toBeVisible();
  // Matched loosely: the back button's label doesn't reliably reflect the target step.
  await page.getByRole('button', { name: /^back /i }).click();
  await expect(page.getByRole('heading', { name: 'Select Emails' })).toBeVisible();
  await page.getByRole('button', { name: /^back /i }).click();
  await expect(page.getByRole('heading', { name: 'Connect emails' })).toBeVisible();
});
