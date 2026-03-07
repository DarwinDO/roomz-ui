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

_To be filled during execution._

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
