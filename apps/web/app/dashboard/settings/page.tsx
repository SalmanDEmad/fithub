import { SettingsForm } from '@/components/settings-form';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getDashboardContext } from '@/lib/dashboard';

export default async function SettingsPage() {
  const { gym } = await getDashboardContext();

  if (!gym) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No gym settings yet</CardTitle>
          <CardDescription>Create your gym first, then tune goals and revenue assumptions here.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      <section>
        <p className="text-sm uppercase tracking-[0.2em] text-emerald-700">Settings</p>
        <h1 className="mt-2 text-4xl font-semibold text-slate-950">Tune your gym defaults</h1>
        <p className="mt-2 text-base text-slate-600">
          Keep the weekly goal realistic and add your average membership fee so FitHub can quantify churn risk.
        </p>
      </section>
      <SettingsForm gym={gym} />
    </>
  );
}
