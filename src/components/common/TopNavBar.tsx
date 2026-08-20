import React, { useState } from 'react';
import { useVault } from '../../state/vaultContext';
import { ProvenBadge } from './ProvenBadge';

export const TopNavBar: React.FC = () => {
  const { connectedWallet, connectWallet, disconnectWallet, walletError, setWalletError, vaultId } = useVault();
  const [showWalletMenu, setShowWalletMenu] = useState(false);
  const [copiedAddr, setCopiedAddr] = useState(false);

  const handleCopyAddress = (addr: string) => {
    navigator.clipboard.writeText(addr);
    setCopiedAddr(true);
    setTimeout(() => setCopiedAddr(false), 2000);
  };

  return (
    <>
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
          {/* Brand with Logo */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'var(--bg-chamber)',
                border: '1px solid var(--line)',
                padding: '4px',
              }}
            >
              <img
                src="/logo.png"
                alt="Adyton Logo"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    fontFamily: 'var(--font-sans)',
                    fontSize: '18px',
                    fontWeight: 900,
                    letterSpacing: '-0.02em',
                    color: 'var(--text-primary)',
                  }}
                >
                  ADYTON
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '10px',
                    color: 'var(--bronze)',
                    padding: '2px 6px',
                    border: '1px solid var(--bronze)',
                    letterSpacing: '0.05em',
                    fontWeight: 700,
                  }}
                >
                  STRK[20]
                </span>
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  color: 'var(--text-dim)',
                  letterSpacing: '0.04em',
                }}
              >
                Confidential Institutional Treasury
              </div>
            </div>
          </div>

          {/* Center Status: Active Vault or Protocol Badge */}
          {connectedWallet ? (
            <div
              className="hidden-mobile"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                border: '1px solid var(--line)',
                background: 'var(--bg-chamber-lowest)',
                padding: '6px 16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    color: 'var(--text-dim)',
                  }}
                >
                  VAULT:
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                  }}
                >
                  {vaultId}
                </span>
              </div>
              <div style={{ width: '1px', height: '14px', background: 'var(--line)' }} />
              <ProvenBadge label="Stwo ZK Engine Active" glow={true} />
            </div>
          ) : (
            <div
              className="hidden-mobile"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                border: '1px solid var(--line)',
                background: 'var(--bg-chamber-lowest)',
                padding: '6px 16px',
              }}
            >
              <span className="proven-badge">P</span>
              <span
                style={{
                  fontFamily: 'var(--font-sans)',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--bronze)',
                  letterSpacing: '0.06em',
                }}
              >
                STARKNET STRK20 PROTOCOL
              </span>
            </div>
          )}

          {/* Right Section: Network & Wallet Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Sepolia Network Badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                border: '1px solid var(--line)',
                padding: '6px 12px',
                background: 'var(--bg-chamber-lowest)',
              }}
            >
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: '#22c55e',
                  boxShadow: '0 0 6px rgba(34, 197, 94, 0.6)',
                }}
              />
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                }}
              >
                Starknet Sepolia
              </span>
            </div>

            {/* Wallet Button */}
            {connectedWallet ? (
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowWalletMenu(!showWalletMenu)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '6px 14px',
                    border: '1px solid var(--bronze)',
                    background: 'var(--bg-chamber)',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <span className="proven-badge" style={{ fontSize: '10px', padding: '1px 5px' }}>
                    P
                  </span>
                  <span style={{ fontWeight: 600 }}>
                    {connectedWallet.address.substring(0, 6)}...{connectedWallet.address.substring(connectedWallet.address.length - 4)}
                  </span>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--text-dim)' }}>
                    expand_more
                  </span>
                </button>

                {/* Dropdown Menu */}
                {showWalletMenu && (
                  <div
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: 'calc(100% + 6px)',
                      width: '240px',
                      background: 'var(--bg-chamber)',
                      border: '1px solid var(--line)',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                      padding: '12px',
                      zIndex: 100,
                    }}
                  >
                    <div style={{ paddingBottom: '10px', borderBottom: '1px solid var(--line)' }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-dim)' }}>
                        CONNECTED WALLET
                      </div>
                      <div
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '11px',
                          color: 'var(--text-primary)',
                          marginTop: '4px',
                          wordBreak: 'break-all',
                        }}
                      >
                        {connectedWallet.address}
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
                      <button
                        className="btn-ghost"
                        style={{ width: '100%', justifyContent: 'flex-start', padding: '6px 8px', fontSize: '11px' }}
                        onClick={() => handleCopyAddress(connectedWallet.address)}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '14px', marginRight: '6px' }}>
                          {copiedAddr ? 'check' : 'content_copy'}
                        </span>
                        {copiedAddr ? 'Address Copied!' : 'Copy Full Address'}
                      </button>

                      <a
                        href={`https://sepolia.voyager.online/contract/${connectedWallet.address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-ghost"
                        style={{
                          width: '100%',
                          justifyContent: 'flex-start',
                          padding: '6px 8px',
                          fontSize: '11px',
                          textDecoration: 'none',
                          color: 'var(--text)',
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '14px', marginRight: '6px' }}>
                          open_in_new
                        </span>
                        View on Voyager
                      </a>

                      <button
                        className="btn-ghost"
                        style={{
                          width: '100%',
                          justifyContent: 'flex-start',
                          padding: '6px 8px',
                          fontSize: '11px',
                          color: '#ef4444',
                          borderTop: '1px solid var(--line)',
                          marginTop: '4px',
                          paddingTop: '8px',
                        }}
                        onClick={() => {
                          disconnectWallet();
                          setShowWalletMenu(false);
                        }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '14px', marginRight: '6px' }}>
                          logout
                        </span>
                        Disconnect Wallet
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                className="btn-primary"
                style={{ padding: '8px 16px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px' }}
                onClick={connectWallet}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                  account_balance_wallet
                </span>
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Wallet Error Alert Banner */}
      {walletError && (
        <div
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderBottom: '1px solid rgba(239, 68, 68, 0.3)',
            padding: '10px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="material-symbols-outlined" style={{ color: '#ef4444', fontSize: '18px' }}>
              warning
            </span>
            <span style={{ fontSize: '12px', color: '#f87171' }}>
              {walletError}
            </span>
            <a
              href="https://www.argent.xyz/argent-x/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: '12px', color: 'var(--bronze)', marginLeft: '10px', textDecoration: 'underline' }}
            >
              Get Argent X
            </a>
            <span style={{ color: 'var(--text-dim)', fontSize: '11px' }}>or</span>
            <a
              href="https://braavos.app/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: '12px', color: 'var(--bronze)', textDecoration: 'underline' }}
            >
              Get Braavos
            </a>
          </div>

          <button
            onClick={() => setWalletError(null)}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
              close
            </span>
          </button>
        </div>
      )}
    </>
  );
};
