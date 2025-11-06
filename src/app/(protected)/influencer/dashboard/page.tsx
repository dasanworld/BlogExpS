"use client";

import { ApplicationListSection } from "@/features/application/components/application-list";

export default function InfluencerDashboardPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <header className="mb-4">
        <h1 className="text-2xl font-semibold">인플루언서 대시보드</h1>
        <p className="text-slate-500">내 지원 현황을 한눈에 확인하세요.</p>
      </header>
      <ApplicationListSection />
    </div>
  );
}

