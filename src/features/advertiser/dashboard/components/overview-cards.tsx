"use client";

import { useMyCampaignsQuery } from '../hooks/useMyCampaignsQuery';
import { Card } from '@/components/ui/card';

const CountCard = ({ title, count }: { title: string; count: number }) => (
  <Card className="p-4">
    <p className="text-sm text-slate-500">{title}</p>
    <p className="mt-1 text-2xl font-semibold">{count}</p>
  </Card>
);

export function OverviewCards() {
  const r = useMyCampaignsQuery({ status: 'recruiting', page: 1, pageSize: 1, sort: 'recent' });
  const c = useMyCampaignsQuery({ status: 'closed', page: 1, pageSize: 1, sort: 'recent' });
  const s = useMyCampaignsQuery({ status: 'selection_complete', page: 1, pageSize: 1, sort: 'recent' });
  const recruiting = (r.data as any)?.meta?.total ?? 0;
  const closed = (c.data as any)?.meta?.total ?? 0;
  const selected = (s.data as any)?.meta?.total ?? 0;
  return (
    <section className="grid gap-4 md:grid-cols-3">
      <CountCard title="모집중" count={recruiting} />
      <CountCard title="모집종료" count={closed} />
      <CountCard title="선정완료" count={selected} />
    </section>
  );
}
