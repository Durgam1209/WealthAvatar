# Wealth Avatar (MVP)

AI-powered digital wealth management assistant embedded in a bank mobile app experience.

## Tech stack
- **Backend:** Python **FastAPI** (mock data + twin computations + rules-based insights + Claude chat)
- **Frontend:** React (mobile-responsive UI in a “phone frame”)

## Features mapped to requirements
- **Conversational Avatar Interface**: Chat UI with persona **Nova** + session-persistent memory (client-side) + backend prompt injection with mock financial context.
- **Financial Twin (Mock Data)**: Demo users with balances, transactions, holdings, and goals; computes savings rate, spend volatility, goal progress %, and asset allocation vs risk-model.
- **Proactive Insight Engine**: Rules-based insight cards (overspending, idle cash, goal drift, rebalancing, positive reinforcement). Each card can open chat with pre-loaded context.
- **Goal-Based Planning View**: Goal progress bars + **What-if** slider for monthly SIP/ contribution and real-time projected completion date.
- **Risk Profiling & Suitability**: 5–7 question onboarding questionnaire; risk score (Conservative / Moderate / Aggressive). Chat checks suitability before investment-action suggestions.
- **Human Handoff**: Out-of-scope intent / threshold requests trigger a handoff response + mock “Book a call”.
- **Trust & Compliance**: Visible disclaimer banner and a **Recommendation Log** screen.

## Repo layout (created by this MVP)
- `backend/`
  - `app/main.py`
  - `app/routes.py`
  - `app/models.py`
  - `app/data/mock_data.py`
  - `app/services/*`
- `frontend/`
  - `src/*` (React app)

## How to run (local)
> Windows/PowerShell commands included (matches your setup).

### Terminal 1: Backend (FastAPI)
```bat
cd backend
py -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
Backend base URL: `http://127.0.0.1:8000`

### Terminal 2: Frontend (React + Vite)
```bat
cd frontend
npm install
npm run dev
```
Frontend base URL printed by Vite (usually `http://localhost:5173`).


## Claude / LLM usage
- Backend chat uses **Claude** if `CLAUDE_API_KEY` is set.
- Without an API key, it uses a **deterministic fallback** that still enforces the required **“Why”** section referencing the mock data points.

## Endpoints
- `GET /profile?userId=...`
- `GET /transactions?userId=...`
- `GET /goals?userId=...`
- `GET /insights?userId=...`
- `POST /chat` (body contains `userId`, `sessionId`, `message`)
- `GET /recommendations-log?userId=...`

