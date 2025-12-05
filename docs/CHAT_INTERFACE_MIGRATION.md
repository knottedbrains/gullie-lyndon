# Chat Interface Migration Guide

## Key Changes Needed

### Old API (chat.*)
```typescript
// Create session (optional moveId)
trpc.chat.create.useMutation({ moveId?: string })

// Get history
trpc.chat.getHistory.useQuery({ sessionId: string })

// Send message
trpc.chat.sendMessage.useMutation({ sessionId, message, config })

// Get session
trpc.chat.getSession.useQuery({ sessionId })
```

### New API (conversations.*)
```typescript
// Get or create conversation for a move (moveId REQUIRED)
trpc.conversations.getOrCreateDefault.useMutation({ moveId: string })

// Get messages
trpc.conversations.getMessages.useQuery({ conversationId: string })

// Send message
trpc.conversations.sendMessage.useMutation({ conversationId, message, config })

// Get conversation details
trpc.conversations.get.useQuery({ conversationId })
```

## Migration Strategy

**Phase 1: Minimal Update (Current)**
- Change chat interface to use conversations API
- Keep URL structure simple for now: `/chat?moveId={moveId}`
- Auto-create/get default conversation for the move
- Keep existing UI components

**Phase 2: Full Update (Later)**
- Add conversations list sidebar
- Support multiple conversations per move
- Update URL: `/moves/{moveId}/conversations/{conversationId}`
- Add conversation switching

## Implementation

### Step 1: Update ChatInterface Component

**Changes:**
1. Replace `sessionId` state with `conversationId`
2. Make `moveId` required (get from URL or create default move)
3. Use `getOrCreateDefault` instead of `create`
4. Use `getMessages` instead of `getHistory`
5. Use conversations `sendMessage` instead of chat `sendMessage`

###Step 2: Handle URL Parameters

**Current:** `/chat?id={sessionId}&moveId={moveId}`
**Transition:** `/chat?moveId={moveId}` (auto-get conversation)
**Future:** `/moves/{moveId}/conversations/{conversationId}`

### Step 3: Backward Compatibility

Keep old `chat` router working temporarily, but primary flow uses `conversations`.

## Code Changes

See: `src/components/chat/chat-interface-v2.tsx` for updated implementation
