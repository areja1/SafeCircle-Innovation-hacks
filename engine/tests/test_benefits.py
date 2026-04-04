
import pytest
from engine.benefits_eligibility import check_all_benefits

# Test cases are dictionaries representing the 'survey' input
# Each key represents a different user scenario

# Scenario 1: Low-income family, should be eligible for most benefits
test_case_low_income_family = {
    "monthly_income": 1500,
    "household_size": 3,
    "dependents_count": 2,
    "state": "AZ"
}

# Scenario 2: Single person, moderate income, should be eligible for some
test_case_single_moderate_income = {
    "monthly_income": 2000,
    "household_size": 1,
    "dependents_count": 0,
    "state": "AZ"
}

# Scenario 3: High income, should be eligible for nothing
test_case_high_income = {
    "monthly_income": 8000,
    "household_size": 4,
    "dependents_count": 2,
    "state": "AZ"
}

# Scenario 4: Large household, testing 'each_additional' logic
test_case_large_household = {
    "monthly_income": 4000,
    "household_size": 9,
    "dependents_count": 7,
    "state": "AZ"
}

# Scenario 5: Just under the EITC limit with no children
test_case_eitc_no_children = {
    "monthly_income": 1500, # Annual: 18000
    "household_size": 1,
    "dependents_count": 0,
    "state": "AZ"
}

def test_low_income_family_eligibility():
    """
    Tests a family with low income that should qualify for SNAP, AHCCCS, LIHEAP, and EITC.
    """
    eligible_benefits = check_all_benefits(test_case_low_income_family)
    benefit_names = [b["name"] for b in eligible_benefits]
    
    assert len(eligible_benefits) == 4
    assert "Nutrition Assistance (SNAP)" in benefit_names
    assert "Medicaid (AHCCCS)" in benefit_names
    assert "Utility Bill Assistance (LIHEAP)" in benefit_names
    assert "Earned Income Tax Credit (EITC)" in benefit_names

def test_single_moderate_income_eligibility():
    """
    Tests a single person with moderate income who should only qualify for LIHEAP.
    - Income $2000/mo ($24k/yr)
    - HH size 1
    - SNAP limit: $2322 -> Eligible
    - AHCCCS limit: $1732 -> Not Eligible
    - LIHEAP limit: $2807 -> Eligible
    - EITC (0 children) limit: $18591 -> Not Eligible
    """
    eligible_benefits = check_all_benefits(test_case_single_moderate_income)
    benefit_names = [b["name"] for b in eligible_benefits]
    
    assert len(eligible_benefits) == 2
    assert "Nutrition Assistance (SNAP)" in benefit_names
    assert "Utility Bill Assistance (LIHEAP)" in benefit_names
    assert "Medicaid (AHCCCS)" not in benefit_names
    assert "Earned Income Tax Credit (EITC)" not in benefit_names

def test_high_income_eligibility():
    """
    Tests a family with high income who should not qualify for any benefits.
    """
    eligible_benefits = check_all_benefits(test_case_high_income)
    assert len(eligible_benefits) == 0

def test_large_household_eligibility():
    """
    Tests the calculation for households larger than the explicitly defined limits.
    - Income $4000/mo
    - HH size 9
    - SNAP limit for 8 is $8128, +$830 for 9th person = $8958. Should be eligible.
    - AHCCCS limit for 8 is $6064, +$619 for 9th person = $6683. Should be eligible.
    """
    eligible_benefits = check_all_benefits(test_case_large_household)
    benefit_names = [b["name"] for b in eligible_benefits]
    
    assert "Nutrition Assistance (SNAP)" in benefit_names
    assert "Medicaid (AHCCCS)" in benefit_names
    assert "Utility Bill Assistance (LIHEAP)" in benefit_names


def test_eitc_no_children_eligibility():
    """
    Tests EITC eligibility for a single person with no children, just below the income threshold.
    """
    eligible_benefits = check_all_benefits(test_case_eitc_no_children)
    benefit_names = [b["name"] for b in eligible_benefits]

    assert "Earned Income Tax Credit (EITC)" in benefit_names

def test_zero_income_no_eitc():
    """
    Tests that a user with zero income is not eligible for EITC (requires earned income).
    """
    case = {
        "monthly_income": 0,
        "household_size": 1,
        "dependents_count": 0,
        "state": "AZ"
    }
    eligible_benefits = check_all_benefits(case)
    benefit_names = [b["name"] for b in eligible_benefits]
    
    assert "Earned Income Tax Credit (EITC)" not in benefit_names
    # Should still be eligible for other benefits
    assert "Nutrition Assistance (SNAP)" in benefit_names
    assert "Medicaid (AHCCCS)" in benefit_names
    assert "Utility Bill Assistance (LIHEAP)" in benefit_names

