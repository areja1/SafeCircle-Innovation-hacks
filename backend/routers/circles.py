import random
import string
from fastapi import APIRouter, HTTPException, Depends
from models.schemas import CreateCircleRequest, JoinCircleRequest, CircleResponse
from models.database import get_db
from routers.deps import get_current_user


def generate_invite_code(length: int = 8) -> str:
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))

router = APIRouter()


@router.get("")
def list_circles(current_user: dict = Depends(get_current_user)):
    """Return all circles the current user belongs to, with member count and pool."""
    db = get_db()
    user_id = current_user["id"]

    memberships = (
        db.table("circle_members")
        .select("circle_id")
        .eq("user_id", user_id)
        .execute()
    )
    circle_ids = [m["circle_id"] for m in memberships.data]

    if not circle_ids:
        return []

    circles = (
        db.table("circles")
        .select("*")
        .in_("id", circle_ids)
        .execute()
    )

    result = []
    for circle in circles.data:
        cid = circle["id"]

        member_rows = (
            db.table("circle_members")
            .select("id")
            .eq("circle_id", cid)
            .execute()
        )

        pool_rows = (
            db.table("emergency_pools")
            .select("id, total_balance, target_monthly_per_member")
            .eq("circle_id", cid)
            .execute()
        )

        # Convert cents to dollars to match pool endpoint
        if pool_rows.data:
            pool_rows.data[0]["total_balance"] = pool_rows.data[0]["total_balance"] // 100

        result.append({
            **circle,
            "members": [{"id": m["id"]} for m in member_rows.data],
            "pool": pool_rows.data[0] if pool_rows.data else None,
        })

    return result


@router.post("")
def create_circle(body: CreateCircleRequest, current_user: dict = Depends(get_current_user)):
    """Create a new circle. Creator is automatically added as admin."""
    db = get_db()
    user_id = current_user["id"]

    circle = (
        db.table("circles")
        .insert({
            "name": body.name,
            "description": body.description,
            "created_by": user_id,
            "invite_code": generate_invite_code(),
        })
        .execute()
    )
    new_circle = circle.data[0]

    # Add creator as admin member
    db.table("circle_members").insert({
        "circle_id": new_circle["id"],
        "user_id": user_id,
        "role": "admin",
    }).execute()

    # Create emergency pool for the circle
    db.table("emergency_pools").insert({
        "circle_id": new_circle["id"],
    }).execute()

    return new_circle


@router.post("/join-by-code")
def join_circle_by_code(body: JoinCircleRequest, current_user: dict = Depends(get_current_user)):
    """Join a circle using only its invite code (no circle_id needed)."""
    db = get_db()
    user_id = current_user["id"]

    circle = (
        db.table("circles")
        .select("id, invite_code")
        .eq("invite_code", body.invite_code)
        .maybe_single()
        .execute()
    )
    if not circle.data:
        raise HTTPException(status_code=404, detail="Invalid invite code")

    circle_id = circle.data["id"]

    # Check if already a member
    existing = (
        db.table("circle_members")
        .select("id")
        .eq("circle_id", circle_id)
        .eq("user_id", user_id)
        .execute()
    )
    if existing.data:
        raise HTTPException(status_code=400, detail="Already a member of this circle")

    db.table("circle_members").insert({
        "circle_id": circle_id,
        "user_id": user_id,
        "role": "member",
    }).execute()

    return {"message": "Joined circle successfully", "circle_id": circle_id}


@router.get("/{circle_id}")
def get_circle(circle_id: str, current_user: dict = Depends(get_current_user)):
    """Get circle details including members and pool balance."""
    db = get_db()
    user_id = current_user["id"]

    # Verify user is a member
    membership = (
        db.table("circle_members")
        .select("id")
        .eq("circle_id", circle_id)
        .eq("user_id", user_id)
        .execute()
    )
    if not membership.data:
        raise HTTPException(status_code=403, detail="You are not a member of this circle")

    circle = db.table("circles").select("*").eq("id", circle_id).maybe_single().execute()
    if not circle.data:
        raise HTTPException(status_code=404, detail="Circle not found")

    # Get members with their profile info
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
            .select("full_name")
            .eq("id", m["user_id"])
            .maybe_single()
            .execute()
        )
        survey = (
            db.table("risk_surveys")
            .select("risk_score")
            .eq("user_id", m["user_id"])
            .eq("circle_id", circle_id)
            .execute()
        )
        members.append({
            "id": m["id"],
            "user_id": m["user_id"],
            "full_name": profile.data["full_name"] if profile.data else "Unknown",
            "role": m["role"],
            "risk_score": survey.data[0]["risk_score"] if survey.data else None,
            "survey_completed": bool(survey.data),
        })

    pool = (
        db.table("emergency_pools")
        .select("*")
        .eq("circle_id", circle_id)
        .execute()
    )

    return {
        **circle.data,
        "members": members,
        "pool": pool.data[0] if pool.data else None,
    }


@router.post("/join-by-code")
def join_circle_by_code(body: JoinCircleRequest, current_user: dict = Depends(get_current_user)):
    """Join a circle using only the invite code (no circle_id needed)."""
    db = get_db()
    user_id = current_user["id"]

    code = body.invite_code.strip().upper()
    circle = (
        db.table("circles")
        .select("id, invite_code")
        .ilike("invite_code", code)
        .execute()
    )
    if not circle.data:
        raise HTTPException(status_code=404, detail="Circle not found. Check the invite code.")
    circle_data = circle.data[0]

    circle_id = circle_data["id"]

    existing = (
        db.table("circle_members")
        .select("id")
        .eq("circle_id", circle_id)
        .eq("user_id", user_id)
        .execute()
    )
    if existing.data:
        raise HTTPException(status_code=400, detail="Already a member of this circle")

    db.table("circle_members").insert({
        "circle_id": circle_id,
        "user_id": user_id,
        "role": "member",
    }).execute()

    return {"message": "Joined circle successfully", "circle_id": circle_id}


@router.post("/{circle_id}/join")
def join_circle(circle_id: str, body: JoinCircleRequest, current_user: dict = Depends(get_current_user)):
    """Join a circle using its invite code."""
    db = get_db()
    user_id = current_user["id"]

    circle = (
        db.table("circles")
        .select("id, invite_code")
        .eq("id", circle_id)
        .maybe_single()
        .execute()
    )
    if not circle.data:
        raise HTTPException(status_code=404, detail="Circle not found")

    if circle.data["invite_code"] != body.invite_code:
        raise HTTPException(status_code=400, detail="Invalid invite code")

    # Check if already a member
    existing = (
        db.table("circle_members")
        .select("id")
        .eq("circle_id", circle_id)
        .eq("user_id", user_id)
        .execute()
    )
    if existing.data:
        raise HTTPException(status_code=400, detail="Already a member of this circle")

    db.table("circle_members").insert({
        "circle_id": circle_id,
        "user_id": user_id,
        "role": "member",
    }).execute()

    return {"message": "Joined circle successfully"}


@router.delete("/{circle_id}/leave")
def leave_circle(circle_id: str, current_user: dict = Depends(get_current_user)):
    """Leave a circle. Admins cannot leave if they are the only admin."""
    db = get_db()
    user_id = current_user["id"]

    membership = (
        db.table("circle_members")
        .select("id, role")
        .eq("circle_id", circle_id)
        .eq("user_id", user_id)
        .execute()
    )
    if not membership.data:
        raise HTTPException(status_code=404, detail="You are not a member of this circle")

    member = membership.data[0]

    if member["role"] == "admin":
        other_admins = (
            db.table("circle_members")
            .select("id")
            .eq("circle_id", circle_id)
            .eq("role", "admin")
            .neq("user_id", user_id)
            .execute()
        )
        if not other_admins.data:
            raise HTTPException(
                status_code=400,
                detail="You are the only admin. Assign another admin before leaving.",
            )

    db.table("circle_members").delete().eq("id", member["id"]).execute()
    return {"message": "Left circle successfully"}
