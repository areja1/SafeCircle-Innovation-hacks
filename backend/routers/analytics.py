from fastapi import APIRouter, HTTPException, Depends
from collections import defaultdict
from datetime import datetime
from models.database import get_db
from routers.deps import get_current_user

router = APIRouter()


@router.get("/circles/{circle_id}/analytics")
def get_analytics(circle_id: str, current_user: dict = Depends(get_current_user)):
    """Return analytics data for a circle: pool growth, member contributions, risk scores, monthly activity."""
    db = get_db()
    user_id = current_user["id"]

    # Verify membership
    membership = (
        db.table("circle_members")
        .select("id")
        .eq("circle_id", circle_id)
        .eq("user_id", user_id)
        .execute()
    )
    if not membership.data:
        raise HTTPException(status_code=403, detail="Not a member of this circle")

    # ── Pool ──────────────────────────────────────────────────────────────────
    pool_row = (
        db.table("emergency_pools")
        .select("id, total_balance")
        .eq("circle_id", circle_id)
        .maybe_single()
        .execute()
    )
    pool = pool_row.data or {"id": None, "total_balance": 0}
    pool_id = pool["id"]
    current_balance = (pool["total_balance"] or 0) // 100  # cents → dollars

    # ── Contributions ────────────────────────────────────────────────────────
    contributions = []
    if pool_id:
        contributions = (
            db.table("pool_contributions")
            .select("user_id, amount, contributed_at")
            .eq("pool_id", pool_id)
            .order("contributed_at")
            .execute()
        ).data or []

    total_contributed = sum(c["amount"] for c in contributions) // 100

    # ── Fund requests ────────────────────────────────────────────────────────
    fund_requests = []
    if pool_id:
        fund_requests = (
            db.table("fund_requests")
            .select("amount, status, created_at")
            .eq("pool_id", pool_id)
            .execute()
        ).data or []

    total_withdrawn = sum(
        r["amount"] for r in fund_requests if r["status"] == "released"
    ) // 100
    approved_requests = sum(1 for r in fund_requests if r["status"] == "released")
    pending_requests = sum(1 for r in fund_requests if r["status"] == "pending")

    # ── Members ──────────────────────────────────────────────────────────────
    members_raw = (
        db.table("circle_members")
        .select("user_id")
        .eq("circle_id", circle_id)
        .execute()
    ).data or []
    member_ids = [m["user_id"] for m in members_raw]
    total_members = len(member_ids)

    # ── Risk scores ──────────────────────────────────────────────────────────
    risk_rows = (
        db.table("risk_surveys")
        .select("user_id, risk_score")
        .eq("circle_id", circle_id)
        .execute()
    ).data or []

    avg_risk_score = 0
    if risk_rows:
        scores = [r["risk_score"] for r in risk_rows if r["risk_score"] is not None]
        avg_risk_score = round(sum(scores) / len(scores)) if scores else 0

    # Build risk_scores with member names
    risk_scores = []
    for r in risk_rows:
        if r["risk_score"] is None:
            continue
        profile = (
            db.table("profiles")
            .select("full_name")
            .eq("id", r["user_id"])
            .maybe_single()
            .execute()
        )
        name = (profile.data or {}).get("full_name") or "Member"
        first_name = name.split()[0] if name else "Member"
        risk_scores.append({"name": first_name, "score": r["risk_score"]})

    # ── Pool growth (running balance, one point per contribution) ───────────
    pool_growth = []
    running = 0
    for c in contributions:
        running += c["amount"] // 100
        raw_date = c.get("contributed_at") or ""
        try:
            dt = datetime.fromisoformat(raw_date.replace("Z", "+00:00"))
            date_label = dt.strftime("%b %d %H:%M")
        except Exception:
            date_label = raw_date[:16]
        pool_growth.append({"date": date_label, "balance": running})

    # ── Contributions by member ───────────────────────────────────────────────
    member_totals: dict = defaultdict(int)
    for c in contributions:
        member_totals[c["user_id"]] += c["amount"] // 100

    contributions_by_member = []
    for uid, total in member_totals.items():
        profile = (
            db.table("profiles")
            .select("full_name")
            .eq("id", uid)
            .maybe_single()
            .execute()
        )
        name = (profile.data or {}).get("full_name") or "Member"
        contributions_by_member.append({"name": name.split()[0], "amount": total})

    # ── Monthly activity ─────────────────────────────────────────────────────
    monthly_contributed: dict = defaultdict(int)
    monthly_withdrawn: dict = defaultdict(int)

    for c in contributions:
        raw = c.get("contributed_at") or ""
        try:
            month = datetime.fromisoformat(raw[:10]).strftime("%b %Y")
        except Exception:
            month = raw[:7]
        monthly_contributed[month] += c["amount"] // 100

    for r in fund_requests:
        if r["status"] != "released":
            continue
        raw = r.get("created_at") or ""
        try:
            month = datetime.fromisoformat(raw[:10]).strftime("%b %Y")
        except Exception:
            month = raw[:7]
        monthly_withdrawn[month] += r["amount"] // 100

    all_months = sorted(set(list(monthly_contributed.keys()) + list(monthly_withdrawn.keys())))
    monthly_activity = [
        {
            "month": m,
            "contributed": monthly_contributed.get(m, 0),
            "withdrawn": monthly_withdrawn.get(m, 0),
        }
        for m in all_months
    ]

    return {
        "summary": {
            "total_contributed": total_contributed,
            "total_withdrawn": total_withdrawn,
            "current_balance": current_balance,
            "total_members": total_members,
            "avg_risk_score": avg_risk_score,
            "approved_requests": approved_requests,
            "pending_requests": pending_requests,
        },
        "pool_growth": pool_growth,
        "contributions_by_member": contributions_by_member,
        "monthly_activity": monthly_activity,
        "risk_scores": risk_scores,
    }
