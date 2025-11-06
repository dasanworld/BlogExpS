"use client";

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import { advertiserCampaignKeys, ADVERTISER_API_ROUTES } from '@/features/advertiser/routes';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import { CampaignDetailForOwnerSchema, type CampaignDetailForOwner } from '@/features/advertiser/backend/campaign.manage.schema';

export const useCampaignDetailForOwnerQuery = (id: string | undefined) => {
  return useQuery<CampaignDetailForOwner>({
    queryKey: id ? advertiserCampaignKeys.detail(id) : ['advertiser', 'campaigns', 'detail', 'nil'],
    queryFn: async () => {
      if (!id) throw new Error('Missing id');
      const supabase = getSupabaseBrowserClient();
      const session = await supabase.auth.getSession();
      const access = session.data.session?.access_token;
      const headers: Record<string, string> = {};
      if (access) headers['Authorization'] = `Bearer ${access}`;

      const { data } = await apiClient.get(ADVERTISER_API_ROUTES.myCampaignDetail(id), { headers, withCredentials: true });
      const parsed = CampaignDetailForOwnerSchema.safeParse(data);
      if (!parsed.success) throw new Error('Invalid campaign detail response');
      return parsed.data as CampaignDetailForOwner;
    },
    enabled: Boolean(id),
    staleTime: 5_000,
    retry: 1,
  });
};
