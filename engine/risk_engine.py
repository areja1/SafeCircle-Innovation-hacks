
import json
from pathlib import Path

from .poverty_tax import calculate_poverty_tax
from .insurance_gaps import detect_insurance_gaps

DATA_DIR = Path(__file__).parent / "data"

def load_json(filename):
    with open(DATA_DIR / filename) as f:
        return json.load(f)

def calculate_risk_score(survey: dict) -> dict:
    """
    Calculate individual risk score from survey answers.
    Returns: { risk_score, gaps, poverty_tax_annual }
    """
    weights = load_json("risk_weights.json")
    
    # --- INSURANCE GAPS ---
    gaps, score = detect_insurance_gaps(survey, weights)
    
    # --- EMERGENCY SAVINGS ---
    
    monthly_income = survey.get("monthly_income", 0)
    savings = survey.get("emergency_savings", 0)
    
    if savings < 400:
        score += weights["no_emergency_savings"]  # +15
    elif savings < monthly_income:
        score += weights["low_emergency_savings"]  # +8
    elif savings < monthly_income * 3:
        score += weights["moderate_emergency_savings"]  # +3
    
    # --- CREDIT SCORE ---
    
    credit = survey.get("credit_score_range", "unknown")
    if credit == "no_score":
        score += weights["no_credit_score"]  # +10
    elif credit == "below_580":
        score += weights["poor_credit"]  # +8
    elif credit == "unknown":
        score += weights["unknown_credit"]  # +5
    
    # --- EMPLOYMENT VULNERABILITY ---
    
    emp = survey.get("employment_type", "")
    if emp == "gig_worker":
        score += weights["gig_worker"]  # +8
    elif emp == "unemployed":
        score += weights["unemployed"]  # +12
    
    # Cap at 100
    score = min(score, 100)
    
    # --- POVERTY TAX ---
    poverty_tax = calculate_poverty_tax(survey)
    
    return {
        "risk_score": score,
        "gaps": gaps,
        "poverty_tax_annual": poverty_tax["total_annual"],
        "poverty_tax_breakdown": poverty_tax["items"]
    }


def calculate_group_risk(member_results: list[dict]) -> dict:
    """Calculate group-level risk metrics from individual results."""
    
    if not member_results:
        return {"group_risk_score": 0, "gap_summary": [], "total_unprotected_risk": 0}
    
    total = len(member_results)
    avg_score = sum(m["risk_score"] for m in member_results) // total
    total_risk = sum(
        sum(g["risk_amount"] for g in m.get("gaps", []))
        for m in member_results
    )
    total_poverty_tax = sum(m.get("poverty_tax_annual", 0) for m in member_results)
    
    # Count gaps across group
    gap_counts = {}
    for m in member_results:
        for g in m.get("gaps", []):
            gtype = g["type"]
            if gtype not in gap_counts:
                gap_counts[gtype] = {"count": 0, "title": g["title"], "total_risk": 0}
            gap_counts[gtype]["count"] += 1
            gap_counts[gtype]["total_risk"] += g["risk_amount"]
    
    gap_summary = []
    for gtype, data in gap_counts.items():
        gap_summary.append({
            "gap_type": gtype,
            "members_affected": data["count"],
            "total_members": total,
            "total_risk": data["total_risk"],
            "message": f"{data['count']} of {total} members have no {data['title'].lower().replace('no ', '')}"
        })
    
    return {
        "group_risk_score": avg_score,
        "total_unprotected_risk": total_risk,
        "total_poverty_tax": total_poverty_tax,
        "total_unclaimed_benefits": 0,  # filled by AI analysis
        "gap_summary": sorted(gap_summary, key=lambda x: x["members_affected"], reverse=True)
    }
