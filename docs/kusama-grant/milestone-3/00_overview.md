# Milestone 3 - Frontend PolkaVM Support

Primary Goal: Add PolkaVM/Paseo Testnet on-chain verification support to the ZK-Email registry UI, enabling users to select a target chain when creating blueprints and to verify Circom proofs on-chain against the deployed verifier contract.

## Deliverables (this repository)

| # | Name | Description | Status |
| --- | --- | --- | --- |
| 1 | Chain Selection UI | Chain selector dropdown in blueprint creation step 3 (Optional Details) allowing users to choose between Ethereum Sepolia and Paseo Testnet (Polkadot) as the deployment target. | `Delivered` |
| 2 | On-Chain Verification UI | "Verify On-Chain" button on the proof list and proof detail pages, enabled only when a wallet is detected, a verifier contract address is set, and the proof is Circom-based. | `Delivered` |
| 3 | Dynamic Block Explorer Links | Verifier contract address links that resolve to the correct explorer (Etherscan for Sepolia, Blockscout for Paseo) based on the blueprint's target chain. | `Delivered` |
| 4 | ZK Framework Selection Fix | Removed hardcoded fallback that forced Noir/SP1 when no email was uploaded; user-selected frameworks are now respected. | `Delivered` |

## Evidence Index

- [`01_chain_selection_ui.md`](./01_chain_selection_ui.md)
- [`02_on_chain_verification_ui.md`](./02_on_chain_verification_ui.md)
- [`03_dynamic_explorer_links.md`](./03_dynamic_explorer_links.md)
- [`04_zk_framework_fix.md`](./04_zk_framework_fix.md)
