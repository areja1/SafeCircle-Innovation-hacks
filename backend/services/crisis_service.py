import sys
import os

# Add repo root to path so engine package can be imported as `engine.crisis_engine`
_REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if _REPO_ROOT not in sys.path:
    sys.path.insert(0, _REPO_ROOT)

from services.ai_service import generate_crisis_triage


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

    # If engine provided base steps and Claude also returned steps, prefer Claude's
    # (Claude personalizes based on user context; engine provides the skeleton)
    if base_playbook.get("dont_sign_warning") and not ai_result.get("dont_sign_warning"):
        ai_result["dont_sign_warning"] = base_playbook["dont_sign_warning"]

    return ai_result
