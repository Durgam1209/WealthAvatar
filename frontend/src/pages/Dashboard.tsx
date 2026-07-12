import React, { useEffect, useMemo, useState } from 'react';
import DisclaimerBanner from '../components/DisclaimerBanner';
import PhoneFrame from '../components/PhoneFrame';
import AvatarNova from '../components/AvatarNova';
import InsightCard from '../components/InsightCard';
import BottomNav from '../components/BottomNav';

import { ApiClient } from '../api/client';
import type { SessionState } from '../App';

export default function Dashboard({
  api,
  session,
  setSession,
}: {
  api: ApiClient;
  session: SessionState;
  setSession: React.Dispatch<React.SetStateAction<SessionState>>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [insights, setInsights] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [demoSnapshot, setDemoSnapshot] = useState<any | null>(null);
  const [cashInput, setCashInput] = useState('1000');
  const userId = session.userId;

  useEffect(() => {
    const run = async () => {
      setBusy(true);
      setError(null);
      try {
        const [profileData, insightsData] = await Promise.all([
          api.getProfile(userId),
          api.getInsights(userId),
        ]);
        setProfile(profileData);
        setInsights(Array.isArray(insightsData) ? insightsData : insightsData.insights || []);
      } catch (e: any) {
        setError(e?.message || 'Failed to load insights');
      } finally {
        setBusy(false);
      }
    };
    run();
  }, [userId]);

  const discussWithNova = (insight: any) => {
    // Preload selected insight context into chat history as system-like hint.
    const context = insight?.discussContext || `Discuss: ${insight?.title}`;
    setSession((prev) => ({
      ...prev,
      chatHistory: [
        ...prev.chatHistory,
        { role: 'assistant', content: `Nova context: ${context}` },
      ],
    }));
    window.location.href = '/chat';
  };

  const riskLabel = useMemo(() => session.riskLabel || 'Moderate', [session.riskLabel]);
  const summary = profile?.financialSummary || {};
  const fmtCurrency = (value: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);

  useEffect(() => {
    if (!profile) return;
    const storageKey = `wealth_avatar_demo_snapshot_${userId}`;
    const storedRaw = window.localStorage.getItem(storageKey);
    if (storedRaw) {
      try {
        const stored = JSON.parse(storedRaw);
        setDemoSnapshot(stored);
        return;
      } catch {
        window.localStorage.removeItem(storageKey);
      }
    }

    const financialSummary = profile?.financialSummary || {};
    setDemoSnapshot({
      bankBalance: Number(financialSummary.bankBalance || 0),
      savingsRatePercent: Number(financialSummary.savingsRatePercent || 0),
      averageMonthlyIncome: Number(financialSummary.averageMonthlyIncome || 0),
      idleCashMonths: Number(financialSummary.idleCashMonths || 0),
    });
  }, [profile, userId]);

  useEffect(() => {
    if (!demoSnapshot || !profile) return;
    const storageKey = `wealth_avatar_demo_snapshot_${userId}`;
    window.localStorage.setItem(storageKey, JSON.stringify(demoSnapshot));
  }, [demoSnapshot, profile, userId]);

  const handleAddMoney = () => {
    const amount = Number(cashInput);
    if (!Number.isFinite(amount) || amount <= 0) return;
    setDemoSnapshot((prev: any) => ({
      ...prev,
      bankBalance: Number(prev?.bankBalance || 0) + amount,
      idleCashMonths: Math.max(0.2, Number(prev?.idleCashMonths || 0) + amount / 100000),
    }));
  };

  const handleMoveToSavings = () => {
    const amount = Number(cashInput);
    if (!Number.isFinite(amount) || amount <= 0) return;
    setDemoSnapshot((prev: any) => ({
      ...prev,
      bankBalance: Math.max(0, Number(prev?.bankBalance || 0) - amount),
      savingsRatePercent: Math.min(35, Number(prev?.savingsRatePercent || 0) + 2),
      idleCashMonths: Math.max(0.2, Number(prev?.idleCashMonths || 0) - amount / 150000),
    }));
  };

  const displaySnapshot = demoSnapshot || {
    bankBalance: Number(profile?.financialSummary?.bankBalance || 0),
    savingsRatePercent: Number(profile?.financialSummary?.savingsRatePercent || 0),
    averageMonthlyIncome: Number(profile?.financialSummary?.averageMonthlyIncome || 0),
    idleCashMonths: Number(profile?.financialSummary?.idleCashMonths || 0),
  };
  const savingsRatePct = Number(displaySnapshot.savingsRatePercent || 0);
  const bankBalance = Number(displaySnapshot.bankBalance || 0);
  const monthlyIncome = Number(displaySnapshot.averageMonthlyIncome || 0);

  const headerRight = (
    <div className="headerProfile">
      <div className="headerProfileText">
        <div className="headerProfileName">{profile?.name || 'Demo user'}</div>
        <div className="headerProfileMeta">{riskLabel} • {savingsRatePct}% save</div>
      </div>
      <div className="headerAvatar">{(profile?.name || 'D').charAt(0)}</div>
    </div>
  );

  return (
    <div className="appRoot">
      <div className="phoneFrameWrap">
        <PhoneFrame
          title="Wealth Avatar"
          right={headerRight}
        >
          <div className="phoneBody">
            <DisclaimerBanner />
            <div style={{ marginBottom: 12 }}>
              <div className="h1" style={{ marginBottom: 8 }}>
                Your money snapshot
              </div>

              <div className="summaryStrip" style={{ marginBottom: 10 }}>
                <div className="summaryPill">Savings rate: {savingsRatePct}%</div>
                <div className="summaryPill">Bank balance: {fmtCurrency(bankBalance)}</div>
                <div className="summaryPill">Income: {fmtCurrency(monthlyIncome)}</div>
              </div>

              <div className="card heroCard fadeUp">
                <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ paddingRight: 8 }}>
                    <div className="h2" style={{ marginBottom: 6 }}>
                      Nova is highlighting the most useful signals right now
                    </div>
                    <div className="muted" style={{ fontSize: 12, lineHeight: 1.4 }}>
                      These cards surface spending habits, goal progress, and opportunities to improve your plan.
                    </div>
                  </div>
                  <div className="badge">Live demo</div>
                </div>
                <div className="pillRow" style={{ marginTop: 10 }}>
                  <span className="pill">Goal tracking</span>
                  <span className="pill">Spending alerts</span>
                  <span className="pill">Personalized advice</span>
                </div>
              </div>

              <div className="card fadeUp">
                <div className="h2" style={{ marginBottom: 8 }}>Quick money actions</div>
                <div className="muted" style={{ fontSize: 12, lineHeight: 1.4, marginBottom: 10 }}>
                  Simulate adding money or moving it into savings to see the dashboard respond live.
                </div>
                <div className="row" style={{ gap: 8, marginBottom: 10 }}>
                  <input
                    className="input"
                    value={cashInput}
                    onChange={(e) => setCashInput(e.target.value)}
                    placeholder="Amount"
                    type="number"
                    min="1"
                  />
                </div>
                <div className="grid2">
                  <button className="btn btnSecondary" type="button" onClick={handleAddMoney}>
                    Add money
                  </button>
                  <button className="btn" type="button" onClick={handleMoveToSavings}>
                    Move to savings
                  </button>
                </div>
              </div>

              <AvatarNova />
              <div className="muted" style={{ fontSize: 12, marginTop: 10 }}>
                Tap any card to see why it matters, or discuss it with Nova.
              </div>
            </div>

            {error ? (
              <div
                className="disclaimer"
                style={{
                  background: 'rgba(239,68,68,0.08)',
                  borderColor: 'rgba(239,68,68,0.22)',
                  color: '#b91c1c',
                }}
              >
                {error}
              </div>
            ) : null}

            {busy ? <div className="muted">Loading insights...</div> : null}

            <div style={{ marginTop: 10 }}>
              {insights.map((ins: any) => (
                <InsightCard
                  key={ins.insightId}
                  title={ins.title}
                  why={ins.why}
                  severity={ins.severity}
                  discussContext={ins.discussContext}
                  onDiscuss={() => discussWithNova(ins)}
                />
              ))}
              {!busy && insights.length === 0 ? (
                <div className="muted">No insights available for this demo user.</div>
              ) : null}
            </div>

            <BottomNav />

          </div>
        </PhoneFrame>
      </div>
    </div>
  );
}
