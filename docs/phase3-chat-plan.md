# Phase 3 Chat Implementation Plan

## Overview
Implement realtime messaging/chat feature for RoomZ mobile app (Phase 3)

## Tech Stack
- Expo SDK 55 + React Native 0.83.2
- NativeWind v4 + Tailwind 3.4.0
- TanStack React Query v5
- Zustand
- Supabase (shared services from @roomz/shared)

## Constraints
- DO NOT MODIFY: babel.config.js, metro.config.js, tailwind.config.js, global.css, app.json
- Use className="" syntax for NativeWind
- All chat API services already exist in @roomz/shared

## Available Shared Services

### Chat API (from @roomz/shared)
- getConversations(supabase, userId) - Get conversation list with participants
- getMessages(supabase, conversationId) - Get messages for a conversation
- sendMessage(supabase, conversationId, content, senderId) - Send message
- markMessagesAsRead(supabase, conversationId, userId) - Mark as read
- getOrCreateConversation(supabase, userId, otherUserId) - Get/create conversation
- startConversation(supabase, otherUserId, currentUserId) - Start conversation
- getUnreadCount(supabase, userId) - Get unread count

### Realtime Subscriptions (from @roomz/shared)
- subscribeToConversationMessages(supabase, conversationId, callbacks)
- subscribeToUserMessages(supabase, userId, callbacks)
- createTypingChannel(supabase, conversationId, userId, userName, onTyping)

### Types
```typescript
interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  updated_at: string | null;
  is_read: boolean;
}
interface MessageWithSender extends Message {
  sender?: { id: string; full_name: string; avatar_url: string | null; };
}
interface Conversation {
  id: string;
  participant: UserInfo;
  lastMessage: Message | null;
  unreadCount: number;
  createdAt?: string;
  updatedAt?: string;
  roomId?: string;
  roomTitle?: string;
}
```

## File Structure

### 1. Hooks (packages/mobile/src/hooks/)
- useConversations.ts - useQuery + realtime subscription
- useChatMessages.ts - useQuery + realtime subscription + mark read
- useUnreadCount.ts - useQuery for unread badge
- useSendMessage.ts - useMutation with optimistic UI

### 2. Utils (packages/mobile/src/utils/)
- relativeTime.ts - Format relative time (Vietnamese)

### 3. Components (packages/mobile/components/)
- ConversationItem.tsx - Conversation list row
- MessageBubble.tsx - Chat bubble (left/right variant)
- ChatInput.tsx - Input bar with send button
- TypingIndicator.tsx - "Đang nhập..." animation
- QuickReplies.tsx - Horizontal scroll quick reply buttons
- UnreadBadge.tsx - Red circle badge with number
- RelativeTime.tsx - Display relative time

### 4. Screens
- app/(app)/(tabs)/messages.tsx - Messages tab (REPLACE placeholder)
- app/(app)/chat/[conversationId].tsx - Chat screen (NEW)

### 5. Navigation Updates
- app/(app)/_layout.tsx - Add chat screen route
- app/(app)/(tabs)/_layout.tsx - Add unread badge to Messages tab
- app/(app)/room/[id].tsx - Wire handleMessage callback

## Styling Guide

### Message Bubbles
- Mine (right): bg-primary-500 text-white rounded-2xl rounded-br-sm
- Theirs (left): bg-gray-100 text-text-primary rounded-2xl rounded-bl-sm
- Time text: text-xs text-text-secondary mt-1

### Conversation Item
- Container: flex-row items-center px-4 py-3 bg-surface
- Unread badge: bg-primary-500 rounded-full min-w-[20px] h-5
- Avatar: w-12 h-12 rounded-full bg-primary-100

### Chat Input
- Container: flex-row items-end px-4 py-3 bg-surface border-t border-gray-100
- Input: flex-1 bg-gray-100 rounded-2xl px-4 py-3 max-h-24
- Send button: ml-2 w-10 h-10 rounded-full bg-primary-500

## Quick Replies (Default)
```typescript
const DEFAULT_QUICK_REPLIES = [
    { id: '1', text: 'Tôi quan tâm', icon: '❤️' },
    { id: '2', text: 'Có thể gặp mặt không?', icon: '📅' },
    { id: '3', text: 'Phòng còn available không?', icon: '🏠' },
    { id: '4', text: 'Cảm ơn!', icon: '🙏' },
];
```

## Implementation Order
1. Hooks and Utils (foundation)
2. Chat Components (UI building blocks)
3. Messages Tab screen
4. Chat Screen
5. Navigation updates and Room Detail wiring

## Verification Checklist
- [ ] npx tsc --noEmit - No TypeScript errors
- [ ] npx expo start --clear - Metro bundle success
- [ ] Tab "Tin nhắn" shows conversation list
- [ ] Tap conversation → navigate to chat screen
- [ ] Type message → Send → appears immediately (optimistic)
- [ ] Quick replies display and send correctly
- [ ] Room Detail → "Nhắn tin" creates conversation and navigates
- [ ] New messages from Supabase show realtime
- [ ] Unread badge on Messages tab displays correctly
