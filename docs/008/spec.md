# 008. 광고주 체험단 관리 — Use Case

- Primary Actor: 광고주(로그인 사용자)
- Precondition(사용자 관점): 로그인 상태, 역할=광고주, 광고주 프로필 완료, 관리 메뉴 접근 가능
- Trigger: "체험단 관리" 진입 후 신규 체험단 등록(Dialog)에서 제출

## Main Scenario
1) FE는 관리 화면 진입 시 나의 체험단 목록을 조회한다: GET `/api/advertisers/campaigns?status=all&page=1&pageSize=20&sort=recent`(Authorization 포함).
2) BE는 토큰/역할을 확인하고(Required: role='advertiser'), 본인 소유(`advertiser_id=me`) 캠페인만 페이징·정렬하여 반환한다.
3) 사용자가 "신규 체험단 등록" 버튼을 눌러 필수 정보를 입력한다(`title`, `recruitment_start_date`, `recruitment_end_date`, `recruitment_count`, `benefits`, `mission`, `store_info`).
4) FE는 기본 유효성 검사(필수값, 길이/형식, 날짜 범위, 모집 인원>0)를 통과한 경우 POST `/api/advertisers/campaigns` 요청을 보낸다(Authorization 포함, 새 레코드는 `id` 미포함).
5) BE는 스키마 검증·정규화 후, `advertiser_profiles.profile_completed=true`와 역할을 확인한다.
6) BE는 `campaigns`에 레코드를 생성한다(`advertiser_id=auth.uid()`, `status='recruiting'`).
7) BE는 생성 결과를 비래핑 JSON으로 반환한다. FE는 다이얼로그를 닫고 목록을 갱신한다(1단계 API 재호출).

## Edge Cases
- 401 인증 누락/만료: 로그인 유도 후 재시도.
- 403 권한 불일치/프로필 미완료: 안내 가드 및 프로필 완료 유도.
- 404 라우트 미등록: FE는 지원 브랜치/배포 상태 확인(개발 점검).
- 422/400 유효성 실패: 필드별 에러 메시지 표시(제목 길이, 날짜 역전, 모집 인원 0 이하 등).
- 429 레이트 리밋: 지수 백오프 및 사용자 안내.
- 500/DB/RLS 오류: 재시도 버튼/토스트 안내. (로컬은 RLS 비활성, 스테이징/프로덕션은 정책 적용 필수)

## Business Rules
- 보호 API: Authorization Bearer 토큰 필수, role='advertiser'만 허용.
- 등록 조건: `advertiser_profiles.profile_completed=true`일 때만 캠페인 생성 가능.
- 입력 제약: `title` ≤ 255자, `recruitment_count` > 0, `recruitment_start_date` ≤ `recruitment_end_date`, `benefits/mission/store_info`는 공백 불가.
- 소유 범위: 목록/생성/수정은 항상 `advertiser_id=auth.uid()`로 제한(정책: "Advertisers can manage their own campaigns").
- 응답 스키마: 성공은 비래핑 JSON, 오류는 표준 에러 포맷.
- 신규 레코드: 클라이언트는 `id`를 보내지 않는다(BE가 생성·할당).

## Sequence Diagram (PlantUML)
@startuml
actor User
participant FE
participant BE
database Database

User -> FE: "체험단 관리" 페이지 진입
FE -> BE: GET /api/advertisers/campaigns?status=all&page=1&pageSize=20&sort=recent (Authorization)
BE -> BE: 토큰·역할 확인, 파라미터 정규화
BE -> Database: SELECT * FROM campaigns WHERE advertiser_id=me [AND status] ORDER BY created_at DESC LIMIT/OFFSET
Database --> BE: rows + total
BE --> FE: 200 OK { items, meta }
FE -> User: 나의 체험단 목록 렌더링

User -> FE: "신규 체험단 등록" 클릭 후 폼 입력
FE -> FE: 클라이언트 유효성 검사(필수/길이/날짜/인원)
FE -> BE: POST /api/advertisers/campaigns (Authorization, {title, dates, count, benefits, mission, store_info})
BE -> BE: 스키마/권한/프로필 완료 검증
BE -> Database: INSERT INTO campaigns(advertiser_id=me, status='recruiting', ...)
Database --> BE: inserted row
BE --> FE: 200 OK { campaign }
FE -> BE: GET /api/advertisers/campaigns?status=all&page=1&pageSize=20&sort=recent (refresh)
BE -> Database: SELECT my campaigns
Database --> BE: rows + total
BE --> FE: 200 OK { items, meta }
FE -> User: 목록 갱신(신규 항목 반영)
@enduml

