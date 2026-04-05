import uuid
from fastapi import APIRouter, HTTPException, Depends
from models.schemas import CrisisStartRequest, StepCompleteRequest, CrisisFeedbackRequest, CrisisAccuracyMetrics, CrisisFeedbackHistoryItem
from models.database import get_db
from routers.deps import get_current_user
from services.crisis_service import run_crisis_triage
from datetime import datetime, timezone
from typing import Optional, List

router = APIRouter()


def _to_number(value, default=0.0):
    try:
        if value is None:
            return default
        return float(value)
    except (TypeError, ValueError):
        return default


def _normalize_accuracy_metrics(row: dict):
    accuracy_percentage = max(0.0, min(100.0, _to_number(row.get("accuracy_percentage"), 0.0)))
    got_nothing_percentage = max(0.0, min(100.0, _to_number(row.get("got_nothing_percentage"), 0.0)))

    return {
        "total_feedbacks": int(_to_number(row.get("total_feedbacks"), 0)),
        "accurate_count": int(_to_number(row.get("accurate_count", row.get("accurate_feedbacks")), 0)),
        "accuracy_percentage": round(accuracy_percentage, 1),
        "got_nothing_percentage": round(got_nothing_percentage, 1),
        "avg_suggested": _to_number(row.get("avg_suggested"), 0.0),
        "avg_actual": _to_number(row.get("avg_actual", row.get("avg_actual_amount")), 0.0),
        "message": row.get("message"),
    }


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
        "savings_breakdown": triage.get("savings_breakdown", []),
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
        "savings_breakdown": triage.get("savings_breakdown", []),
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
        "savings_breakdown": row.get("savings_breakdown", []),
        "dont_sign_warning": row.get("dont_sign_warning"),
        "feedback_submitted": row.get("feedback_submitted", False),
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


@router.post("/{session_id}/feedback")
def submit_crisis_feedback(
    session_id: str,
    body: CrisisFeedbackRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Submit feedback on crisis suggestion accuracy.
    Helps improve future AI suggestions.
    """
    db = get_db()
    user_id = current_user["id"]

    # Verify session belongs to user
    session = (
        db.table("crisis_sessions")
        .select("id, crisis_type, state, estimated_savings")
        .eq("id", session_id)
        .eq("user_id", user_id)
        .maybe_single()
        .execute()
    )

    if not session.data:
        raise HTTPException(status_code=404, detail="Crisis session not found")

    session_data = session.data

    category_feedback = []
    for item in body.category_feedback:
        if hasattr(item, "model_dump"):
            category_feedback.append(item.model_dump())
        elif hasattr(item, "dict"):
            category_feedback.append(item.dict())
        else:
            category_feedback.append(item)

    # Insert feedback
    feedback_data = {
        "session_id": session_id,
        "user_id": user_id,
        "suggested_amount": body.suggested_amount,
        "was_accurate": body.was_accurate,
        "actual_amount": body.actual_amount,
        "got_nothing": body.got_nothing,
        "feedback_notes": body.feedback_notes,
        "category_feedback": category_feedback,
        "crisis_type": session_data["crisis_type"],
        "state": session_data["state"],
    }

    db.table("crisis_feedback").insert(feedback_data).execute()

    calculated_actual = body.actual_amount
    if category_feedback:
        calculated_total = sum(
            float(item.get("actual_amount") or 0)
            for item in category_feedback
            if item.get("received")
        )
        if calculated_total == 0:
            calculated_actual = None
        else:
            calculated_actual = int(round(calculated_total))
    elif calculated_actual is not None:
        calculated_actual = int(calculated_actual)

    # Mark session as feedback submitted
    db.table("crisis_sessions").update({
        "feedback_submitted": True,
        "actual_outcome_amount": calculated_actual,
    }).eq("id", session_id).execute()

    return {
        "message": "Thank you! Your feedback helps us improve.",
        "feedback_submitted": True,
    }


@router.get("/metrics/accuracy")
def get_accuracy_metrics(
    crisis_type: Optional[str] = None,
    state: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    """
    Get accuracy metrics for crisis suggestions.
    Can filter by crisis_type and/or state.
    """
    db = get_db()

    if crisis_type or state:
        # Get specific metrics
        query = db.table("crisis_accuracy_metrics").select("*")
        
        if crisis_type:
            query = query.eq("crisis_type", crisis_type)
        if state:
            query = query.eq("state", state)
        
        result = query.execute()
        metrics = result.data
    else:
        # Get overall accuracy
        result = db.table("crisis_overall_accuracy").select("*").execute()
        metrics = result.data

    if not metrics:
        return {
            "total_feedbacks": 0,
            "accurate_count": 0,
            "accuracy_percentage": 0,
            "got_nothing_percentage": 0,
            "message": "Not enough data yet. Be the first to provide feedback!",
        }

    return _normalize_accuracy_metrics(metrics[0]) if metrics else None


@router.get("/metrics/overall")
def get_overall_accuracy(current_user: dict = Depends(get_current_user)):
    """Get overall crisis prediction accuracy across all types."""
    db = get_db()
    
    result = db.table("crisis_overall_accuracy").select("*").execute()
    
    if not result.data:
        return {
            "total_feedbacks": 0,
            "accurate_count": 0,
            "accuracy_percentage": 0,
            "got_nothing_percentage": 0,
            "message": "Building trust through transparency - your feedback helps!",
        }
    
    return _normalize_accuracy_metrics(result.data[0])


@router.get("/feedback/history", response_model=List[CrisisFeedbackHistoryItem])
def get_feedback_history(current_user: dict = Depends(get_current_user)):
    """
    Get the current user's crisis feedback history.
    Shows what was suggested vs what they actually received for each crisis.
    """
    db = get_db()
    user_id = current_user["id"]
    
    result = (
        db.table("crisis_feedback")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    
    return result.data
