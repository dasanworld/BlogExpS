"use client";

import { useState } from 'react';
import { useCreateCampaignMutation } from '../hooks/useCreateCampaignMutation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

type Props = {
  onCreated?: () => void;
  disabled?: boolean;
};

export function CreateCampaignDialog({ onCreated, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [count, setCount] = useState<number>(1);
  const [benefits, setBenefits] = useState('');
  const [mission, setMission] = useState('');
  const [store, setStore] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { mutateAsync, isPending } = useCreateCampaignMutation();

  const valid =
    title.trim().length > 0 &&
    benefits.trim().length > 0 &&
    mission.trim().length > 0 &&
    store.trim().length > 0 &&
    count > 0 &&
    start && end && new Date(start) <= new Date(end);

  const onSubmit = async () => {
    setError(null);
    if (!valid) return;
    try {
      await mutateAsync({
        title: title.trim(),
        recruitment_start_date: start,
        recruitment_end_date: end,
        recruitment_count: count,
        benefits: benefits.trim(),
        mission: mission.trim(),
        store_info: store.trim(),
      });
      setOpen(false);
      setTitle('');
      setStart('');
      setEnd('');
      setCount(1);
      setBenefits('');
      setMission('');
      setStore('');
      onCreated?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create');
    }
  };

  return (
    <div>
      <Button onClick={() => setOpen(true)} disabled={disabled}>
        신규 체험단 등록
      </Button>
      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">신규 체험단 등록</h3>
              <Button variant="secondary" onClick={() => setOpen(false)}>
                닫기
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="title">체험단명</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="count">모집 인원</Label>
                <Input
                  id="count"
                  type="number"
                  min={1}
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="start">모집 시작일</Label>
                <Input id="start" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="end">모집 종료일</Label>
                <Input id="end" type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="benefits">제공 혜택</Label>
                <Textarea id="benefits" value={benefits} onChange={(e) => setBenefits(e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="mission">미션</Label>
                <Textarea id="mission" value={mission} onChange={(e) => setMission(e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="store">매장 정보</Label>
                <Textarea id="store" value={store} onChange={(e) => setStore(e.target.value)} />
              </div>
            </div>
            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setOpen(false)}>
                취소
              </Button>
              <Button disabled={!valid || isPending} onClick={onSubmit}>
                {isPending ? '등록 중...' : '등록'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
