import uuid
from fastapi import APIRouter, HTTPException, Depends
from models.schemas import CrisisStartRequest, StepCompleteRequest
from models.database import get_db
from routers.deps import get_current_user
from services.crisis_service import run_crisis_triage
from datetime import datetime, timezone

router = APIRouter()


@router.post("/start")
def start_crisis(body: CrisisStartRequest, current_user: dict = Depends(get_current_user)):
    """
    Start a crisis session.
    Calls Claude AI to generate personalized triage steps, saves session to DB.
    """
    db = get_db()
    user_id = current_user["id"]

    # Fetch user's risk survey for context if available
    surveys = (
        db.table("risk_surveys")
        .select("employment_type, drives_for_gig_apps, has_health_insurance, monthly_income")
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    user_context = surveys.data[0] if surveys.data else None

    triage = run_crisis_triage(body.crisis_type, body.state, user_context)

    steps = triage.get("steps", [])
    # Ensure all steps have a completed field
    for step in steps:
        step.setdefault("completed", False)

    session_id = str(uuid.uuid4())
    dont_sign_warning = triage.get("dont_sign_warning")

    result = db.table("crisis_sessions").insert({
        "id": session_id,
        "user_id": user_id,
        "crisis_type": body.crisis_type,
        "state": body.state,
        "triage_steps": steps,
        "completed_steps": [],
        "estimated_savings": triage.get("estimated_total_savings", 0),
        "dont_sign_warning": dont_sign_warning,
    }).execute()

    # Use the real DB timestamp; fall back to Python UTC if not returned
    started_at = (
        result.data[0]["started_at"]
        if result.data and result.data[0].get("started_at")
        else datetime.now(timezone.utc).isoformat()
    )

    return {
        "id": session_id,
        "crisis_type": body.crisis_type,
        "started_at": str(started_at),
        "steps": steps,
        "estimated_savings": triage.get("estimated_total_savings", 0),
        "dont_sign_warning": dont_sign_warning,
    }


@router.get("/{session_id}")
def get_crisis_session(session_id: str, current_user: dict = Depends(get_current_user)):
    """Retrieve a crisis session with all steps and completion status."""
    db = get_db()
    user_id = current_user["id"]

    session = (
        db.table("crisis_sessions")
        .select("*")
        .eq("id", session_id)
        .eq("user_id", user_id)
        .maybe_single()
        .execute()
    )

    if not session.data:
        raise HTTPException(status_code=404, detail="Crisis session not found")

    row = session.data
    completed_ids = set(row.get("completed_steps") or [])
    steps = row.get("triage_steps") or []

    for step in steps:
        step["completed"] = step["id"] in completed_ids

    return {
        "id": row["id"],
        "crisis_type": row["crisis_type"],
        "started_at": str(row["started_at"]),
        "steps": steps,
        "estimated_savings": row["estimated_savings"],
        "dont_sign_warning": row.get("dont_sign_warning"),
    }


@router.patch("/{session_id}/step")
def complete_step(
    session_id: str,
    body: StepCompleteRequest,
    current_user: dict = Depends(get_current_user),
):
    """Mark a triage step as completed or uncompleted."""
    db = get_db()
    user_id = current_user["id"]

    session = (
        db.table("crisis_sessions")
        .select("completed_steps")
        .eq("id", session_id)
        .eq("user_id", user_id)
        .maybe_single()
        .execute()
    )

    if not session.data:
        raise HTTPException(status_code=404, detail="Crisis session not found")

    completed_steps = list(session.data.get("completed_steps") or [])

    if body.completed and body.step_id not in completed_steps:
        completed_steps.append(body.step_id)
    elif not body.completed and body.step_id in completed_steps:
        completed_steps.remove(body.step_id)

    db.table("crisis_sessions").update({"completed_steps": completed_steps}).eq("id", session_id).execute()

    return {"session_id": session_id, "step_id": body.step_id, "completed": body.completed}
