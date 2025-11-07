"use client";

import { useMemo, useState } from 'react';
import { useMyApplicationsQuery } from '@/features/application/hooks/useMyApplicationsQuery';
import { ApplicationCard } from '@/features/application/components/application-card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

export function ApplicationListSection() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [sort] = useState<'recent'>('recent');
  const [status, setStatus] = useState<'all' | 'applied' | 'selected' | 'rejected'>('all');

  const params = useMemo(() => ({ status, page, pageSize, sort }), [status, page, pageSize, sort]);
  const { data, isLoading, isError, refetch, isFetching } = useMyApplicationsQuery(params);

  const totalPages = data?.meta.totalPages ?? 1;

  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">내 지원 목록</h2>
        <div className="flex items-center gap-3">
          <Select value={status} onValueChange={(v) => setStatus(v as any)}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="상태 필터" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="applied">신청완료</SelectItem>
              <SelectItem value="selected">선정</SelectItem>
              <SelectItem value="rejected">반려</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            새로고침
          </Button>
        </div>
      </div>

      {isLoading && <p className="text-sm text-slate-500">목록을 불러오는 중...</p>}
      {isError && (
        <div className="space-y-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p>목록을 불러오지 못했습니다.</p>
          <Button variant="secondary" onClick={() => refetch()}>
            다시 시도
          </Button>
        </div>
      )}

      {!!data && data.items.length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-slate-500">
          아직 지원한 내역이 없습니다. 신규 체험단을 탐색해보세요.
        </div>
      )}

      {!!data && data.items.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.items.map((item) => (
            <ApplicationCard key={item.application.id} application={item.application} campaign={item.campaign} />
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-2 text-sm text-slate-500">
        <span>
          페이지 {page} / {totalPages}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1 || isFetching}
          >
            이전
          </Button>
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages || isFetching}
          >
            다음
          </Button>
        </div>
      </div>
    </section>
  );
}
