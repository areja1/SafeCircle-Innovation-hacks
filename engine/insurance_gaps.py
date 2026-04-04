
def detect_insurance_gaps(survey: dict, weights: dict) -> tuple[list[dict], int]:
    """
    Detects insurance gaps based on a user survey and calculates the associated risk score.

    Args:
        survey: A dictionary containing user's financial and household data.
        weights: A dictionary of weights for different risk factors.

    Returns:
        A tuple containing:
        - A list of dictionaries, where each dictionary represents an insurance gap.
        - An integer representing the total risk score contribution from these gaps.
    """
    gaps = []
    score = 0

    # --- INSURANCE GAPS ---
    
    if not survey.get("has_renters_insurance"):
        score += weights["no_renters_insurance"]
        gaps.append({
            "type": "renters",
            "title": "No Renters Insurance",
            "description": "Your landlord's insurance does NOT cover your belongings. If there's a fire, flood, or theft, you lose everything.",
            "risk_amount": 20000,
            "fix_cost_monthly": 15,
            "priority": "high"
        })
    
    if survey.get("drives_for_gig_apps") and not survey.get("has_rideshare_endorsement"):
        score += weights["no_rideshare_endorsement"]
        gaps.append({
            "type": "auto_rideshare",
            "title": "No Rideshare/Delivery Coverage",
            "description": "Your personal car insurance will DENY any claim while you're working for DoorDash, Uber, etc. One accident = $8,000+ out of your pocket.",
            "risk_amount": 8000,
            "fix_cost_monthly": 20,
            "priority": "critical"
        })
    
    if not survey.get("has_health_insurance"):
        score += weights["no_health_insurance"]
        gaps.append({
            "type": "health",
            "title": "No Health Insurance",
            "description": "One ER visit costs $2,200+ without insurance. A serious injury could cost $50,000-$100,000+.",
            "risk_amount": 50000,
            "fix_cost_monthly": 0,  # may qualify for $0 premium marketplace
            "priority": "critical"
        })
    
    if not survey.get("has_auto_insurance") and survey.get("employment_type") in ["gig_worker", "self_employed"]:
        score += weights["no_auto_insurance"]
        gaps.append({
            "type": "auto",
            "title": "No Auto Insurance",
            "description": "Driving without insurance is illegal and one accident could cost you $10,000+ plus legal penalties.",
            "risk_amount": 15000,
            "fix_cost_monthly": 150,
            "priority": "critical"
        })
    
    if not survey.get("has_life_insurance") and survey.get("household_size", 1) > 1:
        score += weights["no_life_insurance"]
        gaps.append({
            "type": "life",
            "title": "No Life Insurance",
            "description": "If something happens to you, your family faces $88,000+ in costs with no income replacement. A basic policy costs $15-25/month.",
            "risk_amount": 88000,
            "fix_cost_monthly": 20,
            "priority": "high"
        })
        
    return gaps, score
