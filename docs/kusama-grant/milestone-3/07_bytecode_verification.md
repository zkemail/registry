# 07 - Bytecode Verification

Verifier contracts are generated and deployed dynamically per blueprint by the registry's compilation pipeline, so there's no single fixed contract to point at like milestone 1's `DKIMRegistry`. This walks through reproducing the deployed bytecode for a specific blueprint's verifier contract from its downloadable circuit bundle, and comparing it against what's actually on-chain.

## Deployment Manifest

| Field | Value |
| --- | --- |
| Blueprint | [`zkemailverify/kusama_grant_paseo_e2e`](https://registry-staging.onrender.com/e94e7f93-7575-4e26-a147-de894b19ce3e/versions) (`e94e7f93-7575-4e26-a147-de894b19ce3e`) |
| Contract | `ZKEmailVerifier` |
| Network | Polkadot Hub Testnet (Paseo Testnet), chain ID `420420417` |
| Address | [`0x72616B78d29d0cccBfEec1bf00E108885286D2f3`](https://blockscout-testnet.polkadot.io/address/0x72616B78d29d0cccBfEec1bf00E108885286D2f3) |
| `resolc` version | `0.5.0` (pinned in the bundle's `hardhat.config.ts`) |
| `solc` version | `0.8.30` |
| Optimizer | enabled, `runs = 10000` |
| PVM bytecode magic | `0x50564d0000` (`"PVM\0"` prefix - confirms genuine PolkaVM/RISC-V bytecode, not EVM) |
| Runtime bytecode hash (keccak256) | `0x5655a9fe87e1a1bd736b117c89a181c71f7985a682f419e3396574165a37ef55` |

## Download the circuit bundle

Every compiled blueprint has a downloadable `circuit.zip` containing the contract source, its `hardhat.config.ts`, and a `package.json` with the exact build script used to compile it:

[`https://registry-staging.onrender.com/e94e7f93-7575-4e26-a147-de894b19ce3e/download`](https://registry-staging.onrender.com/e94e7f93-7575-4e26-a147-de894b19ce3e/download)

`circuit.zip` is listed under "Downloads for Server Side Circom". Unzip it - the `contracts/` directory is a self-contained Hardhat project.

## Reproducible Command Flow

From the unzipped bundle's `contracts/` directory:

```bash
yarn install
yarn build
```

## Verification

- Source-code verification is **not currently possible for PolkaVM deployments.** The contract is `resolc`-compiled to PolkaVM/RISC-V bytecode; the Blockscout explorer's verification API and `@nomicfoundation/hardhat-verify` both only support EVM `solc`/Vyper bytecode, and `@parity/hardhat-polkadot` does not yet provide a resolc-aware verify task. This is a PolkaVM tooling gap, not a deployment issue.
- The contract is still fully visible on [Blockscout](https://blockscout-testnet.polkadot.io) (address, PolkaVM bytecode, transactions) and is exercisable via its read methods.

## Bytecode Provenance

Because automated source verification is not yet available for PolkaVM, provenance is established by comparing the locally compiled runtime bytecode against the on-chain code.

| Source | keccak256 |
| --- | --- |
| Locally compiled (`hh-artifacts/src/ZKEmailVerifier.sol/ZKEmailVerifier.json`) | `0x5655a9fe87e1a1bd736b117c89a181c71f7985a682f419e3396574165a37ef55` |
| On-chain (`0x72616B78d29d0cccBfEec1bf00E108885286D2f3`) | `0x5655a9fe87e1a1bd736b117c89a181c71f7985a682f419e3396574165a37ef55` |

The two hashes are identical: the deployed contract is exactly this bundle's source, compiled with the compiler settings in its own `hardhat.config.ts`. Reproduced independently twice from a clean unzip, both times matching.

### Reproduce

```bash
# on-chain runtime-bytecode hash
cast code 0x72616B78d29d0cccBfEec1bf00E108885286D2f3 \
  --rpc-url https://services.polkadothub-rpc.com/testnet | cast keccak

# locally compiled runtime-bytecode hash (from the unzipped bundle's contracts/ directory,
# after yarn install && yarn build)
jq -r '.bytecode' hh-artifacts/src/ZKEmailVerifier.sol/ZKEmailVerifier.json | cast keccak

# PVM bytecode magic (first bytes should read 0x50564d00, "PVM\0")
cast code 0x72616B78d29d0cccBfEec1bf00E108885286D2f3 \
  --rpc-url https://services.polkadothub-rpc.com/testnet | cut -c1-12
```
