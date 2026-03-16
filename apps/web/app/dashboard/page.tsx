import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreateGymForm } from '@/components/create-gym-form';
import { SendMessageDialog } from '@/components/send-message-dialog';
import {
  formatCurrency,
  getDashboardContext,
  getRiskBadgeVariant,
} from '@/lib/dashboard';

export default async function DashboardPage() {
  const { supabase, member, gym } = await getDashboardContext();

  if (!member || !gym) {
    return (
      <>
        <section className="rounded-[2rem] bg-slate-950 px-8 py-12 text-white shadow-panel">
          <p className="text-sm uppercase tracking-[0.24em] text-emerald-200">
            Stage 3 onboarding
          </p>
          <h1 className="mt-4 text-4xl font-semibold">Create your gym first</h1>
          <p className="mt-4 max-w-2xl text-base text-slate-300">
            Once your gym exists, FitHub can generate invites, display your QR check-in screen,
            and show which members need a friendly nudge back.
          </p>
        </section>
        <CreateGymForm />
      </>
    );
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const [
    { count: memberCount },
    { count: atRiskCount },
    { count: criticalCount },
    { count: attendanceCount, data: attendanceEvents },
    { data: atRiskPreview },
  ] = await Promise.all([
    supabase
      .from('members')
      .select('*', { count: 'exact', head: true })
      .eq('gym_id', member.gym_id),
    supabase
      .from('member_streaks')
      .select('*', { count: 'exact', head: true })
      .in('risk_level', ['at_risk', 'high_risk', 'lapsed']),
    supabase
      .from('member_streaks')
      .select('*', { count: 'exact', head: true })
      .in('risk_level', ['high_risk', 'lapsed']),
    supabase
      .from('attendance_events')
      .select('checked_in_at', { count: 'exact' })
      .gte('checked_in_at', thirtyDaysAgo),
    supabase
      .from('member_streaks')
      .select(
        `
        risk_level, last_visit_at, current_streak_weeks, visits_this_week,
        members!inner(id, display_name)
      `,
      )
      .in('risk_level', ['at_risk', 'high_risk', 'lapsed'])
      .order('last_visit_at', { ascending: true })
      .limit(5),
  ]);

  const totalMembers = memberCount ?? 0;
  const totalAtRisk = atRiskCount ?? 0;
  const totalCritical = criticalCount ?? 0;
  const avgWeeklyCheckIns =
    totalMembers > 0
      ? Number((((attendanceCount ?? 0) / totalMembers) / 4.285).toFixed(1))
      : 0;
  const revenueAtRisk = totalAtRisk * Number(gym.avg_membership_fee ?? 0);
  const checklist = [
    { label: 'Create your gym', done: true },
    { label: 'Invite your first member', done: totalMembers > 1 },
    { label: 'Display your QR code at the gym', done: (attendanceCount ?? 0) > 0 },
  ];

  const trend = buildTrend(attendanceEvents ?? []);

  return (
    <>
      {totalAtRisk > 0 ? (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="flex flex-col gap-2 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700">
                Retention alert
              </p>
              <h1 className="mt-2 text-2xl font-semibold text-slate-900">
                {totalAtRisk} members are at risk of churning
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                {totalCritical} have not visited in 14+ days.
              </p>
            </div>
            <Button asChild>
              <Link href="/dashboard/at-risk">Review at-risk members</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <section>
        <p className="text-sm uppercase tracking-[0.2em] text-emerald-700">Overview</p>
        <h1 className="mt-2 text-4xl font-semibold text-slate-950">{gym.name}</h1>
        <p className="mt-2 text-base text-slate-600">
          Turn member attendance into clear next actions.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Active members" value={String(totalMembers)} tone="success" />
        <KpiCard label="At-risk members" value={String(totalAtRisk)} tone="warning" />
        <KpiCard label="Avg weekly check-ins" value={avgWeeklyCheckIns.toFixed(1)} />
        <KpiCard label="Revenue at risk" value={formatCurrency(revenueAtRisk)} tone="danger" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>At-risk preview</CardTitle>
              <CardDescription>Who needs attention right now</CardDescription>
            </div>
            <Button variant="outline" asChild>
              <Link href="/dashboard/at-risk">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-[0.2em] text-slate-500">
                    <th className="pb-3">Name</th>
                    <th className="pb-3">Last visit</th>
                    <th className="pb-3">Risk</th>
                    <th className="pb-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(atRiskPreview ?? []).map((row: any) => (
                    <tr key={row.members.id} className="border-b border-border/70 last:border-none">
                      <td className="py-4 font-semibold text-slate-900">{row.members.display_name}</td>
                      <td className="py-4 text-slate-600">
                        {row.last_visit_at
                          ? new Date(row.last_visit_at).toLocaleDateString()
                          : 'Never'}
                      </td>
                      <td className="py-4">
                        <Badge variant={getRiskBadgeVariant(row.risk_level)}>
                          {row.risk_level.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="py-4 text-right">
                        <SendMessageDialog name={row.members.display_name} />
                      </td>
                    </tr>
                  ))}
                  {(atRiskPreview ?? []).length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-500">
                        Nobody is at risk right now. Great job.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Owner checklist</CardTitle>
              <CardDescription>Derived from what already exists in your gym</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {checklist.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3"
                >
                  <span className="text-sm font-medium text-slate-700">{item.label}</span>
                  <Badge variant={item.done ? 'success' : 'outline'}>
                    {item.done ? 'Done' : 'Next up'}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>30-day check-in trend</CardTitle>
              <CardDescription>Are visits moving up or down?</CardDescription>
            </CardHeader>
            <CardContent>
              <TrendLine points={trend} />
            </CardContent>
          </Card>
        </div>
      </section>
    </>
  );
}

function KpiCard({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: string;
  tone?: 'default' | 'success' | 'warning' | 'danger';
}) {
  const toneClass =
    tone === 'success'
      ? 'text-emerald-700'
      : tone === 'warning'
        ? 'text-amber-700'
        : tone === 'danger'
          ? 'text-rose-700'
          : 'text-slate-900';

  return (
    <Card>
      <CardContent className="p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
          {label}
        </p>
        <p className={`mt-4 text-4xl font-semibold ${toneClass}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

function buildTrend(events: Array<{ checked_in_at: string }>) {
  const buckets = new Map<string, number>();
  for (let offset = 29; offset >= 0; offset -= 1) {
    const date = new Date();
    date.setDate(date.getDate() - offset);
    const key = date.toISOString().slice(0, 10);
    buckets.set(key, 0);
  }

  for (const event of events) {
    const key = event.checked_in_at.slice(0, 10);
    if (buckets.has(key)) {
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
  }

  return Array.from(buckets.values());
}

function TrendLine({ points }: { points: number[] }) {
  if (points.length === 0) {
    return <p className="text-sm text-slate-500">Not enough data yet.</p>;
  }

  const max = Math.max(...points, 1);
  const width = 320;
  const height = 120;
  const path = points
    .map((point, index) => {
      const x = (index / Math.max(points.length - 1, 1)) * width;
      const y = height - (point / max) * (height - 20) - 10;
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-32 w-full overflow-visible rounded-2xl bg-slate-50 p-2"
      aria-label="Thirty day check-in trend"
      role="img"
    >
      <path d={path} fill="none" stroke="#16a34a" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}
