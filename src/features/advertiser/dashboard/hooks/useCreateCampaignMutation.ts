"use client";

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import { ADVERTISER_API_ROUTES, advertiserCampaignKeys } from '@/features/advertiser/routes';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import { AdvertiserCampaignItemSchema, type CampaignCreateRequest } from '@/features/advertiser/backend/campaign.schema';

export const useCreateCampaignMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CampaignCreateRequest) => {
      const supabase = getSupabaseBrowserClient();
      const session = await supabase.auth.getSession();
      const access = session.data.session?.access_token;
      const headers: Record<string, string> = {};
      if (access) headers['Authorization'] = `Bearer ${access}`;

      const { data } = await apiClient.post(ADVERTISER_API_ROUTES.myCampaigns, payload, { headers, withCredentials: true });
      const parsed = AdvertiserCampaignItemSchema.safeParse(data);
      if (!parsed.success) throw new Error('Invalid create campaign response');
      return parsed.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: advertiserCampaignKeys.all as unknown as string[] });
    },
    onError: (err) => {
      throw new Error(extractApiErrorMessage(err));
    },
  });
};
