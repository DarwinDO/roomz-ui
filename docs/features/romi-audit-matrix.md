# ROMI Audit Matrix

## Scope
Audit of the current AI chatbot across web, mobile, edge runtime, data grounding, and product fit.

## Current Verdict
ROMI is live and now has grounded search tools for rooms, partners, deals, and locations, shared capability copy, telemetry, action-oriented navigation, and admin-facing debug visibility. The next gaps are downstream conversion tracking, stronger empty-result handling, and a dedicated ROMI operations view if usage grows.

## Evidence Snapshot
- Active edge function: `ai-chatbot` version 23
- AI chat usage in production DB: 9 sessions, 30 messages
- Tool calls observed in production DB: only `search_rooms` (2 calls)
- Active inventory now reachable by ROMI tools: 55 active partners, 30 active deals, 19 catalog locations

## Audit Matrix
| Area | Current State | Evidence | Verdict |
|---|---|---|---|
| Web chatbot shell | Branded as `ROMI` with cleaned copy | `packages/web/src/components/common/Chatbot.tsx` | P0 done |
| Mobile chatbot shell | Branded as `ROMI` with cleaned copy | `packages/mobile/components/AIChatbot.tsx` | P0 done |
| Edge function prompt/copy | Cleaned and aligned to ROMI | `supabase/functions/ai-chatbot/index.ts` | P0 done |
| Room search tool | Uses canonical `public.search_rooms(...)` RPC | `supabase/functions/ai-chatbot/index.ts` vs `packages/shared/src/services/rooms.ts` | P0 done |
| Room details tool | Minimal direct table lookup | `supabase/functions/ai-chatbot/index.ts` | Keep for now, improve later |
| App info tool | Grounded through shared ROMI capability constants | `packages/shared/src/constants/romi.ts`, `supabase/functions/ai-chatbot/index.ts` | P1.5 done |
| Partner/service search | Grounded tool using live partner data | `supabase/functions/ai-chatbot/index.ts` | P1 done |
| Deal/perk search | Grounded tool using live deals + premium lock state | `supabase/functions/ai-chatbot/index.ts` | P1 done |
| Location search | Grounded tool using `search_location_catalog(...)` | `supabase/functions/ai-chatbot/index.ts` | P1 done |
| Telemetry | ROMI now emits open, prompt click, message, response, tool, error, and action click events | `packages/web/src/services/analyticsTracking.ts`, `packages/shared/src/services/analytics.ts`, `supabase/functions/ai-chatbot/index.ts` | P1.5 done |
| Action-oriented navigation | ROMI now returns actions that deep-link users into search, room, Local Passport, payment, services, verification, roommates, and swap | `supabase/functions/ai-chatbot/index.ts`, `packages/web/src/components/common/Chatbot.tsx` | P2 done |
| Prefilled product flows | Search and Local Passport now accept ROMI-provided query context | `packages/web/src/pages/SearchPage.tsx`, `packages/web/src/pages/LocalPassportPage.tsx` | P2 done |
| Admin/debug visibility | ROMI tool health, response rate, action CTR, and recent errors are visible in admin analytics | `packages/web/src/pages/admin/AnalyticsPage.tsx`, `packages/web/src/services/analytics.ts`, `supabase/migrations/20260313101500_add_romi_analytics_debug.sql` | P2 done |
| Responsibility boundaries | Chatbot no longer proxies crawl operations | `packages/web/src/services/ingestionReview.ts` and `supabase/functions/ai-chatbot/index.ts` | P0 done |

## What ROMI Does Well Today
- Persists chat sessions and messages.
- Handles authenticated user context.
- Can answer simple FAQ-style questions.
- Can attempt room search.

## What ROMI Still Does Poorly
- It still does not have a dedicated ROMI ops page; debug data currently lives inside the broader admin analytics page.
- It still does not track downstream conversion deeply enough after a user clicks a ROMI action.
- It still needs more polished answer formatting and stronger empty-result handling for product-grade UX.

## Product Positioning Recommendation
ROMI should be positioned as:

> The RommZ assistant for finding rooms, discovering services and deals, and guiding users to the right product flow.

ROMI should not be treated as a general chatbot.

## Recommended Tool Set
### P0
- `search_rooms` via canonical RPC
- `get_room_details` basic details

### P1
- `search_partners`
- `search_deals`
- `search_locations`

### P1.5
- `get_app_capability` backed by a shared source of truth
- chatbot analytics events and tool outcome telemetry

### P2
- deep links and prefilled actions
- admin/debug visibility for ROMI health

## P0 Delivery
1. Rename all chatbot surfaces to `ROMI`.
2. Clean up mojibake/copy drift in web, mobile, shared API, and edge function.
3. Remove crawl fallback coupling from ROMI.
4. Route room search through `public.search_rooms(...)`.

## P1 Delivery
1. Add grounded tools for partners, deals, and locations.
2. Respect premium lock state when ROMI surfaces Local Passport deals.
3. Keep room search aligned with the canonical search RPC.

## P0 Completed
- ROMI returns room results from the same source of truth as the search page.
- ROMI no longer proxies crawl operations.
- ROMI branding and copy are clean across web and mobile.
- The repo has one written audit source for future implementation decisions.

## P1 Completed
- ROMI can search partners from live Local Passport partner data.
- ROMI can search deals from live Local Passport deal data and mark premium-locked deals correctly.
- ROMI can search locations from `location_catalog` through the same RPC used by the product.

## P1.5 Completed
- ROMI capability answers now come from a shared constants layer used by web, mobile, and edge.
- ROMI emits analytics events for open, suggested prompt clicks, message sent, response received, tool called, error outcomes, and action clicks.
- `ai-chatbot` version 23 is live with the new telemetry and capability grounding.

## P2 Completed
- ROMI can direct users into the correct product flow with useful next actions.
- ROMI can prefill search and Local Passport flows from chat context.
- Admin can inspect ROMI tool health, response rate, action CTR, and recent errors.

## Success Criteria For The Next Step
- ROMI can measure downstream conversion after a user clicks a chat action.
- ROMI can expose empty-result rate and common failure patterns more explicitly.
- ROMI can guide users into deeper product flows with less generic fallback copy.
