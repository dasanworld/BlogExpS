# 006. 체험단 지원 — Use Case

- Primary Actor: 인플루언서(로그인 사용자)
- Precondition(사용자 관점): 로그인 상태, 인플루언서 프로필 완료, 모집중 체험단 상세 화면 접근
- Trigger: 상세 페이지에서 지원 폼 입력 후 제출 클릭

## Main Scenario
1) FE는 사용자 입력(각오 한마디, 방문 예정일자)을 검증한다(빈값/형식 등).
2) FE는 Authorization Bearer 토큰을 포함하여 `POST /api/applications` 요청을 보낸다(payload: `campaignId`, `motivation`, `visitDate`; 새 레코드는 `id` 미포함).
3) BE는 스키마 검증 후 사용자 권한과 지원 가능 조건을 확인한다(role='influencer', profile_completed=true, 모집중·기간 내, 중복 지원 없음).
4) BE는 `applications`에 레코드를 생성한다(status='applied').
5) BE는 성공 응답(비래핑 JSON)으로 생성 결과를 반환한다.
6) FE는 성공 메시지를 표시하고 상세/내 지원 목록을 갱신한다.

## Edge Cases
- 401 인증 누락/무효: FE 로그인 유도 또는 토큰 재발급 후 재시도.
- 403 권한 없음(역할 불일치): 안내 메시지 및 역할 전환/프로필 완료 안내.
- 404 체험단 없음/종료: 알림 후 목록으로 돌아가기.
- 409 중복 지원: 안내 후 기존 지원 확인 경로 제공.
- 422 유효성 실패(날짜 과거/형식 오류 등): 필드별 에러 표시, 수정 후 재시도.
- 429 레이트 리밋: 지수 백오프로 재시도 및 사용자 안내.
- 500 서버/DB 오류: 재시도 버튼 및 토스트 안내.

## Business Rules
- 보호 API: Authorization Bearer 토큰 필수(성공 시 비래핑 JSON, 오류는 표준 에러 포맷 사용).
- 지원 가능 조건: role='influencer' AND profile_completed=true AND status='recruiting' AND 오늘이 모집기간 내.
- 중복 방지: `applications`는 UNIQUE(campaign_id, influencer_id) 위반 시 409.
- 입력 제약: `visitDate`는 오늘 이후 유효일자, `motivation`은 최소/최대 길이 제한.
- 감사/추적: 서버는 감사 로그(선택) 및 레이트 리밋 적용 가능.

## Sequence Diagram (PlantUML)
@startuml
actor User
participant FE
participant BE
database Database

User -> FE: 상세 페이지에서 지원 폼 입력
User -> FE: 제출 클릭
FE -> BE: POST /api/applications (Authorization, {campaignId, motivation, visitDate})
BE -> BE: 스키마/권한/지원 가능 조건 검증
BE -> Database: INSERT INTO applications (...)
Database --> BE: inserted row
BE --> FE: 200 OK { application }
FE -> User: 성공 메시지 + 상태 갱신
@enduml

