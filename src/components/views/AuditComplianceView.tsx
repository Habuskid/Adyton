import React, { useState } from 'react';
import { useVault } from '../../state/vaultContext';
import { ProvenBadge } from '../common/ProvenBadge';
import { Chamber } from '../common/Chamber';
import { TxHashLink } from '../common/TxHashLink';

export const AuditComplianceView: React.FC = () => {
  const { auditors, grantAuditorAccess, revokeAuditorAccess, transactions } = useVault();
  const [newLabel, setNewLabel] = useState<string>('');
  const [newAddress, setNewAddress] = useState<string>('');
  const [newPubKey, setNewPubKey] = useState<string>('');
  const [showGrantModal, setShowGrantModal] = useState<boolean>(false);

  const handleGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel || !newAddress) return;
    await grantAuditorAccess(newLabel, newAddress, newPubKey);
    setNewLabel('');
    setNewAddress('');
    setNewPubKey('');
    setShowGrantModal(false);
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
              Compliance & Auditor Disclosure
            </h1>
            <ProvenBadge label="Selective Disclosure" />
          </div>
          <p className="font-body-md" style={{ color: 'var(--text-muted)' }}>
            Cryptographically unmask transaction history to designated auditors without public exposure.
          </p>
        </div>

        <button className="btn-primary" onClick={() => setShowGrantModal(true)}>
          + Grant Auditor Access
        </button>
      </header>

      {/* Auditor Viewing Key Management Chamber */}
      <Chamber title="Registered Auditor Viewing Keys" badge={<ProvenBadge label="STARK ECDH Escrow" glow={false} />} noPadding>
        {auditors.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-dim)' }}>
            No registered auditor keys yet. Click "+ Grant Auditor Access" to escrow decryption keys to an auditor node.
          </div>
        ) : (
          <table className="chamber-table">
            <thead>
              <tr>
                <th>Auditor Entity</th>
                <th>Starknet Address</th>
                <th>Public Key (K = k·G)</th>
                <th>Granted Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {auditors.map((aud) => (
                <tr key={aud.id}>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{aud.label}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>
                    {aud.starknetAddress.length > 20
                      ? `${aud.starknetAddress.substring(0, 10)}...${aud.starknetAddress.substring(aud.starknetAddress.length - 8)}`
                      : aud.starknetAddress}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--bronze)' }}>
                    {aud.publicKey.substring(0, 12)}...
                  </td>
                  <td style={{ color: 'var(--text-dim)' }}>{aud.grantedAt}</td>
                  <td>
                    <span
                      style={{
                        fontFamily: 'var(--font-sans)',
                        fontSize: '10px',
                        fontWeight: 700,
                        color: 'var(--bronze)',
                        padding: '2px 6px',
                        border: '1px solid var(--bronze)',
                      }}
                    >
                      ACTIVE ESCROW
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn-ghost"
                      style={{ padding: '4px 8px', color: 'var(--error-text)' }}
                      onClick={() => revokeAuditorAccess(aud.id)}
                    >
                      Revoke
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Chamber>

      {/* Unmasked Auditor View Chamber */}
      <Chamber
        title="Decrypted Audit Ledger (Auditor Perspective)"
        badge={<ProvenBadge label="Viewing Key Active" />}
        noPadding
      >
        <div style={{ padding: '16px 20px', background: 'var(--bg-chamber-lowest)', borderBottom: '1px solid var(--line)' }}>
          <span className="font-body-md" style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
            Viewing as authorized compliance node. All UTXO notes, counterparty identities, and FPI screening proofs are unmasked.
          </span>
        </div>

        {transactions.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-dim)' }}>
            No transactions in ledger yet.
          </div>
        ) : (
          <table className="chamber-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Action Type</th>
                <th>Asset & Decrypted Amount</th>
                <th>Counterparty Address</th>
                <th>Policy Range Check</th>
                <th>FPI Compliance</th>
                <th>Tx Hash (Voyager)</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id}>
                  <td style={{ color: 'var(--text-dim)' }}>{tx.timestamp}</td>
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
                        color: 'var(--bronze)',
                      }}
                    >
                      {tx.type}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                    {tx.amount > 0 ? `${tx.amount.toLocaleString()} ${tx.asset}` : 'Policy Reconfiguration'}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>
                    {tx.recipientOrDepositor.length > 20
                      ? `${tx.recipientOrDepositor.substring(0, 8)}...${tx.recipientOrDepositor.substring(tx.recipientOrDepositor.length - 6)}`
                      : tx.recipientOrDepositor}
                  </td>
                  <td>
                    <span style={{ color: 'var(--bronze)', fontSize: '12px' }}>✓ Range-Checked</span>
                  </td>
                  <td>
                    <span style={{ color: 'var(--text-dim)', fontSize: '11px' }}>
                      {tx.screeningSignature ? 'FPI SCREENED (0x992b...)' : 'Internal ZK'}
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

      {/* Grant Access Modal */}
      {showGrantModal && (
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
              maxWidth: '520px',
              padding: '28px',
            }}
          >
            <h2 className="font-headline-md" style={{ color: 'var(--text-primary)', marginBottom: '12px' }}>
              Grant Auditor Viewing Key Access
            </h2>
            <p className="font-body-md" style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '20px' }}>
              Encrypts vault private viewing key $k$ to the auditor's STARK public key $K$. The auditor will receive
              decryption authority for all historical transactions.
            </p>

            <form onSubmit={handleGrant} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label className="font-label-caps" style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
                  Auditor Organization / Entity Label
                </label>
                <div className="input-slot">
                  <input
                    type="text"
                    className="slot-input"
                    placeholder="e.g. PwC Digital Assets Node B"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-label-caps" style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
                  Auditor Starknet Account Address
                </label>
                <div className="input-slot">
                  <input
                    type="text"
                    className="slot-input"
                    placeholder="0x049d..."
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-label-caps" style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
                  Auditor STARK Curve Public Viewing Key
                </label>
                <div className="input-slot">
                  <input
                    type="text"
                    className="slot-input"
                    placeholder="0x068f..."
                    value={newPubKey}
                    onChange={(e) => setNewPubKey(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowGrantModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Encrypt & Escrow Key
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
