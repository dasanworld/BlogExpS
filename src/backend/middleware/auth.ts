import { createMiddleware } from 'hono/factory';
import { getSupabase, getLogger, type AppEnv, contextKeys } from '@/backend/hono/context';
import { failure } from '@/backend/http/response';
import { influencerErrorCodes } from '@/features/influencer/backend/error';

export type AuthUser = { id: string; email?: string; role?: string | null };

export const withAuth = (opts?: { requiredRole?: 'influencer' | 'advertiser' }) =>
  createMiddleware<AppEnv>(async (c, next) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);
    const authz = c.req.header('authorization') || c.req.header('Authorization');
    const hasAuthzHeader = Boolean(authz);
    let token = authz?.toLowerCase().startsWith('bearer ')
      ? authz.split(' ')[1]
      : undefined;
    if (!token) {
      const cookie = c.req.header('cookie') || '';
      const m = /(?:^|;\s*)sb-access-token=([^;]+)/.exec(cookie);
      if (m) token = decodeURIComponent(m[1]);
    }
    const hasCookieToken = Boolean(!token && (c.req.header('cookie') || '').includes('sb-access-token='));

    if (!token) {
      logger.warn('withAuth: missing token', { path: c.req.path, hasAuthzHeader, hasCookieToken });
      return c.json(
        failure(401, influencerErrorCodes.unauthorized, '인증 토큰이 필요합니다.', {
          hasAuthzHeader,
          hasCookieToken,
        }),
        401,
      );
    }

    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
      logger.warn('withAuth: invalid token', { path: c.req.path, error: error?.message });
      return c.json(
        failure(401, influencerErrorCodes.unauthorized, '유효하지 않은 인증 토큰입니다.', {
          reason: error?.message ?? 'NO_USER',
        }),
        401,
      );
    }

    const userId = data.user.id;
    // Resolve role from DB to avoid relying on client claims
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role, email')
      .eq('id', userId)
      .single();

    const role = profile?.role as 'influencer' | 'advertiser' | undefined;
    if (opts?.requiredRole && role !== opts.requiredRole) {
      logger.warn('withAuth: forbidden role', { path: c.req.path, role, requiredRole: opts.requiredRole });
      return c.json(
        failure(403, influencerErrorCodes.forbiddenRole, '요청 권한이 없습니다.', {
          role,
          requiredRole: opts.requiredRole,
        }),
        403,
      );
    }

    c.set(contextKeys.user, { id: userId, email: profile?.email ?? undefined, role } satisfies AuthUser);
    await next();
  });

export const getAuthUser = (c: { get: (k: string) => unknown }) =>
  c.get(contextKeys.user as string) as AuthUser | undefined;
