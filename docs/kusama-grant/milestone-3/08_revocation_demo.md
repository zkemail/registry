# 08 - DKIM Revocation Demo

Additional evidence added in response to curator review, not itself a milestone deliverable.
Demonstrates the same real proof succeeding while its DKIM key is valid in the milestone 1
registry, then failing after that exact key is revoked, using four real on-chain transactions
against the real deployed contracts. No new proof was generated - the existing real proof used
throughout this milestone's evidence is reused unchanged; only the registry's key-hash state
changes.

## Why revoke and re-register, rather than use a separate test domain

The deployed wrapper's domain check is a compile-time constant, not a runtime parameter:

```solidity
bytes32 public constant DOMAIN_HASH = keccak256(bytes("x.com"));
```

(`contracts/src/ZKEmailVerifier.sol` in the blueprint's `circuit.zip`, see
[`07_bytecode_verification.md`](./07_bytecode_verification.md).) This specific deployed wrapper
(`0x72616B78d29d0cccBfEec1bf00E108885286D2f3`) can only ever check x.com - a different domain
would need an entirely new blueprint and a fresh contract deployment. Revoking and immediately
re-registering the same key on the existing real registry demonstrates the actual revocation
state transition against the real deployed contracts, with a minimal window (a few seconds
between the revoke and restore transactions) and no lasting effect: the key is confirmed valid
again immediately after.

## Why this differs from the existing bit-flip negative control

`ZKEmailVerifier.verify` checks three distinct conditions, each with its own error:

```solidity
if (publicInputs.length != PUBLIC_INPUTS_LENGTH) revert InvalidPublicInputsLength(...);
if (!DKIM_REGISTRY.isKeyHashValid(DOMAIN_HASH, publicInputs[PUBLIC_KEY_HASH_OFFSET])) revert InvalidPublicKey();
if (!GROTH16_VERIFIER.verifyProof(pA, pB, pC, pubSignals)) revert InvalidProof();
```

The existing negative control (milestone 2's `06_e2e_demo.md`) flips a bit in `publicInputs[0]`,
which is the key-hash slot itself - so it also reverts with `InvalidPublicKey()`, but for a
fabricated hash that was never registered. That proves the wrapper checks the registry at all.
It doesn't prove a hash that *was* valid stops working the moment the registry revokes it -
the actual registry state transition. This demo isolates that specific case: the proof and its
public inputs never change, only `DKIM_REGISTRY`'s stored state does.

## Sequence

Proof used throughout (unchanged): [`fece17c3-f3ed-4833-bbf9-eccdf530d474`](https://registry-staging.onrender.com/e94e7f93-7575-4e26-a147-de894b19ce3e/proofs/fece17c3-f3ed-4833-bbf9-eccdf530d474) (the same proof exercised by `zk-email-sdk-js`'s CI integration test). `domainHash = keccak256("x.com")` = `0xbbcc9f0af825b951a41a390086b09f7d8b4c4434d5315255b2ab6ffee1e8c781`; `keyHash` (`publicInputs[0]` of this proof) = `0x0462b6e208f3552371d7c7d2fbeb31691e5f789b9e5f0bdfaa68a6a84f01d9aa`.

| # | Call | Tx | Block | Status | Result |
| --- | --- | --- | --- | --- | --- |
| 0 | `isKeyHashValid(domainHash, keyHash)` (read, before) | - | - | - | `true` |
| 1 | `revokeDKIMPublicKeyHash(domainHash, keyHash)` on the M1 registry | [`0x384c1540...74562`](https://blockscout-testnet.polkadot.io/tx/0x384c1540afaaf6782c5cff3bad71cd05854bd2f422246e8acf2f7cd42af74562) | `12697891` | Success | Emits `KeyHashRevoked(domainHash)` |
| 2 | `verify(proof, publicInputs)` on the wrapper, same proof, sent as a transaction | [`0xea3d710d...c8e5c5`](https://blockscout-testnet.polkadot.io/tx/0xea3d710de2c21f6792d084262d6f65d5376d1cfb0e8ac3dafd6e62df42c8e5c5) | `12697893` | **Failed** | Reverts with `InvalidPublicKey()` (selector `0xa2d0fee8`) - confirmed by replaying the same call against block `12697892`, where `isKeyHashValid` independently reads `false` |
| 3 | `setDKIMPublicKeyHash(domainHash, keyHash)` on the M1 registry - restores it | [`0xde60c1ec...cb41f14`](https://blockscout-testnet.polkadot.io/tx/0xde60c1eca66d5caa295b885fb83a12023f49ef44a148d84d551ef49e4cb41f14) | `12697894` | Success | Emits `KeyHashRegistered(domainHash, keyHash)` |
| 4 | `verify(proof, publicInputs)` on the wrapper, same proof again | [`0x77fb1ffd...f5c8de422`](https://blockscout-testnet.polkadot.io/tx/0x77fb1ffde5f93a74038cc639bed5f4880c0e0d2d4c76401afb58bdcf5c8de422) | `12697896` | Success | Same unchanged proof verifies again, confirming only the registry state determined the outcome |
| 5 | `isKeyHashValid(domainHash, keyHash)` (read, after) | - | - | - | `true` |

### Reproduce

From the M1 registry owner account (`0x9401296121FC9B78F84fc856B1F8dC88f4415B2e`):

```bash
RPC_URL=https://services.polkadothub-rpc.com/testnet
REGISTRY=0xD9e492f8104Ec730AF47A1A5C0cEAf94C89Da8EE
WRAPPER=0x72616B78d29d0cccBfEec1bf00E108885286D2f3
DOMAIN_HASH=$(cast keccak "x.com")
KEY_HASH=0x0462b6e208f3552371d7c7d2fbeb31691e5f789b9e5f0bdfaa68a6a84f01d9aa

# proof and public inputs for fece17c3-f3ed-4833-bbf9-eccdf530d474, ABI-encoded the same way
# verifyProofOnChain does (see 04_sdk_on_chain_verification.md)
PROOF_BYTES=0x...
PUBLIC_INPUTS="[...]"

cast call $REGISTRY "isKeyHashValid(bytes32,bytes32)(bool)" "$DOMAIN_HASH" "$KEY_HASH" --rpc-url $RPC_URL

cast send $REGISTRY "revokeDKIMPublicKeyHash(bytes32,bytes32)" "$DOMAIN_HASH" "$KEY_HASH" \
  --rpc-url $RPC_URL --private-key "$PRIVATE_KEY"

cast send $WRAPPER "verify(bytes,bytes32[])" "$PROOF_BYTES" "$PUBLIC_INPUTS" \
  --rpc-url $RPC_URL --private-key "$PRIVATE_KEY" --gas-limit 500000

cast send $REGISTRY "setDKIMPublicKeyHash(bytes32,bytes32)" "$DOMAIN_HASH" "$KEY_HASH" \
  --rpc-url $RPC_URL --private-key "$PRIVATE_KEY"

cast send $WRAPPER "verify(bytes,bytes32[])" "$PROOF_BYTES" "$PUBLIC_INPUTS" \
  --rpc-url $RPC_URL --private-key "$PRIVATE_KEY"

cast call $REGISTRY "isKeyHashValid(bytes32,bytes32)(bool)" "$DOMAIN_HASH" "$KEY_HASH" --rpc-url $RPC_URL

# to independently confirm the revert reason at any time, replay the call against the
# block where the key was revoked:
cast call $WRAPPER "verify(bytes,bytes32[])" "$PROOF_BYTES" "$PUBLIC_INPUTS" \
  --rpc-url $RPC_URL --block 12697892
```
