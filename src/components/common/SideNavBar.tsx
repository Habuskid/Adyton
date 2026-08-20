import React from 'react';
import { useVault } from '../../state/vaultContext';
import { ProvenBadge } from './ProvenBadge';
import { ActiveTab } from '../../types';
import { CURRENT_CONFIG } from '../../starknet/config';

export const SideNavBar: React.FC = () => {
  const { vaultId, activeTab, setActiveTab, holdings } = useVault();

  const totalShieldedUsd = holdings.reduce((sum, h) => sum + h.shieldedAmount * h.usdRate, 0);

  const menuSections: {
    section: string;
    items: { tab: ActiveTab; label: string; icon: string; description: string }[];
  }[] = [
    {
      section: 'MAIN NAVIGATION',
      items: [
        {
          tab: 'dashboard',
          label: 'Treasury Overview',
          icon: 'grid_view',
          description: 'Shielded balances & UTXOs',
        },
        {
          tab: 'deposit',
          label: 'Shield Deposits',
          icon: 'shield',
          description: 'FPI minting into pool',
        },
        {
          tab: 'transfer',
          label: 'Shielded Transfers',
          icon: 'send',
          description: 'Zero-knowledge payments',
        },
      ],
    },
    {
      section: 'GOVERNANCE & COMPLIANCE',
      items: [
        {
          tab: 'policy',
          label: 'Policy Engine',
          icon: 'tune',
          description: 'Caps, allowlists & rules',
        },
        {
          tab: 'audit',
          label: 'Auditor Disclosure',
          icon: 'verified_user',
          description: 'Selective viewing keys',
        },
        {
          tab: 'landing',
          label: 'Protocol Specs',
          icon: 'menu_book',
          description: 'Architecture & whitepaper',
        },
      ],
    },
  ];

  return (
    <aside
      style={{
        width: '280px',
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
      {/* Vault Profile Card */}
      <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--line)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '13px',
                fontWeight: 800,
                letterSpacing: '0.04em',
                color: 'var(--text-primary)',
              }}
            >
              {vaultId}
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                color: 'var(--text-dim)',
                marginTop: '2px',
              }}
            >
              Confidential Multi-Asset
            </div>
          </div>
          <ProvenBadge label="Active" glow={false} />
        </div>

        <div
          style={{
            marginTop: '12px',
            padding: '8px 12px',
            background: 'var(--bg-chamber)',
            border: '1px solid var(--line)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-dim)' }}>
            TOTAL SHIELDED
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700, color: 'var(--bronze)' }}>
            ${totalShieldedUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Navigation Sections */}
      <nav style={{ flex: 1, padding: '16px 0', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {menuSections.map((sec) => (
          <div key={sec.section}>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '10px',
                fontWeight: 700,
                color: 'var(--text-dim)',
                letterSpacing: '0.08em',
                padding: '0 24px 8px',
              }}
            >
              {sec.section}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {sec.items.map(({ tab, label, icon, description }) => {
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 24px',
                      background: isActive ? 'var(--bg-chamber)' : 'transparent',
                      border: 'none',
                      borderLeft: isActive ? '3px solid var(--bronze)' : '3px solid transparent',
                      color: isActive ? 'var(--bronze)' : 'var(--text-muted)',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      width: '100%',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) (e.currentTarget as HTMLElement).style.background = 'rgba(255, 255, 255, 0.02)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent';
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '20px', flexShrink: 0 }}>
                      {icon}
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                      <span
                        style={{
                          fontFamily: 'var(--font-sans)',
                          fontSize: '12px',
                          fontWeight: isActive ? 800 : 600,
                          letterSpacing: '0.02em',
                        }}
                      >
                        {label}
                      </span>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '10px',
                          color: 'var(--text-dim)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {description}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Live Protocol Contracts Reference */}
      <div
        style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--line)',
          backgroundColor: 'var(--bg-chamber-lowest)',
        }}
      >
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-dim)', letterSpacing: '0.05em', marginBottom: '6px' }}>
          ONCHAIN DEPLOYMENTS (SEPOLIA)
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)' }}>Pool:</span>
            <a
              href={`https://sepolia.voyager.online/contract/${CURRENT_CONFIG.poolAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              title={CURRENT_CONFIG.poolAddress}
              style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--bronze)', textDecoration: 'none' }}
            >
              {CURRENT_CONFIG.poolAddress.substring(0, 6)}...{CURRENT_CONFIG.poolAddress.substring(CURRENT_CONFIG.poolAddress.length - 4)} ↗
            </a>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)' }}>Policy:</span>
            <a
              href={`https://sepolia.voyager.online/contract/${CURRENT_CONFIG.policyContractAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              title={CURRENT_CONFIG.policyContractAddress}
              style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--bronze)', textDecoration: 'none' }}
            >
              {CURRENT_CONFIG.policyContractAddress.substring(0, 6)}...{CURRENT_CONFIG.policyContractAddress.substring(CURRENT_CONFIG.policyContractAddress.length - 4)} ↗
            </a>
          </div>
        </div>
      </div>
    </aside>
  );
};
