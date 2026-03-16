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
import { getDashboardContext, getRiskBadgeVariant } from '@/lib/dashboard';

export default async function MembersPage() {
  const { supabase, member } = await getDashboardContext();

  if (!member) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No gym yet</CardTitle>
          <CardDescription>Create your gym to start inviting members.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const [{ data: members }, { data: invites }] = await Promise.all([
    supabase
      .from('members')
      .select(
        `
        id, display_name, role, joined_at,
        member_streaks (
          current_streak_weeks, visits_this_week, last_visit_at, risk_level
        )
      `,
      )
      .order('joined_at', { ascending: false }),
    supabase
      .from('gym_invites')
      .select('code')
      .eq('gym_id', member.gym_id)
      .order('created_at', { ascending: false })
      .limit(1),
  ]);

  const inviteCode = invites?.[0]?.code ?? null;

  return (
    <>
      <section>
        <p className="text-sm uppercase tracking-[0.2em] text-emerald-700">Members</p>
        <h1 className="mt-2 text-4xl font-semibold text-slate-950">Your gym roster</h1>
        <p className="mt-2 text-base text-slate-600">
          Monitor streaks, check recent visits, and keep new members flowing in.
        </p>
      </section>

      {(members ?? []).length <= 1 ? (
        <Card className="max-w-3xl">
          <CardHeader>
            <CardTitle>No members yet</CardTitle>
            <CardDescription>
              Share your invite code to get started.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-3xl bg-emerald-50 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                Invite code
              </p>
              <p className="mt-4 text-4xl font-semibold text-slate-950">
                {inviteCode ?? 'Create one in the invites page'}
              </p>
            </div>
            <Button asChild>
              <Link href="/dashboard/invites">Manage invites</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>All members</CardTitle>
              <CardDescription>
                Share invite code <span className="font-semibold text-slate-900">{inviteCode ?? 'pending'}</span> to add more.
              </CardDescription>
            </div>
            <Button asChild variant="outline">
              <Link href="/dashboard/invites">Invite management</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-[0.2em] text-slate-500">
                    <th className="pb-3">Name</th>
                    <th className="pb-3">Role</th>
                    <th className="pb-3">Streak</th>
                    <th className="pb-3">Visits / week</th>
                    <th className="pb-3">Risk</th>
                    <th className="pb-3">Last visit</th>
                    <th className="pb-3">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {(members ?? []).map((row: any) => {
                    const streak = row.member_streaks;
                    const riskLevel = streak?.risk_level ?? 'active';
                    return (
                      <tr key={row.id} className="border-b border-border/70 last:border-none">
                        <td className="py-4 font-semibold text-slate-900">{row.display_name}</td>
                        <td className="py-4">
                          <Badge variant="outline">{row.role}</Badge>
                        </td>
                        <td className="py-4 text-slate-600">
                          {streak?.current_streak_weeks ?? 0} weeks
                        </td>
                        <td className="py-4 text-slate-600">{streak?.visits_this_week ?? 0}</td>
                        <td className="py-4">
                          <Badge variant={getRiskBadgeVariant(riskLevel)}>
                            {riskLevel.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="py-4 text-slate-600">
                          {streak?.last_visit_at
                            ? new Date(streak.last_visit_at).toLocaleDateString()
                            : 'Never'}
                        </td>
                        <td className="py-4 text-slate-600">
                          {new Date(row.joined_at).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
