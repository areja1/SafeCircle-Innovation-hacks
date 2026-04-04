from fastapi import APIRouter, HTTPException
from models.schemas import SignupRequest, LoginRequest
from models.database import get_db

router = APIRouter()


@router.post("/signup")
def signup(body: SignupRequest):
    db = get_db()
    try:
        result = db.auth.sign_up({
            "email": body.email,
            "password": body.password,
            "options": {
                "data": {
                    "full_name": body.full_name,
                    "preferred_language": body.preferred_language,
                }
            },
        })

        if result.user is None:
            raise HTTPException(status_code=400, detail="Signup failed")

        # Create profile row in public.profiles
        db.table("profiles").insert({
            "id": result.user.id,
            "full_name": body.full_name,
            "email": body.email,
            "preferred_language": body.preferred_language,
        }).execute()

        return {
            "user_id": result.user.id,
            "email": result.user.email,
            "message": "Account created. Check your email to confirm.",
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/login")
def login(body: LoginRequest):
    db = get_db()
    try:
        result = db.auth.sign_in_with_password({
            "email": body.email,
            "password": body.password,
        })

        if result.session is None:
            raise HTTPException(status_code=401, detail="Invalid credentials")

        return {
            "access_token": result.session.access_token,
            "refresh_token": result.session.refresh_token,
            "user_id": result.user.id,
            "email": result.user.email,
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))


@router.post("/logout")
def logout():
    db = get_db()
    try:
        db.auth.sign_out()
        return {"message": "Logged out"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
