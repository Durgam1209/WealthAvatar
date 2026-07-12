from __future__ import annotations

import math
from typing import Any, Dict


def _extract_latest_month(transactions: list[dict[str, Any]]) -> str | None:
    months = [t.get("month") for t in transactions if t.get("month")]
    if not months:
        return None
    # months are strings like "2026-06" so lexicographic works
    return sorted(set(months))[-1]


def _monthly_totals(transactions: list[dict[str, Any]]) -> Dict[str, Dict[str, float]]:
    totals: Dict[str, Dict[str, float]] = {}
    for t in transactions:
        m = t.get("month")
        cat = t.get("category")
        amt = t.get("amount", 0.0)
        if not m or not cat:
            continue
        totals.setdefault(m, {})
        totals[m][cat] = totals[m].get(cat, 0.0) + float(amt)
    return totals


def _compute_spend_volatility(transactions: list[dict[str, Any]]) -> float:
    # Compute volatility over last 3 months for total discretionary spend (exclude Salary and Investments)
    totals = _monthly_totals(transactions)
    months = sorted(totals.keys())
    last = months[-3:]
    if not last:
        return 0.0

    spend_per_month = []
    for m in last:
        cats = totals[m]
        total_spend = 0.0
        for cat, amt in cats.items():
            # amounts are negative for spends; salary/investments are positive/negative depending on seed.
            # We'll treat expenses as negative amounts and convert to absolute spend.
            if cat.lower() in {"salary", "investments"}:
                continue
            if amt < 0:
                total_spend += abs(amt)
        spend_per_month.append(total_spend)

    mean = sum(spend_per_month) / len(spend_per_month)
    if mean == 0:
        return 0.0
    variance = sum((x - mean) ** 2 for x in spend_per_month) / len(spend_per_month)
    stdev = math.sqrt(variance)

    # return coefficient of variation
    return stdev / mean


def build_financial_twin(user: Dict[str, Any]) -> Dict[str, Any]:
    transactions = user["transactions"]["transactions"]
    holdings = user["holdings"]
    account = user["account"]
    goals = user["goals"]

    latest_month = _extract_latest_month(transactions)
    totals = _monthly_totals(transactions)

    latest_cats = totals.get(latest_month, {}) if latest_month else {}
    latest_expenses = {}
    total_income = 0.0
    total_spend = 0.0

    for cat, amt in latest_cats.items():
        amt = float(amt)
        if cat.lower() == "salary":
            total_income += amt
        elif cat.lower() == "investments":
            # investments cashflow treated separately; for savings rate we consider contributions as savings
            # In this MVP, count absolute investment contribution as savings, not spend.
            pass
        else:
            if amt < 0:
                total_spend += abs(amt)
                latest_expenses[cat] = abs(amt)

    # investments in seed are negative cash out; treat absolute as savings/investment contributions
    total_invest_contrib = 0.0
    for t in transactions:
        if latest_month and t.get("month") != latest_month:
            continue
        if (t.get("category") or "").lower() == "investments":
            total_invest_contrib += abs(float(t.get("amount", 0.0)))

    # savings rate = (income - discretionary spend)/income, including investments as part of "savings" bucket.
    savings_rate = 0.0
    if total_income > 0:
        savings_rate = max(0.0, (total_income - total_spend) / total_income)

    spend_volatility = _compute_spend_volatility(transactions)

    total_goal_target = sum(g["targetAmount"] for g in goals)
    twin_goals = []
    for g in goals:
        current = float(g["currentValue"])
        target = float(g["targetAmount"])
        progress_pct = (current / target * 100.0) if target > 0 else 0.0
        twin_goals.append(
            {
                "goalId": g["goalId"],
                "title": g["title"],
                "targetAmount": target,
                "currentValue": current,
                "targetDate": g["targetDate"],
                "monthlyContribution": g.get("monthlyContribution", 0),
                "progressPct": progress_pct,
            }
        )

    # Asset allocation vs a simple model portfolio for risk profile
    risk_label = user["profile"]["riskLabel"]
    # Model portfolio template
    model = {
        "Conservative": {"stocks": 20, "mutualFunds": 40, "fd": 25, "epf": 15, "cash": 0},
        "Moderate": {"stocks": 35, "mutualFunds": 35, "fd": 15, "epf": 15, "cash": 0},
        "Aggressive": {"stocks": 55, "mutualFunds": 25, "fd": 5, "epf": 15, "cash": 0},
    }.get(risk_label, {"stocks": 35, "mutualFunds": 35, "fd": 15, "epf": 15, "cash": 0})

    # Convert holdings amounts to allocation percent (excluding cash if 0 model)
    total_assets = sum(float(v.get("amount", 0.0)) for v in holdings.values())
    actual_alloc: Dict[str, float] = {}
    if total_assets > 0:
        for k, v in holdings.items():
            actual_alloc[k] = float(v.get("allocationPct", 0.0))
    # Compare only the keys in model
    allocation_mismatch = {}
    mismatch_score = 0.0
    for k, target_pct in model.items():
        actual_pct = actual_alloc.get(k, 0.0)
        diff = actual_pct - float(target_pct)
        allocation_mismatch[k] = diff
        mismatch_score += abs(diff)

    # Twin for chat context
    return {
        "latestMonth": latest_month,
        "latestExpenses": latest_expenses,
        "totalIncomeLatestMonth": total_income,
        "totalSpendLatestMonth": total_spend,
        "totalInvestContributionLatestMonth": total_invest_contrib,
        "savingsRate": savings_rate,
        "spendVolatilityCoeff": spend_volatility,
        "goals": twin_goals,
        "assetAllocation": {
            "riskModel": model,
            "actualAllocationPct": actual_alloc,
            "mismatchScore": mismatch_score,
        },
        "account": account,
    }
