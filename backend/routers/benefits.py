from fastapi import APIRouter, Depends
from models.database import get_db
from routers.deps import get_current_user
from services.benefits_service import check_benefits_eligibility

router = APIRouter()


@router.get("/check")
def check_benefits(
    state: str = "AZ",
    monthly_income: int = 0,
    household_size: int = 1,
    employment_type: str = "w2_employee",
    has_health_insurance: bool = False,
    current_user: dict = Depends(get_current_user),
):
    """
    Check which government benefits the user may qualify for.
    Accepts query parameters — pulls from user's saved survey if not provided.
    """
    db = get_db()
    user_id = current_user["id"]

    # If no income provided, try to fetch from the user's most recent survey
    if monthly_income == 0:
        survey = (
            db.table("risk_surveys")
            .select("monthly_income, household_size, employment_type, has_health_insurance, state")
            .eq("user_id", user_id)
            .order("completed_at", desc=True)
            .limit(1)
            .execute()
        )
        if survey.data:
            row = survey.data[0]
            monthly_income = row.get("monthly_income", 0) or 0
            household_size = row.get("household_size", household_size)
            employment_type = row.get("employment_type", employment_type)
            has_health_insurance = row.get("has_health_insurance", has_health_insurance)

    benefits = check_benefits_eligibility(
        state=state,
        monthly_income=monthly_income,
        household_size=household_size,
        employment_type=employment_type,
        has_health_insurance=has_health_insurance,
    )

    total_value = sum(b.get("estimated_value", 0) for b in benefits)

    return {
        "state": state,
        "benefits_found": len(benefits),
        "total_estimated_annual_value": total_value,
        "benefits": benefits,
    }
