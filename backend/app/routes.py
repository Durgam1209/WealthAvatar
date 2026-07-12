from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from .data.mock_data import get_user_data
from .services.financial_twin import build_financial_twin
from .services.insights_engine import build_insights_for_user
from .services.risk import risk_profile_from_responses
from .services.chat_service import chat_with_nova
from .services.recommendations_log import get_recommendations_log, append_recommendation

router = APIRouter()


class ChatRequest(BaseModel):
    userId: str
    sessionId: str
    message: str


class RiskOnboardingRequest(BaseModel):
    userId: str
    answers: dict


@router.get("/profile")
def profile(userId: str):
    user = get_user_data(userId)
    if not user:
        raise HTTPException(status_code=404, detail="Unknown userId")

    twin = build_financial_twin(user)
    account = user.get("account", {})
    profile_data = dict(user["profile"])
    profile_data["financialSummary"] = {
        "savingsRatePercent": round(float(twin.get("savingsRate", 0.0)) * 100, 1),
        "bankBalance": float(account.get("bankBalance", 0.0)),
        "averageMonthlyIncome": float(account.get("averageMonthlyIncome", 0.0)),
        "idleCashMonths": float(account.get("idleCashMonths", 0.0)),
        "latestMonth": twin.get("latestMonth"),
    }
    return profile_data


@router.get("/transactions")
def transactions(userId: str):
    user = get_user_data(userId)
    if not user:
        raise HTTPException(status_code=404, detail="Unknown userId")
    return user["transactions"]


@router.get("/goals")
def goals(userId: str):
    user = get_user_data(userId)
    if not user:
        raise HTTPException(status_code=404, detail="Unknown userId")
    return user["goals"]


@router.get("/insights")
def insights(userId: str):
    user = get_user_data(userId)
    if not user:
        raise HTTPException(status_code=404, detail="Unknown userId")

    twin = build_financial_twin(user)
    generated = build_insights_for_user(user=user, twin=twin)

    # Audit logging for compliance: log each Dashboard insight with its why + rationale.
    # Note: sessionId is unknown here; store None.
    for ins in generated:
        append_recommendation(
            userId=userId,
            sessionId=None,
            category="insight",
            message=ins.get("title", "insight"),
            rationale=f"Dashboard /insights generated insight type={ins.get('type')}",
            why=ins.get("why", ""),
        )

    return generated



@router.post("/chat")
def chat(req: ChatRequest):
    user = get_user_data(req.userId)
    if not user:
        raise HTTPException(status_code=404, detail="Unknown userId")

    twin = build_financial_twin(user)
    insights = build_insights_for_user(user=user, twin=twin)

    response = chat_with_nova(
        user=user,
        twin=twin,
        insights=insights,
        sessionId=req.sessionId,
        message=req.message,
        userId=req.userId,
    )
    return response


@router.get("/recommendations-log")
def recommendations_log(userId: str):
    user = get_user_data(userId)
    if not user:
        raise HTTPException(status_code=404, detail="Unknown userId")
    return get_recommendations_log(userId=userId)


@router.post("/profile/risk")
def profile_risk(req: RiskOnboardingRequest):
    user = get_user_data(req.userId)
    if not user:
        raise HTTPException(status_code=404, detail="Unknown userId")

    risk = risk_profile_from_responses(req.answers)
    # MVP: return computed risk; frontend will treat it as session state.
    return {"risk": risk}
