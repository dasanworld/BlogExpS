# 008. 광고주 체험단 관리 — 모듈화 설계(Plan)

## 개요
- 모듈: `campaign.schema` — 위치: `src/features/advertiser/backend/campaign.schema.ts`
  - 광고주 전용 체험단 목록/생성 스키마(zod). `MyCampaignListQuery`, `CampaignCreateRequest` 등 정의. 기존 `campaign` 스키마와 호환 응답 사용.
- 모듈: `campaign.error` — 위치: `src/features/advertiser/backend/campaign.error.ts`
  - 광고주 체험단 관리 전용 에러 코드 집합. 표준화된 문자열 코드 제공(400/401/403/409/500 매핑).
- 모듈: `campaign.service` — 위치: `src/features/advertiser/backend/campaign.service.ts`
  - 비즈니스 로직: `listMyCampaigns(supabase, userId, params)`, `createCampaign(supabase, userId, payload)` 구현.
  - 규칙: role='advertiser' 가정, `advertiser_profiles.profile_completed=true` 확인, `campaigns` CRUD 처리.
- 모듈: `campaign.route` — 위치: `src/features/advertiser/backend/campaign.route.ts`
  - Hono 라우트: `GET /advertisers/campaigns`, `POST /advertisers/campaigns` 등록.
  - 미들웨어: `withAuth({ requiredRole: 'advertiser' })` 적용, `respond()`로 비래핑 JSON 반환.
- 기존 파일 수정: `src/features/advertiser/backend/route.ts`
  - 내부에서 `registerAdvertiserCampaignRoutes(app)` 호출 추가(라우트 일원화). 기능 분리는 유지.
- 공유 사용: `src/shared/validators/pagination.ts`, `src/features/campaign/backend/schema.ts(CampaignStatusEnum, CampaignItemSchema)` 재사용.

## Diagram
```mermaid
flowchart LR
  A[Next.js API / Hono] --> B[withAuth(requiredRole='advertiser')]
  B --> C[campaign.route\n(GET/POST /advertisers/campaigns)]
  C --> D[campaign.schema\n(zod validate/normalize)]
  C --> E[campaign.service\n(listMyCampaigns, createCampaign)]
  E --> F[(Supabase Client)]
  F --> G[(Database\nadvertiser_profiles, campaigns)]
  D -.-> H[shared/pagination]
  D -.-> I[campaign/backend/schema\n(CampaignStatusEnum, ItemSchema)]
```

## Implementation Plan
- campaign.schema
  - MyCampaignListQuery
    - 필드: `status: 'all' | CampaignStatusEnum`(기본 `all`), `page`, `pageSize`, `sort='recent'`.
    - 제약: `page>=1`, `1<=pageSize<=50` (`PaginationSchema` 재사용), `status` 화이트리스트.
  - CampaignCreateRequest
    - 필드: `title (<=255)`, `recruitment_start_date (ISO date)`, `recruitment_end_date (ISO date)`, `recruitment_count (>0)`, `benefits`, `mission`, `store_info`.
    - 정규화: `trim()` 처리, 날짜 역전 금지(`start<=end` refine), 공백만 입력 금지.
  - Response 재사용: 목록은 `CampaignListResponseSchema`, 생성 결과는 `CampaignItemSchema`.

- campaign.error
  - 코드: `INVALID_QUERY_PARAMS`, `INVALID_PAYLOAD`, `FORBIDDEN_ROLE`, `PROFILE_INCOMPLETE`, `DB_TX_FAILED`.
  - 타입 export 및 서비스/라우트에서 사용.

- campaign.service
  - listMyCampaigns(supabase, userId, rawParams)
    - 파라미터 zod 검증 → 실패 시 400 반환.
    - 쿼리: `from('campaigns').select('*', { count: 'exact' }).eq('advertiser_id', userId)`
      - `status!='all'`이면 `.eq('status', status)` 추가.
      - 정렬: `created_at desc`(sort='recent').
      - 페이징: `range(from, to)` 계산.
    - 응답: `{ items, meta }` 비래핑 성공.
    - 오류: DB 에러는 500으로 매핑.
  - createCampaign(supabase, userId, rawPayload)
    - 스키마 검증/정규화 → 실패 시 400.
    - 가드: `advertiser_profiles.profile_completed=true` 확인(없으면 403 `PROFILE_INCOMPLETE`).
    - INSERT `campaigns`(광고주 id는 `userId`, `status='recruiting'`).
    - 반환: 생성 row 전체(`CampaignItemSchema` 대상).
    - 오류: DB 에러 500, 정책 위반 시 403/RLS 주의(로컬 RLS off, 배포 시 정책 필요).

- campaign.route
  - GET `/advertisers/campaigns`
    - `withAuth({ requiredRole: 'advertiser' })` → `getSupabase()`, `getAuthUser()`/`getUser()`로 `user.id` 확보.
    - `listMyCampaigns()` 호출 → `respond(c, result)`로 전달.
  - POST `/advertisers/campaigns`
    - `withAuth({ requiredRole: 'advertiser' })` → JSON 파싱 안전 유틸(기존 advertiser.route 패턴 참고) 사용.
    - `createCampaign()` 호출 → `respond(c, result)`.
  - 라우트 등록
    - `registerAdvertiserRoutes(app)` 내부에서 `registerAdvertiserCampaignRoutes(app)` 호출(한 곳에서 광고주 관련 라우트 관리).

- RLS/운영 체크(AGENTS.md 준수)
  - 로컬: `0004_disable_rls.sql`에 의해 RLS 비활성. 스테이징/프로덕션 반영 시 `campaigns` 정책 복원 필요:
    - "Advertisers can manage their own campaigns" 정책 유효 확인(INSERT/SELECT/UPDATE 제한).
  - 배포 전: Next/Hono 라우트 등록 여부와 DB 마이그레이션/정책 사전 점검.

- Unit Tests (business logic)
  - 대상: `campaign.service`
    - listMyCampaigns
      - status=all일 때 전체 페이지네이션 반환.
      - 특정 status 필터 적용 검증.
      - page/pageSize 경계값(1/50) 검증.
      - DB 에러 → 실패 코드/메시지 매핑.
    - createCampaign
      - 날짜 역전(start>end) → 400.
      - recruitment_count<=0 → 400.
      - 공백 필드 → 400.
      - advertiser profile 미완료 → 403 PROFILE_INCOMPLETE.
      - 정상 요청 → status='recruiting'으로 생성 및 필드 정규화 반영.
  - 방법: Supabase 클라이언트 메서드(mock) 스파이로 성공/실패 분기 테스트. 응답 스키마(`CampaignItemSchema`)로 결과 validate.

- Presentation QA Sheet (FE/UX)
  - 목록 초기 진입: 비어있을 때 빈 상태 UI 표시.
  - 상태 필터 변경: API 재호출, 결과 반영/페이지 리셋.
  - 신규 등록 다이얼로그
    - 필수값 누락/형식 오류 시 필드별 에러, 제출 비활성 유지.
    - 날짜 역전 시 즉시 에러 표시.
    - 제출 성공 시 다이얼로그 종료 및 목록 자동 갱신(최신순 상단 노출).
  - 인증/권한 에러(401/403): 로그인/프로필 완료 유도 가드 노출.
  - 서버/네트워크 오류: 토스트 + 재시도 버튼, 중복 제출 방지.

```note
응답은 항상 비래핑 JSON 사용, 보호 API는 Authorization Bearer 필수. 신규 레코드는 id 미포함.
```
