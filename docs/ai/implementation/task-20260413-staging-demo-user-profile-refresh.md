---
phase: implementation
task: staging-demo-user-profile-refresh
date: 2026-04-13
status: completed
---

# Task Log: Staging Demo User Profile Refresh

## Goal

- Replace obviously fake staging/demo user identities with realistic Vietnamese personas in the live database.
- Keep future staging reseeds aligned so fake names/emails do not come back.

## Files

- Created [supabase/migrations/20260413102410_refresh_staging_demo_user_profiles.sql](/e:/RoomZ/roomz-ui/supabase/migrations/20260413102410_refresh_staging_demo_user_profiles.sql)
- Updated [supabase/seeds/staging_demo.sql](/e:/RoomZ/roomz-ui/supabase/seeds/staging_demo.sql)
- Updated [docs/ai/monitoring/project-status.md](/e:/RoomZ/roomz-ui/docs/ai/monitoring/project-status.md)

## Validation

- `npx ai-devkit@latest lint`: pass
- Applied live migration `refresh_staging_demo_user_profiles` on Supabase project `vevnoxlgwisdottaifdn`
- Direct SQL verification:
  - `old_demo_emails = 0`
  - `old_demo_names = 0`
  - `staging_total = 125`
- Direct SQL spot checks confirmed refreshed landlord/student rows now expose realistic Vietnamese `full_name`, `email`, `phone`, `avatar_url`, and `bio`

## Documentation Updates

- Added the rollout summary and live verification details to `docs/ai/monitoring/project-status.md`
- Captured this task log as the execution record for the staging demo identity refresh

## Follow-ups

- If the product later needs demo identities to look even closer to real production data, extend the same deterministic persona pattern to partner/company demo records in `staging_demo.sql`
