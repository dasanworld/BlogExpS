export const applicationRoutes = {
  create: '/api/applications',
  me: '/api/applications/me',
} as const;

export const applicationKeys = {
  create: () => [applicationRoutes.create, 'create'] as const,
  myList: (params: Record<string, unknown>) => [applicationRoutes.me, params] as const,
  myStats: () => [applicationRoutes.me, 'stats'] as const,
};
