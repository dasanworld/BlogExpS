"use client";

import { useMemo, useState } from 'react';
import { useMyCampaignsQuery } from '../hooks/useMyCampaignsQuery';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCloseCampaignMutation } from '../hooks/useCloseCampaignMutation';
import { SelectionDialog } from './selection-dialog';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';

export function CampaignsTable({ initial, autoFetch = true }: { initial?: { items: any[]; meta: { page: number; pageSize: number; total: number; totalPages: number } }; autoFetch?: boolean }) {
  const { user } = useCurrentUser();
  const [status, setStatus] = useState<'all' | 'recruiting' | 'closed' | 'selection_complete'>('all');
  const [page, setPage] = useState(initial?.meta.page ?? 1);
  const [openSelectId, setOpenSelectId] = useState<string | null>(null);
  const { data, isLoading, error, refetch } = useMyCampaignsQuery(
    { status, page, pageSize: 10, sort: 'recent' },
    { enabled: autoFetch && !initial, initialData: initial as any }
  );
  const { mutateAsync: closeAsync, isPending: closing } = useCloseCampaignMutation();

  const items = (data as any)?.items ?? initial?.items ?? [];
  const meta = (data as any)?.meta ?? initial?.meta ?? { page: 1, pageSize: 10, total: 0, totalPages: 1 };

  const onClose = async (id: string) => {
    await closeAsync(id);
    await refetch();
  };

  const statusBadge = (s: string) => {
    const label = s === 'recruiting' ? '모집중' : s === 'closed' ? '모집종료' : '선정완료';
    return <Badge>{label}</Badge>;
  };

  return (
    <section className="rounded-lg border border-slate-200 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-medium">내 체험단</h3>
        <div className="flex items-center gap-2">
          <select
            className="rounded border border-slate-300 px-2 py-1 text-sm"
            value={status}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value as any);
            }}
          >
            <option value="all">전체</option>
            <option value="recruiting">모집중</option>
            <option value="closed">모집종료</option>
            <option value="selection_complete">선정완료</option>
          </select>
        </div>
      </div>
      {isLoading && <p className="text-sm text-slate-500">불러오는 중...</p>}
      {error && (
        <p className="text-sm text-red-600">
          목록을 불러오지 못했습니다. 권한 또는 프로필 상태를 확인해 주세요.
        </p>
      )}
      {!isLoading && !error && items.length === 0 && (
        <p className="text-sm text-slate-500">등록된 체험단이 없습니다. 우측 상단에서 신규 등록하세요.</p>
      )}
      {items.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] table-fixed border-collapse">
            <thead>
              <tr className="border-b bg-slate-50 text-left text-sm text-slate-600">
                <th className="p-2">제목</th>
                <th className="p-2">기간</th>
                <th className="p-2">인원</th>
                <th className="p-2">상태</th>
                <th className="p-2">생성일</th>
                <th className="p-2 text-right">액션</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id} className="border-b text-sm">
                  <td className="p-2 font-medium">{it.title}</td>
                  <td className="p-2">
                    {it.recruitment_start_date} ~ {it.recruitment_end_date}
                  </td>
                  <td className="p-2">{it.recruitment_count}</td>
                  <td className="p-2">{statusBadge(it.status)}</td>
                  <td className="p-2">{new Date(it.created_at).toLocaleDateString()}</td>
                  <td className="p-2">
                    <div className="flex items-center justify-end gap-2">
                      {it.status === 'recruiting' && (
                        <Button size="sm" variant="secondary" disabled={closing} onClick={() => onClose(it.id)}>
                          {closing ? '처리중...' : '모집종료'}
                        </Button>
                      )}
                      {it.status === 'closed' && (
                        <Button size="sm" onClick={() => setOpenSelectId(it.id)}>
                          체험단 선정
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="text-slate-500">
          {meta.page} / {meta.totalPages} (총 {meta.total}건)
        </span>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            이전
          </Button>
          <Button variant="secondary" size="sm" disabled={page >= meta.totalPages} onClick={() => setPage((p) => p + 1)}>
            다음
          </Button>
        </div>
      </div>

      <SelectionDialog id={openSelectId} onClose={() => setOpenSelectId(null)} />

      
    </section>
  );
}
