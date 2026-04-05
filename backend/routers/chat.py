from fastapi import APIRouter, Depends
from models.schemas import ChatMessageRequest
from models.database import get_db
from routers.deps import get_current_user
from services.ai_service import client, CLAUDE_MODEL
import json

router = APIRouter()


def _build_system_prompt(user_data: dict, survey: dict | None, language: str) -> str:
    lang_instruction = "Respond in Spanish (Latin American). Keep it simple and warm." if language == "es" else "Respond in English."

    full_name = user_data.get("user_metadata", {}).get("full_name", "") or ""
    first_name = full_name.split()[0] if full_name else "there"

    if not survey:
        return f"""You are SafeCircle's personal financial assistant. The user's name is {first_name}. Use their name naturally in conversation — not in every message, but when it feels warm and personal.

You help underserved communities — gig workers, immigrants, and credit-invisible families — understand their financial situation and take action.

{first_name} has not completed their Risk X-Ray scan yet. Gently encourage them to complete it so you can give personalized advice. In the meantime, answer general financial questions about insurance, benefits, emergency funds, and crisis planning.

Keep responses short (3-5 sentences max), plain English, no jargon. Like a knowledgeable friend, not a textbook.
{lang_instruction}"""

    gaps = survey.get("gaps_found") or []
    benefits = survey.get("benefits_eligible") or []
    risk_score = survey.get("risk_score") or 0
    poverty_tax = survey.get("poverty_tax_annual") or 0
    employment = survey.get("employment_type", "unknown")
    has_health = survey.get("has_health_insurance", False)
    has_renters = survey.get("has_renters_insurance", False)
    drives_gig = survey.get("drives_for_gig_apps", False)
    has_rideshare = survey.get("has_rideshare_endorsement", False)
    monthly_income = survey.get("monthly_income", 0)
    savings = survey.get("emergency_savings", 0)
    credit = survey.get("credit_score_range", "unknown")

    gap_summary = ", ".join([g.get("title", "") for g in gaps]) if gaps else "none identified yet"
    benefit_summary = ", ".join([b.get("name", "") for b in benefits[:3]]) if benefits else "none identified yet"

    return f"""You are SafeCircle's personal financial assistant for {first_name}. Use their name naturally in conversation — not robotically in every message, but when it feels warm and personal (e.g. "Good news, {first_name}..." or "Based on your scan, {first_name}...").

USER PROFILE (for {first_name}):
- Risk score: {risk_score}/100 (higher = more at risk)
- Employment: {employment}
- Monthly income: ${monthly_income}
- Emergency savings: ${savings}
- Credit score range: {credit}
- Health insurance: {"Yes" if has_health else "NO — uninsured"}
- Renters insurance: {"Yes" if has_renters else "NO — unprotected"}
- Drives for gig apps: {"Yes" + (" (has rideshare endorsement)" if has_rideshare else " (NO rideshare endorsement — critical gap!)") if drives_gig else "No"}
- Hidden poverty tax: ${poverty_tax}/year in fees
- Key insurance gaps: {gap_summary}
- Benefits they may qualify for: {benefit_summary}

YOUR JOB:
- Answer questions using THEIR specific data above, not generic advice
- If they ask "do I need renters insurance?" — reference their actual gap, not a generic answer
- If they ask about a benefit — check if it's in their benefits list and explain how to apply
- Recommend concrete next steps with dollar amounts
- Keep responses short (4-6 sentences max), plain English, no jargon
- Be warm and direct — like a knowledgeable friend who already read their file
- Never say "consult a financial advisor" — give actual actionable help
- If a question is completely unrelated to finance/insurance/benefits, politely redirect

{lang_instruction}"""


@router.post("/chat")
def chat(body: ChatMessageRequest, current_user: dict = Depends(get_current_user)):
    """Personalized AI chat using the user's Risk X-Ray data as context."""
    db = get_db()
    user_id = current_user["id"]

    # Load most recent risk survey across all circles
    survey_row = (
        db.table("risk_surveys")
        .select("*")
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    survey = survey_row.data[0] if survey_row.data else None

    # Load profile for language preference
    profile = (
        db.table("profiles")
        .select("preferred_language")
        .eq("id", user_id)
        .maybe_single()
        .execute()
    )
    language = body.language
    if profile.data and profile.data.get("preferred_language"):
        language = profile.data["preferred_language"]

    system_prompt = _build_system_prompt(current_user, survey, language)

    # Build message history (cap at last 10 turns to keep tokens low)
    history = (body.history or [])[-10:]
    messages = history + [{"role": "user", "content": body.message}]

    response = client.messages.create(
        model=CLAUDE_MODEL,
        max_tokens=400,
        system=system_prompt,
        messages=messages,
    )

    reply = response.content[0].text
    return {"reply": reply}
