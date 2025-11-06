import { z } from 'zod';

export const ProfileUpsertRequestSchema = z.object({
  companyName: z.string().min(1),
  location: z.string().min(1),
  category: z.string().min(1),
  businessRegistrationNumber: z.string().min(1),
  idempotencyKey: z.string().min(1).optional(),
});

export type ProfileUpsertRequest = z.infer<typeof ProfileUpsertRequestSchema>;

export const SubmitRequestSchema = z.object({
  idempotencyKey: z.string().min(1).optional(),
});
export type SubmitRequest = z.infer<typeof SubmitRequestSchema>;

export const ProfileResponseSchema = z.object({
  profileCompleted: z.boolean(),
  verificationStatus: z.enum(['pending', 'verified', 'failed']),
});
export type ProfileResponse = z.infer<typeof ProfileResponseSchema>;

