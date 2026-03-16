import { z } from 'zod';

export const createGymSchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
});

export const gymInviteSchema = z.object({
  max_uses: z.number().int().positive().max(500).nullable().optional(),
  expires_at: z.string().datetime().nullable().optional(),
});

export const updateGymSettingsSchema = z.object({
  name: z.string().trim().min(2).max(100),
  timezone: z.string().trim().min(2).max(100),
  weekly_visit_goal: z.number().int().min(1).max(7),
  avg_membership_fee: z.number().min(0).max(50000),
});

export const joinGymSchema = z.object({
  invite_code: z.string().trim().min(6).max(32),
  display_name: z.string().trim().min(2).max(100),
});

export const scanCheckinSchema = z.object({
  qr_payload: z.string().regex(/^[0-9a-f-]+:\d+:[0-9a-f]+$/),
});

export const manualCheckinSchema = z.object({
  member_id: z.string().uuid(),
});

export const updateMemberPreferencesSchema = z.object({
  personal_weekly_goal: z.number().int().min(1).max(5).nullable(),
});

export const registerPushDeviceSchema = z.object({
  expo_push_token: z.string().min(8).max(255),
  platform: z.enum(['ios', 'android', 'web']),
  device_name: z.string().trim().min(1).max(100).nullable().optional(),
});

export const unregisterPushDeviceSchema = z.object({
  expo_push_token: z.string().min(8).max(255),
});

export type CreateGymInput = z.infer<typeof createGymSchema>;
export type GymInviteInput = z.infer<typeof gymInviteSchema>;
export type UpdateGymSettingsInput = z.infer<typeof updateGymSettingsSchema>;
export type JoinGymInput = z.infer<typeof joinGymSchema>;
export type ScanCheckinInput = z.infer<typeof scanCheckinSchema>;
export type ManualCheckinInput = z.infer<typeof manualCheckinSchema>;
export type UpdateMemberPreferencesInput = z.infer<typeof updateMemberPreferencesSchema>;
export type RegisterPushDeviceInput = z.infer<typeof registerPushDeviceSchema>;
export type UnregisterPushDeviceInput = z.infer<typeof unregisterPushDeviceSchema>;
