from __future__ import annotations

import os
import re
from typing import Any, Dict, List

from .recommendations_log import append_recommendation


def _is_out_of_scope(message: str) -> bool:
    m = message.lower()
    keywords = [
        "tax",
        "estate",
        "wills",
        "complaint",
        "grievance",
        "legal advice",
        "legal",
        "customer care",
        "chargeback",
    ]
    return any(k in m for k in keywords)


def _exceeds_transaction_threshold(message: str) -> bool:
    # MVP: detect intent to move unusually large amounts
    # e.g. "invest 5000000" "transfer 20000000"
    nums = [int(x) for x in re.findall(r"(\d[\d,]*)", message.replace(",", "")) if len(x) > 0]
    threshold = 5_000_000
    return any(n >= threshold for n in nums)


def _extract_data_points_for_why(user: Dict[str, Any], twin: Dict[str, Any], insights: List[Dict[str, Any]]) -> List[str]:
    dp = []
    profile = user.get("profile", {})
    dp.append(f"risk profile: {profile.get('riskLabel')}")
    dp.append(f"savings rate: {twin.get('savingsRate', 0):.2f}")
    dp.append(f"spend volatility (CV): {twin.get('spendVolatilityCoeff', 0):.2f}")

    # include latest expenses top category if any
    latest_exp = twin.get("latestExpenses") or {}
    if latest_exp:
        top_cat, top_amt = sorted(latest_exp.items(), key=lambda kv: kv[1], reverse=True)[0]
        dp.append(f"largest recent expense category '{top_cat}' at {int(top_amt)}")

    # include goal progress for best matching insight
    goals = twin.get("goals") or []
    if goals:
        best = sorted(goals, key=lambda g: float(g.get("progressPct", 0.0)))[0]
        dp.append(f"goal progress: '{best.get('title')}' at {best.get('progressPct', 0):.0f}%")

    # include first insight reason if exists
    if insights:
        dp.append(f"selected insight: {insights[0].get('title')} ({insights[0].get('why')})")

    return dp


def _claude_available() -> bool:
    return bool(os.getenv("CLAUDE_API_KEY"))


def _claude_chat(prompt: str) -> str:
    # We avoid pulling in a heavy SDK. Use a simple HTTP call to Anthropic API.
    try:
        import httpx  # installed
    except Exception:
        return ""

    api_key = os.getenv("CLAUDE_API_KEY", "")
    if not api_key:
        return ""

    url = "https://api.anthropic.com/v1/messages"
    headers = {
        "x-api-key": api_key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
    }

    payload = {
        "model": os.getenv("CLAUDE_MODEL", "claude-3-5-sonnet-latest"),
        "max_tokens": 500,
        "temperature": 0.3,
        "system": "",
        "messages": [{"role": "user", "content": prompt}],
    }

    r = httpx.post(url, headers=headers, json=payload, timeout=20)
    if not r.ok:
        # If Claude returns 400 (usually invalid payload/model/format), gracefully fall back.
        return ""

    data = r.json()

    text_parts = []
    for c in data.get("content", []) or []:
        if c.get("type") == "text":
            text_parts.append(c.get("text", ""))

    return "\n".join(text_parts).strip()


def _ensure_why_section(answer: str, why_lines: List[str]) -> str:
    why_text = "Why: " + " | ".join(why_lines)
    if re.search(r"\bwhy\s*:", answer, flags=re.IGNORECASE):
        return answer + "\n\n" + why_text
    return answer + "\n\n" + why_text


def _deterministic_answer(
    user: Dict[str, Any],
    twin: Dict[str, Any],
    insights: List[Dict[str, Any]],
    message: str,
    *,
    suitabilityMismatch: Dict[str, Any] | None = None,
) -> Dict[str, Any]:
    risk = user["profile"]["riskLabel"]
    savings = twin.get("savingsRate", 0.0)
    vol = twin.get("spendVolatilityCoeff", 0.0)
    goals = twin.get("goals") or []

    msg = message.lower()

    # Pick relevant goal (lowest progress for "improve completion" intent; highest progress for "celebrate")
    lowest_goal = sorted(goals, key=lambda g: float(g.get("progressPct", 0.0)))[0] if goals else None
    highest_goal = sorted(goals, key=lambda g: float(g.get("progressPct", 0.0)), reverse=True)[0] if goals else None

    # Choose which topic the user is asking about, so fallback isn't generic.
    # (This only affects deterministic fallback; Claude path stays unchanged.)
    intent = "general"
    if re.search(r"\b(over(spending)?|overspend|spend|volatility|cv|volatile)\b", msg):
        intent = "spending"
    elif re.search(r"\b(goal|retirement|home|education|drift|complete|completion|projected)\b", msg):
        intent = "goals"
    elif re.search(r"\b(idle cash|cash|liquid|emergency)\b", msg):
        intent = "idle_cash"
    elif re.search(r"\b(rebalance|asset allocation|allocation|stocks|equity|fd|fixed deposit|bond|invest|sip|allocate|buy|sell)\b", msg):
        intent = "investment"

    # Build response by intent
    goal_line = ""
    if lowest_goal and intent in ("goals", "general", "investment"):
        goal_line = (
            f"Top focus: '{lowest_goal['title']}' is at {lowest_goal['progressPct']:.0f}% "
            f"({lowest_goal['currentValue']:,} / {lowest_goal['targetAmount']:,})."
        )
    elif highest_goal and intent == "goals":
        # If the user frames it as "I'm ahead" we can also mention the best goal.
        goal_line = (
            f"You’re also doing well on '{highest_goal['title']}' at {highest_goal['progressPct']:.0f}%."
        )

    base_header = f"As Nova, here’s a risk-appropriate take based on your request: '{message}'.\nYour profile is **{risk}**."

    if intent == "spending":
        spend_line = (
            f"\n- Savings rate is about **{savings * 100:.0f}%** of your latest income bucket."
            f"\n- Spend volatility (CV) is **{vol:.2f}**."
        )
        if vol >= 0.25:
            focus_line = "Because your spending is relatively volatile, prioritize controlling discretionary categories this month."
        else:
            focus_line = "Because your spending is relatively consistent, focus on keeping the savings rate steady while you push contributions to goals."
        next_step = "Next step: audit the largest expense category and decide one small cut or offset to protect savings."
        answer = base_header + spend_line + "\n" + focus_line + "\n" + next_step

    elif intent == "idle_cash":
        idle_cash_months = float((twin.get("account") or {}).get("idleCashMonths", 0.0))
        answer = (
            base_header
            + f"\n\nYou have about **{idle_cash_months:.1f} months** of idle cash."
            + "\nNext step: consider reallocating part of idle cash into your suitable goals (or a balanced, liquidity-respecting allocation) while keeping an emergency buffer."
        )

    elif intent == "investment":
        answer = (
            base_header
            + f"\n\nGiven your request, I’ll keep any allocation thinking aligned to a **{risk}** profile."
            + f"\n- Spend volatility (CV) is **{vol:.2f}**, so we avoid overly aggressive discretionary swings."
            + (f"\n{goal_line}" if goal_line else "")
            + "\nNext step: increase SIP/contributions gradually (not all at once) toward the lowest-progress goal, and consider a balanced allocation vs model to reduce mismatch."
        )

    elif intent == "goals":
        if lowest_goal:
            answer = (
                base_header
                + f"\n\nGoal completion focus:"
                + f"\n- '{lowest_goal['title']}' is at {lowest_goal['progressPct']:.0f}%."
                + f"\n- Practical next step: increase monthly SIP slightly and keep discretionary spending steady to avoid savings-rate drift."
            )
        else:
            answer = (
                base_header
                + "\n\nI can’t see goals in your data—share which goal matters most and I’ll project a completion plan."
            )

    else:
        # general
        answer = (
            base_header
            + f"\n\n- Savings rate is about **{savings * 100:.0f}%** of your latest income bucket."
            + f"\n- Spend volatility (CV) is **{vol:.2f}**."
            + (f"\n{goal_line}" if goal_line else "")
            + "\nPractical next step: choose one concrete lever—either adjust SIP for the weakest goal or protect savings by trimming the largest expense category."
        )

    why_lines = _extract_data_points_for_why(user, twin, insights)
    answer = _ensure_why_section(answer, why_lines)

    if re.search(r"\b(explain|why|reason|details|break down)\b", message.lower()):
        answer = (
            answer
            + "\n\nExplanation: I tailored this fallback to the detected intent (spending vs goals vs cash vs investment) and grounded it in your risk profile, savings rate, spend volatility, and the most relevant goal/proxy data."
        )

    if suitabilityMismatch and suitabilityMismatch.get("note"):
        answer = answer + f"\n\n{suitabilityMismatch['note']}"

    # Map suggestion category for logging/UI
    suggestion_category = (
        "spending" if intent == "spending"
        else "goals" if intent == "goals"
        else "idle_cash" if intent == "idle_cash"
        else "investment" if intent == "investment"
        else "planning"
    )

    return {
        "reply": answer,
        "handoff": False,
        "suggestionCategory": suggestion_category,
        "rationale": "Deterministic fallback (intent-specific) grounded in computed twin metrics.",
        "why": " | ".join(why_lines),
        "suitabilityMismatch": suitabilityMismatch or {"isMismatch": False, "riskLabel": risk, "note": ""},
    }


def _compute_suitability_mismatch(*, risk_label: str, message: str) -> Dict[str, Any]:
    m = message.lower()
    aggressive_intent = bool(
        re.search(
            r"\b(stocks|equity|aggressive|high[-\s]?risk|growth|rebalance|buy|sell)\b",
            m,
        )
    )
    conservative_intent = bool(
        re.search(r"\b(fd|fixed deposit|low[-\s]?risk|guaranteed|bond|debt|stable)\b", m)
    )

    if risk_label == "Moderate":
        if aggressive_intent and not conservative_intent:
            return {
                "isMismatch": True,
                "riskLabel": risk_label,
                "note": "Suitability mismatch: Your request leans more aggressive than a Moderate profile—consider maintaining a balanced allocation (stable + growth).",
            }
        if conservative_intent and not aggressive_intent:
            return {
                "isMismatch": True,
                "riskLabel": risk_label,
                "note": "Suitability mismatch: Your request leans more conservative than a Moderate profile—confirm whether you’re optimizing for growth or capital preservation.",
            }
        return {
            "isMismatch": False,
            "riskLabel": risk_label,
            "note": "Suitability check: Your request is broadly compatible with a Moderate profile.",
        }

    if risk_label == "Conservative" and aggressive_intent and not conservative_intent:
        return {
            "isMismatch": True,
            "riskLabel": risk_label,
            "note": "Suitability flag: Your request appears more aggressive than a Conservative profile—consider a more stable allocation.",
        }

    if risk_label == "Aggressive" and conservative_intent and not aggressive_intent:
        return {
            "isMismatch": True,
            "riskLabel": risk_label,
            "note": "Suitability flag: Your request is more conservative than an Aggressive profile—confirm the goal horizon and expected volatility.",
        }

    return {
        "isMismatch": False,
        "riskLabel": risk_label,
        "note": "Suitability flag: Your request aligns reasonably with your risk profile.",
    }


def chat_with_nova(
    *,
    user: Dict[str, Any],
    twin: Dict[str, Any],
    insights: List[Dict[str, Any]] ,
    sessionId: str,
    message: str,
    userId: str,
) -> Dict[str, Any]:
    # Human handoff detection
    if _is_out_of_scope(message) or _exceeds_transaction_threshold(message):
        handoff_msg = (
            "This request looks outside the scope of Wealth Avatar’s automated guidance. "
            "I’ll connect you to a human advisor.\n\n"
            "👉 **Book a call with your Relationship Manager** (mock action)."
        )

        append_recommendation(
            userId=userId,
            sessionId=sessionId,
            category="handoff",
            message=message,
            rationale="Out-of-scope intent or high-amount transaction request detected.",
            why="Out-of-scope/threshold rule triggered.",
        )

        return {
            "reply": handoff_msg,
            "handoff": True,
            "suggestionCategory": "handoff",
            "rationale": "Out-of-scope/threshold rule triggered.",
            "why": "handoff rule triggered.",
        }

    wants_investment_action = bool(
        re.search(r"\b(rebalance|invest|sip|allocate|allocation|buy|sell)\b", message.lower())
    )
    risk_label = user["profile"]["riskLabel"]

    suitabilityMismatch: Dict[str, Any] = {"isMismatch": False, "riskLabel": risk_label, "note": ""}
    suitability_note = ""
    if wants_investment_action:
        suitabilityMismatch = _compute_suitability_mismatch(risk_label=risk_label, message=message)
        suitability_note = suitabilityMismatch.get("note", "")

    # Deterministic fallback when Claude is not available
    if not _claude_available():
        result = _deterministic_answer(
            user=user,
            twin=twin,
            insights=insights,
            message=message,
            suitabilityMismatch=suitabilityMismatch,
        )

        if suitability_note:
            result["reply"] = result["reply"] + f"\n\n{suitability_note}"

        # Neutral UI signal: fallback used; explanations are still provided.
        result["generationMode"] = "fallback_used"
        result["fallbackNotice"] = "Some answers may use deterministic logic, but your request is still addressed with a clear Why."

        append_recommendation(
            userId=userId,
            sessionId=sessionId,
            category=result["suggestionCategory"],
            message=message,
            rationale=result["rationale"],
            why=result["why"],
        )
        return result

    # Claude path
    why_lines = _extract_data_points_for_why(user, twin, insights)
    system_context = (
        "You are Nova, a bank-embedded digital wealth advisor. "
        "You must answer the user's question using only the provided financial context. "
        "Every response must include a short 'Why:' section citing specific data points used. "
        "Keep it concise, numeric, and suitable.\n"
    )

    context = {
        "profile": user["profile"],
        "twin": {
            "savingsRate": twin.get("savingsRate", 0),
            "spendVolatilityCoeff": twin.get("spendVolatilityCoeff", 0),
            "latestExpenses": twin.get("latestExpenses", {}),
            "goals": twin.get("goals", []),
            "assetAllocation": twin.get("assetAllocation", {}),
            "account": twin.get("account", {}),
        },
        "insights": insights,
    }

    prompt = system_context + "Financial context (RAG-lite): " + str(context) + "\n\nUser message: " + message

    claude_answer = _claude_chat(prompt)
    if not claude_answer:
        # Claude failed -> fallback; keep UI neutral
        result = _deterministic_answer(user=user, twin=twin, insights=insights, message=message)
        if suitability_note:
            result["reply"] = result["reply"] + f"\n\n{suitability_note}"
        result["generationMode"] = "fallback_used"
        result["fallbackNotice"] = "Some answers may use deterministic logic, but your request is still addressed with a clear Why."
    else:
        enforced_reply = _ensure_why_section(claude_answer, why_lines)
        result = {
            "reply": enforced_reply,
            "handoff": False,
            "suggestionCategory": "planning",
            "rationale": "Claude response grounded in injected mock financial context.",
            "why": " | ".join(why_lines),
            "suitabilityMismatch": suitabilityMismatch,
        }
        result["generationMode"] = "claude"

    append_recommendation(
        userId=userId,
        sessionId=sessionId,
        category=result["suggestionCategory"],
        message=message,
        rationale=result["rationale"],
        why=result["why"],
    )

    return result

