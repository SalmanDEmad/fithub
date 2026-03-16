export type RiskLevel = 'active' | 'at_risk' | 'high_risk' | 'lapsed';
export type RiskTier = 'stable' | 'warning' | 'declining' | 'critical';
export type MemberRole = 'member' | 'admin' | 'owner';
export type CheckinMethod = 'qr' | 'manual' | 'nfc';

export interface CreateGymRequest {
  name: string;
  slug: string;
}

export interface JoinGymRequest {
  invite_code: string;
  display_name: string;
}

export interface ScanCheckinRequest {
  qr_payload: string;
}

export interface ManualCheckinRequest {
  member_id: string;
}

export interface Gym {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  weekly_visit_goal: number;
  avg_membership_fee: number;
  created_at: string;
}

export interface Member {
  id: string;
  user_id: string;
  gym_id: string;
  display_name: string;
  role: MemberRole;
  visible_to_members: boolean;
  buddy_matching_opt_in: boolean;
  personal_weekly_goal: number | null;
  joined_at: string;
}

export interface AttendanceEvent {
  id: string;
  member_id: string;
  checked_in_at: string;
  method: CheckinMethod;
}

export interface MemberStreak {
  member_id: string;
  current_streak_weeks: number;
  longest_streak_weeks: number;
  visits_this_week: number;
  week_start: string;
  last_visit_at: string | null;
  risk_level: RiskLevel;
  rest_week_balance: number;
  rest_week_used_at: string | null;
}

export interface InactivityMessageContext {
  name: string;
  gymName: string;
  totalVisits: number;
}

export interface InactivityMessage {
  title: string;
  body: string;
}

export interface LocaleConfig {
  locale: SupportedLocale;
  dir: 'ltr' | 'rtl';
}

export type SupportedLocale = 'en' | 'ar';

/** QR payload format: gymId:timestamp:hmac */
export const QR_PAYLOAD_REGEX = /^[0-9a-f-]+:\d+:[0-9a-f]+$/;

/** Dedup window in milliseconds (4 hours) */
export const CHECKIN_DEDUP_WINDOW_MS = 4 * 60 * 60 * 1000;

/** QR code rotation interval in seconds */
export const QR_ROTATION_INTERVAL_S = 30;

/** QR code max age before rejection (seconds) */
export const QR_MAX_AGE_S = 60;

export const SUPPORTED_LOCALES: SupportedLocale[] = ['en', 'ar'];

export function getDirection(locale: SupportedLocale): 'ltr' | 'rtl' {
  return locale === 'ar' ? 'rtl' : 'ltr';
}

export function resolveLocale(acceptLanguage?: string | null): LocaleConfig {
  const raw = acceptLanguage?.toLowerCase() ?? '';
  const locale = raw.startsWith('ar') ? 'ar' : 'en';
  return { locale, dir: getDirection(locale) };
}

export function getRiskTier(riskLevel: RiskLevel): RiskTier {
  if (riskLevel === 'lapsed') return 'critical';
  if (riskLevel === 'high_risk') return 'declining';
  if (riskLevel === 'at_risk') return 'warning';
  return 'stable';
}

export function getInactivityMessage(
  riskLevel: RiskLevel,
  context: InactivityMessageContext,
): InactivityMessage {
  const safeName = context.name?.trim() || 'there';
  const safeGymName = context.gymName?.trim() || 'Your gym';
  const totalVisits = Math.max(0, context.totalVisits);

  switch (riskLevel) {
    case 'at_risk':
      return {
        title: 'Your streak is still alive',
        body: `One visit this week keeps it going. You've got this, ${safeName}.`,
      };
    case 'high_risk':
      return {
        title: 'We saved your spot',
        body: `${safeGymName} is waiting. Even a quick visit counts toward your goal.`,
      };
    case 'lapsed':
      return {
        title: 'Fresh start?',
        body: `You showed up ${totalVisits} times before. That matters. Ready for Day 1 of your comeback?`,
      };
    default:
      return {
        title: 'Keep your momentum going',
        body: `A quick visit at ${safeGymName} keeps you moving forward.`,
      };
  }
}
