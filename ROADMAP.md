# Scope

What Adyton builds for the Private Sprint, and what's explicitly left out — stated plainly rather than left to guesswork or implied by omission.

## In scope

- Shield funds into the vault (standard STRK20 deposit)
- Configure a single spending policy rule: maximum amount per transfer
- Attempt a transfer; it either produces a valid proof and executes privately, or fails because it violates policy
- Register a viewing key and demonstrate an authorized party decrypting the vault's transaction history
- At least three real mainnet transactions against the live STRK20 pool

## Deliberately out of scope for this build

Not because they're hard to imagine — because they each introduce a dependency or a claim that isn't fully backed by what STRK20 actually provides today, and shipping them half-real is worse than not shipping them at all.

- **Multiple simultaneous policy rules** (allowlists, multi-signer thresholds, per-period caps). The max-transfer-cap rule is built first, completely, before any additional rule is attempted.
- **Swap or DeFi routing.** STRK20's own documentation states private DeFi interactions route through shared anonymizer contracts into public venues, and swap amounts remain visible even when identity doesn't. Adding this without stating that limitation clearly would risk an overclaim. Left for a future version with the limitation stated up front.
- **Scoped, per-transaction viewing keys.** STRK20's viewing-key model grants full account history access, not a sliced view of a single transaction or dispute. A more granular scoping mechanism would need to be built as its own circuit — not attempted here.
- **Multi-asset policy logic.** Single-asset caps only, for now.

## Why this list exists

A judge reading a short list of honest exclusions trusts the rest of the README more, not less. Every feature actually shown in the demo should be something that really executed on mainnet — nothing here is presented as working when it isn't.
