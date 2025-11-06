# 004. 홈 & 체험단 목록 탐색 — Use Case

- Primary Actor: 게스트/로그인 사용자(인플루언서·광고주 포함)
- Precondition(사용자 관점): 웹에 접속 가능, 홈 혹은 목록 화면 접근. 로그인은 선택(미로그인도 열람 가능).
- Trigger: 사용자가 홈 진입, 필터/정렬 변경, 페이지 이동, 모집 카드 클릭.

## Main Scenario
1) FE가 홈/목록 페이지 초기 로드 시 기본 파라미터로 목록 조회 요청을 전송한다(`status=recruiting`, `page=1`, `pageSize=20`, `sort=recent`).
2) BE가 쿼리 파라미터를 검증하고 DB에서 모집중 캠페인만 조회한다(페이징/정렬/필터 적용).
3) BE가 결과 리스트와 페이지네이션 메타를 반환한다(성공 시 unwrapped JSON).
4) FE는 카드 리스트를 렌더링하고 빈 결과일 경우 대체 UI를 표시한다.
5) 사용자가 카드 클릭 시 상세 페이지로 이동한다(`/campaigns/[id]`).

## Edge Cases
- 빈 결과: FE는 “현재 모집중인 체험단이 없습니다” 메시지와 필터 초기화/확장 검색 제공.
- 잘못된 파라미터(음수 page, 과도한 pageSize): BE가 기본값으로 강제·정규화, 400 시 FE는 기본값으로 재요청.
- DB 지연/오류(500): FE 재시도 버튼 및 토스트 안내, 진입 차단 없이 홈 유지.
- 네트워크 오류: FE 오프라인 인디케이터 및 재시도 UX 제공.
- 레이트 리밋: FE는 대기·후속 재시도(지수 백오프) 및 사용자 안내.

## Business Rules
- 기본 정렬: 최신 등록 순(`sort=recent`), 기본 페이지 크기: 20, 최대 페이지 크기: 50.
- 노출 대상: 공개(public)이고 상태가 ‘모집중’인 캠페인만; ‘모집종료/비공개/삭제’는 제외.
- 필터: 카테고리, 위치, 키워드(제목/매장명), 혜택유형. 허용된 목록만 적용.
- 캐싱: FE는 동일 파라미터에 대해 짧은 메모리 캐시 허용, BE는 ETag/Cache-Control 설정 가능.
- 인증: 본 목록 조회는 공개 API(Authorization 불필요). 토큰이 있으면 개인화(예: 이미 지원 여부 배지)만 추가 표시.
- 응답 스키마: 성공은 비래핑 JSON(리스트+meta), 오류는 표준 에러 포맷. 하드코딩 금지.

## Sequence Diagram (PlantUML)
@startuml
actor User
participant FE
participant BE
database Database

User -> FE: 홈/목록 페이지 접속
FE -> BE: GET /api/campaigns?status=recruiting&page=1&pageSize=20&sort=recent
BE -> BE: 쿼리 파라미터 검증·정규화
BE -> Database: SELECT campaigns WHERE status='recruiting' AND public=true ORDER BY created_at DESC LIMIT/OFFSET
Database --> BE: 결과 rows + total
BE --> FE: 200 OK { items, meta }
FE -> User: 카드 리스트 렌더링(빈 결과 시 대체 UI)

User -> FE: 카드 클릭
FE -> FE: 라우팅 /campaigns/{id} (Prefetch 가능)
@enduml

