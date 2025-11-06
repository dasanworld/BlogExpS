# 009. 광고주 체험단 상세 & 모집 관리 — 모듈화 설계(Plan)

## 개요
- 모듈: `campaign.manage.schema` — 위치: `src/features/advertiser/backend/campaign.manage.schema.ts`
  - 광고주 전용 상세/지원자 조회, 모집종료, 선정 요청/응답 스키마 정의. `CampaignDetailForOwner`, `ApplicantsListItem`, `CloseRequest`, `SelectionRequest` 등. 기존 `CampaignItemSchema`, `CampaignStatusEnum` 재사용.
- 모듈: `campaign.manage.error` — 위치: `src/features/advertiser/backend/campaign.manage.error.ts`
  - 상세/모집 관리 전용 에러 코드(상태 전이 불가, 선택값 오류 등). 표준 코드 문자열과 타입 export.
- 모듈: `campaign.manage.service` — 위치: `src/features/advertiser/backend/campaign.manage.service.ts`
  - 비즈니스 로직: `getMyCampaignDetail`, `closeRecruitment`, `selectApplicants` 구현. 소유권/상태/제약 검증과 원자적 업데이트.
- 모듈: `campaign.manage.route` — 위치: `src/features/advertiser/backend/campaign.manage.route.ts`
  - Hono 라우트 등록: `GET /advertisers/campaigns/:id`, `POST /advertisers/campaigns/:id/close`, `POST /advertisers/campaigns/:id/select`(+ `/api/...` 동시 등록). `withAuth({ requiredRole: 'advertiser' })` 적용.
- 기존 파일 수정: `src/features/advertiser/backend/route.ts`
  - `registerAdvertiserCampaignManageRoutes(app)` 호출 추가(광고주 관련 라우트 일원화 유지).
- 공유 사용: `src/features/campaign/backend/schema.ts`의 `CampaignIdParamsSchema`, `CampaignItemSchema`, `CampaignStatusEnum` 및 `src/shared/validators/pagination.ts`(불필요 시 건너뜀) 재사용.

## Diagram
```mermaid
flowchart LR
  A[Next.js API / Hono] --> B[withAuth(requiredRole='advertiser')]
  B --> C[campaign.manage.route\n(GET detail, POST close/select)]
  C --> D[campaign.manage.schema\n(zod validate/normalize)]
  C --> E[campaign.manage.service\n(getMyCampaignDetail, closeRecruitment, selectApplicants)]
  E --> F[(Supabase Client)]
  F --> G[(Database\ncampaigns, applications, advertiser_profiles)]
  D -.-> H[campaign/backend/schema\n(CampaignIdParamsSchema, ItemSchema, Status)]
```

## Implementation Plan
- campaign.manage.schema
  - CampaignDetailForOwner
    - 구성: `campaign: CampaignItemSchema`, `applicants: ApplicantsListItem[]`.
  - ApplicantsListItem
    - 필드: `id(application uuid)`, `influencer_id(uuid)`, `status(enum: applied|selected|rejected)`, `motivation`, `created_at`.
    - 목적: 상세의 신청 현황 테이블 표시용 최소 정보.
  - CloseRequest
    - 본문 없음(빈 객체 허용). 파라미터는 URL id로 처리.
  - SelectionRequest
    - 필드: `selectedIds: uuid[]`(중복 불가, 길이 0 이상). refine: 중복 제거/배열 길이 제한은 서비스에서 `recruitment_count`와 비교.
  - 오류 스키마는 표준 에러 포맷 사용. 성공 응답은 비래핑 JSON(`{ status }` 또는 `CampaignDetailForOwner`).

- campaign.manage.error
  - 코드: `NOT_FOUND`, `INVALID_STATE_TRANSITION`, `INVALID_QUERY_PARAMS`, `INVALID_PAYLOAD`, `PROFILE_INCOMPLETE`, `DB_TX_FAILED`, `OWNERSHIP_FORBIDDEN`, `VALIDATION_MISMATCH`.
  - 타입 export 및 서비스/라우트에서 공통 사용.

- campaign.manage.service
  - getMyCampaignDetail(supabase, userId, rawId)
    - `CampaignIdParamsSchema`로 id 검증.
    - 캠페인 단건 조회: `eq('id', id)`, `eq('advertiser_id', userId)`(소유권 보장) → 없으면 404.
    - 지원자 목록 조회: `applications`에서 `campaign_id=id` 정렬(created_at desc).
    - 성공 시 `{ campaign, applicants }` 반환.
  - closeRecruitment(supabase, userId, rawId)
    - 캠페인 조회+소유권 확인. 현재 `status==='recruiting'`이 아니면 409 `INVALID_STATE_TRANSITION`(이미 `closed`이면 멱등 처리로 200 `{status:'closed'}` 반환 가능).
    - 업데이트: `status='closed'`.
    - 반환: `{ status: 'closed' }`.
  - selectApplicants(supabase, userId, rawId, rawPayload)
    - id 검증, payload 검증(`SelectionRequest`).
    - 캠페인 조회(소유권, `status==='closed'` 필수), `recruitment_count` 확보.
    - `selectedIds` 유효성: 중복 제거, 모두 `applications`에 존재하고 `campaign_id=id`인지 확인. 개수 `<= recruitment_count`.
    - 트랜잭션(원자성):
      - `UPDATE applications SET status='selected' WHERE id IN(selectedIds) AND campaign_id=id`.
      - `UPDATE applications SET status='rejected' WHERE id NOT IN(selectedIds) AND campaign_id=id`.
      - `UPDATE campaigns SET status='selection_complete' WHERE id=id`.
    - 반환: `{ status: 'selection_complete' }`.

- campaign.manage.route
  - GET `/advertisers/campaigns/:id` (+ `/api/advertisers/campaigns/:id`)
    - `withAuth({ requiredRole: 'advertiser' })` → `getMyCampaignDetail()` → `respond()`.
  - POST `/advertisers/campaigns/:id/close` (+ `/api/...`)
    - `withAuth({ requiredRole: 'advertiser' })` → `closeRecruitment()` → `respond()`.
  - POST `/advertisers/campaigns/:id/select` (+ `/api/...`)
    - `withAuth({ requiredRole: 'advertiser' })` → JSON 파싱 → `selectApplicants()` → `respond()`.

- RLS/운영 체크(AGENTS.md 준수)
  - 로컬 개발: `0004_disable_rls.sql`로 RLS 비활성.
  - 스테이징/프로덕션: 정책 복원 필수
    - `campaigns`: "Advertisers can manage their own campaigns"(INSERT/SELECT/UPDATE 제한).
    - `applications`: "Advertisers can view/update applications for their campaigns"(조인 기반 정책).
  - 라우트 등록과 마이그레이션/정책 적용을 배포 전 점검.

- Unit Tests (business logic)
  - 대상: `campaign.manage.service`
    - getMyCampaignDetail
      - 비소유/미존재 → 404/403 처리.
      - 정상 → 캠페인/지원자 수·정렬 확인.
    - closeRecruitment
      - recruiting → closed 전이 성공.
      - 이미 closed → 멱등 처리(200 closed).
      - selection_complete → 409 INVALID_STATE_TRANSITION.
    - selectApplicants
      - 상태 closed 아님 → 409.
      - selectedIds에 존재하지 않는 지원 id 포함 → 422.
      - selectedIds 개수 > recruitment_count → 422.
      - 정상 → applications 상태 일괄 반영, 캠페인 status=selection_complete.
  - 방법: Supabase 클라이언트 메서드(mock)로 분기 테스트, zod 스키마로 결과 validate.

- Presentation QA Sheet (FE/UX)
  - 상세 초기 진입: 캠페인 정보 + 신청 현황 테이블 표시(정렬/페이지 옵션은 선택).
  - 상태 뱃지/버튼: recruiting일 때만 "모집종료" 활성, closed일 때만 "선정" 활성.
  - 모집종료: 성공 시 상태 업데이트 및 버튼 전환.
  - 선정: 선택 수 가드(UI에서 즉시 검증), 성공 시 테이블 상태 반영 및 완료 안내.
  - 에러 처리: 401/403 가드(로그인/프로필 완료/소유권), 404 안내 및 목록 이동, 409/422는 필드별/토스트 안내, 500은 재시도 제공.

```note
응답은 항상 비래핑 JSON 사용, 보호 API는 Authorization Bearer 필수. 상태 전환은 단방향이며 멱등성을 고려합니다.
```
