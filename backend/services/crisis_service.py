import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), "..", "..", "engine"))

from services.ai_service import generate_crisis_triage


def run_crisis_triage(crisis_type: str, state: str, user_context: dict = None) -> dict:
    """
    Orchestrate crisis triage:
    1. Try to get base playbook from Sumedh's engine (graceful fallback if not ready).
    2. Pass to Claude for personalized AI enrichment.
    """
    base_playbook = {}
    try:
        from crisis_engine import get_crisis_playbook  # type: ignore
        base_playbook = get_crisis_playbook(crisis_type, state)
    except ImportError:
        pass  # Engine not ready — Claude generates full triage

    # Claude generates (or enriches) the triage steps
    ai_result = generate_crisis_triage(crisis_type, state, user_context)

    # If engine provided base steps and Claude also returned steps, prefer Claude's
    # (Claude personalizes based on user context; engine provides the skeleton)
    if base_playbook.get("dont_sign_warning") and not ai_result.get("dont_sign_warning"):
        ai_result["dont_sign_warning"] = base_playbook["dont_sign_warning"]

    return ai_result
