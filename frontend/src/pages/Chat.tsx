import React, { useEffect, useMemo, useState } from 'react';
import PhoneFrame from '../components/PhoneFrame';
import DisclaimerBanner from '../components/DisclaimerBanner';
import AvatarNova from '../components/AvatarNova';
import type { SessionState } from '../App';
import { ApiClient } from '../api/client';
import BottomNav from '../components/BottomNav';


function formatChatLine(content: string) {
  return content;
}

export default function Chat({
  api,
  session,
  setSession,
  appendChat,
}: {
  api: ApiClient;
  session: SessionState;
  setSession: React.Dispatch<React.SetStateAction<SessionState>>;
  appendChat: (role: 'user' | 'assistant', content: string) => void;
}) {
  const userId = session.userId;
  const sessionId = session.sessionId;

  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load initial chat history from session state (client persistence)
  const history = session.chatHistory;

  const scrollRef = React.useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history.length, busy]);

  const chatTitle = useMemo(() => `Nova • Chat`, []);

  const send = async () => {
    if (!message.trim() || busy) return;
    setError(null);

    const userMsg = message.trim();
    setMessage('');
    setBusy(true);

    // optimistic append
    appendChat('user', userMsg);

    try {
      const res = await api.chat({ userId, sessionId, message: userMsg });
      const reply = res?.reply ?? 'No response from Nova.';
      const suitabilityMismatch = res?.suitabilityMismatch;

      const moderateMismatchBadge =
        suitabilityMismatch?.isMismatch && suitabilityMismatch?.riskLabel === 'Moderate'
          ? '⚠ Suitability mismatch (Moderate)\n'
          : '';

      const fallbackUsedNotice = res?.generationMode === 'fallback_used' ? 'ℹ️ Note: fallback logic may have been used, but your request is still addressed with a clear Why.\n\n' : '';

      const assistantContent = res?.handoff
        ? moderateMismatchBadge +
          'Human handoff initiated ✅\n\n' +
          reply +
          '\n\n(You can review the audit trail in the “Audit • Log” tab.)'
        : moderateMismatchBadge + fallbackUsedNotice + formatChatLine(reply);

      appendChat('assistant', assistantContent);

      // also keep latest suggestion category/handoff in session (optional UI later)
      setSession((prev) => ({
        ...prev,
        chatHistory: [...prev.chatHistory, { role: 'assistant', content: assistantContent }],
      }));
    } catch (e: any) {
      setError(e?.message || 'Chat failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="appRoot">
      <div className="phoneFrameWrap">
        <PhoneFrame title="Wealth Avatar" right={<span className="badge">{chatTitle}</span>}>
          <div className="phoneBody">
            <DisclaimerBanner />
            <div style={{ marginBottom: 10 }}>
              <AvatarNova />
              <div className="muted" style={{ fontSize: 12, marginTop: 8 }}>
                Ask about spending, goals, holdings, or “what should I do next?” Nova will answer with a data-backed “Why”.
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

            <div
              className="card"
              style={{
                padding: 12,
                minHeight: 320,
                maxHeight: 420,
                overflow: 'auto',
              }}
            >
              {history.length === 0 ? (
                <div className="muted" style={{ fontSize: 12 }}>
                  Start the conversation. Try: “How am I tracking on my retirement goal?” or “Any overspending alerts?”
                </div>
              ) : null}

              {history.map((m, idx) => (
                <div key={idx} style={{ marginBottom: 12 }}>
                  <div style={{ fontWeight: 900, fontSize: 12, color: m.role === 'user' ? '#1d4ed8' : '#0f172a' }}>
                    {m.role === 'user' ? 'You' : 'Nova'}
                  </div>
                  <div
                    className="muted"
                    style={{
                      fontSize: 13,
                      whiteSpace: 'pre-wrap',
                      marginTop: 4,
                      lineHeight: 1.45,
                      background: m.role === 'user' ? 'rgba(37,99,235,0.08)' : 'rgba(15,23,42,0.04)',
                      border: '1px solid rgba(15,23,42,0.08)',
                      padding: 10,
                      borderRadius: 12,
                    }}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              <div ref={scrollRef} />
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
              <input
                className="input"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your question..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') send();
                }}
                disabled={busy}
              />
              <button className="btn btnSecondary" style={{ width: 120 }} onClick={send} disabled={busy}>
                {busy ? 'Sending...' : 'Send'}
              </button>
            </div>

            <div style={{ marginTop: 10 }} className="muted">
              Tip: out-of-scope requests trigger a human handoff message.
            </div>

            <BottomNav />
          </div>
        </PhoneFrame>
      </div>
    </div>
  );
}


