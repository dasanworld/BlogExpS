"use client";

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import { applicationKeys, applicationRoutes } from '@/features/application/routes';
import {
  MyApplicationsResponseSchema,
  type MyApplicationsResponse,
} from '@/features/application/backend/schema';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client';

export type MyApplicationsParams = {
  status?: 'all' | 'applied' | 'selected' | 'rejected';
  page?: number;
  pageSize?: number;
  sort?: 'recent';
};

export const useMyApplicationsQuery = (params: MyApplicationsParams) => {
  return useQuery<MyApplicationsResponse>({
    queryKey: applicationKeys.myList(params),
    queryFn: async () => {
      const search = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && String(v).length > 0) search.set(k, String(v));
      });
      const url = applicationRoutes.me + (search.toString() ? `?${search.toString()}` : '');

      // Attach Authorization explicitly per AGENTS.md for protected APIs
      const supabase = getSupabaseBrowserClient();
      const session = await supabase.auth.getSession();
      const access = session.data.session?.access_token;
      const headers: Record<string, string> = {};
      if (access) headers['Authorization'] = `Bearer ${access}`;

      const { data } = await apiClient.get(url, { headers });
      const parsed = MyApplicationsResponseSchema.safeParse(data);
      if (!parsed.success) throw new Error('Invalid applications response');
      return parsed.data as MyApplicationsResponse;
    },
    staleTime: 10_000,
    retry: 2,
  });
};

