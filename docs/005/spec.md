# 005. 체험단 상세 — Use Case

- Primary Actor: 게스트/로그인 사용자(인플루언서 우선)
- Precondition(사용자 관점): 웹 접속 가능, 목록에서 카드 클릭 또는 직접 URL 접근
- Trigger: 사용자가 `/campaigns/{id}` 상세 페이지로 진입

## Main Scenario
1) FE가 상세 페이지 로드 시 `GET /api/campaigns/:id` 요청을 보낸다(Authorization은 선택).
2) BE가 캠페인 단건을 조회하고 주요 필드(제목, 기간, 혜택, 미션, 매장, 모집인원, 상태)를 반환한다.
3) 토큰이 있으면 BE는 사용자의 지원 가능 여부를 계산하여 `applyEligibility`(allowed/reason)를 함께 반환한다.
4) FE는 상세 정보를 렌더링하고, `applyEligibility.allowed`가 true면 “지원하기” 활성 버튼을 노출한다.
5) `applyEligibility.allowed=false`인 경우 버튼 비활성 + 사유(reason) 안내 가드를 표시한다.

## Edge Cases
- 존재하지 않는 id: 404 응답, FE는 “존재하지 않는 체험단입니다” 메시지와 홈 링크 제공.
- 잘못된 id 형식: 400 응답, FE는 에러 메시지와 뒤로가기 제공.
- DB 오류/지연: 500 응답, FE 재시도 버튼/토스트 제공.
- 비로그인: 상세는 열람 가능, `applyEligibility.allowed=false`, reason=`UNAUTHENTICATED`.
- 인플루언서 미완료 프로필: reason=`INFLUENCER_PROFILE_INCOMPLETE`.
- 모집 종료/기간 외: reason=`CAMPAIGN_NOT_RECRUITING`.

## Business Rules
- 기본 공개: 상세 조회는 공개 API(Authorization 불필요). 토큰 존재 시에만 개인화(지원 가능 여부) 계산.
- 지원 가능 조건: 로그인 AND role='influencer' AND influencer_profiles.profile_completed=true AND status='recruiting' AND 오늘이 모집기간 내.
- 응답 스키마: 성공은 비래핑 JSON, 오류는 표준 에러 포맷.

## Sequence Diagram (PlantUML)
@startuml
actor User
participant FE
participant BE
database Database

User -> FE: /campaigns/{id} 상세 진입
FE -> BE: GET /api/campaigns/{id} (Authorization?)
BE -> Database: SELECT * FROM campaigns WHERE id={id}
Database --> BE: campaign row
BE -> Database: (optional) SELECT profile_completed FROM influencer_profiles WHERE id={userId}
Database --> BE: profile row (or null)
BE --> FE: 200 OK { campaign, applyEligibility }
FE -> User: 상세 정보 렌더링 + 버튼(활성/비활성)
@enduml

