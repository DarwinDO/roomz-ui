---
phase: implementation
feature: ai-chatbot
title: AI Chatbot - Implementation Guide
description: Technical implementation notes for AI chatbot feature
---

# AI Chatbot — Implementation Guide

> This document will be filled during Phase 4 (Execute Plan).

## Development Setup

- Gemini API key required: Get from [Google AI Studio](https://aistudio.google.com/)
- Set in Supabase: `supabase secrets set GEMINI_API_KEY=<key>`
- Edge Function dev: `supabase functions serve ai-chatbot --env-file .env`

## Code Structure

```
packages/shared/src/services/ai-chatbot/    # Shared API + types
packages/web/src/hooks/useAIChatbot.ts       # Web hook
packages/web/src/components/common/Chatbot.tsx  # Web UI (upgrade)
packages/mobile/src/hooks/useAIChatbot.ts    # Mobile hook
packages/mobile/components/AIChatbot.tsx     # Mobile UI
packages/mobile/components/AIChatMessage.tsx # Mobile message bubble
supabase/functions/ai-chatbot/index.ts       # Edge Function
supabase/migrations/*_ai_chatbot.sql         # DB migration
```

## Implementation Notes

- Edge Function `supabase/functions/ai-chatbot/index.ts` migrated from manual Gemini REST calls to Vercel AI SDK (`ai` + `@ai-sdk/google`) for unified tool-calling orchestration.
- Intent-gated tool injection is preserved via `getToolsForMessage(...)`; tools are only attached when message/context indicates room search, room detail lookup, or app info lookup.
- Forced tool path for room-search and room-detail intents is preserved with `toolChoice` and bounded with `stopWhen: stepCountIs(1)` to avoid multi-step loops.
- Tool outputs are converted to deterministic text through local formatters (`formatSearchRoomsReply`, `formatRoomDetailsReply`) to reduce hallucinated room data.
- Retry-on-429 behavior is retained via `generateTextWithRetry(...)` exponential backoff wrapper.
- Existing reliability/security improvements were kept: DB-backed rate limit, strict session ownership check, CORS allowlist, and optional internal error detail exposure via `EXPOSE_INTERNAL_ERRORS`.

## Integration Points

- Edge Function → Gemini API (REST)
- Edge Function → Supabase DB (server-side client)
- Client → Edge Function (via Supabase client `functions.invoke`)
- Shared types consumed by both Web and Mobile

## Error Handling

- Gemini API errors → Fallback message + log
- Rate limiting → 429 response with retry-after
- Auth errors → 401 redirect to login
- Network errors → Client-side retry with exponential backoff

## Security Notes

- Gemini API key: server-side only (Edge Function env)
- JWT verification on every request
- RLS policies on AI chat tables
- Input sanitization before sending to Gemini
