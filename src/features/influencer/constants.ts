import { getAppConfig } from '@/backend/config';

export type InfluencerPolicy = {
  minAgeYears?: number;
  maxChannels?: number;
  allowedPlatforms?: string[];
};

export const getInfluencerPolicy = (): InfluencerPolicy => {
  const cfg = getAppConfig();
  return cfg.influencerPolicy ?? {};
};

