"use client";

import { useEffect, useState } from 'react';
import { apiClient, extractApiErrorMessage, isAxiosError } from '@/lib/remote/api-client';
import { ADVERTISER_API_ROUTES } from '@/features/advertiser/routes';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import { OverviewCards } from './overview-cards';
import { CampaignsTable } from './campaigns-table';
import { CreateCampaignDialog } from './create-campaign-dialog';
import { Button } from '@/components/ui/button';
import { AdvertiserProfileCard } from './advertiser-profile-card';
import { useRouter } from 'next/navigation';

export function AdvertiserDashboard() {
  const router = useRouter();
  const [guard, setGuard] = useState<{
    ok: boolean;
    message?: string;
    profileCompleted?: boolean;
    needLogin?: boolean;
    verificationStatus?: 'pending' | 'verified' | 'failed';
    companyName?: string;
    category?: string;
    businessRegistrationNumber?: string;
    location?: string;
    profileId?: string;
  }>({ ok: false });

  useEffect(() => {
    const run = async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const session = await supabase.auth.getSession();
        const access = session.data.session?.access_token;
        const headers: Record<string, string> = {};
        if (access) headers['Authorization'] = `Bearer ${access}`;
        const { data } = await apiClient.get(ADVERTISER_API_ROUTES.me, { headers, withCredentials: true });
        const profileCompleted = Boolean((data as any)?.profileCompleted);
        const verificationStatus = (data as any)?.verificationStatus as 'pending' | 'verified' | 'failed' | undefined;
        const companyName = (data as any)?.companyName as string | undefined;
        const category = (data as any)?.category as string | undefined;
        const businessRegistrationNumber = (data as any)?.businessRegistrationNumber as string | undefined;
        const location = (data as any)?.location as string | undefined;
        const profileId = (data as any)?.id as string | undefined;
        // Allow dashboard access for advertisers even if profile is incomplete (list/view allowed)
        setGuard({ ok: true, profileCompleted, verificationStatus, companyName, category, businessRegistrationNumber, location, profileId });
      } catch (e) {
        if (isAxiosError(e) && e.response?.status === 401) {
          setGuard({ ok: false, needLogin: true, message: '로그인이 필요합니다.' });
        } else {
          setGuard({ ok: false, message: extractApiErrorMessage(e) });
        }
      }
    };
    void run();
  }, []);

  if (!guard.ok) {
    return (
      <section className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-900">
        <h3 className="text-lg font-medium">광고주 전용 대시보드</h3>
        {guard.needLogin ? (
          <>
            <p className="mt-2 text-sm">로그인이 필요합니다.</p>
            <div className="mt-3">
              <a href="/login">
                <Button size="sm" variant="secondary">로그인하기</Button>
              </a>
            </div>
          </>
        ) : (
          <>
            <p className="mt-2 text-sm">접근 권한이 없거나 광고주 프로필이 완료되지 않았습니다.</p>
            <div className="mt-3">
              <a href="/advertisers/profile">
                <Button size="sm" variant="secondary">광고주 프로필로 이동</Button>
              </a>
            </div>
          </>
        )}
      </section>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => router.back()}>
            뒤로가기
          </Button>
          <a href="/dashboard">
            <Button variant="secondary" size="sm">대시보드로 가기</Button>
          </a>
        </div>
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-semibold">광고주 대시보드</h2>
        </div>
        <CreateCampaignDialog disabled={!guard.profileCompleted} />
      </div>
      <AdvertiserProfileCard
        profileCompleted={guard.profileCompleted}
        verificationStatus={guard.verificationStatus}
        companyName={guard.companyName}
        category={guard.category}
        businessRegistrationNumber={guard.businessRegistrationNumber}
        location={guard.location}
      />
      {!guard.profileCompleted && (
        <div className="rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          신규 체험단 등록은 광고주 프로필 완료 후 이용 가능합니다.
          <a href="/advertisers/profile" className="ml-2 underline">프로필 바로가기</a>
        </div>
      )}
      <OverviewCards />
      <section>
        <h3 className="mb-2 text-lg font-medium">내가 등록한 체험단</h3>
        <CampaignsTable />
      </section>
    </div>
  );
}
