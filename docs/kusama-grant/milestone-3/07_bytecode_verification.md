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

## Groth16Verifier Provenance

The wrapper's `GROTH16_VERIFIER()` is immutable and readable on-chain, so the address it points
to (and that contract's own bytecode) can be verified with the same method used above for the
wrapper itself, rather than just asserted.

| Field | Value |
| --- | --- |
| Contract | `Groth16Verifier` |
| Address (read from the wrapper's own `GROTH16_VERIFIER()`, not just asserted) | [`0xDfbcfE9D3C6ecdc0d614Ff671b5A3fd73E6d3DBC`](https://blockscout-testnet.polkadot.io/address/0xDfbcfE9D3C6ecdc0d614Ff671b5A3fd73E6d3DBC) |
| Source | `src/Groth16Verifier.sol` in the same `circuit.zip` bundle, same `hardhat.config.ts` (`resolc` `0.5.0`, `solc` `0.8.30`, optimizer `runs = 10000`) |
| PVM bytecode magic | `0x50564d0000` |
| Runtime bytecode hash (keccak256) | `0xc1d5f187d0d06a9a5a31f2254299fd0f3190efe19086e7192b3c3af430f586ee` |

Locally compiled and on-chain hashes are identical: the deployed Groth16Verifier is exactly this
bundle's source, same compiler settings, same provenance chain as the wrapper.

### Reproduce

```bash
# read the verifier address directly off the deployed wrapper, rather than trusting a stated address
cast call 0x72616B78d29d0cccBfEec1bf00E108885286D2f3 "GROTH16_VERIFIER()(address)" \
  --rpc-url https://services.polkadothub-rpc.com/testnet

# on-chain runtime-bytecode hash of that address
cast code 0xDfbcfE9D3C6ecdc0d614Ff671b5A3fd73E6d3DBC \
  --rpc-url https://services.polkadothub-rpc.com/testnet | cast keccak

# locally compiled runtime-bytecode hash (same unzipped bundle as above)
jq -r '.bytecode' hh-artifacts/src/Groth16Verifier.sol/Groth16Verifier.json | cast keccak

# PVM bytecode magic
cast code 0xDfbcfE9D3C6ecdc0d614Ff671b5A3fd73E6d3DBC \
  --rpc-url https://services.polkadothub-rpc.com/testnet | cut -c1-12
```

## Full Provenance Summary

Everything above in one place: the `sdk-images` commit that generated this blueprint's contracts,
the downloadable artifacts that came out of it, and the two deployed contracts' runtime bytecode.
Compiler settings aren't re-stated here beyond what's already above - they're read directly from
the bundle's own `hardhat.config.ts`, not something separate to prove.

| Field | Value |
| --- | --- |
| Blueprint compile timestamp | `2026-08-03T17:40:26Z` (the blueprint's own `updated_at`, readable via the API - see Reproduce below) |
| sdk-images generator commit | [`a6e5c43`](https://github.com/zkemail/sdk-images/commit/a6e5c43) ("test(circom): generator-regression test + fixture README fix (#70)"), confirmed unchanged on `staging` between 2026-07-27 and the compile timestamp above |
| `circuit.zip` hash (sha256) | `edc4a3b89b7699911c2b402fdf0a64ac3a1091b240c70420534bb4bec9f40592` |
| `circuit.zkey` hash (sha256) | `e8358bbc0c70db9f3d76ed92473dcf6c1e8de5b8a3e1fb2ea7f13778a75c34fe` (from `circuit_zkey.zip`; the separate `circuit.zkey.gz` asset for this blueprint is a 43-byte stub, not the real file) |
| Wrapper (`ZKEmailVerifier`) runtime bytecode hash | `0x5655a9fe87e1a1bd736b117c89a181c71f7985a682f419e3396574165a37ef55` |
| Groth16Verifier runtime bytecode hash | `0xc1d5f187d0d06a9a5a31f2254299fd0f3190efe19086e7192b3c3af430f586ee` |
| Compiler settings | see the [Deployment Manifest](#deployment-manifest) above - `resolc 0.5.0`, `solc 0.8.30`, optimizer `runs = 10000`, all read from the bundle's own `hardhat.config.ts` |

### Reproduce

```bash
# circuit.zip hash
shasum -a 256 circuit.zip

# zkey hash (from the zip bundle, not the separate .gz asset)
unzip circuit_zkey.zip -d zkey_unzipped
shasum -a 256 zkey_unzipped/circuit.zkey

# blueprint compile timestamp, straight from the API (updated_at)
curl -s https://staging-conductor.zk.email/blueprint/e94e7f93-7575-4e26-a147-de894b19ce3e \
  | jq -r '.updated_at.seconds' | xargs -I{} date -u -r {} "+%Y-%m-%dT%H:%M:%SZ"

# generator commit: confirm nothing touched the contract generator between a6e5c43
# and the blueprint's compile time
git log a6e5c43..origin/staging --oneline --before="2026-08-03T17:40:26Z" \
  -- circom/src/contract.rs circom/templates/ circom/src/main.rs
# (empty output confirms a6e5c43 was still the live generator state)
```
