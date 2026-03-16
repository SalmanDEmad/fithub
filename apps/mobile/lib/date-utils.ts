export function getWeekdayDates(timezone: string, seed = new Date()) {
  const monday = getWeekStartInTimezone(seed, timezone);
  return Array.from({ length: 7 }, (_, index) => {
    const current = new Date(monday);
    current.setDate(monday.getDate() + index);
    return current;
  });
}

export function getWeekStartInTimezone(date: Date, timezone: string) {
  const local = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
  const day = local.getDay();
  const diff = local.getDate() - day + (day === 0 ? -6 : 1);
  local.setDate(diff);
  local.setHours(0, 0, 0, 0);
  return local;
}

export function formatDateKey(date: Date, timezone: string) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  return formatter.format(date);
}

export function isSameLocalDay(a: string | Date | null, b: Date, timezone: string) {
  if (!a) return false;
  return formatDateKey(new Date(a), timezone) === formatDateKey(b, timezone);
}

export function getDaysSince(date: string | Date | null) {
  if (!date) return null;
  return Math.floor(
    (Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24),
  );
}
