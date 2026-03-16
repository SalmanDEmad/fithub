import { InviteManager } from '@/components/invite-manager';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getDashboardContext } from '@/lib/dashboard';

export default async function InvitesPage() {
  const { supabase, member } = await getDashboardContext();

  if (!member) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Create your gym first</CardTitle>
          <CardDescription>You need a gym before invite codes are available.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const { data: invites } = await supabase
    .from('gym_invites')
    .select('id, code, uses, max_uses, expires_at')
    .eq('gym_id', member.gym_id)
    .order('created_at', { ascending: false });

  return (
    <>
      <section>
        <p className="text-sm uppercase tracking-[0.2em] text-emerald-700">Invites</p>
        <h1 className="mt-2 text-4xl font-semibold text-slate-950">Share your invite codes</h1>
        <p className="mt-2 text-base text-slate-600">
          Generate a fresh code whenever you need one and keep the active ones visible for your team.
        </p>
      </section>
      <InviteManager invites={invites ?? []} />
    </>
  );
}
