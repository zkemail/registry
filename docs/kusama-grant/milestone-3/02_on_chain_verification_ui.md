# 02 - On-Chain Verification UI

Deliverable mapping: Milestone 3, On-Chain Verification UI.

## What was delivered

A **"Verify On-Chain"** button was added to two locations in the proof viewing flow:

1. **Proof list row** (`ProofRow` component) — appears next to the existing "Verify" button in the proof table.
2. **Proof detail page** (`/[id]/proofs/[proofId]`) — appears in the action buttons section alongside verify and download.

The button is conditionally rendered only when all three conditions are true:
- A browser wallet (`window.ethereum`) is detected.
- The blueprint has a `verifierContract.address` set (i.e., a contract has been deployed for this blueprint).
- The proof was generated with the Circom ZK framework (not Noir).

When clicked, the button calls `blueprint.verifyProofOnChain(proof)` from `@zk-email/sdk` and shows a toast notification with the result.

## Implementation Notes

- **ProofRow:** [`src/app/[id]/ProofRow.tsx`](../../src/app/%5Bid%5D/ProofRow.tsx) — `onVerifyOnChain` handler, `isVerifyingOnChainLoading` state, conditional button render.
- **Proof detail page:** [`src/app/[id]/proofs/[proofId]/page.tsx`](../../src/app/%5Bid%5D/proofs/%5BproofId%5D/page.tsx) — same pattern with a `VerifyOnChain.svg` icon.
- The button is disabled while the proof is still `InProgress`.

## Repo Evidence

- ProofRow on-chain button:
  - `src/app/[id]/ProofRow.tsx`
- Proof detail on-chain button:
  - `src/app/[id]/proofs/[proofId]/page.tsx`

## Status

`Delivered`
