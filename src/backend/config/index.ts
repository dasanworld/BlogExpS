import { z } from 'zod';
import type { AppConfig } from '@/backend/hono/context';

const envSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  INFLUENCER_MIN_AGE_YEARS: z.string().optional(),
  INFLUENCER_MAX_CHANNELS: z.string().optional(),
  INFLUENCER_ALLOWED_PLATFORMS: z.string().optional(),
});

let cachedConfig: AppConfig | null = null;

export const getAppConfig = (): AppConfig => {
  if (cachedConfig) {
    return cachedConfig;
  }

  const parsed = envSchema.safeParse({
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    INFLUENCER_MIN_AGE_YEARS: process.env.INFLUENCER_MIN_AGE_YEARS,
    INFLUENCER_MAX_CHANNELS: process.env.INFLUENCER_MAX_CHANNELS,
    INFLUENCER_ALLOWED_PLATFORMS: process.env.INFLUENCER_ALLOWED_PLATFORMS,
  });

  if (!parsed.success) {
    const messages = parsed.error.issues
      .map((issue) => `${issue.path.join('.') || 'config'}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid backend configuration: ${messages}`);
  }

  const minAge = parsed.data.INFLUENCER_MIN_AGE_YEARS
    ? Number.parseInt(parsed.data.INFLUENCER_MIN_AGE_YEARS, 10)
    : undefined;
  const maxChannels = parsed.data.INFLUENCER_MAX_CHANNELS
    ? Number.parseInt(parsed.data.INFLUENCER_MAX_CHANNELS, 10)
    : undefined;
  const allowedPlatforms = parsed.data.INFLUENCER_ALLOWED_PLATFORMS
    ? parsed.data.INFLUENCER_ALLOWED_PLATFORMS.split(',').map((s) => s.trim()).filter(Boolean)
    : undefined;

  cachedConfig = {
    supabase: {
      url: parsed.data.SUPABASE_URL,
      serviceRoleKey: parsed.data.SUPABASE_SERVICE_ROLE_KEY,
    },
    influencerPolicy: {
      minAgeYears: Number.isFinite(minAge) ? (minAge as number) : undefined,
      maxChannels: Number.isFinite(maxChannels) ? (maxChannels as number) : undefined,
      allowedPlatforms,
    },
  } satisfies AppConfig;

  return cachedConfig;
};
