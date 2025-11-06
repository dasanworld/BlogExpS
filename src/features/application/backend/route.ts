import type { Hono } from 'hono';
import { withAuth } from '@/backend/middleware/auth';
import { getSupabase, getUser, type AppEnv } from '@/backend/hono/context';
import { respond, failure } from '@/backend/http/response';
import { createApplication, listMyApplications } from './service';
import { applicationErrorCodes } from './error';

export const registerApplicationRoutes = (app: Hono<AppEnv>) => {
  app.post('/applications', withAuth({ requiredRole: 'influencer' }), async (c) => {
    const supabase = getSupabase(c);
    const user = getUser(c);
    if (!user?.id) {
      return respond(c, failure(401, applicationErrorCodes.unauthorized, '인증 토큰이 필요합니다.'));
    }
    const body = await c.req.json().catch(() => ({}));
    const result = await createApplication(supabase, user.id, body);
    return respond(c, result);
  });

  app.get('/applications/me', withAuth({ requiredRole: 'influencer' }), async (c) => {
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
