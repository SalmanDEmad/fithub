import { CreateGymForm } from '@/components/create-gym-form';

export default function CreateGymPage() {
  return (
    <>
      <section>
        <p className="text-sm uppercase tracking-[0.2em] text-emerald-700">Create gym</p>
        <h1 className="mt-2 text-4xl font-semibold text-slate-950">Launch your FitHub workspace</h1>
        <p className="mt-2 max-w-2xl text-base text-slate-600">
          Start with a clear name and slug. We will generate your first invite code automatically.
        </p>
      </section>
      <CreateGymForm />
    </>
  );
}
