from fastapi import APIRouter, Depends
from models.database import get_db
from routers.deps import get_current_user

router = APIRouter()


@router.get("")
def get_notifications(current_user: dict = Depends(get_current_user)):
    """Return recent activity notifications for circles the user belongs to."""
    db = get_db()
    user_id = current_user["id"]

    # Get all circles the user belongs to
    memberships = (
        db.table("circle_members")
        .select("circle_id")
        .eq("user_id", user_id)
        .execute()
    )
    circle_ids = [m["circle_id"] for m in memberships.data]

    if not circle_ids:
        return []

    notifications = []

    for circle_id in circle_ids:
        # Get circle name
        circle = (
            db.table("circles")
            .select("id, name")
            .eq("id", circle_id)
            .maybe_single()
            .execute()
        )
        if not circle.data:
            continue
        circle_name = circle.data["name"]

        # Get pool
        pool = (
            db.table("emergency_pools")
            .select("id")
            .eq("circle_id", circle_id)
            .maybe_single()
            .execute()
        )
        if not pool.data:
            continue
        pool_id = pool.data["id"]

        # Recent contributions (excluding own)
        contributions = (
            db.table("pool_contributions")
            .select("id, user_id, amount, contributed_at")
            .eq("pool_id", pool_id)
            .neq("user_id", user_id)
            .order("contributed_at", desc=True)
            .limit(5)
            .execute()
        )
        for c in (contributions.data or []):
            # Get contributor name
            profile = (
                db.table("profiles")
                .select("full_name")
                .eq("id", c["user_id"])
                .maybe_single()
                .execute()
            )
            name = profile.data["full_name"] if profile.data else "A member"
            amount_dollars = c["amount"] // 100
            notifications.append({
                "id": f"contrib_{c['id']}",
                "type": "contribution",
                "circle_name": circle_name,
                "circle_id": circle_id,
                "message": f"{name} contributed ${amount_dollars} to {circle_name}",
                "timestamp": c["contributed_at"],
                "read": False,
            })

        # Recent fund requests (all members should see)
        requests = (
            db.table("fund_requests")
            .select("id, requested_by, amount, reason, crisis_type, status, created_at")
            .eq("pool_id", pool_id)
            .order("created_at", desc=True)
            .limit(5)
            .execute()
        )
        for r in (requests.data or []):
            profile = (
                db.table("profiles")
                .select("full_name")
                .eq("id", r["requested_by"])
                .maybe_single()
                .execute()
            )
            name = profile.data["full_name"] if profile.data else "A member"
            amount_dollars = r["amount"] // 100

            if r["requested_by"] == user_id:
                if r["status"] == "approved" or r["status"] == "released":
                    msg = f"Your fund request of ${amount_dollars} was approved in {circle_name}!"
                    notif_type = "request_approved"
                elif r["status"] == "denied":
                    msg = f"Your fund request of ${amount_dollars} was denied in {circle_name}"
                    notif_type = "request_denied"
                else:
                    continue  # Don't notify yourself about your own pending request
            else:
                if r["status"] == "pending":
                    msg = f"{name} needs ${amount_dollars} from {circle_name} — vote needed"
                    notif_type = "fund_request"
                else:
                    continue

            notifications.append({
                "id": f"req_{r['id']}",
                "type": notif_type,
                "circle_name": circle_name,
                "circle_id": circle_id,
                "message": msg,
                "timestamp": r["created_at"],
                "read": False,
            })

    # Sort by timestamp descending
    notifications.sort(key=lambda x: x["timestamp"], reverse=True)
    return notifications[:15]
