"use client";

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import {
  CampaignDetailResponseSchema,
  type CampaignDetailResponse,
} from '@/features/campaign/backend/schema';

export const useCampaignDetailQuery = (id: string | undefined) => {
  return useQuery<CampaignDetailResponse>({
    queryKey: ['/api/campaigns', id],
    queryFn: async () => {
      if (!id) throw new Error('Campaign id is required');
      const { data } = await apiClient.get(`/api/campaigns/${id}`);
      const parsed = CampaignDetailResponseSchema.safeParse(data);
      if (!parsed.success) throw new Error('Invalid campaign detail response');
      return parsed.data as CampaignDetailResponse;
    },
    enabled: Boolean(id),
    staleTime: 10_000,
    retry: 2,
  });
};

