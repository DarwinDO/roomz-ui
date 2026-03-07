---
phase: testing
feature: ai-chatbot
title: AI Chatbot - Testing Strategy
description: Testing approach for AI chatbot feature
---

# AI Chatbot — Testing Strategy

> This document will be filled during Phase 7 (Write Tests).

## Test Coverage Goals

- Edge Function: Input validation, error handling, rate limiting logic
- Shared API: Request/response formatting, error propagation
- Web UI: Component rendering, user interaction, loading/error states
- Mobile UI: Component rendering, bottom sheet behavior

## Unit Tests

### Edge Function
- [ ] Valid message → returns AI response + sessionId
- [ ] Missing auth → returns 401
- [ ] Empty message → returns 400
- [ ] Rate limit exceeded → returns 429
- [ ] Gemini API error → returns fallback message

### Shared API
- [ ] `sendAIChatMessage` formats request correctly
- [ ] `getAIChatSessions` returns sorted sessions
- [ ] Error handling propagates correctly

## Integration Tests

- [ ] Full flow: send message → Edge Function → Gemini → DB → response
- [ ] Session continuity: multiple messages in same session
- [ ] Function calling: room search returns DB results

## End-to-End Tests

- [ ] Web: Open chatbot → send message → receive AI response
- [ ] Mobile: Open bottom sheet → send message → receive AI response
- [ ] Cross-platform: Send on web → see history on mobile

## Manual Testing

- [ ] Chat about room search → verify function calling returns real rooms
- [ ] Chat in Vietnamese → verify natural language response
- [ ] Spam messages → verify rate limiting kicks in
- [ ] Close/reopen chatbot → verify history persists
