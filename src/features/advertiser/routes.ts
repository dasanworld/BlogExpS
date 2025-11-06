export const ADVERTISER_API_ROUTES = {
  me: '/api/advertisers/me',
  save: '/api/advertisers/profile',
  submit: '/api/advertisers/submit',
  myCampaigns: '/api/advertisers/campaigns',
  myCampaignDetail: (id: string) => `/api/advertisers/campaigns/${id}`,
  closeCampaign: (id: string) => `/api/advertisers/campaigns/${id}/close`,
  selectApplicants: (id: string) => `/api/advertisers/campaigns/${id}/select`,
} as const;

export const advertiserCampaignKeys = {
  all: ['advertiser', 'campaigns'] as const,
  lists: () => [...advertiserCampaignKeys.all, 'list'] as const,
  list: (params: Record<string, unknown>) => [
    ...advertiserCampaignKeys.lists(),
    params,
  ] as const,
  details: () => [...advertiserCampaignKeys.all, 'detail'] as const,
  detail: (id: string) => [...advertiserCampaignKeys.details(), id] as const,
} as const;
