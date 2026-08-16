import React from 'react';
import { useVault } from '../../state/vaultContext';
import { ProvenBadge } from './ProvenBadge';
import { ActiveTab } from '../../types';

export const SideNavBar: React.FC = () => {
  const { vaultId, isProven, activeTab, setActiveTab } = useVault();

  const menuItems: { tab: ActiveTab; label: string; icon: string }[] = [
    { tab: 'dashboard', label: 'Treasury Overview', icon: 'grid_view' },
    { tab: 'deposit', label: 'Shield Deposits', icon: 'shield' },
    { tab: 'transfer', label: 'Shielded Transfers', icon: 'send' },
    { tab: 'policy', label: 'Policy Engine', icon: 'tune' },
    { tab: 'audit', label: 'Auditor Disclosure', icon: 'verified_user' },
  ];

  return (
    <aside
      style={{
        width: '260px',
        backgroundColor: 'var(--bg-chamber-lowest)',
        borderRight: '1px solid var(--line)',
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 64px)',
        position: 'sticky',
        top: '64px',
        flexShrink: 0,
      }}
      className="hidden-mobile"
    >
      {/* Vault Profile */}
      <div style={{ padding: '24px', borderBottom: '1px solid var(--line)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              backgroundColor: 'var(--bg-chamber)',
              border: '1px solid var(--line)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--bronze)',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              account_balance
            </span>
          </div>
          <div>
            <div
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '0.1em',
                color: 'var(--text-primary)',
              }}
            >
              {vaultId}
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: 'var(--text-muted)',
                marginTop: '2px',
              }}
            >
              Confidential Vault
            </div>
          </div>
        </div>

        <div style={{ marginTop: '14px' }}>
          <ProvenBadge label="Proven Active" />
        </div>

        <button
          className="btn-primary"
          style={{ width: '100%', marginTop: '16px', fontSize: '10px', padding: '8px 12px' }}
          onClick={() => setActiveTab('transfer')}
        >
          Initiate Transfer
        </button>
      </div>

      {/* Navigation Links */}
      <nav style={{ flex: 1, padding: '16px 0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {menuItems.map(({ tab, label, icon }) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 24px',
                background: isActive ? 'var(--bg-chamber)' : 'transparent',
                border: 'none',
                borderRight: isActive ? '2px solid var(--bronze)' : '2px solid transparent',
                color: isActive ? 'var(--bronze)' : 'var(--text-muted)',
                fontFamily: 'var(--font-sans)',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                {icon}
              </span>
              <span>{label}</span>
            </button>
          );
        })}
      </nav>

      {/* Institutional Meta */}
      <div
        style={{
          padding: '20px 24px',
          borderTop: '1px solid var(--line)',
          backgroundColor: 'var(--bg-chamber-lowest)',
        }}
      >
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-dim)' }}>
          STRK20 PROTOCOL POOL
        </div>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            color: 'var(--text-muted)',
            marginTop: '4px',
            wordBreak: 'break-all',
          }}
        >
          0x040337b1...ffe812a
        </div>
      </div>
    </aside>
  );
};
