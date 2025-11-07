# 013. 광고주 프로필 폼 초기값 동기화 — 모듈화 설계

## 1. Use Case Insights
- `docs/003/spec.md`에 따르면 광고주가 이미 제출한 회사 정보(업체명·위치·카테고리·사업자번호)를 언제든 수정할 수 있어야 한다.
- 현재 페이지는 서버/클라이언트 가드를 갖고 있지만 form defaultValues가 비어 있어, 저장된 정보가 있어도 폼에 나타나지 않는다.
- 목표: 페이지 진입 시 DB 프로필 데이터를 가져와 form 상태에 주입하고, 로딩 상태/에러를 명확히 표시.

## 2. Existing Implementation Survey
- 서버 컴포넌트 `/advertisers/profile`는 현재 클라이언트 컴포넌트만 사용(`"use client"`)하여 매 페이지 렌더마다 클라이언트 fetch에 의존한다.
- `AdvertiserDashboard`는 서버에서 초기 데이터를 넘겨준다. 같은 접근을 프로필 페이지에도 적용 가능.
- Supabase 서버 클라이언트를 이미 사용 중이고, `getAdvertiserProfileServer`가 재사용 가능.

## 3. Design

### 3.1 Overview
1. **Server fetch helper** — `src/features/advertiser/profile/server/getProfile.ts`  
   - Supabase 서버 클라이언트로 광고주 프로필을 가져와 폼에 필요한 필드(회사명, 위치, 카테고리, 사업자등록번호)를 반환.
2. **Page wiring** — `src/app/(protected)/advertisers/profile/page.tsx`  
   - 서버 컴포넌트에서 프로필 데이터를 fetch 후 클라이언트 컴포넌트에 전달.
3. **Client form** — `src/features/advertiser/profile/components/profile-form.tsx`  
   - 기존 폼 로직을 분리, `initialValues` prop을 받아 `useEffect`를 통해 form.reset 호출. 로딩 중에는 skeleton/스피너 표시, 에러 시 guard 메시지.
4. **QA**  
   - 저장된 정보가 있을 때 필드에 자동 입력되는지 확인.  
   - 정보가 없을 때는 빈 폼 + 안내 메시지 유지.  
   - 저장/제출 후 재진입 시 새 값이 반영되는지 확인.

### 3.2 Diagram
```mermaid
flowchart TD
  Page[/advertisers/profile page/] --> ServerFetch[getAdvertiserProfileServer]
  ServerFetch --> ProfileForm[AdvertiserProfileForm]
  ProfileForm --> useForm
  useForm --> setDefault[form.reset(initialValues)]
```

### 3.3 Implementation Plan
1. Create `AdvertiserProfileForm` client component (move existing logic) with `initialValues` prop.
2. Update page.tsx to be server component (remove `"use client"` from page), fetch server profile, render `<AdvertiserProfileForm initialValues={...} />`.
3. Within form component:
   - `useEffect` to reset form when `initialValues` change.
   - Show form-level loading indicator until initial fetch sets state.
4. Additional improvements:
   - Provide guard message when fetch returns 403 (역할 불일치) or null (미등록) highlighting user actions.

> 구현 후 저장/새로고침 시 입력 값 유지되는지 QA 수행.
