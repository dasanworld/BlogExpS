"use client";

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import { applicationKeys, applicationRoutes } from '@/features/application/routes';
import { MyApplicationsResponseSchema } from '@/features/application/backend/schema';
import { deriveApplicationStatusBreakdown } from '@/features/influencer/dashboard/lib/progress';

const STATUS_PRESETS = ['all', 'selected', 'rejected'] as const;

const buildAuthHeaders = async () => {
  const supabase = getSupabaseBrowserClient();
  const session = await supabase.auth.getSession();
  const access = session.data.session?.access_token;
  const headers: Record<string, string> = {};
  if (access) headers['Authorization'] = `Bearer ${access}`;
  return headers;
};

export const useMyApplicationStatsQuery = () => {
  return useQuery({
    queryKey: applicationKeys.myStats(),
    queryFn: async () => {
      const headers = await buildAuthHeaders();
      const fetchCount = async (status: (typeof STATUS_PRESETS)[number]) => {
        const search = new URLSearchParams({
          status,
          page: '1',
          pageSize: '1',
          sort: 'recent',
        });
        const url = `${applicationRoutes.me}?${search.toString()}`;
        const { data } = await apiClient.get(url, { headers });
        const parsed = MyApplicationsResponseSchema.safeParse(data);
        if (!parsed.success) throw new Error('Invalid applications stats response');
        return parsed.data.meta.total;
      };

      const [totalAll, totalSelected, totalRejected] = await Promise.all(
        STATUS_PRESETS.map((status) => fetchCount(status)),
      );

      return deriveApplicationStatusBreakdown({
        totalAll,
        totalSelected,
        totalRejected,
      });
    },
    staleTime: 15_000,
    retry: 1,
  });
};
