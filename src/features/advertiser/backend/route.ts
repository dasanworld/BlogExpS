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
import { advertiserErrorCodes } from './error';

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

export const registerAdvertiserRoutes = (app: Hono<AppEnv>) => {
  // GET current advertiser profile
  const getHandler = async (c: AppContext) => {
    const supabase = getSupabase(c);
    const user = getAuthUser(c)!;
    const result = await getMe(supabase, user.id);
    return respond(c, result);
  };

  // Save draft advertiser profile
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
        failure(400, advertiserErrorCodes.invalidPayload, '잘못된 요청 본문입니다.', parsed.error),
      );
    }
    const result = await saveDraft(supabase, user.id, parsed.data);
    if (!result.ok) {
      logger.error('Advertiser saveDraft failed:', result);
    }
    return respond(c, result);
  };

  // Submit advertiser profile (complete)
  const submitHandler = async (c: AppContext) => {
    const logger = getLogger(c);
    const supabase = getSupabase(c);
    const user = getAuthUser(c)!;
    const parsed = await parseJsonSafe(c.req.raw, SubmitRequestSchema);
    if (!parsed.ok) {
      return respond(
        c,
        failure(400, advertiserErrorCodes.invalidPayload, '잘못된 요청 본문입니다.', parsed.error),
      );
    }
    const result = await submitProfile(supabase, user.id);
    if (!result.ok) {
      logger.error('Advertiser submit failed:', result);
    }
    return respond(c, result);
  };

  // Routes under both /advertisers and /api/advertisers
  app.get('/advertisers/me', withAuth({ requiredRole: 'advertiser' }), getHandler);
  app.get('/api/advertisers/me', withAuth({ requiredRole: 'advertiser' }), getHandler);

  app.post('/advertisers/profile', withAuth({ requiredRole: 'advertiser' }), saveHandler);
  app.post('/api/advertisers/profile', withAuth({ requiredRole: 'advertiser' }), saveHandler);

  app.post('/advertisers/submit', withAuth({ requiredRole: 'advertiser' }), submitHandler);
  app.post('/api/advertisers/submit', withAuth({ requiredRole: 'advertiser' }), submitHandler);
};

