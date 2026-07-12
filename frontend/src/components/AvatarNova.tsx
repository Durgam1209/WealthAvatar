import React from 'react';

export default function AvatarNova() {
  return (
    <div className="row" style={{ gap: 12 }}>
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: 14,
          background: 'linear-gradient(135deg, rgba(37,99,235,0.18), rgba(29,78,216,0.06))',
          border: '1px solid rgba(37,99,235,0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 900,
        }}
        aria-label="Nova avatar"
      >
        N
      </div>
      <div>
        <div style={{ fontWeight: 850, letterSpacing: '-0.01em' }}>Nova</div>
        <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
          Wealth Advisor
        </div>
      </div>
    </div>
  );
}
