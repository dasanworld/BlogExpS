import type { SupabaseClient } from '@supabase/supabase-js';
import { success, failure, type HandlerResult } from '@/backend/http/response';
import {
  CampaignDetailForOwnerSchema,
  type CampaignDetailForOwner,
  ApplicantsListItemSchema,
  SelectionRequestSchema,
} from './campaign.manage.schema';
import { advertiserCampaignManageErrorCodes } from './campaign.manage.error';
import { CampaignIdParamsSchema } from '@/features/campaign/backend/schema';

export const getMyCampaignDetail = async (
  supabase: SupabaseClient,
  userId: string,
  rawId: unknown,
): Promise<
  HandlerResult<
    CampaignDetailForOwner,
    typeof advertiserCampaignManageErrorCodes[keyof typeof advertiserCampaignManageErrorCodes],
    unknown
  >
> => {
  const parsedId = CampaignIdParamsSchema.safeParse({ id: rawId });
  if (!parsedId.success) {
    return failure(
      400,
      advertiserCampaignManageErrorCodes.invalidQueryParams,
      'Invalid campaign id.',
      parsedId.error.format(),
    );
  }
  const id = parsedId.data.id;

  try {
    const camp = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .eq('advertiser_id', userId)
      .single();
    if (camp.error) {
      // Treat as not found or forbidden ownership
      return failure(404, advertiserCampaignManageErrorCodes.notFound, camp.error.message);
    }

    const apps = await supabase
      .from('applications')
      .select('id,influencer_id,status,motivation,created_at')
      .eq('campaign_id', id)
      .order('created_at', { ascending: false });
    if (apps.error) {
      return failure(500, advertiserCampaignManageErrorCodes.dbTxFailed, apps.error.message);
    }

    const detail = { campaign: camp.data, applicants: apps.data ?? [] };
    const validated = CampaignDetailForOwnerSchema.safeParse(detail);
    if (!validated.success) {
      return failure(
        500,
        advertiserCampaignManageErrorCodes.validationMismatch,
        'Failed to validate detail schema',
        validated.error.format(),
      );
    }
    return success(validated.data);
  } catch (e) {
    return failure(500, advertiserCampaignManageErrorCodes.dbTxFailed, 'Failed to fetch campaign detail.', e);
  }
};

export const closeRecruitment = async (
  supabase: SupabaseClient,
  userId: string,
  rawId: unknown,
) => {
  const parsedId = CampaignIdParamsSchema.safeParse({ id: rawId });
  if (!parsedId.success) {
    return failure(
      400,
      advertiserCampaignManageErrorCodes.invalidQueryParams,
      'Invalid campaign id.',
      parsedId.error.format(),
    );
  }
  const id = parsedId.data.id;

  try {
    const cur = await supabase
      .from('campaigns')
      .select('id,status')
      .eq('id', id)
      .eq('advertiser_id', userId)
      .single();
    if (cur.error) {
      return failure(404, advertiserCampaignManageErrorCodes.notFound, cur.error.message);
    }

    if (cur.data.status === 'closed') {
      return success({ status: 'closed' as const });
    }
    if (cur.data.status !== 'recruiting') {
      return failure(
        409,
        advertiserCampaignManageErrorCodes.invalidStateTransition,
        'Campaign is not in recruiting state.',
      );
    }

    const upd = await supabase
      .from('campaigns')
      .update({ status: 'closed' })
      .eq('id', id)
      .eq('advertiser_id', userId)
      .select('status')
      .single();
    if (upd.error) {
      return failure(500, advertiserCampaignManageErrorCodes.dbTxFailed, upd.error.message);
    }
    return success({ status: upd.data.status });
  } catch (e) {
    return failure(500, advertiserCampaignManageErrorCodes.dbTxFailed, 'Failed to close campaign.', e);
  }
};

export const selectApplicants = async (
  supabase: SupabaseClient,
  userId: string,
  rawId: unknown,
  rawPayload: unknown,
) => {
  const parsedId = CampaignIdParamsSchema.safeParse({ id: rawId });
  if (!parsedId.success) {
    return failure(
      400,
      advertiserCampaignManageErrorCodes.invalidQueryParams,
      'Invalid campaign id.',
      parsedId.error.format(),
    );
  }
  const id = parsedId.data.id;

  const parsedPayload = SelectionRequestSchema.safeParse(rawPayload);
  if (!parsedPayload.success) {
    return failure(
      400,
      advertiserCampaignManageErrorCodes.invalidPayload,
      'Invalid selection payload.',
      parsedPayload.error.format(),
    );
  }
  const selectedIds = parsedPayload.data.selectedIds;

  try {
    const cur = await supabase
      .from('campaigns')
      .select('id,status,recruitment_count')
      .eq('id', id)
      .eq('advertiser_id', userId)
      .single();
    if (cur.error) {
      return failure(404, advertiserCampaignManageErrorCodes.notFound, cur.error.message);
    }
    if (cur.data.status !== 'closed') {
      return failure(
        409,
        advertiserCampaignManageErrorCodes.invalidStateTransition,
        'Campaign is not in closed state.',
      );
    }

    if (selectedIds.length > cur.data.recruitment_count) {
      return failure(
        422,
        advertiserCampaignManageErrorCodes.validationMismatch,
        'Selected count exceeds recruitment_count.',
      );
    }

    // Verify that all selectedIds belong to this campaign
    if (selectedIds.length > 0) {
      const sel = await supabase
        .from('applications')
        .select('id')
        .eq('campaign_id', id)
        .in('id', selectedIds);
      if (sel.error) {
        return failure(500, advertiserCampaignManageErrorCodes.dbTxFailed, sel.error.message);
      }
      const found = new Set((sel.data ?? []).map((r: any) => r.id));
      for (const s of selectedIds) {
        if (!found.has(s)) {
          return failure(
            422,
            advertiserCampaignManageErrorCodes.validationMismatch,
            'Selected id not found in this campaign.',
          );
        }
      }
    }

    // Emulate atomic updates: selected, rejected, then campaign status
    if (selectedIds.length > 0) {
      const upSel = await supabase
        .from('applications')
        .update({ status: 'selected' })
        .in('id', selectedIds)
        .eq('campaign_id', id);
      if (upSel.error) {
        return failure(500, advertiserCampaignManageErrorCodes.dbTxFailed, upSel.error.message);
      }
    }

    {
      let rejQuery = supabase
        .from('applications')
        .update({ status: 'rejected' })
        .eq('campaign_id', id);
      if (selectedIds.length > 0) {
        const inList = `(${selectedIds.map((x) => `'${x}'`).join(',')})`;
        rejQuery = rejQuery.not('id', 'in', inList);
      }
      const upRej = await rejQuery;
      if (upRej.error) {
        return failure(500, advertiserCampaignManageErrorCodes.dbTxFailed, upRej.error.message);
      }
    }

    const upCamp = await supabase
      .from('campaigns')
      .update({ status: 'selection_complete' })
      .eq('id', id)
      .eq('advertiser_id', userId)
      .select('status')
      .single();
    if (upCamp.error) {
      return failure(500, advertiserCampaignManageErrorCodes.dbTxFailed, upCamp.error.message);
    }

    return success({ status: upCamp.data.status });
  } catch (e) {
    return failure(500, advertiserCampaignManageErrorCodes.dbTxFailed, 'Failed to select applicants.', e);
  }
};
