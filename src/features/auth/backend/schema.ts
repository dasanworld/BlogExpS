import { z } from 'zod';
import { AUTH_POLICY } from '@/features/auth/constants';

export const RoleEnum = z.enum(['advertiser', 'influencer']);
export type Role = z.infer<typeof RoleEnum>;

export const SignupRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(AUTH_POLICY.PASSWORD_MIN_LENGTH),
  name: z.string().min(1),
  phone: z.string().min(6),
  role: RoleEnum,
  termsAgreed: z.literal(true),
});

export type SignupRequest = z.infer<typeof SignupRequestSchema>;

export const SignupResponseSchema = z.object({
  userId: z.string().uuid().optional(),
  nextAction: z.enum(['verify_email', 'session_active']),
  message: z.string(),
});

export type SignupResponse = z.infer<typeof SignupResponseSchema>;
