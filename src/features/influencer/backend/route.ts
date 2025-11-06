import type { Hono } from 'hono';
import { z } from 'zod';
import { respond, failure } from '@/backend/http/response';
import { getLogger, getSupabase, type AppEnv, type AppContext } from '@/backend/hono/context';
import { withAuth, getAuthUser } from '@/backend/middleware/auth';
import {
  ProfileUpsertRequestSchema,
  SubmitRequestSchema,
  type ProfileUpsertRequest,
} from './schema';
import { getMe, saveDraft, submitProfile } from './service';
import { influencerErrorCodes } from './error';

const parseJsonSafe = async <T>(req: Request, schema: z.ZodSchema<T>) => {
  try {
    const json = (await req.json()) as unknown;
    const parsed = schema.safeParse(json);
    if (!parsed.success) {
      return { ok: false as const, error: parsed.error.format() };
    }
    return { ok: true as const, data: parsed.data };
  } catch {
    return { ok: false as const, error: 'INVALID_JSON' };
  }
};

export const registerInfluencerRoutes = (app: Hono<AppEnv>) => {
  // GET current profile + channels
  const getHandler = async (c: AppContext) => {
    const supabase = getSupabase(c);
    const user = getAuthUser(c)!
    const result = await getMe(supabase, user.id);
    return respond(c, result);
  };

  // Save draft profile/channels
  const saveHandler = async (c: AppContext) => {
    const logger = getLogger(c);
    const supabase = getSupabase(c);
    const user = getAuthUser(c)!;
    const parsed = await parseJsonSafe<ProfileUpsertRequest>(
      c.req.raw,
      ProfileUpsertRequestSchema,
    );
    if (!parsed.ok) {
      return respond(
        c,
        failure(400, influencerErrorCodes.invalidPayload, '잘못된 요청 본문입니다.', parsed.error),
      );
    }
    const result = await saveDraft(supabase, user.id, parsed.data);
    if (!result.ok) {
      logger.error('Influencer saveDraft failed:', result);
    }
    return respond(c, result);
  };

  // Submit profile (complete)
  const submitHandler = async (c: AppContext) => {
    const logger = getLogger(c);
    const supabase = getSupabase(c);
    const user = getAuthUser(c)!;
    const parsed = await parseJsonSafe(c.req.raw, SubmitRequestSchema);
    if (!parsed.ok) {
      return respond(
        c,
        failure(400, influencerErrorCodes.invalidPayload, '잘못된 요청 본문입니다.', parsed.error),
      );
    }
    const result = await submitProfile(supabase, user.id);
    if (!result.ok) {
      logger.error('Influencer submit failed:', result);
    }
    return respond(c, result);
  };

  // Routes under both /influencers and /api/influencers
  app.get('/influencers/me', withAuth({ requiredRole: 'influencer' }), getHandler);
  app.get('/api/influencers/me', withAuth({ requiredRole: 'influencer' }), getHandler);

  app.post('/influencers/profile', withAuth({ requiredRole: 'influencer' }), saveHandler);
  app.post('/api/influencers/profile', withAuth({ requiredRole: 'influencer' }), saveHandler);

  app.post('/influencers/submit', withAuth({ requiredRole: 'influencer' }), submitHandler);
  app.post('/api/influencers/submit', withAuth({ requiredRole: 'influencer' }), submitHandler);
};

