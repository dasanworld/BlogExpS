import type { SupabaseClient } from '@supabase/supabase-js';
import { failure, success, type HandlerResult } from '@/backend/http/response';
import {
  CreateApplicationBodySchema,
  type CreateApplicationBody,
  type CreateApplicationResponse,
  MyApplicationsQuerySchema,
  type MyApplicationsQuery,
  type MyApplicationsResponse,
} from './schema';
import { applicationErrorCodes, type ApplicationServiceError } from './error';

export const createApplication = async (
  supabase: SupabaseClient,
  userId: string,
  rawBody: unknown,
): Promise<HandlerResult<CreateApplicationResponse, ApplicationServiceError['code'], unknown>> => {
  const parsed = CreateApplicationBodySchema.safeParse(rawBody);
  if (!parsed.success) {
    return failure(422, applicationErrorCodes.invalidBody, 'Invalid application payload.', parsed.error.format());
  }
  const body: CreateApplicationBody = parsed.data;

  // visitDate must be today or later
  const today = new Date();
  const visitDate = new Date(body.visitDate);
  if (visitDate < new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
    return failure(422, applicationErrorCodes.invalidBody, 'Visit date must be today or later.');
  }

  try {
    // profile check
    const { data: infl, error: inflErr } = await supabase
      .from('influencer_profiles')
      .select('profile_completed')
      .eq('id', userId)
      .single();
    if (inflErr) {
      return failure(500, applicationErrorCodes.fetchError, 'Failed to verify influencer profile.', inflErr);
    }
    if (!infl?.profile_completed) {
      return failure(403, applicationErrorCodes.profileIncomplete, '인플루언서 프로필을 완료해주세요.');
    }

    // campaign check
    const { data: campaign, error: campErr } = await supabase
      .from('campaigns')
      .select('id, status, recruitment_start_date, recruitment_end_date')
      .eq('id', body.campaignId)
      .single();
    if (campErr) {
      // differentiate not found
      if (String(campErr.code) === 'PGRST116' || campErr.message.includes('No rows')) {
        return failure(404, applicationErrorCodes.campaignNotFound, '체험단을 찾을 수 없습니다.');
      }
      return failure(500, applicationErrorCodes.fetchError, 'Failed to fetch campaign.', campErr);
    }

    const start = new Date(campaign.recruitment_start_date as unknown as string);
    const end = new Date(campaign.recruitment_end_date as unknown as string);
    const inPeriod = today >= start && today <= end;
    const recruiting = campaign.status === 'recruiting';
    if (!(recruiting && inPeriod)) {
      return failure(409, applicationErrorCodes.campaignNotRecruiting, '현재 모집 중이 아닙니다.');
    }

    // duplicate check
    {
      const { data: dup, error: dupErr } = await supabase
        .from('applications')
        .select('id')
        .eq('campaign_id', body.campaignId)
        .eq('influencer_id', userId)
        .maybeSingle();
      if (dupErr) {
        return failure(500, applicationErrorCodes.fetchError, 'Failed to check duplicates.', dupErr);
      }
      if (dup) {
        return failure(409, applicationErrorCodes.duplicateApplication, '이미 해당 체험단에 지원하셨습니다.');
      }
    }

    // insert
    const { data: inserted, error: insErr } = await supabase
      .from('applications')
      .insert({
        campaign_id: body.campaignId,
        influencer_id: userId,
        motivation: body.motivation,
        visit_date: body.visitDate,
        status: 'applied',
      })
      .select('*')
      .single();

    if (insErr) {
      // unique violation
      if (insErr.code === '23505') {
        return failure(409, applicationErrorCodes.duplicateApplication, '이미 해당 체험단에 지원하셨습니다.');
      }
      return failure(500, applicationErrorCodes.insertError, 'Failed to submit application.', insErr);
    }

    return success({ application: inserted });
  } catch (e) {
    return failure(500, applicationErrorCodes.insertError, 'Failed to submit application.', e);
  }
};

export const listMyApplications = async (
  supabase: SupabaseClient,
  userId: string,
  rawParams: unknown,
): Promise<HandlerResult<MyApplicationsResponse, ApplicationServiceError['code'], unknown>> => {
  const parsed = MyApplicationsQuerySchema.safeParse(rawParams);
  if (!parsed.success) {
    return failure(400, applicationErrorCodes.invalidBody, 'Invalid query parameters.', parsed.error.format());
  }
  const params: MyApplicationsQuery = parsed.data;

  const page = params.page;
  const pageSize = params.pageSize;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  try {
    let query = supabase
      .from('applications')
      .select('id,campaign_id,influencer_id,motivation,visit_date,status,created_at,updated_at', { count: 'exact' })
      .eq('influencer_id', userId);

    if (params.status !== 'all') {
      query = query.eq('status', params.status);
    }

    query = query.order('created_at', { ascending: false }).range(from, to);

    const { data: apps, count, error } = await query;
    if (error) {
      return failure(500, applicationErrorCodes.fetchError, 'Failed to fetch applications.', error);
    }

    const campaignIds = Array.from(new Set((apps ?? []).map((a) => a.campaign_id)));
    const { data: camps, error: campErr } = await supabase
      .from('campaigns')
      .select('id,title,recruitment_start_date,recruitment_end_date,status')
      .in('id', campaignIds);
    if (campErr) {
      return failure(500, applicationErrorCodes.fetchError, 'Failed to fetch campaigns.', campErr);
    }

    const campMap = new Map<string, unknown>();
    for (const c of camps ?? []) campMap.set((c as any).id, c);

    const items = (apps ?? [])
      .map((a) => {
        const c = campMap.get(a.campaign_id);
        if (!c) return null;
        return { application: a, campaign: c } as { application: any; campaign: any };
      })
      .filter(Boolean) as { application: any; campaign: any }[];

    const total = count ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    return success({ items, meta: { page, pageSize, total, totalPages } });
  } catch (e) {
    return failure(500, applicationErrorCodes.fetchError, 'Failed to fetch applications.', e);
  }
};
