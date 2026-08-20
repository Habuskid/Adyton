import React from 'react';
import { useVault } from '../../state/vaultContext';
import { ProvenBadge } from './ProvenBadge';
import { Chamber } from './Chamber';

export const AuthGuardView: React.FC = () => {
  const { connectWallet, setActiveTab } = useVault();

  return (
    <div style={{ flex: 1, padding: '48px 24px', maxWidth: '720px', margin: '0 auto', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <Chamber
        title="Institutional Access Control"
        badge={<ProvenBadge label="Starknet Auth Required" />}
      >
        <div style={{ textAlign: 'center', padding: '24px 12px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              margin: '0 auto 20px',
              borderRadius: '50%',
              background: 'rgba(166, 124, 82, 0.1)',
              border: '1px solid var(--bronze)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '28px', color: 'var(--bronze)' }}>
              lock
            </span>
          </div>

          <h2 className="font-headline-md" style={{ color: 'var(--text-primary)', marginBottom: '12px' }}>
            Confidential Vault Authentication
          </h2>

          <p className="font-body-md" style={{ color: 'var(--text-muted)', maxWidth: '520px', margin: '0 auto 28px', lineHeight: 1.6 }}>
            Treasury balances, note spending nullifiers, and spending policy contracts are cryptographically encrypted. Connect an authorized <strong>Argent X</strong> or <strong>Braavos</strong> wallet on <strong>Starknet Sepolia</strong> to decrypt and manage your vault.
          </p>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              maxWidth: '380px',
              margin: '0 auto',
            }}
          >
            <button
              className="btn-primary"
              style={{
                width: '100%',
                padding: '14px 20px',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
              onClick={connectWallet}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                account_balance_wallet
              </span>
              Connect Starknet Wallet
            </button>

            <button
              className="btn-ghost"
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '11px',
                color: 'var(--text-dim)',
              }}
              onClick={() => setActiveTab('landing')}
            >
              ← Return to Protocol Specs
            </button>
          </div>

          <div
            style={{
              marginTop: '32px',
              paddingTop: '20px',
              borderTop: '1px solid var(--line)',
              display: 'flex',
              justifyContent: 'space-around',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--text-dim)',
            }}
          >
            <div>
              <span style={{ color: 'var(--bronze)' }}>●</span> STARK Curve ECDSA
            </div>
            <div>
              <span style={{ color: 'var(--bronze)' }}>●</span> STRK20 Privacy Pool
            </div>
            <div>
              <span style={{ color: 'var(--bronze)' }}>●</span> Stwo ZK Verifier
            </div>
          </div>
        </div>
      </Chamber>
    </div>
  );
};
