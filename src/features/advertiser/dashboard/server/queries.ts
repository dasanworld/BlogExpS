import 'server-only';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';

export type MyCampaignsParams = {
  status?: 'all' | 'recruiting' | 'closed' | 'selection_complete';
  page?: number;
  pageSize?: number;
  sort?: 'recent';
};

export const getAdvertiserProfileServer = async () => {
  const supabase = await createSupabaseServerClient();
  const { data: userRes } = await supabase.auth.getUser();
  const userId = userRes.user?.id;
  if (!userId) return { ok: false as const, reason: 'UNAUTHENTICATED' };

  const prof = await supabase
    .from('advertiser_profiles')
    .select('profile_completed, verification_status, company_name, category, business_registration_number, location')
    .eq('id', userId)
    .single();

  if (prof.error && prof.error.code !== 'PGRST116') {
    return { ok: false as const, reason: 'DB_ERROR', message: prof.error.message };
  }

  const row = prof.data ?? ({} as any);
  return {
    ok: true as const,
    data: {
      id: userId,
      profileCompleted: Boolean(row.profile_completed),
      verificationStatus: (row.verification_status ?? 'pending') as 'pending' | 'verified' | 'failed',
      companyName: row.company_name ?? undefined,
      category: row.category ?? undefined,
      businessRegistrationNumber: row.business_registration_number ?? undefined,
      location: row.location ?? undefined,
    },
  };
};

export const getMyCampaignsServer = async (raw: MyCampaignsParams) => {
  const params = {
    status: raw.status ?? 'all',
    page: raw.page ?? 1,
    pageSize: raw.pageSize ?? 10,
    sort: raw.sort ?? 'recent',
  } as const;

  const supabase = await createSupabaseServerClient();
  const { data: userRes } = await supabase.auth.getUser();
  const userId = userRes.user?.id;
  if (!userId) return { ok: false as const, reason: 'UNAUTHENTICATED' };

  const from = (params.page - 1) * params.pageSize;
  const to = from + params.pageSize - 1;

  let query = supabase
    .from('campaigns')
    .select('*', { count: 'exact' })
    .eq('advertiser_id', userId);

  if (params.status !== 'all') query = query.eq('status', params.status);
  query = query.order('created_at', { ascending: false }).range(from, to);

  const { data, count, error } = await query;
  if (error) {
    return { ok: false as const, reason: 'DB_ERROR', message: error.message };
  }

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / params.pageSize));
  return {
    ok: true as const,
    data: {
      items: data ?? [],
      meta: { page: params.page, pageSize: params.pageSize, total, totalPages },
    },
  };
};

export const getMyCampaignCountsServer = async () => {
  const supabase = await createSupabaseServerClient();
  const { data: userRes } = await supabase.auth.getUser();
  const userId = userRes.user?.id;
  if (!userId) return { ok: false as const, reason: 'UNAUTHENTICATED' };

  const countFor = async (status: 'recruiting' | 'closed' | 'selection_complete') => {
    const { count, error } = await supabase
      .from('campaigns')
      .select('*', { count: 'exact', head: true })
      .eq('advertiser_id', userId)
      .eq('status', status);
    if (error) return 0;
    return count ?? 0;
  };

  const [recruiting, closed, selection_complete] = await Promise.all([
    countFor('recruiting'),
    countFor('closed'),
    countFor('selection_complete'),
  ]);

  return { ok: true as const, data: { recruiting, closed, selection_complete } };
};
