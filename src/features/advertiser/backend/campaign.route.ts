import type { Hono } from 'hono';
import { z } from 'zod';
import { respond, failure } from '@/backend/http/response';
import { getSupabase, type AppEnv } from '@/backend/hono/context';
import { withAuth, getAuthUser } from '@/backend/middleware/auth';
import { listMyCampaigns, createCampaign } from './campaign.service';
import { advertiserCampaignErrorCodes } from './campaign.error';

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

export const registerAdvertiserCampaignRoutes = (app: Hono<AppEnv>) => {
  // GET my campaigns
  app.get('/advertisers/campaigns', withAuth({ requiredRole: 'advertiser' }), async (c) => {
    const supabase = getSupabase(c);
    const user = getAuthUser(c)!;
    const url = new URL(c.req.url);
    const params = Object.fromEntries(url.searchParams.entries());
    const result = await listMyCampaigns(supabase, user.id, params);
    return respond(c, result);
  });

  app.get('/api/advertisers/campaigns', withAuth({ requiredRole: 'advertiser' }), async (c) => {
    const supabase = getSupabase(c);
    const user = getAuthUser(c)!;
    const url = new URL(c.req.url);
    const params = Object.fromEntries(url.searchParams.entries());
    const result = await listMyCampaigns(supabase, user.id, params);
    return respond(c, result);
  });

  // POST create campaign
  app.post('/advertisers/campaigns', withAuth({ requiredRole: 'advertiser' }), async (c) => {
    const supabase = getSupabase(c);
    const user = getAuthUser(c)!;
    let body: unknown = {};
    try {
      body = await c.req.json();
    } catch {
      return respond(
        c,
        failure(400, advertiserCampaignErrorCodes.invalidPayload, '잘못된 요청 본문입니다.', 'INVALID_JSON'),
      );
    }
    const result = await createCampaign(supabase, user.id, body);
    return respond(c, result);
  });

  app.post('/api/advertisers/campaigns', withAuth({ requiredRole: 'advertiser' }), async (c) => {
    const supabase = getSupabase(c);
    const user = getAuthUser(c)!;
    let body: unknown = {};
    try {
      body = await c.req.json();
    } catch {
      return respond(
        c,
        failure(400, advertiserCampaignErrorCodes.invalidPayload, '잘못된 요청 본문입니다.', 'INVALID_JSON'),
      );
    }
    const result = await createCampaign(supabase, user.id, body);
    return respond(c, result);
  });
};

