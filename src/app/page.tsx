"use client";

import { useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, Users } from "lucide-react";
import { CampaignListSection } from "@/features/campaign/components/campaign-list";
import { CampaignBanner } from "@/features/campaign/components/banner";
import { useCampaignsQuery } from "@/features/campaign/hooks/useCampaignsQuery";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";

export default function Home() {
  const { user, isAuthenticated, isLoading, refresh } = useCurrentUser();
  const router = useRouter();

  // 배너용 추천 캠페인 (상위 5개, 인기순)
  const { data: popularData } = useCampaignsQuery(
    { status: 'recruiting', page: 1, pageSize: 5, sort: 'popular' },
  );
  const popularCount = popularData?.items?.length ?? 0;
  const { data: recentData } = useCampaignsQuery(
    { status: 'recruiting', page: 1, pageSize: 5, sort: 'recent' },
    { enabled: popularCount === 0 }
  );

  const handleSignOut = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    await refresh();
    router.replace("/");
  }, [refresh, router]);

  const navActions = useMemo(() => {
    if (isLoading) {
      return (
        <span className="text-sm text-gray-500">세션 확인 중...</span>
      );
    }

    if (isAuthenticated && user) {
      return (
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-700 truncate">{user.email}</span>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="text-sm text-gray-700 hover:text-blue-600 transition"
            >
              대시보드
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              className="text-sm text-gray-700 hover:text-blue-600 transition"
            >
              로그아웃
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-4">
        <Link
          href="/login"
          className="text-sm text-gray-700 hover:text-blue-600 transition"
        >
          로그인
        </Link>
        <Link
          href="/signup"
          className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          회원가입
        </Link>
      </div>
    );
  }, [handleSignOut, isAuthenticated, isLoading, user]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-indigo-100 text-gray-900">
      {/* Header Navigation */}
      <nav className="sticky top-0 z-50 border-b border-blue-200/50 bg-white/80 backdrop-blur-sm shadow-sm">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-blue-600" />
            <span className="font-semibold text-lg text-gray-900">블로그 체험단</span>
          </div>
          {navActions}
        </div>
      </nav>

      {/* Main Content */}
      <div className="mx-auto max-w-6xl px-6 py-12 space-y-16">
        {/* Hero Section */}
        <section className="space-y-6 py-16 text-center">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-gray-900">
              인플루언서와 브랜드를
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                연결하는 플랫폼
              </span>
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              최고의 체험단 기회를 발견하고, 브랜드와 협력하세요.
              <br />
              다양한 체험단 프로젝트에 참여하여 새로운 경험을 쌓으세요.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex gap-4 justify-center pt-4">
            {!isAuthenticated && (
              <>
                <Link
                  href="/signup"
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                  시작하기
                </Link>
                <Link
                  href="#campaigns"
                  className="px-8 py-3 border border-gray-300 text-gray-900 rounded-lg font-semibold hover:bg-gray-100 transition"
                >
                  체험단 보기
                </Link>
              </>
            )}
            {isAuthenticated && (
              <Link
                href="#campaigns"
                className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                체험단 탐색하기
              </Link>
            )}
          </div>
        </section>

        {/* Features Section */}
        <section className="grid md:grid-cols-3 gap-8 py-12">
          <div className="bg-white border border-blue-200 rounded-lg p-6 space-y-3 shadow-sm hover:shadow-md transition">
            <Sparkles className="w-8 h-8 text-amber-500" />
            <h3 className="text-lg font-semibold text-gray-900">다양한 기회</h3>
            <p className="text-gray-600">
              뷰티, 음식, 라이프스타일 등 다양한 분야의 체험단을 만나보세요.
            </p>
          </div>
          <div className="bg-white border border-blue-200 rounded-lg p-6 space-y-3 shadow-sm hover:shadow-md transition">
            <Users className="w-8 h-8 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">쉬운 참여</h3>
            <p className="text-gray-600">
              간단한 신청 절차로 관심 있는 체험단에 빠르게 참여하세요.
            </p>
          </div>
          <div className="bg-white border border-blue-200 rounded-lg p-6 space-y-3 shadow-sm hover:shadow-md transition">
            <Sparkles className="w-8 h-8 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">보상 제공</h3>
            <p className="text-gray-600">
              제품, 서비스, 현금 등 다양한 혜택을 받으며 활동하세요.
            </p>
          </div>
        </section>

        {/* Banner Section */}
        <section id="banner" className="py-8">
          <h2 className="text-3xl font-bold mb-6 text-gray-900">추천 체험단</h2>
          <CampaignBanner campaigns={(popularData?.items?.length ? popularData?.items : (recentData?.items ?? []))} />
        </section>

        {/* Campaign List Section */}
        <section id="campaigns" className="py-8 space-y-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">모집 중인 체험단</h2>
            <p className="text-gray-600 mt-2">
              현재 모집 중인 모든 체험단을 확인하고 참여하세요.
            </p>
          </div>
          <CampaignListSection />
        </section>

        {/* Footer */}
        <footer className="border-t border-gray-200 py-12 mt-20 space-y-6">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-semibold mb-3 text-gray-900">플랫폼</h3>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li><Link href="/" className="hover:text-blue-600 transition">홈</Link></li>
                <li><Link href="#campaigns" className="hover:text-blue-600 transition">체험단 둘러보기</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3 text-gray-900">사용자</h3>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li><Link href="/login" className="hover:text-blue-600 transition">로그인</Link></li>
                <li><Link href="/signup" className="hover:text-blue-600 transition">회원가입</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3 text-gray-900">정보</h3>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li><a href="#" className="hover:text-blue-600 transition">이용약관</a></li>
                <li><a href="#" className="hover:text-blue-600 transition">개인정보처리방침</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 pt-6 text-center text-gray-500 text-sm">
            <p>&copy; 2025 블로그 체험단 플랫폼. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </main>
  );
}
