from __future__ import annotations

from typing import Any, Dict, List


def _format_pct(x: float) -> str:
    return f"{x:.0f}%"


def _discuss_context(insight: Dict[str, Any], user: Dict[str, Any], twin: Dict[str, Any]) -> str:
    """Context shown in the card (collapsible) and preloaded into chat.

    Important: this must NOT repeat the insight.why verbatim (which is already shown on the card).
    """
    title = insight["title"]
    risk = user["profile"]["riskLabel"]
    latest_month = twin.get("latestMonth", "")
    return (
        f"Insight: {title}\n"
        f"User risk profile: {risk}\n"
        f"Latest month in data: {latest_month}\n"
        f"Request: Discuss what Nova recommends and what actions are suitable for risk profile '{risk}'."
    )


def build_insights_for_user(user: Dict[str, Any], twin: Dict[str, Any]) -> List[Dict[str, Any]]:
    savings_rate = float(twin.get("savingsRate", 0.0))
    spend_vol = float(twin.get("spendVolatilityCoeff", 0.0))
    account = twin.get("account", {})
    idle_cash_months = float(account.get("idleCashMonths", 0.0))
    latest_expenses = twin.get("latestExpenses", {}) or {}
    goals = twin.get("goals", []) or []

    assets = twin.get("assetAllocation", {})
    mismatch_score = float(assets.get("mismatchScore", 0.0))
    risk_label = user["profile"]["riskLabel"]

    insights: List[Dict[str, Any]] = []

    # Overspending / volatility alert (rules-based)
    if spend_vol >= 0.25:
        top_cat = None
        if latest_expenses:
            top_cat = sorted(latest_expenses.items(), key=lambda kv: kv[1], reverse=True)[0][0]
        title = "Spending pattern looks volatile"
        why = (
            f"Because your spend volatility (CV) is {spend_vol:.2f} over the last 3 months, and your largest recent expense category is '{top_cat or 'N/A'}'."
        )
        insights.append(
            {
                "insightId": "ins_spend_volatile",
                "type": "alert",
                "title": title,
                "why": why,
                "severity": "medium",
                "discussContext": _discuss_context({"title": title, "why": why}, user=user, twin=twin),
            }
        )
    else:
        title = "Spending stays consistent"
        why = f"Because your spend volatility (CV) is {spend_vol:.2f}, indicating relatively stable monthly discretionary spend."
        insights.append(
            {
                "insightId": "ins_spend_stable",
                "type": "positive",
                "title": title,
                "why": why,
                "severity": "low",
                "discussContext": _discuss_context({"title": title, "why": why}, user=user, twin=twin),
            }
        )

    # Idle cash alert
    if idle_cash_months >= 1.0:
        title = "Idle cash detected"
        why = (
            f"Because you have ~{idle_cash_months:.1f} months of idle cash based on your mock account balance."
        )
        insights.append(
            {
                "insightId": "ins_idle_cash",
                "type": "alert",
                "title": title,
                "why": why,
                "severity": "medium",
                "discussContext": _discuss_context({"title": title, "why": why}, user=user, twin=twin),
            }
        )

    # Goal progress / drift warnings + positive reinforcement
    for g in goals:
        progress = float(g.get("progressPct", 0.0))
        title = f"Goal check: {g.get('title')}"
        if progress < 35:
            why = (
                f"Because your '{g.get('title')}' progress is {progress:.0f}% (current {g.get('currentValue')} / target {g.get('targetAmount')})."
            )
            insights.append(
                {
                    "insightId": f"ins_goal_drift_{g.get('goalId')}",
                    "type": "warning",
                    "title": title + " — needs extra focus",
                    "why": why,
                    "severity": "high",
                    "discussContext": _discuss_context({"title": title, "why": why}, user=user, twin=twin),
                }
            )
        elif progress >= 60:
            why = (
                f"You're ahead on '{g.get('title')}' with {progress:.0f}% progress (current {g.get('currentValue')} / target {g.get('targetAmount')})."
            )
            insights.append(
                {
                    "insightId": f"ins_goal_ahead_{g.get('goalId')}",
                    "type": "positive",
                    "title": title + " — you're ahead",
                    "why": why,
                    "severity": "low",
                    "discussContext": _discuss_context({"title": title, "why": why}, user=user, twin=twin),
                }
            )

    # Rebalancing suggestion
    if mismatch_score >= 20:
        title = "Rebalancing opportunity"
        model = assets.get("riskModel", {}) or {}
        why = f"Because your current asset allocation vs the {risk_label} model has a total mismatch score of {mismatch_score:.1f}."
        insights.append(
            {
                "insightId": "ins_rebalance",
                "type": "suggestion",
                "title": title,
                "why": why,
                "severity": "medium",
                "discussContext": _discuss_context({"title": title, "why": why}, user=user, twin=twin),
            }
        )

    return insights[:6]

