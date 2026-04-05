from fastapi import APIRouter, HTTPException, Depends
from models.schemas import SurveyAnswersRequest
from models.database import get_db
from routers.deps import get_current_user
from services.risk_service import run_risk_analysis, compute_group_risk

router = APIRouter()


@router.post("/circles/{circle_id}/risk-xray")
def submit_risk_survey(
    circle_id: str,
    body: SurveyAnswersRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Submit survey answers for a circle.
    Runs risk engine + Claude AI analysis, saves to DB, returns the full risk report.
    """
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

    # Fetch other members' survey data to give Claude group context
    other_surveys = (
        db.table("risk_surveys")
        .select("employment_type, has_health_insurance, has_renters_insurance, drives_for_gig_apps, risk_score")
        .eq("circle_id", circle_id)
        .neq("user_id", user_id)
        .execute()
    )

    survey_dict = body.model_dump()
    ai_result = run_risk_analysis(survey_dict, other_surveys.data or [])

    # Upsert into risk_surveys table
    upsert_data = {
        "user_id": user_id,
        "circle_id": circle_id,
        **survey_dict,
        "risk_score": ai_result.get("risk_score"),
        "gaps_found": ai_result.get("gaps", []),
        "benefits_eligible": ai_result.get("benefits_eligible", []),
        "poverty_tax_annual": ai_result.get("poverty_tax_annual", 0),
        "ai_analysis": ai_result.get("ai_analysis", ""),
        "group_insights": ai_result.get("group_insights", []),
    }

    db.table("risk_surveys").upsert(upsert_data, on_conflict="user_id,circle_id").execute()

    return {
        "user_id": user_id,
        "risk_score": ai_result.get("risk_score"),
        "gaps": ai_result.get("gaps", []),
        "benefits_eligible": ai_result.get("benefits_eligible", []),
        "poverty_tax_annual": ai_result.get("poverty_tax_annual", 0),
        "ai_analysis": ai_result.get("ai_analysis", ""),
        "group_insights": ai_result.get("group_insights", []),
    }


@router.get("/circles/{circle_id}/risk-xray")
def get_risk_report(circle_id: str, current_user: dict = Depends(get_current_user)):
    """Return the cached risk report for the current user in a circle."""
    db = get_db()
    user_id = current_user["id"]

    survey = (
        db.table("risk_surveys")
        .select("*")
        .eq("user_id", user_id)
        .eq("circle_id", circle_id)
        .execute()
    )

    if not survey.data:
        raise HTTPException(status_code=404, detail="No risk survey found. Please complete the survey first.")

    row = survey.data[0]
    return {
        "user_id": user_id,
        "risk_score": row["risk_score"],
        "gaps": row["gaps_found"] or [],
        "benefits_eligible": row["benefits_eligible"] or [],
        "poverty_tax_annual": row["poverty_tax_annual"],
        "ai_analysis": row["ai_analysis"],
        "group_insights": row.get("group_insights") or [],
    }


@router.get("/circles/{circle_id}/risk-xray/summary")
def get_group_risk_summary(circle_id: str, current_user: dict = Depends(get_current_user)):
    """Return the group-level risk summary aggregated from all members' surveys."""
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

    # Fetch all member surveys for this circle
    all_surveys = (
        db.table("risk_surveys")
        .select("user_id, risk_score, gaps_found, poverty_tax_annual, benefits_eligible, ai_analysis")
        .eq("circle_id", circle_id)
        .execute()
    )

    if not all_surveys.data:
        return {
            "circle_id": circle_id,
            "group_risk_score": 0,
            "members_surveyed": 0,
            "total_unprotected_risk": 0,
            "total_poverty_tax": 0,
            "gap_summary": [],
            "member_reports": [],
        }

    member_results = []
    for row in all_surveys.data:
        member_results.append({
            "user_id": row["user_id"],
            "risk_score": row["risk_score"] or 0,
            "gaps": row["gaps_found"] or [],
            "poverty_tax_annual": row["poverty_tax_annual"] or 0,
            "benefits_eligible": row["benefits_eligible"] or [],
            "ai_analysis": row["ai_analysis"] or "",
        })

    group_metrics = compute_group_risk(member_results)

    return {
        "circle_id": circle_id,
        "members_surveyed": len(member_results),
        "member_reports": member_results,
        **group_metrics,
    }
