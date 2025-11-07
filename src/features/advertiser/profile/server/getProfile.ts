import 'server-only';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';

export type AdvertiserProfileData = {
  id: string;
  companyName?: string;
  location?: string;
  category?: string;
  businessRegistrationNumber?: string;
  profileCompleted?: boolean;
  verificationStatus?: 'pending' | 'verified' | 'failed';
};

export const getAdvertiserProfileServer = async () => {
  const supabase = await createSupabaseServerClient();
  const { data: userRes } = await supabase.auth.getUser();
  const userId = userRes.user?.id;
  if (!userId) return { ok: false as const, reason: 'UNAUTHENTICATED' };

  const { data, error } = await supabase
    .from('advertiser_profiles')
    .select('company_name, location, category, business_registration_number, profile_completed, verification_status')
    .eq('id', userId)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    return { ok: false as const, reason: 'DB_ERROR', message: error.message };
  }

  if (!data) {
    return { ok: true as const, data: { id: userId } };
  }

  return {
    ok: true as const,
    data: {
      id: userId,
      companyName: data.company_name ?? undefined,
      location: data.location ?? undefined,
      category: data.category ?? undefined,
      businessRegistrationNumber: data.business_registration_number ?? undefined,
      profileCompleted: Boolean(data.profile_completed),
      verificationStatus: (data.verification_status ?? 'pending') as 'pending' | 'verified' | 'failed',
    } satisfies AdvertiserProfileData,
  };
};
