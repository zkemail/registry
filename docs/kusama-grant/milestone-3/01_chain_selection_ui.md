# 01 - Chain Selection UI

Deliverable mapping: Milestone 3, Chain Selection UI.

## What was delivered

A `Target Chain` dropdown was added to **Step 3 (Optional Details)** of the blueprint creation wizard. Users can select between:

- **Ethereum Sepolia** (chain ID `11155111`)
- **Paseo Testnet (Polkadot)** (chain ID `420420417`)

The selected chain is stored in `verifierContract.chain` on the blueprint and is used downstream by the compilation pipeline when deploying the Solidity verifier contract.

The default chain was changed from Base Sepolia (`84532`) to Ethereum Sepolia (`11155111`).

## Implementation Notes

- **UI component:** [`src/app/create/[id]/createBlueprintSteps/EmailDetails.tsx`](../../src/app/create/%5Bid%5D/createBlueprintSteps/EmailDetails.tsx) — `<Select label="Target Chain" />` with two options.
- **Store default:** [`src/app/create/[id]/store.ts`](../../src/app/create/%5Bid%5D/store.ts) — `verifierContract.chain` initialized to `11155111`.

## Repo Evidence

- Chain selector component:
  - `src/app/create/[id]/createBlueprintSteps/EmailDetails.tsx`
- Store default value:
  - `src/app/create/[id]/store.ts`

## Status

`Delivered`
