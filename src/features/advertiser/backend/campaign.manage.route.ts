import type { Hono } from 'hono';
import { respond, failure } from '@/backend/http/response';
import { getSupabase, type AppEnv, type AppContext } from '@/backend/hono/context';
import { withAuth, getAuthUser } from '@/backend/middleware/auth';
import { getMyCampaignDetail, closeRecruitment, selectApplicants } from './campaign.manage.service';
import { advertiserCampaignManageErrorCodes } from './campaign.manage.error';

export const registerAdvertiserCampaignManageRoutes = (app: Hono<AppEnv>) => {
  // Detail with applicants
  const detailHandler = async (c: AppContext) => {
    const supabase = getSupabase(c);
    const user = getAuthUser(c)!;
    const id = c.req.param('id');
    const result = await getMyCampaignDetail(supabase, user.id, id);
    return respond(c, result);
  };

  app.get('/advertisers/campaigns/:id', withAuth({ requiredRole: 'advertiser' }), detailHandler);
  app.get('/api/advertisers/campaigns/:id', withAuth({ requiredRole: 'advertiser' }), detailHandler);

  // Close recruitment
  const closeHandler = async (c: AppContext) => {
    const supabase = getSupabase(c);
    const user = getAuthUser(c)!;
    const id = c.req.param('id');
    const result = await closeRecruitment(supabase, user.id, id);
    return respond(c, result);
  };

  app.post('/advertisers/campaigns/:id/close', withAuth({ requiredRole: 'advertiser' }), closeHandler);
  app.post('/api/advertisers/campaigns/:id/close', withAuth({ requiredRole: 'advertiser' }), closeHandler);

  // Select applicants
  const selectHandler = async (c: AppContext) => {
    const supabase = getSupabase(c);
    const user = getAuthUser(c)!;
    const id = c.req.param('id');
    let body: unknown = {};
    try {
      body = await c.req.json();
    } catch {
      return respond(
        c,
        failure(
          400,
          advertiserCampaignManageErrorCodes.invalidPayload,
          '잘못된 요청 본문입니다.',
          'INVALID_JSON',
        ),
      );
    }
    const result = await selectApplicants(supabase, user.id, id, body);
    return respond(c, result);
  };

  app.post('/advertisers/campaigns/:id/select', withAuth({ requiredRole: 'advertiser' }), selectHandler);
  app.post('/api/advertisers/campaigns/:id/select', withAuth({ requiredRole: 'advertiser' }), selectHandler);
};
