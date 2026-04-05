-- SafeCircle — Crisis Feedback & Accuracy Tracking
-- Add this after running schema.sql

-- ==========================================
-- CRISIS FEEDBACK TABLE
-- ==========================================
CREATE TABLE public.crisis_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.crisis_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    
    -- What we suggested
    suggested_amount INTEGER,
    
    -- User verification
    was_accurate BOOLEAN,
    
    -- If not accurate, what happened
    actual_amount INTEGER,  -- What they actually got/saved/paid
    got_nothing BOOLEAN DEFAULT FALSE,  -- True if they got no money/help
    
    -- Additional context
    feedback_notes TEXT,  -- User can explain what was different
    
    -- Metadata
    crisis_type TEXT NOT NULL,
    state TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(session_id)
);

-- Index for accuracy metrics calculation
CREATE INDEX idx_crisis_feedback_type_state ON public.crisis_feedback(crisis_type, state, was_accurate);

-- ==========================================
-- VIEW: CRISIS ACCURACY METRICS
-- ==========================================
CREATE OR REPLACE VIEW public.crisis_accuracy_metrics AS
SELECT
    crisis_type,
    state,
    COUNT(*) as total_feedbacks,
    SUM(CASE WHEN was_accurate = true THEN 1 ELSE 0 END) as accurate_count,
    ROUND(
        (SUM(CASE WHEN was_accurate = true THEN 1 ELSE 0 END)::numeric / NULLIF(COUNT(*), 0)) * 100, 
        1
    ) as accuracy_percentage,
    AVG(suggested_amount) as avg_suggested,
    AVG(CASE WHEN actual_amount IS NOT NULL THEN actual_amount END) as avg_actual,
    ROUND(
        (SUM(CASE WHEN got_nothing = true THEN 1 ELSE 0 END)::numeric / NULLIF(COUNT(*), 0)) * 100,
        1
    ) as got_nothing_percentage
FROM public.crisis_feedback
GROUP BY crisis_type, state;

-- Overall accuracy (all crisis types combined)
CREATE OR REPLACE VIEW public.crisis_overall_accuracy AS
SELECT
    COUNT(*) as total_feedbacks,
    SUM(CASE WHEN was_accurate = true THEN 1 ELSE 0 END) as accurate_count,
    ROUND(
        (SUM(CASE WHEN was_accurate = true THEN 1 ELSE 0 END)::numeric / NULLIF(COUNT(*), 0)) * 100,
        1
    ) as accuracy_percentage,
    ROUND(
        (SUM(CASE WHEN got_nothing = true THEN 1 ELSE 0 END)::numeric / NULLIF(COUNT(*), 0)) * 100,
        1
    ) as got_nothing_percentage
FROM public.crisis_feedback;

-- ==========================================
-- UPDATE crisis_sessions TO TRACK FEEDBACK STATUS
-- ==========================================
ALTER TABLE public.crisis_sessions 
ADD COLUMN IF NOT EXISTS dont_sign_warning TEXT,
ADD COLUMN IF NOT EXISTS feedback_submitted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS actual_outcome_amount INTEGER;
