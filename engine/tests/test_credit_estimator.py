
import pytest
from engine.credit_estimator import estimate_credit_impact

def test_impact_no_score_sufficient_history():
    """
    Tests that a user with 'no_score' moves to the 'Fair' range after 6 months.
    """
    result = estimate_credit_impact("no_score", 6)
    assert result["new_range"] == "580_669"
    assert "established a credit score" in result["description"]

def test_impact_below_580_sufficient_history():
    """
    Tests that a user with a 'Poor' score moves to the 'Fair' range after 6 months.
    """
    result = estimate_credit_impact("below_580", 12)
    assert result["new_range"] == "580_669"
    assert "improve from 'Poor' to the 'Fair' range" in result["description"]

def test_impact_580_669_sufficient_history():
    """
    Tests that a user with a 'Fair' score moves to the 'Good' range after 6 months.
    """
    result = estimate_credit_impact("580_669", 7)
    assert result["new_range"] == "670_739"
    assert "moving from the 'Fair' to the 'Good' range" in result["description"]

def test_impact_good_score_no_range_change():
    """
    Tests that a user with a 'Good' score does not change range but gets positive feedback.
    """
    result = estimate_credit_impact("670_739", 8)
    assert result["new_range"] == "670_739" # No change in range
    assert "You already have a good score" in result["description"]

def test_impact_insufficient_history():
    """
    Tests that if a user has fewer than 6 months of history, they get an encouraging message
    and their score range does not change.
    """
    result = estimate_credit_impact("below_580", 3)
    assert result["new_range"] == "below_580" # No change yet
    assert "After 6 months" in result["description"]

def test_unknown_range_no_change():
    """
    Tests that an unknown or high score range results in no change and a generic message.
    """
    result = estimate_credit_impact("740_plus", 12)
    assert result["new_range"] == "740_plus"
    assert "strengthen your credit history" in result["description"]
