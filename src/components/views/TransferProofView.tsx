import React, { useState } from 'react';
import { useVault } from '../../state/vaultContext';
import { AssetSymbol } from '../../types';
import { ProvenBadge } from '../common/ProvenBadge';
import { Chamber } from '../common/Chamber';

export const TransferProofView: React.FC = () => {
  const { holdings, policy, executeTransfer, setActiveTab } = useVault();
  const [selectedAsset, setSelectedAsset] = useState<AssetSymbol>('USDC');
  const [recipient, setRecipient] = useState<string>(
    policy.approvedRecipients[0]?.address || '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7'
  );
  const [amount, setAmount] = useState<string>('25000');
  const [isProving, setIsProving] = useState<boolean>(false);
  const [provingStep, setProvingStep] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [txSuccess, setTxSuccess] = useState<{ hash: string } | null>(null);

  const activeHolding = holdings.find((h) => h.symbol === selectedAsset);
  const numAmount = parseFloat(amount) || 0;
  const usdValue = numAmount * (activeHolding?.usdRate || 1);
  const isOverCap = usdValue > policy.maxTransactionCap;

  const handleTransfer = async () => {
    setErrorMsg(null);
    if (numAmount <= 0) {
      setErrorMsg('Transfer amount must be greater than zero.');
      return;
    }

    if (isOverCap) {
      setErrorMsg(
        `POLICY REJECTION: Transfer value ($${usdValue.toLocaleString()} USD) exceeds vault maximum spending cap ($${policy.maxTransactionCap.toLocaleString()} USD). Zero-knowledge range check circuit will fail.`
      );
      return;
    }

    setIsProving(true);
    setProvingStep('1/3: Discovering mature UTXO notes in directional channel...');

    setTimeout(() => {
      setProvingStep('2/3: Generating ZK policy predicate proof (amount ≤ cap)...');
    }, 800);

    setTimeout(async () => {
      setProvingStep('3/3: Submitting Stwo proof and nullifier to STRK20 pool...');
      const res = await executeTransfer(selectedAsset, numAmount, recipient);
      setIsProving(false);

      if (res.success && res.txHash) {
        setTxSuccess({ hash: res.txHash });
      } else {
        setErrorMsg(res.error || 'Transfer failed');
      }
    }, 1800);
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
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <h1 className="font-headline-lg" style={{ color: 'var(--text-primary)' }}>
              Shielded Transfer with Policy Proof
            </h1>
            <ProvenBadge label="ZK Predicate Enforced" />
          </div>
          <p className="font-body-md" style={{ color: 'var(--text-muted)' }}>
            Cryptographically proven transfer. Amounts and counterparties remain hidden inside the pool.
          </p>
        </div>
      </header>

      {txSuccess ? (
        <div className="chamber" style={{ padding: '40px 24px', textAlign: 'center', maxWidth: '680px', margin: '0 auto' }}>
          <div style={{ marginBottom: '16px' }}>
            <ProvenBadge label="ZK Policy Proof Verified" />
          </div>
          <h2 className="font-headline-md" style={{ color: 'var(--text-primary)', marginBottom: '12px' }}>
            Private Transfer Executed Successfully
          </h2>
          <p className="font-body-md" style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
            {numAmount.toLocaleString()} {selectedAsset} transferred via encrypted note spend. Spender, recipient, and amount
            are hidden onchain.
          </p>

          <div
            style={{
              padding: '16px',
              backgroundColor: 'var(--bg-chamber-lowest)',
              border: '1px solid var(--line)',
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              color: 'var(--bronze)',
              marginBottom: '24px',
              textAlign: 'left',
              wordBreak: 'break-all',
            }}
          >
            <div><strong>Transaction Hash:</strong> {txSuccess.hash}</div>
            <div style={{ marginTop: '8px', color: 'var(--text-muted)' }}>
              <strong>Proof Facts:</strong> VIRTUAL_SNOS_FACT_0x8f19, POLICY_PREDICATE_CAP_VALID
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button className="btn-primary" onClick={() => setActiveTab('dashboard')}>
              Back to Dashboard →
            </button>
            <button className="btn-secondary" onClick={() => setTxSuccess(null)}>
              Send Another Transfer
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>
          {/* Transfer Form Chamber */}
          <Chamber title="Transaction Parameters">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Asset Select */}
              <div>
                <label className="font-label-caps" style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
                  Shielded Asset
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  {holdings.map((h) => {
                    const isSelected = selectedAsset === h.symbol;
                    return (
                      <button
                        key={h.symbol}
                        type="button"
                        onClick={() => setSelectedAsset(h.symbol)}
                        style={{
                          background: isSelected ? 'rgba(166, 124, 82, 0.1)' : 'var(--bg-chamber-lowest)',
                          border: isSelected ? '1px solid var(--bronze)' : '1px solid var(--line)',
                          padding: '12px',
                          textAlign: 'left',
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {h.symbol}
                        </div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--bronze)', marginTop: '4px' }}>
                          {h.shieldedAmount.toLocaleString()} {h.symbol}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Recipient Address */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label className="font-label-caps" style={{ color: 'var(--text-muted)' }}>
                    Recipient Shielded Address
                  </label>
                  <select
                    style={{
                      background: 'var(--bg-chamber-lowest)',
                      border: '1px solid var(--line)',
                      color: 'var(--text-dim)',
                      fontSize: '10px',
                      fontFamily: 'var(--font-sans)',
                      padding: '2px 6px',
                    }}
                    onChange={(e) => setRecipient(e.target.value)}
                  >
                    <option value="">Choose Whitelisted...</option>
                    {policy.approvedRecipients.map((r) => (
                      <option key={r.address} value={r.address}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="input-slot">
                  <input
                    type="text"
                    className="slot-input"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="0x..."
                    disabled={isProving}
                  />
                </div>
              </div>

              {/* Transfer Amount */}
              <div>
                <label className="font-label-caps" style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
                  Transfer Nominal Amount
                </label>
                <div className="input-slot">
                  <input
                    type="number"
                    className="slot-input"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    disabled={isProving}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                  <span className="font-data-md" style={{ color: isOverCap ? 'var(--error-text)' : 'var(--text-dim)' }}>
                    USD Equivalent: ${usdValue.toLocaleString()} USD
                  </span>
                  <span className="font-data-md" style={{ color: 'var(--bronze)' }}>
                    Available: {activeHolding?.shieldedAmount.toLocaleString()} {selectedAsset}
                  </span>
                </div>
              </div>

              {/* Policy Feedback Alert */}
              <div
                style={{
                  padding: '12px 16px',
                  border: isOverCap ? '1px solid var(--error-text)' : '1px solid var(--bronze)',
                  backgroundColor: isOverCap ? 'rgba(178, 76, 76, 0.1)' : 'rgba(166, 124, 82, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ color: isOverCap ? 'var(--error-text)' : 'var(--bronze)', fontSize: '20px' }}
                >
                  {isOverCap ? 'gpp_bad' : 'verified'}
                </span>
                <div>
                  <div
                    style={{
                      fontFamily: 'var(--font-sans)',
                      fontSize: '11px',
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      color: isOverCap ? 'var(--error-text)' : 'var(--bronze)',
                      textTransform: 'uppercase',
                    }}
                  >
                    {isOverCap ? 'Policy Constraint Violated' : 'Policy Constraint Satisfied'}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {isOverCap
                      ? `Amount ($${usdValue.toLocaleString()}) exceeds max cap ($${policy.maxTransactionCap.toLocaleString()}). Proof cannot be generated.`
                      : `Amount ($${usdValue.toLocaleString()}) ≤ Max Cap ($${policy.maxTransactionCap.toLocaleString()}). ZK proof is provable.`}
                  </div>
                </div>
              </div>

              {errorMsg && (
                <div style={{ color: 'var(--error-text)', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
                  {errorMsg}
                </div>
              )}

              {/* Submit Button */}
              <button
                className="btn-primary"
                style={{ width: '100%', padding: '14px' }}
                onClick={handleTransfer}
                disabled={isProving || isOverCap}
              >
                {isProving ? 'Generating ZK Proof & Transferring...' : 'Execute Policy-Proven Transfer'}
              </button>
            </div>
          </Chamber>

          {/* Proving Engine Telemetry Chamber */}
          <Chamber title="ZK Policy Predicate Telemetry">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <div className="font-label-caps" style={{ color: 'var(--text-dim)', marginBottom: '4px' }}>
                  Prover Engine
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--text-primary)' }}>
                  Stwo Prover / Virtual SNOS OS
                </div>
              </div>

              <div>
                <div className="font-label-caps" style={{ color: 'var(--text-dim)', marginBottom: '4px' }}>
                  Policy Predicate Statement
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                    color: 'var(--bronze)',
                    background: 'var(--bg-chamber-lowest)',
                    border: '1px solid var(--line)',
                    padding: '8px',
                  }}
                >
                  assert(spent_amount &lt;= 0x{policy.maxTransactionCap.toString(16)})
                </div>
              </div>

              <div>
                <div className="font-label-caps" style={{ color: 'var(--text-dim)', marginBottom: '4px' }}>
                  UTXO Note Spending Mechanics
                </div>
                <p className="font-body-md" style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                  Consumes input note(s) whole $\to$ emits one-way nullifier $\to$ creates recipient note + self-change note.
                </p>
              </div>

              {isProving && (
                <div
                  style={{
                    marginTop: '12px',
                    padding: '12px',
                    border: '1px solid var(--bronze)',
                    background: 'rgba(166, 124, 82, 0.05)',
                  }}
                >
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--bronze)' }}>
                    {provingStep}
                  </div>
                </div>
              )}
            </div>
          </Chamber>
        </div>
      )}
    </div>
  );
};
