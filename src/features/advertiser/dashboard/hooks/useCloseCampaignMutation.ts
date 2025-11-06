"use client";

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import { ADVERTISER_API_ROUTES, advertiserCampaignKeys } from '@/features/advertiser/routes';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client';

export const useCloseCampaignMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = getSupabaseBrowserClient();
      const session = await supabase.auth.getSession();
      const access = session.data.session?.access_token;
      const headers: Record<string, string> = {};
      if (access) headers['Authorization'] = `Bearer ${access}`;

      const { data } = await apiClient.post(ADVERTISER_API_ROUTES.closeCampaign(id), {}, { headers, withCredentials: true });
      return data as { status: 'closed' };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: advertiserCampaignKeys.all as unknown as string[] });
    },
    onError: (err) => {
      throw new Error(extractApiErrorMessage(err));
    },
  });
};
