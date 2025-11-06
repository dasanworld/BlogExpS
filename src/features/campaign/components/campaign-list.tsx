"use client";

import { useMemo, useState, useCallback } from 'react';
import { useCampaignsQuery } from '@/features/campaign/hooks/useCampaignsQuery';
import { CampaignCard } from '@/features/campaign/components/campaign-card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

export function CampaignListSection() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [sort, setSort] = useState<'recent' | 'popular'>('recent');

  const params = useMemo(
    () => ({ status: 'recruiting' as const, page, pageSize, sort }),
    [page, pageSize, sort],
  );

  const { data, isLoading, isError, refetch, isFetching } = useCampaignsQuery(params);

  const totalPages = data?.meta.totalPages ?? 1;

  const handleSortChange = useCallback((newSort: string) => {
    setSort(newSort as 'recent' | 'popular');
    setPage(1); // 정렬 변경 시 첫 페이지로 초기화
  }, []);

  return (
    <section className="space-y-4 rounded-xl border border-blue-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">모집 중 체험단</h2>
        <div className="flex items-center gap-3">
          <Select value={sort} onValueChange={handleSortChange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="정렬" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">최신순</SelectItem>
              <SelectItem value="popular">인기순</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            새로고침
          </Button>
        </div>
      </div>

      {isLoading && <p className="text-sm text-gray-600">목록을 불러오는 중...</p>}
      {isError && (
        <div className="space-y-2">
          <p className="text-sm text-red-600">목록을 불러오지 못했습니다.</p>
          <Button variant="secondary" onClick={() => refetch()}>
            다시 시도
          </Button>
        </div>
      )}

      {!!data && data.items.length === 0 && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-gray-700">
          현재 모집중인 체험단이 없습니다. 조건을 변경해 보세요.
        </div>
      )}

      {!!data && data.items.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.items.map((item) => (
            <CampaignCard key={item.id} item={item} />
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-2 text-sm text-slate-300">
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

      {process.env.NODE_ENV !== 'production' && (
        <pre className="mt-2 max-h-48 overflow-auto rounded bg-slate-100 p-2 text-xs text-slate-800">
{JSON.stringify({ params, meta: data?.meta, items: data?.items?.length }, null, 2)}
        </pre>
      )}
    </section>
  );
}
