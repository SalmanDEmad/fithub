'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { gymInviteSchema } from '@fithub/validation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface InviteRecord {
  id: string;
  code: string;
  uses: number;
  max_uses: number | null;
  expires_at: string | null;
}

export function InviteManager({ invites }: { invites: InviteRecord[] }) {
  const router = useRouter();
  const [maxUses, setMaxUses] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [error, setError] = useState('');

  const createInvite = useMutation({
    mutationFn: async () => {
      const parsed = gymInviteSchema.safeParse({
        max_uses: maxUses ? Number(maxUses) : null,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      });
      if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message || 'Invalid invite settings');
      }
      return api.createInvite({
        max_uses: parsed.data.max_uses ?? null,
        expires_at: parsed.data.expires_at ?? null,
      });
    },
    onSuccess: () => {
      router.refresh();
      setMaxUses('');
      setExpiresAt('');
      setError('');
    },
    onError: (mutationError: Error) => {
      setError(mutationError.message);
    },
  });

  const revokeInvite = useMutation({
    mutationFn: (inviteId: string) => api.revokeInvite(inviteId),
    onSuccess: () => {
      router.refresh();
    },
  });

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
      <Card>
        <CardHeader>
          <CardTitle>Active invites</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-[0.2em] text-slate-500">
                  <th className="pb-3">Code</th>
                  <th className="pb-3">Usage</th>
                  <th className="pb-3">Expires</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {invites.map((invite) => (
                  <tr key={invite.id} className="border-b border-border/70 last:border-none">
                    <td className="py-4 font-semibold text-slate-900">{invite.code}</td>
                    <td className="py-4 text-slate-600">
                      {invite.uses}
                      {invite.max_uses ? ` / ${invite.max_uses}` : ''}
                    </td>
                    <td className="py-4 text-slate-600">
                      {invite.expires_at
                        ? new Date(invite.expires_at).toLocaleDateString()
                        : 'Never'}
                    </td>
                    <td className="py-4 text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => revokeInvite.mutate(invite.id)}
                      >
                        Revoke
                      </Button>
                    </td>
                  </tr>
                ))}
                {invites.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-500">
                      No invites yet. Create one to bring your first members in.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Create invite</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              createInvite.mutate();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="max-uses">Max uses</Label>
              <Input
                id="max-uses"
                type="number"
                min={1}
                value={maxUses}
                onChange={(event) => setMaxUses(event.target.value)}
                placeholder="Leave blank for unlimited"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expires-at">Expires at</Label>
              <Input
                id="expires-at"
                type="datetime-local"
                value={expiresAt}
                onChange={(event) => setExpiresAt(event.target.value)}
              />
            </div>
            {error ? (
              <p className="text-sm font-medium text-rose-600">{error}</p>
            ) : null}
            <Button type="submit" disabled={createInvite.isPending}>
              {createInvite.isPending ? 'Creating...' : 'Create Invite'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
