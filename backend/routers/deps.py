"""
Shared FastAPI dependencies used across routers.
"""
from fastapi import Header, HTTPException
from models.database import get_db


def get_current_user(authorization: str = Header(...)) -> dict:
    """
    Extract and verify the Supabase JWT from the Authorization header.
    Returns the user dict from Supabase.
    """
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")

    token = authorization.split("Bearer ")[1]
    db = get_db()

    try:
        user_response = db.auth.get_user(token)
        if user_response.user is None:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        return {"id": user_response.user.id, "email": user_response.user.email}
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
