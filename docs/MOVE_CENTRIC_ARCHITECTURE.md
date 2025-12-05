# Move-Centric Architecture Redesign

## Executive Summary

**Problem**: Current architecture treats chat sessions as primary containers with optional move references. This creates fragmented conversations and loses context when multiple stakeholders discuss the same relocation project.

**Solution**: Redesign to make Moves the primary container with multiple conversations (with multiple participants) nested within each move.

---

## Current Architecture (Problems)

### Schema

```
chatSessions
├── id (uuid)
├── moveId (uuid, optional) ❌ Optional means orphaned chats
├── title (text)
├── agentMailInboxId
└── agentMailEmailAddress

chatMessages
├── id (uuid)
├── sessionId (uuid) → chatSessions.id
├── role (enum: user, assistant, system) ❌ Only 3 roles, no participant tracking
├── content (text)
├── toolCalls (jsonb)
├── metadata (jsonb)
└── createdAt (timestamp)

moves
├── id (uuid)
├── employeeId (uuid) → employees.id
├── employerId (uuid) → employers.id
├── policyId (uuid) → policies.id
├── status (enum)
└── ... (move details)
```

### Problems

1. **❌ Orphaned Conversations**: moveId is optional, conversations can exist without move context
2. **❌ No Conversation Organization**: Can't see all conversations for a move
3. **❌ Limited Participant Tracking**: Only 3 roles (user/assistant/system), no multi-user support
4. **❌ Context Fragmentation**: Each conversation is isolated
5. **❌ Poor UX for Coordinators**: Can't switch between stakeholder conversations for same move
6. **❌ No Conversation Types**: Can't distinguish "Employee Intake" from "Vendor Quote Discussion"

### Current User Flow

```
User → Creates Chat → Maybe links to Move → Messages in isolation
```

No way to:
- See all conversations about Move #123
- Switch between employee/vendor conversations for same move
- Track who said what
- Maintain shared context across conversations

---

## New Architecture (Solution)

### Core Principles

1. **Move is the Container**: All conversations belong to a move
2. **Conversations Have Purpose**: Labeled by type/topic (Housing, Moving, Budget, etc.)
3. **Multi-Participant**: Users and AI can both be in conversations
4. **Shared Context**: Policy status and move data visible across all conversations
5. **Role-Based Access**: Employees see their move, admins see all moves, vendors see assigned moves

### New Schema

```sql
-- MOVES (Primary Container)
moves
├── id (uuid) PRIMARY KEY
├── employeeId (uuid) → employees.id
├── employerId (uuid) → employers.id
├── policyId (uuid) → policies.id
├── status (enum: initiated, in_progress, completed, cancelled)
├── ... (existing move fields)

-- CONVERSATIONS (Nested in Moves)
conversations
├── id (uuid) PRIMARY KEY
├── moveId (uuid) → moves.id NOT NULL ✅ Required
├── title (text) "Housing Options Discussion"
├── type (enum) housing, moving, services, budget, general, vendor, internal
├── status (enum) active, archived, closed
├── createdBy (text) → users.id
├── agentMailInboxId (text, optional)
├── agentMailEmailAddress (text, optional)
├── createdAt (timestamp)
└── updatedAt (timestamp)

-- CONVERSATION PARTICIPANTS (Many-to-Many)
conversation_participants
├── id (uuid) PRIMARY KEY
├── conversationId (uuid) → conversations.id
├── userId (text) → users.id (nullable for AI)
├── participantType (enum) employee, admin, vendor, ai, system
├── joinedAt (timestamp)
└── lastReadAt (timestamp) -- for unread indicators

-- MESSAGES (Same as before, but linked to conversations)
messages
├── id (uuid) PRIMARY KEY
├── conversationId (uuid) → conversations.id
├── authorId (text) → users.id (nullable for AI)
├── authorType (enum) user, ai, system
├── content (text)
├── toolCalls (jsonb)
├── reasoning (text) -- for AI reasoning
├── model (text) -- for AI model tracking
├── metadata (jsonb)
├── createdAt (timestamp)

-- MESSAGE METADATA can include:
{
  "isEmail": true,
  "emailFrom": "vendor@example.com",
  "emailTo": ["admin@gullie.com"],
  "emailSubject": "Housing Options Ready",
  "mentioned": ["user_123", "user_456"] -- @mentions
}
```

### Key Changes

1. ✅ **conversations.moveId is required**: No orphaned conversations
2. ✅ **conversation_participants table**: Track multiple users in one conversation
3. ✅ **Conversation types**: housing, moving, services, budget, general, vendor, internal
4. ✅ **messages.authorId**: Track who sent each message (user or AI)
5. ✅ **Participant types**: employee, admin, vendor, ai, system

---

## User Experience Flows

### For Employees (Simple View)

```
Email: "Your relocation is starting!"
↓
Click link → `/moves/{moveId}`
↓
┌─────────────────────────────────────────────────┐
│  Your Relocation: SF → NYC                      │
├──────────────────────┬──────────────────────────┤
│  Conversations       │  Your Progress           │
├──────────────────────┤                          │
│ 💬 Main Discussion   │  ✅ Move initiated       │
│    (Active)          │  🔄 Housing search       │
│                      │  ⏳ Moving company       │
│ [Messages]           │  ⏳ Budget approval      │
│                      │                          │
│ [Type here...]       │  Move Date: Jan 15       │
│                      │  Budget: $50,000         │
└──────────────────────┴──────────────────────────┘
```

- One main conversation (keep it simple)
- Can see their progress
- Can ask anything about their move

### For Admins (Full Power)

```
Dashboard → Moves List → Select "Jane Doe - SF to NYC"
↓
URL: /moves/{moveId}/conversations/{conversationId}
↓
┌────────────┬──────────────────────┬─────────────┐
│Conversations│  Housing Options    │  Progress   │
│            │  (with vendor)       │             │
├────────────┤                      ├─────────────┤
│+ New       │ [Chat Interface]     │ Policy      │
│            │                      │ Status      │
│💬 Employee │ Vendor: "Found 3     │             │
│   Intake   │ options..."          │ ✅ Initiated│
│   👤 Jane  │                      │ 🔄 Housing  │
│            │ You (Admin): "Send   │ ⏳ Moving   │
│🏠 Housing  │ option 2 to Jane"    │             │
│   Options  │                      │ Budget:     │
│   ⭐ ACTIVE│ AI: "Sent! Jane will │ $50k        │
│   👤 Vendor│ receive email"       │             │
│   🤖 AI    │                      │ Move Date:  │
│            │ [Type message...]    │ Jan 15      │
│📦 Moving   │                      │             │
│   Quote    │ Quick Actions:       │             │
│   👤 Mover │ • @ Mention Jane     │             │
│   🤖 AI    │ • Create Task        │             │
│            │ • Send Email         │             │
│💰 Budget   │                      │             │
│   Review   │                      │             │
│   👤 Admin │                      │             │
└────────────┴──────────────────────┴─────────────┘
```

### For Vendors (Assigned Moves)

```
Dashboard → My Assigned Moves → "Jane Doe - SF to NYC"
↓
┌────────────┬──────────────────────┬─────────────┐
│Conversations│  Housing Discussion │  Project    │
│            │  (with admin & AI)   │  Details    │
├────────────┤                      ├─────────────┤
│🏠 Housing  │ Admin: "Jane needs   │ Employee:   │
│   Request  │ 2BR, urban, <$3k"    │ Jane Doe    │
│   ⭐ ACTIVE│                      │             │
│   👤 Admin │ You: "Found 3        │ Location:   │
│   🤖 AI    │ options, sending     │ SF → NYC    │
│            │ details now..."      │             │
│📝 Follow-up│                      │ Budget:     │
│            │ [Type message...]    │ $50k        │
│            │                      │             │
│            │ [Attach: listings]   │ Move Date:  │
│            │                      │ Jan 15      │
└────────────┴──────────────────────┴─────────────┘
```

---

## Implementation Plan

### Phase 1: Database Migration ⚡ (Day 1-2)

**Tasks:**
1. Create new tables: `conversations`, `conversation_participants`, `messages`
2. Migrate data from `chatSessions` → `conversations`
3. Migrate data from `chatMessages` → `messages`
4. Add foreign key constraints
5. Create indexes for performance

**Migration Strategy:**
```sql
-- Step 1: Create new tables
CREATE TABLE conversations (...);
CREATE TABLE conversation_participants (...);
CREATE TABLE messages (...);

-- Step 2: Migrate chatSessions → conversations
INSERT INTO conversations (id, moveId, title, ...)
SELECT id, moveId, title, ... FROM chatSessions;

-- Step 3: Migrate chatMessages → messages
INSERT INTO messages (id, conversationId, content, ...)
SELECT id, sessionId, content, ... FROM chatMessages;

-- Step 4: Create AI participant for each conversation
INSERT INTO conversation_participants (conversationId, participantType)
SELECT id, 'ai' FROM conversations;

-- Step 5: Drop old tables (after validation)
DROP TABLE chatMessages;
DROP TABLE chatSessions;
```

### Phase 2: Backend Refactoring 🔧 (Day 2-3)

**Files to Update:**

1. **Schema Files**
   - `src/server/db/tables/chat.ts` → Rename to `conversations.ts`
   - Add `conversation_participants.ts`
   - Add `messages.ts`
   - Update `src/server/db/schema.ts` exports

2. **TRPC Routers**
   - `src/server/routers/chat.router.ts` → Update to use new schema
   - Add methods:
     - `conversations.listByMove` - Get all conversations for a move
     - `conversations.create` - Create conversation with type
     - `conversations.addParticipant` - Add user to conversation
     - `messages.send` - Send message in conversation
     - `messages.list` - Get messages for conversation

3. **Services**
   - `src/server/services/openai-service.ts` - Update to use new schema
   - Add participant awareness (who's in the conversation)

### Phase 3: UI Refactoring 🎨 (Day 3-5)

**Components to Update:**

1. **Navigation**
   - Add move selector/context at top
   - Update routes: `/moves/{moveId}/conversations/{conversationId}`

2. **Sidebar**
   - Replace chat list with:
     - Move context (if in move view)
     - Conversations list (grouped by type)
     - Participant avatars per conversation
     - Unread indicators

3. **Chat Interface**
   - Update to show conversation context
   - Add participant list
   - Add conversation type badge
   - Show who sent each message (avatar + name)

4. **Policy Status Sidebar**
   - Pin to move level (not conversation level)
   - Always visible when in move context

**New Components:**

```
src/components/
├── moves/
│   ├── move-selector.tsx          -- Select move from list
│   ├── move-context.tsx           -- Show current move context
│   └── move-header.tsx            -- Move info in header
├── conversations/
│   ├── conversations-list.tsx     -- List conversations for move
│   ├── conversation-item.tsx      -- Single conversation in list
│   ├── conversation-header.tsx    -- Conv title + participants
│   ├── create-conversation.tsx    -- Dialog to create new conversation
│   └── participant-avatars.tsx    -- Show who's in conversation
└── messages/
    ├── message-list.tsx           -- Messages in conversation
    ├── message-bubble.tsx         -- (Update existing)
    └── message-input.tsx          -- (Update existing)
```

### Phase 4: Role-Based Views 👥 (Day 5-6)

**Employee View:**
- Direct link to their move: `/my-move` → redirects to `/moves/{their_move_id}`
- See one conversation (or a few simple ones)
- Simplified UI

**Admin View:**
- See all moves: `/moves`
- Full conversation management
- Can create any type of conversation
- See all participants

**Vendor View:**
- See assigned moves: `/assigned-moves`
- See only relevant conversations
- Limited to conversations they're invited to

### Phase 5: Multi-Participant Features 🤝 (Day 6-7)

**Features:**
1. **@Mentions**
   - Type `@jane` to mention participants
   - Sends notification/email
   - Highlighted in message

2. **Participant Management**
   - Add/remove participants from conversation
   - See who's active
   - Last read indicators

3. **AI Awareness**
   - AI knows who's in the conversation
   - Can direct responses to specific users
   - "Sending this to Jane..." or "I'll notify the vendor"

4. **Email Integration**
   - Email participants not in platform
   - Email responses create messages
   - Thread preservation

---

## Success Criteria

✅ **Technical:**
- [ ] All conversations linked to moves (no orphans)
- [ ] Multi-user conversations working
- [ ] Messages track author correctly
- [ ] Policy status at move level
- [ ] Zero data loss in migration

✅ **UX:**
- [ ] Admins can see all conversations for a move
- [ ] Easy switching between conversations
- [ ] Clear conversation labels/types
- [ ] Policy status always visible in move context
- [ ] Participants clearly shown

✅ **Performance:**
- [ ] Conversations list loads <100ms
- [ ] Messages load <200ms
- [ ] No N+1 queries
- [ ] Proper indexing on moveId, conversationId

---

## Rollout Plan

**Week 1:**
- Day 1-2: Database migration + testing
- Day 3-4: Backend refactoring + API updates
- Day 5: UI components for move-centric view

**Week 2:**
- Day 1-2: Conversations list + switching
- Day 3-4: Multi-participant features
- Day 5: Role-based views
- Weekend: Testing + bug fixes

**Week 3:**
- User testing
- Performance optimization
- Documentation
- Production deployment

---

## Notes

- Keep backward compatibility during migration
- Add feature flags for gradual rollout
- Monitor performance with new schema
- Gather user feedback early
- Document API changes for integrations
