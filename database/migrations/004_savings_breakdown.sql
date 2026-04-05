-- ==========================================
-- ADD SAVINGS_BREAKDOWN SUPPORT
-- Stores category-level benefit estimates and feedback
-- ==========================================

-- 1. Add savings_breakdown column to crisis_sessions (stores the AI's category breakdown)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'crisis_sessions' 
        AND column_name = 'savings_breakdown'
    ) THEN
        ALTER TABLE public.crisis_sessions 
        ADD COLUMN savings_breakdown JSONB DEFAULT '[]'::jsonb;
        RAISE NOTICE 'Added savings_breakdown column to crisis_sessions';
    ELSE
        RAISE NOTICE 'savings_breakdown column already exists - skipping';
    END IF;
END $$;

-- 2. Add category_feedback column to crisis_feedback (stores user's feedback per category)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'crisis_feedback' 
        AND column_name = 'category_feedback'
    ) THEN
        ALTER TABLE public.crisis_feedback 
        ADD COLUMN category_feedback JSONB DEFAULT '[]'::jsonb;
        RAISE NOTICE 'Added category_feedback column to crisis_feedback';
    ELSE
        RAISE NOTICE 'category_feedback column already exists - skipping';
    END IF;
END $$;

-- ==========================================
-- EXAMPLE DATA STRUCTURES
-- ==========================================
-- 
-- savings_breakdown in crisis_sessions:
-- [
--   {
--     "category": "unemployment_benefits",
--     "category_label": "Unemployment Benefits",
--     "estimated_amount": 5000,
--     "description": "Weekly benefits for up to 26 weeks",
--     "timeframe": "Weekly for 26 weeks"
--   },
--   {
--     "category": "snap",
--     "category_label": "Food Assistance (SNAP)",
--     "estimated_amount": 800,
--     "description": "Monthly food benefits",
--     "timeframe": "Monthly"
--   }
-- ]
--
-- category_feedback in crisis_feedback:
-- [
--   {
--     "category": "unemployment_benefits",
--     "category_label": "Unemployment Benefits",
--     "suggested_amount": 5000,
--     "received": true,
--     "actual_amount": 4200,
--     "notes": "Got approved but lower weekly amount than estimated"
--   },
--   {
--     "category": "snap",
--     "category_label": "Food Assistance (SNAP)",
--     "suggested_amount": 800,
--     "received": false,
--     "actual_amount": 0,
--     "notes": "Application was denied"
--   }
-- ]
--
-- ==========================================

SELECT '✅ Savings breakdown columns added!' as status;
