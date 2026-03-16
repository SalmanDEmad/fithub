import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { SendMessageDialog } from '@/components/send-message-dialog';
import {
  formatCurrency,
  getDashboardContext,
  getRiskBadgeVariant,
} from '@/lib/dashboard';

export default async function AtRiskPage() {
  const { supabase, member, gym } = await getDashboardContext();

  if (!member || !gym) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No gym yet</CardTitle>
          <CardDescription>Create your gym to start seeing churn risk signals.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const { data: rows } = await supabase
    .from('member_streaks')
    .select(
      `
      risk_level, last_visit_at, visits_this_week, current_streak_weeks,
      members!inner(id, display_name)
    `,
    )
    .in('risk_level', ['at_risk', 'high_risk', 'lapsed'])
    .order('last_visit_at', { ascending: true });

  const totalAtRisk = rows?.length ?? 0;
  const revenueAtRisk = totalAtRisk * Number(gym.avg_membership_fee ?? 0);

  return (
    <>
      <section>
        <p className="text-sm uppercase tracking-[0.2em] text-emerald-700">At-risk members</p>
        <h1 className="mt-2 text-4xl font-semibold text-slate-950">
          Who needs a warm outreach message?
        </h1>
        <p className="mt-2 text-base text-slate-600">
          Start with the members who have been away longest and keep the tone supportive.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Members at risk
            </p>
            <p className="mt-4 text-4xl font-semibold text-amber-700">{totalAtRisk}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Revenue at risk
            </p>
            <p className="mt-4 text-4xl font-semibold text-rose-700">
              {formatCurrency(revenueAtRisk)}
            </p>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>At-risk roster</CardTitle>
          <CardDescription>
            Critical means 14+ days away, declining means momentum is slipping, and warning means a check-in this week still keeps things alive.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-[0.2em] text-slate-500">
                  <th className="pb-3">Name</th>
                  <th className="pb-3">Last visit</th>
                  <th className="pb-3">Risk tier</th>
                  <th className="pb-3">Current streak</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {(rows ?? []).map((row: any) => (
                  <tr key={row.members.id} className="border-b border-border/70 last:border-none">
                    <td className="py-4 font-semibold text-slate-900">{row.members.display_name}</td>
                    <td className="py-4 text-slate-600">
                      {row.last_visit_at
                        ? new Date(row.last_visit_at).toLocaleDateString()
                        : 'Never'}
                    </td>
                    <td className="py-4">
                      <Badge variant={getRiskBadgeVariant(row.risk_level)}>
                        {formatRiskTier(row.risk_level)}
                      </Badge>
                    </td>
                    <td className="py-4 text-slate-600">{row.current_streak_weeks} weeks</td>
                    <td className="py-4 text-right">
                      <SendMessageDialog name={row.members.display_name} />
                    </td>
                  </tr>
                ))}
                {(rows ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-slate-500">
                      No at-risk members right now.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

function formatRiskTier(riskLevel: string) {
  if (riskLevel === 'lapsed') return 'Critical';
  if (riskLevel === 'high_risk') return 'Declining';
  if (riskLevel === 'at_risk') return 'Warning';
  return 'Stable';
}
