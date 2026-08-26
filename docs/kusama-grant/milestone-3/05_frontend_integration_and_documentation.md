# 05 - Frontend Integration & Documentation

Milestone 3 frontend integration: the registry frontend supports target chain selection for new blueprints and lets users verify Circom proofs on-chain against the deployed verifier contract.

## Implementation Notes

### Chain selection

- **UI component:** [`src/app/create/[id]/createBlueprintSteps/EmailDetails.tsx`](../../../src/app/create/%5Bid%5D/createBlueprintSteps/EmailDetails.tsx) adds a `Target Chain` `<Select>` to **Step 3 (Optional Details)** of the blueprint creation wizard, with three options: Base Sepolia (`84532`), Ethereum Sepolia (`11155111`), and Paseo Testnet / Polkadot (`420420417`).
- **Store:** [`src/app/create/[id]/store.ts`](../../../src/app/create/%5Bid%5D/store.ts) initializes `verifierContract.chain` to `84532` (Base Sepolia); the component falls back to the same default when unset. The selected chain is used downstream by the compilation pipeline when deploying the Solidity verifier contract.
- Covered by [`tests/kusama/targetChainSelector.ts`](../../../tests/kusama/targetChainSelector.ts): confirms Paseo is both an available option and genuinely selected on the real `kusama_grant_paseo_e2e` blueprint. Runs in CI on every push (see Demonstration below).

### On-chain verification UI

- A **"Verify On-Chain"** button appears in two places: the proof list row ([`src/app/[id]/ProofRow.tsx`](../../../src/app/%5Bid%5D/ProofRow.tsx), `onVerifyOnChain` / `isVerifyingOnChainLoading`) and the proof detail page ([`src/app/[id]/proofs/[proofId]/page.tsx`](../../../src/app/%5Bid%5D/proofs/%5BproofId%5D/page.tsx), same pattern).
- Rendered only when a browser wallet (`window.ethereum`) is detected, the blueprint has a `verifierContract.address` set, and the proof is Circom-based (not Noir); disabled while the proof is still `InProgress`.
- Calls `blueprint.verifyProofOnChain(proof)` from `@zk-email/sdk` and shows a toast with the result.
- Covered by [`tests/kusama/verifyProofOnChain.ts`](../../../tests/kusama/verifyProofOnChain.ts) (real proof, asserts success) and [`tests/kusama/verifyTamperedProofOnChain.ts`](../../../tests/kusama/verifyTamperedProofOnChain.ts) (same real proof, corrupted in-flight, asserts failure). Runs in CI on every push (see Demonstration below).

### Dynamic block explorer links

- [`src/app/[id]/proofs/[proofId]/page.tsx`](../../../src/app/%5Bid%5D/proofs/%5BproofId%5D/page.tsx) builds the verifier contract address link from an `EXPLORER_MAP` keyed by chain ID: `84532` → `sepolia.basescan.org`, `11155111` → `sepolia.etherscan.io`, `420420417` → `blockscout-testnet.polkadot.io`. Falls back to `#` if the chain is unrecognized or no address is set.
- Also covered by [`tests/kusama/verifyProofOnChain.ts`](../../../tests/kusama/verifyProofOnChain.ts), which asserts the rendered link resolves to Blockscout specifically for this Paseo-targeted blueprint.

## Demonstration

```bash
bunx playwright test tests/kusama/
```

Four real, end-to-end Playwright tests under [`tests/kusama/`](../../../tests/kusama/), all against [`zkemailverify/kusama_grant_paseo_e2e`](https://registry-staging.onrender.com/e94e7f93-7575-4e26-a147-de894b19ce3e/versions) (blueprint `e94e7f93-7575-4e26-a147-de894b19ce3e`), compiled and deployed to Paseo through the current pipeline:

| Test | Exercises |
| --- | --- |
| [`targetChainSelector.ts`](../../../tests/kusama/targetChainSelector.ts) | Target Chain dropdown offers, and this blueprint has selected, Paseo Testnet (Polkadot). |
| [`generateProof.ts`](../../../tests/kusama/generateProof.ts) | Fresh remote proof generation end to end (email upload through "View Proof"). |
| [`verifyProofOnChain.ts`](../../../tests/kusama/verifyProofOnChain.ts) | Real "Verify On-Chain" button click against the deployed verifier ([`manifest.json#L20`](./manifest.json#L20)), asserting the explorer link resolves to Blockscout/Paseo specifically and that verification succeeds. |
| [`verifyTamperedProofOnChain.ts`](../../../tests/kusama/verifyTamperedProofOnChain.ts) | Same real proof, corrupted in-flight via route interception (the persisted proof is never touched), asserting the failure toast through the actual button. Added after a curator-reported bug (`blueprint.verifyProofOnChain` discarding the standalone call's result, fixed in [zk-email-sdk-js#104](https://github.com/zkemail/zk-email-sdk-js/pull/104)) - this test failed against `@zk-email/sdk@3.0.0-nightly.34` and passes against `3.0.0-nightly.36`, confirmed by real CI runs on both. |

Runs automatically in CI on every push to `staging`/`main` via [`.github/workflows/playwright.yml`](../../../.github/workflows/playwright.yml). Example passing `test` job, with all four tests including the tampered-proof case: [`manifest.json#L11-L14`](./manifest.json#L11-L14). For the current state of the branch, see the [Actions tab](https://github.com/zkemail/registry/actions/workflows/playwright.yml?query=branch%3Astaging).
