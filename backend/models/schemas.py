from pydantic import BaseModel, Field
from typing import Optional, List, Literal
from datetime import datetime


# ============================================================
# REQUEST MODELS
# ============================================================

class SignupRequest(BaseModel):
    email: str
    password: str
    full_name: str
    preferred_language: Literal["en", "es"] = "en"


class LoginRequest(BaseModel):
    email: str
    password: str


class CreateCircleRequest(BaseModel):
    name: str
    description: Optional[str] = None


class JoinCircleRequest(BaseModel):
    invite_code: str


class SurveyAnswersRequest(BaseModel):
    employment_type: Literal["w2_employee", "gig_worker", "self_employed", "unemployed", "student"]
    has_health_insurance: bool
    health_insurance_type: Literal["employer", "marketplace", "medicaid", "none", "other"]
    has_renters_insurance: bool
    has_auto_insurance: bool
    drives_for_gig_apps: bool = False
    has_rideshare_endorsement: bool = False
    monthly_income: int
    emergency_savings: int
    household_size: int = 1
    has_life_insurance: bool = False
    credit_score_range: Literal["no_score", "below_580", "580_669", "670_739", "740_plus", "unknown"]


class CrisisStartRequest(BaseModel):
    crisis_type: Literal["car_accident", "job_loss", "medical_emergency", "death_in_family", "home_damage"]
    state: str = "AZ"


class StepCompleteRequest(BaseModel):
    step_id: str
    completed: bool = True


class CrisisSavingsBreakdownItem(BaseModel):
    category: str
    category_label: str
    estimated_amount: float
    description: str
    timeframe: Optional[str] = None


class CrisisCategoryFeedbackItem(BaseModel):
    category: str
    category_label: str
    suggested_amount: float
    received: bool
    actual_amount: Optional[float] = None
    notes: Optional[str] = None


class CrisisFeedbackRequest(BaseModel):
    session_id: str
    suggested_amount: int
    was_accurate: bool
    actual_amount: Optional[int] = None  # If not accurate, what they got
    got_nothing: bool = False  # True if they received nothing
    feedback_notes: Optional[str] = None  # Additional context
    category_feedback: List[CrisisCategoryFeedbackItem] = Field(default_factory=list)


class ContributeRequest(BaseModel):
    amount: int  # in dollars


class FundRequestCreate(BaseModel):
    amount: int  # in dollars
    reason: str
    crisis_type: str


class VoteRequest(BaseModel):
    request_id: str
    vote: bool  # True = approve, False = deny


class BenefitsCheckRequest(BaseModel):
    state: str
    monthly_income: int
    household_size: int
    employment_type: str
    has_health_insurance: bool


class ChatMessageRequest(BaseModel):
    message: str
    language: Literal["en", "es"] = "en"
    history: Optional[List[dict]] = None


# ============================================================
# RESPONSE MODELS
# ============================================================

class InsuranceGapResponse(BaseModel):
    type: str
    title: str
    description: str
    risk_amount: int
    fix_cost_monthly: int
    priority: Literal["critical", "high", "medium"]


class BenefitResponse(BaseModel):
    name: str
    description: str
    estimated_value: int
    how_to_apply: str
    apply_url: Optional[str] = None


class RiskReportResponse(BaseModel):
    user_id: str
    risk_score: int
    gaps: List[InsuranceGapResponse]
    benefits_eligible: List[BenefitResponse]
    poverty_tax_annual: int
    ai_analysis: str


class GapSummaryResponse(BaseModel):
    gap_type: str
    members_affected: int
    total_members: int
    total_risk: int
    message: str


class GroupRiskReportResponse(BaseModel):
    circle_id: str
    group_risk_score: int
    total_unprotected_risk: int
    total_unclaimed_benefits: int
    total_poverty_tax: int
    member_reports: List[RiskReportResponse]
    gap_summary: List[GapSummaryResponse]


class TriageStepResponse(BaseModel):
    id: str
    priority: Literal["red", "orange", "yellow", "green"]
    time_window: str
    title: str
    description: str
    why_it_matters: str
    cost_of_not_doing: int
    deadline_hours: Optional[int] = None
    action_url: Optional[str] = None
    completed: bool = False


class CrisisSessionResponse(BaseModel):
    id: str
    crisis_type: str
    started_at: str
    steps: List[TriageStepResponse]
    estimated_savings: int
    savings_breakdown: List[CrisisSavingsBreakdownItem] = Field(default_factory=list)
    dont_sign_warning: Optional[str] = None
    feedback_submitted: bool = False


class CrisisFeedbackHistoryItem(BaseModel):
    id: str
    crisis_type: str
    state: str
    suggested_amount: float
    was_accurate: bool
    actual_amount: Optional[float] = None
    got_nothing: bool = False
    feedback_notes: Optional[str] = None
    category_feedback: List[CrisisCategoryFeedbackItem] = Field(default_factory=list)
    created_at: str


class CrisisAccuracyMetrics(BaseModel):
    crisis_type: Optional[str] = None
    state: Optional[str] = None
    total_feedbacks: int
    accurate_count: int
    accuracy_percentage: float
    avg_suggested: Optional[float] = None
    avg_actual: Optional[float] = None
    got_nothing_percentage: float


class CircleMemberResponse(BaseModel):
    id: str
    user_id: str
    full_name: str
    role: Literal["admin", "member"]
    risk_score: Optional[int] = None
    survey_completed: bool


class EmergencyPoolResponse(BaseModel):
    id: str
    circle_id: str
    target_monthly_per_member: int
    total_balance: int  # in dollars


class FundRequestResponse(BaseModel):
    id: str
    requested_by: str
    requester_name: str
    amount: int
    reason: str
    crisis_type: str
    status: Literal["pending", "approved", "denied", "released"]
    votes_needed: int
    votes_received: int
    created_at: str


class CircleResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    invite_code: str
    created_by: str
    members: List[CircleMemberResponse] = []
    pool: Optional[EmergencyPoolResponse] = None
    group_risk_score: Optional[int] = None
