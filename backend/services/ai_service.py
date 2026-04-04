import json
import anthropic
from config import ANTHROPIC_API_KEY

client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

CLAUDE_MODEL = "claude-sonnet-4-20250514"


def _parse_json_response(text: str) -> dict:
    """Strip markdown fences from Claude response and parse JSON."""
    if "```json" in text:
        text = text.split("```json")[1].split("```")[0]
    elif "```" in text:
        text = text.split("```")[1].split("```")[0]
    return json.loads(text.strip())


def analyze_risk(survey_data: dict, circle_members_data: list[dict]) -> dict:
    """
    Send survey data to Claude for risk analysis.
    Returns structured risk report with score, gaps, benefits, and AI narrative.
    """
    prompt = f"""You are a financial risk analyst for underserved communities.
    Analyze this person's financial situation and their group's collective risk.

    INDIVIDUAL DATA:
    {json.dumps(survey_data, indent=2)}

    GROUP MEMBERS DATA:
    {json.dumps(circle_members_data, indent=2)}

    Return a JSON response with EXACTLY this structure:
    {{
        "risk_score": <0-100 integer, 100 = highest risk>,
        "gaps": [
            {{
                "type": "<renters|auto_rideshare|health|life|disability>",
                "title": "<short title>",
                "description": "<plain English explanation of the gap>",
                "risk_amount": <dollars they could lose>,
                "fix_cost_monthly": <monthly cost to fix>,
                "priority": "<critical|high|medium>"
            }}
        ],
        "benefits_eligible": [
            {{
                "name": "<benefit name>",
                "description": "<what it is>",
                "estimated_value": <annual dollar value>,
                "how_to_apply": "<plain English steps>",
                "apply_url": "<URL or null>"
            }}
        ],
        "poverty_tax_annual": <estimated annual hidden costs in dollars>,
        "ai_analysis": "<2-3 paragraph plain English narrative about their situation, gaps, and what to fix first>",
        "group_insights": [
            "<X of Y members have no renters insurance>",
            "<X of Y members don't know their auto insurance won't cover gig work>"
        ]
    }}

    IMPORTANT RULES:
    - Use real dollar amounts based on national/Arizona averages
    - Renters insurance gap: ~$15/month fixes, ~$20,000-30,000 at risk
    - Rideshare endorsement gap: ~$15-25/month fixes, ~$8,000+ at risk per accident
    - No health insurance: ~$2,200+ per ER visit at risk
    - No life insurance: ~$88,000 average end-of-life cost
    - Check EITC eligibility (income under ~$60,000 for families)
    - Check SNAP eligibility (income under ~$2,700/month for family of 3)
    - Check LIHEAP eligibility for Arizona (utility assistance)
    - Poverty tax includes: credit score penalties on insurance ($4,500/yr if below 580), check cashing fees ($983/yr if unbanked), payday loan fees ($520/yr average)
    - Write in plain English. No jargon. Like talking to a friend.
    - If someone drives for DoorDash/Uber WITHOUT a rideshare endorsement, this is CRITICAL priority.
    """

    response = client.messages.create(
        model=CLAUDE_MODEL,
        max_tokens=2000,
        messages=[{"role": "user", "content": prompt}],
    )

    return _parse_json_response(response.content[0].text)


def generate_crisis_triage(crisis_type: str, state: str, user_context: dict = None) -> dict:
    """
    Generate AI-personalized crisis triage steps for a given crisis type and state.
    Returns structured triage plan with time-sequenced steps.
    """
    prompt = f"""You are a financial first responder. Someone just experienced a {crisis_type} in {state}.

    User context (if available): {json.dumps(user_context) if user_context else 'Not provided'}

    Generate a time-sequenced financial triage plan. Return JSON:
    {{
        "crisis_type": "{crisis_type}",
        "steps": [
            {{
                "id": "<unique id like step_1>",
                "priority": "<red|orange|yellow|green>",
                "time_window": "<e.g. '0-4 hours', '24-72 hours'>",
                "title": "<short action title>",
                "description": "<exactly what to do, plain English>",
                "why_it_matters": "<what happens if you don't do this>",
                "cost_of_not_doing": <dollars lost if skipped>,
                "deadline_hours": <hours from now as integer, null if flexible>,
                "action_url": "<relevant URL if applicable, null otherwise>"
            }}
        ],
        "estimated_total_savings": <total dollars saved by following all steps>,
        "dont_sign_warning": "<specific warning about what NOT to sign or agree to>"
    }}

    PRIORITY LEVELS:
    - RED (0-4 hours): Life safety, prevent further damage, critical documentation
    - ORANGE (4-24 hours): Income replacement, healthcare coverage, fraud prevention
    - YELLOW (24-72 hours): Insurance filing, benefits applications, budget adjustment
    - GREEN (1-4 weeks): Long-term planning, settlement negotiations, recovery

    RULES:
    - 8-12 steps total across all priorities
    - Include state-specific info for {state} (filing deadlines, programs, URLs)
    - Include real dollar amounts for cost_of_not_doing
    - For car accidents: warn about early settlement offers (40% below fair value)
    - For job loss: unemployment filing deadline is critical (each week delay = $400-600 lost)
    - For medical: itemized bill request, charity care, No Surprises Act rights
    - For death: credit freeze within 24 hours, death certificate ordering, Social Security notification
    - For home damage: PHOTOGRAPH EVERYTHING before cleanup
    - Write like you're talking to a scared friend, not a textbook
    """

    response = client.messages.create(
        model=CLAUDE_MODEL,
        max_tokens=2000,
        messages=[{"role": "user", "content": prompt}],
    )

    return _parse_json_response(response.content[0].text)
