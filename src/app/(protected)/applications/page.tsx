"use client";

import { ApplicationListSection } from '@/features/application/components/application-list';

export default function MyApplicationsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6 text-white">
      <div className="mx-auto w-full max-w-5xl">
        <ApplicationListSection />
      </div>
    </main>
  );
}

