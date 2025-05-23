import { test, expect } from '@playwright/test';
import { dragAndDropFile } from '../src/test-utils/DragAndDropFile';

test('test back button in proofs page', async ({ page }) => {
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
  await page.getByRole('button', { name: 'proofs Past proofs' }).click();
  await expect(page.getByRole('heading', { name: 'Past Proofs' })).toBeVisible();
  await expect(page.getByText('1|View{"handle": ["')).toBeVisible();
  await page.getByRole('button', { name: 'back Proof of Twitter' }).click();
  await expect(
    page.getByText('Generate ProofPast proofsConnect emailsSelect emailsAdd inputsView and')
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Connect emails' })).toBeVisible();
});

test('test back button in generate proof steps', async ({ page }) => {
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
  await page.getByRole('button', { name: 'proofs Past proofs' }).click();
  await expect(page.getByRole('heading', { name: 'Past Proofs' })).toBeVisible();
  await expect(page.getByText('1|View{"handle": ["')).toBeVisible();
  await page.getByRole('button', { name: 'back Proof of Twitter' }).click();
  await expect(
    page.getByText('Generate ProofPast proofsConnect emailsSelect emailsAdd inputsView and')
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Connect emails' })).toBeVisible();

  await dragAndDropFile(
    page,
    '#drag-and-drop-emails',
    'tests/assets/PasswordResetRequest.eml',
    'PasswordResetRequest.eml'
  );
  await expect(page.locator('#uploadedFile')).toBeVisible();
  await page.locator('#uploadedFile').click();
  await page.getByRole('button', { name: 'Add Inputs' }).click();
  await page.getByRole('textbox', { name: 'Address' }).click();
  await page.getByRole('textbox', { name: 'Address' }).fill('0x00');
  await page.getByText('Remote ProvingQuickServer Side').click();
  await page.goto(
    'http://localhost:3000/0fe3a285-dc6e-4843-b9f6-5f3c27cd3847?step=3&proofId=b197bffe-5101-4bcf-9eb0-a118d77c7b9d'
  );
  await expect(page.getByRole('heading', { name: 'View Proof' })).toBeVisible();
  await page.getByRole('button', { name: 'back Add inputs' }).click();
  await expect(page.getByRole('heading', { name: 'Add Inputs' })).toBeVisible();
  await page.getByRole('button', { name: 'back Select emails' }).click();
  await expect(page.getByRole('heading', { name: 'Select Emails' })).toBeVisible();
  await page.getByRole('button', { name: 'back Connect emails' }).click();
  await expect(page.getByRole('heading', { name: 'Connect emails' })).toBeVisible();
});
