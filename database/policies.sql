-- SafeCircle — Row Level Security (run after schema.sql)

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.circle_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pool_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fund_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fund_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crisis_sessions ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Circles
CREATE POLICY "Members can view circles" ON public.circles FOR SELECT
  USING (id IN (SELECT circle_id FROM public.circle_members WHERE user_id = auth.uid()));
CREATE POLICY "Authenticated users can create circles" ON public.circles FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Circle members
CREATE POLICY "Members can view circle members" ON public.circle_members FOR SELECT
  USING (circle_id IN (SELECT circle_id FROM public.circle_members WHERE user_id = auth.uid()));
CREATE POLICY "Can join circles" ON public.circle_members FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Risk surveys
CREATE POLICY "Members can view circle surveys" ON public.risk_surveys FOR SELECT
  USING (circle_id IN (SELECT circle_id FROM public.circle_members WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert own survey" ON public.risk_surveys FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own survey" ON public.risk_surveys FOR UPDATE USING (auth.uid() = user_id);

-- Emergency pools
CREATE POLICY "Members can view pool" ON public.emergency_pools FOR SELECT
  USING (circle_id IN (SELECT circle_id FROM public.circle_members WHERE user_id = auth.uid()));

-- Pool contributions
CREATE POLICY "Members can view contributions" ON public.pool_contributions FOR SELECT
  USING (
    pool_id IN (
      SELECT ep.id FROM public.emergency_pools ep
      JOIN public.circle_members cm ON cm.circle_id = ep.circle_id
      WHERE cm.user_id = auth.uid()
    )
  );
CREATE POLICY "Members can contribute" ON public.pool_contributions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Fund requests
CREATE POLICY "Members can view requests" ON public.fund_requests FOR SELECT
  USING (
    pool_id IN (
      SELECT ep.id FROM public.emergency_pools ep
      JOIN public.circle_members cm ON cm.circle_id = ep.circle_id
      WHERE cm.user_id = auth.uid()
    )
  );
CREATE POLICY "Members can create requests" ON public.fund_requests FOR INSERT WITH CHECK (auth.uid() = requested_by);

-- Fund votes
CREATE POLICY "Members can view votes" ON public.fund_votes FOR SELECT
  USING (
    request_id IN (
      SELECT fr.id FROM public.fund_requests fr
      JOIN public.emergency_pools ep ON ep.id = fr.pool_id
      JOIN public.circle_members cm ON cm.circle_id = ep.circle_id
      WHERE cm.user_id = auth.uid()
    )
  );
CREATE POLICY "Members can vote" ON public.fund_votes FOR INSERT WITH CHECK (auth.uid() = voter_id);

-- Crisis sessions
CREATE POLICY "Users can view own crisis sessions" ON public.crisis_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create crisis sessions" ON public.crisis_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own crisis sessions" ON public.crisis_sessions FOR UPDATE USING (auth.uid() = user_id);
