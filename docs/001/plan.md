# 회원가입(Option B, Hono 오케스트레이션) — 모듈화 설계 계획서

## 개요
- Module: auth-signup-route — Path: `src/features/auth/backend/route.ts`
  - Hono 라우트 정의(`POST /auth/signup`). 요청 파싱/검증(Zod) → 서비스 호출 → 표준 응답 반환.
- Module: auth-signup-schema — Path: `src/features/auth/backend/schema.ts`
  - DTO/검증 스키마(Zod). Request/Response 타입과 에러 페이로드 스키마.
- Module: auth-signup-service — Path: `src/features/auth/backend/service.ts`
  - 비즈니스 오케스트레이션. Supabase `auth.signUp` 호출 → DB(`user_profiles`) 초기화 → 결과 매핑.
- Module: auth-signup-error — Path: `src/features/auth/backend/error.ts`
  - 에러 코드/메시지 상수화 및 유틸. FE 노출 가능한 메시지 규격화.
- Module: auth-constants — Path: `src/features/auth/constants.ts`
  - 역할(enum), 정책(비밀번호 최소길이 등) 상수. DB enum(`user_role`)과의 매핑 제공.
- Module: backend-rate-limit (선택) — Path: `src/backend/middleware/rate-limit.ts`
  - 간단한 IP 기준 레이트리밋 미들웨어. 초기 버전은 메모리 기반(후속 Redis 전환 가능).
- Integration: hono-app-register — Path: `src/backend/hono/app.ts`
  - `registerAuthRoutes(app)` 호출 추가. 공통 미들웨어(`errorBoundary`, `withAppContext`, `withSupabase`) 재사용.
- FE Integration (프리젠테이션) — Path: `src/app/signup/page.tsx`
  - 폼 확장(이름/휴대폰/역할/약관) 및 `/api/auth/signup` 호출. 실패/성공 메시지 UX 반영.

관련 컨벤션/가이드라인
- 라우트/서비스/스키마/에러 구성은 예제 기능 구조 준수: `src/features/example/backend/{route.ts, service.ts, schema.ts, error.ts}` 참고(`src/features/example/backend/route.ts:1`).
- 표준 응답 유틸 사용: `src/backend/http/response.ts` 의 `success/failure/respond`.
- 컨텍스트 주입: `src/backend/hono/context.ts`(logger/config/supabase) + `src/backend/middleware/*`.

## Diagram
```mermaid
flowchart LR
  FE[FE: /signup page] -->|POST /api/auth/signup| API[Hono Route: /auth/signup]
  API --> M1[Middleware: errorBoundary]
  API --> M2[Middleware: withAppContext]
  API --> M3[Middleware: withSupabase(Service Client)]
  API --> SCH[Schema: Zod parse]
  SCH --> SVC[Service: auth.signupOrchestrate]
  SVC --> SA[Supabase: auth.signUp]
  SVC --> DB[(Database: user_profiles)]
  SVC --> RESP[Map Result]
  RESP --> API
  API --> FE

  subgraph Shared
    RESP_UTIL[response.ts]
    CONSTS[auth-constants]
    ERR[auth-signup-error]
  end

  API -.use .-> RESP_UTIL
  SVC -.use .-> CONSTS
  API -.use .-> ERR
```

## Implementation Plan

- auth-signup-schema (`src/features/auth/backend/schema.ts`)
  - Request: `{ email, password, name, phone, role('advertiser'|'influencer'), termsAgreed:true }`
    - Rules: `email(형식)`, `password(min 8)`, `name(min 1)`, `phone(min 6)`, `role(enum)`, `termsAgreed === true`.
  - Response: `{ userId?: string, nextAction: 'verify_email'|'session_active', message: string }`.
  - Action:
    - Zod 스키마 작성 및 타입 export.

- auth-signup-error (`src/features/auth/backend/error.ts`)
  - Codes: `INVALID_SIGNUP_PAYLOAD`, `AUTH_SIGNUP_FAILED`, `PROFILE_BOOTSTRAP_FAILED`, `RATE_LIMITED`(선택).
  - Action:
    - 에러 코드 enum/const, 사용자 메시지 매핑 함수 제공.

- auth-constants (`src/features/auth/constants.ts`)
  - role enum: `advertiser | influencer`와 DB enum(`user_role`)간 매핑 상수.
  - password policy: `MIN_LENGTH = 8` 등.
  - Action:
    - 타입/상수 export, 서비스/스키마에서 참조.

- auth-signup-service (`src/features/auth/backend/service.ts`)
  - Signature: `signupOrchestrate(supabase, args) -> HandlerResult<SignupResponse, ErrorCodes>`
  - Steps:
    1) `supabase.auth.signUp({ email, password })` 호출.
    2) `user_profiles` insert `{ id: user.id, name, phone, email, role, terms_agreed_at: now }`.
    3) 결과를 `{ nextAction, userId?, message }`로 매핑.
    4) 실패 시 `failure(status, code, message, details)` 반환.
  - Notes:
    - 세션 유무에 따라 `nextAction` 결정.
    - 트랜잭션 필요성은 낮음(두 단계 실패 시 롤백 시나리오 로그만 남김). 후속: pg rpc/트리거나 DB txn 고려.

- auth-signup-route (`src/features/auth/backend/route.ts`)
  - Path: `POST /auth/signup` 등록 함수 `registerAuthRoutes(app)`.
  - Steps:
    1) JSON 파싱 → Zod 검증 실패 시 400 + `INVALID_SIGNUP_PAYLOAD`.
    2) (선택) 레이트리밋 미들웨어 적용 후 진행.
    3) `signupOrchestrate` 호출 → `respond(c, result)`로 표준 응답.
    4) 로깅: 실패 케이스 `logger.error`, 성공 케이스 `logger.info`(요약).

- backend-rate-limit (선택) (`src/backend/middleware/rate-limit.ts`)
  - 간단한 IP 메모리 카운터(예: 분당 n회). 초기 버전은 개발/테스트 용.
  - 인터페이스: `withRateLimit({ windowMs, max, keyGetter })` → 429 반환.

- hono-app-register (`src/backend/hono/app.ts`)
  - `registerAuthRoutes(app)` 호출 추가. 기존 미들웨어 순서 유지.

- FE Integration (`src/app/signup/page.tsx`)
  - Form Fields: `email, password, confirmPassword, name, phone, role(select), termsAgreed(checkbox)`.
  - Submit: `fetch('/api/auth/signup')` 호출. 응답 메시지/nextAction에 따라 안내, `/login` 프리페치.
  - Validation: 클라이언트 측 최소 검증(비밀번호 일치, 필수값).

- Business Logic Unit Tests
  - Framework: Vitest (devDependency) 도입, `tsconfig`/`eslint`와 충돌 없도록 최소 설정.
  - Files: `tests/features/auth/signup.service.test.ts`
  - Scope:
    - 성공: auth.signUp 성공 + user_profiles insert 성공 → `verify_email` or `session_active` 분기 검증.
    - 실패1: auth.signUp 오류 → `AUTH_SIGNUP_FAILED`.
    - 실패2: 프로필 insert 오류 → `PROFILE_BOOTSTRAP_FAILED`.
    - DI: supabase client 의존성 주입(mock 함수로 대체).

- Route Tests (Lightweight)
  - Files: `tests/features/auth/signup.route.test.ts`
  - Use: Hono 테스트 러너(또는 supertest 스타일)로 JSON 파싱/검증 오류(400), 성공(201) 확인.
  - 주의: 실제 네트워크 호출 없음(mock service 바인딩) — 서비스 레이어를 별도 주입 가능하게 설계.

- Presentation QA Sheet
  - Location: 본 문서 내 체크리스트
  - Scope:
    - 폼 필드 렌더링/초기값/필수값 표시.
    - 비밀번호 불일치 시 버튼 비활성/오류 메시지.
    - 잘못된 이메일/빈 값 입력 시 제출 차단.
    - 서버 400/429/500 응답 시 토스트/문구.
    - 성공 응답 시 메시지 및 `/login` 프리페치 동작.
    - 이미 로그인된 상태로 `/signup` 접근 시 리다이렉트 확인.

### Presentation QA Sheet
- 입력 유효성
  - [ ] 이메일 형식이 아니면 제출 불가, 에러 안내.
  - [ ] 비밀번호/확인 불일치 시 제출 불가.
  - [ ] 이름/휴대폰/역할/약관(체크) 미입력 시 제출 불가.
- 서버 응답 처리
  - [ ] 400 `INVALID_SIGNUP_PAYLOAD`시 필드별 안내 노출.
  - [ ] 429 `RATE_LIMITED` 수 분 후 재시도 문구.
  - [ ] 500 `PROFILE_BOOTSTRAP_FAILED` 재시도/문의 문구.
  - [ ] 성공 시 `verify_email` 안내 및 `/login` 프리페치.
- 네비게이션
  - [ ] 로그인 상태 접근 시 즉시 리다이렉트.
  - [ ] 제출 후 폼 초기화 동작.

### Business Logic Unit Test Cases
- `signupOrchestrate`
  - [ ] 성공-세션없음: nextAction=`verify_email`, userId 존재, 메시지 포함.
  - [ ] 성공-세션있음: nextAction=`session_active`.
  - [ ] 실패-auth.signUp 오류 → 코드=`AUTH_SIGNUP_FAILED`, 400.
  - [ ] 실패-profile insert 오류 → 코드=`PROFILE_BOOTSTRAP_FAILED`, 500.
  - [ ] termsAgreed=false인 경우(서비스 이전 단계) — 스키마 레벨에서 400 검증됨.

부가 고려사항(후속)
- 레이트리밋 저장소: Redis(Upstash 등)로 교체.
- 이메일 인증 재전송 엔드포인트: `POST /auth/resend-verification`.
- RLS 정책 보완: `user_profiles` insert 권한 및 보안 검토.
- Supabase 타입 생성: `Database` 타입 생성 및 테이블 매핑 강화.
