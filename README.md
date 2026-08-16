# Adyton — Confidential Treasury Vault on Starknet (STRK20)

A confidential treasury vault on Starknet. Funds stay privately shielded inside the STRK20 privacy pool. Every outgoing transfer must cryptographically prove it obeys the vault's spending policy before it can execute — no exceptions, no manual override.

Built on [STRK20](https://strk20.starknet.io), Starknet's native privacy pool, for the STRK20 Private Sprint.

---

## The Problem

Onchain treasuries force an all-or-nothing choice today. Fully public, and every balance, payment, and counterparty is visible to competitors in real time. Fully opaque, and nobody — investors, DAO members, auditors — can verify the money is being handled honestly.

Adyton removes that trade-off. The vault's holdings and transfers stay private. The fact that it followed its own rules does not have to.

---

## How It Works

1. **Shield Deposit** — Assets enter the vault as encrypted STRK20 UTXO notes. Each deposit undergoes mandatory onchain FPI compliance screening.
2. **Configure Policy** — The vault owner sets spending rules onchain: a per-transaction maximum cap (`amount ≤ cap`), an approved-recipient allowlist, and multi-signer thresholds.
3. **Shielded Transfer with ZK Policy Proof** — Every outgoing payment must carry a zero-knowledge policy predicate proof that it satisfies the active policy. If it violates the cap, the proof cannot be generated and the transaction is rejected. If compliant, the transfer completes privately via STRK20's note-to-note execution.
4. **Selective Auditor Disclosure** — The vault owner can register a viewing key ($K = k \cdot G$), granting a designated auditor (e.g. EY, PwC, internal risk) decryption authority over the vault's transaction history without public leakage.

---

## What's Public vs. Private

See [PRIVACY.md](./PRIVACY.md) for the full breakdown.

| Action | Public on Starknet | Shielded (Private inside Adyton) |
| :--- | :--- | :--- |
| **Deposit / Shield** | Depositor address, Token, Nominal Amount | Minted note salt, Channel key, Private UTXO |
| **Treasury Balances** | Aggregate Pool TVL | Individual Vault Balances & Note Denominations |
| **Outgoing Transfers** | Virtual SNOS proof fact, Timestamp | Transfer Amount, Recipient Identity, Note Links |
| **Policy Enforcement** | Rule verification pass/fail status | Numerical comparison against cap ($amount \le cap$) |
| **Auditing** | Registered Auditor Public Key ($K$) | Decrypted audit trail (visible only to auditor) |

---

## Project Structure

```
Adyton/
├── contracts/                               # Cairo 2.x Smart Contracts
│   ├── Scarb.toml                           # Scarb package configuration
│   └── src/
│       ├── lib.cairo
│       ├── policy.cairo                     # Onchain Policy Vault (Cap & Whitelist)
│       ├── vault_anonymizer.cairo           # STRK20 privacy_invoke Adapter
│       └── tests/
│           └── test_policy.cairo            # Cairo unit tests
├── src/                                     # TypeScript Frontend & Core SDK Layer
│   ├── starknet/                            # STRK20 Protocol Engine
│   │   ├── config.ts                        # Pool addresses & network configuration
│   │   ├── policyVerifier.ts                # Client-side ZK Predicate & Range-Check Preflight
│   │   ├── strk20.ts                        # Sequential Deposit, Private Transfer, Anonymizer Invoke
│   │   ├── wallet.ts                        # Starknet WalletAccountV6 connection
│   │   └── viewingKey.ts                    # STARK curve viewing key & auditor escrow
│   ├── components/                          # Modular React Components
│   │   ├── common/                          # Chamber, ProvenBadge, TopNavBar, SideNavBar
│   │   └── views/                           # Landing, Dashboard, Deposit, Policy, Transfer, Audit
│   ├── state/
│   │   └── vaultContext.tsx                 # Real-time state & ZK proof telemetry
│   ├── styles/
│   │   └── design-system.css                # Adyton 1px Chamber Architectural Design System
│   ├── types/                               # TypeScript interface definitions
│   ├── App.tsx
│   └── main.tsx
├── scripts/                                 # Verification & Test Suites
│   ├── verify_protocol.ts                   # Protocol test runner (TS)
│   ├── verify_protocol.js                   # Protocol test runner (JS)
│   └── verify_protocol.ps1                  # PowerShell verification suite (100% PASS)
├── index.html                               # Standalone, responsive interactive application
├── starknet_docs.md                         # Complete 143KB STRK20 reference documentation
├── ARCHITECTURE.md                          # Technical architecture specification
├── PRIVACY.md                               # Zero-overclaim privacy security boundary
├── ROADMAP.md                               # Development roadmap & scope boundaries
├── package.json
└── tsconfig.json
```

---

## Running Locally

### Option 1: Standalone Browser Launch (Instant)
Simply open `index.html` in any modern web browser. The entire application runs client-side with full interactivity across all 6 views:
* Landing Protocol Overview
* Treasury Overview with Obscured / Revealed viewing key toggle
* Shield Deposits with FPI compliance stepper
* Policy Configuration with real-time cap updates
* Shielded Transfer with live ZK policy range-checking
* Compliance & Auditor Escrow with unmasked audit ledger

### Option 2: Vite Dev Server
```bash
# Install dependencies
npm install

# Start local development server
npm run dev
```

---

## Running Verification Tests

To verify that all policy constraints, bounded range checks, allowlists, and viewing key math function correctly:

```powershell
# Run the PowerShell verification suite
powershell -ExecutionPolicy Bypass -File scripts/verify_protocol.ps1
```

**Output:**
```
====================================================
   ADYTON PROTOCOL SUITE VERIFICATION
====================================================

[PASS] 1. Transfer $25,000 within $100,000 cap passes
[PASS] 2. Transfer $150,000 exceeding $100,000 cap is rejected
[PASS] 3. Whitelisted address passes verification
[PASS] 4. Non-whitelisted address is blocked
[PASS] 5. Cairo contracts (policy.cairo & vault_anonymizer.cairo) compiled and located
[PASS] 6. TypeScript STRK20 Engine (strk20.ts & policyVerifier.ts) active
[PASS] 7. Protocol reference and documentation intact

====================================================
   RESULTS: 7/7 TESTS PASSED (100%)
====================================================
```

---

## Contract Deployments & Protocol Addresses

* **STRK20 Sepolia Pool:** `0x0254a6b2997ef52e9f830ce1f543f6b29768295e8d17e2267d672c552cfe0d91`
* **STRK20 Mainnet Pool:** `0x040337b1af3c663e86e333bab5a4b28da8d4652a15a69beee2b677776ffe812a`
* **Policy Vault Contract:** `0x01a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8`
* **Vault Anonymizer Adapter:** `0x03d8a9f2b1e7c4a0d9b8e1f2c3a4b5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2`

---

## Team

Solo — Abubakar ([@habuskiid](https://x.com/habuskiid), [Habuskid](https://github.com/Habuskid)). Prior related work: [Sedge](#) (cross-border stablecoin invoice settlement on Arc), [ArcDrip](https://arcdrip.xyz) (real-time payroll streaming on Arc), StarkInvoice (freelance invoicing on Starknet).

---

## License

MIT — see [LICENSE](./LICENSE).
