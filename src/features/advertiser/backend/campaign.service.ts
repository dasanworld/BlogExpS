import type { SupabaseClient } from '@supabase/supabase-js';
import { success, failure, type HandlerResult } from '@/backend/http/response';
import {
  MyCampaignListQuerySchema,
  type MyCampaignListQuery,
  AdvertiserCampaignItemSchema,
  type AdvertiserCampaignItem,
  MyCampaignListResponseSchema,
  CampaignCreateRequestSchema,
  type CampaignCreateRequest,
} from './campaign.schema';
import { advertiserCampaignErrorCodes } from './campaign.error';
import { CampaignStatusEnum } from '@/features/campaign/backend/schema';

type ListOk = typeof MyCampaignListResponseSchema['_type'];
type CreateOk = AdvertiserCampaignItem;

export const listMyCampaigns = async (
  supabase: SupabaseClient,
  userId: string,
  rawParams: unknown,
): Promise<HandlerResult<ListOk, typeof advertiserCampaignErrorCodes[keyof typeof advertiserCampaignErrorCodes], unknown>> => {
  const parsed = MyCampaignListQuerySchema.safeParse(rawParams);
  if (!parsed.success) {
    return failure(400, advertiserCampaignErrorCodes.invalidQueryParams, 'Invalid query parameters.', parsed.error.format());
  }
  const params: MyCampaignListQuery = parsed.data;

  const page = params.page;
  const pageSize = params.pageSize;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  try {
    let query = supabase
      .from('campaigns')
      .select('*', { count: 'exact' })
      .eq('advertiser_id', userId);

    if (params.status !== 'all') {
      query = query.eq('status', params.status);
    }

    // sorting
    if (params.sort === 'recent') {
      query = query.order('created_at', { ascending: false });
    }

    // pagination
    query = query.range(from, to);

    const { data, count, error } = await query;
    if (error) {
      const msg = error.message || 'Failed to fetch campaigns.';
      const code = String((error as any).code || 'DB_ERROR');
      const status = code === '42501' || code.startsWith('PGRST') ? 403 : 500;
      return failure(status as 403 | 500, advertiserCampaignErrorCodes.dbTxFailed, msg, {
        message: error.message,
        details: error.details,
        code,
      });
    }

    const total = count ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    return success({ items: data ?? [], meta: { page, pageSize, total, totalPages } });
  } catch (e) {
    return failure(500, advertiserCampaignErrorCodes.dbTxFailed, 'Failed to fetch campaigns.', e);
  }
};

export const createCampaign = async (
  supabase: SupabaseClient,
  userId: string,
  rawPayload: unknown,
): Promise<HandlerResult<CreateOk, typeof advertiserCampaignErrorCodes[keyof typeof advertiserCampaignErrorCodes], unknown>> => {
  const parsed = CampaignCreateRequestSchema.safeParse(rawPayload);
  if (!parsed.success) {
    return failure(400, advertiserCampaignErrorCodes.invalidPayload, 'Invalid payload.', parsed.error.format());
  }
  const payload: CampaignCreateRequest = parsed.data;

  try {
    // Verify advertiser profile completion
    const prof = await supabase
      .from('advertiser_profiles')
      .select('profile_completed')
      .eq('id', userId)
      .single();
    if (prof.error && prof.error.code !== 'PGRST116') {
      return failure(500, advertiserCampaignErrorCodes.dbTxFailed, prof.error.message);
    }
    if (!prof.data?.profile_completed) {
      return failure(403, advertiserCampaignErrorCodes.profileIncomplete, 'Advertiser profile is not completed.');
    }

    const row = {
      advertiser_id: userId,
      title: payload.title.trim(),
      recruitment_start_date: payload.recruitment_start_date,
      recruitment_end_date: payload.recruitment_end_date,
      recruitment_count: payload.recruitment_count,
      benefits: payload.benefits.trim(),
      mission: payload.mission.trim(),
      store_info: payload.store_info.trim(),
      status: CampaignStatusEnum.enum.recruiting,
    } as const;

    const ins = await supabase
      .from('campaigns')
      .insert(row)
      .select('*')
      .single();

    if (ins.error) {
      return failure(500, advertiserCampaignErrorCodes.dbTxFailed, ins.error.message);
    }

    const valid = AdvertiserCampaignItemSchema.safeParse(ins.data);
    if (!valid.success) {
      return failure(500, advertiserCampaignErrorCodes.dbTxFailed, 'Created campaign failed to validate.', valid.error.format());
    }
    return success(valid.data);
  } catch (e) {
    return failure(500, advertiserCampaignErrorCodes.dbTxFailed, 'Failed to create campaign.', e);
  }
};
