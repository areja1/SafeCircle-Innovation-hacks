"""
Calculate the annual 'poverty tax' — hidden costs of being low-income.
"""

def calculate_poverty_tax(survey: dict) -> dict:
    items = []
    
    credit = survey.get("credit_score_range", "unknown")
    
    # Credit score insurance penalty
    if credit in ["no_score", "below_580"]:
        items.append({
            "category": "Insurance credit penalty",
            "annual_cost": 4581,
            "description": "Bad or no credit score means you pay $4,581 more per year for car and home insurance.",
            "fixable": True,
            "fix_action": "Build credit through SafeCircle group payments"
        })
    elif credit == "580_669":
        items.append({
            "category": "Insurance credit penalty",
            "annual_cost": 2200,
            "description": "Fair credit means you pay $2,200 more per year for insurance than someone with excellent credit.",
            "fixable": True,
            "fix_action": "Continue building credit — you're almost there"
        })
    
    # Check cashing fees (if likely unbanked)
    if credit == "no_score" and survey.get("employment_type") in ["gig_worker", "self_employed"]:
        items.append({
            "category": "Check cashing fees",
            "annual_cost": 983,
            "description": "Without a bank account, cashing paychecks costs about $983/year.",
            "fixable": True,
            "fix_action": "Open a basic checking account — many have no minimum balance"
        })
    
    # Missing EITC (rough check)
    income = survey.get("monthly_income", 0) * 12
    household = survey.get("household_size", 1)
    if income < 60000 and income > 0 and household >= 2:
        items.append({
            "category": "Unclaimed tax credits (EITC)",
            "annual_cost": 1500,
            "description": "You likely qualify for the Earned Income Tax Credit worth ~$1,500/year but may not be claiming it.",
            "fixable": True,
            "fix_action": "File taxes even if income is low — free filing at IRS.gov"
        })
    
    # Higher deposit costs
    if credit in ["no_score", "below_580"]:
        items.append({
            "category": "Utility and rental deposits",
            "annual_cost": 500,
            "description": "No/poor credit means higher deposits for utilities, apartments, and phone plans.",
            "fixable": True,
            "fix_action": "Build credit score above 650 to eliminate most deposits"
        })
    
    # Missing renters insurance (potential loss amortized)
    if not survey.get("has_renters_insurance"):
        items.append({
            "category": "Uninsured belongings risk",
            "annual_cost": 400,
            "description": "Without renters insurance, you're self-insuring $20,000+ in belongings. Amortized risk: ~$400/year.",
            "fixable": True,
            "fix_action": "Get renters insurance for $15/month"
        })
    
    total = sum(item["annual_cost"] for item in items)
    
    return {
        "total_annual": total,
        "items": items
    }
