# AGENTS.md

Centralised AI agent instructions. Add coding guidelines, style guides, and project context here.

Ruler concatenates all .md files in this directory (and subdirectories), starting with AGENTS.md (if present), then remaining files in sorted order.

- Remind: 404 from unregistered routes and 500 due to missing RLS policies caused signup failures.
- Rule: Always register FE→BE routes and verify required DB RLS/migrations exist before enabling a feature.
