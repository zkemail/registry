# 05 - Frontend Integration & Documentation

Milestone 3 frontend integration: the registry frontend supports target chain selection for new blueprints and lets users verify Circom proofs on-chain against the deployed verifier contract.

## Implementation Notes

### Chain selection

- **UI component:** [`src/app/create/[id]/createBlueprintSteps/EmailDetails.tsx`](../../src/app/create/%5Bid%5D/createBlueprintSteps/EmailDetails.tsx) adds a `Target Chain` `<Select>` to **Step 3 (Optional Details)** of the blueprint creation wizard, with three options: Base Sepolia (`84532`), Ethereum Sepolia (`11155111`), and Paseo Testnet / Polkadot (`420420417`).
- **Store:** [`src/app/create/[id]/store.ts`](../../src/app/create/%5Bid%5D/store.ts) initializes `verifierContract.chain` to `84532` (Base Sepolia); the component falls back to the same default when unset. The selected chain is used downstream by the compilation pipeline when deploying the Solidity verifier contract.

### On-chain verification UI

- A **"Verify On-Chain"** button appears in two places: the proof list row ([`src/app/[id]/ProofRow.tsx`](../../src/app/%5Bid%5D/ProofRow.tsx), `onVerifyOnChain` / `isVerifyingOnChainLoading`) and the proof detail page ([`src/app/[id]/proofs/[proofId]/page.tsx`](../../src/app/%5Bid%5D/proofs/%5BproofId%5D/page.tsx), same pattern).
- Rendered only when a browser wallet (`window.ethereum`) is detected, the blueprint has a `verifierContract.address` set, and the proof is Circom-based (not Noir); disabled while the proof is still `InProgress`.
- Calls `blueprint.verifyProofOnChain(proof)` from `@zk-email/sdk` and shows a toast with the result.

### Dynamic block explorer links

- [`src/app/[id]/proofs/[proofId]/page.tsx`](../../src/app/%5Bid%5D/proofs/%5BproofId%5D/page.tsx) builds the verifier contract address link from an `EXPLORER_MAP` keyed by chain ID: `84532` → `sepolia.basescan.org`, `11155111` → `sepolia.etherscan.io`, `420420417` → `blockscout-testnet.polkadot.io`. Falls back to `#` if the chain is unrecognized or no address is set.

### ZK framework selection fix

- [`src/app/create/[id]/store.ts`](../../src/app/create/%5Bid%5D/store.ts): removed a hardcoded `else` branch that previously forced `clientZkFramework = Noir` / `serverZkFramework = Sp1` whenever no email file was uploaded. Now, `assignPreferredZkFramework(emlStr)` only runs when an email is actually present; otherwise the user's manually selected framework values are used unmodified.

## Demonstration

```bash
bunx playwright test tests/verifyProofOnChain.ts
```

[`tests/verifyProofOnChain.ts`](../../../tests/verifyProofOnChain.ts) reuses a real, already-completed proof for `zkemailverify/test_0001_2` (blueprint `f63c7198-76b1-413c-b785-7655ebdaaec1`, proof `a19c659c-8224-4cb1-b503-cfc4511566c4`) against its deployed Paseo verifier (`0xEf6B5496Bd6D13E2A518eA7961aA1Df1F41Db033`), asserting the explorer link resolves to Blockscout/Paseo specifically and that on-chain verification succeeds via the real "Verify On-Chain" button. Confirmed passing locally against staging (2026-08-03). Runs automatically in CI on every push to `staging`/`main` via [`.github/workflows/playwright.yml`](../../../.github/workflows/playwright.yml) (test discovery matches any file under `tests/`); `TBD` -- add a passing CI run link once this lands there.
