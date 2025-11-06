"use client";

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import { campaignKeys, CAMPAIGN_API_ROUTES } from '@/features/campaign/routes';
import {
  CampaignListResponseSchema,
  type CampaignListResponse,
} from '@/features/campaign/backend/schema';

export type CampaignListParams = {
  status?: 'recruiting' | 'closed' | 'selection_complete';
  page?: number;
  pageSize?: number;
  sort?: 'recent' | 'popular';
  category?: string;
  location?: string;
  keyword?: string;
  benefitType?: string;
};

export const useCampaignsQuery = (params: CampaignListParams) => {
  return useQuery<CampaignListResponse>({
    queryKey: campaignKeys.list(params),
    queryFn: async () => {
      const search = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && String(v).length > 0) {
          search.set(k, String(v));
        }
      });

      const url = CAMPAIGN_API_ROUTES.list + (search.toString() ? `?${search.toString()}` : '');
      const { data } = await apiClient.get(url);

      const parsed = CampaignListResponseSchema.safeParse(data);
      if (!parsed.success) {
        throw new Error('Invalid campaign list response');
      }

      return parsed.data as CampaignListResponse;
    },
    staleTime: 10_000,
    retry: 2,
  });
};
