import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { InfluencerProfileResponse } from "@/features/influencer/dashboard/hooks/useInfluencerProfileQuery";

type ProfileStatusCardProps = {
  data?: InfluencerProfileResponse;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
};

export function ProfileStatusCard({ data, isLoading, isError, onRetry }: ProfileStatusCardProps) {
  if (isLoading) {
    return (
      <Card className="border-slate-200 bg-white text-slate-900">
        <CardHeader>
          <CardTitle className="animate-pulse bg-slate-800/60 text-transparent">불러오는 중...</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-4 w-32 animate-pulse rounded bg-slate-800/60" />
          <div className="h-3 w-full animate-pulse rounded bg-slate-800/60" />
          <div className="h-10 w-32 animate-pulse rounded bg-slate-800/60" />
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="border-red-200 bg-red-50 text-red-700">
        <CardHeader>
          <CardTitle>프로필 상태</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>프로필 정보를 불러오지 못했습니다.</p>
          <Button variant="secondary" size="sm" onClick={onRetry}>
            다시 시도
          </Button>
        </CardContent>
      </Card>
    );
  }

  const profileCompleted = data?.profileCompleted ?? false;
  const totalChannels = data?.channels.length ?? 0;
  const verifiedChannels = data?.verifiedCount ?? 0;

  return (
    <Card className="border-slate-200 bg-white text-slate-900 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">프로필 상태</CardTitle>
            <p className="text-sm text-slate-400">체험단 지원 전 필수 단계</p>
          </div>
          <Badge variant="outline" className={profileCompleted ? "border-emerald-400 text-emerald-600" : "border-amber-400 text-amber-600"}>
            {profileCompleted ? "완료" : "준비중"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">검증된 채널</span>
            <span className="text-base font-semibold text-slate-900">{verifiedChannels}개</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>총 채널 {totalChannels}개</span>
            {!profileCompleted && <span>검증된 채널이 필요합니다.</span>}
          </div>
        </div>
        <Button asChild size="sm" className="w-full bg-blue-600 text-white hover:bg-blue-500">
          <Link href="/influencer/profile">인플루언서 프로필 관리</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
