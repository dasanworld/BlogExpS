"use client";

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { CampaignDetailResponse } from '@/features/campaign/backend/schema';

export function CampaignDetailView({
  data,
}: {
  data: CampaignDetailResponse;
}) {
  const { campaign, applyEligibility } = data;
  const start = new Date(campaign.recruitment_start_date);
  const end = new Date(campaign.recruitment_end_date);
  const period = `${start.toLocaleDateString()} ~ ${end.toLocaleDateString()}`;

  const allowed = applyEligibility?.allowed ?? false;
  const reason = applyEligibility?.reason;

  const statusLabel = (s: typeof campaign.status) =>
    s === 'recruiting' ? '모집중' : s === 'closed' ? '모집종료' : '선정완료';

  return (
    <Card className="space-y-4 border-blue-200 bg-white p-6 text-gray-900">
      <div className="flex items-start justify-between gap-3">
        <h1 className="text-2xl font-semibold text-gray-900">{campaign.title}</h1>
        <Badge variant="secondary" className="bg-blue-100 text-blue-800">{statusLabel(campaign.status)}</Badge>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Info label="모집기간" value={period} />
        <Info label="모집인원" value={`${campaign.recruitment_count}명`} />
        <Info label="매장" value={campaign.store_info} />
        <Info label="혜택" value={campaign.benefits} />
      </div>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-900">미션</h2>
        <p className="whitespace-pre-wrap text-gray-800">{campaign.mission}</p>
      </section>

      <div className="flex items-center gap-3 pt-2">
        <Button disabled={!allowed} variant={allowed ? 'default' : 'outline'}>
          지원하기
        </Button>
        {!allowed && (
          <p className="text-sm text-gray-600">
            {reason === 'UNAUTHENTICATED' && '로그인이 필요합니다.'}
            {reason === 'FORBIDDEN_ROLE' && '인플루언서만 지원할 수 있습니다.'}
            {reason === 'INFLUENCER_PROFILE_INCOMPLETE' && '인플루언서 프로필을 완료해주세요.'}
            {reason === 'CAMPAIGN_NOT_RECRUITING' && '현재 모집 중이 아닙니다.'}
            {!reason && '지원 조건을 확인할 수 없습니다.'}
          </p>
        )}
      </div>
    </Card>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-blue-200 bg-white p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm text-gray-900">{value}</p>
    </div>
  );
}
