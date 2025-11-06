"use client";

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type Props = {
  profileCompleted?: boolean;
  verificationStatus?: 'pending' | 'verified' | 'failed';
  companyName?: string;
  category?: string;
  businessRegistrationNumber?: string;
  location?: string;
};

export function AdvertiserProfileCard({ profileCompleted, verificationStatus, companyName, category, businessRegistrationNumber, location }: Props) {
  const statusBadge = () => {
    const text = verificationStatus === 'verified' ? '검증완료' : verificationStatus === 'failed' ? '검증실패' : '검증대기';
    return <Badge>{text}</Badge>;
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">광고주 프로필</h3>
          <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
            <span>상태: {profileCompleted ? '완료' : '미완료'} · 검증:</span>
            {statusBadge()}
          </div>
          <div className="mt-2 grid grid-cols-1 gap-1 text-sm text-slate-600 md:grid-cols-2">
            <div><span className="font-medium text-slate-700">업체명:</span> {companyName ?? '-'}</div>
            <div><span className="font-medium text-slate-700">카테고리:</span> {category ?? '-'}</div>
            <div><span className="font-medium text-slate-700">사업자등록번호:</span> {businessRegistrationNumber ?? '-'}</div>
            <div><span className="font-medium text-slate-700">위치:</span> {location ?? '-'}</div>
          </div>
        </div>
        <a href="/advertisers/profile">
          <Button size="sm" variant="secondary">프로필 관리</Button>
        </a>
      </div>
    </Card>
  );
}
