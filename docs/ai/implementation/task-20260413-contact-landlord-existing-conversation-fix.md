---
phase: implementation
title: Contact Landlord Existing Conversation Fix
date: 2026-04-13
owner: Codex
status: completed
---

# Contact Landlord Existing Conversation Fix

## Summary

- Fixed the live room-detail messaging regression where reopening an existing landlord thread from the contact modal failed before messages could load.
- Root cause was in the database RPC `public.get_or_create_conversation`, not in the modal UI.

## Problem

- `ContactLandlordModal` always calls `get_or_create_conversation(user, landlord, roomId, roomTitle)` when opening.
- When a matching conversation already existed for that room, the function entered its update branch.
- That branch used `COALESCE(public.conversations.room_title_snapshot, room_title_snapshot)`, where `room_title_snapshot` was ambiguous between the column name and the function parameter.
- Postgres raised `column reference "room_title_snapshot" is ambiguous`, so the modal fell into its catch block and showed `Không thể tải tin nhắn`.

## Changes

- Added migration `supabase/migrations/20260413211500_fix_get_or_create_conversation_room_title_snapshot_ambiguity.sql`.
- Qualified the function parameter explicitly via `get_or_create_conversation.room_title_snapshot` anywhere it could conflict with the table column.
- Kept the RPC signature unchanged so existing web/mobile calls do not need app-side changes.

## Validation

- Applied the migration to live Supabase project `vevnoxlgwisdottaifdn`.
- Verified the updated function body now references `get_or_create_conversation.room_title_snapshot` in the existing-conversation update path.
- Confirmed `docs/ai` structure with `npx ai-devkit@latest lint`.
