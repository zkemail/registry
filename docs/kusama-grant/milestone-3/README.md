# Milestone 3 - Verification Pipeline + SDK & Frontend

Primary Goal: extend the Circom pipeline, SDK, and registry frontend to support automated PolkaVM verifier contract generation and deployment, and end-to-end on-chain proof verification.

This milestone spans five deliverables across three repositories: sdk-images (1-3), zk-email-sdk-js (4), and registry (5).

## Deliverables

| # | Name | Description | Deliverable | What was done / Proof |
| --- | --- | --- | --- | --- |
| 1 | Circom Pipeline Integration | Modify the existing Circom pipeline to integrate the new contracts project structure and support PolkaVM deployments. | Updated Circom pipeline capable of generating verifier contracts with Paseo testnet deployment. | Pipeline orchestration in `main.rs` renders templates, exports the verifier, deploys via Ignition using `payload.chain_id` (including Polkadot Hub testnet `420420417`), and persists the address to the database. **Proof:** [`01_circom_pipeline_integration.md`](https://github.com/zkemail/sdk-images/blob/kusama-grant/circom/docs/kusama-grant/milestone-3/01_circom_pipeline_integration.md). |
| 2 | Proof Formatting and Wrapper Integration Layer | Implement proof formatting, serialization, and integration logic to ensure compatibility between Circom-generated proofs and the verifier wrapper contracts, enabling seamless on-chain verification. | Proof formatting and integration layer enabling compatibility between Circom-generated proofs and on-chain verifier contracts. | Templated `ZKEmailVerifier` wrapper decodes Groth16 proofs and public inputs; the wrapper/verifier Solidity itself is rendered from `ContractData` (signal size, public-key-hash offset) via `create_zkemail_verifier_and_interface_at_paths`, gated on the DKIM key hash. **Proof:** [`02_proof_formatting_and_wrapper_integration.md`](https://github.com/zkemail/sdk-images/blob/kusama-grant/circom/docs/kusama-grant/milestone-3/02_proof_formatting_and_wrapper_integration.md). |
| 3 | Blueprint Deployment System | Extend the blueprint system to support configurable target chains and automate contract generation and deployment for new blueprints. | Blueprint pipeline supporting automatic contract generation and deployment. | Chain id from the blueprint payload selects the Ignition network; the deployed verifier address is read back from Ignition's output and persisted to the blueprint record. **Proof:** [`03_blueprint_deployment_system.md`](https://github.com/zkemail/sdk-images/blob/kusama-grant/circom/docs/kusama-grant/milestone-3/03_blueprint_deployment_system.md). |
| 4 | SDK On-Chain Verification | Integrate on-chain proof verification into the SDK using the generic verifier interface defined in Milestone 2. | SDK functionality enabling on-chain proof verification via deployed verifier contracts | `verifyProofOnChain` supports Ethereum Sepolia, Base Sepolia, and Paseo Testnet (Polkadot) against the `IZKEmailVerifier` ABI, viem-encoded. Published to npm and consumed by the registry frontend. **Proof:** [`04_sdk_on_chain_verification.md`](https://github.com/zkemail/zk-email-sdk-js/blob/kusama-grant/docs/kusama-grant/milestone-3/04_sdk_on_chain_verification.md). |
| 5 | Frontend Integration & Documentation | Update the registry frontend to support target chain selection and enable on-chain proof verification. Include documentation with public how-tos. | Updated frontend supporting Paseo Assethub target and documentation with usage instructions | Chain selector added to blueprint creation, a "Verify On-Chain" button on the proof list and detail pages, and chain-aware block explorer links. **Proof:** [`05_frontend_integration_and_documentation.md`](./05_frontend_integration_and_documentation.md), [`06_public_howto.md`](./06_public_howto.md), [`07_bytecode_verification.md`](./07_bytecode_verification.md). |

## Evidence Index

- [`01_circom_pipeline_integration.md`](https://github.com/zkemail/sdk-images/blob/kusama-grant/circom/docs/kusama-grant/milestone-3/01_circom_pipeline_integration.md) - sdk-images
- [`02_proof_formatting_and_wrapper_integration.md`](https://github.com/zkemail/sdk-images/blob/kusama-grant/circom/docs/kusama-grant/milestone-3/02_proof_formatting_and_wrapper_integration.md) - sdk-images
- [`03_blueprint_deployment_system.md`](https://github.com/zkemail/sdk-images/blob/kusama-grant/circom/docs/kusama-grant/milestone-3/03_blueprint_deployment_system.md) - sdk-images
- [`04_sdk_on_chain_verification.md`](https://github.com/zkemail/zk-email-sdk-js/blob/kusama-grant/docs/kusama-grant/milestone-3/04_sdk_on_chain_verification.md) - zk-email-sdk-js
- [`05_public_howto.md`](https://github.com/zkemail/zk-email-sdk-js/blob/kusama-grant/docs/kusama-grant/milestone-3/05_public_howto.md) - zk-email-sdk-js
- [`05_frontend_integration_and_documentation.md`](./05_frontend_integration_and_documentation.md) - registry
- [`06_public_howto.md`](./06_public_howto.md) - registry
- [`07_bytecode_verification.md`](./07_bytecode_verification.md) - registry
- [`08_revocation_demo.md`](./08_revocation_demo.md) - registry - additional evidence added in response to curator review, not itself a milestone deliverable

## Summary

The Circom pipeline generates templated wrappers and zkey-derived `Groth16Verifier` contracts and deploys them via Hardhat Ignition (sdk-images); the SDK's `verifyProofOnChain` calls the deployed verifier through a generic `IZKEmailVerifier` interface (zk-email-sdk-js); the registry frontend lets users select a target chain, generate proofs, and verify them on-chain through the UI (registry).
