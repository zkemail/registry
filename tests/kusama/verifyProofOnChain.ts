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

  // zkemailverify/kusama_grant_paseo_e2e: compiled and deployed to Paseo through
  // the current pipeline (not test_0001_2, which predates it). Proof id for a
  // real, already-completed remote proof against its deployed verifier. Reused
  // rather than generating a fresh one each run (that's covered by
  // tests/kusama/generateProof.ts).
  await page.goto(
    'http://localhost:3000/e94e7f93-7575-4e26-a147-de894b19ce3e/proofs/fece17c3-f3ed-4833-bbf9-eccdf530d474'
  );
  await page.waitForLoadState('networkidle');

  // Confirms the verifier is deployed and resolves to the correct (Paseo) explorer,
  // not just that some address string is present.
  const verifierLink = page.locator('a', {
    hasText: '0x72616B78d29d0cccBfEec1bf00E108885286D2f3',
  });
  await expect(verifierLink).toBeVisible();
  await expect(verifierLink).toHaveAttribute('href', /blockscout-testnet\.polkadot\.io/);

  await page.getByRole('button', { name: 'Verify On-Chain' }).click();
  await expect(page.getByText('Proof verified successfully on chain')).toBeVisible({
    timeout: 30 * 1000,
  });
});
