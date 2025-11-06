# AGENTS.md

Centralised AI agent instructions. Add coding guidelines, style guides, and project context here.

Ruler concatenates all .md files in this directory (and subdirectories), starting with AGENTS.md (if present), then remaining files in sorted order.

- Remind: 404는 미등록 API 라우트, 500/RLS 에러는 user_profiles 등 테이블의 RLS/마이그레이션 누락이 원인.
- Rule: 엔드포인트 활성화 전 Hono/Next 라우트 등록과 관련 테이블의 마이그레이션·RLS 적용을 반드시 사전 점검.

- Dev note: Local development uses migration `0004_disable_rls.sql` to disable RLS. Re‑enable RLS and restore policies before staging/production.

- Remind: 401은 FE가 Authorization Bearer 토큰을 누락했고, 400/NOT NULL은 새 채널 upsert에 id=null 전송·응답 래핑 오해에서 발생.
- Rule: 보호 API는 항상 액세스 토큰 포함, 신규 레코드는 id 필드 미포함, FE는 respond()의 비래핑 JSON 스키마로 파싱.
