import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { getRiskTier, RiskLevel } from '@fithub/shared';

export async function getDashboardContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: memberships } = await supabase
    .from('members')
    .select('id, display_name, role, gym_id, joined_at')
    .eq('user_id', user.id)
    .order('joined_at', { ascending: true })
    .limit(1);

  const member = memberships?.[0] ?? null;
  if (!member) {
    return { supabase, user, member: null, gym: null };
  }

  const { data: gym } = await supabase
    .from('gyms')
    .select('id, name, slug, timezone, weekly_visit_goal, avg_membership_fee')
    .eq('id', member.gym_id)
    .single();

  return { supabase, user, member, gym };
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getRiskBadgeVariant(riskLevel: string) {
  const tier = getRiskTier(
    (['active', 'at_risk', 'high_risk', 'lapsed'].includes(riskLevel)
      ? riskLevel
      : 'active') as RiskLevel,
  );

  switch (tier) {
    case 'critical':
      return 'danger' as const;
    case 'declining':
      return 'warning' as const;
    case 'warning':
      return 'warning' as const;
    default:
      return 'success' as const;
  }
}
