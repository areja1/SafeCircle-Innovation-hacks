// ============ CORE TYPES ============

export interface User {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  preferred_language: 'en' | 'es';
  state: string;
  zip_code?: string;
}

export interface Circle {
  id: string;
  name: string;
  description?: string;
  invite_code: string;
  created_by: string;
  members: CircleMember[];
  pool?: EmergencyPool;
  group_risk_score?: number;
}

export interface CircleMember {
  id: string;
  user_id: string;
  full_name: string;
  role: 'admin' | 'member';
  risk_score?: number;
  survey_completed: boolean;
}

// ============ RISK X-RAY TYPES ============

export interface SurveyAnswers {
  employment_type: 'w2_employee' | 'gig_worker' | 'self_employed' | 'unemployed' | 'student';
  has_health_insurance: boolean;
  health_insurance_type: 'employer' | 'marketplace' | 'medicaid' | 'none' | 'other';
  has_renters_insurance: boolean;
  has_auto_insurance: boolean;
  drives_for_gig_apps: boolean;
  has_rideshare_endorsement: boolean;
  monthly_income: number;
  emergency_savings: number;
  household_size: number;
  has_life_insurance: boolean;
  credit_score_range: 'no_score' | 'below_580' | '580_669' | '670_739' | '740_plus' | 'unknown';
}

export interface RiskReport {
  user_id: string;
  risk_score: number;           // 0-100
  gaps: InsuranceGap[];
  benefits_eligible: Benefit[];
  poverty_tax_annual: number;   // dollars/year in hidden costs
  ai_analysis: string;          // narrative explanation
}

export interface GroupRiskReport {
  circle_id: string;
  group_risk_score: number;     // average of all members
  total_unprotected_risk: number;  // total dollars at risk
  total_unclaimed_benefits: number;
  total_poverty_tax: number;
  member_reports: RiskReport[];
  gap_summary: GapSummary[];
}

export interface InsuranceGap {
  type: 'renters' | 'auto_rideshare' | 'health' | 'life' | 'disability';
  title: string;
  description: string;
  risk_amount: number;          // what you could lose
  fix_cost_monthly: number;     // what it costs to fix
  priority: 'critical' | 'high' | 'medium';
}

export interface GapSummary {
  gap_type: string;
  members_affected: number;
  total_members: number;
  total_risk: number;
  message: string;
}

export interface Benefit {
  name: string;
  description: string;
  estimated_value: number;      // annual dollars
  how_to_apply: string;
  apply_url?: string;
  deadline?: string;
}

// ============ CRISIS MODE TYPES ============

export type CrisisType = 'car_accident' | 'job_loss' | 'medical_emergency' | 'death_in_family' | 'home_damage';

export interface CrisisSession {
  id: string;
  crisis_type: CrisisType;
  started_at: string;
  steps: TriageStep[];
  estimated_savings: number;
}

export interface TriageStep {
  id: string;
  priority: 'red' | 'orange' | 'yellow' | 'green';
  time_window: string;
  title: string;
  description: string;
  why_it_matters: string;
  cost_of_not_doing: number;
  deadline_hours?: number;
  action_url?: string;
  completed: boolean;
}

// ============ EMERGENCY POOL TYPES ============

export interface EmergencyPool {
  id: string;
  circle_id: string;
  target_monthly_per_member: number;
  total_balance: number;
}

export interface PoolContribution {
  id: string;
  user_id: string;
  user_name: string;
  amount: number;
  contributed_at: string;
}

export interface FundRequest {
  id: string;
  requested_by: string;
  requester_name: string;
  amount: number;
  reason: string;
  crisis_type: string;
  status: 'pending' | 'approved' | 'denied' | 'released';
  votes_needed: number;
  votes_received: number;
  created_at: string;
}

// ============ POVERTY TAX TYPES ============

export interface PovertyTaxBreakdown {
  total_annual: number;
  items: PovertyTaxItem[];
}

export interface PovertyTaxItem {
  category: string;
  annual_cost: number;
  description: string;
  fixable: boolean;
  fix_action?: string;
}
