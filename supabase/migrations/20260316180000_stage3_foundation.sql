ALTER TABLE public.members
  ADD COLUMN IF NOT EXISTS personal_weekly_goal INT;

ALTER TABLE public.member_streaks
  ADD COLUMN IF NOT EXISTS rest_week_balance INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rest_week_used_at DATE;

ALTER TABLE public.gyms
  ADD COLUMN IF NOT EXISTS avg_membership_fee DECIMAL(10, 2) NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.push_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  expo_push_token TEXT NOT NULL UNIQUE,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  device_name TEXT,
  disabled_at TIMESTAMPTZ,
  last_error_at TIMESTAMPTZ,
  last_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_push_devices_member_active
  ON public.push_devices (member_id, disabled_at);

ALTER TABLE public.push_devices ENABLE ROW LEVEL SECURITY;

-- Clients do not read push device rows directly.
-- All writes continue through NestJS using the service role.
