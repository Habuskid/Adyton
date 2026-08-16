import React from 'react';

interface ProvenBadgeProps {
  label?: string;
  glow?: boolean;
}

export const ProvenBadge: React.FC<ProvenBadgeProps> = ({ label = 'Proven', glow = true }) => {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        border: '1px solid var(--bronze)',
        padding: '3px 8px',
        backgroundColor: 'rgba(166, 124, 82, 0.05)',
        boxShadow: glow ? '0 0 6px var(--bronze-glow)' : 'none',
      }}
    >
      <span className="proven-badge">P</span>
      <span
        style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '10px',
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--bronze)',
        }}
      >
        {label}
      </span>
    </div>
  );
};
