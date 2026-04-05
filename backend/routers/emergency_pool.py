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
