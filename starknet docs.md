# Starknet STRK20 Comprehensive Documentation Reference
> Complete, authoritative, and unabridged reference for building on Starknet Privacy (STRK20).
> Sourced directly from official Starkware documentation: strk20.starknet.io, strk20-by-example.org, and Starknet Privacy specifications.

---

## Table of Contents
1. [Core Overview & Architecture](#strk20--privacy-that-works-for-crypto)
2. [Builder Privacy Overview](#builder-privacy-overview)
3. [Concepts & Cryptography](#concepts)
   - [What is STRK20?](#what-is-strk20)
   - [Notes & Nullifiers (UTXO Model)](#notes--nullifiers)
   - [Encryption & Viewing Keys (ECDH & Poseidon Masking)](#encryption--viewing-keys)
   - [Channels & Note Discovery](#channels--note-discovery)
   - [Actions, Phases & Proofs (Balance Invariant)](#actions-phases--proofs)
   - [Compliance & Auditing (Selective Disclosure & FPI Screening)](#compliance--auditing)
4. [Anonymizer Contracts (Cairo privacy_invoke Pattern)](#anonymizer-contract-anatomy)
   - [Anonymizer Anatomy & Interface](#anonymizer-contract-anatomy)
   - [Swap Helper (AMM Balance-Delta Idiom)](#swap-helper)
   - [Vesu Lending Helper (ERC-4626 Vaults)](#vesu-lending-helper)
   - [Escrow Helper (Commitment & Claim Pattern)](#escrow)
5. [Starknet Wallet API (starknet.js / @starknet-io/types-js)](#starknet-wallet-api)
   - [Overview & Capabilities](#starknet-wallet-api)
   - [React Hooks (starknet-start useStrk20)](#starknet-start)
   - [Direct WalletAccountV6](#starknetjs)
   - [Private DeFi End-to-End (`${openNoteIds[N]}`)](#private-defi-end-to-end)
   - [AVNU Private Swaps](#avnu-private-swaps)
6. [Starknet Privacy SDK (@starkware-libs/starknet-privacy-sdk)](#getting-started)
   - [Getting Started & Provider Setup](#getting-started)
   - [Registration (register & autoRegister)](#register)
   - [Deposit](#deposit)
   - [Transfer](#transfer)
   - [Deposit + Transfer](#deposit--transfer)
   - [Withdraw](#withdraw)
   - [Multi-Operation Batches](#multi-operation-batches)
   - [Channels & Setup Requirements](#channels--setup-requirements)
   - [Discovering Notes](#discovering-notes)
   - [Discovery Providers](#discovery-providers)
   - [Proving Configuration (provingBlockId, proofFacts, nonces)](#proving-configuration)
7. [Applications & Agent Skills](#applications)
   - [Tip Jar Case Study](#tip-jar)
   - [Agent Skill Specifications](#agent-skill)
8. [STRK20 Brand, Design Tokens & UI Guidelines](#strk20-brand--ui-guidelines)
9. [Request for Startups (RFP Overview)](#request-for-startups-open-problem-statements)

---


# STRK20 by Example - full site content

> Learn Starknet Privacy (STRK20) with runnable examples - privacy pools, notes and nullifiers, viewing keys, the Starknet Wallet API, anonymizer contracts, and wallet-builder SDK flows. Every page is available as raw Markdown at the .md URLs below; the full site in one file is at https://strk20-by-example.org/llms-full.txt.

---

# What is STRK20?

Source: https://strk20-by-example.org/what-is-strk20

> An introduction to Starknet Privacy - confidential token transfers on a public chain

The foundation for all privacy on Starknet: the layer everything above reads from
and writes to. STRK20 brings shielded balances, private transfers, and private
DeFi to any ERC-20 on Starknet, built on the wallets and liquidity that already
exist rather than a separate ecosystem.

### How it works at a high level

- **Note-based pool: not a mixer.** Shielding deposits an ERC-20 into the pool,
  where the balance is held as an encrypted note (a UTXO). Private transfers
  spend existing notes and generate new ones.
- **Registration first:** An account must register in the pool (set a viewing key)
  before it can hold or receive private balances; both sender and recipient must
  be registered before private transfers between them. Wallets handle registration
  on first use, and channel setup between counterparties is automatic after that.
- **Onchain proof verification:** Every private transaction carries a
  zero-knowledge (STARK) proof confirming the spent notes exist, belong to the
  spender, haven't been double-spent, and that value is conserved. Starknet
  verifies the proof in-protocol before updating the pool's state.
- **Hidden vs. visible:** Inside the pool, the sender, receiver, amounts, token
  type, and which notes were spent are all private. What stays visible: deposit
  and withdrawal amounts (the public ERC-20 legs), that someone is interacting
  with the pool, and timing. A Paymaster can decouple the submitter's address
  from the transaction.
- **Shielding:** Users shield assets when they want privacy and unshield them when
  transparency is required, moving value between public and confidential states on
  the same underlying token.

## The lifecycle: public → private → public

1. **Deposit** - move public ERC-20 tokens into the pool. The deposit itself is
   visible on-chain (depositor and amount), but the resulting note is encrypted.
2. **Private transfers** - transfer value inside the pool by spending notes and
   creating new ones. Nobody watching the chain can tell who paid whom, or how much.
3. **DeFi** - if your flow calls for it, notes can fund DeFi actions through an
   anonymizer contract, with results credited back as private notes. This leg
   is confidential rather than fully private: the link to the user is hidden,
   but the app-side action and amounts can still be public.
4. **Withdraw** - move tokens back out of the pool to a public address.

**Private sub-accounts** widen the DeFi leg: account-based flows such as
borrowing and staking run through real Starknet accounts that carry no public
onchain link back to the user's main wallet, and using fresh sub-accounts per
app fragments the trail further. The same caveat applies - app-side activity
and amounts can still be public. The SDK route ships as of Privacy SDK
`0.14.3-rc.4`; the Wallet API route is still pending, so dapps relying on the
user's wallet cannot use them yet.

## What makes it different

- **Native to Starknet** - no separate chain or bridge. It runs as a contract on
  Starknet and composes with existing accounts and DeFi.
- **Variable amounts, reusable notes** - unlike fixed-denomination mixers, notes
  carry arbitrary amounts and change is handled automatically.
- **Scalable discovery** - recipients find their incoming funds by scanning only
  their own channels, so cost scales with your activity, not total pool volume.
- **Selective disclosure** - at registration every user encrypts their private
  viewing key to an auditor's public key, so the system can disclose the
  information needed to respond to a legitimate regulatory request without
  exposing unrelated users.

## The building blocks

| Concept             | What it is                                                                           |
| ------------------- | ------------------------------------------------------------------------------------ |
| Note                | Immutable record of ownership of an amount of a token                                |
| Nullifier           | One-time value revealed when spending a note (prevents double-spend)                 |
| Viewing key         | Keypair used to encrypt/decrypt note data and derive nullifiers                      |
| Channel             | Unidirectional sender → recipient lane where notes are stored                        |
| Anonymizer contract | Small adapter that lets pool funds interact with external DeFi                       |
| Deposit screening   | Every deposit is screened and signed by FPI; the pool verifies the signature onchain |

Each of these has its own page in the Concepts section - read them in order and
you will have the full mental model.

## Who this site is for

- **Private dapp developers** integrating with existing wallets - see the
  Starknet Wallet API section.
- **Core dapp builders** writing private DeFi integrations - see the
  Anonymizer Contracts section.
- **Wallet builders** implementing privacy flows directly - see Build Privacy
  Wallets.
- **Anyone** who wants to understand how private payments work on Starknet - start
  with the Concepts pages.

Have a coding agent? It can run this integration for you - see
[Agent Skill](/agent-skill).

---

# Builder Privacy Overview

Source: https://strk20-by-example.org/builder-privacy-overview

> Choose the right STRK20 integration path: Starknet Wallet API, anonymizer contracts, building privacy wallets, sub-accounts, or prover infrastructure.

STRK20 is a privacy pool plus a small set of integration surfaces. Start with
the narrowest surface that keeps user keys in the right place and only move to a
lower-level route when your product needs more control.

## Quick decision guide

| If you want to...                                                                           | Use...                                                                                                   | Why                                                                                                                                                                                  |
| ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Build a private dapp anywhere from private DeFi, private consumer apps, private games, etc. | [Anonymizer contracts](/helpers/privacy-invoke) and [Starknet Wallet API](/starknet-wallet-api/overview) | The wallet manages viewing keys, notes, proving, and submission; for DeFi, the pool calls your `privacy_invoke` adapter atomically, then credits the result back into private notes. |
| Build a privacy wallet on Starknet                                                          | [Build Privacy Wallets](/sdk/getting-started)                                                            | Direct access to registration, channels, note discovery, transaction building, and proving configuration.                                                                            |
| Operate proving infrastructure yourself                                                     | Prover backend                                                                                           | For wallets and infrastructure teams that need control over proof generation.                                                                                                        |
| Hide the link between a user's main wallet and app activity                                 | Private sub-accounts (SDK route available; Wallet API pending)                                           | Advanced account-based privacy route; SDK-route teams can start today, dapps relying on the user's wallet must wait.                                                                 |
| Let users fund a private balance from an EVM wallet and withdraw it back to one             | [Privacy Bridge](https://github.com/starkware-libs/privacy-bridge)                                       | Moves USDC between EVM chains and the pool over Circle CCTP, with its own inbound/outbound anonymizer contracts, so the two sides are not linked onchain.                            |

## Core surfaces

### STRK20 pool

The pool is the base contract layer. Deposits move public ERC-20 tokens into the
pool, private transfers spend encrypted notes inside the pool, and withdrawals
move tokens back to a public address. Movement inside the pool hides sender,
receiver, token, amount, and spent notes from public observers.

### Starknet Wallet API

This is the recommended route for most **private dapps**. Your dapp asks the
user's privacy-enabled wallet to perform an action; the wallet handles private
state, proofs, and submission. A normal dapp should not receive the user's
viewing key or manage note discovery directly. See the
[Starknet Wallet API overview](/starknet-wallet-api/overview).

### Anonymizer contracts

Anonymizer contracts, also called helper contracts, are app-specific Cairo
adapters for private DeFi. The pool withdraws tokens to the helper, calls its
`privacy_invoke` entry point, and the helper returns `OpenNoteDeposit`
instructions for whatever should be credited back into private notes. This is the
focus for **core builders shipping private dapps**. See
[Anonymizer Contract Anatomy](/helpers/privacy-invoke).

### Privacy Bridge (EVM to pool)

Most users hold their USDC on an EVM chain, not on Starknet. The
[Privacy Bridge](https://github.com/starkware-libs/privacy-bridge) is a
value-movement engine for exactly that gap: it takes USDC from an EVM wallet and
deposits it into the pool as a private note, and moves value back out to an EVM
chain, using Circle's CCTP for the cross-chain leg. Both directions run through
its own Cairo anonymizer contracts - `OutboundAnonymizer` on the way out,
`InboundAnonymizer` on the way back in - so the deposit side and the withdrawal
side cannot be linked onchain. All client-side key material is derived from a
single wallet signature; only the read-only viewing key may be persisted.

The repository is open source (Apache 2.0) and ships three parts: the
`bridge-anonymizers` Cairo contracts, the framework-agnostic
`@starkware-libs/starknet-privacy-bridge` TypeScript engine with optional React
hooks, and a demo web app. It is early and moving fast - read its README before
planning around it.

### Build Privacy Wallets

The Build Privacy Wallets section is the lower-level SDK route for teams building
**privacy wallets on Starknet**, account-controlled backends, and advanced
integrators. Use it when you need to
manage registration, channels, note discovery, transaction construction, and
proving providers yourself. See [Build Privacy Wallets](/sdk/getting-started).

### Private sub-accounts

Private sub-accounts are for account-based app activity where the user does not
want a public onchain link to their main wallet.

**Status is split.** The **SDK route is available** as of Privacy SDK
`0.14.3-rc.4`: `transfers.build().subaccounts(dappName).invoke(...)`, backed by
the `sub_account_anonymizer` contract package. The **Wallet API route is not** —
no sub-account method is exposed by `@starknet-io/types-js` 0.10.3 or
starknet.js, so a dapp relying on the user's wallet cannot use them yet.

If you build the account yourself (a wallet, or a backend holding its own keys),
you can start now. If you rely on the user's wallet, wait for the Wallet API
call. Confirm audit readiness either way.

### Prover backend

Most dapps do not need to operate proving infrastructure. Wallets,
infrastructure teams, and advanced integrators may run their own prover when
they need operational control over proof generation. Deposit screening applies
regardless of proving route: FPI screens shielding addresses and signs each
deposit, and the pool verifies the signature onchain, so a self-hosted prover
meets the same deposit-screening requirement as hosted services.

## Builder rules of thumb

- Use the Starknet Wallet API first for user-facing private dapps.
- Use Build Privacy Wallets when you are building the wallet itself or need low-level SDK control.
- Do not ask a normal dapp user for their viewing key.
- For private DeFi integrations, expect both a Starknet Wallet API flow and an app-specific anonymizer contract.
- Deposits are screened on every route - self-hosted proving does not bypass onchain screening.
- Be explicit about what remains public: deposits, withdrawals, timing, and some app-side activity may still be visible.
- Verify wallet support, API versions, contract addresses, and compliance assumptions before launch.

## Read next

- [What is STRK20?](/what-is-strk20)
- [Starknet Wallet API](/starknet-wallet-api/overview)
- [Anonymizer Contract Anatomy](/helpers/privacy-invoke)
- [Build Privacy Wallets](/sdk/getting-started)

---

# Notes & Nullifiers

Source: https://strk20-by-example.org/notes-and-nullifiers

> The UTXO note model - how private balances are stored, spent and protected from double-spending

A **note** is the unit of private balance inside the pool. It is an immutable
record of three things:

- **Owner** - a Starknet address, authorized to spend by its account signature
  plus knowledge of its private viewing key
- **Token** - the ERC-20 contract address
- **Amount** - a 128-bit value, stored encrypted on-chain

## Spending is all-or-nothing (UTXO)

Notes cannot be partially spent. To pay 30 out of a 100-token note, you consume
the whole note and create two new ones:

```
        ┌────────────────┐        spend        ┌──────────────────────┐
Alice ──│ note: 100 USDC │──────────────────►  │ note: 30 USDC → Bob  │
        └────────────────┘  publish nullifier  │ note: 70 USDC → Alice│ (change)
                                               └──────────────────────┘
```

This is exactly Bitcoin's UTXO model, but every input and output is encrypted.
A zero-knowledge proof guarantees the amounts balance without revealing them.

## Open notes

An **open note** deliberately skips amount encryption. It uses a
protocol-reserved salt, so the stored payload is plaintext, and its amount can
be filled in _after_ proof generation:

- salt = `OPEN_NOTE_SALT` (= 1); encrypted notes always use salt ≥ 2
- amount is zero while awaiting deposit, then the plaintext filled amount
- token address is stored in the clear

Open notes exist for DeFi: a swap's output amount is only known at execution
time, long after the client proved its transaction. An anonymizer contract fills the
open note with the actual output, which then becomes spendable private balance.

## Where a note lives

Notes are not stored in one global list. Each note's storage location is
derived from the **channel key** (a secret shared by sender and recipient), the
token, and a sequential index inside the channel's per-token subchannel:

```cairo
/// `note_id = h(NOTE_ID_TAG, channel_key, token, index, 0)`
pub(crate) fn compute_note_id(
    channel_key: felt252, token: ContractAddress, index: usize,
) -> felt252 {
    hash([NOTE_ID_TAG, channel_key, token.into(), index.into(), Zero::zero()].span())
}
```

Indices are dense and sequential (0, 1, 2, …), and every note cell is
**WriteOnce** - written once, never mutated. Without the channel key, note
locations are indistinguishable from random storage slots.

## Nullifiers

Spending a note does not delete it. Instead the spender publishes a
**nullifier** - a one-way Poseidon hash bound to the note and to the owner's
private viewing key:

```cairo
/// `nullifier = h(NULLIFIER_TAG, channel_key, token, index, 0, owner_private_key)`
pub(crate) fn compute_nullifier(
    channel_key: felt252, token: ContractAddress, index: usize, owner_private_key: felt252,
) -> felt252 {
    hash(
        [NULLIFIER_TAG, channel_key, token.into(), index.into(), Zero::zero(), owner_private_key]
            .span(),
    )
}
```

Three properties make this work:

| Property      | Meaning                                                                                             |
| ------------- | --------------------------------------------------------------------------------------------------- |
| Deterministic | The same note always produces the same nullifier - no way to spend twice under different nullifiers |
| Unique        | Exactly one valid nullifier per note; the contract rejects any repeat                               |
| Unlinkable    | Without the owner's viewing key, a published nullifier cannot be matched to any note                |

Note the asymmetry: because the nullifier includes the _owner's_ private
viewing key, even the sender who created a note cannot compute its nullifier -
so a sender cannot watch for when their payment gets spent.

Next: how keys encrypt all of this - [Encryption & Viewing Keys](/viewing-keys).

---

# Encryption & Viewing Keys

Source: https://strk20-by-example.org/viewing-keys

> How viewing keys, domain-separated masking and ECDH on the STARK curve keep note data private

Every participant in the pool has a **viewing keypair**:

| Key                 | Symbol | Who has it    | Used for                                            |
| ------------------- | ------ | ------------- | --------------------------------------------------- |
| Private viewing key | `k`    | The user only | Decrypting notes, deriving channel keys, nullifiers |
| Public viewing key  | `K`    | On-chain      | Letting others encrypt notes and channels _to_ you  |

`K = k·G` on the STARK curve. The public key is **registered once** via the
`SetViewingKey` action and treated as immutable - every channel ever opened to
you is derived from it, so it cannot change without breaking discovery.

## Symmetric masking

Inside a channel, data is hidden with cheap "hash-and-add" masking rather than
heavyweight ciphers. Each field gets its own **domain-separated Poseidon hash**
plus a per-use **salt**, so no mask is ever reused:

```
enc_amount = (h(ENC_AMOUNT_TAG, channel_key, token, index, 0, salt) + amount) mod 2^128
enc_token  =  h(ENC_TOKEN_TAG,  channel_key, index, 0, salt) + token
```

Anyone holding the channel key recomputes the mask and subtracts it off.
Anyone without it sees values indistinguishable from random field elements.
The domain tags (`ENC_AMOUNT_TAG:V1`, `ENC_TOKEN_TAG:V1`, …) guarantee that a
mask derived for one purpose can never be replayed in another context.

## Asymmetric encryption: ECDH with ephemeral keys

Symmetric masking needs a shared secret - the channel key. Establishing it uses
**ECDH on the STARK curve** with a fresh ephemeral key per channel:

```
sender picks random r
publishes   rG            (ephemeral public key)
computes    shared = r·K  (recipient's public viewing key)

enc_channel_key = h(ENC_CHANNEL_KEY_TAG, shared.x) + channel_key
enc_sender_addr = h(ENC_SENDER_ADDR_TAG, shared.x) + sender_addr
```

The recipient computes the same secret from the other side: `k·(rG) = r·K`.
An observer sees only `rG` and two masked values - they learn that _a_ channel
was opened, not by whom or to whom.

## The auditor copy

At registration, the user's private viewing key `k` is also encrypted - with
the same ephemeral ECDH pattern - to the **auditor's public key** and stored
on-chain. This single escrowed ciphertext is what enables compliance: an
auditor under lawful process can recover `k` and decrypt that user's history,
while everyone else's data stays private. See
[Compliance & Auditing](/compliance).

## Why open notes skip masking

An **open note** carries its amount in plaintext, using the protocol-reserved
salt. This is deliberate: when a DeFi interaction (say, an AMM swap) produces
an output amount that is only known at execution time, the client cannot mask
it in advance - the mask is part of the proven transaction, but the amount
isn't decided until the anonymizer contract runs on-chain. Open notes trade amount
privacy for that late binding; ownership and subsequent spends remain private.

## Rule of thumb

- Everything derivable from `k` + public on-chain data → readable by you.
- Everything else → opaque Poseidon outputs and masked field elements.

Next: where encrypted notes are filed and how recipients find them -
[Channels & Note Discovery](/channels-and-subchannels).

---

# Channels & Note Discovery

Source: https://strk20-by-example.org/channels-and-subchannels

> Directional channels, per-token subchannels and the scan algorithm recipients use to find their notes

There is no "inbox" for private payments. Encrypted notes sit silently in the
pool's storage until the recipient looks for them. **Channels** make that
lookup cheap and deterministic.

## Channels are directional lanes

A channel is a **sender → recipient** lane. Its key is derived from the
sender's private viewing key and the recipient's public viewing key:

```
channel_key = h(CHANNEL_KEY_TAG, sender_addr, sender_private_key,
                recipient_addr, recipient_public_key)
```

Both ends can reach the same secret - the sender directly, the recipient via
ECDH decryption of the channel record - but nobody else can. If Alice and Bob
pay each other, that is **two** channels, one per direction. Directionality
keeps sender authorization simple and recipient discovery deterministic.

A deposit is just a channel from yourself to yourself.

## Subchannels: one per token

Inside a channel, notes are grouped by token. The first transfer of a given
token through a channel opens that token's **subchannel**, which holds the
encrypted token address and its own note index counter.

```
Alice ──► Bob (channel)
   ├── subchannel[0]: USDC   ── note 0, note 1, note 2, ...
   └── subchannel[1]: STRK   ── note 0, note 1, ...

Alice ──► Alice (self-channel, used for deposits and change)
   └── subchannel[0]: USDC   ── note 0, note 1, ...
```

## Dense sequential indices

Outgoing channels, subchannels and notes are all stored as **dense sequential
lists** - indices 0, 1, 2, … with no gaps, in WriteOnce storage. Density is
what makes scanning terminate: a reader walks each list until the first empty
slot and knows nothing is hidden beyond it.

## The discovery scan

To find your incoming funds, given only your private viewing key:

1. **Channels** - scan channel entries addressed to you, attempting to decrypt
   each channel record; success means "this channel is for me" and yields the
   channel key.
2. **Subchannels** - for each discovered channel, walk its subchannels
   (index 0, 1, …) until the first empty slot, unmasking each token address.
3. **Notes** - for each (channel, token) pair, walk note indices until the
   first empty slot, unmasking amounts and checking each note's nullifier
   against the on-chain nullifier set to skip spent ones.

What is left is your spendable private balance. A discovery service can run
this scan on your behalf; see the SDK docs for how viewing-key material is
handled in that flow.

## Why this scales

The scan touches only channels addressed to _you_ and the notes inside them.
Cost is proportional to **your own activity** - how many counterparties pay you
and how many notes they send - not to total pool volume. A pool with millions
of transfers costs you no more to scan than a quiet one, which is what makes
private payments practical at chain scale.

Next: how a spend is assembled and proven -
[Actions, Phases & Proofs](/actions-and-proofs).

---

# Actions, Phases & Proofs

Source: https://strk20-by-example.org/actions-and-proofs

> The phased action model, the per-token balance invariant, and how transactions are proven with Stwo

Every pool transaction is a batch of **client actions**. Actions are grouped
into phases with a fixed ordering - a transaction may skip phases, but must
never go backwards:

| Phase | Action                                              | Effect on temp balance |
| ----- | --------------------------------------------------- | ---------------------- |
| 0     | `SetViewingKey`                                     | -                      |
| 1     | `OpenChannel`                                       | -                      |
| 2     | `OpenSubchannel`                                    | -                      |
| 3     | `Deposit`                                           | + amount               |
| 4     | `UseNote`                                           | + note amount          |
| 5     | `CreateEncNote` / `CreateOpenNote`                  | − amount               |
| 6     | `Withdraw`                                          | − amount               |
| 7     | `InvokeExternal` / `ComputeAndInvoke` (at most one) | -                      |

`ComputeAndInvoke` is the sub-account path: it runs `privacy_compute` client-side
and forwards the result as a server-side invoke. It shares phase 7 with
`InvokeExternal`, and the "at most once" rule covers the two jointly.

The fixed ordering removes state-machine ambiguity: there is exactly one way to
encode a given semantic operation, which closes whole classes of ordering bugs.
`InvokeExternal` is the composability hook - it calls an anonymizer contract
(DEX adapter, lending vault) at most once per transaction.

## The balance invariant

Within one transaction, the contract tracks a **temporary balance per token**:
inflows (`Deposit`, `UseNote`) add, outflows (`CreateNote`, `Withdraw`)
subtract. Two rules are enforced:

- The balance may **never go negative** at any point.
- Every token's balance must end at **exactly zero**.

```cairo
fn subtract_balance(ref self: TokenBalances, token: ContractAddress, amount: u128) {
    let (entry, current_balance) = self.entry(key: token.into());
    let new_value = current_balance
        .checked_sub(amount)
        .expect(errors::NEGATIVE_INTERMEDIATE_BALANCE);
    self = entry.finalize(:new_value);
}
fn assert_valid(self: SquashedTokenBalances) {
    for (_token, _, balance) in self.into_entries() {
        assert(balance.is_zero(), errors::FINAL_BALANCE_MUST_BE_ZERO);
    }
}
```

No value is created, destroyed, or left unaccounted - a transfer of 30 from a
100-note _must_ create outputs totaling 100 (30 to the recipient, 70 change).

## From actions to an on-chain transaction

```
client builds actions
        │
        ▼
virtual Starknet execution          ← anchored to a recent block's state
  (dedicated virtual OS,              snapshot; unsupported syscalls fail
   compiles client → server actions)  here, at proving time
        │
        ▼
Stwo proof generation               ← ~29 s (12-core / 46 GiB; machine-dependent)
        │
        ▼
submit tx (directly or via paymaster)
        │
        ▼
sequencer-level verification        ← proof checked before execution;
        │                             contract validates proof facts
        ▼
apply_actions: storage writes, token transfers, events
```

The proof is generated over a **virtual Starknet execution environment**: the
transaction runs against an anchored state snapshot of a recent block, using
the same Cairo logic the chain uses. That gives native storage semantics and
account-abstraction signature checks (`is_valid_signature`) for free.

On submission, the contract checks the **proof facts** before applying anything:

- the proof came from the expected program variant (`VIRTUAL_SNOS`)
- the anchor block is recent - within `proof_validity_blocks` of the tip
- the proven message hash matches the submitted actions exactly

Stale proofs expire; mismatched actions are rejected; only then are storage
writes, ERC-20 transfers and events applied atomically.

Next: the escrowed key that makes all of this auditable -
[Compliance & Auditing](/compliance).

---

# Compliance & Auditing

Source: https://strk20-by-example.org/compliance

> Selective disclosure via an auditor-escrowed viewing key, fund tracing, and known privacy limits

STRK20 is private from the public, not from lawful oversight. Compliance rests
on two mechanisms: every deposit is screened before it enters the pool, and
selective disclosure is available after the fact through a single ciphertext
created at registration.

## Onchain deposit screening

Every deposit into the pool is screened. FPI (the screening provider) screens
the address that shields tokens and signs every deposit; the pool verifies
FPI's signature onchain before accepting the deposit. Since the v0.14.3
upgrade this enforcement lives in the protocol itself, so it applies on every
route into the pool - wallet flows, SDK integrations, and self-hosted provers
alike. Running your own prover is not a way around screening: any other pool
action can be proven with any prover, but a deposit without a valid screening
signature is rejected onchain.

## The escrowed viewing key

When a user registers (`SetViewingKey`), their **private viewing key is
encrypted to the auditor's public key** - using the same ephemeral ECDH scheme
as channels - and stored on-chain. The auditor's public key is set by
governance, and the scheme supports **threshold keys**, so decryption need
not rest with a single party.

Disclosure is **selective**: the auditor decrypts only the viewing keys of
users subject to a lawful request. Everyone else's transaction graph stays
encrypted - there is no bulk-surveillance mode.

## What a recovered viewing key reveals

With one user's private viewing key, an auditor can:

- open all their **incoming channels** - who paid them, how much, which token
- open all their **outgoing channels** - whom they paid
- decrypt every note amount and match published nullifiers to spent notes
- follow funds **forward** (deposit → notes → further transfers → withdrawals)
  and **backward** (withdrawal → notes → originating deposits)

## What stays visible on-chain for everyone

| On-chain artifact  | Visible to all                                                                  |
| ------------------ | ------------------------------------------------------------------------------- |
| Registration event | That an address joined; its escrowed key blob                                   |
| Deposit            | Depositor address, token and amount (plaintext ERC-20 `transfer_from`)          |
| Withdrawal event   | Recipient address, token and amount; user address also encrypted to the auditor |
| `UseNote`          | A published nullifier (unlinkable without a viewing key)                        |
| Open notes         | Token and filled amount in plaintext                                            |

## Auditors cannot spend

A viewing key is exactly that - a _viewing_ key. Spending requires a valid
account signature verified inside the proof, and the auditor has no
transaction authority. Compromise of the auditor key would break
confidentiality, never custody.

## Known privacy limitations

Honest accounting of what the protocol does not hide:

- **Channel-open linkability** - opening a channel and depositing or
  withdrawing in the same transaction (or in tight succession) can link a
  recipient to their public activity. Spread setup and movement over time.
- **Distinctive patterns** - recognizable amounts, or rapid in-and-out
  sequences between deposit and withdrawal, weaken the anonymity set. This
  affects every privacy pool design.
- **Edges are public by design** - deposits and withdrawals expose addresses
  and amounts; only movement _inside_ the pool is encrypted.

With the full concept set in hand, revisit [What is STRK20?](/what-is-strk20)
to see how the pieces fit together.

---

# Overview

Source: https://strk20-by-example.org/overview

> A concise builder overview for choosing the right STRK20 integration route

Here's everything about getting started with building private applications.

Starknet privacy has a small set of builder surfaces. Start with the highest-level
route that fits your product, and only move lower when you need more control.

## Choose your integration route

| Builder goal                                                                                | Start with                                                                                               |
| ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Build a private dapp anywhere from private DeFi, private consumer apps, private games, etc. | [Anonymizer Contracts](/helpers/privacy-invoke) and [Starknet Wallet API](/starknet-wallet-api/overview) |
| Build a privacy wallet or advanced backend                                                  | [Build Privacy Wallets](/sdk/getting-started)                                                            |
| Run proof infrastructure yourself                                                           | Prover backend                                                                                           |
| Hide a user's main-wallet link during account-based app activity                            | Private sub-accounts (SDK route available; Wallet API pending)                                           |
| Fund a private balance from an EVM wallet, or withdraw it back to one                       | [Privacy Bridge](https://github.com/starkware-libs/privacy-bridge)                                       |

## Core pieces

- **STRK20 Pool:** the live Starknet mainnet pool that holds ERC-20s as encrypted
  notes and enables shielded balances, private transfers, and private DeFi.
- **Starknet Wallet API / starknet.js:** the standard route for private dapps. The
  app asks the wallet to act; the wallet manages viewing keys, notes, proofs, and
  signatures.
- **Anonymizer contracts:** app-specific `privacy_invoke` adapters for DeFi. The pool
  calls the helper atomically, then credits the result back into private notes.
- **Privacy SDK:** the low-level route for wallets and advanced integrations that
  need direct control over registration, channels, note discovery, and proving.
  Open source (Apache 2.0): [starkware-libs/starknet-privacy](https://github.com/starkware-libs/starknet-privacy),
  quickstart in [`sdk/README.md`](https://github.com/starkware-libs/starknet-privacy/blob/main/sdk/README.md).
- **Privacy Bridge:** a value-movement engine that moves USDC between EVM
  wallets/chains and the pool over Circle CCTP, so the funding side and the
  withdrawal side are not linked onchain. It ships its own `OutboundAnonymizer`
  and `InboundAnonymizer` Cairo contracts plus a TypeScript engine with React
  hooks. Open source (Apache 2.0), early:
  [starkware-libs/privacy-bridge](https://github.com/starkware-libs/privacy-bridge).
- **Private sub-accounts:** an advanced account-privacy route for hiding the
  public link between a user's main wallet and app activity. The SDK route ships
  in Privacy SDK `0.14.3-rc.4`; the Wallet API route is still pending, so dapps
  relying on the user's wallet cannot use them yet.
- **Prover backend:** infrastructure for teams that need to operate their own proof
  generation.

## What stays visible

Inside the pool, sender, receiver, token, amount, and spent notes are private.
Deposits, withdrawals, timing, and some app-side activity may still be public.

## Start from a template

The [STRK20 starter kit](https://github.com/Akashneelesh/strk20-starter-kit) is a
lean Next.js app with the Wallet API route already wired: wallet picker,
shield / unshield / private transfer, shielded balances, and a deployable
`privacy_invoke` helper. [Try the live demo](https://starknet-privacy-starter.vercel.app/),
then swap the `DEMO`-labelled defaults for your own token and helper.

## Read next

- [Anonymizer Contracts](/helpers/privacy-invoke)
- [Starknet Wallet API](/starknet-wallet-api/overview)
- [Private DeFi End to End](/starknet-wallet-api/private-defi)
- [AVNU Private Swaps](/starknet-wallet-api/avnu-private-swaps)
- [Build Privacy Wallets](/sdk/getting-started)

---

# Anonymizer Contract Anatomy

Source: https://strk20-by-example.org/helpers/privacy-invoke

> The privacy_invoke pattern - how the pool calls external contracts and credits open notes

Anonymizer contracts (also called **helper contracts**) are how private funds
interact with the outside world - DEXs, lending vaults, escrows - without
revealing who is behind the interaction.

The pattern is a sandwich, executed atomically in one transaction:

```
withdraw from pool  →  helper does something  →  deposit result to an open note
```

1. The pool **withdraws** input tokens to the helper (a plain public transfer -
   observers see the pool paid the helper, not who initiated it).
2. The pool calls the helper's `privacy_invoke` entry point via the protocol's
   `INVOKE_SELECTOR`.
3. The helper does its work, approves the pool to pull the output tokens, and
   **returns a `Span<OpenNoteDeposit>`** - instructions telling the pool which
   open notes to credit with which tokens and amounts.

The output lands in an **open note**: its amount is public (it was measured
on-chain, so it could not be fixed at proof time), but its owner is still hidden.

## The contract every helper must satisfy

The pool deserializes your calldata into `privacy_invoke`'s parameters - you are
free to design the signature after the first `operation`-style arguments - and it
deserializes your return value as `Span<OpenNoteDeposit>`:

```cairo
/// From privacy::objects
pub struct OpenNoteDeposit {
    /// The identifier of the open note to deposit to.
    pub note_id: felt252,
    /// The ERC20 token contract to deposit.
    pub token: ContractAddress,
    /// The amount of tokens to deposit.
    pub amount: u128,
}
```

Here is the smallest possible helper - it simply echoes the deposit instructions
it is given back to the pool:

```cairo
// Adapted from starknet-privacy packages/privacy/src/tests/mock_invoke_returns.cairo
// (Apache-2.0, StarkWare). The smallest possible anonymizer contract: it echoes the
// deposit instructions it is given back to the privacy pool.
use privacy::objects::OpenNoteDeposit;

#[starknet::interface]
pub trait IEchoHelper<T> {
    /// The entry point every anonymizer contract must expose.
    /// The privacy pool calls it via the `INVOKE_SELECTOR` during `InvokeExternal`.
    /// Calldata after the selector is deserialized into this function's parameters;
    /// the return value tells the pool which open notes to credit.
    fn privacy_invoke(ref self: T, deposits: Span<OpenNoteDeposit>) -> Span<OpenNoteDeposit>;
}

#[starknet::contract]
pub mod EchoHelper {
    use privacy::objects::OpenNoteDeposit;
    use super::IEchoHelper;

    #[storage]
    struct Storage {}

    #[constructor]
    fn constructor(ref self: ContractState) {}

    #[abi(embed_v0)]
    pub impl EchoHelperImpl of IEchoHelper<ContractState> {
        fn privacy_invoke(
            ref self: ContractState, deposits: Span<OpenNoteDeposit>,
        ) -> Span<OpenNoteDeposit> {
            deposits
        }
    }
}

```

Useless in production, but it shows the full contract surface: one entry point,
calldata in, `Span<OpenNoteDeposit>` out.

## Rules of the pattern

- **Return exactly a `Span<OpenNoteDeposit>`** - returning anything else (or
  trailing garbage) makes the pool reject the call.
- **Approve, don't transfer** - the helper approves the pool to pull the output;
  the pool executes the pull itself when applying the deposits.
- **An empty span is valid** - it means "credit nothing" for a step that should
  not release funds yet, such as a stateful helper parking funds until a later
  claim (see [Escrow](/helpers/escrow)).
- **Measure output by balance delta** - real helpers record the output token
  balance before and after the external call, so the credited amount is exactly
  what arrived, whatever the external protocol did.
- **One `invoke` per transaction** - the protocol allows at most one external
  invoke per pool transaction.

The next two pages build real helpers on this skeleton: a DEX swap and a Vesu
lending integration. To call one of them from a dapp, see
[Private DeFi End to End](/starknet-wallet-api/private-defi).

For a helper pair that crosses chains rather than protocols, read the
`OutboundAnonymizer` and `InboundAnonymizer` contracts in
[starkware-libs/privacy-bridge](https://github.com/starkware-libs/privacy-bridge):
they move USDC between the pool and EVM chains over Circle's CCTP, and the
inbound side pairs `privacy_invoke` with the pool's `privacy_compute` mechanism
so the attested cross-chain message and the private note are bound in a single
transaction.

---

# Swap Helper

Source: https://strk20-by-example.org/helpers/swap-helper

> A DEX swap anonymizer contract - trade privately through any AMM using the balance-delta idiom

The swap helper lets pool funds trade on an external AMM without revealing the
trader. The pool withdraws the input token to the helper, the helper swaps on the
AMM, and the received amount is credited to an open note - all in one atomic
transaction.

This is the canonical template for **any** DEX integration: only the AMM call in
the middle changes.

```cairo
// Adapted from starknet-privacy packages/privacy/src/test_contracts/mock_swap_executor.cairo
// (Apache-2.0, StarkWare). Renamed MockSwapExecutor -> SwapHelper for the tutorial.
use privacy::objects::OpenNoteDeposit;
use starknet::ContractAddress;

#[starknet::interface]
pub trait ISwapHelper<T> {
    /// Executes a swap on an external AMM/DEX and deposits the result to an open note.
    ///
    /// Called by the privacy contract via the `INVOKE_SELECTOR`.
    ///
    /// - `in_token` - The token address of the input funds.
    /// - `out_token` - The token address of the output funds.
    /// - `in_amount` - The amount of input funds to swap.
    /// - `note_id` - The identifier of the open note to deposit the output to.
    ///
    /// #### Flow
    /// 1. Approves swap contract to spend `in_amount` of in tokens.
    /// 2. Records output token balance, executes the swap, calculates received amount.
    /// 3. Approves the caller (privacy contract) to transfer the received output funds.
    /// 4. Returns a span of `OpenNoteDeposit` for the privacy contract to apply.
    fn privacy_invoke(
        ref self: T,
        in_token: ContractAddress,
        out_token: ContractAddress,
        in_amount: u128,
        note_id: felt252,
    ) -> Span<OpenNoteDeposit>;
}

pub mod errors {
    pub const ZERO_IN_TOKEN: felt252 = 'ZERO_IN_TOKEN';
    pub const ZERO_OUT_TOKEN: felt252 = 'ZERO_OUT_TOKEN';
    pub const ZERO_IN_AMOUNT: felt252 = 'ZERO_IN_AMOUNT';
    pub const IN_TOKEN_EQUAL_TO_OUT_TOKEN: felt252 = 'IN_TOKEN_EQUAL_TO_OUT_TOKEN';
    pub const INSUFFICIENT_BALANCE: felt252 = 'INSUFFICIENT_BALANCE';
    pub const ZERO_AMM_ADDRESS: felt252 = 'ZERO_AMM_ADDRESS';
    pub const ZERO_SELECTOR: felt252 = 'ZERO_SELECTOR';
    pub const RECEIVED_AMOUNT_OVERFLOW: felt252 = 'RECEIVED_AMOUNT_OVERFLOW';
    pub const ZERO_OUT_AMOUNT: felt252 = 'ZERO_OUT_AMOUNT';
}

#[starknet::contract]
pub mod SwapHelper {
    use core::num::traits::Zero;
    use openzeppelin::interfaces::token::erc20::{IERC20Dispatcher, IERC20DispatcherTrait};
    use privacy::objects::OpenNoteDeposit;
    use starknet::storage::{StoragePointerReadAccess, StoragePointerWriteAccess};
    use starknet::syscalls::call_contract_syscall;
    use starknet::{ContractAddress, SyscallResultTrait, get_caller_address, get_contract_address};
    use super::{ISwapHelper, errors};

    #[storage]
    struct Storage {
        amm_address: ContractAddress,
        selector: felt252,
    }

    #[constructor]
    fn constructor(ref self: ContractState, amm_address: ContractAddress, selector: felt252) {
        assert(amm_address.is_non_zero(), errors::ZERO_AMM_ADDRESS);
        assert(selector.is_non_zero(), errors::ZERO_SELECTOR);
        self.amm_address.write(amm_address);
        self.selector.write(selector);
    }

    #[abi(embed_v0)]
    pub impl SwapHelperImpl of ISwapHelper<ContractState> {
        fn privacy_invoke(
            ref self: ContractState,
            in_token: ContractAddress,
            out_token: ContractAddress,
            in_amount: u128,
            note_id: felt252,
        ) -> Span<OpenNoteDeposit> {
            assert(in_token.is_non_zero(), errors::ZERO_IN_TOKEN);
            assert(out_token.is_non_zero(), errors::ZERO_OUT_TOKEN);
            assert(in_amount.is_non_zero(), errors::ZERO_IN_AMOUNT);
            assert(in_token != out_token, errors::IN_TOKEN_EQUAL_TO_OUT_TOKEN);

            let self_addr = get_contract_address();
            let privacy_addr = get_caller_address();
            let in_erc20 = IERC20Dispatcher { contract_address: in_token };
            let out_erc20 = IERC20Dispatcher { contract_address: out_token };

            // Approve AMM to spend `in_amount` of `in_token`.
            assert(
                in_erc20.balance_of(account: self_addr) >= in_amount.into(),
                errors::INSUFFICIENT_BALANCE,
            );
            let amm_address = self.amm_address.read();
            in_erc20.approve(spender: amm_address, amount: in_amount.into());

            // Get output token balance before swap.
            let balance_before = out_erc20.balance_of(account: self_addr);

            // Execute swap (propagates error from AMM if it fails).
            call_contract_syscall(
                address: amm_address,
                entry_point_selector: self.selector.read(),
                calldata: [in_token.into(), out_token.into(), in_amount.into(), 0].span(),
            )
                .unwrap_syscall();

            // Calculate output amount.
            let balance_after = out_erc20.balance_of(account: self_addr);
            let out_amount: u128 = (balance_after - balance_before)
                .try_into()
                .expect(errors::RECEIVED_AMOUNT_OVERFLOW);
            assert(out_amount.is_non_zero(), errors::ZERO_OUT_AMOUNT);

            // Approve caller (privacy contract) to transfer received output funds.
            out_erc20.approve(spender: privacy_addr, amount: out_amount.into());

            // Return the open note deposit struct.
            [OpenNoteDeposit { note_id, token: out_token, amount: out_amount }].span()
        }
    }
}

```

The demo AMM it targets is a trivial 1:1 exchange - in production this would be
Ekubo, JediSwap, or any other DEX:

```cairo
// Adapted from starknet-privacy packages/privacy/src/test_contracts/mock_amm.cairo
// (Apache-2.0, StarkWare). Test-only entry points removed.
use starknet::ContractAddress;

/// Interface for the mock AMM.
#[starknet::interface]
pub trait IMockAMM<T> {
    fn swap(ref self: T, in_token: ContractAddress, out_token: ContractAddress, amount: u256);
}

/// Mock AMM contract used to demo the swap helper.
/// Implements a simple 1:1 swap.
#[starknet::contract]
pub mod MockAMM {
    use openzeppelin::interfaces::token::erc20::{IERC20Dispatcher, IERC20DispatcherTrait};
    use starknet::{ContractAddress, get_caller_address, get_contract_address};
    use super::IMockAMM;

    #[storage]
    struct Storage {}

    #[constructor]
    fn constructor(ref self: ContractState) {}

    #[abi(embed_v0)]
    impl MockAMMImpl of IMockAMM<ContractState> {
        fn swap(
            ref self: ContractState,
            in_token: ContractAddress,
            out_token: ContractAddress,
            amount: u256,
        ) {
            let caller = get_caller_address();

            // Transfer input tokens from caller.
            IERC20Dispatcher { contract_address: in_token }
                .transfer_from(sender: caller, recipient: get_contract_address(), :amount);

            // Transfer output tokens (1:1 exchange).
            IERC20Dispatcher { contract_address: out_token }.transfer(recipient: caller, :amount);
        }
    }
}

```

## The balance-delta idiom

The helper never trusts the AMM's return value. It measures what actually
arrived:

```
balance_before = out_token.balance_of(helper)
...swap...
out_amount = out_token.balance_of(helper) - balance_before
```

This is what makes the pattern universal - it works with any external protocol
regardless of its interface, handles fees-on-transfer, and guarantees the open
note is credited with exactly the tokens the pool can actually pull.

## Things to notice

- **The AMM is pinned at deployment** - `amm_address` and the swap `selector` are
  constructor parameters, so a deployed helper is a fixed, auditable route.
- **`call_contract_syscall`** invokes the AMM generically; an AMM revert
  propagates and aborts the whole pool transaction - no funds move.
- **Overflow guard** - the delta is `u256 → u128` converted with an explicit
  error; a manipulated token cannot smuggle an oversized amount into a note.
- **`ZERO_OUT_AMOUNT` guard** - a swap that returns nothing reverts instead of
  crediting an empty note.
- **The trader is never on-chain** - observers see pool → helper → AMM → helper.
  The open note's owner stays hidden.

Next: the same pattern pointed at a real lending protocol - the Vesu helper.

---

# Vesu Lending Helper

Source: https://strk20-by-example.org/helpers/vesu-lending-helper

> Earn lending yield privately - the official reference helper for Vesu ERC-4626 vaults

The Vesu lending helper connects the privacy pool to
[Vesu](https://vesu.xyz), a permissionless lending protocol whose pools are
ERC-4626 / SNIP-22 tokenized vaults: deposit underlying assets, receive vToken
shares; withdraw by burning shares. This is the reference anonymizer contract used in
the official Starknet Privacy docs. It is a reference example: review and
adoption of the Vesu route remain with the app team, and the integration is
in progress.

Two operations, one entry point:

- **Deposit** - underlying → vToken shares. `out_token` is the vault; the helper
  approves it, calls `deposit`, and the minted shares land in an open note.
- **Withdraw** - vToken shares → underlying. `in_token` is the vault; the helper
  calls `withdraw` and the returned assets land in an open note.

Your position in the vault is itself a private note holding vTokens - the yield
accrues to a position nobody can attribute to you.

```cairo
// Adapted from starknet-privacy packages/vesu_lending_anonymizer/src/vesu_lending_anonymizer.cairo
// (Apache-2.0, StarkWare)
use privacy::objects::OpenNoteDeposit;
use starknet::ContractAddress;

/// Interface for a Vesu vToken vault (ERC-4626 / SNIP-22 compatible).
#[starknet::interface]
pub trait IVToken<T> {
    /// Deposits assets into the pool and mints vTokens (shares) to the receiver.
    fn deposit(ref self: T, assets: u256, receiver: ContractAddress) -> u256;
    /// Withdraws assets from the pool and burns vTokens (shares) from the owner.
    fn withdraw(
        ref self: T, assets: u256, receiver: ContractAddress, owner: ContractAddress,
    ) -> u256;
}

/// Lending operation to perform on a Vesu vault.
#[derive(Serde, Copy, Drop, PartialEq, Debug)]
pub enum LendingOperation {
    Deposit,
    Withdraw,
}

#[starknet::interface]
pub trait IVesuLendingHelper<T> {
    /// Executes a lending operation on the Vesu lending pool.
    ///
    /// Called by the privacy contract via the `INVOKE_SELECTOR`.
    ///
    /// - `operation` - The lending operation to perform.
    /// - `in_token` - The token address of the input funds (on withdraw: the vToken).
    /// - `out_token` - The token address of the output funds (on deposit: the vToken).
    /// - `assets` - Amount of assets to deposit/withdraw.
    /// - `note_id` - The identifier of the open note to deposit the output to.
    fn privacy_invoke(
        ref self: T,
        operation: LendingOperation,
        in_token: ContractAddress,
        out_token: ContractAddress,
        assets: u256,
        note_id: felt252,
    ) -> Span<OpenNoteDeposit>;
}

/// Error codes for Vesu lending operations.
pub mod errors {
    pub const ZERO_IN_TOKEN: felt252 = 'ZERO_IN_TOKEN';
    pub const ZERO_OUT_TOKEN: felt252 = 'ZERO_OUT_TOKEN';
    pub const ZERO_ASSETS: felt252 = 'ZERO_ASSETS';
    pub const TOKENS_EQUAL: felt252 = 'TOKENS_EQUAL';
    pub const RECEIVED_AMOUNT_OVERFLOW: felt252 = 'RECEIVED_AMOUNT_OVERFLOW';
    pub const ZERO_OUT_AMOUNT: felt252 = 'ZERO_OUT_AMOUNT';
}

/// Vesu lending anonymizer contract that performs Vesu deposit/withdraw on behalf of the privacy
/// contract.
#[starknet::contract]
pub mod VesuLendingHelper {
    use core::num::traits::Zero;
    use openzeppelin::interfaces::token::erc20::{IERC20Dispatcher, IERC20DispatcherTrait};
    use privacy::objects::OpenNoteDeposit;
    use starknet::{ContractAddress, get_caller_address, get_contract_address};
    use super::{
        IVTokenDispatcher, IVTokenDispatcherTrait, IVesuLendingHelper, LendingOperation, errors,
    };

    #[storage]
    struct Storage {}

    #[constructor]
    fn constructor(ref self: ContractState) {}

    #[abi(embed_v0)]
    pub impl VesuLendingHelperImpl of IVesuLendingHelper<ContractState> {
        fn privacy_invoke(
            ref self: ContractState,
            operation: LendingOperation,
            in_token: ContractAddress,
            out_token: ContractAddress,
            assets: u256,
            note_id: felt252,
        ) -> Span<OpenNoteDeposit> {
            assert(in_token.is_non_zero(), errors::ZERO_IN_TOKEN);
            assert(out_token.is_non_zero(), errors::ZERO_OUT_TOKEN);
            assert(assets.is_non_zero(), errors::ZERO_ASSETS);
            assert(in_token != out_token, errors::TOKENS_EQUAL);

            let self_addr = get_contract_address();
            let privacy_addr = get_caller_address();
            let in_erc20 = IERC20Dispatcher { contract_address: in_token };
            let out_erc20 = IERC20Dispatcher { contract_address: out_token };

            // Get output token balance before operation.
            let balance_before = out_erc20.balance_of(account: self_addr);

            // Execute operation.
            // Return value (minted/burned shares) is ignored.
            match operation {
                LendingOperation::Deposit => {
                    // Approve Vesu Token contract to spend `assets` of `in_token`.
                    in_erc20.approve(spender: out_token, amount: assets);
                    IVTokenDispatcher { contract_address: out_token }
                        .deposit(:assets, receiver: self_addr)
                },
                LendingOperation::Withdraw => {
                    IVTokenDispatcher { contract_address: in_token }
                        .withdraw(:assets, receiver: self_addr, owner: self_addr)
                },
            }

            // Assert output amount is correct.
            let balance_after = out_erc20.balance_of(account: self_addr);
            let out_amount: u128 = (balance_after - balance_before)
                .try_into()
                .expect(errors::RECEIVED_AMOUNT_OVERFLOW);
            assert(out_amount.is_non_zero(), errors::ZERO_OUT_AMOUNT);

            // Approve caller (privacy contract) to transfer received output funds.
            out_erc20.approve(spender: privacy_addr, amount: out_amount.into());

            // Returns deposit to open note input.
            [OpenNoteDeposit { note_id, token: out_token, amount: out_amount }].span()
        }
    }
}

```

## Things to notice

- **Same skeleton as the swap helper** - validate inputs, snapshot the output
  balance, do the external call, credit the delta. Only the middle differs.
- **Stateless and permissionless** - unlike the escrow, this helper has no
  storage and no pinned pool address; it trusts only the balance delta and
  approves whoever called it. Anything it holds mid-transaction is pulled by the
  pool in the same transaction.
- **Directionality via token roles** - deposit puts the vault at `out_token`,
  withdraw puts it at `in_token`. One signature covers both directions.
- **Shares return value ignored** - the ERC-4626 return value is discarded in
  favor of the measured delta, for the same reasons as the swap helper.
- **`u256` assets, `u128` note amounts** - vault math is `u256`; the credited
  delta must fit a note's 128-bit amount or the call reverts.

Next: [Escrow](/helpers/escrow) - an unofficial worked example of a _stateful_
helper with its own commitment scheme.

---

# Escrow

Source: https://strk20-by-example.org/helpers/escrow

> A deferred-delivery escrow anonymizer contract - send privately to someone who has not registered yet

The escrow helper solves a real problem: you cannot privately transfer to someone
who has not registered a viewing key yet. Instead, you **escrow the funds behind a
secret**, share the secret off-chain (a claim link), and the recipient claims the
funds into their own note once they are registered.

> **Unofficial example.** Unlike the Ekubo and Vesu helpers, this contract is
> not shipped in the
> [starknet-privacy](https://github.com/starkware-libs/starknet-privacy) monorepo
> and has no SDK helper functions. It is a worked illustration of a stateful
> `privacy_invoke` helper - read it for the pattern, and own the review and audit
> if you build on it.

It is a two-operation state machine driven by `privacy_invoke`:

- **Deposit** - the pool withdraws tokens to the escrow, which stores a
  `CommitmentEntry` keyed by `poseidon(ESCROW_COMMITMENT_TAG, secret)`. Only the
  hash goes on-chain; the secret never does.
- **Claim** - the claimer proves knowledge of the secret preimage. The escrow marks
  the commitment claimed, approves the pool to pull the tokens, and returns an
  `OpenNoteDeposit` instructing the pool to credit the claimer's open note.

```cairo
// Original example written for strk20-by-example. Unlike the other helpers here,
// this is NOT adapted from the starknet-privacy monorepo - that repo ships no
// escrow package. Unofficial, and not reviewed or audited by StarkWare.
use privacy::objects::OpenNoteDeposit;
use starknet::ContractAddress;

/// Entry stored per commitment in the escrow.
#[derive(Serde, Copy, Drop, PartialEq, Debug, starknet::Store)]
pub struct CommitmentEntry {
    pub token: ContractAddress,
    pub amount: u128,
    pub claimed: bool,
}

/// Operation to perform on the escrow.
#[derive(Serde, Copy, Drop, PartialEq, Debug)]
pub enum EscrowOperation {
    Deposit,
    Claim,
}

#[starknet::interface]
pub trait IEscrow<T> {
    /// Returns the commitment entry for a given hash. All fields are zero if it does not exist.
    fn get_commitment(self: @T, commitment_hash: felt252) -> CommitmentEntry;

    /// Called by the privacy contract via the `INVOKE_SELECTOR`.
    ///
    /// Dispatches on `operation`:
    ///
    /// **Deposit** - Stores a commitment backed by tokens the pool already transferred to this
    /// contract. Returns an empty span (tokens stay in escrow).
    /// - `commitment_hash` - `poseidon(ESCROW_COMMITMENT_TAG, secret)` computed off-chain.
    /// - `token` - ERC-20 token address.
    /// - `amount` - Token amount to escrow.
    /// - `secret`, `note_id` - ignored.
    ///
    /// **Claim** - Verifies `hash(secret)` matches a stored commitment, marks it claimed,
    /// approves the caller (privacy contract) to pull tokens, and returns the deposit instruction.
    /// - `secret` - The preimage whose hash matches the stored commitment.
    /// - `note_id` - The open note identifier (computed by the SDK and passed in calldata).
    /// - `commitment_hash`, `token`, `amount` - ignored.
    fn privacy_invoke(
        ref self: T,
        operation: EscrowOperation,
        commitment_hash: felt252,
        token: ContractAddress,
        amount: u128,
        secret: felt252,
        note_id: felt252,
    ) -> Span<OpenNoteDeposit>;
}

/// Domain-separation tag for escrow commitment hashes.
pub const ESCROW_COMMITMENT_TAG: felt252 = 'ESCROW_COMMITMENT_TAG:V1';

pub mod errors {
    pub const ZERO_COMMITMENT_HASH: felt252 = 'ZERO_COMMITMENT_HASH';
    pub const ZERO_TOKEN: felt252 = 'ZERO_TOKEN';
    pub const ZERO_AMOUNT: felt252 = 'ZERO_AMOUNT';
    pub const COMMITMENT_EXISTS: felt252 = 'COMMITMENT_EXISTS';
    pub const COMMITMENT_NOT_FOUND: felt252 = 'COMMITMENT_NOT_FOUND';
    pub const ALREADY_CLAIMED: felt252 = 'ALREADY_CLAIMED';
    pub const CALLER_NOT_PRIVACY: felt252 = 'CALLER_NOT_PRIVACY';
}

/// Computes the commitment hash from a secret using domain-separated Poseidon.
pub fn compute_commitment_hash(secret: felt252) -> felt252 {
    core::poseidon::poseidon_hash_span([ESCROW_COMMITMENT_TAG, secret].span())
}

#[starknet::contract]
pub mod Escrow {
    use core::num::traits::Zero;
    use openzeppelin::interfaces::token::erc20::{IERC20Dispatcher, IERC20DispatcherTrait};
    use privacy::objects::OpenNoteDeposit;
    use starknet::storage::{
        StorageMapReadAccess, StorageMapWriteAccess, StoragePointerReadAccess,
        StoragePointerWriteAccess,
    };
    use starknet::{ContractAddress, get_caller_address};
    use super::{CommitmentEntry, EscrowOperation, IEscrow, compute_commitment_hash, errors};

    #[storage]
    struct Storage {
        privacy_contract: ContractAddress,
        commitments: starknet::storage::Map<felt252, CommitmentEntry>,
    }

    #[constructor]
    fn constructor(ref self: ContractState, privacy_contract: ContractAddress) {
        self.privacy_contract.write(privacy_contract);
    }

    #[abi(embed_v0)]
    pub impl EscrowImpl of IEscrow<ContractState> {
        fn get_commitment(self: @ContractState, commitment_hash: felt252) -> CommitmentEntry {
            self.commitments.read(commitment_hash)
        }

        fn privacy_invoke(
            ref self: ContractState,
            operation: EscrowOperation,
            commitment_hash: felt252,
            token: ContractAddress,
            amount: u128,
            secret: felt252,
            note_id: felt252,
        ) -> Span<OpenNoteDeposit> {
            let privacy_addr = self.privacy_contract.read();
            assert(get_caller_address() == privacy_addr, errors::CALLER_NOT_PRIVACY);

            match operation {
                EscrowOperation::Deposit => {
                    assert(commitment_hash.is_non_zero(), errors::ZERO_COMMITMENT_HASH);
                    assert(token.is_non_zero(), errors::ZERO_TOKEN);
                    assert(amount.is_non_zero(), errors::ZERO_AMOUNT);

                    let existing = self.commitments.read(commitment_hash);
                    assert(existing.token.is_zero(), errors::COMMITMENT_EXISTS);

                    self
                        .commitments
                        .write(
                            commitment_hash,
                            CommitmentEntry { token, amount, claimed: false },
                        );

                    // Tokens already transferred by the pool via Withdraw. Return empty span.
                    [].span()
                },
                EscrowOperation::Claim => {
                    let commitment_hash = compute_commitment_hash(secret);
                    let entry = self.commitments.read(commitment_hash);
                    assert(entry.token.is_non_zero(), errors::COMMITMENT_NOT_FOUND);
                    assert(!entry.claimed, errors::ALREADY_CLAIMED);

                    self
                        .commitments
                        .write(
                            commitment_hash,
                            CommitmentEntry { claimed: true, ..entry },
                        );

                    // Approve the privacy contract to pull the escrowed tokens.
                    IERC20Dispatcher { contract_address: entry.token }
                        .approve(spender: privacy_addr, amount: entry.amount.into());

                    [OpenNoteDeposit { note_id, token: entry.token, amount: entry.amount }].span()
                },
            }
        }
    }
}

```

## Things to notice

- **Access control** - `privacy_invoke` asserts the caller is the privacy pool.
  Nobody can drive the escrow directly.
- **Commitment hash is domain-separated** - `ESCROW_COMMITMENT_TAG` prevents the
  secret's hash from colliding with hashes used elsewhere.
- **Deposit returns an empty span** - tokens stay parked in the escrow, so there is
  nothing for the pool to credit yet.
- **Claim recomputes the hash from the secret** - the passed-in `commitment_hash`
  parameter is ignored on claim; only the preimage matters.
- **Double-claim protection** - the `claimed` flag flips exactly once; a second
  claim hits `ALREADY_CLAIMED`.

---

# Starknet Wallet API

Source: https://strk20-by-example.org/starknet-wallet-api/overview

> The standard route for private dapps on Starknet: ask a privacy-enabled wallet to shield, transfer, and withdraw via starknet.js.

The **Starknet Wallet API** is the recommended route for most **private dapps**.
Instead of managing private state yourself, your dapp asks the user's
privacy-enabled wallet
to perform a private action, and the wallet handles keys, notes, proving, and
submission.

Use this route when you are building an app **on top of** existing privacy
wallets. If you are building the wallet itself, use the
[Build Privacy Wallets](/sdk/getting-started). If your app needs private DeFi,
pair this route with an [Anonymizer Contract](/helpers/privacy-invoke).

## Install

```shell
npm install starknet@^10.4.0
```

**Pin the version.** STRK20 support landed in starknet.js 10.4.0 and ships on the
npm `next` tag. A bare `npm install starknet` resolves to `latest`, which is
still 10.0.x and contains none of the STRK20 API — `WalletAccountV6`,
`strk20InvokeTransaction`, and `STRK20_ACTION` will all be missing.

## Why most dapps want this route

- **No viewing keys in your app.** The wallet holds the user's viewing key; your
  dapp never sees it.
- **No note or proof management.** The wallet discovers notes, builds the
  transaction, generates the proof, and submits it.
- **Standard Starknet integration.** You connect and call through `starknet.js`
  and the user's wallet, the same way you already integrate other Starknet
  actions.

## How it fits together

Your dapp talks to `starknet.js`, which reaches the user's privacy-enabled wallet
through the Starknet Wallet API. The wallet runs the STRK20 SDK internally and
settles against the privacy pool. For private DeFi, the same call path also triggers your app-specific
[anonymizer contract](/helpers/privacy-invoke).

## React hooks or direct WalletAccountV6?

There are two practical ways to use the Starknet Wallet API from a dapp, each with
its own page in this section:

- **React dapps:** use the
  [starknet-start `useStrk20` hooks](/starknet-wallet-api/starknet-start-hook), a
  convenience wrapper that calls into a `WalletAccountV6` (or equivalent) under the
  hood.
- **Outside React, or when you need finer control** over connection and proof
  handling: use
  [starknet.js `WalletAccountV6`](/starknet-wallet-api/starknet-js) directly.

In both cases the wallet itself must support the STRK20 wallet API methods, since
the ZK proofs and signatures are managed wallet-side.

## What you can do through the wallet

Without writing any privacy cryptography, a dapp can ask the wallet to:

- **Shield** - deposit public ERC-20 tokens into the pool.
- **Private transfer** - move value privately between registered users.
- **Withdraw (unshield)** - move tokens back out to a public address.
- **Swap** - where the connected wallet supports it.

Broader DeFi actions (lending, staking, custom flows) pair the Starknet Wallet
API with an app-specific anonymizer contract that the pool invokes atomically —
see [Private DeFi End to End](/starknet-wallet-api/private-defi) for the wiring.

## What to keep in mind

- **Wallet support varies.** Available actions depend on the connected wallet;
  detect capabilities before offering an action.
- **Edges stay public.** Deposits and withdrawals expose public ERC-20 legs and
  timing, even though in-pool movement is private.
- **Verify versions and addresses.** Confirm wallet, `starknet.js`, and pool
  contract details for your target network before launch.

## Choose your route

| You are building...                                                                   | Start here                                                                          |
| ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| A private dapp anywhere from private DeFi, private consumer apps, private games, etc. | [Anonymizer Contracts](/helpers/privacy-invoke) and Starknet Wallet API (this page) |
| A Starknet privacy wallet                                                             | [Build Privacy Wallets](/sdk/getting-started)                                       |

## Read next

- [starknet-start](/starknet-wallet-api/starknet-start-hook)
- [starknet.js](/starknet-wallet-api/starknet-js)
- [Anonymizer Contract Anatomy](/helpers/privacy-invoke)
- [Build Privacy Wallets](/sdk/getting-started)

---

# starknet-start

Source: https://strk20-by-example.org/starknet-wallet-api/starknet-start-hook

> Use the starknet-start useStrk20 React hooks as a convenience wrapper over the Starknet Wallet API.

The **`useStrk20` hooks** from
[Starknet Start](https://starknet-innovation.github.io/starknet-start/docs/hooks/use-strk20/#hooks)
are a convenience wrapper over the [Starknet Wallet API](/starknet-wallet-api/overview).
They are the recommended starting point for **React dapps**.

## Install

```shell
npm install starknet@^10.4.0
```

**Pin the version.** STRK20 support landed in starknet.js 10.4.0 and ships on the
npm `next` tag. A bare `npm install starknet` resolves to `latest`, which is
still 10.0.x and contains none of the STRK20 API — `WalletAccountV6`,
`strk20InvokeTransaction`, and `STRK20_ACTION` will all be missing.

## When to use this

Use the hooks when you are building a **React dapp** on top of an existing
privacy-enabled wallet and want to request STRK20 actions without wiring each
wallet call by hand. If you are working outside React, or need finer control over
connection and proof handling, use
[starknet.js `WalletAccountV6`](/starknet-wallet-api/starknet-js) directly.

## How it works

The hooks call into a `WalletAccountV6` (or equivalent) under the hood. Your React
components ask for a private action; the connected wallet manages the private
state, ZK proof, and signature wallet-side.

## What to keep in mind

- **Wallet support is required.** The connected wallet must support the STRK20
  wallet API methods, since the ZK proofs and signatures are managed wallet-side.
- **React only.** The hooks are a React convenience layer; non-React apps should
  use the [starknet.js](/starknet-wallet-api/starknet-js) route.
- **Follow the upstream docs.** For hook names, parameters, and return values, see
  the
  [Starknet Start `useStrk20` reference](https://starknet-innovation.github.io/starknet-start/docs/hooks/use-strk20/#hooks).

## Read next

- [Starknet Wallet API overview](/starknet-wallet-api/overview)
- [starknet.js](/starknet-wallet-api/starknet-js)
- [Private DeFi End to End](/starknet-wallet-api/private-defi)
- [Anonymizer Contract Anatomy](/helpers/privacy-invoke)

---

# starknet.js

Source: https://strk20-by-example.org/starknet-wallet-api/starknet-js

> Call the Starknet Wallet API directly with starknet.js WalletAccountV6 for non-React apps or finer control.

The **`starknet.js` `WalletAccountV6` API** is the direct way to reach the
[Starknet Wallet API](/starknet-wallet-api/overview). Use it when you are working
**outside React**, or when you need **finer control over connection and proof
handling** than the React hooks provide.

## Install

```shell
npm install starknet@^10.4.0
```

**Pin the version.** STRK20 support landed in starknet.js 10.4.0 and ships on the
npm `next` tag. A bare `npm install starknet` resolves to `latest`, which is
still 10.0.x and contains none of the STRK20 API — `WalletAccountV6`,
`strk20InvokeTransaction`, and `STRK20_ACTION` will all be missing.

## When to use this

Reach for `WalletAccountV6` directly when a React convenience layer does not fit -
for example non-React frontends, scripts, or flows where you manage wallet
connection and proof handling yourself. If you are building a React dapp, the
[starknet-start `useStrk20` hooks](/starknet-wallet-api/starknet-start-hook) wrap
this same API for you.

## How it works

Your app connects to the user's privacy-enabled wallet through `starknet.js`, then
issues STRK20 actions through the Wallet API. The wallet manages the private
state, ZK proof, and signature wallet-side.

## What to keep in mind

- **Wallet support is required.** The connected wallet must support the STRK20
  wallet API methods, since the ZK proofs and signatures are managed wallet-side.
- **You own the wiring.** Without the hooks, you handle connection and proof
  handling explicitly.
- **Follow the upstream docs.** For connecting with get-starknet v6 and the
  `WalletAccountV6` API, see the
  [starknet.js WalletAccount guide](https://starknet-js.com/docs/next/guides/account/walletAccount/#with-get-starknet-v6).

## Read next

- [Starknet Wallet API overview](/starknet-wallet-api/overview)
- [starknet-start](/starknet-wallet-api/starknet-start-hook)
- [Build Privacy Wallets](/sdk/getting-started)

---

# Private DeFi End to End

Source: https://strk20-by-example.org/starknet-wallet-api/private-defi

> Connect an anonymizer contract to a dapp through the Starknet Wallet API using open notes and calldata placeholders

The [anonymizer contract pages](/helpers/privacy-invoke) cover the Cairo side.
This page covers the other half: how a dapp actually reaches that contract
through the [Starknet Wallet API](/starknet-wallet-api/overview), without ever
touching a viewing key.

Requires `starknet@^10.4.0` and a wallet supporting Wallet API `0.10.3`.

## The two actions

A private DeFi call is **one** STRK20 transaction carrying two actions:

1. A `transfer` with the literal amount `"OPEN"` — this creates an **open note**,
   the slot your helper's output gets credited into. Its amount is only known
   after the helper runs on-chain.
2. An `invoke` naming your helper contract and its calldata.

The wallet resolves two placeholders inside the invoke calldata:

| Placeholder         | Resolves to                                     |
| ------------------- | ----------------------------------------------- |
| `${openNoteIds[N]}` | The id of the Nth open note in this transaction |
| `${poolAddress}`    | The privacy pool contract address               |

That indirection is what lets you reference a note that does not exist yet at
the time you build the calldata.

## A private swap

```ts
import type { STRK20_ACTION } from "@starknet-io/types-js"

const actions: STRK20_ACTION[] = [
  // 1. Open the note the swap output will be credited into.
  { type: "transfer", token: tokenOut, amount: "OPEN", recipient: userAddress },

  // 2. Call the helper. ${openNoteIds[0]} is the note opened above.
  {
    type: "invoke",
    contract: swapHelperAddress,
    calldata: [tokenIn, tokenOut, amountIn, "${openNoteIds[0]}"],
  },
]

const { transaction_hash } = await account.strk20InvokeTransaction(actions)
```

The pool withdraws `amountIn` to your helper, calls its `privacy_invoke`
entry point, and credits the returned `OpenNoteDeposit` into the open note —
atomically. Observers see pool → helper → AMM → helper. They do not see who
initiated it.

Match the calldata order to your helper's `privacy_invoke` signature; the pool
deserializes it directly into that function's parameters.

## Dry-run first

`strk20PrepareInvoke` builds and proves the same actions without submitting,
which is the cheapest way to catch a calldata-shape mistake:

```ts
const prepared = await account.strk20PrepareInvoke(actions, true) // simulate
```

## Show the shielded balance

Reading private balances is a wallet call too — no viewing key in your app:

```ts
const balances = await account.strk20Balances([tokenIn, tokenOut])
// [{ token, balance }, ...]
```

## What stays public

The helper's on-chain action and the amounts it moves are visible; the link back
to the user is not. Open-note amounts are plaintext by design — they are
measured at execution time. Deposits and withdrawals remain public legs.

## Read next

- [Anonymizer Contract Anatomy](/helpers/privacy-invoke)
- [Swap Helper](/helpers/swap-helper)
- [AVNU Private Swaps](/starknet-wallet-api/avnu-private-swaps) - swaps without writing a helper at all

---

# AVNU Private Swaps

Source: https://strk20-by-example.org/starknet-wallet-api/avnu-private-swaps

> Add private swaps to a dapp with the AVNU SDK, without writing or deploying an anonymizer contract

Most private DeFi needs an app-specific
[anonymizer contract](/helpers/privacy-invoke). Swapping is the exception:
[AVNU](https://docs.avnu.fi/docs/privacy) has deployed its own executor, so a
dapp can offer private swaps with **no Cairo to write, review, or audit**.

## Install

```shell
npm install @avnu/avnu-sdk@^4.2.0 starknet@^10.4.0
```

## What you need

- A STRK20-capable wallet (Wallet API `>= 0.10.3`).
- The sell token **already shielded** — the swap moves value inside the pool, so
  it cannot shield for you.

## The call

```ts
import {
  createStrk20WalletProver,
  executePrivateSwap,
  PRIVACY_POOL_ADDRESS,
} from "@avnu/avnu-sdk"

const prover = createStrk20WalletProver(walletAccount)

const { transactionHash } = await executePrivateSwap({
  quote, // from AVNU's quote endpoint
  slippage: 0.01, // 1%
  takerAddress: walletAccount.address,
  poolAddress: PRIVACY_POOL_ADDRESS,
  feeMode: { poolFeeToken: quote.sellTokenAddress }, // tip?: "slow" | "normal" | "fast", defaults to "normal"
  prover,
})
```

`PRIVACY_POOL_ADDRESS` targets **mainnet**; for Sepolia testing, AVNU also
exports `SEPOLIA_PRIVACY_POOL_ADDRESS`.

AVNU's paymaster relays the transaction, so the submitting address is not the
user's.

If a paymaster API key is required (the `sponsored_private` fee mode), keep
that call server-side — passing the key from a browser leaks it. Browser
dapps should split the flow instead: call `buildPrivateSwapFee` and
`submitPrivateSwap` from a server endpoint, and run only the `prover` step
client-side with the user's wallet.

## When to use a helper instead

Reach for your own anonymizer contract when the action is not a swap — lending,
staking, or any app-specific flow. Those still need the pattern in
[Private DeFi End to End](/starknet-wallet-api/private-defi).

## Read next

- [Private DeFi End to End](/starknet-wallet-api/private-defi)
- [Swap Helper](/helpers/swap-helper) - the do-it-yourself route

---

# Getting Started

Source: https://strk20-by-example.org/sdk/getting-started

> Build privacy wallets on Starknet with the low-level STRK20 SDK and createPrivateTransfers

These pages are for teams building **privacy wallets on Starknet** or advanced
integrations that manage their own account, keys, note discovery, and proving.
If you are building a private dapp on top of an existing wallet, use the
[Starknet Wallet API](/starknet-wallet-api/overview) instead - it keeps viewing
keys inside the wallet. Everything here goes through one factory:
`createPrivateTransfers`.

## Install

```shell
npm install @starkware-libs/starknet-privacy-sdk
```

The SDK requires **Node.js >= 24** (its `ohttp-ts` dependency needs modern WebCrypto).

**Getting a 404?** Known temporary issue - the package is not on npmjs.com yet
while StarkWare restores access to its npm org. Until then it is published to
[GitHub Packages](https://github.com/starkware-libs/starknet-privacy/pkgs/npm/starknet-privacy-sdk),
which needs a GitHub token even for public packages. With the
[GitHub CLI](https://cli.github.com):

```shell
gh auth refresh -h github.com -s read:packages
npm config set @starkware-libs:registry https://npm.pkg.github.com
npm config set '//npm.pkg.github.com/:_authToken' "$(gh auth token)"

npm install @starkware-libs/starknet-privacy-sdk
```

Or skip the registry entirely and install from git at a specific commit:

```shell
npm install "starkware-libs/starknet-privacy#<commit-sha>"
```

## Wire it up

The factory needs a Starknet account plus three things: a **viewing key**
(your privacy key), a **proving service** (generates validity proofs) and a
**discovery service** (finds your notes and channels). Pass the last two as
plain config objects and the SDK constructs the production providers for you.

```typescript
import { Account, RpcProvider, constants } from "starknet"
import { createPrivateTransfers } from "@starkware-libs/starknet-privacy-sdk"

const provider = new RpcProvider({ nodeUrl: process.env.RPC_URL! })

// cairoVersion "1" is required for accounts sending v3 transactions
const account = new Account({
  provider,
  address: process.env.ACCOUNT_ADDRESS!,
  signer: process.env.ACCOUNT_PRIVATE_KEY!,
  cairoVersion: "1",
})

const transfers = createPrivateTransfers({
  account,
  // The viewing key MUST be a bigint. A hex string silently misbehaves
  // downstream (wrong channel-key derivation).
  viewingKeyProvider: {
    getViewingKey: async () => BigInt(process.env.VIEWING_KEY!),
  },
  provingProvider: {
    url: process.env.PROVING_SERVICE_URL!,
    chainId: constants.StarknetChainId.SN_SEPOLIA,
  },
  discoveryProvider: { url: process.env.INDEXER_URL! },
  poolContractAddress: process.env.POOL_ADDRESS!,
})
```

If you need to configure a provider beyond what the config object exposes,
`ProvingServiceProofProvider` and `IndexerDiscoveryProvider` are both exported
from the package root and can be passed as instances instead — see
[Discovery Providers](/sdk/discovery-providers).

On Sepolia, `POOL_ADDRESS` is the privacy pool (v2.0) deployed at
[`0x0254a6b2997ef52e9f830ce1f543f6b29768295e8d17e2267d672c552cfe0d91`](https://sepolia.voyager.online/contract/0x0254a6b2997ef52e9f830ce1f543f6b29768295e8d17e2267d672c552cfe0d91).

## Going deeper

The SDK is open source (Apache 2.0):
[starkware-libs/starknet-privacy](https://github.com/starkware-libs/starknet-privacy).
Its [`sdk/README.md`](https://github.com/starkware-libs/starknet-privacy/blob/main/sdk/README.md)
covers material these pages do not — transaction sequencing against finalized
state, the `Open` note API, and `classifyTransaction` for reading history.

## Your first transaction

Every operation follows the same shape: `build()` a batch of operations, then
`execute()` it and submit the resulting call.

```typescript
// Prove against a slightly older block: notes mature 10 blocks after
// creation, and proving at the chain head risks reorg invalidation.
const provingBlockId = (await provider.getBlockNumber()) - 10

const { callAndProof } = await transfers.build().register().execute({ provingBlockId })

// Omit proof keys entirely when there are no proof facts - passing
// empty arrays serializes an invalid v3 transaction.
const proofDetails = callAndProof.proof.proofFacts?.length
  ? { proofFacts: callAndProof.proof.proofFacts, proof: callAndProof.proof.data }
  : {}

// tip is mandatory for v3 transactions in starknet.js
const tx = await account.execute(callAndProof.call, { tip: 0n, ...proofDetails })

await provider.waitForTransaction(tx.transaction_hash)
console.log(`registered in tx ${tx.transaction_hash}`)
```

This submission tail - back off `provingBlockId`, conditionally spread
`proofDetails`, pass `tip: 0n`, wait - is identical for every operation in the
following pages. We will not repeat the explanation, just the code.

## What each provider does

| Provider             | Role                                                                                                                             |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `viewingKeyProvider` | Supplies the private viewing key `k` used to decrypt notes and derive nullifiers                                                 |
| `provingProvider`    | Sends your signed invocation to a proving service, which executes it in a virtual Starknet environment and returns a STARK proof |
| `discoveryProvider`  | Scans your channels for incoming notes. Backed by `IndexerDiscoveryProvider` (HTTP discovery service)                            |

Next: register your viewing key so you can receive private transfers.

---

# Register

Source: https://strk20-by-example.org/sdk/register

> Register your viewing key in the privacy pool with the builder or autoRegister

Before an account can receive private transfers it must **register**: publish
its public viewing key on-chain and store the auditor-encrypted private key.
This happens once per account per pool deployment.

Snippets assume `transfers`, `account` and `provider` from
[Getting Started](/sdk/getting-started).

```typescript
const provingBlockId = (await provider.getBlockNumber()) - 10

const { callAndProof } = await transfers.build().register().execute({ provingBlockId })

// Submission tail (explained in Getting Started)
const proofDetails = callAndProof.proof.proofFacts?.length
  ? { proofFacts: callAndProof.proof.proofFacts, proof: callAndProof.proof.data }
  : {}
const tx = await account.execute(callAndProof.call, { tip: 0n, ...proofDetails })
await provider.waitForTransaction(tx.transaction_hash)
```

## Things to notice

- You never pass the viewing key to `register()`. The builder pulls it from
  the `viewingKeyProvider` you wired into `createPrivateTransfers`.
- The viewing key must be a **`BigInt`** in the range `[1, MAX_VIEWING_KEY]`
  (half the STARK curve order, exported by the SDK). A hex string compiles
  fine but silently derives wrong channel keys - notes sent to you will never
  decrypt.
- Registering twice reverts. Check first, or use `autoRegister` below.

## `autoRegister`

Instead of registering as its own transaction, any build can bundle the
registration in automatically when the account has no viewing key on-chain
yet:

```typescript
const { callAndProof } = await transfers
  .build({ autoRegister: true })
  .with(tokenAddress, (t) => t.deposit({ amount: 100n }))
  .surplusTo(account.address)
  .execute({ provingBlockId })
```

If the account is already registered, `autoRegister` is a no-op - safe to
leave on for first-time-user flows (a claim page, an onboarding deposit).

| Approach             | When to use                                              |
| -------------------- | -------------------------------------------------------- |
| `.register()`        | Explicit onboarding step, dedicated "register" button    |
| `autoRegister: true` | Bundle registration into the user's first real operation |

Next: [Deposit](/sdk/deposit) public ERC-20 tokens into the pool.

---

# Deposit

Source: https://strk20-by-example.org/sdk/deposit

> Approve the pool, then deposit public ERC-20 tokens into a private note

A deposit moves public ERC-20 tokens into the pool and mints a private note.
The pool pulls tokens with `transfer_from` while the proof executes, so the
ERC-20 `approve` must already be visible on-chain - it is a **separate
transaction**, submitted and waited on first.

Snippets assume `transfers`, `account` and `provider` from
[Getting Started](/sdk/getting-started).

```typescript
const poolAddress = process.env.POOL_ADDRESS!
const tokenAddress = "0x049d..." // any ERC-20
const amount = 100n

// Transaction 1 - approve the pool to pull tokens.
const approveTx = await account.execute(
  {
    contractAddress: tokenAddress,
    entrypoint: "approve",
    calldata: [poolAddress, amount.toString(), "0"],
  },
  { tip: 0n },
)
await provider.waitForTransaction(approveTx.transaction_hash)

// Transaction 2 - the private deposit.
// Re-fetch provingBlockId AFTER the approve lands, so the proof base
// is not older than the approval.
const provingBlockId = (await provider.getBlockNumber()) - 10

const { callAndProof } = await transfers
  .build({ autoSetup: true })
  .with(tokenAddress, (t) => t.deposit({ amount }))
  .surplusTo(account.address) // the deposited amount becomes my note
  .execute({ provingBlockId })

const proofDetails = callAndProof.proof.proofFacts?.length
  ? { proofFacts: callAndProof.proof.proofFacts, proof: callAndProof.proof.data }
  : {}
const tx = await account.execute(callAndProof.call, { tip: 0n, ...proofDetails })
await provider.waitForTransaction(tx.transaction_hash)
```

## Things to notice

- **Two transactions, never one.** The pool's `apply_actions` entrypoint is
  reentrancy-guarded against sharing a transaction with other calls, so you
  cannot batch `approve` and the deposit into a single `account.execute`.
- The deposit omits `recipient`; `surplusTo(account.address)` directs the
  unassigned amount into a note owned by you. This is the shape that scales
  to deposit-and-transfer on the next page.
- Amounts are **bigint literals** (`100n`) in the token's smallest unit.
- `autoSetup: true` opens your self-channel and the token subchannel if they
  do not exist yet - a first deposit needs both.
- The new note **matures 10 blocks after creation**. Maturity is enforced
  client-side: check `note.created` against the current block before spending.
  Spending earlier produces a proof built against a state where the note is not
  yet spendable, and the transaction fails.
- **Every deposit is screened.** FPI (the screening provider) screens the
  depositing address and signs each deposit, and the pool verifies that
  signature onchain - enforcement is part of the protocol since the v0.14.3
  upgrade. Wallet and hosted-proving flows handle this step for you; if a
  structurally valid deposit reverts, screening is the first thing to check.
  See [Compliance & Auditing](/compliance).

Next: [Transfer](/sdk/transfer) a note privately to another account.

---

# Transfer

Source: https://strk20-by-example.org/sdk/transfer

> Spend private notes and transfer an amount to a recipient, with change back to you

A private transfer spends one or more of your notes and creates a new note
for the recipient. Notes are UTXOs: consumed whole. If the inputs total more
than the transfer amount, the difference becomes a **change note** - and the
builder must be told who owns it.

Snippets assume `transfers`, `account` and `provider` from
[Getting Started](/sdk/getting-started).

```typescript
const bob = "0x05a1..."

// Find a note to spend (see Discovering Notes).
const { notes } = await transfers.discoverNotes({
  tokens: [BigInt(tokenAddress)],
})
const note = notes.get(BigInt(tokenAddress))![0] // e.g. a 100n note

const provingBlockId = (await provider.getBlockNumber()) - 10

const { callAndProof } = await transfers
  .build({ autoSetup: true })
  .surplusTo(account.address) // 50n change comes back to me as a new note
  .with(tokenAddress, (t) => t.inputs(note).transfer({ recipient: bob, amount: 50n }))
  .execute({ provingBlockId })

const proofDetails = callAndProof.proof.proofFacts?.length
  ? { proofFacts: callAndProof.proof.proofFacts, proof: callAndProof.proof.data }
  : {}
const tx = await account.execute(callAndProof.call, { tip: 0n, ...proofDetails })
await provider.waitForTransaction(tx.transaction_hash)
```

## Things to notice

- `.inputs(note)` selects exactly which notes to spend. Without it, set
  `autoSelectNotes` in `build()` and let the SDK choose.
- `surplusTo(...)` is **required whenever inputs may exceed outputs**.
  Spending a `100n` note to send `50n` without it throws
  "no surplus recipient" at `execute()` time.
- The change note belongs to whoever `surplusTo` names - and like every new
  note, it matures 10 blocks after creation. Back-to-back transfers that
  reuse change must wait out the maturity window.
- The recipient must be registered and reachable - see
  [Channels & Setup Requirements](/sdk/setup-requirements). `autoSetup: true`
  opens the channel and token subchannel if missing.

## Automatic note selection

| `autoSelectNotes` | Behavior                                                     |
| ----------------- | ------------------------------------------------------------ |
| `"naive"`         | Smallest set of notes that covers the amount                 |
| `"all"`           | Consume every note (consolidation) - always produces surplus |

```typescript
const { callAndProof } = await transfers
  .build({ autoSelectNotes: "naive", autoDiscover: { notes: "refresh" } })
  .surplusTo(account.address)
  .with(tokenAddress, (t) => t.transfer({ recipient: bob, amount: 50n }))
  .execute({ provingBlockId })
```

With `"all"`, `surplusTo` is effectively mandatory: it only avoids surplus
when the amounts match your balance exactly.

Next: [Deposit + Transfer](/sdk/deposit-transfer-surplus) in a single transaction.

---

# Deposit + Transfer

Source: https://strk20-by-example.org/sdk/deposit-transfer-surplus

> Deposit and transfer in one transaction, with surplusTo directing the remainder

Operations on the same token compose inside one `.with(...)` block, and the
whole batch settles atomically in one transaction. The classic case: deposit
100 and immediately transfer 60 to Bob. Omit the `recipient` on the deposit
and let `surplusTo` direct whatever is left - the SDK resolves the
intermediate steps.

Snippets assume `transfers`, `account` and `provider` from
[Getting Started](/sdk/getting-started). The ERC-20 `approve` is still a
separate transaction first (see [Deposit](/sdk/deposit)).

```typescript
// Transaction 1 - approve (identical to the Deposit page).
const approveTx = await account.execute(
  {
    contractAddress: tokenAddress,
    entrypoint: "approve",
    calldata: [poolAddress, 100n.toString(), "0"],
  },
  { tip: 0n },
)
await provider.waitForTransaction(approveTx.transaction_hash)

// Transaction 2 - deposit 100, transfer 60, keep 40.
const provingBlockId = (await provider.getBlockNumber()) - 10

const { callAndProof } = await transfers
  .build({ autoSetup: true })
  .surplusTo(account.address) // the 40n remainder becomes my note
  .with(tokenAddress, (t) =>
    t.deposit({ amount: 100n }).transfer({ recipient: bob, amount: 60n }),
  )
  .execute({ provingBlockId })

const proofDetails = callAndProof.proof.proofFacts?.length
  ? { proofFacts: callAndProof.proof.proofFacts, proof: callAndProof.proof.data }
  : {}
const tx = await account.execute(callAndProof.call, { tip: 0n, ...proofDetails })
await provider.waitForTransaction(tx.transaction_hash)
```

## Things to notice

- The deposit has **no `recipient`**. Its 100n enters the token's balance
  sheet for this transaction; the transfer takes 60n; `surplusTo` claims the
  remaining 40n. Pinning `recipient` on the deposit would instead lock the
  full 100n into a note and force the transfer to find other inputs.
- Bob's 60n note is spendable by Bob after 10 blocks; your 40n surplus note
  likewise. The transfer itself needs **no** maturity wait - the deposited
  funds are consumed within the same transaction, never as a note.
- Everything is atomic: if the transfer cannot be resolved, no deposit
  happens either.
- Balance-sheet rule per token: deposits + inputs must cover transfers +
  withdrawals, with `surplusTo` absorbing any remainder.

Next: [Withdraw](/sdk/withdraw) private funds back to a public address.

---

# Withdraw

Source: https://strk20-by-example.org/sdk/withdraw

> Withdraw private notes back to a public Starknet address as ERC-20 tokens

A withdrawal spends private notes and sends plain ERC-20 tokens to a public
Starknet address. It is the exit door of the pool - and the one place where
an amount and a recipient become publicly visible again.

Snippets assume `transfers`, `account` and `provider` from
[Getting Started](/sdk/getting-started).

```typescript
const { notes } = await transfers.discoverNotes({
  tokens: [BigInt(tokenAddress)],
})
const note = notes.get(BigInt(tokenAddress))![0] // e.g. a 100n note

const provingBlockId = (await provider.getBlockNumber()) - 10

const { callAndProof } = await transfers
  .build()
  .surplusTo(account.address) // 70n stays private as a change note
  .with(tokenAddress, (t) =>
    t.inputs(note).withdraw({ amount: 30n, recipient: account.address }),
  )
  .execute({ provingBlockId })

const proofDetails = callAndProof.proof.proofFacts?.length
  ? { proofFacts: callAndProof.proof.proofFacts, proof: callAndProof.proof.data }
  : {}
const tx = await account.execute(callAndProof.call, { tip: 0n, ...proofDetails })
await provider.waitForTransaction(tx.transaction_hash)
```

## Things to notice

- `recipient` is the **public address** that receives the ERC-20 transfer.
  It can be anyone, not just yourself - paying a merchant directly from the
  pool is a single withdraw.
- **Note maturity applies to the inputs.** A note created fewer than 10
  blocks ago cannot be spent; the SDK will happily build the proof, but the
  transaction fails. Maturity is a client-side rule — compare `note.created`
  against the current block. Proving against
  `currentBlock - 10` guarantees every note in your registry has matured at
  the proof base.
- The change (`70n` here) stays in the pool as a fresh private note via
  `surplusTo` - withdrawing does not force you to exit a whole note.
- Privacy consideration: the contract's public `transfer` call reveals token,
  amount and recipient. What stays hidden is _which_ notes funded it. Check
  `ExecuteResult.warnings` for `USER_LINKAGE` before submitting.

Next: [Multi-Operation Batches](/sdk/multi-op-batch) - many operations and
many tokens in one transaction.

---

# Multi-Operation Batches

Source: https://strk20-by-example.org/sdk/multi-op-batch

> Chain several operations on one token and several tokens in a single transaction

One build = one transaction = one proof. Inside it you can chain any number
of operations on a token, and any number of tokens via repeated `.with(...)`
blocks. Everything settles atomically.

Snippets assume `transfers`, `account` and `provider` from
[Getting Started](/sdk/getting-started).

## Several operations, one token

Spend a 100n note: 40n to Alice, 30n withdrawn to public, 30n change.

```typescript
const provingBlockId = (await provider.getBlockNumber()) - 10

const { callAndProof } = await transfers
  .build({ autoSetup: true })
  .surplusTo(account.address) // absorbs the 30n remainder
  .with(tokenAddress, (t) =>
    t
      .inputs(note100)
      .transfer({ recipient: alice, amount: 40n })
      .withdraw({ amount: 30n, recipient: account.address }),
  )
  .execute({ provingBlockId })

const proofDetails = callAndProof.proof.proofFacts?.length
  ? { proofFacts: callAndProof.proof.proofFacts, proof: callAndProof.proof.data }
  : {}
const tx = await account.execute(callAndProof.call, { tip: 0n, ...proofDetails })
await provider.waitForTransaction(tx.transaction_hash)
```

## Several tokens, one transaction

Each token gets its own `.with(...)` block with its own inputs and outputs.
The per-token balance sheets are independent; `surplusTo` at the top level
covers all of them.

```typescript
const { callAndProof } = await transfers
  .build({ autoSetup: true, autoDiscover: { notes: "refresh" } })
  .surplusTo(account.address)
  .with(STRK, (t) => t.inputs(strkNote).transfer({ recipient: alice, amount: 40n }))
  .with(ETH, (t) =>
    t.inputs(ethNote).withdraw({ amount: 10n, recipient: account.address }),
  )
  .execute({ provingBlockId })
```

## Things to notice

- Balance-sheet rule holds **per token**: inputs + deposits must cover
  transfers + withdrawals; `surplusTo` takes each token's remainder. A
  per-token override exists too: `t.surplusTo(...)` inside the block.
- At most **one `invoke()` per transaction** - the pool contract enforces a
  single external call per `apply_actions`. The builder errors if you chain
  two.
- Larger batches mean larger proofs. Very large recipient lists can hit
  proof-size limits; wrap the batch in a try/catch and fall back to
  per-recipient transactions, waiting out the 10-block change-note maturity
  between them.
- For batches to recipients who may lack channels, do not rely on
  `autoSetup` - pre-flight each recipient instead, as shown on the next page.

Next: [Channels & Setup Requirements](/sdk/setup-requirements) - knowing what
setup a recipient needs.

---

# Channels & Setup Requirements

Source: https://strk20-by-example.org/sdk/setup-requirements

> Check what setup a recipient needs with discoverRequirement and open channels explicitly

Notes travel over **channels**. Before you can transfer token X to Bob, three
things must exist: Bob's registration, a channel from you to Bob, and a
subchannel for token X inside that channel. `discoverRequirement` tells you
which of these is still missing.

Snippets assume `transfers`, `account` and `provider` from
[Getting Started](/sdk/getting-started).

```typescript
import { SetupRequirement } from "@starkware-libs/starknet-privacy-sdk"

// recipient is a hex string; token must be a bigint.
const requirement = await transfers.discoverRequirement(bob, BigInt(tokenAddress))
```

| `SetupRequirement` | Meaning                                          | Fix                                            |
| ------------------ | ------------------------------------------------ | ---------------------------------------------- |
| `Register`         | Recipient has no viewing key on-chain            | They must register - you cannot do it for them |
| `SetupChannel`     | No channel from you to the recipient             | `builder.setup(recipient)`                     |
| `SetupToken`       | Channel exists, this token's subchannel does not | `t.setup(recipient)`                           |
| `Ready`            | Transfer will go through                         | Nothing                                        |

## Opening channels explicitly

`setup()` on the **main builder** opens the channel; `setup()` on the
**token builder** opens the token subchannel. Bundle them with the transfer
they unblock:

```typescript
const provingBlockId = (await provider.getBlockNumber()) - 10
const builder = transfers.build({ autoDiscover: { notes: "refresh" } })
builder.surplusTo(account.address)

if (requirement === SetupRequirement.SetupChannel) {
  builder.setup(bob) // channel
  builder.with(tokenAddress, (t) => t.setup(bob)) // + token subchannel
} else if (requirement === SetupRequirement.SetupToken) {
  builder.with(tokenAddress, (t) => t.setup(bob)) // subchannel only
}

builder.with(tokenAddress, (t) => t.transfer({ recipient: bob, amount: 50n }))
const { callAndProof } = await builder.execute({ provingBlockId })
// ... submission tail as usual
```

## `autoSetup`

`build({ autoSetup: true })` adds the missing setup actions automatically -
convenient for single-recipient flows. For batches, prefer the explicit
pattern above: `autoSetup` decides from the **local registry**, and stale
registry data makes it re-open already-open channels, which fails on-chain.

## Things to notice

- **The caller must be registered** before calling `discoverRequirement` -
  it derives your channel keys from your on-chain viewing key. If you are
  not registered it throws, with an unhelpful message; match on
  `"not registered"` / `"viewing key"` substrings to distinguish it from
  RPC errors.
- `SetupRequirement.Register` is a hard stop: only the recipient can publish
  their own viewing key. Show "ask them to register" UX.
- Opening a channel is a proved pool action like any other - it rides the
  same build/execute/submit cycle, alone or alongside transfers.

Next: [Discovering Notes](/sdk/note-discovery) - reading your private balance.

---

# Discovering Notes

Source: https://strk20-by-example.org/sdk/note-discovery

> Scan your channels for unspent notes with discoverNotes and discoverChannels

Discovery scans your channels and decrypts the notes addressed to you. It is
a **query, not a transaction** - no proof, no fee, no submission. Use it to
show the user's private balance and to feed `.inputs(...)`.

Snippets assume `transfers`, `account` and `provider` from
[Getting Started](/sdk/getting-started).

```typescript
const { notes, timestamp } = await transfers.discoverNotes({
  tokens: [BigInt(tokenAddress)], // token filter entries MUST be bigint
})

// notes: AddressMap<Note[]> keyed by BIGINT token address
const tokenNotes = notes.get(BigInt(tokenAddress)) ?? []
const balance = tokenNotes.reduce((sum, note) => sum + note.amount, 0n)
```

## `AddressMap`

The result map normalizes address keys - but as **bigints**, not strings:

```typescript
notes.get(tokenAddress) // undefined - string key never matches
notes.get(tokenAddress.toLowerCase()) // still undefined
notes.get(BigInt(tokenAddress)) // works

// Iterating across all tokens is always safe:
for (const tokenNotes of notes.values()) {
  // ...
}
```

## Incremental scans with a cursor

Discovery without a cursor scans from the beginning. Persist the cursor from
the underlying provider (or better: reuse the `registry`) so repeat scans
only cover new blocks:

```typescript
const { notes } = await transfers.discoverNotes({
  tokens: [BigInt(tokenAddress)],
  cursor: previousCursor, // resume where the last scan stopped
})
```

The higher-level version of the same idea is the **registry**: every
`execute()` returns an updated `PrivateRegistry` (channels + notes + cursor).
Pass it back into the next `build({ registry })` and combine with
`autoDiscover: { notes: "missing" }` to fetch only what the registry lacks -
`"refresh"` re-scans, `"all"` rebuilds from scratch.

## Discovering channels

```typescript
const { channels, total } = await transfers.discoverChannels("all", {
  cursor: previousChannelCursor,
})
// channels: AddressMap<Channel> keyed by recipient address
```

Pass `"all"` or a list of recipient addresses to filter. Channels hold the
shared key and per-token nonces; you mostly treat them as opaque values that
the registry manages for you.

## Things to notice

- A note becomes visible to discovery once its transaction is accepted, but
  it is only **spendable 10 blocks after creation**. Check `note.created`
  against the current block before offering it as an input.
- Discovery cost scales with unscanned history - a fresh full scan on a
  long-lived pool is slow on RPC-based providers. Cursors and the registry
  exist precisely to avoid it.

Next: [Discovery Providers](/sdk/discovery-providers) - choosing what backs
these scans.

---

# Discovery Providers

Source: https://strk20-by-example.org/sdk/discovery-providers

> IndexerDiscoveryProvider is the discovery backend the SDK exports; ContractDiscoveryProvider exists in source but is not yet reachable

Everything on the previous page - `discoverNotes`, `discoverChannels`,
`discoverRequirement`, the `autoDiscover` options - is served by the
`discoveryProvider` you wired into `createPrivateTransfers`. The SDK source
contains two implementations, but only one is currently reachable from the
published package.

| Provider                    | Backend                        | Use for                                                         |
| --------------------------- | ------------------------------ | --------------------------------------------------------------- |
| `IndexerDiscoveryProvider`  | Discovery service over HTTP    | Production - pagination and reorg detection handled server-side |
| `ContractDiscoveryProvider` | Pool contract via Starknet RPC | Not yet exported from the published package - see below         |

## IndexerDiscoveryProvider

The default. Passing a config object to `createPrivateTransfers` constructs one
for you:

```typescript
discoveryProvider: {
  url: process.env.INDEXER_URL!
}
```

Construct it directly only when you need constructor options the config object
does not expose — for example OHTTP envelope encryption:

```typescript
import { IndexerDiscoveryProvider } from "@starkware-libs/starknet-privacy-sdk"

const discoveryProvider = new IndexerDiscoveryProvider(
  process.env.INDEXER_URL!,
  process.env.POOL_ADDRESS!, // hex string, like everywhere else
  { ohttp: true },
)
```

Import it from the package root. Deep paths into `dist/internal/` are blocked by
the package's `exports` map and fail at runtime with
`ERR_PACKAGE_PATH_NOT_EXPORTED`.

## ContractDiscoveryProvider

Replays pool events by querying the contract over RPC, with no indexer to run.
It exists in the SDK source but is **not currently reachable from the published
package** — it is not exported from the package root, and the `exports` map
blocks every deep path, so `import { ContractDiscoveryProvider } from
"@starkware-libs/starknet-privacy-sdk"` fails with
`TS2305: has no exported member`.

Until it is exported, use `IndexerDiscoveryProvider` against a development
indexer. Track
[starkware-libs/starknet-privacy](https://github.com/starkware-libs/starknet-privacy)
for the export.

## Things to notice

- Reorg handling: the indexer detects L2 reorgs and repairs its cursor
  automatically. You do not need to write reorg-handling logic against
  `IndexerDiscoveryProvider`.
- Discovery cost does not grow with pool history from your app's
  perspective - the indexer scans the pool once, server-side, for every
  consumer.

Next: [Proving Configuration](/sdk/proving-config) - the proving side of the
same wiring.

---

# Proving Configuration

Source: https://strk20-by-example.org/sdk/proving-config

> Configure ProvingServiceProofProvider, pick provingBlockId, and submit proofs correctly

The proving provider sends your signed invocation to a proving service,
which executes it in a virtual Starknet environment and returns a STARK
proof. Three small conventions around it account for most submission
failures.

Snippets assume `transfers`, `account` and `provider` from
[Getting Started](/sdk/getting-started).

```typescript
import { constants } from "starknet"
import { ProvingServiceProofProvider } from "@starkware-libs/starknet-privacy-sdk"

const provingProvider = new ProvingServiceProofProvider(
  process.env.PROVING_SERVICE_URL!,
  constants.StarknetChainId.SN_SEPOLIA,
)
```

## `provingBlockId` - always `currentBlock - 10`

```typescript
const provingBlockId = (await provider.getBlockNumber()) - 10
const result = await transfers.build()./* ... */.execute({ provingBlockId })
```

The proof is generated against the state at `provingBlockId`. Three reasons to
back off from the head:

1. **Note maturity** - notes mature 10 blocks after creation. Proving at
   `currentBlock - 10` guarantees every unspent note in your registry has
   matured at the proof base.
2. **Reorg buffer** - a proof based on the chain head can be invalidated by
   an L2 reorg before the transaction lands. The contract allows proofs up to
   `proof_validity_blocks` old (default 450, ~15 min at 2s/block; it is
   governance-settable), so ten blocks back is a comfortable, still-fresh
   margin.
3. **Consistent state** - the SDK forwards `provingBlockId` to `discoverNotes`
   and `discoverChannels`, so discovery and proving see the same block. Without
   it the two can disagree, and a note selected from a newer state can fail to
   prove.

Omitting it works _most_ of the time - with intermittent failures on
insufficiently mature notes and worse proving-service cache hits. Just always
pass it. And when
chaining transactions (approve then deposit), re-fetch it after each
`waitForTransaction`.

## `proofDetails` - conditional, never empty

```typescript
const proofDetails = callAndProof.proof.proofFacts?.length
  ? { proofFacts: callAndProof.proof.proofFacts, proof: callAndProof.proof.data }
  : {}
const tx = await account.execute(callAndProof.call, { tip: 0n, ...proofDetails })
```

Some providers (the mock/no-validate ones used in development) return empty
proof facts. Passing `proofFacts: []` through to `account.execute` makes
starknet.js serialize an invalid v3 transaction - the keys must be **omitted
entirely**, hence the conditional spread. `tip: 0n` is mandatory for v3
transactions; forgetting it fails with the cryptic
`Cannot mix BigInt and other types`.

## Retry hygiene: `invalidateProofNonceCache()`

The proving provider caches the pool nonce. After any failed submission -
a revert, `INVALID_NONCE`, `Replacement transaction underpriced` - the cache
is stale, and retrying loops on proofs the chain keeps rejecting:

```typescript
transfers.invalidateProofNonceCache()
// ...then rebuild and resubmit
```

## Deposits are screened on every proving route

A custom or self-hosted proving backend can prove every pool action, but a
deposit is only accepted with a screening signature: FPI screens the
depositing address and signs the deposit, and the pool verifies that
signature onchain. Self-hosting is not a route around screening.

Teams running their own prover typically shield through a privacy-enabled
wallet (Ready or Xverse) and then transfer privately to the account their
integration controls. If your production flow needs direct deposits, raise it
in the [Cairo CoreStars Telegram](https://t.me/sncorestars).

## Common failures

| Symptom                                | Cause                           | Fix                                 |
| -------------------------------------- | ------------------------------- | ----------------------------------- |
| Spend fails on a recently created note | `provingBlockId` not backed off | Use `currentBlock - 10`             |
| `Cannot mix BigInt and other types`    | Missing `tip`                   | Add `tip: 0n`                       |
| Revert with `INVALID_PROOF_FACTS`      | Passed `proofFacts: []`         | Conditional spread                  |
| `INVALID_NONCE` on retry               | Stale cached pool nonce         | `invalidateProofNonceCache()` first |

This is the last page of the series - head back to
[Getting Started](/sdk/getting-started) to revisit the wiring.

---

# Tip Jar

Source: https://strk20-by-example.org/app/tip-jar

> Add privacy to an app that already has users, liquidity, and activity

The **Tip Jar** is a worked example of the
[Starknet Wallet API](/starknet-wallet-api/overview) route applied to an app that
already exists. It starts as an ordinary public tip jar deployed on Starknet
mainnet, then gains a private tipping path beside the public one. You can **add
privacy to an app with existing users, liquidity, and activity**, which is the
key advantage of STRK20 over building a separate private app.

Use it as a reference when you have a live app and want to see which files
change. The deployed contract is not one of them. The app itself runs at
[strk20-tipjar.vercel.app](https://strk20-tipjar.vercel.app).

## What the two paths look like

A tip jar has one onchain action: tip the creator.

The **public path** calls a `TipJar` contract, which forwards the token and emits
a `Tipped` event. Who paid whom, how much, and when are permanently visible.

The **private path** calls no contract at all:

1. **Shield** - the tipper deposits tokens into the pool, earlier and on its own.
2. **Wait** - the resulting note matures after roughly 10 blocks.
3. **Swap** (optional) - a private swap turns any shielded token into STRK inside
   the pool.
4. **Private transfer** - the tipper pays the creator, with no public leg.

Both paths deliver the same value to the creator. The private one leaves no
public link between the two.

The snippets below need `starknet@^10.4.0` — STRK20 support is on the npm `next`
tag, and `latest` (10.0.x) has none of it.

## How it works in code

The private tip is a single action handed to the wallet:

```ts
const actions: STRK20_ACTION[] = [
  { type: "transfer", token: strkAddress, amount, recipient },
]
const { transaction_hash } = await account.strk20InvokeTransaction(actions)
```

There is no contract call, no event, and no approval step. The wallet holds the
keys, discovers the notes, generates the proof, and submits.

Shielding is the same call with a different action:

```ts
const actions: STRK20_ACTION[] = [{ type: "deposit", token: tokenAddress, amount }]
```

Capability detection reads no private state:

```ts
const versions = await walletV6.supportedWalletApi(wallet)
const supported = versions.some((v) => compareVersions(v, "0.10.3") >= 0)
```

## Shield separately from the transfer

Shielding is its own step, done ahead of time — and that is what makes the tip
unlinkable. A deposit into the pool is public and names the depositor, while a
private transfer has no public leg at all. Because the two are separate
transactions, nothing on-chain ties the deposit to the payment, and no observer
can connect the tipper to the creator.

Shield ahead of time, tip later. The note matures in the meantime, and the
transfer that follows leaves no public trace.

## Verified onchain

The creator's wallet received four private transfers totalling 42 STRK while the
jar's public counter stayed at 3 tips and 3 STRK. The `TipJar` contract was not
modified, which the repository leaves checkable through two tags:

```sh
git diff --stat v1-public v2-private -- contracts/src/tipjar.cairo
```

Full walkthrough, including the integration log and deployment record:
[TUTORIAL.md](https://github.com/starkience/strk20-tipjar-example/blob/main/TUTORIAL.md)
(MIT).

## Read next

- [Starknet Wallet API overview](/starknet-wallet-api/overview)
- [starknet.js](/starknet-wallet-api/starknet-js)
- [Agent Skill](/agent-skill)
- [Anonymizer Contract Anatomy](/helpers/privacy-invoke)

---

# Agent Skill

Source: https://strk20-by-example.org/agent-skill

> Let your coding agent plan and build an STRK20 integration for your app

Everything on this site can be done for you by a coding agent. The STRK20
integration skill turns Claude Code, Codex, Cursor, and 14+ other agents into
an integration engineer for the repo they run in:

```sh
npx skills add starkience/strk20-agent-skills
```

Then, inside your project, ask your agent to **"plan STRK20 privacy for this
app."**

### What it does

1. **Scans** your repo - starknet.js version, get-starknet, Cairo contracts,
   backend SDKs - and finds the plug-in points.
2. **Asks** - a short interview: what exactly should be private, which wallets
   your users hold, testnet or mainnet first.
3. **Routes** - Starknet Wallet API via starknet.js (most dapps), anonymizer
   contract + Wallet API (DeFi protocols), Privacy SDK direct (wallets and
   backends holding their own keys), or private sub-accounts (tracked).
4. **Plans** - writes a phased, versioned `STRK20_INTEGRATION_PLAN.md` naming
   your actual files, honest about what is hidden vs. visible.
5. **Executes on your approval** - builds the plan phase by phase, with
   headless checks per phase and a short manual wallet check handed to you at
   every phase boundary. Its chat output links back to the matching pages on
   this site.

### What it never does

- **Generate or edit Cairo contracts.** An anonymizer contract stays your
  team's code to write, review, and audit; the skill points at the public
  reference packages instead. Learn more about Cairo at
  [cairo-lang.org](https://www.cairo-lang.org/) and about anonymizer contracts
  in [Anonymizer Contract Anatomy](/helpers/privacy-invoke).
- **Touch key material.** Viewing keys, private keys, and secrets never land
  in files - env-var placeholders only.
- **Ship to mainnet silently.** Testnet by default; mainnet-affecting changes
  require your explicit confirmation.

### This site is agent-readable

Agents don't need to parse the app bundle: every page on this site is mirrored
as raw Markdown. Start from [/llms.txt](/llms.txt) (index of all pages as `.md`
URLs) or fetch the whole site in one file at [/llms-full.txt](/llms-full.txt).

Source, docs, and issues:
[github.com/starkience/strk20-agent-skills](https://github.com/starkience/strk20-agent-skills)
(Apache 2.0).




---

# STRK20 Brand & UI Guidelines

> Everything an agent (or human) needs to build interfaces that look like STRK20. Machine-readable design tokens: [/brand/tokens.json](https://strk20.starknet.io/brand/tokens.json). Logos: [/brand/](https://strk20.starknet.io/brand). Live reference: [strk20.starknet.io](https://strk20.starknet.io).

## The look in one paragraph
STRK20 is **dark, terminal, and industrial** — a near-black canvas (`#0d0d0d`) with one vivid orange accent (`#c53400`) and nothing else competing for attention. Type is loud and structural: huge, tight, uppercase display headlines; clean sans body; and small monospace labels tracked wide like a control panel. Surfaces are flat dark panels edged with hairline borders; corners are mostly sharp. Ambient texture — film grain, faint scanlines, and orange radial glows — gives it a CRT/terminal feel without noise. Motion is restrained: content reveals on scroll and cards lift subtly on hover. The voice matches: terse, technical, confident.

**Golden rules:** near-black backgrounds · exactly one accent (orange) · uppercase display + mono labels · hairline borders · sharp corners · single subtle orange glow per surface · restraint over decoration.

---

## Color

| Role | Token | Value |
|------|-------|-------|
| Canvas | `bg.base` | `#0d0d0d` |
| Raised surface | `bg.raised` | `#141414` |
| Raised (higher) | `bg.raised2` | `#1a1a1a` |
| Hairline border | `line.default` | `#262626` |
| Subtle divider | `line.subtle` | `rgba(250,250,250,0.05)` |
| Primary text | `text.default` | `#fafafa` |
| Secondary text | `text.dim` | `rgba(250,250,250,0.65)` |
| Muted / labels | `text.faint` | `#616161` |
| Disabled | `text.ghost` | `#3a3a3a` |
| **Accent** | `accent.orange` | **`#c53400`** |
| Accent (pressed) | `accent.orangeDark` | `#a02a00` |
| Accent glow | `accent.glow` | `rgba(197,52,0,0.55)` |
| Text selection | — | bg `#c53400`, text `#1a0a04` |

**Rules:**
- **One accent, always orange.** `#c53400` (= `rgba(197,52,0,α)`) is the only brand hue — used for CTAs, links, eyebrow ticks, focus, status dots, top-accent rules, and every glow. Do **not** add a second color.
- Text hierarchy is opacity-driven white, not new colors: `#fafafa` → 65% → `#616161`.
- Note: in the codebase the accent CSS var is confusingly named `--green` but its value is orange. Ignore the name; use orange.

---

## Typography

Three faces, three jobs:

| Role | Font | Fallback stack | Treatment |
|------|------|----------------|-----------|
| **Display** (H1–H4) | Unison Pro (800) | `"Unison Pro","Neue Montreal","Helvetica Neue",sans-serif` | **UPPERCASE**, `letter-spacing:-0.025em`, `line-height:1.0`, `text-wrap:balance` |
| **Body** | Neue Montreal (400) | `"Neue Montreal","Helvetica Neue",Arial,sans-serif` | `line-height:1.6` |
| **Labels / mono** | GT America Mono | `"GT America Mono",ui-monospace,"SFMono-Regular",monospace` | UPPERCASE, `letter-spacing:0.22em–0.32em` |

The three brand faces are **commercial/paid** (Fontfabric, Pangram Pangram, Grilli Type) — do **not** redistribute the files. The fallback stacks render faithfully; free stand-ins: display → *Archivo Expanded* / *Space Grotesk*, mono → *Space Mono* / *IBM Plex Mono*.

**Display headline treatment** — hero H1s are gradient-filled warm off-white, clipped to text:
```css
background: linear-gradient(178deg, #fffdf1 0%, #f4ece8 50%, #ffcdb6 100%);
-webkit-background-clip: text; -webkit-text-fill-color: transparent;
```
**Fluid type ladder** (use `clamp()`): H1 `clamp(22px,5.6vw,62px)` · section H2 `clamp(26px,3.4vw,52px)` · card H3 `clamp(19px,1.9vw,30px)`.
**Exception:** descriptive *card* titles (not section headlines) use the **body** font at weight 500–600 — a softer treatment that distinguishes them from display headlines.

---

## Logos

Files live under [`/brand/`](https://strk20.starknet.io/brand):

| Asset | File | Use on |
|-------|------|--------|
| Wordmark, color | `strk20-logo.svg` / `.png` | dark backgrounds (default) |
| Wordmark, color | `strk20-logo-onlight.svg` | light backgrounds |
| Wordmark, mono | `strk20-logo-white.svg` | orange / photo backgrounds |
| Wordmark, mono | `strk20-logo-black.svg` | light print / single-color |
| Icon / mark | `strk20-mark.svg` / `.png` | favicons, avatars, tight spaces |

The wordmark is **`STRK`** + a bracketed **`[20]`** with a slashed zero. **Do:** keep the `[20]` orange on the color versions; give it clear space of at least the height of the "S"; use SVG whenever possible. **Don't:** recolor `STRK` to orange, restretch/skew, add effects, or place the color wordmark on a busy background (use the white mono version).

---

## Components

### Buttons
Base is monospace, uppercase, sharp (2px), hairline-bordered:
```css
.btn {
  display:inline-flex; align-items:center; gap:0.6em;
  font-family: var(--mono); font-size:13px; letter-spacing:0.04em; text-transform:uppercase;
  padding:12px 20px; border:1px solid var(--line); border-radius:2px;
  background:transparent; color:var(--text);
  transition: border-color .2s, background .2s, color .2s, transform .15s;
}
.btn:hover { transform: translateY(-1px); }
.btn-orange { background:var(--orange); border-color:var(--orange); color:#fff; font-weight:600; }
.btn-orange:hover { box-shadow: 0 0 28px rgba(197,52,0,0.5); }   /* primary CTA */
.btn-ghost:hover { border-color:var(--orange); color:var(--orange); }  /* secondary */
```
**Arrow convention** — the glyph signals intent, and nudges on hover: `↓` scroll/enter · `→` forward nav · `↗` external/new-tab · `»` "read more".

### Eyebrow labels
Small mono kickers above headings. Two variants:
- **Faint** — `mono, 11px, letter-spacing:0.32em, uppercase, color:#616161`, prefixed with a `◢` tick in **orange**. e.g. `◢ HOW IT WORKS`.
- **Accent** — `mono, 12px, letter-spacing:0.18em, uppercase, color:#c53400` (no glyph). e.g. `WHERE TO START`.
- **Category tags** wrap in literal brackets: `[ MARKETS ]`, `[ PAYMENTS ]` (mono, faint).

### Cards
- **Bento card** (signature): flat dark panel with a per-card corner **orange radial glow** + diagonal panel gradient, a hairline border, and an oversized **"ghost numeral"** bleeding off the top-right (cropped by `overflow:hidden`).
  ```css
  background:
    radial-gradient(ellipse 70% 80% at 12% 0%, rgba(197,52,0,0.13), transparent 60%),
    linear-gradient(165deg,#181818 0%,#141414 48%,#100c0a 100%);
  border:1px solid var(--line);
  /* ghost numeral: display font, clamp(84px,9vw,150px), color:rgba(197,52,0,0.14), top/right, absolute */
  ```
  Hover: `transform:translateY(-4px); border-color:rgba(197,52,0,0.5); box-shadow:0 40px 70px -30px rgba(0,0,0,0.7)` (the ghost numeral drifts and warms).
- **Feature card:** same dark panel + a **`border-top:2px solid #c53400`** accent rule and a base-rising orange bloom.
- **Corner radius:** bento/section cards are sharp (`0`); softer content cards use `10–12px`; status pills `999px`.

### Section layout
- Content max-width **1280px** (wide/build pages **1680px**), inside a fluid gutter `clamp(20px,5vw,72px)`.
- Section vertical padding `clamp(80px,12vh,150px)`; build sections are full-viewport (`min-height:100vh`, centered).
- Sections separate by padding + background, occasionally a `border-top:1px solid var(--line)` — never heavy dividers.

---

## Textures & effects (the "terminal" feel)
Layer these subtly over the dark canvas:
- **Film grain** — fixed full-screen SVG `fractalNoise` overlay at **`opacity:0.04`**, gently animated.
- **Scanlines** — `repeating-linear-gradient(0deg, transparent 0 3px, rgba(0,0,0,0.18) 3px 4px)` at **`opacity:0.35; mix-blend-mode:multiply`**.
- **Orange radial glow** — the signature ambient bloom: `radial-gradient(ellipse …, rgba(197,52,0,0.08–0.16), transparent 55–60%)` placed at one corner/edge per surface. One glow per surface, never many.
- **Code rain** — low-opacity mono hex/symbol strings behind cards (decorative, `aria-hidden`).
- **Selection** — orange background, near-black text.
- (Advanced) the build hero runs a WebGL "faulty terminal" shader tinted `#c53400` at `opacity:0.55` behind a darkening scrim.

---

## Motion
- **Reveal on scroll** — the default entrance: `opacity:0→1` + `translateY(22px)→0` over `.7s cubic-bezier(.2,.7,.2,1)`, staggered by ~0.05s between siblings.
- **Signature easing:** `cubic-bezier(.2,.7,.2,1)`.
- **Hover:** buttons lift `translateY(-1px)`; cards lift `translateY(-4px)` with a large soft shadow; arrows nudge 3–4px.
- **Durations:** 0.15–0.25s for hover, 0.7s for reveals.
- Always honor `@media (prefers-reduced-motion: reduce)` — disable animations.

---

## Voice & tone
Terse, technical, confident. Short declarative sentences; imperative product verbs; names real primitives; a period at the end of headlines.
- Headlines: *"Privacy that works for crypto."* · *"Pick your integration route."* · *"Privacy, not secrecy."* · *"Private by default, disclosable when required."* (the qualifying clause often set in orange).
- Body: dense and spec-like — *"Anonymous swaps run on existing AMMs (Ekubo, AVNU). No unshield-swap-reshield, no fragmented liquidity."*
- Micro/meta copy reads like a filing: `FILED · APR 2026 / STATUS · OPEN / STAGE · PRE-SEED → SEED`.
- Avoid hype adjectives and filler; let the mechanism be the flex.

---

## Copy-paste starter
Drop this in and you're building in-brand:
```css
:root{
  --bg:#0d0d0d; --bg-1:#141414; --bg-2:#1a1a1a; --line:#262626;
  --text:#fafafa; --dim:rgba(250,250,250,.65); --faint:#616161;
  --orange:#c53400; --orange-d:#a02a00; --glow:rgba(197,52,0,.55);
  --display:"Unison Pro","Helvetica Neue",sans-serif;
  --body:"Neue Montreal","Helvetica Neue",Arial,sans-serif;
  --mono:"GT America Mono",ui-monospace,monospace;
  --gut:clamp(20px,5vw,72px);
}
body{ background:var(--bg); color:var(--text); font-family:var(--body); line-height:1.6; }
h1,h2,h3{ font-family:var(--display); font-weight:800; text-transform:uppercase; letter-spacing:-.025em; line-height:1; }
.eyebrow{ font-family:var(--mono); font-size:11px; letter-spacing:.32em; text-transform:uppercase; color:var(--faint); }
.eyebrow b{ color:var(--orange); }  /* the ◢ tick */
```

---

_Machine-readable tokens: [/brand/tokens.json](https://strk20.starknet.io/brand/tokens.json) · This site indexed for agents: [/llms-full.txt](https://strk20.starknet.io/llms-full.txt)_




---

# STRK20 — Privacy that works for crypto

> STRK20 brings compliant, programmable privacy to any ERC-20 asset on Starknet. Shield balances, send private transfers, and use private DeFi — all on existing wallets and existing liquidity, with a built-in compliance path. Built by StarkWare.

STRK20 is privacy that works for crypto: private by default, disclosable when required (per-user viewing keys and wallet-level screening). It runs on the apps and liquidity people already use on Starknet rather than a new chain.

This is the full-content index of strk20.starknet.io for AI agents. Runnable code examples, the TypeScript SDK, and contract references live at strk20-by-example.org and github.com/starkware-libs/starknet-privacy.

## What you can do

- Shield / unshield — any ERC-20 balance from your existing Starknet wallet.
- Private transfers — send tokens with no on-chain link between sender and receiver.
- Anonymous DeFi — swap and lend against existing AMM liquidity (Ekubo, AVNU).
- Compliance-first — per-user viewing keys and wallet-level screening; private by default, disclosable when required.

## Integration routes

- Build a private dapp — private DeFi, private consumer apps, private games. Anonymizer contracts + the Starknet Wallet API. (https://strk20-by-example.org/helpers/privacy-invoke)
- Build a privacy wallet — or an advanced backend that needs direct control. The Privacy SDK. (https://strk20-by-example.org/sdk/getting-started)
- Run your own prover — operate proof generation infrastructure yourself. (https://strk20-by-example.org/sdk/proving-config)
- Hide the wallet link — break the public link between a main wallet and app activity. Private sub-accounts, coming soon.

## Core pieces

- STRK20 Pool — the live Starknet mainnet pool that holds ERC-20s as encrypted notes and enables shielded balances, private transfers, and private DeFi. (https://strk20-by-example.org/what-is-strk20)
- Starknet Wallet API — the application-layer route, and the one most apps should use — integrate through starknet.js and ask the wallet to perform the private action, so the dapp never touches the user's viewing key or the SDK. (https://strk20-by-example.org/starknet-wallet-api/overview)
- Anonymizer contracts — app-specific privacy_invoke adapters for DeFi; the pool calls the anonymizer atomically, then credits the result back into private notes. (https://strk20-by-example.org/helpers/privacy-invoke)
- Privacy SDK — the low-level route for wallets and advanced integrations that need direct control over registration, channels, note discovery, and proving. (https://strk20-by-example.org/sdk/getting-started)
- Private sub-accounts — an advanced account-privacy route for hiding the public link between a user's main wallet and app activity (coming soon).
- Prover backend — infrastructure for teams that need to operate their own proof generation. (https://strk20-by-example.org/sdk/proving-config)

## Why build on STRK20

- Protocol-level privacy — built into the protocol, not bolted on at the app layer. Every shielded asset shares one unified privacy pool, so the anonymity set grows with total system usage.
- Anonymous DeFi on existing liquidity — anonymous swaps run on existing AMMs (Ekubo, AVNU). No unshield-swap-reshield, no fragmented liquidity.
- Multi-call composability — unshield, swap across AMMs, flash-loan, repay, and reshield inside one private transaction.
- No new wallets — existing Starknet wallets via native account abstraction: multisig, hardware, social recovery.
- Compliance-first — deposit screening is mandatory and enforced onchain: FPI screens the addresses that shield tokens and signs every deposit, and the pool verifies that signature. Running your own prover doesn't bypass it. Private by default, disclosable when required.
- Built on Cairo — both the smart contract and the proving language, which is what makes atomic, composable privacy possible.

## Get involved

- Proof of Privacy Incubator — eight weeks of mentorship, milestone-based support, and a demo day for teams building with STRK20. (https://proof.starknet.io)
- Request for Startups — defined problem statements for specific builds: private payroll, lending, identity, and more. (https://strk20.starknet.io/rfp)
- Book a call — a direct line to the team to validate your idea. (https://cal.com/adithyadinesh)

## Builder resources

- STRK20 by Example — learn Starknet Privacy with runnable examples: the Starknet Wallet API, Cairo anonymizer contracts, and wallet-builder SDK flows. Agent-readable: https://strk20-by-example.org/llms-full.txt (https://strk20-by-example.org/)
- STRK20 Starter Kit — a lean Next.js app with the Starknet Wallet API wired up: wallet picker, shield / unshield / private transfer, shielded balances, and a deployable privacy_invoke helper. Clone it and swap in your own token. (https://github.com/Akashneelesh/strk20-starter-kit)
- Starknet Privacy SDK — the open-source monorepo (Apache-2.0): TypeScript SDK, pool contracts, and anonymizer reference packages. (https://github.com/starkware-libs/starknet-privacy)
- Awesome STRK20 — a collection of Starknet privacy libraries, resources, and PoCs. (https://github.com/Akashneelesh/awesome-strk20)
- Brand & UI kit — colors, fonts, logos, and components with machine-readable design tokens (/brand/tokens.json) and guidelines (/brand.md) — build interfaces that look like STRK20. (https://strk20.starknet.io/brand)

## Learn — video walkthrough summaries

- What is shielding? — Shielding turns a public ERC-20 balance into an encrypted note in the STRK20 pool; unshielding turns it back. The token is unchanged — only its balance and movement become private.
- Public vs private mode — An asset can move in public mode (normal transfers) or private mode (shielded notes). Users choose per action, and the same Starknet wallet handles both.
- Anonymous swaps explained — Private swaps route through existing Starknet AMMs (Ekubo, AVNU) from inside the pool, so the AMM never sees that the trade came from a privacy pool — no unshield-swap-reshield.
- Multi-call private transactions — One private transaction can unshield, swap across AMMs, flash-loan, repay, and reshield atomically — the first multi-call support inside a privacy system.
- User walkthroughs — Step-by-step guides: get a Ready or Xverse wallet, bridge assets to Starknet, shield and unshield, transfer privately, and swap privately.

## Request for Startups (open problem statements)

Full problem statements are at each linked page:

- Privacy wallet — https://strk20.starknet.io/rfp/privacy-wallet
- Private payroll — https://strk20.starknet.io/rfp/private-payroll
- Private messaging — https://strk20.starknet.io/rfp/private-messaging
- Private OTC settlement — https://strk20.starknet.io/rfp/private-otc-settlement
- Sealed-bid auctions — https://strk20.starknet.io/rfp/sealed-bid-auctions
- Cross-chain privacy hub — https://strk20.starknet.io/rfp/cross-chain-privacy-hub
- Private subscriptions — https://strk20.starknet.io/rfp/private-subscriptions
- Private prediction market — https://strk20.starknet.io/rfp/private-prediction-market
- Private poker — https://strk20.starknet.io/rfp/private-poker
- Private pump.fun — https://strk20.starknet.io/rfp/private-pumpfun
- Social deduction game — https://strk20.starknet.io/rfp/social-deduction-game
- Savings-circle vaults — https://strk20.starknet.io/rfp/savings-circle-vaults
- Chain-abstracted private execution — https://strk20.starknet.io/rfp/chain-abstracted-private-execution
- Universal private payment rail — https://strk20.starknet.io/rfp/universal-private-payment-rail
- Private multi-wallet launchpad — https://strk20.starknet.io/rfp/private-multi-wallet-launchpad
- Confidential token launch — https://strk20.starknet.io/rfp/confidential-token-launch
- Private crypto neobank — https://strk20.starknet.io/rfp/private-crypto-neobank
- Private OTC / RFQ block trading — https://strk20.starknet.io/rfp/private-otc-rfq-block-trading
- Private market-maker vaults — https://strk20.starknet.io/rfp/private-market-maker-vaults
- Private index & copy-trading vaults — https://strk20.starknet.io/rfp/private-index-copy-trading-vaults
- Private cross-chain bridge — https://strk20.starknet.io/rfp/private-cross-chain-bridge
- Privacy compliance layer — https://strk20.starknet.io/rfp/privacy-compliance-layer
- Private yield account — https://strk20.starknet.io/rfp/private-yield-account
- Private account & portfolio layer — https://strk20.starknet.io/rfp/private-account-portfolio-layer
- Private governance & delegation — https://strk20.starknet.io/rfp/private-governance-delegation
- Private DAO treasury OS — https://strk20.starknet.io/rfp/private-dao-treasury-os

## Key pages

- Home — https://strk20.starknet.io/  (markdown: https://strk20.starknet.io/index.md)
- Build — https://strk20.starknet.io/build  (markdown: https://strk20.starknet.io/build.md)
- Use STRK20 — https://strk20.starknet.io/app/live-apps
- Request for Startups — https://strk20.starknet.io/rfp


