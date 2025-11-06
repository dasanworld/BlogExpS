import type { SupabaseClient } from '@supabase/supabase-js';
import { success, failure, type HandlerResult } from '@/backend/http/response';
import type { ChannelInput, ProfileResponse, ProfileUpsertRequest } from './schema';
import { influencerErrorCodes } from './error';
import { getInfluencerPolicy } from '@/features/influencer/constants';
import { canonicalizeUrl, isValidPlatformUrl, makeChannelDedupKey } from '@/shared/validators/channel';

const calcAgeYears = (birthDate: string): number => {
  const [y, m, d] = birthDate.split('-').map((s) => parseInt(s, 10));
  const birth = new Date(Date.UTC(y, m - 1, d));
  const now = new Date();
  let age = now.getUTCFullYear() - birth.getUTCFullYear();
  const mo = now.getUTCMonth() - birth.getUTCMonth();
  if (mo < 0 || (mo === 0 && now.getUTCDate() < birth.getUTCDate())) age--;
  return age;
};

const validatePolicy = (payload: ProfileUpsertRequest) => {
  const policy = getInfluencerPolicy();
  if (policy.minAgeYears && calcAgeYears(payload.birthDate) < policy.minAgeYears) {
    return { ok: false as const, code: influencerErrorCodes.policyAgeViolation };
  }
  if (policy.maxChannels && payload.channels.filter((c) => c._op !== 'delete').length > policy.maxChannels) {
    return { ok: false as const, code: influencerErrorCodes.policyMaxChannels };
  }
  return { ok: true as const };
};

const normalizeChannels = (channels: ChannelInput[], allowed?: string[]) => {
  const kept = channels.filter((c) => c._op !== 'delete');
  const deletions = channels.filter((c) => c._op === 'delete' && c.id);
  const normalized = kept.map((c) => ({
    ...c,
    url: canonicalizeUrl(c.url),
  }));

  for (const c of normalized) {
    if (allowed && allowed.length > 0 && !allowed.includes(String(c.platform))) {
      return { ok: false as const, code: influencerErrorCodes.invalidPayload };
    }
    if (!isValidPlatformUrl(String(c.platform), c.url)) {
      return { ok: false as const, code: influencerErrorCodes.channelUrlInvalid };
    }
  }

  const seen = new Set<string>();
  for (const c of normalized) {
    const key = makeChannelDedupKey(String(c.platform), c.url);
    if (seen.has(key)) {
      return { ok: false as const, code: influencerErrorCodes.channelDuplicated };
    }
    seen.add(key);
  }

  return { ok: true as const, normalized, deletions };
};

export const getMe = async (
  supabase: SupabaseClient,
  userId: string,
): Promise<HandlerResult<ProfileResponse, typeof influencerErrorCodes[keyof typeof influencerErrorCodes], unknown>> => {
  const profileRes = await supabase
    .from('influencer_profiles')
    .select('id, birth_date, profile_completed')
    .eq('id', userId)
    .maybeSingle();

  const channelsRes = await supabase
    .from('influencer_channels')
    .select('id, platform, channel_name, channel_url, verification_status')
    .eq('influencer_id', userId);

  const channels = (channelsRes.data ?? []).map((c) => ({
    id: c.id as string,
    platform: String(c.platform),
    name: c.channel_name as string,
    url: c.channel_url as string,
    verificationStatus: String(c.verification_status) as 'pending' | 'verified' | 'failed',
  }));

  const profileCompleted = Boolean(profileRes.data?.profile_completed);
  return success({ profileCompleted, channels });
};

export const saveDraft = async (
  supabase: SupabaseClient,
  userId: string,
  payload: ProfileUpsertRequest,
): Promise<HandlerResult<ProfileResponse, typeof influencerErrorCodes[keyof typeof influencerErrorCodes], unknown>> => {
  const policy = getInfluencerPolicy();
  const policyCheck = validatePolicy(payload);
  if (!policyCheck.ok) {
    return failure(400, policyCheck.code, '정책 위반');
  }

  const norm = normalizeChannels(payload.channels, policy.allowedPlatforms);
  if (!norm.ok) {
    const code = norm.code;
    const status = code === influencerErrorCodes.channelDuplicated ? 409 : 400;
    return failure(status, code, '유효하지 않은 채널 입력');
  }

  // Upsert influencer profile
  const prof = await supabase
    .from('influencer_profiles')
    .upsert({ id: userId, birth_date: payload.birthDate }, { onConflict: 'id' })
    .select('id')
    .single();
  if (prof.error) {
    return failure(500, influencerErrorCodes.dbTxFailed, prof.error.message);
  }

  // Apply deletions
  if ('deletions' in norm && norm.deletions.length) {
    const ids = norm.deletions.map((d) => d.id as string);
    const delRes = await supabase.from('influencer_channels').delete().in('id', ids);
    if (delRes.error) {
      return failure(500, influencerErrorCodes.dbTxFailed, delRes.error.message);
    }
  }

  // Upsert channels
  if (norm.normalized.length) {
    // Load existing channels to preserve verification_status when platform/url unchanged
    const existingRes = await supabase
      .from('influencer_channels')
      .select('id, platform, channel_url, verification_status')
      .eq('influencer_id', userId);
    const existingById = new Map<string, { platform: string; url: string; status: string }>();
    for (const row of existingRes.data ?? []) {
      existingById.set(String(row.id), {
        platform: String(row.platform),
        url: String(row.channel_url),
        status: String(row.verification_status),
      });
    }

    const upsertRows = norm.normalized.map((c) => {
      const base: Record<string, unknown> = {
        influencer_id: userId,
        platform: c.platform,
        channel_name: c.name,
        channel_url: c.url,
      };
      if (c.id) {
        base.id = c.id;
        const exist = existingById.get(c.id);
        const unchanged = exist && exist.platform === String(c.platform) && exist.url === c.url;
        if (unchanged) {
          // preserve current status
          base.verification_status = exist!.status;
        } else {
          base.verification_status = 'pending';
        }
      } else {
        // new channel
        base.verification_status = 'pending';
      }
      return base;
    });

    const upRes = await supabase
      .from('influencer_channels')
      .upsert(upsertRows, { onConflict: 'id' })
      .select('id');
    if (upRes.error) {
      return failure(500, influencerErrorCodes.dbTxFailed, upRes.error.message);
    }
  }

  return getMe(supabase, userId);
};

export const submitProfile = async (
  supabase: SupabaseClient,
  userId: string,
): Promise<HandlerResult<ProfileResponse, typeof influencerErrorCodes[keyof typeof influencerErrorCodes], unknown>> => {
  const { data, error } = await supabase
    .from('influencer_channels')
    .select('id')
    .eq('influencer_id', userId)
    .eq('verification_status', 'verified')
    .limit(1);

  if (error) {
    return failure(500, influencerErrorCodes.dbTxFailed, error.message);
  }

  if (!data || data.length === 0) {
    return failure(400, influencerErrorCodes.submitVerifiedRequired, '검증된 채널이 필요합니다.');
  }

  const upd = await supabase
    .from('influencer_profiles')
    .update({ profile_completed: true })
    .eq('id', userId)
    .select('id')
    .single();
  if (upd.error) {
    return failure(500, influencerErrorCodes.dbTxFailed, upd.error.message);
  }

  // Count verified channels for message purposes
  const countRes = await supabase
    .from('influencer_channels')
    .select('id', { count: 'exact', head: true })
    .eq('influencer_id', userId)
    .eq('verification_status', 'verified');
  const verifiedCount = typeof countRes.count === 'number' ? countRes.count : undefined;

  const snapshot = await getMe(supabase, userId);
  if (!snapshot.ok) return snapshot;
  return success({ ...snapshot.data, ...(verifiedCount !== undefined ? { verifiedCount } : {}) });
};
