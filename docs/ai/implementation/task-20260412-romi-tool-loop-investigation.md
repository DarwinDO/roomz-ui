---
phase: implementation
task: romi-tool-loop-investigation
date: 2026-04-12
status: complete
---

# Task Log: ROMI Tool Loop Investigation

## Goal

- Investigate the latest ROMI conversation failures where the assistant returned dozens of repeated tool-result blocks instead of a normal answer.
- Harden the chatbot pipeline so repeated identical tool calls do not flood the stored assistant response.

## Files

- `packages/shared/src/services/ai-chatbot/intake.ts`
- `packages/shared/src/services/ai-chatbot/text.ts`
- `packages/web/src/services/romi.test.ts`
- `supabase/functions/ai-chatbot/index.ts`
- `supabase/functions/ai-chatbot/planner.ts`
- `supabase/functions/ai-chatbot/catalog-search.ts`
- `supabase/functions/ai-chatbot/tool-result-utils.ts`
- `supabase/functions/ai-chatbot/tool-result-utils_test.ts`
- `docs/ai/monitoring/project-status.md`
- `docs/ai/implementation/feature-ai-chatbot.md`
- `docs/ai/implementation/task-20260412-romi-tool-loop-investigation.md`

## What Changed

- Reviewed live `ai_chat_sessions`, `ai_chat_messages`, and `analytics_events` data for the most recent broken ROMI sessions.
- Confirmed the repeated `Kết quả N (search_locations)` payload was already persisted in `public.ai_chat_messages`, so the issue was not caused by frontend rendering alone.
- Identified a broken room-search session (`67d7eec2-ac25-42dd-8692-786eebe30a8f`) where the stored assistant message finished with `finishReason: "error"` and contained `34` duplicated `search_locations` tool results.
- Found a second session (`092c9fba-274b-4c97-a896-b222aa05804f`) with the same failure mode for `search_deals`, confirming the bug was not limited to one tool.
- Tightened room-search intent carry-forward rules so short meta reactions and complaint-style follow-ups no longer inherit `room_search` unless they contain explicit room/detail/refinement cues.
- Repaired likely UTF-8 mojibake before Vietnamese normalization so accented prompts still classify correctly even if an upstream layer mangles them into sequences like `tÃ´i muá»‘n...`.
- Added word boundaries to room-search follow-up hints so short complaint text such as `ngáo à?` cannot trigger the `ga` location token inside `ngao`.
- Added shared tool-result deduplication utilities and applied them before fallback response formatting, message persistence, and analytics emission.
- Added per-request tool execution caching so identical repeated tool calls within the same turn reuse the first result instead of re-executing the same backend query repeatedly.
- Added focused tests for the room-intent regression and the tool-result deduplication helper.
- Redeployed `supabase/functions/ai-chatbot` to live after the hardening and re-verified the exact stream flow that was failing in production.

## Root Cause

- The live runtime misclassified some follow-up/meta turns as tool-driven search turns when they should have been answered conversationally.
- Once the model entered that tool path, it executed the same tool many times with effectively identical input in a single response.
- When the model failed to produce a natural-language answer and only tool results remained, the fallback formatter dumped every tool result block into the final assistant message.
- A separate follow-up regression came from overly loose substring matching in room-search carry-forward hints, where the `ga` token could match inside complaint text like `ngao`.
- Earlier in the investigation, the deployed Supabase Edge Function was behind local code; that deployment drift has now been corrected.

## Validation

- `npx ai-devkit@latest lint`: pass
- `npm run test:unit --workspace=@roomz/web -- src/services/romi.test.ts`: pass
- `deno test supabase/functions/ai-chatbot/planner_test.ts supabase/functions/ai-chatbot/tool-result-utils_test.ts`: pass
- `deno check supabase/functions/ai-chatbot/index.ts`: pass
- `npm run build --workspace=@roomz/web`: pass
- direct SQL inspection on live chatbot tables: pass, repeated tool-loop evidence confirmed in stored messages and analytics logs
- live stream smoke verification after redeploy: pass
  - accented room-search prompt resolves to `room_search` + `search_rooms`
  - ordinal follow-up resolves to `room_detail` + `get_room_details`
  - complaint follow-up resolves to `general` with no tool calls

## Documentation Updates

- Updated `docs/ai/monitoring/project-status.md`
- Updated `docs/ai/implementation/feature-ai-chatbot.md`
- Added `docs/ai/implementation/task-20260412-romi-tool-loop-investigation.md`

## Follow-ups

- ~~Redeploy the `ai-chatbot` Supabase Edge Function so production runtime matches the hardened local code.~~ Done.
- ~~Add a guardrail that caps repeated tool invocations per tool name and input signature within one assistant turn.~~ Done.
- Add regression coverage for tool-loop fallback formatting at the service boundary, not only helper/unit level.
- Consider improving the non-tool conversational fallback for complaint-style turns so ROMI apologizes and recovers context instead of returning the generic `thử lại giúp mình` sentence.
