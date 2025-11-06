export const CAMPAIGN_API_ROUTES = {
  list: '/api/campaigns',
  detail: (id: string) => `/api/campaigns/${id}`,
} as const;

/**
 * React Query key factory for campaign queries
 * 쿼리 키는 파라미터에 따라 자동으로 캐시 분리됨
 */
export const campaignKeys = {
  all: ['campaigns'] as const,
  lists: () => [...campaignKeys.all, 'list'] as const,
  list: (params: Record<string, unknown>) => [
    ...campaignKeys.lists(),
    params,
  ] as const,
  details: () => [...campaignKeys.all, 'detail'] as const,
  detail: (id: string) => [...campaignKeys.details(), id] as const,
} as const;

// 하위 호환성을 위한 별칭
export const campaignRoutes = CAMPAIGN_API_ROUTES;

