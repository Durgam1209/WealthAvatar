import React, { useEffect, useMemo, useState } from 'react';
import DisclaimerBanner from '../components/DisclaimerBanner';
import PhoneFrame from '../components/PhoneFrame';
import { ApiClient } from '../api/client';
import type { SessionState } from '../App';
import BottomNav from '../components/BottomNav';


function computeProjectedDate(targetAmount: number, currentValue: number, monthlyContribution: number) {
  const remaining = Math.max(0, targetAmount - currentValue);
  if (monthlyContribution <= 0) return { months: Infinity, date: 'N/A' };
  const months = remaining / monthlyContribution;
  const now = new Date();
  const proj = new Date(now.getFullYear(), now.getMonth() + Math.ceil(months), now.getDate());
  return { months, date: proj.toISOString().slice(0, 10) };
}

export default function GoalPlanning({ api, session }: { api: ApiClient; session: SessionState }) {
  const userId = session.userId;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [goals, setGoals] = useState<any[]>([]);
  const [selectedGoalId, setSelectedGoalId] = useState<string>('');

  const [whatIfSIP, setWhatIfSIP] = useState<number>(25000);

  useEffect(() => {
    const run = async () => {
      setBusy(true);
      setError(null);
      try {
        const data = await api.getGoals(userId);
        const list = (data?.goals ?? data) as any[];
        setGoals(list || []);
        if (list?.length) {
          setSelectedGoalId(list[0].goalId);
          setWhatIfSIP(Number(list[0].monthlyContribution || 0) || 25000);
        }
      } catch (e: any) {
        setError(e?.message || 'Failed to load goals');
      } finally {
        setBusy(false);
      }
    };
    run();
  }, [userId]);

  const selectedGoal = useMemo(() => goals.find((g) => g.goalId === selectedGoalId) || goals[0], [goals, selectedGoalId]);


  const progressPct =
    Number(selectedGoal?.progressPct ?? ((selectedGoal?.currentValue ?? 0) / (selectedGoal?.targetAmount ?? 1)) * 100);
  const targetAmount = Number(selectedGoal?.targetAmount ?? 0);

  const currentValue = Number(selectedGoal?.currentValue ?? 0);


  const projected = useMemo(() => {
    return computeProjectedDate(targetAmount, currentValue, whatIfSIP);
  }, [targetAmount, currentValue, whatIfSIP]);

  return (
    <div className="appRoot">
      <div className="phoneFrameWrap">
        <PhoneFrame title="Wealth Avatar" right={<span className="badge">Goals • What-if</span>}>
          <div className="phoneBody">
            <DisclaimerBanner />
            <div className="h1" style={{ marginBottom: 6 }}>Goal-based planning</div>
            <div className="muted" style={{ fontSize: 12, marginBottom: 12, lineHeight: 1.4 }}>
              Project completion date using your adjustable monthly SIP amount.
            </div>

            {error ? (
              <div className="disclaimer" style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.22)', color: '#b91c1c' }}>
                {error}
              </div>
            ) : null}
            {busy ? <div className="muted">Loading goals...</div> : null}

            {!busy && goals.length ? (
              <>
                <div className="card">
                  <div className="h2">Pick a goal</div>
                  <div className="grid2" style={{ marginTop: 10 }}>
                    {goals.map((g) => (
                      <button
                        key={g.goalId}
                        type="button"
                        className="btn btnSecondary"
                        style={{
                          padding: 10,
                          opacity: g.goalId === selectedGoalId ? 1 : 0.75,
                          borderColor: g.goalId === selectedGoalId ? 'rgba(37,99,235,0.35)' : undefined,
                        }}
                        onClick={() => {
                          setSelectedGoalId(g.goalId);
                          setWhatIfSIP(Number(g.monthlyContribution || 0) || 25000);
                        }}
                      >
                        {g.title}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="card">
                  <div className="h2">{selectedGoal?.title}</div>
                  <div className="muted" style={{ fontSize: 12, marginBottom: 10 }}>
                    Current: {currentValue.toLocaleString()} • Target: {targetAmount.toLocaleString()}
                  </div>

                  <div className="progressOuter" aria-label="goal progress">
                    <div className="progressInner" style={{ width: `${Math.min(100, progressPct)}%` }} />
                  </div>

                  <div className="row" style={{ justifyContent: 'space-between', marginTop: 10 }}>
                    <div className="muted" style={{ fontSize: 12 }}>Progress</div>
                    <div style={{ fontWeight: 900 }}>{Math.min(100, progressPct).toFixed(0)}%</div>
                  </div>

                  <div className="row" style={{ justifyContent: 'space-between', marginTop: 6 }}>
                    <div className="muted" style={{ fontSize: 12 }}>Projected completion (with What-if)</div>
                    <div style={{ fontWeight: 900 }}>{projected.date}</div>
                  </div>
                </div>

                <div className="card">
                  <div className="h2">What-if: adjust SIP</div>
                  <div className="muted" style={{ fontSize: 12, marginBottom: 10 }}>
                    Slide monthly contribution. Updates projected completion in real time.
                  </div>

                  <div style={{ marginBottom: 10 }}>
                    <div className="row" style={{ justifyContent: 'space-between' }}>
                      <div className="muted" style={{ fontSize: 12 }}>Monthly SIP</div>
                      <div style={{ fontWeight: 900 }}>₹{whatIfSIP.toLocaleString()}</div>
                    </div>
                  </div>

                  <input
                    type="range"
                    min={5000}
                    max={80000}
                    step={1000}
                    value={whatIfSIP}
                    onChange={(e) => setWhatIfSIP(Number(e.target.value))}
                    style={{ width: '100%' }}
                  />

                  <div className="muted" style={{ fontSize: 12, marginTop: 8, lineHeight: 1.4 }}>
                    Recommendation note: matching your risk profile improves suitability. (Chat will flag mismatches before investment actions.)
                  </div>
                </div>
              </>
            ) : null}
          
          <BottomNav />
        </div>
        </PhoneFrame>
      </div>
    </div>
  );
}

