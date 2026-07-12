import React, { useMemo, useState } from 'react';
import DisclaimerBanner from '../components/DisclaimerBanner';
import PhoneFrame from '../components/PhoneFrame';
import { ApiClient } from '../api/client';
import type { RiskLabel, SessionState } from '../App';

function scoreFromAnswers(answers: Record<string, any>): RiskLabel {
  // Frontend fallback: if backend /profile/risk exists, prefer that.
  const horizon = Number(answers.timeHorizonYears ?? 5);
  const drawdown = Number(answers.comfortableDrawdownPct ?? 15);
  const preferStability = Boolean(answers.preferStability ?? true);

  const horizonScore = Math.min(40, (horizon / 10) * 40);
  const drawdownScore = Math.min(40, (drawdown / 30) * 40);
  const stabilityAdj = preferStability ? -5 : 15;

  const total = Math.max(0, Math.min(100, horizonScore + drawdownScore + stabilityAdj));
  if (total < 40) return 'Conservative';
  if (total < 70) return 'Moderate';
  return 'Aggressive';
}

export default function Onboarding({
  api,
  session,
  onComplete,
  setSession,
}: {
  api: ApiClient;
  session: SessionState;
  onComplete: (risk: RiskLabel, questionnaire: Record<string, any>) => void;
  setSession: React.Dispatch<React.SetStateAction<SessionState>>;
}) {
  const userId = session.userId;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [answers, setAnswers] = useState<Record<string, any>>(() => ({
    timeHorizonYears: 7,
    comfortableDrawdownPct: 12,
    preferStability: true,
    incomeComfort: 'steady',
    lossToleranceText: 'Can tolerate short-term drops if long-term improves',
  }));

  const computedRisk = useMemo(() => scoreFromAnswers(answers), [answers]);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await api.computeRisk(userId, answers);
      const risk = (res.risk?.riskLabel || computedRisk) as RiskLabel;
      onComplete(risk, answers);
      setSession((prev) => ({
        ...prev,
        riskLabel: risk,
      }));
      window.location.href = '/dashboard';
    } catch (e: any) {
      setError(e?.message || 'Failed to compute risk profile');
      // still allow fallback
      onComplete(computedRisk, answers);
      setSession((prev) => ({ ...prev, riskLabel: computedRisk }));
      window.location.href = '/dashboard';
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="appRoot">
      <div className="phoneFrameWrap">
        <PhoneFrame title="Wealth Avatar" right={<span className="badge">Nova • Setup</span>}>
          <div className="phoneBody">
            <DisclaimerBanner />

            <div className="h1">Let Nova personalize your experience</div>
            <div className="muted" style={{ fontSize: 12, lineHeight: 1.4, marginBottom: 12 }}>
              This takes under 30 seconds. Nova uses these choices to give you more relevant guidance for your goals and comfort with risk.
            </div>

            <div className="card" style={{ borderColor: 'rgba(37,99,235,0.20)', background: 'linear-gradient(135deg, rgba(37,99,235,0.06), rgba(16,185,129,0.06))' }}>
              <div className="h2">Why this helps</div>
              <div className="muted" style={{ fontSize: 12, marginTop: 8, lineHeight: 1.45 }}>
                Nova can suggest better plans when it understands whether you prefer steady growth, higher upside, or a balanced approach.
              </div>
            </div>

            <div className="card">
              <div className="h2">1) How long can you invest?</div>
              <div className="muted" style={{ fontSize: 12, marginBottom: 10 }}>
                Longer horizons usually allow for more growth-oriented ideas.
              </div>
              <div className="grid2">
                <button
                  className="btn btnSecondary"
                  onClick={() => setAnswers((p) => ({ ...p, timeHorizonYears: 3 }))}
                  style={{ padding: 10 }}
                  type="button"
                >
                  3 years
                </button>
                <button
                  className="btn btnSecondary"
                  onClick={() => setAnswers((p) => ({ ...p, timeHorizonYears: 7 }))}
                  style={{ padding: 10 }}
                  type="button"
                >
                  7 years
                </button>
                <button
                  className="btn btnSecondary"
                  onClick={() => setAnswers((p) => ({ ...p, timeHorizonYears: 10 }))}
                  style={{ padding: 10 }}
                  type="button"
                >
                  10+ years
                </button>
                <button
                  className="btn btnSecondary"
                  onClick={() => setAnswers((p) => ({ ...p, timeHorizonYears: 5 }))}
                  style={{ padding: 10 }}
                  type="button"
                >
                  5 years
                </button>
              </div>
            </div>

            <div className="card">
              <div className="h2">2) How much market drop feels okay?</div>
              <div className="muted" style={{ fontSize: 12, marginBottom: 10 }}>
                This helps Nova avoid suggesting ideas that feel too aggressive for you.
              </div>
              <div className="grid2">
                <button className="btn btnSecondary" style={{ padding: 10 }} type="button" onClick={() => setAnswers((p) => ({ ...p, comfortableDrawdownPct: 10, preferStability: true }))}>
                  Up to 10%
                </button>
                <button className="btn btnSecondary" style={{ padding: 10 }} type="button" onClick={() => setAnswers((p) => ({ ...p, comfortableDrawdownPct: 12, preferStability: true }))}>
                  Up to 12%
                </button>
                <button className="btn btnSecondary" style={{ padding: 10 }} type="button" onClick={() => setAnswers((p) => ({ ...p, comfortableDrawdownPct: 20, preferStability: false }))}>
                  Up to 20%
                </button>
                <button className="btn btnSecondary" style={{ padding: 10 }} type="button" onClick={() => setAnswers((p) => ({ ...p, comfortableDrawdownPct: 30, preferStability: false }))}>
                  Up to 30%
                </button>
              </div>
            </div>

            <div className="card">
              <div className="h2">3) What matters more to you?</div>
              <div className="muted" style={{ fontSize: 12, marginBottom: 10 }}>
                Choose the style that feels most natural for your money decisions.
              </div>
              <div className="grid2">
                <button className="btn btnSecondary" style={{ padding: 10 }} type="button" onClick={() => setAnswers((p) => ({ ...p, preferStability: true }))}>
                  Prefer stability
                </button>
                <button className="btn btnSecondary" style={{ padding: 10 }} type="button" onClick={() => setAnswers((p) => ({ ...p, preferStability: false }))}>
                  Prioritize growth
                </button>
              </div>
            </div>

            <div className="card">
              <div className="h2">Nova’s initial view</div>
              <div className="muted" style={{ fontSize: 12, marginBottom: 10 }}>
                Based on your answers, Nova will start with a {computedRisk.toLowerCase()} style profile for this demo.
              </div>
              <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: '-0.02em' }}>{computedRisk}</div>
            </div>

            {error ? <div className="disclaimer" style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.22)', color: '#b91c1c' }}>{error}</div> : null}

            <div className="btn" style={{ marginTop: 12, opacity: busy ? 0.7 : 1 }} onClick={busy ? undefined : submit}>
              {busy ? 'Computing...' : 'Continue to your dashboard'}
            </div>
          </div>
        </PhoneFrame>
      </div>
    </div>
  );
}
