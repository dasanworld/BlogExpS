import type { SupabaseClient } from '@supabase/supabase-js';
import { success, failure, type HandlerResult } from '@/backend/http/response';
import type { ProfileResponse, ProfileUpsertRequest } from './schema';
import { advertiserErrorCodes } from './error';
import { isValidBusinessNumber, normalizeBusinessNumber } from '@/shared/validators/business';

const toDbRow = (userId: string, payload: ProfileUpsertRequest) => {
  return {
    id: userId,
    company_name: payload.companyName.trim(),
    location: payload.location.trim(),
    category: payload.category.trim(),
    business_registration_number: normalizeBusinessNumber(payload.businessRegistrationNumber),
  } as const;
};

export const getMe = async (
  supabase: SupabaseClient,
  userId: string,
): Promise<HandlerResult<ProfileResponse, typeof advertiserErrorCodes[keyof typeof advertiserErrorCodes], unknown>> => {
  const prof = await supabase
    .from('advertiser_profiles')
    .select('profile_completed, verification_status, company_name, category, business_registration_number, location')
    .eq('id', userId)
    .single();

  if (prof.error && prof.error.code !== 'PGRST116') {
    return failure(500, advertiserErrorCodes.dbTxFailed, prof.error.message);
  }

  const profileCompleted = Boolean(prof.data?.profile_completed);
  const verification = String(prof.data?.verification_status ?? 'pending') as
    | 'pending'
    | 'verified'
    | 'failed';

  return success({
    id: userId,
    profileCompleted,
    verificationStatus: verification,
    companyName: prof.data?.company_name ?? undefined,
    category: prof.data?.category ?? undefined,
    businessRegistrationNumber: prof.data?.business_registration_number ?? undefined,
    location: prof.data?.location ?? undefined,
  });
};

export const saveDraft = async (
  supabase: SupabaseClient,
  userId: string,
  payload: ProfileUpsertRequest,
): Promise<HandlerResult<ProfileResponse, typeof advertiserErrorCodes[keyof typeof advertiserErrorCodes], unknown>> => {
  if (!isValidBusinessNumber(payload.businessRegistrationNumber)) {
    return failure(400, advertiserErrorCodes.invalidPayload, '유효하지 않은 사업자등록번호입니다.');
  }

  const row = toDbRow(userId, payload);

  // Conflict check by business_registration_number assigned to other users
  const dup = await supabase
    .from('advertiser_profiles')
    .select('id')
    .eq('business_registration_number', row.business_registration_number)
    .neq('id', userId)
    .maybeSingle();
  if (dup.error && dup.error.code !== 'PGRST116') {
    return failure(500, advertiserErrorCodes.dbTxFailed, dup.error.message);
  }
  if (dup.data) {
    return failure(409, advertiserErrorCodes.duplicateBusinessNumber, '중복된 사업자등록번호입니다.');
  }

  const up = await supabase
    .from('advertiser_profiles')
    .upsert(row, { onConflict: 'id' })
    .select('id')
    .single();
  if (up.error) {
    return failure(500, advertiserErrorCodes.dbTxFailed, up.error.message);
  }

  // Placeholder for async external validation job enqueue
  // In minimal scope, we keep verification_status as current value or default pending

  return getMe(supabase, userId);
};

export const submitProfile = async (
  supabase: SupabaseClient,
  userId: string,
): Promise<HandlerResult<ProfileResponse, typeof advertiserErrorCodes[keyof typeof advertiserErrorCodes], unknown>> => {
  // Ensure required fields exist prior to completion
  const cur = await supabase
    .from('advertiser_profiles')
    .select('company_name, location, category, business_registration_number')
    .eq('id', userId)
    .single();
  if (cur.error) {
    return failure(500, advertiserErrorCodes.dbTxFailed, cur.error.message);
  }
  const hasAll = Boolean(
    cur.data?.company_name &&
      cur.data?.location &&
      cur.data?.category &&
      cur.data?.business_registration_number,
  );
  if (!hasAll) {
    return failure(400, advertiserErrorCodes.invalidPayload, '필수 값이 누락되었습니다.');
  }

  const upd = await supabase
    .from('advertiser_profiles')
    .update({ profile_completed: true })
    .eq('id', userId)
    .select('id')
    .single();
  if (upd.error) {
    return failure(500, advertiserErrorCodes.dbTxFailed, upd.error.message);
  }

  return getMe(supabase, userId);
};
