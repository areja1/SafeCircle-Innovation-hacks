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


def _fallback_risk(survey_data: dict, circle_members_data: list[dict]) -> dict:
    """Deterministic fallback when Claude is unavailable."""
    gaps = []
    score = 30

    if not survey_data.get("has_health_insurance"):
        score += 20
        gaps.append({
            "type": "health",
            "title": "No Health Insurance",
            "description": "You have no health coverage. A single ER visit could cost $2,200+.",
            "risk_amount": 10000,
            "fix_cost_monthly": 200,
            "priority": "critical",
        })
    if not survey_data.get("has_renters_insurance"):
        score += 10
        gaps.append({
            "type": "renters",
            "title": "No Renters Insurance",
            "description": "Your belongings aren't covered if there's a fire, theft, or water damage.",
            "risk_amount": 20000,
            "fix_cost_monthly": 15,
            "priority": "high",
        })
    if survey_data.get("drives_for_gig_apps") and not survey_data.get("has_rideshare_endorsement"):
        score += 15
        gaps.append({
            "type": "auto_rideshare",
            "title": "No Rideshare Coverage",
            "description": "Your personal auto policy won't cover accidents while driving for DoorDash/Uber.",
            "risk_amount": 8000,
            "fix_cost_monthly": 20,
            "priority": "critical",
        })

    n_members = len(circle_members_data)
    uninsured = sum(1 for m in circle_members_data if not m.get("has_health_insurance", True))
    group_insights = []
    if n_members > 0 and uninsured > 0:
        group_insights.append(f"{uninsured} of {n_members + 1} members have no health insurance")

    return {
        "risk_score": min(score, 100),
        "gaps": gaps,
        "benefits_eligible": [],
        "poverty_tax_annual": 0,
        "ai_analysis": (
            "We were unable to generate a personalized AI analysis right now. "
            "The gaps identified above are based on your survey answers. "
            "Review each one and take action on the critical items first."
        ),
        "group_insights": group_insights,
    }


def _fallback_crisis_triage(crisis_type: str, state: str) -> dict:
    """Deterministic fallback when Claude is unavailable."""
    return {
        "crisis_type": crisis_type,
        "steps": [
            {
                "id": "step_1",
                "priority": "red",
                "time_window": "0-4 hours",
                "title": "Document Everything Now",
                "description": "Take photos and videos of all damage, injuries, or evidence. Write down exactly what happened while it's fresh.",
                "why_it_matters": "Evidence collected immediately is far stronger for insurance and legal claims.",
                "cost_of_not_doing": 5000,
                "deadline_hours": 4,
                "action_url": None,
            },
            {
                "id": "step_2",
                "priority": "red",
                "time_window": "0-4 hours",
                "title": "Do NOT Sign Anything",
                "description": "Do not sign any releases, settlement agreements, or paperwork from any company or adjuster until you fully understand what you're agreeing to.",
                "why_it_matters": "First settlement offers are typically 40% below fair value. Signing waives your rights.",
                "cost_of_not_doing": 8000,
                "deadline_hours": 4,
                "action_url": None,
            },
            {
                "id": "step_3",
                "priority": "orange",
                "time_window": "4-24 hours",
                "title": "File Your Insurance Claim",
                "description": "Call your insurance company and open a claim. Get a claim number and the adjuster's contact information.",
                "why_it_matters": "Delays in reporting can reduce or void your coverage.",
                "cost_of_not_doing": 3000,
                "deadline_hours": 24,
                "action_url": None,
            },
            {
                "id": "step_4",
                "priority": "yellow",
                "time_window": "24-72 hours",
                "title": "Check Emergency Assistance Programs",
                "description": "Search for local emergency assistance, community organizations, and government programs that can help right now.",
                "why_it_matters": "Many people leave hundreds or thousands in benefits unclaimed.",
                "cost_of_not_doing": 1000,
                "deadline_hours": 72,
                "action_url": None,
            },
        ],
        "estimated_total_savings": 17000,
        "dont_sign_warning": "Do not sign any settlement agreements or releases without reviewing them carefully. Early offers are often 40% below fair value. You have the right to review all documents.",
    }


def analyze_risk(survey_data: dict, circle_members_data: list[dict]) -> dict:
    """
    Send survey data to Claude for risk analysis.
    Returns structured risk report with score, gaps, benefits, and AI narrative.
    Falls back to deterministic engine output if Claude is unavailable.
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

    try:
        response = client.messages.create(
            model=CLAUDE_MODEL,
            max_tokens=2000,
            messages=[{"role": "user", "content": prompt}],
        )
        return _parse_json_response(response.content[0].text)
    except Exception:
        return _fallback_risk(survey_data, circle_members_data)


def generate_crisis_triage(crisis_type: str, state: str, user_context: dict = None) -> dict:
    """
    Generate AI-personalized crisis triage steps for a given crisis type and state.
    Returns structured triage plan with time-sequenced steps.
    Falls back to a static playbook if Claude is unavailable.
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

    try:
        response = client.messages.create(
            model=CLAUDE_MODEL,
            max_tokens=2000,
            messages=[{"role": "user", "content": prompt}],
        )
        return _parse_json_response(response.content[0].text)
    except Exception:
        return _fallback_crisis_triage(crisis_type, state)
