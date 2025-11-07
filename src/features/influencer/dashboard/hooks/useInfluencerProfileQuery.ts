"use client";

import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { apiClient } from '@/lib/remote/api-client';
import { INFLUENCER_API_ROUTES } from '@/features/influencer/routes';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client';

const InfluencerChannelSchema = z.object({
  id: z.string().optional(),
  platform: z.string(),
  name: z.string(),
  url: z.string(),
  verificationStatus: z.enum(['pending', 'verified', 'failed']).optional(),
});

const BirthDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const InfluencerProfileResponseSchema = z.object({
  profileCompleted: z.boolean(),
  birthDate: BirthDateSchema.nullable().optional(),
  channels: z.array(InfluencerChannelSchema),
});

export type InfluencerProfileResponse = z.infer<typeof InfluencerProfileResponseSchema> & {
  verifiedCount: number;
};

const buildAuthHeaders = async () => {
  const supabase = getSupabaseBrowserClient();
  const session = await supabase.auth.getSession();
  const access = session.data.session?.access_token;
  const headers: Record<string, string> = {};
  if (access) headers['Authorization'] = `Bearer ${access}`;
  return headers;
};

export const useInfluencerProfileQuery = () => {
  return useQuery<InfluencerProfileResponse>({
    queryKey: ['influencer-profile', 'me'],
    queryFn: async () => {
      const headers = await buildAuthHeaders();
      const { data } = await apiClient.get(INFLUENCER_API_ROUTES.me, { headers });
      const parsed = InfluencerProfileResponseSchema.safeParse(data);
      if (!parsed.success) throw new Error('Invalid influencer profile response');
      const verifiedCount = parsed.data.channels.filter((c) => c.verificationStatus === 'verified').length;
      return { ...parsed.data, verifiedCount };
    },
    staleTime: 10_000,
    retry: 2,
  });
};
