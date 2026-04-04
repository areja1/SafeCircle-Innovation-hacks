from fastapi import APIRouter, HTTPException, Depends
from models.database import get_db
from routers.deps import get_current_user

router = APIRouter()


@router.get("/circles/{circle_id}")
def get_circle_members(circle_id: str, current_user: dict = Depends(get_current_user)):
    """Return all members of a circle with their profile and risk data."""
    db = get_db()
    user_id = current_user["id"]

    # Verify requester is a member
    membership = (
        db.table("circle_members")
        .select("id")
        .eq("circle_id", circle_id)
        .eq("user_id", user_id)
        .execute()
    )
    if not membership.data:
        raise HTTPException(status_code=403, detail="Not a member of this circle")

    members_raw = (
        db.table("circle_members")
        .select("id, user_id, role, joined_at")
        .eq("circle_id", circle_id)
        .execute()
    )

    members = []
    for m in members_raw.data:
        profile = (
            db.table("profiles")
            .select("full_name, email")
            .eq("id", m["user_id"])
            .single()
            .execute()
        )
        survey = (
            db.table("risk_surveys")
            .select("risk_score, completed_at")
            .eq("user_id", m["user_id"])
            .eq("circle_id", circle_id)
            .execute()
        )
        members.append({
            "id": m["id"],
            "user_id": m["user_id"],
            "full_name": profile.data["full_name"] if profile.data else "Unknown",
            "email": profile.data["email"] if profile.data else "",
            "role": m["role"],
            "joined_at": m["joined_at"],
            "risk_score": survey.data[0]["risk_score"] if survey.data else None,
            "survey_completed": bool(survey.data),
        })

    return members
