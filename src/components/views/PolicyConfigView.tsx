import React, { useState } from 'react';
import { useVault } from '../../state/vaultContext';
import { ProvenBadge } from '../common/ProvenBadge';
import { Chamber } from '../common/Chamber';

export const PolicyConfigView: React.FC = () => {
  const { policy, updatePolicy, addApprovedRecipient, removeApprovedRecipient } = useVault();
  const [maxCap, setMaxCap] = useState<string>(policy.maxTransactionCap.toString());
  const [dailyLimit, setDailyLimit] = useState<string>(policy.dailyOutflowLimit.toString());
  const [newRecipientAddr, setNewRecipientAddr] = useState<string>('');
  const [newRecipientLabel, setNewRecipientLabel] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const handleSavePolicy = async () => {
    setIsSaving(true);
    await updatePolicy(parseFloat(maxCap) || 0, parseFloat(dailyLimit) || 0);
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleAddRecipient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecipientAddr) return;
    addApprovedRecipient(newRecipientAddr, newRecipientLabel);
    setNewRecipientAddr('');
    setNewRecipientLabel('');
    setShowAddModal(false);
  };

  return (
    <div style={{ flex: 1, padding: '32px 24px', maxWidth: '1100px' }}>
      <header
        style={{
          borderBottom: '1px solid var(--line)',
          paddingBottom: '24px',
          marginBottom: '32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <h1 className="font-headline-lg" style={{ color: 'var(--text-primary)' }}>
              Spending Policy Configuration
            </h1>
            <ProvenBadge label="Cairo Contract Rule" />
          </div>
          <p className="font-body-md" style={{ color: 'var(--text-muted)' }}>
            Configure the mathematical constraints enforced by zero-knowledge policy predicate proofs.
          </p>
        </div>

        <button className="btn-primary" onClick={handleSavePolicy} disabled={isSaving}>
          {isSaving ? 'Submitting Governance Proof...' : saveSuccess ? '✓ Rules Synchronized' : 'Save Policy Parameters'}
        </button>
      </header>

      {/* Policy Parameters Form */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px', marginBottom: '32px' }}>
        {/* Caps Chamber */}
        <Chamber title="Transaction Threshold Constraints">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Max Transaction Cap */}
            <div>
              <label className="font-label-caps" style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
                Max Single Transaction Cap (USD Equivalent)
              </label>
              <div className="input-slot">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="font-data-lg" style={{ color: 'var(--bronze)' }}>
                    $
                  </span>
                  <input
                    type="number"
                    className="slot-input"
                    value={maxCap}
                    onChange={(e) => setMaxCap(e.target.value)}
                  />
                </div>
              </div>
              <p className="font-body-md" style={{ color: 'var(--text-dim)', fontSize: '12px', marginTop: '6px' }}>
                Any outgoing transfer exceeding this threshold will fail client-side and onchain ZK range-check verification.
              </p>
            </div>

            {/* Daily Outflow Limit */}
            <div>
              <label className="font-label-caps" style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
                Daily Rolling Outflow Limit (USD Equivalent)
              </label>
              <div className="input-slot">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="font-data-lg" style={{ color: 'var(--bronze)' }}>
                    $
                  </span>
                  <input
                    type="number"
                    className="slot-input"
                    value={dailyLimit}
                    onChange={(e) => setDailyLimit(e.target.value)}
                  />
                </div>
              </div>
              <p className="font-body-md" style={{ color: 'var(--text-dim)', fontSize: '12px', marginTop: '6px' }}>
                Aggregate rolling 24-hour ceiling across all private UTXO spend notes.
              </p>
            </div>
          </div>
        </Chamber>

        {/* Governance & Multi-sig Chamber */}
        <Chamber title="Governance & Policy Contract">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <div className="font-label-caps" style={{ color: 'var(--text-dim)', marginBottom: '4px' }}>
                Cairo Policy Contract Address
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  color: 'var(--text-primary)',
                  padding: '8px',
                  background: 'var(--bg-chamber-lowest)',
                  border: '1px solid var(--line)',
                  wordBreak: 'break-all',
                }}
              >
                {policy.policyContractAddress}
              </div>
            </div>

            <div>
              <div className="font-label-caps" style={{ color: 'var(--text-dim)', marginBottom: '4px' }}>
                Multi-Signer Governance Threshold
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--bronze)' }}>
                {policy.multiSignerThreshold.required} of {policy.multiSignerThreshold.total} Approvals Required
              </div>
            </div>

            <div>
              <div className="font-label-caps" style={{ color: 'var(--text-dim)', marginBottom: '4px' }}>
                Last Onchain Policy Update
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--text-muted)' }}>
                {policy.lastUpdated}
              </div>
            </div>
          </div>
        </Chamber>
      </div>

      {/* Approved Recipient Whitelist Chamber */}
      <Chamber
        title="Approved Recipient Allowlist"
        badge={<ProvenBadge label="Enforced Whitelist" glow={false} />}
        action={
          <button className="btn-secondary" style={{ padding: '6px 12px' }} onClick={() => setShowAddModal(true)}>
            + Add Whitelist Address
          </button>
        }
        noPadding
      >
        <table className="chamber-table">
          <thead>
            <tr>
              <th>Entity / Node Label</th>
              <th>Starknet Shielded Address</th>
              <th>Date Added</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {policy.approvedRecipients.map((rec) => (
              <tr key={rec.address}>
                <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{rec.label}</td>
                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--bronze)' }}>
                  {rec.address}
                </td>
                <td style={{ color: 'var(--text-dim)' }}>{rec.addedAt}</td>
                <td>
                  <button
                    className="btn-ghost"
                    style={{ padding: '4px 8px', color: 'var(--error-text)' }}
                    onClick={() => removeApprovedRecipient(rec.address)}
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Chamber>

      {/* Add Recipient Modal */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '24px',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--bg-chamber)',
              border: '1px solid var(--line)',
              width: '100%',
              maxWidth: '500px',
              padding: '28px',
            }}
          >
            <h2 className="font-headline-md" style={{ color: 'var(--text-primary)', marginBottom: '16px' }}>
              Add Approved Whitelist Recipient
            </h2>
            <form onSubmit={handleAddRecipient} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label className="font-label-caps" style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
                  Entity / Node Label
                </label>
                <div className="input-slot">
                  <input
                    type="text"
                    className="slot-input"
                    placeholder="e.g. Core Operations Vault"
                    value={newRecipientLabel}
                    onChange={(e) => setNewRecipientLabel(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-label-caps" style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
                  Starknet Recipient Address
                </label>
                <div className="input-slot">
                  <input
                    type="text"
                    className="slot-input"
                    placeholder="0x049d..."
                    value={newRecipientAddr}
                    onChange={(e) => setNewRecipientAddr(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Confirm Whitelist Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
