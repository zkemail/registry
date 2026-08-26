import { test, expect } from '@playwright/test';

test('rejects a tampered proof on-chain via the actual Verify On-Chain button', async ({
  page,
}) => {
  // Same real, already-completed proof as verifyProofOnChain.ts, but its API response is
  // corrupted in-flight for this test only (pi_a[0]) - the persisted proof in the database
  // is never touched. This exercises the real UI path end to end: blueprint.verifyProofOnChain,
  // called by src/app/[id]/proofs/[proofId]/page.tsx, is the method that discarded the
  // standalone call's boolean result (curator-reported bug, fixed in
  // zkemail/zk-email-sdk-js#104) - a tampered proof previously showed the success toast here.
  test.setTimeout(60 * 1000);

  await page.addInitScript(() => {
    (window as any).ethereum = { isMetaMask: true, request: async () => null };
  });

  await page.route(
    '**/proof/fece17c3-f3ed-4833-bbf9-eccdf530d474',
    async (route) => {
      const response = await route.fetch();
      const body = await response.json();
      body.proof.pi_a[0] = '9999999999' + body.proof.pi_a[0].slice(10);
      await route.fulfill({ response, json: body });
    }
  );

  await page.goto(
    'http://localhost:3000/e94e7f93-7575-4e26-a147-de894b19ce3e/proofs/fece17c3-f3ed-4833-bbf9-eccdf530d474'
  );
  await page.waitForLoadState('networkidle');

  await page.getByRole('button', { name: 'Verify On-Chain' }).click();
  await expect(page.getByText('Failed to verify proof on chain')).toBeVisible({
    timeout: 30 * 1000,
  });
  await expect(page.getByText('Proof verified successfully on chain')).not.toBeVisible();
});
