import type { Hono } from 'hono';
import { respond } from '@/backend/http/response';
import { getSupabase, type AppEnv } from '@/backend/hono/context';
import { listCampaigns, getCampaignById } from './service';

export const registerCampaignRoutes = (app: Hono<AppEnv>) => {
  // GET /api/campaigns - 공개 엔드포인트, 모집 중 체험단 목록 조회
  app.get('/api/campaigns', async (c) => {
    const supabase = getSupabase(c);
    const url = new URL(c.req.url);
    const params = Object.fromEntries(url.searchParams.entries());
    const result = await listCampaigns(supabase, params);
    return respond(c, result);
  });

  // GET /api/campaigns/:id - 공개 엔드포인트, 단일 체험단 상세 조회
  app.get('/api/campaigns/:id', async (c) => {
    const supabase = getSupabase(c);
    const id = c.req.param('id');
    const authz = c.req.header('authorization') || c.req.header('Authorization') || '';
    const token = authz.toLowerCase().startsWith('bearer ') ? authz.split(' ')[1] : undefined;
    const result = await getCampaignById(supabase, id, token);
    return respond(c, result);
  });
};
