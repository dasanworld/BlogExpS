# 009. 광고주 체험단 상세 & 모집 관리 — Use Case

- Primary Actor: 광고주(로그인 사용자)
- Precondition(사용자 관점): 로그인 상태, 역할=광고주, 광고주 프로필 완료, 내가 등록한 체험단 상세 화면 접근
- Trigger: 상세 화면에서 모집종료 버튼 클릭 또는 선정 진행 버튼 클릭(인원 선택 후 제출)

## Main Scenario
1) FE는 상세 진입 시 캠페인 정보와 지원자 목록을 조회한다: GET `/api/advertisers/campaigns/{id}`(+ applicants, Authorization 포함).
2) BE는 role='advertiser'와 소유권(`campaigns.advertiser_id=me`)을 확인하고, 캠페인과 지원자 목록을 반환한다.
3) 사용자가 "모집종료"를 누르면 FE는 POST `/api/advertisers/campaigns/{id}/close` 요청을 보낸다.
4) BE는 현재 상태가 `recruiting`인지 확인 후 `status='closed'`로 업데이트하고 성공을 반환한다.
5) 사용자가 "선정" 버튼을 누르고 인원(n명)을 선택해 제출하면, FE는 POST `/api/advertisers/campaigns/{id}/select` 요청을 보낸다(payload: `selectedIds[]`).
6) BE는 캠페인 상태가 `closed`인지, 선택 수가 `recruitment_count` 이내인지 검증한다.
7) BE는 트랜잭션으로 `applications` 상태를 일괄 갱신한다(선정자=`selected`, 나머지=`rejected`).
8) BE는 캠페인 상태를 `selection_complete`로 갱신하고 결과를 반환한다.
9) FE는 상태 변경(모집종료/선정완료)을 반영하고 지원자 테이블을 갱신한다.

## Edge Cases
- 401 인증 누락/만료: 로그인 유도 후 재시도.
- 403 권한 없음/소유권 불일치/프로필 미완료: 접근 차단 및 안내.
- 404 캠페인/라우트 미존재: 안내 후 목록으로 이동.
- 409 상태 전이 불가: `recruiting`이 아닌 상태에서 close, `closed`가 아닌 상태에서 select.
- 422 선택 인원 오류: `selectedIds`가 중복/존재하지 않음/모집 인원 초과 시 필드 에러.
- 429 레이트 리밋: 지수 백오프 및 사용자 안내.
- 500 DB/RLS/서버 오류: 재시도 버튼/토스트 안내(운영 환경은 정책 적용 필수).

## Business Rules
- 보호 API: Authorization Bearer 필수, role='advertiser'이고 소유 캠페인만 접근 가능.
- 상태 전환: `recruiting` → `closed` → `selection_complete`(역행 불가, 멱등 처리).
- 선정 처리: `applications.status`는 선정자=`selected`, 나머지=`rejected`로 일괄 반영(원자성 보장).
- 선택 수 제한: `selectedIds.length <= recruitment_count`.
- 응답: 성공은 비래핑 JSON, 오류는 표준 에러 포맷.
- 운영: 스테이징/프로덕션은 RLS 정책 유효해야 함(로컬은 `0004_disable_rls.sql`).

## Sequence Diagram (PlantUML)
@startuml
actor User
participant FE
participant BE
database Database

User -> FE: 캠페인 상세 진입
FE -> BE: GET /api/advertisers/campaigns/{id} (Authorization)
BE -> BE: 역할/소유권 확인
BE -> Database: SELECT campaign by id (advertiser_id=me)
BE -> Database: SELECT applications WHERE campaign_id={id}
Database --> BE: campaign + applicants
BE --> FE: 200 OK { campaign, applicants }
FE -> User: 상세/신청 현황 렌더링

User -> FE: "모집종료" 클릭
FE -> BE: POST /api/advertisers/campaigns/{id}/close (Authorization)
BE -> BE: 상태 검증(recruiting?)
BE -> Database: UPDATE campaigns SET status='closed' WHERE id={id} AND advertiser_id=me
Database --> BE: OK
BE --> FE: 200 OK { status: closed }
FE -> User: 상태 갱신 표시

User -> FE: "선정" 클릭 후 n명 선택, 제출
FE -> BE: POST /api/advertisers/campaigns/{id}/select (Authorization, {selectedIds})
BE -> BE: 상태/선발 수 검증(closed, n<=recruitment_count)
BE -> Database: BEGIN
BE -> Database: UPDATE applications SET status='selected' WHERE id IN(selectedIds) AND campaign_id={id}
BE -> Database: UPDATE applications SET status='rejected' WHERE id NOT IN(selectedIds) AND campaign_id={id}
BE -> Database: UPDATE campaigns SET status='selection_complete' WHERE id={id}
BE -> Database: COMMIT
Database --> BE: OK
BE --> FE: 200 OK { status: selection_complete }
FE -> User: 선정 완료 반영
@enduml

