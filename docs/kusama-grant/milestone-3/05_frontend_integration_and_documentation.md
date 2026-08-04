# 05 - Frontend Integration & Documentation

Milestone 3 frontend integration: the registry frontend supports target chain selection for new blueprints and lets users verify Circom proofs on-chain against the deployed verifier contract.

## Implementation Notes

### Chain selection

- **UI component:** [`src/app/create/[id]/createBlueprintSteps/EmailDetails.tsx`](../../src/app/create/%5Bid%5D/createBlueprintSteps/EmailDetails.tsx) adds a `Target Chain` `<Select>` to **Step 3 (Optional Details)** of the blueprint creation wizard, with three options: Base Sepolia (`84532`), Ethereum Sepolia (`11155111`), and Paseo Testnet / Polkadot (`420420417`).
- **Store:** [`src/app/create/[id]/store.ts`](../../src/app/create/%5Bid%5D/store.ts) initializes `verifierContract.chain` to `84532` (Base Sepolia); the component falls back to the same default when unset. The selected chain is used downstream by the compilation pipeline when deploying the Solidity verifier contract.
- Covered by [`tests/kusama/targetChainSelector.ts`](../../../tests/kusama/targetChainSelector.ts): confirms Paseo is both an available option and genuinely selected on the real `kusama_grant_paseo_e2e` blueprint. Runs in CI on every push (see Demonstration below).

### On-chain verification UI

- A **"Verify On-Chain"** button appears in two places: the proof list row ([`src/app/[id]/ProofRow.tsx`](../../src/app/%5Bid%5D/ProofRow.tsx), `onVerifyOnChain` / `isVerifyingOnChainLoading`) and the proof detail page ([`src/app/[id]/proofs/[proofId]/page.tsx`](../../src/app/%5Bid%5D/proofs/%5BproofId%5D/page.tsx), same pattern).
- Rendered only when a browser wallet (`window.ethereum`) is detected, the blueprint has a `verifierContract.address` set, and the proof is Circom-based (not Noir); disabled while the proof is still `InProgress`.
- Calls `blueprint.verifyProofOnChain(proof)` from `@zk-email/sdk` and shows a toast with the result.
- Covered by [`tests/kusama/verifyProofOnChain.ts`](../../../tests/kusama/verifyProofOnChain.ts): clicks the real button against a real, already-completed proof and asserts on-chain verification succeeds. Runs in CI on every push (see Demonstration below).

### Dynamic block explorer links

- [`src/app/[id]/proofs/[proofId]/page.tsx`](../../src/app/%5Bid%5D/proofs/%5BproofId%5D/page.tsx) builds the verifier contract address link from an `EXPLORER_MAP` keyed by chain ID: `84532` → `sepolia.basescan.org`, `11155111` → `sepolia.etherscan.io`, `420420417` → `blockscout-testnet.polkadot.io`. Falls back to `#` if the chain is unrecognized or no address is set.
- Also covered by [`tests/kusama/verifyProofOnChain.ts`](../../../tests/kusama/verifyProofOnChain.ts), which asserts the rendered link resolves to Blockscout specifically for this Paseo-targeted blueprint.

### ZK framework selection fix

- [`src/app/create/[id]/store.ts`](../../src/app/create/%5Bid%5D/store.ts): removed a hardcoded `else` branch that previously forced `clientZkFramework = Noir` / `serverZkFramework = Sp1` whenever no email file was uploaded. Now, `assignPreferredZkFramework(emlStr)` only runs when an email is actually present; otherwise the user's manually selected framework values are used unmodified.

## Demonstration

```bash
bunx playwright test tests/kusama/
```

Three real, end-to-end Playwright tests under [`tests/kusama/`](../../../tests/kusama/), all against `zkemailverify/kusama_grant_paseo_e2e` (blueprint `e94e7f93-7575-4e26-a147-de894b19ce3e`), a blueprint compiled and deployed to Paseo through the current pipeline (not `test_0001_2`, which predates it):

| Test | Exercises |
| --- | --- |
| [`targetChainSelector.ts`](../../../tests/kusama/targetChainSelector.ts) | Target Chain dropdown offers, and this blueprint has selected, Paseo Testnet (Polkadot). |
| [`generateProof.ts`](../../../tests/kusama/generateProof.ts) | Fresh remote proof generation end to end (email upload through "View Proof"). |
| [`verifyProofOnChain.ts`](../../../tests/kusama/verifyProofOnChain.ts) | Real "Verify On-Chain" button click against the deployed verifier (`0x72616B78d29d0cccBfEec1bf00E108885286D2f3`), asserting the explorer link resolves to Blockscout/Paseo specifically and that verification succeeds. |

Runs automatically in CI on every push to `staging`/`main` via [`.github/workflows/playwright.yml`](../../../.github/workflows/playwright.yml). Example passing `test` job (2026-08-04): https://github.com/zkemail/registry/actions/runs/30896130827/job/91949337388. For the current state of the branch, see the [Actions tab](https://github.com/zkemail/registry/actions/workflows/playwright.yml?query=branch%3Astaging).
