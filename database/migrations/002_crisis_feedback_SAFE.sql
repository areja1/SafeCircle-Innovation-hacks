-- ==========================================
-- SAFE CRISIS FEEDBACK MIGRATION
-- This script checks what exists before creating
-- Safe to run multiple times - won't error if things exist
-- ==========================================

-- 1. Create crisis_feedback table (only if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'crisis_feedback') THEN
        CREATE TABLE public.crisis_feedback (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            session_id UUID REFERENCES public.crisis_sessions(id) ON DELETE CASCADE,
            user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
            
            -- What we suggested
            suggested_amount NUMERIC(12, 2),
            
            -- User feedback
            was_accurate BOOLEAN NOT NULL,
            actual_amount NUMERIC(12, 2),
            got_nothing BOOLEAN DEFAULT FALSE,
            feedback_notes TEXT,
            
            -- Metadata
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            
            -- Constraints
            UNIQUE(session_id),
            CHECK (
                (was_accurate = TRUE AND actual_amount IS NULL AND got_nothing = FALSE) OR
                (was_accurate = FALSE AND (actual_amount IS NOT NULL OR got_nothing = TRUE))
            )
        );
        RAISE NOTICE 'Created crisis_feedback table';
    ELSE
        RAISE NOTICE 'crisis_feedback table already exists - skipping';
    END IF;
END $$;

-- 2. Create index (only if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_crisis_feedback_accuracy') THEN
        CREATE INDEX idx_crisis_feedback_accuracy 
        ON public.crisis_feedback(was_accurate);
        RAISE NOTICE 'Created idx_crisis_feedback_accuracy index';
    ELSE
        RAISE NOTICE 'idx_crisis_feedback_accuracy index already exists - skipping';
    END IF;
END $$;

-- 3. Add feedback_submitted column to crisis_sessions (only if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'crisis_sessions' 
        AND column_name = 'feedback_submitted'
    ) THEN
        ALTER TABLE public.crisis_sessions 
        ADD COLUMN feedback_submitted BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added feedback_submitted column to crisis_sessions';
    ELSE
        RAISE NOTICE 'feedback_submitted column already exists - skipping';
    END IF;
END $$;

-- 4. Create crisis_accuracy_metrics view (drop and recreate to ensure it's current)
DROP VIEW IF EXISTS public.crisis_accuracy_metrics;
CREATE VIEW public.crisis_accuracy_metrics AS
SELECT 
    cs.crisis_type,
    cs.state,
    COUNT(*) as total_feedbacks,
    SUM(CASE WHEN cf.was_accurate THEN 1 ELSE 0 END) as accurate_feedbacks,
    ROUND(
        100.0 * SUM(CASE WHEN cf.was_accurate THEN 1 ELSE 0 END) / COUNT(*),
        1
    ) as accuracy_percentage,
    AVG(CASE 
        WHEN cf.was_accurate THEN cf.suggested_amount
        WHEN cf.got_nothing THEN 0
        ELSE cf.actual_amount
    END) as avg_actual_amount,
    MIN(cf.created_at) as first_feedback_date,
    MAX(cf.created_at) as last_feedback_date
FROM public.crisis_sessions cs
INNER JOIN public.crisis_feedback cf ON cs.id = cf.session_id
GROUP BY cs.crisis_type, cs.state;

-- 5. Create crisis_overall_accuracy view (drop and recreate to ensure it's current)
DROP VIEW IF EXISTS public.crisis_overall_accuracy;
CREATE VIEW public.crisis_overall_accuracy AS
SELECT 
    COUNT(*) as total_feedbacks,
    SUM(CASE WHEN was_accurate THEN 1 ELSE 0 END) as accurate_feedbacks,
    ROUND(
        100.0 * SUM(CASE WHEN was_accurate THEN 1 ELSE 0 END) / COUNT(*),
        1
    ) as accuracy_percentage,
    AVG(CASE 
        WHEN was_accurate THEN suggested_amount
        WHEN got_nothing THEN 0
        ELSE actual_amount
    END) as avg_actual_amount
FROM public.crisis_feedback;

-- 6. Create RLS policies (drop existing and recreate)
DROP POLICY IF EXISTS "Users can submit feedback for their own crisis sessions" ON public.crisis_feedback;
CREATE POLICY "Users can submit feedback for their own crisis sessions"
    ON public.crisis_feedback
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own feedback" ON public.crisis_feedback;
CREATE POLICY "Users can view their own feedback"
    ON public.crisis_feedback
    FOR SELECT
    USING (auth.uid() = user_id);

-- Enable RLS on crisis_feedback
ALTER TABLE public.crisis_feedback ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- VERIFICATION QUERIES
-- ==========================================

-- Check table structure
SELECT 'Table Structure:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'crisis_feedback'
ORDER BY ordinal_position;

-- Check views
SELECT 'Views Created:' as info;
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public' 
  AND table_name IN ('crisis_accuracy_metrics', 'crisis_overall_accuracy');

-- Check feedback_submitted column
SELECT 'feedback_submitted column:' as info;
SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'crisis_sessions' 
    AND column_name = 'feedback_submitted'
) as column_exists;

SELECT '✅ Migration complete!' as status;
