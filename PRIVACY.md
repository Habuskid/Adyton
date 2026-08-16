# What's private in Adyton, and what isn't

Precision here matters more than it looks like it should. Overclaiming what's private is an easy way to lose points on integration depth — a judge who knows STRK20's actual guarantees will check this page against the demo.

## Public

- **Deposits into the vault.** The depositing address, the token, and the amount are all visible on-chain. STRK20 requires deposits to be screened by a compliance provider before they're accepted into the pool — this is mandatory at the protocol level, not an Adyton design choice, and there's no way to shield a deposit itself.
- **Withdrawal destination and amount**, when funds leave the pool entirely.
- **That a policy check happened.** The chain sees a transaction was attempted and whether the proof succeeded or failed. It does not see the numbers involved in that check.

## Private

- **Vault balance**, once funds are shielded — not visible to anyone outside the vault owner.
- **Transfer amount and recipient**, for note-to-note transfers within the pool. This is where the actual privacy guarantee lives: STRK20 note-to-note transfers emit only an encrypted note and a nullifier, no amount, no parties.
- **Policy details relative to any single transaction.** A transfer either satisfies the vault's spending policy or it doesn't — the proof discloses the pass/fail outcome, not the amount being checked against the rule.

## What we do not claim

- We do not claim deposits are private. They aren't, and no STRK20-based product can claim otherwise for the deposit step itself.
- We do not claim identity privacy on withdrawal — the destination address and amount are visible once funds leave the shielded pool.
- If Adyton is extended to route through a swap or other DeFi interaction in the future, we will not claim swap amounts are private. STRK20's own documentation is explicit that private DeFi interactions route through shared anonymizer contracts into public venues — the anonymity there comes from the shared address and mixing set, not from hiding the amount. Swap amounts and timing remain visible even when the identity behind them is not. Adyton's current scope does not include swap routing (see ROADMAP.md), specifically to avoid this ambiguity.

## Verify this yourself

Don't take this file's claims about STRK20's underlying guarantees at face value — check them against:
- [STRK20 by example](https://strk20-by-example.org/what-is-strk20)
- [Privacy SDK](https://github.com/starkware-libs/starknet-privacy)
- [STRK20 Day 0 guide](https://strk20.starknet.io) (mainnet transaction walkthrough)
