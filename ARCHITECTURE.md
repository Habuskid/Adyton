# Architecture

## Before implementing anything in this file

This document describes the intended design of Adyton. It was drafted using extracted STRK20 documentation (README, IDEAS.md, MAINNET-DAY-0.md, and CONTRIBUTING.md from the Private Sprint repo) and general knowledge of note-based privacy pools — it was **not** verified line-by-line against the live Privacy SDK source code or the current state of `strk20-by-example.org`.

Before writing or generating any implementation code from this document, verify the following against the actual, current sources — not against this file:

- The exact shape of the STRK20 note structure, nullifier scheme, and viewing-key derivation, from [`starkware-libs/starknet-privacy`](https://github.com/starkware-libs/starknet-privacy).
- Whatever SDK methods actually exist for shielding, private transfer, and note discovery, from the [starter kit](https://github.com/Akashneelesh/strk20-starter-kit) and [STRK20 by example](https://strk20-by-example.org/what-is-strk20).
- Current mainnet vs. Sepolia endpoint availability — the discovery/indexer and proving service URLs for mainnet may not have been published at the time this doc was written. Check the sprint repo's `docs/MAINNET-DAY-0.md` for the current status before assuming mainnet proving is available.
- Whether Cairo circuit composition works the way described below, against actual Cairo/STRK20 circuit examples, not assumption.

If anything below conflicts with what you find in the real docs, the real docs win. Update this file once verified, don't build against a guess.

## Core idea

A private treasury vault where every outgoing transfer must carry a proof that it satisfies a spending policy, without revealing the transfer amount, recipient, or resulting balance to anyone outside the vault owner (and an auditor, if a viewing key is explicitly granted).

## Components

### 1. Shielded holdings

Vault funds are held as STRK20 notes, using the pool's standard shield/deposit flow. No custom work here beyond standard SDK integration — deposits are public by protocol design (see PRIVACY.md), this is expected and not something Adyton tries to change.

### 2. Policy contract

A Cairo contract storing the vault's active spending rules. Start with the single simplest rule for the first working version:

- **Max transfer cap** — no single outgoing transfer may exceed a stored threshold.

Later rules (documented as roadmap, not built for v1):
- Approved-recipient allowlist
- Multi-signer threshold above a certain amount
- Per-period (e.g. daily) cumulative cap

### 3. Policy-predicate proof

This is the actual novel piece. For the max-transfer-cap rule specifically: given a transfer note with a hidden amount, produce a proof that `amount ≤ cap` without revealing `amount` itself. This is a bounded range-check circuit — a well-understood ZK pattern, not open-ended research — but the exact way it should be composed with STRK20's own note-spend proof needs to be confirmed against the SDK's actual proof composition model before implementation starts. Don't assume STRK20 exposes a hook for "add a custom predicate to a transfer proof" until you've confirmed it does.

If the SDK does not support composing an additional predicate into its existing transfer proof, the fallback design is: a wrapper contract that (a) verifies the standard STRK20 transfer proof, then (b) separately verifies the policy predicate proof, and only allows the transfer to finalize if both pass. This is a reasonable fallback but should only be used if the cleaner composed-proof approach is confirmed unavailable.

### 4. Audit / viewing key

Uses STRK20's native viewing-key mechanism as-is — no custom scoping. Per the actual protocol behavior (confirm against source), a viewing key reveals the full transaction history of the account it's registered to, not a sliced or per-transaction view. Adyton's audit page should reflect this honestly: granting the key means granting full history access, not a partial one.

## What is intentionally not custom cryptography

Shielding, private transfer, and viewing-key registration all use the SDK as documented — no reason to reimplement pool-level mechanics. The only genuinely new circuit work in this project is the policy-predicate proof described in section 3.
