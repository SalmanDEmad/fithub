'use client';

import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '@/lib/api';
import { createClient } from '@/utils/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function QrPage() {
  const [payload, setPayload] = useState('');
  const [gymId, setGymId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadGym = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: members } = await supabase
        .from('members')
        .select('gym_id, role')
        .eq('user_id', user.id)
        .in('role', ['admin', 'owner'])
        .limit(1);

      if (members?.[0]) {
        setGymId(members[0].gym_id);
      } else {
        setError('You must be a gym admin or owner to display the QR code.');
      }
      setLoading(false);
    };

    loadGym();
  }, []);

  useEffect(() => {
    if (!gymId) return;

    const refresh = async () => {
      try {
        const response = await api.getQrPayload(gymId);
        setPayload(response.payload);
        setError('');
      } catch (qrError: any) {
        setError(qrError.message);
      }
    };

    refresh();
    const interval = window.setInterval(refresh, 25_000);
    return () => window.clearInterval(interval);
  }, [gymId]);

  if (loading) {
    return <p className="text-sm text-slate-500">Loading your gym QR code...</p>;
  }

  if (error) {
    return <p className="text-sm font-medium text-rose-600">{error}</p>;
  }

  return (
    <>
      <section>
        <p className="text-sm uppercase tracking-[0.2em] text-emerald-700">QR check-in</p>
        <h1 className="mt-2 text-4xl font-semibold text-slate-950">Display this at your entrance</h1>
        <p className="mt-2 text-base text-slate-600">
          The QR payload refreshes automatically every 30 seconds to prevent stale screenshots.
        </p>
      </section>

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Live check-in QR</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6">
          <div className="rounded-[2rem] bg-white p-8 shadow-panel">
            {payload ? (
              <QRCodeSVG value={payload} size={320} level="M" />
            ) : (
              <div className="flex h-80 w-80 items-center justify-center rounded-3xl bg-slate-50 text-sm text-slate-500">
                Loading QR code...
              </div>
            )}
          </div>
          <div className="w-full rounded-3xl bg-slate-50 p-4 text-start">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Manual fallback code
            </p>
            <p className="mt-3 break-all font-mono text-sm text-slate-700">{payload}</p>
          </div>
          <p className="text-sm text-slate-500">
            Tip: keep this page open on a dedicated screen near your front desk.
          </p>
        </CardContent>
      </Card>
    </>
  );
}
