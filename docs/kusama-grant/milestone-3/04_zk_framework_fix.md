# 04 - ZK Framework Selection Fix

Deliverable mapping: Milestone 3, ZK Framework Selection Fix.

## What was delivered

Removed a hardcoded fallback in the blueprint creation store that forced `clientZkFramework = Noir` and `serverZkFramework = SP1` when no email file was uploaded by the user. With the fix, the user's manually selected ZK framework is preserved in all cases.

## Implementation Notes

- **Store:** [`src/app/create/[id]/store.ts`](../../src/app/create/%5Bid%5D/store.ts) — the `else` branch that set `data.clientZkFramework = ZkFramework.Noir` and `data.serverZkFramework = ZkFramework.Sp1` was removed.
- When an email is uploaded, `blueprint.assignPreferredZkFramework(emlStr)` still runs to auto-detect the best framework.
- When no email is uploaded, the framework values from the store (i.e., whatever the user selected) are used without override.

## Repo Evidence

- Framework selection fix:
  - `src/app/create/[id]/store.ts`

## Status

`Delivered`
