"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/remote/api-client";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";

export default function DashboardRoleRouterPage() {
  const router = useRouter();
  const [state, setState] = useState<'checking' | 'no-access' | 'redirecting'>('checking');

  useEffect(() => {
    const run = async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const session = await supabase.auth.getSession();
        const access = session.data.session?.access_token;
        const headers: Record<string, string> = {};
        if (access) headers['Authorization'] = `Bearer ${access}`;
        // Prefer advertiser first
        const adv = await apiClient.get('/api/advertisers/me', { headers, withCredentials: true }).then(() => true).catch(() => false);
        if (adv) {
          setState('redirecting');
          router.replace('/advertisers/dashboard');
          return;
        }
        const inf = await apiClient.get('/api/influencers/me', { headers, withCredentials: true }).then(() => true).catch(() => false);
        if (inf) {
          setState('redirecting');
          router.replace('/influencer/dashboard');
          return;
        }
        setState('no-access');
      } catch {
        setState('no-access');
      }
    };
    void run();
  }, [router]);

  if (state === 'redirecting') return null;

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="mb-2 text-2xl font-semibold">대시보드</h1>
      {state === 'checking' && <p className="text-slate-500">역할을 확인하는 중...</p>}
      {state === 'no-access' && (
        <div className="rounded border border-amber-200 bg-amber-50 p-4 text-amber-900">
          접근 가능한 대시보드가 없습니다. 프로필을 완료해 주세요.
          <div className="mt-2 flex gap-2">
            <a href="/advertisers/profile" className="underline">광고주 프로필</a>
            <a href="/influencer/profile" className="underline">인플루언서 프로필</a>
          </div>
        </div>
      )}
    </div>
  );
}
