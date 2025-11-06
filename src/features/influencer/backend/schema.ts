import { z } from 'zod';
import { getInfluencerPolicy } from '@/features/influencer/constants';

const policy = getInfluencerPolicy();

export const PlatformEnum = policy.allowedPlatforms && policy.allowedPlatforms.length > 0
  ? z.enum(policy.allowedPlatforms as [string, ...string[]])
  : z.string().min(1);

export const ChannelInputSchema = z.object({
  id: z.string().uuid().optional(),
  platform: PlatformEnum,
  name: z.string().min(1),
  url: z.string().url(),
  _op: z.enum(['upsert', 'delete']).optional().default('upsert'),
});

export const ProfileUpsertRequestSchema = z.object({
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  channels: z.array(ChannelInputSchema),
  idempotencyKey: z.string().min(1).optional(),
});

export type ProfileUpsertRequest = z.infer<typeof ProfileUpsertRequestSchema>;
export type ChannelInput = z.infer<typeof ChannelInputSchema>;

export const SubmitRequestSchema = z.object({
  idempotencyKey: z.string().min(1).optional(),
});
export type SubmitRequest = z.infer<typeof SubmitRequestSchema>;

export const ChannelSchema = z.object({
  id: z.string().uuid(),
  platform: z.string(),
  name: z.string(),
  url: z.string().url(),
  verificationStatus: z.enum(['pending', 'verified', 'failed']),
});

export const ProfileResponseSchema = z.object({
  profileCompleted: z.boolean(),
  channels: z.array(ChannelSchema),
});
export type ProfileResponse = z.infer<typeof ProfileResponseSchema>;

