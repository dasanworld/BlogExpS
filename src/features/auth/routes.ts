export const AUTH_ROUTES = {
  signup: '/auth/signup',
} as const;

export const API_PREFIX = '/api' as const;

export const getApiRoute = (path: string) => `${API_PREFIX}${path}`;

export const AUTH_API_ROUTES = {
  signup: getApiRoute(AUTH_ROUTES.signup),
} as const;

