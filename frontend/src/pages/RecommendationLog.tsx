import React, { useEffect, useState } from 'react';
import PhoneFrame from '../components/PhoneFrame';
import DisclaimerBanner from '../components/DisclaimerBanner';
import AvatarNova from '../components/AvatarNova';
import type { SessionState } from '../App';
import { ApiClient } from '../api/client';
import BottomNav from '../components/BottomNav';


export default function RecommendationLog({ api, session }: { api: ApiClient; session: SessionState }) {
  const userId = session.userId;

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [log, setLog] = useState<any[]>([]);

  useEffect(() => {
    const run = async () => {
      setBusy(true);
      setError(null);
      try {
        const data = await api.getRecommendationsLog(userId);
        setLog(Array.isArray(data) ? data : data?.log ?? []);
      } catch (e: any) {
        setError(e?.message || 'Failed to load recommendation log');
      } finally {
        setBusy(false);
      }
    };
    run();
  }, [userId]);

  return (
    <div className="appRoot">
      <div className="phoneFrameWrap">
        <PhoneFrame title="Wealth Avatar" right={<span className="badge">Audit • Log</span>}>
          <div className="phoneBody">
            <DisclaimerBanner />
            <div style={{ marginBottom: 10 }}>
              <AvatarNova />
              <div className="muted" style={{ fontSize: 12, marginTop: 8 }}>
                Recommendation Log for audit purposes. Every Nova suggestion includes its data-driven “Why”.
              </div>
            </div>

            {error ? (
              <div
                className="disclaimer"
                style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.22)', color: '#b91c1c' }}
              >
                {error}
              </div>
            ) : null}

            {busy ? <div className="muted">Loading recommendations...</div> : null}

            <div className="card" style={{ padding: 12, maxHeight: 470, overflow: 'auto' }}>
              {log.length === 0 && !busy ? (
                <div className="muted" style={{ fontSize: 12 }}>
                  No recommendations yet. Ask Nova in the Chat tab.
                </div>
              ) : null}

              {log
                .slice()
                .reverse()
                .map((e: any, idx: number) => (
                  <div
                    key={idx}
                    style={{
                      border: '1px solid rgba(15,23,42,0.10)',
                      borderRadius: 14,
                      padding: 12,
                      marginBottom: 10,
                      background: '#fff',
                    }}
                  >
                    <div className="row" style={{ justifyContent: 'space-between', marginBottom: 6 }}>
                      <div style={{ fontWeight: 900 }}>Nova • {e.category ?? 'suggestion'}</div>
                      <div className="muted" style={{ fontSize: 11 }}>{e.timestamp?.slice?.(0, 19) ?? e.timestamp}</div>
                    </div>

                    <div style={{ fontSize: 13, fontWeight: 750, marginBottom: 6 }}>Message</div>
                    <div className="muted" style={{ fontSize: 12, whiteSpace: 'pre-wrap' }}>{e.message ?? ''}</div>

                    <div style={{ fontSize: 13, fontWeight: 750, marginTop: 10, marginBottom: 6 }}>Rationale</div>
                    <div className="muted" style={{ fontSize: 12, whiteSpace: 'pre-wrap' }}>{e.rationale ?? ''}</div>

                    <div style={{ fontSize: 13, fontWeight: 750, marginTop: 10, marginBottom: 6 }}>Why (data-driven)</div>
                    <div className="muted" style={{ fontSize: 12, whiteSpace: 'pre-wrap' }}>{e.why ?? ''}</div>
                  </div>
                ))}
            </div>

            <div style={{ marginTop: 12 }} className="muted">
              Compliance note: AI-generated guidance is not a guaranteed return.
            </div>

            <BottomNav />
          </div>
        </PhoneFrame>
      </div>
    </div>
  );
}

