'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createGymSchema } from '@fithub/validation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function CreateGymForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: async () => {
      const parsed = createGymSchema.safeParse({
        name,
        slug,
      });
      if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message || 'Invalid gym details');
      }

      return api.createGym(parsed.data);
    },
    onSuccess: () => {
      router.push('/dashboard');
      router.refresh();
    },
    onError: (mutationError: Error) => {
      setError(mutationError.message);
    },
  });

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Create your gym</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            setError('');
            mutation.mutate();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="gym-name">Gym name</Label>
            <Input
              id="gym-name"
              aria-label="Gym name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Summit Strength"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gym-slug">Gym slug</Label>
            <Input
              id="gym-slug"
              aria-label="Gym slug"
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
              placeholder="summit-strength"
            />
          </div>

          {error ? (
            <p className="text-sm font-medium text-rose-600" aria-live="polite">
              {error}
            </p>
          ) : null}

          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Creating gym...' : 'Create Gym'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
