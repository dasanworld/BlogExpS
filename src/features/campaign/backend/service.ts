import type { SupabaseClient } from '@supabase/supabase-js';
import { success, type HandlerResult, failure } from '@/backend/http/response';
import {
  CampaignListQuerySchema,
  type CampaignListQuery,
  type CampaignListResponse,
  CampaignIdParamsSchema,
  ApplyEligibilitySchema,
  type CampaignDetailResponse,
} from './schema';
import { campaignErrorCodes, type CampaignServiceError } from './error';

export const listCampaigns = async (
  supabase: SupabaseClient,
  rawParams: unknown,
): Promise<HandlerResult<CampaignListResponse, CampaignServiceError['code'], unknown>> => {
  const parsed = CampaignListQuerySchema.safeParse(rawParams);

  if (!parsed.success) {
    return failure(
      400,
      campaignErrorCodes.invalidQueryParams,
      'Invalid query parameters for campaign listing.',
      parsed.error.format(),
    );
  }

  const params: CampaignListQuery = parsed.data;

  const page = params.page;
  const pageSize = params.pageSize;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  try {
    let query = supabase
      .from('campaigns')
      .select('*', { count: 'exact' })
      .eq('status', params.status);

    // Optional filters
    if (params.category) query = query.ilike('title', `%${params.category}%`);
    if (params.location) query = query.ilike('store_info', `%${params.location}%`);
    if (params.keyword) query = query.or(
      `title.ilike.%${params.keyword}%,store_info.ilike.%${params.keyword}%,mission.ilike.%${params.keyword}%`,
    );

    // Sorting
    if (params.sort === 'popular') {
      query = query.order('applicant_count', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    // Pagination
    query = query.range(from, to);

    const { data, count, error } = await query;

    if (error) {
      return failure(500, campaignErrorCodes.fetchError, 'Failed to fetch campaigns.', {
        message: error.message,
        details: error.details,
      });
    }

    const total = count ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const hasNextPage = page < totalPages;

    return success({
      items: data ?? [],
      meta: { page, pageSize, total, totalPages, hasNextPage },
    });
  } catch (e) {
    return failure(500, campaignErrorCodes.fetchError, 'Failed to fetch campaigns.', e);
  }
};

export const getCampaignById = async (
  supabase: SupabaseClient,
  rawId: unknown,
  authToken?: string,
): Promise<HandlerResult<CampaignDetailResponse, CampaignServiceError['code'], unknown>> => {
  const parsedId = CampaignIdParamsSchema.safeParse({ id: rawId });
  if (!parsedId.success) {
    return failure(
      400,
      campaignErrorCodes.invalidQueryParams,
      'Invalid campaign id.',
      parsedId.error.format(),
    );
  }

  try {
    const { data: campaign, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', parsedId.data.id)
      .single();

    if (error) {
      // differentiate 404-ish
      if (String(error.code) === 'PGRST116' || error.message.includes('No rows')) {
        return failure(404, campaignErrorCodes.fetchError, 'Campaign not found.');
      }
      return failure(500, campaignErrorCodes.fetchError, 'Failed to fetch campaign.', error);
    }

    type ApplyEligibility = ReturnType<typeof ApplyEligibilitySchema['parse']>;
    let applyEligibility: ApplyEligibility | undefined;

    if (authToken) {
      const { data: userInfo } = await supabase.auth.getUser(authToken);
      const userId = userInfo?.user?.id;
      if (!userId) {
        applyEligibility = { allowed: false, reason: 'UNAUTHENTICATED' };
      } else {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('id', userId)
          .single();

        if (profile?.role !== 'influencer') {
          applyEligibility = { allowed: false, reason: 'FORBIDDEN_ROLE' } as ApplyEligibility;
        } else {
          const { data: infl } = await supabase
            .from('influencer_profiles')
            .select('profile_completed')
            .eq('id', userId)
            .single();

          const today = new Date();
          const start = new Date(campaign.recruitment_start_date);
          const end = new Date(campaign.recruitment_end_date);
          const inPeriod = today >= start && today <= end;
          const recruiting = campaign.status === 'recruiting';

          if (!infl?.profile_completed) {
            applyEligibility = { allowed: false, reason: 'INFLUENCER_PROFILE_INCOMPLETE' } as ApplyEligibility;
          } else if (!(recruiting && inPeriod)) {
            applyEligibility = { allowed: false, reason: 'CAMPAIGN_NOT_RECRUITING' } as ApplyEligibility;
          } else {
            applyEligibility = { allowed: true } as ApplyEligibility;
          }
        }
      }
    }

    return success({ campaign, applyEligibility });
  } catch (e) {
    return failure(500, campaignErrorCodes.fetchError, 'Failed to fetch campaign.', e);
  }
};
