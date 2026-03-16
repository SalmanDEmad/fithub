import { supabase } from './supabase';
import {
  formatDateKey,
  getDaysSince,
  getWeekStartInTimezone,
  getWeekdayDates,
} from './date-utils';

export interface HomeData {
  memberId: string;
  displayName: string;
  gymId: string;
  gymName: string;
  timezone: string;
  gymWeeklyGoal: number;
  personalWeeklyGoal: number | null;
  effectiveGoal: number;
  currentStreakWeeks: number;
  longestStreakWeeks: number;
  visitsThisWeek: number;
  lifetimeVisits: number;
  lastVisitAt: string | null;
  riskLevel: string;
  restWeekBalance: number;
  weeklyVisitedKeys: string[];
  checkedInToday: boolean;
  comebackTier: 0 | 1 | 2 | 3;
}

export interface HistoryData {
  attendance: Array<{ checked_in_at: string; method: string }>;
  streak: {
    current_streak_weeks: number;
    longest_streak_weeks: number;
    visits_this_week: number;
    rest_week_balance: number;
  } | null;
  effectiveGoal: number;
}

async function getPrimaryMember(userId: string) {
  const { data: members, error } = await supabase
    .from('members')
    .select('id, gym_id, display_name, personal_weekly_goal')
    .eq('user_id', userId)
    .order('joined_at', { ascending: true })
    .limit(1);

  if (error) throw error;
  const member = members?.[0];
  if (!member) return null;

  const [{ data: gym, error: gymError }, { data: streak, error: streakError }] =
    await Promise.all([
      supabase
        .from('gyms')
        .select('id, name, timezone, weekly_visit_goal')
        .eq('id', member.gym_id)
        .single(),
      supabase
        .from('member_streaks')
        .select(
          'current_streak_weeks, longest_streak_weeks, visits_this_week, last_visit_at, risk_level, rest_week_balance, rest_week_used_at',
        )
        .eq('member_id', member.id)
        .single(),
    ]);

  if (gymError) throw gymError;
  if (streakError && streakError.code !== 'PGRST116') throw streakError;

  return { member, gym, streak };
}

export async function fetchHomeData(userId: string): Promise<HomeData | null> {
  const base = await getPrimaryMember(userId);
  if (!base || !base.gym) return null;

  const effectiveGoal =
    base.member.personal_weekly_goal ?? base.gym.weekly_visit_goal;
  const weekStart = getWeekStartInTimezone(new Date(), base.gym.timezone);
  const eventsSince = new Date(weekStart);
  eventsSince.setDate(weekStart.getDate() - 7);

  const [
    { count: lifetimeVisits, error: countError },
    { data: events, error: eventError },
  ] = await Promise.all([
    supabase
      .from('attendance_events')
      .select('*', { count: 'exact', head: true })
      .eq('member_id', base.member.id),
    supabase
      .from('attendance_events')
      .select('checked_in_at')
      .eq('member_id', base.member.id)
      .gte('checked_in_at', eventsSince.toISOString())
      .order('checked_in_at', { ascending: false }),
  ]);

  if (countError) throw countError;
  if (eventError) throw eventError;

  const weekdayKeys = new Set(
    (events ?? []).map((event) =>
      formatDateKey(new Date(event.checked_in_at), base.gym.timezone),
    ),
  );

  const currentWeekKeys = getWeekdayDates(base.gym.timezone).map((date) =>
    formatDateKey(date, base.gym.timezone),
  );

  const lastVisitAt = base.streak?.last_visit_at ?? null;
  const checkedInToday = lastVisitAt
    ? formatDateKey(new Date(lastVisitAt), base.gym.timezone) ===
      formatDateKey(new Date(), base.gym.timezone)
    : false;
  const daysSince = getDaysSince(lastVisitAt);
  const comebackTier: 0 | 1 | 2 | 3 =
    daysSince === null || daysSince < 3
      ? 0
      : daysSince < 7
        ? 1
        : daysSince < 14
          ? 2
          : 3;

  return {
    memberId: base.member.id,
    displayName: base.member.display_name,
    gymId: base.gym.id,
    gymName: base.gym.name,
    timezone: base.gym.timezone,
    gymWeeklyGoal: base.gym.weekly_visit_goal,
    personalWeeklyGoal: base.member.personal_weekly_goal,
    effectiveGoal,
    currentStreakWeeks: base.streak?.current_streak_weeks ?? 0,
    longestStreakWeeks: base.streak?.longest_streak_weeks ?? 0,
    visitsThisWeek: base.streak?.visits_this_week ?? 0,
    lifetimeVisits: lifetimeVisits ?? 0,
    lastVisitAt,
    riskLevel: base.streak?.risk_level ?? 'active',
    restWeekBalance: base.streak?.rest_week_balance ?? 0,
    weeklyVisitedKeys: currentWeekKeys.filter((key) => weekdayKeys.has(key)),
    checkedInToday,
    comebackTier,
  };
}

export async function fetchHistoryData(userId: string): Promise<HistoryData | null> {
  const base = await getPrimaryMember(userId);
  if (!base || !base.gym) return null;

  const ninetyDaysAgo = new Date(
    Date.now() - 90 * 24 * 60 * 60 * 1000,
  ).toISOString();
  const { data: attendance, error } = await supabase
    .from('attendance_events')
    .select('checked_in_at, method')
    .eq('member_id', base.member.id)
    .gte('checked_in_at', ninetyDaysAgo)
    .order('checked_in_at', { ascending: false });

  if (error) throw error;

  return {
    attendance: attendance || [],
    streak: base.streak
      ? {
          current_streak_weeks: base.streak.current_streak_weeks,
          longest_streak_weeks: base.streak.longest_streak_weeks,
          visits_this_week: base.streak.visits_this_week,
          rest_week_balance: base.streak.rest_week_balance,
        }
      : null,
    effectiveGoal: base.member.personal_weekly_goal ?? base.gym.weekly_visit_goal,
  };
}
