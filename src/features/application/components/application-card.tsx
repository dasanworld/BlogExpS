"use client";

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Application, CampaignSummary } from '@/features/application/backend/schema';

export function ApplicationCard({
  application,
  campaign,
}: {
  application: Application;
  campaign: CampaignSummary;
}) {
  const start = new Date(campaign.recruitment_start_date);
  const end = new Date(campaign.recruitment_end_date);
  const period = `${start.toLocaleDateString()} ~ ${end.toLocaleDateString()}`;
  const appliedAt = new Date(application.created_at).toLocaleString();

  return (
    <Card className="flex flex-col gap-2 border-slate-700 bg-slate-900/60 p-4 text-slate-100">
      <div className="flex items-start justify-between gap-3">
        <h3 className="line-clamp-1 text-base font-semibold">{campaign.title}</h3>
        <Badge variant="secondary" className="shrink-0">
          {application.status}
        </Badge>
      </div>
      <p className="text-sm text-slate-300">모집기간: {period}</p>
      <p className="text-sm text-slate-300">방문 예정일: {new Date(application.visit_date).toLocaleDateString()}</p>
      <p className="text-xs text-slate-400">신청일: {appliedAt}</p>
      <div className="mt-2">
        <Link
          href={`/campaigns/${campaign.id}`}
          className="text-sm text-indigo-300 underline underline-offset-4 hover:text-indigo-200"
        >
          상세 보기
        </Link>
      </div>
    </Card>
  );
}

