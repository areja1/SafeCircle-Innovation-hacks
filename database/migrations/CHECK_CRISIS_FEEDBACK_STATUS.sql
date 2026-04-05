-- ==========================================
-- DIAGNOSTIC: Check Crisis Feedback System Status
-- Run this in Supabase SQL Editor to see what exists
-- ==========================================

-- 1. Check if crisis_feedback table exists and its structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'crisis_feedback'
ORDER BY ordinal_position;

-- 2. Check if the feedback_submitted column was added to crisis_sessions
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'crisis_sessions'
  AND column_name = 'feedback_submitted';

-- 3. Check if crisis_accuracy_metrics view exists
SELECT 
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public' 
  AND table_name IN ('crisis_accuracy_metrics', 'crisis_overall_accuracy');

-- 4. Count existing feedback records
SELECT COUNT(*) as total_feedback_records
FROM public.crisis_feedback;

-- 5. Check indexes
SELECT 
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public' 
  AND tablename = 'crisis_feedback';

-- ==========================================
-- SUMMARY: What to do next
-- ==========================================
-- After running this query, you'll see:
-- 
-- Result 1: Columns in crisis_feedback table (should show 11 columns)
-- Result 2: feedback_submitted column (should show 1 row if it exists)
-- Result 3: Views (should show 2 rows for the two views)
-- Result 4: How many feedback records exist
-- Result 5: Indexes on the table
--
-- If ALL results come back empty/zero:
--   → The table doesn't actually exist (error might be from a different schema)
--   → Safe to run the full 002_crisis_feedback.sql migration
--
-- If SOME results exist but not all:
--   → Run the FIX script below to complete the migration
--
-- If ALL results exist with correct structure:
--   → Migration already complete! No action needed.
-- ==========================================
