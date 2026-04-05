-- ==========================================
-- ADD crisis_type AND state TO crisis_feedback
-- Run this if you already ran the previous migration
-- ==========================================

-- Add crisis_type column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'crisis_feedback' 
        AND column_name = 'crisis_type'
    ) THEN
        ALTER TABLE public.crisis_feedback 
        ADD COLUMN crisis_type VARCHAR(50);
        RAISE NOTICE 'Added crisis_type column to crisis_feedback';
    ELSE
        RAISE NOTICE 'crisis_type column already exists - skipping';
    END IF;
END $$;

-- Add state column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'crisis_feedback' 
        AND column_name = 'state'
    ) THEN
        ALTER TABLE public.crisis_feedback 
        ADD COLUMN state VARCHAR(2);
        RAISE NOTICE 'Added state column to crisis_feedback';
    ELSE
        RAISE NOTICE 'state column already exists - skipping';
    END IF;
END $$;

-- Backfill crisis_type and state from crisis_sessions for existing feedback
UPDATE public.crisis_feedback cf
SET 
    crisis_type = cs.crisis_type,
    state = cs.state
FROM public.crisis_sessions cs
WHERE cf.session_id = cs.id
  AND (cf.crisis_type IS NULL OR cf.state IS NULL);

SELECT '✅ Columns added and backfilled!' as status;
