--------------------------------------------------------------
-- GYMS
--------------------------------------------------------------
CREATE TABLE public.gyms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  qr_secret TEXT NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  timezone TEXT NOT NULL DEFAULT 'UTC',
  weekly_visit_goal INT NOT NULL DEFAULT 3,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

--------------------------------------------------------------
-- MEMBERS
-- Links auth.users to gyms. gym_id is the canonical gym reference.
--------------------------------------------------------------
CREATE TABLE public.members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin', 'owner')),
  visible_to_members BOOLEAN NOT NULL DEFAULT true,
  buddy_matching_opt_in BOOLEAN NOT NULL DEFAULT false,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, gym_id)
);

--------------------------------------------------------------
-- ATTENDANCE EVENTS
-- No gym_id column. Gym is derived from member.
-- This prevents the member_id/gym_id mismatch bug.
--------------------------------------------------------------
CREATE TABLE public.attendance_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  checked_in_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  method TEXT NOT NULL DEFAULT 'qr' CHECK (method IN ('qr', 'manual', 'nfc'))
);

-- Dedup is enforced in the API layer (NestJS), not DB constraint.
-- DB index is for query performance only.
CREATE INDEX idx_attendance_member_date
  ON public.attendance_events (member_id, checked_in_at DESC);

--------------------------------------------------------------
-- MEMBER STREAKS
-- Updated incrementally on every check-in, NOT by nightly cron.
--------------------------------------------------------------
CREATE TABLE public.member_streaks (
  member_id UUID PRIMARY KEY REFERENCES public.members(id) ON DELETE CASCADE,
  current_streak_weeks INT NOT NULL DEFAULT 0,
  longest_streak_weeks INT NOT NULL DEFAULT 0,
  visits_this_week INT NOT NULL DEFAULT 0,
  week_start DATE NOT NULL DEFAULT date_trunc('week', now())::date,
  last_visit_at TIMESTAMPTZ,
  risk_level TEXT NOT NULL DEFAULT 'active'
    CHECK (risk_level IN ('active', 'at_risk', 'high_risk', 'lapsed')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

--------------------------------------------------------------
-- NOTIFICATION LOG
-- Prevents spam loops. Tracks what was sent and when.
--------------------------------------------------------------
CREATE TABLE public.notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  cooldown_until TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_notif_member_type
  ON public.notification_log (member_id, notification_type, cooldown_until DESC);

--------------------------------------------------------------
-- GYM INVITE CODES
--------------------------------------------------------------
CREATE TABLE public.gym_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_id UUID NOT NULL REFERENCES public.gyms(id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(6), 'hex'),
  max_uses INT,
  uses INT NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

--------------------------------------------------------------
-- INDEXES
--------------------------------------------------------------
CREATE INDEX idx_members_gym ON public.members (gym_id);
CREATE INDEX idx_members_user ON public.members (user_id);
CREATE INDEX idx_invites_code ON public.gym_invites (code);

--------------------------------------------------------------
-- ROW LEVEL SECURITY
-- Principle: clients can READ, all WRITES go through NestJS API.
--------------------------------------------------------------
ALTER TABLE public.gyms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gym_invites ENABLE ROW LEVEL SECURITY;

-- GYMS: members can read their own gym
CREATE POLICY "members_read_own_gym" ON public.gyms
  FOR SELECT USING (
    id IN (SELECT gym_id FROM public.members WHERE user_id = auth.uid())
  );

-- MEMBERS: can see visible members in their gym
CREATE POLICY "members_read_gym_members" ON public.members
  FOR SELECT USING (
    gym_id IN (SELECT gym_id FROM public.members WHERE user_id = auth.uid())
    AND (visible_to_members = true OR user_id = auth.uid())
  );

-- ATTENDANCE: members read their own
CREATE POLICY "members_read_own_attendance" ON public.attendance_events
  FOR SELECT USING (
    member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid())
  );

-- ATTENDANCE: admins read all in their gym
CREATE POLICY "admins_read_gym_attendance" ON public.attendance_events
  FOR SELECT USING (
    member_id IN (
      SELECT m2.id FROM public.members m2
      WHERE m2.gym_id IN (
        SELECT gym_id FROM public.members WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
      )
    )
  );

-- STREAKS: members read own
CREATE POLICY "members_read_own_streak" ON public.member_streaks
  FOR SELECT USING (
    member_id IN (SELECT id FROM public.members WHERE user_id = auth.uid())
  );

-- STREAKS: admins read all in gym
CREATE POLICY "admins_read_gym_streaks" ON public.member_streaks
  FOR SELECT USING (
    member_id IN (
      SELECT m2.id FROM public.members m2
      WHERE m2.gym_id IN (
        SELECT gym_id FROM public.members WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
      )
    )
  );

-- NOTIFICATION LOG: no client reads (internal only, NestJS service role)
-- No SELECT policy = clients cannot read it

-- GYM INVITES: admins can read their gym's invites
CREATE POLICY "admins_read_gym_invites" ON public.gym_invites
  FOR SELECT USING (
    gym_id IN (
      SELECT gym_id FROM public.members WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
    )
  );

-- NO INSERT/UPDATE/DELETE policies on any table.
-- All writes go through NestJS API using service role.
-- This is the core security model.
