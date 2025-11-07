import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ApplicationStatusBreakdown } from "@/features/influencer/dashboard/lib/progress";
import { Button } from "@/components/ui/button";

type InfluencerSummaryCardsProps = {
  data?: ApplicationStatusBreakdown;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
};

const SummarySkeleton = () => (
  <Card className="border-slate-200 bg-white text-slate-900">
    <CardHeader>
      <div className="h-5 w-24 animate-pulse rounded bg-slate-100" />
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="h-8 w-16 animate-pulse rounded bg-slate-100" />
      <div className="h-3 w-full animate-pulse rounded bg-slate-100" />
    </CardContent>
  </Card>
);

export function InfluencerSummaryCards({ data, isLoading, isError, onRetry }: InfluencerSummaryCardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        <SummarySkeleton />
        <SummarySkeleton />
        <SummarySkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="border-red-200 bg-red-50 text-red-700">
        <CardHeader>
          <CardTitle>지원 현황</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>지원 현황을 불러오지 못했습니다.</p>
          <Button size="sm" variant="secondary" onClick={onRetry}>
            다시 시도
          </Button>
        </CardContent>
      </Card>
    );
  }

  const total = data?.totalAll ?? 0;
  const selected = data?.selected ?? 0;
  const pending = data?.applied ?? 0;
  const rejected = data?.rejected ?? 0;
  const completion = Math.min(100, Math.round((data?.completionRate ?? 0) * 100));

  if (data && total === 0 && selected === 0 && pending === 0 && rejected === 0) {
    return (
      <Card className="border-dashed border-slate-200 bg-slate-50 text-slate-600">
        <CardHeader>
          <CardTitle>지원 현황</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>아직 지원한 체험단이 없습니다.</p>
          <p>캠페인을 탐색하고 첫 체험단에 도전해 보세요!</p>
        </CardContent>
      </Card>
    );
  }

  const cards = [
    { label: "총 지원", value: total, sub: "누적 지원 수" },
    { label: "선정됨", value: selected, sub: "최종 선정" },
    { label: "대기중", value: pending, sub: "심사 진행 중" },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {cards.map((card) => (
        <Card key={card.label} className="border-slate-200 bg-white text-slate-900 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm text-slate-500">{card.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-slate-900">{card.value}</p>
            <p className="text-xs text-slate-500">{card.sub}</p>
          </CardContent>
        </Card>
      ))}
      <Card className="border-slate-200 bg-white text-slate-900 shadow-sm md:col-span-3">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-sm text-slate-500">
            지원 여정 완료율
            <span className="text-xs text-slate-400">
              선정 {selected} • 반려 {rejected}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-2 rounded-full bg-slate-100">
            <div
              className="h-2 rounded-full bg-blue-500"
              style={{ width: `${completion}%` }}
              aria-label={`선정 완료율 ${completion}%`}
            />
          </div>
          <p className="mt-2 text-xs text-slate-500">총 지원 대비 선정된 비율</p>
        </CardContent>
      </Card>
    </div>
  );
}
