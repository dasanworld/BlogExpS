"use client";

import Link from "next/link";
import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";

export type GlobalNavLink = {
  label: string;
  href: string;
};

type GlobalNavigationProps = {
  links?: GlobalNavLink[];
};

const DEFAULT_LINKS: GlobalNavLink[] = [
  { label: "홈", href: "/" },
  { label: "인플루언서 프로필", href: "/influencer/profile" },
  { label: "대시보드", href: "/dashboard" },
];

export function GlobalNavigation({ links = DEFAULT_LINKS }: GlobalNavigationProps) {
  const { user, isLoading, refresh } = useCurrentUser();
  const router = useRouter();

  const handleSignOut = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    await refresh();
    router.replace("/");
  }, [refresh, router]);

  const renderLink = (link: GlobalNavLink) => {
    if (link.href.startsWith("#")) {
      return (
        <a key={link.label} href={link.href} className="transition hover:text-blue-600">
          {link.label}
        </a>
      );
    }

    return (
      <Link key={link.label} href={link.href} className="transition hover:text-blue-600">
        {link.label}
      </Link>
    );
  };

  return (
    <nav className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur" aria-label="글로벌 네비게이션">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-4 text-slate-800 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2 font-semibold text-slate-900">
          <Sparkles className="h-5 w-5 text-blue-500" />
          <span>인플루언서 허브</span>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-slate-600">
          {links.map(renderLink)}
        </div>
        <div className="flex items-center gap-2 text-xs md:text-sm">
          {isLoading && <span className="text-slate-400">세션 확인 중...</span>}
          {!isLoading && user?.email && <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">{user.email}</span>}
          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-full border border-slate-200 px-3 py-1 text-slate-600 transition hover:border-blue-500 hover:text-blue-600"
          >
            로그아웃
          </button>
        </div>
      </div>
    </nav>
  );
}
