import sys
import os

# Add repo root to path so engine package can be imported as `engine.risk_engine`
_REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if _REPO_ROOT not in sys.path:
    sys.path.insert(0, _REPO_ROOT)

from services.ai_service import analyze_risk


def run_risk_analysis(survey: dict, circle_members_data: list[dict]) -> dict:
    """
    Orchestrate risk analysis:
    1. Try to call the engine for base scoring (graceful fallback if not ready).
    2. Pass everything to Claude for AI narrative and enrichment.
    """
    # Step 1: Try engine — safe import so backend works even if engine is not ready
    engine_result = {}
    try:
        from engine.risk_engine import calculate_risk_score  # type: ignore
        engine_result = calculate_risk_score(survey)
    except Exception:
        pass  # Engine not ready or errored — Claude will handle scoring

    # Step 2: Enrich with Claude AI
    ai_result = analyze_risk(survey, circle_members_data)

    # Step 3: Merge — engine score takes precedence if available and non-zero
    engine_score = engine_result.get("risk_score")
    if engine_score is not None and engine_score > 0:
        ai_result["risk_score"] = engine_score
    # Ensure minimum score of 20 — no one has zero financial risk
    if not ai_result.get("risk_score"):
        ai_result["risk_score"] = 20
    ai_result["risk_score"] = max(20, ai_result["risk_score"])
    if engine_result.get("gaps"):
        ai_result["gaps"] = engine_result["gaps"]
    if engine_result.get("poverty_tax_annual") is not None:
        ai_result["poverty_tax_annual"] = engine_result["poverty_tax_annual"]

    return ai_result


def compute_group_risk(member_results: list[dict]) -> dict:
    """
    Compute group-level risk metrics from individual risk results.
    Falls back to simple averaging if Sumedh's engine is not ready.
    """
    try:
        from engine.risk_engine import calculate_group_risk  # type: ignore
        return calculate_group_risk(member_results)
    except Exception:
        pass

    # Fallback: simple average
    if not member_results:
        return {"group_risk_score": 0, "gap_summary": [], "total_unprotected_risk": 0}

    avg = sum(m.get("risk_score", 0) for m in member_results) // len(member_results)
    total_risk = sum(
        sum(g.get("risk_amount", 0) for g in m.get("gaps", []))
        for m in member_results
    )
    return {
        "group_risk_score": avg,
        "total_unprotected_risk": total_risk,
        "total_poverty_tax": sum(m.get("poverty_tax_annual", 0) for m in member_results),
        "total_unclaimed_benefits": 0,
        "gap_summary": [],
    }
