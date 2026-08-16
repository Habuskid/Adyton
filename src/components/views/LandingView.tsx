import React from 'react';
import { useVault } from '../../state/vaultContext';
import { ProvenBadge } from '../common/ProvenBadge';

export const LandingView: React.FC = () => {
  const { setActiveTab } = useVault();

  return (
    <div style={{ maxWidth: 'var(--max-width)', margin: '0 auto', padding: '48px 24px' }}>
      {/* Hero Section */}
      <section style={{ textAlign: 'center', padding: '48px 0 80px', borderBottom: '1px solid var(--line)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px' }}>
          <img
            src="/logo.png"
            alt="Adyton Logo"
            style={{ width: '84px', height: '84px', objectFit: 'contain', marginBottom: '20px' }}
          />
          <ProvenBadge label="Starknet STRK20 Native Privacy" />
        </div>

        <h1
          className="font-headline-lg"
          style={{
            fontSize: 'clamp(36px, 6vw, 64px)',
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: '-0.03em',
            textTransform: 'uppercase',
            color: 'var(--text-primary)',
            maxWidth: '900px',
            margin: '0 auto 24px',
          }}
        >
          Confidential Treasury Vaults with Cryptographic Policy Enforcement
        </h1>

        <p
          className="font-body-lg"
          style={{
            maxWidth: '680px',
            margin: '0 auto 40px',
            color: 'var(--text-muted)',
            fontSize: '17px',
            lineHeight: 1.6,
          }}
        >
          Funds remain privately shielded inside the STRK20 privacy pool. Outgoing transfers must cryptographically prove
          they obey the vault’s onchain spending policy before they execute.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <button className="btn-primary" style={{ padding: '14px 28px', fontSize: '12px' }} onClick={() => setActiveTab('dashboard')}>
            Launch Vault Terminal →
          </button>
          <button className="btn-secondary" style={{ padding: '14px 28px', fontSize: '12px' }} onClick={() => setActiveTab('policy')}>
            Inspect Policy Engine
          </button>
        </div>
      </section>

      {/* 4-Step Chamber Grid */}
      <section style={{ padding: '64px 0', borderBottom: '1px solid var(--line)' }}>
        <div style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div className="font-label-caps" style={{ color: 'var(--bronze)', marginBottom: '8px' }}>
              Vault Architecture
            </div>
            <h2 className="font-headline-md" style={{ color: 'var(--text-primary)' }}>
              The 4-Step Confidential Vault Lifecycle
            </h2>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-dim)' }}>
            SPEC: STRK20_V2_POOL
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '24px',
          }}
        >
          {/* Card 1 */}
          <div
            style={{
              backgroundColor: 'var(--bg-chamber)',
              border: '1px solid var(--line)',
              padding: '24px',
              position: 'relative',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '32px',
                fontWeight: 700,
                color: 'var(--bronze-glow-strong)',
                marginBottom: '16px',
              }}
            >
              01
            </div>
            <h3 className="font-label-caps" style={{ color: 'var(--text-primary)', marginBottom: '12px' }}>
              Shield Deposit
            </h3>
            <p className="font-body-md" style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
              ERC-20 tokens enter the vault as encrypted UTXO notes in the STRK20 privacy pool. Verified by onchain FPI screening.
            </p>
          </div>

          {/* Card 2 */}
          <div
            style={{
              backgroundColor: 'var(--bg-chamber)',
              border: '1px solid var(--line)',
              padding: '24px',
              position: 'relative',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '32px',
                fontWeight: 700,
                color: 'var(--bronze-glow-strong)',
                marginBottom: '16px',
              }}
            >
              02
            </div>
            <h3 className="font-label-caps" style={{ color: 'var(--text-primary)', marginBottom: '12px' }}>
              Policy Rules
            </h3>
            <p className="font-body-md" style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
              Vault governors set spending caps and allowlists onchain in a Cairo contract. Rules are immutable without multi-sig consensus.
            </p>
          </div>

          {/* Card 3 */}
          <div
            style={{
              backgroundColor: 'var(--bg-chamber)',
              border: '1px solid var(--line)',
              padding: '24px',
              position: 'relative',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '32px',
                fontWeight: 700,
                color: 'var(--bronze-glow-strong)',
                marginBottom: '16px',
              }}
            >
              03
            </div>
            <h3 className="font-label-caps" style={{ color: 'var(--text-primary)', marginBottom: '12px' }}>
              ZK Transfer Proof
            </h3>
            <p className="font-body-md" style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
              Every outgoing payment generates a zero-knowledge policy predicate proof (amount ≤ cap) and spends notes privately.
            </p>
          </div>

          {/* Card 4 */}
          <div
            style={{
              backgroundColor: 'var(--bg-chamber)',
              border: '1px solid var(--line)',
              padding: '24px',
              position: 'relative',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '32px',
                fontWeight: 700,
                color: 'var(--bronze-glow-strong)',
                marginBottom: '16px',
              }}
            >
              04
            </div>
            <h3 className="font-label-caps" style={{ color: 'var(--text-primary)', marginBottom: '12px' }}>
              Selective Audit
            </h3>
            <p className="font-body-md" style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
              The vault grants an encrypted viewing key to designated auditors (e.g. EY, internal risk). Full compliance without public leakage.
            </p>
          </div>
        </div>
      </section>

      {/* Honest Privacy Matrix */}
      <section style={{ padding: '64px 0' }}>
        <div className="chamber" style={{ padding: '0' }}>
          <div className="chamber-header">
            <span className="font-label-caps" style={{ color: 'var(--text-primary)' }}>
              Public vs. Private Security Boundary
            </span>
            <span className="font-data-md" style={{ color: 'var(--bronze)' }}>
              ZERO-OVERCLAIM GUARANTEE
            </span>
          </div>

          <table className="chamber-table">
            <thead>
              <tr>
                <th>Protocol Action</th>
                <th>Public State</th>
                <th>Shielded State (Adyton Vault)</th>
                <th>Auditability</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Deposit / Shield</td>
                <td>Depositor address, Token, Nominal Amount</td>
                <td>Minted note salt, Channel key</td>
                <td>FPI Screening Signature Verified</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Treasury Holdings</td>
                <td>Total pool TVL (aggregate)</td>
                <td>Vault balances, Note denominations</td>
                <td>Unmasked via Auditor Viewing Key</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Outgoing Payment</td>
                <td>Execution fact, Block timestamp</td>
                <td>Transfer amount, Recipient address, UTXO links</td>
                <td>ZK Policy Predicate Proven</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Policy Enforcement</td>
                <td>Rule validation pass/fail fact</td>
                <td>Numerical amount compared against cap</td>
                <td>Mathematical ZK Constraint</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
