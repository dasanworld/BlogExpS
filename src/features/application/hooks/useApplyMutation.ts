"use client";

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage, isAxiosError } from '@/lib/remote/api-client';
import { applicationRoutes, applicationKeys } from '@/features/application/routes';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import type { CreateApplicationResponse } from '@/features/application/backend/schema';

export type ApplyPayload = {
  campaignId: string;
  motivation: string;
  visitDate: string; // ISO
};

export class CampaignNotRecruitingError extends Error {
  code = 'CAMPAIGN_NOT_RECRUITING';
  constructor(message: string) {
    super(message);
    this.name = 'CampaignNotRecruitingError';
  }
}

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

      try {
        const { data } = await apiClient.post(applicationRoutes.create, payload, { headers });
        return data as CreateApplicationResponse;
      } catch (error) {
        if (isAxiosError(error)) {
          const code = (error.response?.data as any)?.error?.code;
          if (code === 'CAMPAIGN_NOT_RECRUITING') {
            const message = (error.response?.data as any)?.error?.message ?? '모집 기간이 아닙니다.';
            throw new CampaignNotRecruitingError(message);
          }
        }
        throw error;
      }
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
