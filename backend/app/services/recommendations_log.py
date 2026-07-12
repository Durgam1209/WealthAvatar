from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List

# In-memory audit log for MVP
# Keyed by userId for /recommendations-log
_LOG: Dict[str, List[Dict[str, Any]]] = {}


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def append_recommendation(
    *,
    userId: str,
    sessionId: str | None,
    category: str,
    message: str,
    rationale: str,
    why: str,
) -> None:
    entry = {
        "timestamp": _now_iso(),
        "userId": userId,
        "sessionId": sessionId,
        "category": category,
        "message": message,
        "rationale": rationale,
        "why": why,
    }
    _LOG.setdefault(userId, []).append(entry)


def get_recommendations_log(userId: str) -> List[Dict[str, Any]]:
    return list(_LOG.get(userId, []))
