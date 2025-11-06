"use client";

import { useQuery } from '@tanstack/react-query';
import { apiClient, isAxiosError } from '@/lib/remote/api-client';
import { advertiserCampaignKeys, ADVERTISER_API_ROUTES } from '@/features/advertiser/routes';
import {
  CampaignListResponseSchema,
  type CampaignListResponse,
} from '@/features/campaign/backend/schema';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';

export type MyCampaignsParams = {
  status?: 'all' | 'recruiting' | 'closed' | 'selection_complete';
  page?: number;
  pageSize?: number;
  sort?: 'recent';
};

export const useMyCampaignsQuery = (params: MyCampaignsParams, options?: { enabled?: boolean; initialData?: CampaignListResponse }) => {
  const { isAuthenticated, isLoading } = useCurrentUser();
  return useQuery<CampaignListResponse, unknown>({
    queryKey: advertiserCampaignKeys.list(params),
    queryFn: async () => {
      const search = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && String(v).length > 0) search.set(k, String(v));
      });
      const url = ADVERTISER_API_ROUTES.myCampaigns + (search.toString() ? `?${search.toString()}` : '');

      const supabase = getSupabaseBrowserClient();
      const session = await supabase.auth.getSession();
      const access = session.data.session?.access_token;
      const headers: Record<string, string> = {};
      if (access) headers['Authorization'] = `Bearer ${access}`;

      const { data } = await apiClient.get(url, { headers, withCredentials: true });
      const parsed = CampaignListResponseSchema.safeParse(data);
      if (!parsed.success) throw new Error('Invalid my campaigns response');
      return parsed.data as CampaignListResponse;
    },
    staleTime: 10_000,
    retry: 2,
    enabled: (options?.enabled ?? (isAuthenticated && !isLoading)) as boolean,
    initialData: options?.initialData,
  });
};
