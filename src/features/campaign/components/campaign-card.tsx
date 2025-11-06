"use client";

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { CampaignItem } from '@/features/campaign/backend/schema';

export function CampaignCard({ item }: { item: CampaignItem }) {
  const start = new Date(item.recruitment_start_date);
  const end = new Date(item.recruitment_end_date);
  const period = `${start.toLocaleDateString()} ~ ${end.toLocaleDateString()}`;

  const statusLabel = (s: CampaignItem['status']) =>
    s === 'recruiting' ? '모집중' : s === 'closed' ? '모집종료' : '선정완료';

  return (
    <Card className="flex flex-col gap-2 border-blue-200 bg-white p-4 text-gray-900 hover:shadow-lg transition">
      <div className="flex items-start justify-between gap-3">
        <h3 className="line-clamp-1 text-base font-semibold text-gray-900">{item.title}</h3>
        <Badge variant="secondary" className="shrink-0 bg-blue-100 text-blue-800">
          {statusLabel(item.status)}
        </Badge>
      </div>
      <p className="text-sm text-gray-600">모집기간: {period}</p>
      <p className="line-clamp-2 text-sm text-gray-700">혜택: {item.benefits}</p>
      <p className="line-clamp-2 text-sm text-gray-600">매장: {item.store_info}</p>
      <div className="mt-2">
        <Link
          href={`/campaigns/${item.id}`}
          className="text-sm text-blue-600 underline underline-offset-4 hover:text-blue-800"
        >
          상세 보기
        </Link>
      </div>
    </Card>
  );
}
