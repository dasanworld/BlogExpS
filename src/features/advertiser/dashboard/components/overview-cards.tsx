"use client";

import { useMyCampaignsQuery } from '../hooks/useMyCampaignsQuery';
import { Card } from '@/components/ui/card';

const CountCard = ({ title, count }: { title: string; count: number }) => (
  <Card className="p-4">
    <p className="text-sm text-slate-500">{title}</p>
    <p className="mt-1 text-2xl font-semibold">{count}</p>
  </Card>
);

export function OverviewCards({ initialCounts }: { initialCounts?: { recruiting: number; closed: number; selection_complete: number } }) {
  const r = useMyCampaignsQuery(
    { status: 'recruiting', page: 1, pageSize: 1, sort: 'recent' },
    { initialData: initialCounts ? { items: [], meta: { page: 1, pageSize: 1, total: initialCounts.recruiting, totalPages: 1 } } as any : undefined },
  );
  const c = useMyCampaignsQuery(
    { status: 'closed', page: 1, pageSize: 1, sort: 'recent' },
    { initialData: initialCounts ? { items: [], meta: { page: 1, pageSize: 1, total: initialCounts.closed, totalPages: 1 } } as any : undefined },
  );
  const s = useMyCampaignsQuery(
    { status: 'selection_complete', page: 1, pageSize: 1, sort: 'recent' },
    { initialData: initialCounts ? { items: [], meta: { page: 1, pageSize: 1, total: initialCounts.selection_complete, totalPages: 1 } } as any : undefined },
  );
  const recruiting = (r.data as any)?.meta?.total ?? initialCounts?.recruiting ?? 0;
  const closed = (c.data as any)?.meta?.total ?? initialCounts?.closed ?? 0;
  const selected = (s.data as any)?.meta?.total ?? initialCounts?.selection_complete ?? 0;
  return (
    <section className="grid gap-4 md:grid-cols-3">
      <CountCard title="모집중" count={recruiting} />
      <CountCard title="모집종료" count={closed} />
      <CountCard title="선정완료" count={selected} />
    </section>
  );
}
