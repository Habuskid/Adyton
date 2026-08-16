import React from 'react';

interface ChamberProps {
  title: string;
  badge?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  noPadding?: boolean;
}

export const Chamber: React.FC<ChamberProps> = ({ title, badge, action, children, noPadding = false }) => {
  return (
    <section
      style={{
        backgroundColor: 'var(--bg-chamber)',
        border: '1px solid var(--line)',
        position: 'relative',
        marginBottom: '24px',
      }}
    >
      {/* Chamber Header */}
      <div
        style={{
          padding: '14px 20px',
          borderBottom: '1px solid var(--line)',
          backgroundColor: 'var(--bg-chamber-lowest)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h3
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--text-primary)',
            }}
          >
            {title}
          </h3>
          {badge}
        </div>
        {action && <div>{action}</div>}
      </div>

      {/* Chamber Body */}
      <div style={{ padding: noPadding ? '0' : '24px' }}>{children}</div>
    </section>
  );
};
