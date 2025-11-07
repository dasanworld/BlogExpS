"use client";

import { ReactNode, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CampaignDetailView } from '@/features/campaign/components/campaign-detail';
import { ApplyForm } from '@/features/application/components/apply-form';
import { useCampaignDetailQuery } from '@/features/campaign/hooks/useCampaignDetailQuery';
import { Button } from '@/components/ui/button';
import { GlobalNavigation } from '@/features/layout/components/global-navigation';

export default function CampaignDetailPage() {
  const params = useParams<{ id?: string }>();
  const router = useRouter();
  const id = useMemo(() => params?.id ?? undefined, [params]);
  const { data, isLoading, isError, refetch, error } = useCampaignDetailQuery(id);
  const navLinks = [
    { label: '홈', href: '/' },
    { label: '체험단 둘러보기', href: '/#campaigns' },
    { label: '대시보드', href: '/dashboard' },
    { label: '지원 섹션', href: '#apply' },
  ];

  const renderShell = (content: ReactNode) => (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-indigo-50 text-gray-900">
      <GlobalNavigation links={navLinks} />
      <main className="mx-auto w-full max-w-5xl px-6 py-10">
        {content}
      </main>
    </div>
  );

  if (isLoading) {
    return renderShell(<div className="text-slate-600">상세 정보를 불러오는 중...</div>);
  }

  if (isError) {
    const msg = error instanceof Error ? error.message : '상세 정보를 불러오지 못했습니다.';
    return renderShell(
      <div className="space-y-4 rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        <p>{msg}</p>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => refetch()}>
            다시 시도
          </Button>
          <Button variant="outline" onClick={() => router.push('/')}>홈으로</Button>
        </div>
      </div>,
    );
  }

  if (!data) {
    return null;
  }

  return renderShell(
    <div className="space-y-8">
      <CampaignDetailView data={data} />
      <section id="apply">
        <ApplyForm
          campaignId={data.campaign.id}
          disabled={Boolean(data.applyEligibility && !data.applyEligibility.allowed)}
        />
      </section>
    </div>,
  );
}
