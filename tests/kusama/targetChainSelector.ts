import { test, expect } from '@playwright/test';

test('Target Chain dropdown offers and preserves Paseo Testnet (Polkadot)', async ({ page }) => {
  test.setTimeout(30 * 1000);

  // Auth required to view/edit a blueprint's create-flow steps (unlike proof
  // viewing, which doesn't need it). Re-signed test JWT for github_username
  // "zktestman00", exp 2046-01-01 (see PR #311, commit 0303e60 - the version
  // that shipped in blueprintCreation.ts itself was later reverted back to
  // the expired one when that test got skipped, so don't copy it from there).
  await page.goto('http://localhost:3000/');
  const authStorage = {
    state: {
      username: 'zktestman00',
      token:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjIzOTgzNzc2MDAsImdpdGh1Yl91c2VybmFtZSI6InprdGVzdG1hbjAwIn0._SkwY7_uVAabXB0Fq1qjWpwj2PnooQKL0z5hrl8a0nE',
      isAdmin: false,
    },
    version: 0,
  };
  await page.evaluate((storage) => {
    localStorage.setItem('auth-storage', storage);
  }, JSON.stringify(authStorage));

  // Jump straight to the "Optional Details" step (?step=2) for the existing
  // kusama_grant_paseo_e2e blueprint, instead of walking through the whole
  // creation wizard - no eml upload / field extraction needed for this check.
  await page.goto('http://localhost:3000/create/e94e7f93-7575-4e26-a147-de894b19ce3e?step=2');
  await page.waitForLoadState('networkidle');

  await expect(page.getByText('Target Chain')).toBeVisible();
  // Confirms both that Paseo is an available option in the dropdown, and that
  // this real blueprint (used elsewhere for proof generation/on-chain
  // verification) genuinely has it selected.
  await expect(page.getByText('Paseo Testnet (Polkadot)')).toBeVisible();
});
