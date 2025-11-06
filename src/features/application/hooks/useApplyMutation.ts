"use client";

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import { applicationRoutes, applicationKeys } from '@/features/application/routes';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import type { CreateApplicationResponse } from '@/features/application/backend/schema';

export type ApplyPayload = {
  campaignId: string;
  motivation: string;
  visitDate: string; // ISO
};

export const useApplyMutation = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationKey: applicationKeys.create(),
    mutationFn: async (payload: ApplyPayload) => {
      const supabase = getSupabaseBrowserClient();
      const session = await supabase.auth.getSession();
      const access = session.data.session?.access_token;

      const headers: Record<string, string> = {};
      if (access) headers['Authorization'] = `Bearer ${access}`;

      const { data } = await apiClient.post(applicationRoutes.create, payload, { headers });
      return data as CreateApplicationResponse;
    },
    onSuccess: async (_data, variables) => {
      // Invalidate campaign list and specific detail
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['/api/campaigns'] }),
        qc.invalidateQueries({ queryKey: ['/api/campaigns', variables.campaignId] }),
      ]);
    },
    onError: (error) => {
      return extractApiErrorMessage(error, '지원 요청에 실패했습니다.');
    },
  });
};

