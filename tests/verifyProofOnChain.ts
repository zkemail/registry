import { test, expect } from '@playwright/test';

test('verify a real proof on-chain against a deployed Paseo verifier', async ({ page }) => {
  // Page load triggers two API calls (getBlueprintById, getProofIdsForBlueprint)
  // before the button even renders, plus a real RPC call to Paseo on click.
  test.setTimeout(60 * 1000);

  // The "Verify On-Chain" button only renders when window.ethereum is present
  // (see src/app/[id]/proofs/[proofId]/page.tsx `hasWallet`). The verification
  // call itself uses a plain viem public client (readContract), not the
  // injected provider, so a minimal stub is enough to satisfy the gate.
  await page.addInitScript(() => {
    (window as any).ethereum = { isMetaMask: true, request: async () => null };
  });

  // zkemailverify/test_0001_2 (same blueprint as tests/generateProof.ts), proof
  // id for a real, already-completed remote proof with a Paseo verifier deployed.
  // Reused rather than generating a fresh proof each run (that's already covered
  // by tests/generateProof.ts).
  await page.goto(
    'http://localhost:3000/f63c7198-76b1-413c-b785-7655ebdaaec1/proofs/a19c659c-8224-4cb1-b503-cfc4511566c4'
  );
  await page.waitForLoadState('networkidle');

  // Confirms the verifier is deployed and resolves to the correct (Paseo) explorer,
  // not just that some address string is present.
  const verifierLink = page.locator('a', {
    hasText: '0xEf6B5496Bd6D13E2A518eA7961aA1Df1F41Db033',
  });
  await expect(verifierLink).toBeVisible();
  await expect(verifierLink).toHaveAttribute('href', /blockscout-testnet\.polkadot\.io/);

  await page.getByRole('button', { name: 'Verify On-Chain' }).click();
  await expect(page.getByText('Proof verified successfully on chain')).toBeVisible({
    timeout: 30 * 1000,
  });
});
