from fastapi import HTTPException
from models.database import get_db


def get_pool_for_circle(circle_id: str) -> dict:
    db = get_db()
    pool = (
        db.table("emergency_pools")
        .select("*")
        .eq("circle_id", circle_id)
        .maybe_single()
        .execute()
    )
    if not pool.data:
        raise HTTPException(status_code=404, detail="Emergency pool not found for this circle")
    # Convert balance from cents to dollars for response
    pool.data["total_balance"] = pool.data["total_balance"] // 100
    return pool.data


def contribute_to_pool(pool_id: str, user_id: str, amount_dollars: int) -> dict:
    """Add a contribution and update pool balance. Amount stored in cents."""
    db = get_db()
    amount_cents = amount_dollars * 100

    db.table("pool_contributions").insert({
        "pool_id": pool_id,
        "user_id": user_id,
        "amount": amount_cents,
    }).execute()

    # Increment pool balance
    pool = db.table("emergency_pools").select("total_balance").eq("id", pool_id).maybe_single().execute()
    new_balance = pool.data["total_balance"] + amount_cents
    db.table("emergency_pools").update({"total_balance": new_balance}).eq("id", pool_id).execute()

    return {"pool_id": pool_id, "contributed": amount_dollars, "new_balance_dollars": new_balance // 100}


def create_fund_request(pool_id: str, user_id: str, amount_dollars: int, reason: str, crisis_type: str, total_members: int) -> dict:
    db = get_db()
    # Require majority vote
    votes_needed = max(1, total_members // 2 + 1)

    result = db.table("fund_requests").insert({
        "pool_id": pool_id,
        "requested_by": user_id,
        "amount": amount_dollars * 100,
        "reason": reason,
        "crisis_type": crisis_type,
        "status": "pending",
        "votes_needed": votes_needed,
        "votes_received": 1,
    }).execute()

    new_request = result.data[0]

    # Explicitly set votes_received = 1 in case DB default overrides insert
    db.table("fund_requests").update({"votes_received": 1}).eq("id", new_request["id"]).execute()

    # Record the requester's implicit vote in fund_votes so it's trackable
    db.table("fund_votes").insert({
        "request_id": new_request["id"],
        "voter_id": user_id,
        "vote": True,
    }).execute()

    new_request["votes_received"] = 1
    return new_request


def cast_vote(request_id: str, voter_id: str, vote: bool) -> dict:
    """Record a vote. Auto-release (and deduct balance) on majority approve; deny on majority deny."""
    db = get_db()

    # Check for duplicate vote
    existing = (
        db.table("fund_votes")
        .select("id")
        .eq("request_id", request_id)
        .eq("voter_id", voter_id)
        .execute()
    )
    if existing.data:
        raise HTTPException(status_code=400, detail="You have already voted on this request")

    db.table("fund_votes").insert({
        "request_id": request_id,
        "voter_id": voter_id,
        "vote": vote,
    }).execute()

    # Fetch current request state including pool_id and amount for balance deduction
    request = (
        db.table("fund_requests")
        .select("pool_id, amount, votes_needed, votes_received, status")
        .eq("id", request_id)
        .maybe_single()
        .execute()
    )
    req = request.data

    if vote:
        new_approve_count = req["votes_received"] + 1
        if new_approve_count >= req["votes_needed"]:
            # Threshold reached: release funds and deduct from pool balance
            new_status = "released"
            db.table("fund_requests").update({
                "votes_received": new_approve_count,
                "status": new_status,
            }).eq("id", request_id).execute()

            pool = (
                db.table("emergency_pools")
                .select("id, total_balance")
                .eq("id", req["pool_id"])
                .maybe_single()
                .execute()
            )
            new_balance = max(0, pool.data["total_balance"] - req["amount"])
            db.table("emergency_pools").update({"total_balance": new_balance}).eq("id", pool.data["id"]).execute()
        else:
            new_status = req["status"]
            db.table("fund_requests").update({
                "votes_received": new_approve_count,
            }).eq("id", request_id).execute()
    else:
        # Count all deny votes so far (including the one just inserted)
        deny_votes = (
            db.table("fund_votes")
            .select("id")
            .eq("request_id", request_id)
            .eq("vote", False)
            .execute()
        )
        deny_count = len(deny_votes.data)
        if deny_count >= req["votes_needed"]:
            new_status = "denied"
            db.table("fund_requests").update({"status": new_status}).eq("id", request_id).execute()
        else:
            new_status = req["status"]

    return {"request_id": request_id, "vote": vote, "new_status": new_status}
