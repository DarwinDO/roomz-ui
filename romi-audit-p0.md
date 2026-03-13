# ROMI Audit P0

## Goal
Create a written ROMI audit matrix, then fix the current P0 gaps: branding/copy cleanup, remove crawl fallback coupling, and route room search through the canonical `search_rooms` RPC.

## Tasks
- [x] Write `docs/features/romi-audit-matrix.md` with current-state findings and P0/P1 recommendations -> Verify: file captures tool coverage, drift, and roadmap.
- [x] Clean up ROMI branding/copy in web, mobile, shared API, and edge function -> Verify: no `Trợ lý AI RommZ` copy remains in active chatbot UIs.
- [x] Remove `ingestionReview -> ai-chatbot` fallback and chatbot crawl proxy -> Verify: crawl lane only invokes `crawl-ingestion`.
- [x] Refactor chatbot room search tool to call `public.search_rooms(...)` -> Verify: edge function no longer queries `rooms` directly for room search.
- [x] Run targeted verification -> Verify: lint/build/tests pass for touched files.

## Done When
- [x] ROMI audit spec exists in repo
- [x] Chatbot P0 code changes are implemented
- [x] Verification passes and results are documented back to user
