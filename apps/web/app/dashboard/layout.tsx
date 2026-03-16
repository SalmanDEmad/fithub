import Link from 'next/link';
import { getDashboardContext } from '@/lib/dashboard';
import { Badge } from '@/components/ui/badge';

const navItems = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/dashboard/members', label: 'Members' },
  { href: '/dashboard/at-risk', label: 'At-Risk' },
  { href: '/dashboard/qr', label: 'QR Check-in' },
  { href: '/dashboard/invites', label: 'Invites' },
  { href: '/dashboard/settings', label: 'Settings' },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, member, gym } = await getDashboardContext();

  return (
    <div className="dashboard-shell">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <aside className="border-e border-border bg-white/80 px-6 py-8 backdrop-blur">
          <div className="rounded-3xl bg-slate-950 px-5 py-6 text-white shadow-panel">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-200">
              FitHub
            </p>
            <h1 className="mt-3 text-2xl font-semibold">
              {gym?.name ?? 'Gym Launchpad'}
            </h1>
            <p className="mt-2 text-sm text-slate-300">
              {member
                ? `Signed in as ${member.display_name}`
                : 'Create your gym, invite members, and start tracking return risk.'}
            </p>
            {member ? (
              <Badge variant="success" className="mt-4 w-fit bg-emerald-200/20 text-emerald-100">
                {member.role}
              </Badge>
            ) : null}
          </div>

          <nav className="mt-8 flex flex-col gap-2">
            {(member ? navItems : [{ href: '/dashboard/create-gym', label: 'Create Gym' }]).map(
              (item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-emerald-50 hover:text-emerald-700"
                >
                  {item.label}
                </Link>
              ),
            )}
          </nav>

          <div className="mt-8 rounded-3xl border border-border bg-white p-5 shadow-panel">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Account
            </p>
            <p className="mt-3 text-sm font-medium text-slate-900">{user.email}</p>
            <form action="/auth/signout" method="POST" className="mt-4">
              <button
                type="submit"
                className="min-h-11 rounded-2xl bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition-colors hover:bg-rose-100"
              >
                Sign Out
              </button>
            </form>
          </div>
        </aside>

        <main className="page-grid">{children}</main>
      </div>
    </div>
  );
}
