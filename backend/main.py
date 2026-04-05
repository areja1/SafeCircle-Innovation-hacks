from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import auth, circles, risk_xray, crisis, emergency_pool, benefits, members, stripe_payments, notifications

app = FastAPI(
    title="SafeCircle API",
    version="1.0.0",
    description="Community-powered financial safety net — backend API",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(circles.router, prefix="/api/v1/circles", tags=["circles"])
app.include_router(risk_xray.router, prefix="/api/v1", tags=["risk-xray"])
app.include_router(crisis.router, prefix="/api/v1/crisis", tags=["crisis"])
app.include_router(emergency_pool.router, prefix="/api/v1", tags=["emergency-pool"])
app.include_router(benefits.router, prefix="/api/v1/benefits", tags=["benefits"])
app.include_router(stripe_payments.router, prefix="/api/v1", tags=["payments"])
app.include_router(members.router, prefix="/api/v1/members", tags=["members"])
app.include_router(notifications.router, prefix="/api/v1/notifications", tags=["notifications"])


@app.get("/")
def root():
    return {"message": "SafeCircle API is running", "version": "1.0.0"}


@app.get("/health")
def health():
    return {"status": "ok"}
