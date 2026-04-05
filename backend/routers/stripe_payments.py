import stripe
from fastapi import APIRouter, HTTPException, Request, Depends
from pydantic import BaseModel
from config import STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, FRONTEND_URL
from models.database import get_db
from routers.deps import get_current_user
from services.pool_service import get_pool_for_circle

stripe.api_key = STRIPE_SECRET_KEY

router = APIRouter()


class CheckoutRequest(BaseModel):
    amount: int  # dollars
    circle_id: str


@router.post("/circles/{circle_id}/pool/checkout")
def create_checkout_session(
    circle_id: str,
    body: CheckoutRequest,
    current_user: dict = Depends(get_current_user),
):
    """Create a Stripe Checkout session for pool contribution."""
    if body.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than 0")

    user_id = current_user["id"]
    pool = get_pool_for_circle(circle_id)

    try:
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[{
                "price_data": {
                    "currency": "usd",
                    "unit_amount": body.amount * 100,  # cents
                    "product_data": {
                        "name": "SafeCircle Emergency Pool Contribution",
                        "description": f"Contributing ${body.amount} to your circle's emergency fund",
                    },
                },
                "quantity": 1,
            }],
            mode="payment",
            success_url=f"{FRONTEND_URL}/circle/{circle_id}?tab=pool&payment=success",
            cancel_url=f"{FRONTEND_URL}/circle/{circle_id}?tab=pool&payment=cancelled",
            metadata={
                "circle_id": circle_id,
                "user_id": user_id,
                "pool_id": pool["id"],
                "amount_dollars": str(body.amount),
            },
        )
        return {"checkout_url": session.url, "session_id": session.id}
    except stripe.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/pool/webhook/stripe")
async def stripe_webhook(request: Request):
    """Handle Stripe webhook events."""
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, STRIPE_WEBHOOK_SECRET)
    except stripe.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid webhook signature")

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        meta = session["metadata"] or {}

        pool_id = meta["pool_id"] if "pool_id" in meta else None
        user_id = meta["user_id"] if "user_id" in meta else None
        amount_dollars = int(meta["amount_dollars"]) if "amount_dollars" in meta else 0

        print(f"[Stripe webhook] pool_id={pool_id} user_id={user_id} amount=${amount_dollars}")

        try:
            if pool_id and user_id and amount_dollars > 0:
                db = get_db()
                amount_cents = amount_dollars * 100
                session_id = session["id"]

                # Idempotency: skip if this session was already processed
                existing = (
                    db.table("pool_contributions")
                    .select("id")
                    .eq("stripe_session_id", session_id)
                    .execute()
                )
                if existing.data:
                    print(f"[Stripe webhook] Already processed session {session_id}, skipping")
                    return {"received": True}

                db.table("pool_contributions").insert({
                    "pool_id": pool_id,
                    "user_id": user_id,
                    "amount": amount_cents,
                    "stripe_session_id": session_id,
                }).execute()

                pool = db.table("emergency_pools").select("total_balance").eq("id", pool_id).maybe_single().execute()
                if pool.data:
                    new_balance = pool.data["total_balance"] + amount_cents
                    db.table("emergency_pools").update({"total_balance": new_balance}).eq("id", pool_id).execute()
                    print(f"[Stripe webhook] Pool updated. New balance (cents): {new_balance}")
                else:
                    print(f"[Stripe webhook] ERROR: Pool not found for pool_id={pool_id}")
            else:
                print(f"[Stripe webhook] Skipped — missing metadata fields")
        except Exception as e:
            print(f"[Stripe webhook] ERROR: {e}")
            raise

    return {"received": True}
