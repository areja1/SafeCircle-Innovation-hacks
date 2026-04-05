
def estimate_credit_impact(current_score_range: str, months_of_on_time_payments: int) -> dict:
    """
    Estimates the potential credit score impact of making on-time group payments.
    This is a simplified model and not a guarantee of a score change.

    Args:
        current_score_range: The user's current credit score range 
                             (e.g., "no_score", "below_580").
        months_of_on_time_payments: The number of months the user has made on-time payments.

    Returns:
        A dictionary describing the potential impact.
    """
    
    potential_impact = {
        "current_range": current_score_range,
        "new_range": current_score_range,
        "description": "Continued on-time payments will strengthen your credit history."
    }

    if months_of_on_time_payments < 6:
        potential_impact["description"] = "Keep up the great work! After 6 months of consistent on-time payments, you'll start to see a significant positive impact on your score."
        return potential_impact

    if current_score_range == "no_score":
        potential_impact["new_range"] = "580_669"
        potential_impact["description"] = "Congratulations! After 6+ months of on-time payments, you have likely established a credit score in the 'Fair' range (580-669). This is a huge first step!"
    
    elif current_score_range == "below_580":
        potential_impact["new_range"] = "580_669"
        potential_impact["description"] = "Great progress! After 6+ months of on-time payments, your score could improve from 'Poor' to the 'Fair' range (580-669). This makes a big difference in interest rates."

    elif current_score_range == "580_669":
        potential_impact["new_range"] = "670_739"
        potential_impact["description"] = "You're on the right track! With 6+ months of solid payment history, you are likely moving from the 'Fair' to the 'Good' range (670-739). Keep it up!"

    elif current_score_range == "670_739":
        potential_impact["description"] = "You already have a good score. Continued on-time payments will help maintain and slowly improve it over time, securing you the best financial products."

    return potential_impact
