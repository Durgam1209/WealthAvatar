import React, { useMemo, useState } from 'react';

export default function InsightCard(props: any) {
  const { title, why, severity, onDiscuss, discussContext } = props;
  const [openWhy, setOpenWhy] = useState(false);

  const tone =
    severity === 'high'
      ? { borderColor: 'rgba(239,68,68,0.35)', bg: 'rgba(239,68,68,0.07)', color: '#b91c1c' }
      : severity === 'medium'
        ? { borderColor: 'rgba(245,158,11,0.35)', bg: 'rgba(245,158,11,0.08)', color: '#92400e' }
        : { borderColor: 'rgba(22,163,74,0.25)', bg: 'rgba(22,163,74,0.06)', color: '#065f46' };

  const hasContext = useMemo(() => Boolean(discussContext && String(discussContext).trim().length > 0), [discussContext]);

  return (
    <div className="card insightCard fadeUp" style={{ borderColor: tone.borderColor, background: tone.bg }}>
      <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ paddingRight: 10 }}>
          <div className="h2" style={{ marginBottom: 4 }}>
            {title}
          </div>

          <div className="muted" style={{ fontSize: 12, lineHeight: 1.35 }}>
            {(() => {
              const w = String(why ?? '').trim();
              if (!w) return '';
              // Premium polish: show only the first sentence by default.
              const parts = w.split(/(?<=[.!?])\s+/);
              return parts[0] || w;
            })()}
          </div>

          {hasContext ? (
            <button
              type="button"
              className="btn btnSecondary"
              style={{ marginTop: 10, width: '100%', justifyContent: 'center' as any }}
              onClick={() => setOpenWhy((v) => !v)}
            >
              {openWhy ? 'Hide Why' : 'Show Why'}
            </button>
          ) : null}
        </div>

        <div className="badge" style={{ background: tone.bg, borderColor: tone.borderColor, color: tone.color }}>
          {severity.toUpperCase()}
        </div>
      </div>

      {openWhy ? (
        <>
          {discussContext ? (
            <div className="muted" style={{ fontSize: 12, marginTop: 10, whiteSpace: 'pre-wrap' }}>
              <b style={{ color: 'inherit' }}>Context:</b> {discussContext}
            </div>
          ) : null}
        </>
      ) : null}

      <div style={{ marginTop: 12 }}>
        <button className="btn btnSecondary" onClick={onDiscuss}>
          Talk to Nova
        </button>
      </div>
    </div>
  );
}
