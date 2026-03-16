'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { updateGymSettingsSchema } from '@fithub/validation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function SettingsForm({
  gym,
}: {
  gym: {
    name: string;
    timezone: string;
    weekly_visit_goal: number;
    avg_membership_fee: number;
  };
}) {
  const router = useRouter();
  const [name, setName] = useState(gym.name);
  const [timezone, setTimezone] = useState(gym.timezone);
  const [weeklyVisitGoal, setWeeklyVisitGoal] = useState(
    String(gym.weekly_visit_goal),
  );
  const [avgMembershipFee, setAvgMembershipFee] = useState(
    String(gym.avg_membership_fee),
  );
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: async () => {
      const parsed = updateGymSettingsSchema.safeParse({
        name,
        timezone,
        weekly_visit_goal: Number(weeklyVisitGoal),
        avg_membership_fee: Number(avgMembershipFee),
      });
      if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message || 'Invalid settings');
      }

      return api.updateGymSettings(parsed.data);
    },
    onSuccess: () => {
      setError('');
      router.refresh();
    },
    onError: (mutationError: Error) => {
      setError(mutationError.message);
    },
  });

  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle>Gym settings</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="grid gap-5 md:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            mutation.mutate();
          }}
        >
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="gym-name">Gym name</Label>
            <Input id="gym-name" value={name} onChange={(event) => setName(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Input
              id="timezone"
              value={timezone}
              onChange={(event) => setTimezone(event.target.value)}
              placeholder="Asia/Qatar"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="weekly-goal">Weekly visit goal</Label>
            <Input
              id="weekly-goal"
              type="number"
              min={1}
              max={7}
              value={weeklyVisitGoal}
              onChange={(event) => setWeeklyVisitGoal(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="membership-fee">Average membership fee (USD)</Label>
            <Input
              id="membership-fee"
              type="number"
              min={0}
              step="0.01"
              value={avgMembershipFee}
              onChange={(event) => setAvgMembershipFee(event.target.value)}
            />
          </div>
          <div className="md:col-span-2">
            {error ? (
              <p className="mb-3 text-sm font-medium text-rose-600">{error}</p>
            ) : null}
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Saving...' : 'Save settings'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
