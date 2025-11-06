import type { Hono } from 'hono';
import { z } from 'zod';
import { respond, failure } from '@/backend/http/response';
import { getLogger, getSupabase, type AppEnv } from '@/backend/hono/context';
import { SignupRequestSchema, type SignupRequest } from './schema';
import { signupOrchestrate } from './service';
import { authErrorCodes } from './error';

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

export const registerAuthRoutes = (app: Hono<AppEnv>) => {
  app.post('/auth/signup', async (c) => {
    const logger = getLogger(c);
    const supabase = getSupabase(c);

    const parsed = await parseJsonSafe<SignupRequest>(c.req.raw, SignupRequestSchema);
    if (!parsed.ok) {
      return respond(
        c,
        failure(400, authErrorCodes.invalidSignupPayload, '잘못된 회원가입 요청입니다.', parsed.error),
      );
    }

    const result = await signupOrchestrate(supabase, parsed.data);
    if (!result.ok) {
      logger.error('Signup failed:', result.error);
    }
    return respond(c, result);
  });
};

