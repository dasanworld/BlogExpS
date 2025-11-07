# 012. 광고주 페이지 세션 동기화 — 모듈화 설계

## 1. Use Case Insights
- 참고 문서: `docs/003/spec.md`(광고주 정보 등록), `docs/010/plan.md`(역할별 대시보드)  
- 광고주 전용 화면(`/advertisers/dashboard`, `/advertisers/profile`)은 로그인 사용자 역할이 광고주일 때만 접근 가능해야 하며, 로그아웃/재로그인 시 즉시 권한이 반영되어야 한다.
- Ruler 규칙: 보호 API 호출 시 Authorization Bearer 필수, respond()는 비래핑 JSON. Net-new 요청도 동일 기준 유지.

## 2. Existing Implementation Survey
- `src/app/(protected)/advertisers/dashboard/page.tsx`는 서버 컴포넌트에서 Supabase 서버 클라이언트로 초기 데이터를 가져오고, `AdvertiserDashboard` 컴포넌트에 전달한다. 페이지에 `dynamic` 설정이 없어 Next.js가 결과를 정적으로 캐시할 수 있다.
- `AdvertiserDashboard`는 `initialProfile`이 주어지면 클라이언트 fetch를 스킵하고, 이후 사용자 전환이 일어나도 guard 상태를 갱신하지 않는다.
- `src/app/(protected)/advertisers/profile/page.tsx` 역시 동일한 패턴(서버 렌더 + 클라이언트 fetch mix)은 아니지만, 기본 레이아웃이 클라이언트 세션 변화에 즉시 대응하지 못한다.

## 3. Design

### 3.1 Overview
1. **`/advertisers/dashboard/page.tsx` dynamic 설정** — `src/app/(protected)/advertisers/dashboard/page.tsx`  
   - Next.js 캐싱 비활성화(`export const dynamic = "force-dynamic"` 및 `revalidate = 0`)로 요청마다 새로운 Supabase 세션을 사용.
2. **`AdvertiserDashboard` guard 재검증** — `src/features/advertiser/dashboard/components/advertiser-dashboard.tsx`  
   - `initialProfile`을 설정하더라도 클라이언트 마운트 시 최신 세션을 재조회하여 guard 상태를 덮어쓴다.
   - 로그아웃 후 재로그인 시에도 `getSupabaseBrowserClient` 기반 fetch가 실행되도록 `useEffect`를 개선.
3. **공통 nav 페이지에서의 동적 캐싱 방지** — `src/app/(protected)/advertisers/profile/page.tsx`  
   - 프로필 페이지도 강제 동적 렌더링 설정.
4. **QA** — 역할 전환 시 즉시 guard가 업데이트 되는지 수동 확인.

### 3.2 Diagram
```mermaid
flowchart TD
  User -->|requests| Page[/advertisers/dashboard page/]
  Page -->|Server fetch (force-dynamic)| Supa[Supabase Server Client]
  Page --> AD[AdvertiserDashboard]
  AD --> GuardInit[setGuard from initialProfile]
  AD --> FetchEffect[client fetch always runs]
  FetchEffect --> SupaBrowser[Supabase Browser Client]
  SupaBrowser --> GuardUpdate[override guard state]
```

### 3.3 Implementation Plan
1. **Dynamic page settings**
   - `src/app/(protected)/advertisers/dashboard/page.tsx`: export `dynamic = 'force-dynamic'`, `revalidate = 0`.
   - Same for `/advertisers/profile`.
2. **Guard revalidation**
   - Remove early return in `useEffect` when `initialProfile` exists; instead, set guard from initial data but continue to fetch asynchronously for current session.
   - Track abort flag to avoid state updates after unmount.
3. **QA**
   - 흐름: 광고주 로그인 → 대시보드 접근 → 로그아웃 → 인플루언서 로그인 → 대시보드 접근 시 guard 메시지가 뜨는지 확인.
