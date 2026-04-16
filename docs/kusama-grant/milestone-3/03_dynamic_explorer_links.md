# 03 - Dynamic Block Explorer Links

Deliverable mapping: Milestone 3, Dynamic Block Explorer Links.

## What was delivered

The verifier contract address link on the proof detail page now resolves to the correct block explorer based on the blueprint's target chain:

| Chain ID | Chain | Explorer |
| --- | --- | --- |
| `11155111` | Ethereum Sepolia | `https://sepolia.etherscan.io/address/<address>` |
| `420420417` | Paseo Testnet (Polkadot) | `https://blockscout-testnet.polkadot.io/address/<address>` |

Previously, the link was hardcoded to Base Sepolia (`sepolia.basescan.org`).

## Implementation Notes

- **Proof detail page:** [`src/app/[id]/proofs/[proofId]/page.tsx`](../../src/app/%5Bid%5D/proofs/%5BproofId%5D/page.tsx) — an `EXPLORER_MAP` keyed by chain ID builds the correct URL from `blueprint.props.verifierContract.chain`.
- Falls back to `#` if the chain is unrecognized or the address is not set.

## Repo Evidence

- Explorer link logic:
  - `src/app/[id]/proofs/[proofId]/page.tsx` (`EXPLORER_MAP` and href computation)

## Status

`Delivered`
