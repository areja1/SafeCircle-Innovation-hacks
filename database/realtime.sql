-- SafeCircle — Realtime publication (run after schema.sql)
-- Idempotent: safe to run more than once.

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.fund_requests;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.fund_votes;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.pool_contributions;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
