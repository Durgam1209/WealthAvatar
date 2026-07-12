from __future__ import annotations

from typing import Any, Dict


def risk_profile_from_responses(answers: Dict[str, Any]) -> Dict[str, Any]:
    """
    MVP scoring:
    - timeHorizonYears
    - comfortableDrawdownPct
    - preferStability (bool)
    Returns risk bucket + numeric score 0-100.
    """
    time_horizon = float(answers.get("timeHorizonYears", 5))
    drawdown = float(answers.get("comfortableDrawdownPct", 15))
    prefer_stability = bool(answers.get("preferStability", True))

    # Base from horizon
    horizon_score = min(40.0, (time_horizon / 10.0) * 40.0)  # 0..40

    # Base from drawdown tolerance
    drawdown_score = min(40.0, (drawdown / 30.0) * 40.0)  # 0..40

    # Stability preference
    stability_score = 20.0 if not prefer_stability else 5.0  # aggressive adds, stability subtracts

    score = horizon_score + drawdown_score + stability_score
    score = max(0.0, min(100.0, score))

    if score < 40:
        label = "Conservative"
    elif score < 70:
        label = "Moderate"
    else:
        label = "Aggressive"

    return {
        "riskLabel": label,
        "riskScore": round(score),
        "derived": {
            "timeHorizonYears": time_horizon,
            "comfortableDrawdownPct": drawdown,
            "preferStability": prefer_stability,
        },
    }
