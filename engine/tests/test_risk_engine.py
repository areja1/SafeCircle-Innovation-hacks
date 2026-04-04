
import pytest
from engine.risk_engine import calculate_risk_score, calculate_group_risk

# Minimal survey for a user with many risks
survey_high_risk = {
    "has_renters_insurance": False,
    "drives_for_gig_apps": True,
    "has_rideshare_endorsement": False,
    "has_health_insurance": False,
    "has_auto_insurance": False,
    "has_life_insurance": False,
    "monthly_income": 2000,
    "emergency_savings": 100,
    "credit_score_range": "below_580",
    "employment_type": "gig_worker",
    "household_size": 2
}

# Minimal survey for a user with few risks
survey_low_risk = {
    "has_renters_insurance": True,
    "drives_for_gig_apps": False,
    "has_health_insurance": True,
    "has_auto_insurance": True,
    "has_life_insurance": True,
    "monthly_income": 5000,
    "emergency_savings": 20000,
    "credit_score_range": "740_plus",
    "employment_type": "w2_employee",
    "household_size": 1
}

def test_calculate_risk_score_high_risk():
    """
    Tests that a user with many risk factors gets a high score
    and the correct gaps are identified.
    """
    # Note: This test is based on the risk_weights.json values.
    # no_renters_insurance: 15
    # no_rideshare_endorsement: 20
    # no_health_insurance: 20
    # no_auto_insurance: 15 (since employment is gig_worker)
    # no_life_insurance: 10 (since household_size > 1)
    # no_emergency_savings: 15
    # poor_credit: 8
    # gig_worker: 8
    # Total expected score = 15+20+20+15+10+15+8+8 = 111, capped at 100
    
    result = calculate_risk_score(survey_high_risk)
    
    assert result["risk_score"] == 100
    assert len(result["gaps"]) == 5 # Renters, Rideshare, Health, Auto, Life
    
    gap_types = [g["type"] for g in result["gaps"]]
    assert "renters" in gap_types
    assert "auto_rideshare" in gap_types
    assert "health" in gap_types
    assert "life" in gap_types
    assert "auto" in gap_types
    
    # Check poverty tax calculation is non-zero
    assert result["poverty_tax_annual"] > 0

def test_calculate_risk_score_low_risk():
    """
    Tests that a user with few risk factors gets a low score and no gaps.
    """
    # Expected score should be 0 as all major risks are mitigated
    result = calculate_risk_score(survey_low_risk)
    
    assert result["risk_score"] == 0
    assert len(result["gaps"]) == 0
    assert result["poverty_tax_annual"] == 0

def test_calculate_group_risk():
    """
    Tests the aggregation of risk scores and gaps for a group.
    """
    member_results = [
        calculate_risk_score(survey_high_risk), # score 100
        calculate_risk_score(survey_low_risk),  # score 0
    ]
    
    group_result = calculate_group_risk(member_results)
    
    # Average score = (100 + 0) / 2 = 50
    assert group_result["group_risk_score"] == 50
    
    # Total unprotected risk from high-risk user's 5 gaps:
    # 20000 (renters) + 8000 (rideshare) + 50000 (health) + 15000 (auto) + 88000 (life) = 181000
    assert group_result["total_unprotected_risk"] == 181000
    
    # Poverty tax from high-risk user
    assert group_result["total_poverty_tax"] > 0
    
    # Check gap summary
    assert len(group_result["gap_summary"]) == 5
    
    # Find the renters insurance summary
    renters_summary = next((g for g in group_result["gap_summary"] if g["gap_type"] == "renters"), None)
    assert renters_summary is not None
    assert renters_summary["members_affected"] == 1
    assert renters_summary["total_members"] == 2
    assert renters_summary["message"] == "1 of 2 members have no renters insurance"

def test_empty_group_risk():
    """
    Tests that an empty group returns zero values.
    """
    group_result = calculate_group_risk([])
    assert group_result["group_risk_score"] == 0
    assert group_result["total_unprotected_risk"] == 0
    assert len(group_result["gap_summary"]) == 0

def test_life_insurance_gap():
    """
    Tests that life insurance gap is correctly identified for a multi-person household.
    """
    survey = {
        **survey_low_risk,
        "has_life_insurance": False,
        "household_size": 3,
    }
    result = calculate_risk_score(survey)
    gap_types = [g["type"] for g in result["gaps"]]
    assert "life" in gap_types

