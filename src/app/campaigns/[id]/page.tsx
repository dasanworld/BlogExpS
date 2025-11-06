"use client";

import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CampaignDetailView } from '@/features/campaign/components/campaign-detail';
import { ApplyForm } from '@/features/application/components/apply-form';
import { useCampaignDetailQuery } from '@/features/campaign/hooks/useCampaignDetailQuery';
import { Button } from '@/components/ui/button';

export default function CampaignDetailPage() {
  const params = useParams<{ id?: string }>();
  const router = useRouter();
  const id = useMemo(() => params?.id ?? undefined, [params]);
  const { data, isLoading, isError, refetch, error } = useCampaignDetailQuery(id);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-indigo-50 p-6 text-gray-900">
        <div className="mx-auto w-full max-w-3xl">상세 정보를 불러오는 중...</div>
      </main>
    );
  }

  if (isError) {
    const msg = error instanceof Error ? error.message : '상세 정보를 불러오지 못했습니다.';
    return (
      <main className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-indigo-50 p-6 text-gray-900">
        <div className="mx-auto w-full max-w-3xl space-y-3">
          <p className="text-red-600">{msg}</p>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => refetch()}>
              다시 시도
            </Button>
            <Button variant="outline" onClick={() => router.push('/')}>홈으로</Button>
          </div>
        </div>
      </main>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-indigo-50 p-6 text-gray-900">
      <div className="mx-auto w-full max-w-3xl">
        <CampaignDetailView data={data} />
        <div className="mt-6">
          <ApplyForm
            campaignId={data.campaign.id}
            disabled={Boolean(data.applyEligibility && !data.applyEligibility.allowed)}
          />
        </div>
      </div>
    </main>
  );
}
