# Rule-based checks for Arizona-specific benefits eligibility.
import json
from pathlib import Path

DATA_DIR = Path(__file__).parent / "data"

def _get_limit_for_household(ruleset: dict, household_size: int) -> int:
    """Helper to find the income limit for a given household size from a ruleset."""
    household_key = str(household_size)
    if household_key in ruleset:
        return ruleset[household_key]
    
    # Handle sizes larger than the explicit list
    if "each_additional" in ruleset:
        max_defined_size = max(int(k) for k in ruleset if k.isdigit())
        base_limit = ruleset[str(max_defined_size)]
        additional_members = household_size - max_defined_size
        return base_limit + (additional_members * ruleset["each_additional"])
        
    # For rules without 'each_additional' (like EITC), find the highest limit
    return max(ruleset.values())

def check_all_benefits(survey: dict) -> list[dict]:
    """
    Checks a user's survey data against Arizona benefits programs.

    Args:
        survey: A dictionary containing user's financial and household data,
                including 'monthly_income', 'household_size', and 'dependents_count'.

    Returns:
        A list of benefit dictionaries for which the user is likely eligible.
    """
    with open(DATA_DIR / "benefits_rules.json") as f:
        rules = json.load(f)

    eligible_benefits = []
    
    monthly_income = survey.get("monthly_income", 0)
    annual_income = monthly_income * 12
    household_size = survey.get("household_size", 1)
    
    # --- 1. SNAP Check (Nutrition Assistance) ---
    snap_rules = rules["snap"]["rules"]["gross_income_185_fpl"]
    snap_limit = _get_limit_for_household(snap_rules, household_size)
    if monthly_income <= snap_limit:
        eligible_benefits.append({
            "name": rules["snap"]["name"],
            "description": rules["snap"]["description"],
            "estimated_value": rules["snap"]["estimated_value"],
            "how_to_apply": rules["snap"]["how_to_apply"],
            "apply_url": rules["snap"]["apply_url"],
        })

    # --- 2. AHCCCS Check (Medicaid) ---
    ahcccs_rules = rules["ahcccs"]["rules"]["gross_income_138_fpl"]
    ahcccs_limit = _get_limit_for_household(ahcccs_rules, household_size)
    if monthly_income <= ahcccs_limit:
        eligible_benefits.append({
            "name": rules["ahcccs"]["name"],
            "description": rules["ahcccs"]["description"],
            "estimated_value": rules["ahcccs"]["estimated_value"],
            "how_to_apply": rules["ahcccs"]["how_to_apply"],
            "apply_url": rules["ahcccs"]["apply_url"],
        })

    # --- 3. LIHEAP Check (Utility Assistance) ---
    liheap_rules = rules["liheap"]["rules"]["gross_income_60_smi"]
    liheap_limit = _get_limit_for_household(liheap_rules, household_size)
    if monthly_income <= liheap_limit:
         eligible_benefits.append({
            "name": rules["liheap"]["name"],
            "description": rules["liheap"]["description"],
            "estimated_value": rules["liheap"]["estimated_value"],
            "how_to_apply": rules["liheap"]["how_to_apply"],
            "apply_url": rules["liheap"]["apply_url"],
        })

    # --- 4. EITC Check (Federal Tax Credit) ---
    # Note: EITC also depends on having "earned income", which we assume if income > 0
    dependents_count = survey.get("dependents_count", 0) # Assumes survey has this field
    eitc_rules = rules["eitc"]["rules"]["max_agi_by_children"]
    
    # Determine the key for the rules based on number of children
    if dependents_count >= 3:
        children_key = "3"
    else:
        children_key = str(dependents_count)

    eitc_limit = eitc_rules.get(children_key, 0)
    
    if annual_income > 0 and annual_income <= eitc_limit:
        eligible_benefits.append({
            "name": rules["eitc"]["name"],
            "description": rules["eitc"]["description"],
            "estimated_value": rules["eitc"]["estimated_value"],
            "how_to_apply": rules["eitc"]["how_to_apply"],
            "apply_url": rules["eitc"]["apply_url"],
        })
        
    return eligible_benefits
