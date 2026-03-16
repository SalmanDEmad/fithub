import { createApiUrl } from '@fithub/api-client';
import { supabase } from './supabase';

const API_URL = process.env.EXPO_PUBLIC_API_URL;

async function apiCall(path: string, options: RequestInit = {}) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }

  const res = await fetch(createApiUrl(API_URL!, path), {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
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
  joinGym: (invite_code: string, display_name: string) =>
    apiCall('/gyms/join', {
      method: 'POST',
      body: JSON.stringify({ invite_code, display_name }),
    }),

  scanCheckin: (qr_payload: string) =>
    apiCall('/checkin/scan', {
      method: 'POST',
      body: JSON.stringify({ qr_payload }),
    }),

  updatePreferences: (personal_weekly_goal: number | null) =>
    apiCall('/members/me/preferences', {
      method: 'PATCH',
      body: JSON.stringify({ personal_weekly_goal }),
    }),

  registerPushDevice: (payload: {
    expo_push_token: string;
    platform: 'ios' | 'android' | 'web';
    device_name?: string | null;
  }) =>
    apiCall('/push/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  unregisterPushDevice: (expo_push_token: string) =>
    apiCall('/push/unregister', {
      method: 'POST',
      body: JSON.stringify({ expo_push_token }),
    }),
};
