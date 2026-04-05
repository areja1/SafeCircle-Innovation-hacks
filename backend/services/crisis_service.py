import sys
import os
from typing import Any

# Add repo root to path so engine package can be imported as `engine.crisis_engine`
_REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if _REPO_ROOT not in sys.path:
    sys.path.insert(0, _REPO_ROOT)

from services.ai_service import generate_crisis_triage


def _to_non_negative_amount(value: Any) -> float:
    if isinstance(value, (int, float)):
        return max(float(value), 0.0)
    if isinstance(value, str):
        cleaned = value.replace("$", "").replace(",", "").strip()
        if not cleaned:
            return 0.0
        try:
            return max(float(cleaned), 0.0)
        except ValueError:
            return 0.0
    return 0.0


def _normalize_savings_fields(ai_result: dict) -> dict:
    breakdown_raw = ai_result.get("savings_breakdown")
    if not isinstance(breakdown_raw, list):
        breakdown_raw = []

    normalized_breakdown = []
    breakdown_total = 0.0

    for index, item in enumerate(breakdown_raw):
        if not isinstance(item, dict):
            continue

        amount = _to_non_negative_amount(item.get("estimated_amount"))
        category = str(item.get("category") or f"category_{index + 1}")
        category_label = str(item.get("category_label") or category.replace("_", " ").title())
        description = str(item.get("description") or "")
        timeframe = item.get("timeframe")

        normalized_breakdown.append({
            "category": category,
            "category_label": category_label,
            "estimated_amount": round(amount, 2),
            "description": description,
            "timeframe": str(timeframe) if timeframe is not None else None,
        })
        breakdown_total += amount

    if normalized_breakdown:
        ai_result["savings_breakdown"] = normalized_breakdown
        ai_result["estimated_total_savings"] = int(round(breakdown_total))
    else:
        ai_result["savings_breakdown"] = []
        ai_result["estimated_total_savings"] = int(
            round(_to_non_negative_amount(ai_result.get("estimated_total_savings")))
        )

    return ai_result


def run_crisis_triage(crisis_type: str, state: str, user_context: dict = None) -> dict:
    """
    Orchestrate crisis triage:
    1. Try to get base playbook from the engine (graceful fallback if not ready).
    2. Pass to Claude for personalized AI enrichment.
    """
    base_playbook = {}
    try:
        from engine.crisis_engine import get_crisis_playbook  # type: ignore
        base_playbook = get_crisis_playbook(crisis_type, state)
    except Exception:
        pass  # Engine not ready — Claude generates full triage

    # Claude generates (or enriches) the triage steps
    ai_result = generate_crisis_triage(crisis_type, state, user_context)
    ai_result = _normalize_savings_fields(ai_result)

    # If engine provided base steps and Claude also returned steps, prefer Claude's
    # (Claude personalizes based on user context; engine provides the skeleton)
    if base_playbook.get("dont_sign_warning") and not ai_result.get("dont_sign_warning"):
        ai_result["dont_sign_warning"] = base_playbook["dont_sign_warning"]

    return ai_result
