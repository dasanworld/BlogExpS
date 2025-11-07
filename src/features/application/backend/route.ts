import type { Hono } from 'hono';
import { withAuth } from '@/backend/middleware/auth';
import { getSupabase, getUser, type AppEnv } from '@/backend/hono/context';
import { respond, failure } from '@/backend/http/response';
import { createApplication, listMyApplications } from './service';
import { applicationErrorCodes } from './error';

const registerCreateRoute = (app: Hono<AppEnv>, path: string) => {
  app.post(path, withAuth({ requiredRole: 'influencer' }), async (c) => {
    const supabase = getSupabase(c);
    const user = getUser(c);
    if (!user?.id) {
      return respond(c, failure(401, applicationErrorCodes.unauthorized, '인증 토큰이 필요합니다.'));
    }
    const body = await c.req.json().catch(() => ({}));
    const result = await createApplication(supabase, user.id, body);
    return respond(c, result);
  });
};

const registerMyListRoute = (app: Hono<AppEnv>, path: string) => {
  app.get(path, withAuth({ requiredRole: 'influencer' }), async (c) => {
    const supabase = getSupabase(c);
    const user = getUser(c);
    if (!user?.id) {
      return respond(c, failure(401, applicationErrorCodes.unauthorized, '인증 토큰이 필요합니다.'));
    }
    const url = new URL(c.req.url);
    const params = Object.fromEntries(url.searchParams.entries());
    const result = await listMyApplications(supabase, user.id, params);
    return respond(c, result);
  });
};

export const registerApplicationRoutes = (app: Hono<AppEnv>) => {
  registerCreateRoute(app, '/applications');
  registerCreateRoute(app, '/api/applications');

  registerMyListRoute(app, '/applications/me');
  registerMyListRoute(app, '/api/applications/me');
};
