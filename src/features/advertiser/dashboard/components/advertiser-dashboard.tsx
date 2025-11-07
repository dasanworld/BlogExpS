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
import { GlobalNavigation } from '@/features/layout/components/global-navigation';

type InitialProfile = {
  id?: string;
  profileCompleted?: boolean;
  verificationStatus?: 'pending' | 'verified' | 'failed';
  companyName?: string;
  category?: string;
  businessRegistrationNumber?: string;
  location?: string;
};

type InitialList = {
  items: Array<any>;
  meta: { page: number; pageSize: number; total: number; totalPages: number };
};

export function AdvertiserDashboard({ initialProfile, initialList, initialCounts }: { initialProfile?: InitialProfile; initialList?: InitialList; initialCounts?: { recruiting: number; closed: number; selection_complete: number } }) {
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
        if (initialProfile) {
          setGuard({ ok: true,
            profileCompleted: initialProfile.profileCompleted,
            verificationStatus: initialProfile.verificationStatus,
            companyName: initialProfile.companyName,
            category: initialProfile.category,
            businessRegistrationNumber: initialProfile.businessRegistrationNumber,
            location: initialProfile.location,
            profileId: initialProfile.id,
          });
          return;
        }
        const supabase = getSupabaseBrowserClient();
        const session = await supabase.auth.getSession();
        const access = session.data.session?.access_token;
        const headers: Record<string, string> = {};
        if (access) headers['Authorization'] = `Bearer ${access}`;
        const { data } = await apiClient.get(ADVERTISER_API_ROUTES.me, { headers, withCredentials: true });
        setGuard({ ok: true,
          profileCompleted: Boolean((data as any)?.profileCompleted),
          verificationStatus: (data as any)?.verificationStatus,
          companyName: (data as any)?.companyName,
          category: (data as any)?.category,
          businessRegistrationNumber: (data as any)?.businessRegistrationNumber,
          location: (data as any)?.location,
          profileId: (data as any)?.id,
        });
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
      <div className="min-h-screen bg-gradient-to-b from-white via-blue-50/40 to-white text-slate-900">
        <GlobalNavigation
          links={[
            { label: '홈', href: '/' },
            { label: '광고주 프로필', href: '/advertisers/profile' },
          ]}
        />
        <main className="mx-auto max-w-3xl px-6 pb-12 pt-8">
          <section className="rounded-lg border border-amber-300 bg-amber-50 p-5 text-amber-900">
            <h3 className="text-lg font-medium">광고주 전용 대시보드</h3>
            {guard.needLogin ? (
              <>
                <p className="mt-2 text-sm">로그인이 필요합니다.</p>
                <div className="mt-3">
                  <a href="/login">
                    <Button size="sm" variant="secondary">
                      로그인하기
                    </Button>
                  </a>
                </div>
              </>
            ) : (
              <>
                <p className="mt-2 text-sm">접근 권한이 없거나 광고주 프로필이 완료되지 않았습니다.</p>
                <div className="mt-3">
                  <a href="/advertisers/profile">
                    <Button size="sm" variant="secondary">
                      광고주 프로필로 이동
                    </Button>
                  </a>
                </div>
              </>
            )}
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-blue-50/40 to-white text-slate-900">
      <GlobalNavigation
        links={[
          { label: '홈', href: '/' },
          { label: '광고주 프로필', href: '/advertisers/profile' },
          { label: '내 체험단', href: '#my-campaigns' },
        ]}
      />
      <main className="mx-auto flex max-w-6xl flex-col gap-6 px-6 pb-12 pt-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-blue-500/80">Advertiser Console</p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900">광고주 대시보드</h2>
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
        <OverviewCards initialCounts={initialCounts} />
        <section id="my-campaigns">
          <h3 className="mb-2 text-lg font-medium">내가 등록한 체험단</h3>
          <CampaignsTable initial={initialList} autoFetch={!initialList} />
        </section>
      </main>
    </div>
  );
}
