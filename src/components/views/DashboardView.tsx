import React from 'react';
import { useVault } from '../../state/vaultContext';
import { ProvenBadge } from '../common/ProvenBadge';
import { Chamber } from '../common/Chamber';
import { TxHashLink } from '../common/TxHashLink';

export const DashboardView: React.FC = () => {
  const {
    vaultId,
    isBalanceRevealed,
    toggleBalanceReveal,
    holdings,
    transactions,
    policy,
    setActiveTab,
  } = useVault();

  const totalShieldedUsd = holdings.reduce((sum, h) => sum + h.shieldedAmount * h.usdRate, 0);
  const totalNotes = holdings.reduce((sum, h) => sum + h.notesCount, 0);

  return (
    <div style={{ flex: 1, padding: '32px 24px', maxWidth: '1200px' }}>
      {/* Header & Status */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          borderBottom: '1px solid var(--line)',
          paddingBottom: '24px',
          marginBottom: '32px',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <h1 className="font-headline-lg" style={{ color: 'var(--text-primary)' }}>
              {vaultId}
            </h1>
            <ProvenBadge label="Confidential Status: Proven" />
          </div>
          <p className="font-body-md" style={{ color: 'var(--text-muted)' }}>
            Confidential Treasury Vault governed on Starknet. Note-based encrypted UTXO assets in STRK20.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button className="btn-secondary" onClick={toggleBalanceReveal}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
              {isBalanceRevealed ? 'visibility_off' : 'visibility'}
            </span>
            {isBalanceRevealed ? 'Mask Balances' : 'Reveal Viewing Key'}
          </button>
          <button className="btn-primary" onClick={() => setActiveTab('transfer')}>
            Initiate Transfer
          </button>
        </div>
      </header>

      {/* Top Metrics Chambers */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
          marginBottom: '32px',
        }}
      >
        {/* Total Shielded Holdings */}
        <div className="chamber" style={{ padding: '24px' }}>
          <div className="font-label-caps" style={{ color: 'var(--text-muted)', marginBottom: '8px' }}>
            Total Shielded Treasury (USD)
          </div>
          <div
            className={`font-data-lg ${isBalanceRevealed ? 'revealed' : 'obscured-text'}`}
            style={{ fontSize: '32px', color: 'var(--bronze)', fontWeight: 700, margin: '8px 0' }}
          >
            ${totalShieldedUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
            <span className="font-data-md" style={{ color: 'var(--text-dim)' }}>
              Active UTXO Notes: {totalNotes}
            </span>
            <span className="font-data-md" style={{ color: 'var(--bronze)' }}>
              100% Encrypted
            </span>
          </div>
        </div>

        {/* Active Policy Rules */}
        <div className="chamber" style={{ padding: '24px' }}>
          <div className="font-label-caps" style={{ color: 'var(--text-muted)', marginBottom: '8px' }}>
            Active Spending Policy Cap
          </div>
          <div
            className="font-data-lg"
            style={{ fontSize: '32px', color: 'var(--text-primary)', fontWeight: 700, margin: '8px 0' }}
          >
            ${policy.maxTransactionCap.toLocaleString()}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
            <span className="font-data-md" style={{ color: 'var(--text-dim)' }}>
              Per-Transfer Max Limit
            </span>
            <span className="font-data-md" style={{ color: 'var(--bronze)' }}>
              {policy.approvedRecipients.length} Whitelisted
            </span>
          </div>
        </div>

        {/* Auditor Escrow Status */}
        <div className="chamber" style={{ padding: '24px' }}>
          <div className="font-label-caps" style={{ color: 'var(--text-muted)', marginBottom: '8px' }}>
            Auditor Escrow & Disclosure
          </div>
          <div
            className="font-data-lg"
            style={{ fontSize: '20px', color: 'var(--text-primary)', fontWeight: 700, margin: '14px 0 10px' }}
          >
            Auditor Escrow
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
            <span className="font-data-md" style={{ color: 'var(--text-dim)' }}>
              STARK Curve ECDH
            </span>
            <span
              className="font-label-caps"
              style={{ color: 'var(--bronze)', cursor: 'pointer' }}
              onClick={() => setActiveTab('audit')}
            >
              Manage Keys →
            </span>
          </div>
        </div>
      </div>

      {/* Asset Holdings Chamber */}
      <Chamber
        title="Shielded Asset Holdings"
        badge={<ProvenBadge label="Encrypted Notes" glow={false} />}
        action={
          <button className="btn-secondary" style={{ padding: '6px 12px' }} onClick={() => setActiveTab('deposit')}>
            + Shield Asset
          </button>
        }
        noPadding
      >
        <table className="chamber-table">
          <thead>
            <tr>
              <th>Asset</th>
              <th>Shielded Balance</th>
              <th>USD Value</th>
              <th>UTXO Notes</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {holdings.map((asset) => {
              const usdVal = asset.shieldedAmount * asset.usdRate;
              return (
                <tr key={asset.symbol}>
                  <td style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span
                      style={{
                        width: '24px',
                        height: '24px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid var(--line)',
                        background: 'var(--bg-chamber-lowest)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '11px',
                        color: 'var(--bronze)',
                      }}
                    >
                      {asset.symbol[0]}
                    </span>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{asset.symbol}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{asset.name}</div>
                    </div>
                  </td>
                  <td className={isBalanceRevealed ? 'revealed' : 'obscured-text'}>
                    <span style={{ color: 'var(--bronze)', fontWeight: 600 }}>
                      {asset.shieldedAmount.toLocaleString()} {asset.symbol}
                    </span>
                  </td>
                  <td className={isBalanceRevealed ? 'revealed' : 'obscured-text'}>
                    ${usdVal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td>
                    <span style={{ padding: '2px 6px', background: 'var(--bg-chamber-lowest)', border: '1px solid var(--line)' }}>
                      {asset.notesCount} notes
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn-ghost"
                      style={{ padding: '4px 8px', fontSize: '11px', color: 'var(--bronze)' }}
                      onClick={() => setActiveTab('transfer')}
                    >
                      Transfer →
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Chamber>

      {/* Transaction History Chamber */}
      <Chamber
        title="Vault Execution History & Proof Logs"
        badge={<ProvenBadge label="ZK Verified" />}
        noPadding
      >
        {transactions.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-dim)' }}>
            No transactions recorded yet. Shield assets or initiate a transfer to begin.
          </div>
        ) : (
          <table className="chamber-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Asset / Amount</th>
                <th>Counterparty</th>
                <th>Timestamp</th>
                <th>Policy Check</th>
                <th>Tx Hash (Voyager)</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id}>
                  <td>
                    <span
                      style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: '10px',
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        padding: '3px 6px',
                        background: 'var(--bg-chamber-lowest)',
                        border: '1px solid var(--line)',
                        color: tx.type === 'DEPOSIT_SHIELD' ? 'var(--bronze)' : 'var(--text-primary)',
                      }}
                    >
                      {tx.type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className={isBalanceRevealed ? 'revealed' : 'obscured-text'}>
                    {tx.amount > 0 ? `${tx.amount.toLocaleString()} ${tx.asset}` : '—'}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>
                    {tx.recipientOrDepositor.length > 20
                      ? `${tx.recipientOrDepositor.substring(0, 10)}...${tx.recipientOrDepositor.substring(tx.recipientOrDepositor.length - 8)}`
                      : tx.recipientOrDepositor}
                  </td>
                  <td style={{ color: 'var(--text-dim)' }}>{tx.timestamp}</td>
                  <td>
                    <span style={{ color: 'var(--bronze)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <span className="proven-badge">P</span>
                      <span style={{ fontSize: '11px' }}>Policy Compliant</span>
                    </span>
                  </td>
                  <td>
                    <TxHashLink hash={tx.txHash} isProofSignature={tx.type === 'PRIVATE_TRANSFER'} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Chamber>
    </div>
  );
};
