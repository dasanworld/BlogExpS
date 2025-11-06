"use client";

import { useMemo, useState } from 'react';
import { useCampaignDetailForOwnerQuery } from '../hooks/useCampaignDetailForOwnerQuery';
import { useSelectApplicantsMutation } from '../hooks/useSelectApplicantsMutation';
import { Button } from '@/components/ui/button';

type Props = {
  id: string | null;
  onClose: () => void;
};

export function SelectionDialog({ id, onClose }: Props) {
  const open = Boolean(id);
  const { data, isLoading, error, refetch } = useCampaignDetailForOwnerQuery(id ?? undefined);
  const max = data?.campaign.recruitment_count ?? 0;
  const applied = (data?.applicants ?? []).filter((a) => a.status === 'applied');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { mutateAsync, isPending } = useSelectApplicantsMutation();

  const toggle = (aid: string) => {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(aid)) n.delete(aid);
      else if (n.size < max) n.add(aid);
      return n;
    });
  };

  const onSubmit = async () => {
    if (!id) return;
    setSubmitError(null);
    try {
      await mutateAsync({ id, selectedIds: Array.from(selected) });
      onClose();
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Failed to select');
      await refetch();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">체험단 선정</h3>
          <Button variant="secondary" onClick={onClose}>
            닫기
          </Button>
        </div>
        {isLoading && <p className="text-sm text-slate-500">신청자 목록을 불러오는 중...</p>}
        {error && <p className="text-sm text-red-600">목록을 불러오지 못했습니다.</p>}
        {data && (
          <div>
            <p className="mb-3 text-sm text-slate-600">
              선택 가능 인원: {selected.size} / {max}
            </p>
            <div className="max-h-80 overflow-auto rounded border">
              <table className="w-full table-fixed">
                <thead>
                  <tr className="border-b bg-slate-50 text-left text-sm text-slate-600">
                    <th className="p-2">선택</th>
                    <th className="p-2">지원자</th>
                    <th className="p-2">각오</th>
                    <th className="p-2">신청일</th>
                  </tr>
                </thead>
                <tbody>
                  {applied.map((a) => (
                    <tr key={a.id} className="border-b text-sm">
                      <td className="p-2">
                        <input
                          type="checkbox"
                          checked={selected.has(a.id)}
                          onChange={() => toggle(a.id)}
                        />
                      </td>
                      <td className="p-2 font-mono text-xs">{a.influencer_id}</td>
                      <td className="p-2 truncate">{a.motivation}</td>
                      <td className="p-2">{new Date(a.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {submitError && <p className="mt-3 text-sm text-red-600">{submitError}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            취소
          </Button>
          <Button disabled={isPending || selected.size > max} onClick={onSubmit}>
            {isPending ? '처리 중...' : '선정 완료'}
          </Button>
        </div>
      </div>
    </div>
  );
}

