from fastapi import APIRouter, HTTPException, Depends
from models.schemas import ContributeRequest, FundRequestCreate, VoteRequest
from models.database import get_db
from routers.deps import get_current_user
from services.pool_service import (
    get_pool_for_circle,
    contribute_to_pool,
    create_fund_request,
    cast_vote,
)

router = APIRouter()


def _verify_membership(circle_id: str, user_id: str):
    db = get_db()
    membership = (
        db.table("circle_members")
        .select("id")
        .eq("circle_id", circle_id)
        .eq("user_id", user_id)
        .execute()
    )
    if not membership.data:
        raise HTTPException(status_code=403, detail="Not a member of this circle")


@router.get("/circles/{circle_id}/pool")
def get_pool(circle_id: str, current_user: dict = Depends(get_current_user)):
    """Return pool balance, contribution history, and active fund requests."""
    db = get_db()
    user_id = current_user["id"]
    _verify_membership(circle_id, user_id)

    pool = get_pool_for_circle(circle_id)

    contributions = (
        db.table("pool_contributions")
        .select("id, user_id, amount, contributed_at")
        .eq("pool_id", pool["id"])
        .order("contributed_at", desc=True)
        .limit(20)
        .execute()
    )

    fund_requests = (
        db.table("fund_requests")
        .select("*")
        .eq("pool_id", pool["id"])
        .order("created_at", desc=True)
        .execute()
    )

    # Convert cents to dollars in contributions
    contributions_formatted = [
        {**c, "amount": c["amount"] // 100}
        for c in (contributions.data or [])
    ]

    fund_requests_formatted = [
        {**r, "amount": r["amount"] // 100}
        for r in (fund_requests.data or [])
    ]

    return {
        "pool": pool,
        "contributions": contributions_formatted,
        "requests": fund_requests_formatted,
    }


@router.get("/circles/{circle_id}/pool/passbook")
def get_passbook(circle_id: str, current_user: dict = Depends(get_current_user)):
    """Return a chronological ledger of all pool credits and debits with running balance."""
    db = get_db()
    user_id = current_user["id"]
    _verify_membership(circle_id, user_id)

    pool = get_pool_for_circle(circle_id)
    pool_id = pool["id"]

    entries = []

    # Credits: contributions
    contributions = (
        db.table("pool_contributions")
        .select("id, user_id, amount, contributed_at")
        .eq("pool_id", pool_id)
        .execute()
    )
    for c in (contributions.data or []):
        profile = (
            db.table("profiles")
            .select("full_name")
            .eq("id", c["user_id"])
            .maybe_single()
            .execute()
        )
        name = profile.data["full_name"] if profile.data else "A member"
        entries.append({
            "id": f"contrib_{c['id']}",
            "type": "credit",
            "description": f"{name} contributed",
            "amount": c["amount"] // 100,
            "timestamp": c["contributed_at"],
        })

    # Debits: approved / released fund requests
    requests = (
        db.table("fund_requests")
        .select("id, requested_by, amount, reason, status, created_at")
        .eq("pool_id", pool_id)
        .in_("status", ["approved", "released"])
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
        entries.append({
            "id": f"req_{r['id']}",
            "type": "debit",
            "description": f"{name} — {r['reason'] or 'Fund request'}",
            "amount": r["amount"] // 100,
            "timestamp": r["created_at"],
        })

    # Sort ascending to compute running balance
    entries.sort(key=lambda x: x["timestamp"])
    running = 0
    for e in entries:
        if e["type"] == "credit":
            running += e["amount"]
        else:
            running -= e["amount"]
        e["running_balance"] = running

    # Return most recent first for display
    entries.reverse()
    return entries


@router.post("/circles/{circle_id}/pool/contribute")
def contribute(
    circle_id: str,
    body: ContributeRequest,
    current_user: dict = Depends(get_current_user),
):
    """Contribute to the circle emergency pool."""
    user_id = current_user["id"]
    _verify_membership(circle_id, user_id)

    if body.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than 0")

    pool = get_pool_for_circle(circle_id)
    return contribute_to_pool(pool["id"], user_id, body.amount)


@router.post("/circles/{circle_id}/pool/request")
def request_funds(
    circle_id: str,
    body: FundRequestCreate,
    current_user: dict = Depends(get_current_user),
):
    """Request funds from the circle emergency pool."""
    db = get_db()
    user_id = current_user["id"]
    _verify_membership(circle_id, user_id)

    if body.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than 0")

    pool = get_pool_for_circle(circle_id)

    if body.amount * 100 > pool["total_balance"] * 100:
        raise HTTPException(status_code=400, detail="Requested amount exceeds pool balance")

    # Count members to determine votes needed
    members = (
        db.table("circle_members")
        .select("id")
        .eq("circle_id", circle_id)
        .execute()
    )
    total_members = len(members.data)

    result = create_fund_request(pool["id"], user_id, body.amount, body.reason, body.crisis_type, total_members)
    return result


@router.get("/circles/{circle_id}/analytics")
def get_analytics(circle_id: str, current_user: dict = Depends(get_current_user)):
    """Return analytics data for a circle's emergency pool."""
    db = get_db()
    user_id = current_user["id"]
    _verify_membership(circle_id, user_id)

    pool = get_pool_for_circle(circle_id)
    pool_id = pool["id"]

    # --- Raw data pulls ---
    contributions_res = (
        db.table("pool_contributions")
        .select("id, user_id, amount, contributed_at")
        .eq("pool_id", pool_id)
        .execute()
    )
    contributions = contributions_res.data or []

    fund_requests_res = (
        db.table("fund_requests")
        .select("id, requested_by, amount, status, created_at")
        .eq("pool_id", pool_id)
        .execute()
    )
    fund_requests = fund_requests_res.data or []

    members_res = (
        db.table("circle_members")
        .select("user_id")
        .eq("circle_id", circle_id)
        .execute()
    )
    members = members_res.data or []
    total_members = len(members)

    # --- Member names from profiles ---
    member_profiles = {}
    for m in members:
        uid = m["user_id"]
        profile = (
            db.table("profiles")
            .select("full_name")
            .eq("id", uid)
            .maybe_single()
            .execute()
        )
        member_profiles[uid] = profile.data["full_name"] if profile.data else "Unknown"

    # --- Risk scores per member ---
    risk_scores_list = []
    risk_score_values = []
    for m in members:
        uid = m["user_id"]
        survey = (
            db.table("risk_surveys")
            .select("risk_score")
            .eq("circle_id", circle_id)
            .eq("user_id", uid)
            .maybe_single()
            .execute()
        )
        score = survey.data["risk_score"] if (survey and survey.data) else None
        name = member_profiles.get(uid, "Unknown")
        if score is not None:
            risk_scores_list.append({"name": name, "score": score})
            risk_score_values.append(score)

    avg_risk_score = round(sum(risk_score_values) / len(risk_score_values)) if risk_score_values else 0

    # --- Summary ---
    total_contributed = sum(c["amount"] for c in contributions) // 100
    approved_requests = [r for r in fund_requests if r["status"] in ("approved", "released")]
    pending_requests = [r for r in fund_requests if r["status"] == "pending"]
    total_withdrawn = sum(r["amount"] for r in approved_requests) // 100
    current_balance = total_contributed - total_withdrawn
    approved_count = len(approved_requests)
    pending_count = len(pending_requests)

    summary = {
        "total_contributed": total_contributed,
        "total_withdrawn": total_withdrawn,
        "current_balance": current_balance,
        "total_members": total_members,
        "avg_risk_score": avg_risk_score,
        "approved_requests": approved_count,
        "pending_requests": pending_count,
    }

    # --- Pool growth (running balance) ---
    events = []
    for c in contributions:
        events.append({
            "ts": c["contributed_at"],
            "delta": c["amount"] // 100,
        })
    for r in approved_requests:
        events.append({
            "ts": r["created_at"],
            "delta": -(r["amount"] // 100),
        })
    events.sort(key=lambda x: x["ts"])
    running = 0
    pool_growth = []
    for ev in events:
        running += ev["delta"]
        date_str = ev["ts"][:10]  # YYYY-MM-DD
        pool_growth.append({"date": date_str, "balance": running})

    # --- Contributions by member ---
    contrib_by_member: dict = {}
    for c in contributions:
        uid = c["user_id"]
        name = member_profiles.get(uid, "Unknown")
        contrib_by_member[name] = contrib_by_member.get(name, 0) + (c["amount"] // 100)
    contributions_by_member = [
        {"name": n, "amount": a} for n, a in contrib_by_member.items()
    ]

    # --- Monthly activity ---
    from collections import defaultdict
    monthly: dict = defaultdict(lambda: {"contributed": 0, "withdrawn": 0})
    for c in contributions:
        from datetime import datetime
        dt = datetime.fromisoformat(c["contributed_at"].replace("Z", "+00:00"))
        key = dt.strftime("%b %Y")
        monthly[key]["contributed"] += c["amount"] // 100
    for r in approved_requests:
        from datetime import datetime
        dt = datetime.fromisoformat(r["created_at"].replace("Z", "+00:00"))
        key = dt.strftime("%b %Y")
        monthly[key]["withdrawn"] += r["amount"] // 100

    # Sort chronologically
    from datetime import datetime as _dt
    def month_sort_key(k):
        try:
            return _dt.strptime(k, "%b %Y")
        except Exception:
            return _dt.min

    monthly_activity = [
        {"month": k, "contributed": v["contributed"], "withdrawn": v["withdrawn"]}
        for k, v in sorted(monthly.items(), key=lambda x: month_sort_key(x[0]))
    ]

    return {
        "summary": summary,
        "pool_growth": pool_growth,
        "contributions_by_member": contributions_by_member,
        "monthly_activity": monthly_activity,
        "risk_scores": risk_scores_list,
    }


@router.post("/circles/{circle_id}/pool/vote")
def vote_on_request(
    circle_id: str,
    body: VoteRequest,
    current_user: dict = Depends(get_current_user),
):
    """Vote to approve or deny a fund request."""
    user_id = current_user["id"]
    _verify_membership(circle_id, user_id)

    # Verify the request belongs to this circle's pool
    db = get_db()
    pool = get_pool_for_circle(circle_id)
    fund_request = (
        db.table("fund_requests")
        .select("id, status, requested_by")
        .eq("id", body.request_id)
        .eq("pool_id", pool["id"])
        .maybe_single()
        .execute()
    )

    if not fund_request.data:
        raise HTTPException(status_code=404, detail="Fund request not found in this circle")

    if fund_request.data["status"] != "pending":
        raise HTTPException(status_code=400, detail="This request is no longer pending")

    if fund_request.data["requested_by"] == user_id:
        raise HTTPException(status_code=400, detail="You cannot vote on your own request")

    return cast_vote(body.request_id, user_id, body.vote)
