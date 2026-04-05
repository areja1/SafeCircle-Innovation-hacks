import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), "..", "..", "engine"))


def check_benefits_eligibility(
    state: str,
    monthly_income: int,
    household_size: int,
    employment_type: str,
    has_health_insurance: bool,
) -> list[dict]:
    """
    Check which government benefits the user may qualify for.
    Calls Sumedh's engine first; falls back to basic built-in rules.
    """
    try:
        from benefits_eligibility import check_eligibility  # type: ignore
        return check_eligibility(
            state=state,
            monthly_income=monthly_income,
            household_size=household_size,
            employment_type=employment_type,
            has_health_insurance=has_health_insurance,
        )
    except ImportError:
        pass

    # Fallback: built-in basic rules (AZ-focused)
    benefits = []
    annual_income = monthly_income * 12

    # SNAP — Food assistance
    snap_limits = {1: 1580, 2: 2137, 3: 2694, 4: 3250, 5: 3807}
    snap_limit = snap_limits.get(min(household_size, 5), 3807 + (household_size - 5) * 557)
    if monthly_income <= snap_limit:
        benefits.append({
            "name": "SNAP (Food Assistance)",
            "description": "Monthly grocery benefits loaded onto an EBT card.",
            "estimated_value": household_size * 200 * 12,
            "how_to_apply": "Apply online at healthearizonaplus.gov or visit your local DES office.",
            "apply_url": "https://www.healthearizonaplus.gov",
        })

    # Medicaid / AHCCCS (Arizona)
    if state == "AZ" and not has_health_insurance and annual_income <= 20120 * household_size:
        benefits.append({
            "name": "AHCCCS (Arizona Medicaid)",
            "description": "Free or low-cost health insurance through Arizona's Medicaid program.",
            "estimated_value": 6000,
            "how_to_apply": "Apply at healthearizonaplus.gov. Coverage can start same month you apply.",
            "apply_url": "https://www.healthearizonaplus.gov",
        })

    # EITC — Earned Income Tax Credit
    if 0 < annual_income < 60000 and employment_type not in ["unemployed"]:
        eitc_value = 600 if household_size == 1 else (3995 if household_size == 2 else 6604)
        benefits.append({
            "name": "Earned Income Tax Credit (EITC)",
            "description": "A tax refund worth hundreds to thousands of dollars even if you owe no taxes.",
            "estimated_value": eitc_value,
            "how_to_apply": "File your federal taxes — even if your income was low. Use IRS Free File at irs.gov/freefile.",
            "apply_url": "https://www.irs.gov/credits-deductions/individuals/earned-income-tax-credit",
        })

    # LIHEAP — Utility assistance
    if annual_income <= 27180 * household_size * 0.6:
        benefits.append({
            "name": "LIHEAP (Utility Bill Assistance)",
            "description": "Arizona program that helps pay electric and heating bills.",
            "estimated_value": 1000,
            "how_to_apply": "Apply through Arizona DES at des.az.gov/liheap. Apply early — funds run out.",
            "apply_url": "https://des.az.gov/liheap",
        })

    # Unemployment (if unemployed)
    if employment_type == "unemployed":
        benefits.append({
            "name": "Unemployment Insurance",
            "description": "Weekly payments of $117–$320 while you look for work in Arizona.",
            "estimated_value": 8000,
            "how_to_apply": "File immediately at des.az.gov. Every week you delay = money you lose forever.",
            "apply_url": "https://des.az.gov/services/employment/unemployment-individual",
        })

    return benefits
