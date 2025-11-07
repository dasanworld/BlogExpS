"use client";

import { ApplicationListSection } from "@/features/application/components/application-list";
import { CampaignListSection } from "@/features/campaign/components/campaign-list";
import { GlobalNavigation } from "@/features/layout/components/global-navigation";
import { ProfileStatusCard } from "@/features/influencer/dashboard/components/profile-status-card";
import { InfluencerSummaryCards } from "@/features/influencer/dashboard/components/summary-cards";
import { useInfluencerProfileQuery } from "@/features/influencer/dashboard/hooks/useInfluencerProfileQuery";
import { useMyApplicationStatsQuery } from "@/features/influencer/dashboard/hooks/useMyApplicationStatsQuery";

export function InfluencerDashboard() {
  const profileQuery = useInfluencerProfileQuery();
  const statsQuery = useMyApplicationStatsQuery();
  const links = [
    { label: "홈", href: "/" },
    { label: "인플루언서 프로필", href: "/influencer/profile" },
    { label: "내 지원", href: "#applications" },
    { label: "캠페인 둘러보기", href: "#campaigns-list" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-blue-50/40 to-white text-slate-900">
      <GlobalNavigation links={links} />
      <main className="mx-auto max-w-6xl px-6 pb-16">
        <section className="py-12 text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-blue-500/80">Influencer Dashboard</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl">
            지원 현황과 프로필을 한 곳에서 관리하세요
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600">
            최신 캠페인 지원 내역, 프로필 검증 상태, 선정 현황을 한 눈에 파악하고 필요한 액션을 빠르게 수행할 수 있습니다.
          </p>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <ProfileStatusCard
              data={profileQuery.data}
              isLoading={profileQuery.isLoading}
              isError={Boolean(profileQuery.isError)}
              onRetry={() => profileQuery.refetch()}
            />
          </div>
          <div className="lg:col-span-2">
            <InfluencerSummaryCards
              data={statsQuery.data}
              isLoading={statsQuery.isLoading}
              isError={Boolean(statsQuery.isError)}
              onRetry={() => statsQuery.refetch()}
            />
          </div>
        </section>

        <section id="applications" className="mt-12">
          <div className="mb-6 space-y-2">
            <h2 className="text-2xl font-semibold text-slate-900">내 지원 현황</h2>
            <p className="text-slate-500">상태 필터를 조정해 모집 결과를 빠르게 찾아보세요.</p>
          </div>
          <ApplicationListSection />
        </section>

        <section id="campaigns-list" className="mt-12">
          <div className="mb-6 space-y-2">
            <h2 className="text-2xl font-semibold text-slate-900">모집 중 캠페인</h2>
            <p className="text-slate-500">모든 체험단을 한 곳에서 탐색하고 바로 지원해 보세요.</p>
          </div>
          <CampaignListSection />
        </section>
      </main>
    </div>
  );
}
