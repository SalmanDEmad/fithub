import { createApiUrl } from '@fithub/api-client';
import { createClient } from '@/utils/supabase/client';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

async function apiCall(path: string, options: RequestInit = {}) {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const res = await fetch(createApiUrl(API_URL!, path), {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session?.access_token}`,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'API error');
  }

  return res.json();
}

export const api = {
  createGym: (data: { name: string; slug: string }) =>
    apiCall('/gyms', { method: 'POST', body: JSON.stringify(data) }),

  joinGym: (data: { invite_code: string; display_name: string }) =>
    apiCall('/gyms/join', { method: 'POST', body: JSON.stringify(data) }),

  getQrPayload: (gymId: string) => apiCall(`/checkin/qr/${gymId}`),

  manualCheckin: (memberId: string) =>
    apiCall('/checkin/manual', {
      method: 'POST',
      body: JSON.stringify({ member_id: memberId }),
    }),

  createInvite: (data: { max_uses: number | null; expires_at: string | null }) =>
    apiCall('/gyms/invites', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  revokeInvite: (inviteId: string) =>
    apiCall(`/gyms/invites/${inviteId}`, {
      method: 'DELETE',
    }),

  updateGymSettings: (data: {
    name: string;
    timezone: string;
    weekly_visit_goal: number;
    avg_membership_fee: number;
  }) =>
    apiCall('/gyms/settings', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};
