# Wealth Avatar MVP - TODO

## Backend (FastAPI)
- [x] Create backend scaffold (FastAPI app, routing, CORS)
- [x] Add Pydantic models (requests/responses) (light MVP)
- [x] Implement mock data for 2 demo users
- [x] Implement financial twin engine
- [x] Implement rules-based insights engine
- [x] Implement risk profiling + suitability flags
- [x] Implement chat service (Claude integration w/ deterministic fallback + “Why” enforcement)
- [x] Implement out-of-scope/handoff detection
- [x] Implement recommendations log + endpoint

## Frontend (React)
- [x] Create React scaffold (mobile-responsive phone frame)
- [x] Build onboarding (5-7 question risk questionnaire)
- [x] Build dashboard (insight cards + Discuss with Nova)
- [x] Build goal planning view (progress bars + What-if SIP slider)
- [x] Build chat UI (avatar Nova + session memory)
- [x] Build recommendations log screen
- [x] Add disclaimer banner (always visible)

## Run/Validation
- [ ] Smoke test end-to-end flow locally
- [ ] Verify: every chat answer includes “Why” with specific data points
- [ ] Verify: handoff message triggers for out-of-scope / threshold requests
