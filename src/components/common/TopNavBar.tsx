import React from 'react';
import { useVault } from '../../state/vaultContext';
import { ProvenBadge } from './ProvenBadge';
import { ActiveTab } from '../../types';

export const TopNavBar: React.FC = () => {
  const { activeTab, setActiveTab, connectedWallet, connectWallet } = useVault();

  const navLinks: { tab: ActiveTab; label: string }[] = [
    { tab: 'landing', label: 'Protocol' },
    { tab: 'dashboard', label: 'Treasury' },
    { tab: 'deposit', label: 'Shield Funds' },
    { tab: 'transfer', label: 'Transfer (ZK)' },
    { tab: 'policy', label: 'Policy Engine' },
    { tab: 'audit', label: 'Compliance' },
  ];

  return (
    <header
      style={{
        backgroundColor: 'var(--bg)',
        borderBottom: '1px solid var(--line)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        width: '100%',
      }}
    >
      <div
        style={{
          maxWidth: 'var(--max-width)',
          margin: '0 auto',
          padding: '0 24px',
          height: '64px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        {/* Brand */}
        <div
          onClick={() => setActiveTab('landing')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '20px',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              color: 'var(--text-primary)',
            }}
          >
            ADYTON
          </span>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              color: 'var(--bronze)',
              padding: '2px 6px',
              border: '1px solid var(--bronze)',
              letterSpacing: '0.05em',
            }}
          >
            STRK[20]
          </span>
        </div>

        {/* Navigation Tabs (Desktop) */}
        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            height: '100%',
          }}
          className="desktop-nav"
        >
          {navLinks.map(({ tab, label }) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  borderBottom: isActive ? '2px solid var(--bronze)' : '2px solid transparent',
                  color: isActive ? 'var(--bronze)' : 'var(--text-muted)',
                  fontFamily: 'var(--font-sans)',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  padding: '0 14px',
                  height: '64px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {label}
              </button>
            );
          })}
        </nav>

        {/* Right Section: Network & Wallet */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              border: '1px solid var(--line)',
              padding: '6px 12px',
              background: 'var(--bg-chamber-lowest)',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: 'var(--bronze)',
                boxShadow: '0 0 6px var(--bronze)',
              }}
            />
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: 'var(--text-muted)',
              }}
            >
              MAINNET POOL
            </span>
          </div>

          {connectedWallet ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                border: '1px solid var(--line)',
                background: 'var(--bg-chamber)',
                fontFamily: 'var(--font-mono)',
                fontSize: '12px',
                color: 'var(--text)',
              }}
            >
              <span className="proven-badge">P</span>
              <span>
                {connectedWallet.address.substring(0, 6)}...{connectedWallet.address.substring(62)}
              </span>
            </div>
          ) : (
            <button className="btn-primary" onClick={connectWallet}>
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
