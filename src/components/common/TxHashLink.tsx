import React, { useState } from 'react';

interface TxHashLinkProps {
  hash: string;
  truncateLength?: number;
  showCopy?: boolean;
  showExplorer?: boolean;
  isProofSignature?: boolean;
}

export const TxHashLink: React.FC<TxHashLinkProps> = ({
  hash,
  truncateLength = 6,
  showCopy = true,
  showExplorer = true,
  isProofSignature,
}) => {
  const [copied, setCopied] = useState(false);

  if (!hash) return <span style={{ color: 'var(--text-dim)' }}>—</span>;

  let cleanHash = hash.trim();
  if (!cleanHash.startsWith('0x')) {
    cleanHash = '0x' + cleanHash;
  }

  const truncated =
    cleanHash.length > truncateLength * 2 + 2
      ? `${cleanHash.substring(0, truncateLength + 2)}...${cleanHash.substring(cleanHash.length - truncateLength)}`
      : cleanHash;

  // Auto-detect if this is an offchain cryptographic proof signature vs onchain tx hash
  const isSig = isProofSignature ?? (cleanHash.length > 66 || cleanHash.includes('sig'));
  const explorerUrl = `https://sepolia.voyager.online/tx/${cleanHash}`;

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(cleanHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        fontFamily: 'var(--font-mono)',
        fontSize: '11px',
        padding: '4px 10px',
        background: 'var(--bg-chamber)',
        border: '1px solid var(--line)',
        borderRadius: '0px',
        transition: 'border-color 0.2s',
      }}
      className="tx-hash-badge"
    >
      {isSig ? (
        <span
          title={`Offchain SNIP-12 ZK Proof Signature:\n${cleanHash}\n\nThis authorization was signed with your private key to authorize the note nullifier. Zero amounts or recipient identities are broadcast to public explorers.`}
          style={{
            color: 'var(--bronze)',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            letterSpacing: '0.02em',
            cursor: 'default',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '13px', opacity: 0.9 }}>
            verified_user
          </span>
          <span>{truncated}</span>
        </span>
      ) : (
        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          title={`Click to inspect onchain transaction on Starknet Sepolia Voyager:\n${cleanHash}`}
          style={{
            color: 'var(--bronze)',
            textDecoration: 'none',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            letterSpacing: '0.02em',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <span>{truncated}</span>
          {showExplorer && (
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: '14px',
                verticalAlign: 'middle',
                opacity: 0.8,
                transition: 'opacity 0.2s, transform 0.2s',
              }}
            >
              open_in_new
            </span>
          )}
        </a>
      )}

      {showCopy && (
        <button
          onClick={handleCopy}
          type="button"
          title={copied ? 'Copied full hash!' : `Copy full hash: ${cleanHash}`}
          style={{
            background: 'transparent',
            border: 'none',
            color: copied ? '#22c55e' : 'var(--text-dim)',
            cursor: 'pointer',
            padding: '2px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
            {copied ? 'check' : 'content_copy'}
          </span>
        </button>
      )}
    </div>
  );
};
