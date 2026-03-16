'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    const supabase = createClient();
    const { error: signupError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signupError) {
      setError(signupError.message);
      setLoading(false);
      return;
    }

    router.push('/dashboard/create-gym');
    router.refresh();
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl items-center px-4 py-12">
      <div className="grid w-full gap-8 lg:grid-cols-[1.2fr_minmax(0,420px)]">
        <section className="rounded-[2rem] bg-emerald-50 px-8 py-12 shadow-panel">
          <p className="text-sm uppercase tracking-[0.24em] text-emerald-700">FitHub</p>
          <h1 className="mt-4 text-5xl font-semibold text-slate-950">Set up your gym in minutes.</h1>
          <p className="mt-4 max-w-xl text-base text-slate-600">
            Create your workspace, generate invite codes, and start spotting members who need a little encouragement.
          </p>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Create account</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={handleSignup}>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  minLength={6}
                />
              </div>
              {error ? <p className="text-sm font-medium text-rose-600">{error}</p> : null}
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Creating account...' : 'Sign Up'}
              </Button>
            </form>
            <p className="mt-5 text-sm text-slate-600">
              Already have an account?{' '}
              <Link href="/login" className="font-semibold text-emerald-700">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
