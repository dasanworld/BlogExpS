# 광고주/인플루언서 대시보드 분리 — 모듈화 설계(Plan)

## 개요
- 모듈: `routes` 확장 — 위치: `src/features/advertiser/routes.ts`
  - 광고주 체험단 API 라우트 상수/쿼리 키 추가(목록/상세/모집종료/선정).
- 모듈: `useMyCampaignsQuery` — 위치: `src/features/advertiser/dashboard/hooks/useMyCampaignsQuery.ts`
  - 광고주 소유 체험단 목록 조회 훅(보호 API 토큰 부착, zod 검증, 페이징/정렬/상태 필터).
- 모듈: `useCreateCampaignMutation` — 위치: `src/features/advertiser/dashboard/hooks/useCreateCampaignMutation.ts`
  - 신규 체험단 생성 뮤테이션(성공 시 목록 쿼리 무효화).
- 모듈: `useCampaignDetailForOwnerQuery` — 위치: `src/features/advertiser/dashboard/hooks/useCampaignDetailForOwnerQuery.ts`
  - 상세+지원자 조회 훅(선정 다이얼로그용 데이터 소스).
- 모듈: `useCloseCampaignMutation` — 위치: `src/features/advertiser/dashboard/hooks/useCloseCampaignMutation.ts`
  - 모집 종료 액션 뮤테이션(성공 시 목록 무효화).
- 모듈: `useSelectApplicantsMutation` — 위치: `src/features/advertiser/dashboard/hooks/useSelectApplicantsMutation.ts`
  - 선정 제출 뮤테이션(성공 시 목록/상세 무효화).
- 모듈: `CreateCampaignDialog` — 위치: `src/features/advertiser/dashboard/components/create-campaign-dialog.tsx`
  - 신규 캠페인 등록 폼 다이얼로그.
- 모듈: `CampaignsTable` — 위치: `src/features/advertiser/dashboard/components/campaigns-table.tsx`
  - 내 체험단 테이블(필터/페이징/액션: 모집종료, 선정).
- 모듈: `SelectionDialog` — 위치: `src/features/advertiser/dashboard/components/selection-dialog.tsx`
  - 지원자 다중 선택 UI + 제출.
- 모듈: `OverviewCards` — 위치: `src/features/advertiser/dashboard/components/overview-cards.tsx`
  - 상태별 총합 카드(모집중/종료/선정완료).
- 모듈: `AdvertiserDashboard` — 위치: `src/features/advertiser/dashboard/components/advertiser-dashboard.tsx`
  - 접근 가드 + 상단 액션 + 카드 + 테이블 구성 컨테이너.
- 페이지 분리
  - 광고주 대시보드 페이지: `src/app/(protected)/advertisers/dashboard/page.tsx`
    - 광고주 전용 UI(`AdvertiserDashboard`) 렌더
  - 인플루언서 대시보드 페이지: `src/app/(protected)/influencer/dashboard/page.tsx`
    - `ApplicationListSection`를 메인으로 렌더
  - 역할 라우터: `src/app/(protected)/dashboard/page.tsx`
    - 클라이언트에서 `/api/advertisers/me` → 200이면 `/advertisers/dashboard`
    - 아니면 `/api/influencers/me` → 200이면 `/influencer/dashboard`
    - 둘 다 아니면 프로필/로그인 유도 메시지

## Diagram
```mermaid
flowchart LR
  R[RoleRouter /dashboard] -->|advertiser| ADP[Advertisers/Dashboard Page]
  R -->|influencer| IDP[Influencer/Dashboard Page]
  ADP --> C[AdvertiserDashboard]
  C --> OC[OverviewCards]
  C --> CT[CampaignsTable]
  C --> CD[CreateCampaignDialog]
  CT --> SD[SelectionDialog]
  OC --> Q1[useMyCampaignsQuery(status=recruiting)]
  OC --> Q2[useMyCampaignsQuery(status=closed)]
  OC --> Q3[useMyCampaignsQuery(status=selection_complete)]
  CT --> QL[useMyCampaignsQuery(list)]
  CT --> MC[useCloseCampaignMutation]
  SD --> QD[useCampaignDetailForOwnerQuery]
  SD --> MS[useSelectApplicantsMutation]
  Q1 --> API[(GET /api/advertisers/campaigns)]
  QL --> API
  QD --> API
  MC --> API
  MS --> API

  IDP --> ALS[ApplicationListSection]
  ALS --> IAPI[(GET /api/applications/me)]
```

## Implementation Plan
- routes 확장
  - ADVERTISER_API_ROUTES에 myCampaigns, myCampaignDetail, closeCampaign, selectApplicants 추가.
  - advertiserCampaignKeys: list/detail 키 팩토리.
- Hooks
  - useMyCampaignsQuery: 토큰 주입, CampaignListResponseSchema 검증, staleTime 10s, retry 2.
  - useCreateCampaignMutation: payload는 `CampaignCreateRequest`(zod 재사용), 성공 시 advertiserCampaignKeys 전체 무효화.
  - useCampaignDetailForOwnerQuery: CampaignDetailForOwnerSchema 사용, enabled=id 존재.
  - useCloseCampaignMutation / useSelectApplicantsMutation: 성공 시 목록/상세 무효화.
- Components
  - OverviewCards: status별 total은 pageSize=1로 호출 후 `meta.total` 사용.
  - CampaignsTable: 필터/페이징/행 액션 구현, SelectionDialog 오픈 상태 관리.
  - CreateCampaignDialog: 필수값, 날짜 역전, 카운트>0 유효성. 성공 시 reset+close.
  - SelectionDialog: applied 상태만 선택 대상으로 표시, 최대선택 수 가드, 제출 에러 시 목록 재동기화.
  - AdvertiserDashboard: 접근 가드(`/api/advertisers/me` 접근 가능 여부), 안내/CTA 제공.
- Pages
  - RoleRouter(`/dashboard`): 클라이언트에서 역할 판별 후 페이지 이동. 대기/실패 시 가드 UI.
  - AdvertiserDashboard Page(`/advertisers/dashboard`): 기존 구성 사용.
  - InfluencerDashboard Page(`/influencer/dashboard`): `ApplicationListSection` 재사용, 빈 상태/에러 처리.
- Presentation QA Sheet
  - 목록 로딩/빈 상태/에러 메시지 노출 확인.
  - 상태 필터 변경 시 페이지 1로 리셋.
  - 모집종료 버튼은 recruiting 행에만 노출, 처리 중 disabled.
  - 선정 다이얼로그에서 카운터가 최대치 초과하지 않도록 체크, 제출 후 닫힘.
  - 신규 등록 성공 시 목록/카드 수치 갱신.
  - 권한/프로필 미완료 시 가드 메시지와 링크 노출.

```note
보호 API는 Authorization Bearer 필수. 서버 응답은 비래핑 JSON 기준. RLS는 로컬 비활성(운영은 정책 필수).
```
