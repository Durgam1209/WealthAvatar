import React, { useMemo, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import GoalPlanning from './pages/GoalPlanning';
import Chat from './pages/Chat';
import RecommendationLog from './pages/RecommendationLog';

import { ApiClient } from './api/client';

export type RiskLabel = 'Conservative' | 'Moderate' | 'Aggressive';

export type SessionState = {
  userId: string;
  sessionId: string;
  riskLabel?: RiskLabel;
  questionnaire?: Record<string, any>;
  chatHistory: { role: 'user' | 'assistant'; content: string }[];
};

const SESSION_KEY = 'wealth_avatar_session_v1';

function newSession(userId: string): SessionState {
  return {
    userId,
    sessionId: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    riskLabel: undefined,
    questionnaire: undefined,
    chatHistory: [],
  };
}

function loadSession(): SessionState {
  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) return newSession('userA');
  try {
    return JSON.parse(raw);
  } catch {
    return newSession('userA');
  }
}

function saveSession(s: SessionState) {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(s));
}

export default function App() {
  const [session, setSession] = useState<SessionState>(() => loadSession());

  const api = useMemo(() => new ApiClient(import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'), []);

  React.useEffect(() => {
    saveSession(session);
  }, [session]);

  const setRiskAndQuestionnaire = (riskLabel: RiskLabel, questionnaire: Record<string, any>) => {
    setSession((prev) => ({
      ...prev,
      riskLabel,
      questionnaire,
    }));
  };

  const appendChat = (role: 'user' | 'assistant', content: string) => {
    setSession((prev) => ({
      ...prev,
      chatHistory: [...prev.chatHistory, { role, content }],
    }));
  };

  return (
    <div className="appRoot">
      <Routes>
        <Route path="/" element={<Navigate to="/onboarding" replace />} />
        <Route
          path="/onboarding"
          element={<Onboarding api={api} session={session} onComplete={setRiskAndQuestionnaire} setSession={setSession} />}
        />
        <Route
          path="/dashboard"
          element={<Dashboard api={api} session={session} setSession={setSession} />}
        />
        <Route
          path="/goals"
          element={<GoalPlanning api={api} session={session} />}
        />
        <Route
          path="/chat"
          element={<Chat api={api} session={session} setSession={setSession} appendChat={appendChat} />}
        />
        <Route
          path="/recommendations"
          element={<RecommendationLog api={api} session={session} />}
        />
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Routes>
    </div>
  );
}
