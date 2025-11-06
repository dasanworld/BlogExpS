"use client";

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { CampaignItem } from '@/features/campaign/backend/schema';

type BannerProps = {
  campaigns: CampaignItem[];
};

/**
 * Campaign Banner Component
 * 추천 체험단을 자동 슬라이드하는 배너
 */
export function CampaignBanner({ campaigns }: BannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);

  // 자동 슬라이드
  useEffect(() => {
    if (!autoPlay || campaigns.length === 0) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % campaigns.length);
    }, 5000); // 5초마다 슬라이드

    return () => clearInterval(timer);
  }, [autoPlay, campaigns.length]);

  const handlePrev = useCallback(() => {
    setAutoPlay(false);
    setCurrentIndex((prev) =>
      prev === 0 ? campaigns.length - 1 : prev - 1
    );
  }, [campaigns.length]);

  const handleNext = useCallback(() => {
    setAutoPlay(false);
    setCurrentIndex((prev) => (prev + 1) % campaigns.length);
  }, [campaigns.length]);

  const handleDotClick = useCallback((idx: number) => {
    setAutoPlay(false);
    setCurrentIndex(idx);
  }, []);

  // 캠페인이 없을 경우 렌더링 안 함
  if (campaigns.length === 0) {
    return null;
  }

  const current = campaigns[currentIndex];
  const daysUntilEnd = Math.ceil(
    (new Date(current.recruitment_end_date).getTime() - Date.now()) /
      (1000 * 60 * 60 * 24)
  );
  const isUrgent = daysUntilEnd <= 3;

  return (
    <div className="relative rounded-xl overflow-hidden h-80 bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg">
      {/* Background Overlay */}
      <div className="absolute inset-0 bg-white/10" />

      {/* Content */}
      <div className="relative h-full flex items-center justify-between px-8 py-6">
        {/* Left: Text Content */}
        <div className="max-w-lg space-y-4 z-10">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold uppercase tracking-wide text-blue-50">
              추천 체험단
            </span>
            {isUrgent && (
              <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
                D-{daysUntilEnd}
              </span>
            )}
          </div>
          <h2 className="text-3xl font-bold line-clamp-2 text-white">{current.title}</h2>
          <p className="text-lg text-blue-50 line-clamp-2">{current.benefits}</p>
          <Link
            href={`/campaigns/${current.id}`}
            className="inline-block bg-white text-blue-600 font-semibold px-6 py-3 rounded-lg hover:bg-blue-50 transition"
          >
            자세히 보기 →
          </Link>
        </div>

        {/* Right: Navigation */}
        <div className="absolute inset-y-0 right-0 flex items-center gap-3 pr-6 z-20">
          <button
            onClick={handlePrev}
            className="p-2 rounded-full bg-white/30 hover:bg-white/50 transition backdrop-blur-sm text-white"
            aria-label="Previous campaign"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleNext}
            className="p-2 rounded-full bg-white/30 hover:bg-white/50 transition backdrop-blur-sm text-white"
            aria-label="Next campaign"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Dot Navigation */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-20">
        {campaigns.map((_, idx) => (
          <button
            key={idx}
            onClick={() => handleDotClick(idx)}
            className={`w-2 h-2 rounded-full transition ${
              idx === currentIndex ? 'bg-white' : 'bg-white/50'
            }`}
            aria-label={`Go to campaign ${idx + 1}`}
          />
        ))}
      </div>

      {/* Campaign Info Indicator */}
      <div className="absolute top-4 right-6 text-sm text-white z-20 backdrop-blur-sm bg-white/20 px-3 py-1 rounded-full">
        {currentIndex + 1} / {campaigns.length}
      </div>
    </div>
  );
}
