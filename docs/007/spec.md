# 007. 내 지원 목록 — Use Case

- Primary Actor: 인플루언서(로그인 사용자)
- Precondition(사용자 관점): 로그인 상태, 인플루언서 역할(프로필 완료 권장), 지원 내역은 0개일 수 있음
- Trigger: 메뉴에서 "내 지원 목록" 진입 또는 상태 필터/페이지 변경

## Main Scenario
1) FE는 기본 파라미터로 목록 조회를 요청한다(`status=all`, `page=1`, `pageSize=20`, `sort=recent`).
2) BE는 Authorization 토큰으로 사용자 식별 후 쿼리 파라미터를 검증한다.
3) BE는 `applications`에서 `influencer_id=me` 조건으로 조회하고, 상태 필터/정렬/페이징을 적용한다(필요 시 캠페인 요약 조인).
4) BE는 결과 리스트와 페이지네이션 메타를 비래핑 JSON으로 반환한다.
5) FE는 목록을 렌더링하고, 빈 결과일 때 대체 UI를 표시한다.
6) 사용자가 항목을 클릭하면 관련 상세로 이동한다(기본: `/campaigns/{id}`).

## Edge Cases
- 401 인증 누락/만료: 로그인 유도 후 재시도.
- 403 역할 불일치(인플루언서 아님): 접근 차단 및 역할 전환/안내.
- 잘못된 파라미터: BE가 정규화 또는 400 반환, FE는 기본값으로 복구해 재요청.
- 빈 결과: 안내 메시지와 상태/기간 필터 제안.
- 429 레이트 리밋: 지수 백오프 재시도와 사용자 안내.
- 500 서버/DB 오류: 재시도 버튼 및 토스트 안내.

## Business Rules
- 보호 API: Authorization Bearer 토큰 필수, role='influencer'만 허용.
- 기본 정렬: 신청 최신순(created_at desc); 기본 페이지 크기 20, 최대 50.
- 상태 필터: `all|applied|selected|rejected` 화이트리스트만 허용.
- 응답 스키마: 성공은 비래핑 JSON(리스트+meta), 오류는 표준 에러 포맷.
- 하드코딩 금지: 상수·스키마 기반 파라미터 검증/기본값 적용.

## Sequence Diagram (PlantUML)
@startuml
actor User
participant FE
participant BE
database Database

User -> FE: "내 지원 목록" 페이지 진입
FE -> BE: GET /api/applications/me?status=all&page=1&pageSize=20&sort=recent (Authorization)
BE -> BE: 토큰 검증 · 파라미터 정규화
BE -> Database: SELECT applications WHERE influencer_id=me [AND status] ORDER BY created_at DESC LIMIT/OFFSET
Database --> BE: rows + total
BE --> FE: 200 OK { items, meta }
FE -> User: 목록 렌더링(빈 결과 시 대체 UI)
User -> FE: 항목 클릭
FE -> FE: 라우팅 /campaigns/{id}
@enduml

