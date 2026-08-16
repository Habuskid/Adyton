import React, { useState } from 'react';
import { useVault } from '../../state/vaultContext';
import { AssetSymbol } from '../../types';
import { ProvenBadge } from '../common/ProvenBadge';
import { Chamber } from '../common/Chamber';

export const DepositShieldView: React.FC = () => {
  const { holdings, depositAsset, setActiveTab, connectedWallet, connectWallet } = useVault();
  const [selectedAsset, setSelectedAsset] = useState<AssetSymbol>('USDC');
  const [amount, setAmount] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [step, setStep] = useState<number>(1);
  const [txSuccess, setTxSuccess] = useState<{ hash: string } | null>(null);

  const activeHolding = holdings.find((h) => h.symbol === selectedAsset);
  const numAmount = parseFloat(amount) || 0;

  const handleDeposit = async () => {
    if (numAmount <= 0) return;
    setIsProcessing(true);
    setStep(2); // Step 2: FPI Screening Signature

    setTimeout(async () => {
      setStep(3); // Step 3: Minting Shielded Note in STRK20 Pool
      const res = await depositAsset(selectedAsset, numAmount);
      setIsProcessing(false);
      setTxSuccess({ hash: res.txHash });
    }, 1200);
  };

  return (
    <div style={{ flex: 1, padding: '32px 24px', maxWidth: '1000px' }}>
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
              Shield Assets into Vault
            </h1>
            <ProvenBadge label="FPI Screened" />
          </div>
          <p className="font-body-md" style={{ color: 'var(--text-muted)' }}>
            Convert public ERC-20 tokens into encrypted UTXO notes in the STRK20 privacy pool.
          </p>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>
        {/* Deposit Form Chamber */}
        <Chamber title="Deposit Parameters">
          {txSuccess ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{ marginBottom: '16px' }}>
                <ProvenBadge label="Shielding Proven & Settled" />
              </div>
              <h2 className="font-headline-md" style={{ color: 'var(--text-primary)', marginBottom: '12px' }}>
                {numAmount.toLocaleString()} {selectedAsset} Successfully Shielded
              </h2>
              <p className="font-body-md" style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>
                Your deposit was screened by FPI, approved, and minted as a private note in the STRK20 pool.
              </p>
              <div
                style={{
                  padding: '12px',
                  backgroundColor: 'var(--bg-chamber-lowest)',
                  border: '1px solid var(--line)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px',
                  color: 'var(--bronze)',
                  marginBottom: '24px',
                  wordBreak: 'break-all',
                }}
              >
                Tx: {txSuccess.hash}
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button className="btn-primary" onClick={() => setActiveTab('dashboard')}>
                  View Treasury Balance →
                </button>
                <button className="btn-secondary" onClick={() => { setTxSuccess(null); setAmount(''); }}>
                  Shield More Assets
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Asset Selector */}
              <div>
                <label className="font-label-caps" style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
                  Select ERC-20 Asset
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
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px' }}>
                          Avail: {h.publicAmount.toLocaleString()}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Amount Input Slot */}
              <div>
                <label className="font-label-caps" style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
                  Deposit Amount
                </label>
                <div className="input-slot">
                  <input
                    type="number"
                    className="slot-input"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    disabled={isProcessing}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                  <span className="font-data-md" style={{ color: 'var(--text-dim)' }}>
                    Est. Value: ${(numAmount * (activeHolding?.usdRate || 1)).toLocaleString()} USD
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                className="btn-primary"
                style={{ width: '100%', padding: '14px' }}
                onClick={handleDeposit}
                disabled={isProcessing || numAmount <= 0}
              >
                {isProcessing ? 'Screening & Shielding...' : `Shield ${numAmount > 0 ? numAmount.toLocaleString() : '0'} ${selectedAsset}`}
              </button>
            </div>
          )}
        </Chamber>

        {/* Verification Stepper Chamber */}
        <Chamber title="Onchain Protocol Verification">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Step 1 */}
            <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  border: step >= 1 ? '1px solid var(--bronze)' : '1px solid var(--line)',
                  background: step >= 1 ? 'rgba(166, 124, 82, 0.1)' : 'var(--bg-chamber-lowest)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  color: 'var(--bronze)',
                }}
              >
                1
              </div>
              <div>
                <div className="font-label-caps" style={{ color: 'var(--text-primary)' }}>
                  ERC-20 Allowance Approval
                </div>
                <div className="font-body-md" style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '2px' }}>
                  Approves STRK20 Privacy Pool contract to pull public ERC-20 tokens.
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  border: step >= 2 ? '1px solid var(--bronze)' : '1px solid var(--line)',
                  background: step >= 2 ? 'rgba(166, 124, 82, 0.1)' : 'var(--bg-chamber-lowest)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  color: step >= 2 ? 'var(--bronze)' : 'var(--text-dim)',
                }}
              >
                2
              </div>
              <div>
                <div className="font-label-caps" style={{ color: step >= 2 ? 'var(--text-primary)' : 'var(--text-dim)' }}>
                  Mandatory FPI Deposit Screening
                </div>
                <div className="font-body-md" style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '2px' }}>
                  FPI provider cryptographically screens origin address and produces onchain signature.
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  border: step >= 3 ? '1px solid var(--bronze)' : '1px solid var(--line)',
                  background: step >= 3 ? 'rgba(166, 124, 82, 0.1)' : 'var(--bg-chamber-lowest)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  color: step >= 3 ? 'var(--bronze)' : 'var(--text-dim)',
                }}
              >
                3
              </div>
              <div>
                <div className="font-label-caps" style={{ color: step >= 3 ? 'var(--text-primary)' : 'var(--text-dim)' }}>
                  Mint Encrypted UTXO Note
                </div>
                <div className="font-body-md" style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '2px' }}>
                  Pool contract executes <code>apply_actions</code>, creates self-channel note, and updates balance sheet.
                </div>
              </div>
            </div>
          </div>
        </Chamber>
      </div>
    </div>
  );
};
