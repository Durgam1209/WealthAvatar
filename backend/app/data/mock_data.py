from __future__ import annotations

from typing import Any, Dict


DEMO_USERS: Dict[str, Dict[str, Any]] = {
    "userA": {
        "profile": {
            "userId": "userA",
            "name": "Aarav",
            "personaName": "Nova",
            "riskLabel": "Moderate",
            "riskScore": 62,
            "questionnaireAnswers": {
                "timeHorizonYears": 7,
                "comfortableDrawdownPct": 12,
                "preferStability": True,
                "lossToleranceText": "Can tolerate short-term drops if long-term improves",
            },
        },
        "transactions": {
            "currency": "INR",
            "transactions": [
                {"month": "2026-06", "category": "Rent", "amount": -32000},
                {"month": "2026-06", "category": "Groceries", "amount": -7800},
                {"month": "2026-06", "category": "Dining", "amount": -5400},
                {"month": "2026-06", "category": "EMI", "amount": -16000},
                {"month": "2026-06", "category": "Utilities", "amount": -4200},
                {"month": "2026-06", "category": "Subscriptions", "amount": -1800},
                {"month": "2026-06", "category": "Salary", "amount": 120000},
                {"month": "2026-06", "category": "Investments", "amount": -25000},
                {"month": "2026-05", "category": "Rent", "amount": -32000},
                {"month": "2026-05", "category": "Groceries", "amount": -7300},
                {"month": "2026-05", "category": "Dining", "amount": -4100},
                {"month": "2026-05", "category": "EMI", "amount": -16000},
                {"month": "2026-05", "category": "Utilities", "amount": -3900},
                {"month": "2026-05", "category": "Subscriptions", "amount": -1700},
                {"month": "2026-05", "category": "Salary", "amount": 120000},
                {"month": "2026-05", "category": "Investments", "amount": -22000},
                {"month": "2026-04", "category": "Rent", "amount": -32000},
                {"month": "2026-04", "category": "Groceries", "amount": -7600},
                {"month": "2026-04", "category": "Dining", "amount": -4600},
                {"month": "2026-04", "category": "EMI", "amount": -16000},
                {"month": "2026-04", "category": "Utilities", "amount": -4100},
                {"month": "2026-04", "category": "Subscriptions", "amount": -1650},
                {"month": "2026-04", "category": "Salary", "amount": 120000},
                {"month": "2026-04", "category": "Investments", "amount": -24000},
            ]
        },
        "holdings": {
            "mutualFunds": {"amount": 180000, "allocationPct": 45},
            "stocks": {"amount": 90000, "allocationPct": 20},
            "fd": {"amount": 70000, "allocationPct": 15},
            "epf": {"amount": 60000, "allocationPct": 20},
            "cash": {"amount": 25000, "allocationPct": 0},
        },
        "account": {
            "bankBalance": 125000,
            "idleCashMonths": 1.2,
            "averageMonthlyIncome": 120000,
        },
        "goals": [
            {
                "goalId": "g1",
                "title": "Retirement",
                "type": "retirement",
                "targetAmount": 6000000,
                "targetDate": "2035-12-31",
                "currentValue": 2100000,
                "monthlyContribution": 25000,
            },
            {
                "goalId": "g2",
                "title": "Home Down Payment",
                "type": "home",
                "targetAmount": 1500000,
                "targetDate": "2029-06-30",
                "currentValue": 520000,
                "monthlyContribution": 18000,
            },
            {
                "goalId": "g3",
                "title": "Child's Education",
                "type": "education",
                "targetAmount": 900000,
                "targetDate": "2032-08-15",
                "currentValue": 240000,
                "monthlyContribution": 12000,
            },
        ],
    },
    "userB": {
        "profile": {
            "userId": "userB",
            "name": "Meera",
            "personaName": "Nova",
            "riskLabel": "Aggressive",
            "riskScore": 84,
            "questionnaireAnswers": {
                "timeHorizonYears": 10,
                "comfortableDrawdownPct": 25,
                "preferStability": False,
                "lossToleranceText": "Can handle volatility; prioritizing growth",
            },
        },
        "transactions": {
            "currency": "INR",
            "transactions": [
                {"month": "2026-06", "category": "Rent", "amount": -28000},
                {"month": "2026-06", "category": "Groceries", "amount": -7200},
                {"month": "2026-06", "category": "Dining", "amount": -7600},
                {"month": "2026-06", "category": "EMI", "amount": -9000},
                {"month": "2026-06", "category": "Travel", "amount": -9000},
                {"month": "2026-06", "category": "Salary", "amount": 150000},
                {"month": "2026-06", "category": "Investments", "amount": -42000},
                {"month": "2026-05", "category": "Rent", "amount": -28000},
                {"month": "2026-05", "category": "Groceries", "amount": -6800},
                {"month": "2026-05", "category": "Dining", "amount": -6100},
                {"month": "2026-05", "category": "EMI", "amount": -9000},
                {"month": "2026-05", "category": "Travel", "amount": -3000},
                {"month": "2026-05", "category": "Salary", "amount": 150000},
                {"month": "2026-05", "category": "Investments", "amount": -38000},
                {"month": "2026-04", "category": "Rent", "amount": -28000},
                {"month": "2026-04", "category": "Groceries", "amount": -7000},
                {"month": "2026-04", "category": "Dining", "amount": -6900},
                {"month": "2026-04", "category": "EMI", "amount": -9000},
                {"month": "2026-04", "category": "Travel", "amount": -4500},
                {"month": "2026-04", "category": "Salary", "amount": 150000},
                {"month": "2026-04", "category": "Investments", "amount": -40000},
            ]
        },
        "holdings": {
            "mutualFunds": {"amount": 260000, "allocationPct": 50},
            "stocks": {"amount": 220000, "allocationPct": 40},
            "fd": {"amount": 20000, "allocationPct": 5},
            "epf": {"amount": 18000, "allocationPct": 5},
            "cash": {"amount": 15000, "allocationPct": 0},
        },
        "account": {
            "bankBalance": 185000,
            "idleCashMonths": 0.6,
            "averageMonthlyIncome": 150000,
        },
        "goals": [
            {
                "goalId": "g1",
                "title": "Retirement",
                "type": "retirement",
                "targetAmount": 8000000,
                "targetDate": "2036-12-31",
                "currentValue": 3600000,
                "monthlyContribution": 42000,
            },
            {
                "goalId": "g2",
                "title": "Child's Education",
                "type": "education",
                "targetAmount": 1200000,
                "targetDate": "2031-02-28",
                "currentValue": 640000,
                "monthlyContribution": 24000,
            },
        ],
    },
}


def get_user_data(userId: str) -> Dict[str, Any] | None:
    return DEMO_USERS.get(userId)
