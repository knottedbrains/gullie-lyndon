# Schema Migration: Chat → Conversations

## Overview

Migrating from standalone chat sessions to move-centric conversations with multi-participant support.

---

## Current Schema (BEFORE)

```typescript
// chatSessions table
{
  id: uuid (PK)
  moveId: uuid (FK → moves.id, OPTIONAL) ❌
  title: text
  createdAt: timestamp
  updatedAt: timestamp
  agentMailInboxId: text
  agentMailEmailAddress: text
}

// chatMessages table
{
  id: uuid (PK)
  sessionId: uuid (FK → chatSessions.id)
  role: enum('user', 'assistant', 'system') ❌ Limited roles
  content: text
  toolCalls: jsonb
  metadata: jsonb
  reasoning: text
  model: text
  createdAt: timestamp
}
```

---

## New Schema (AFTER)

```typescript
// conversations table
{
  id: uuid (PK)
  moveId: uuid (FK → moves.id, NOT NULL) ✅ Required
  title: text
  type: enum('housing', 'moving', 'services', 'budget', 'general', 'vendor', 'internal')
  status: enum('active', 'archived', 'closed')
  createdBy: text (FK → users.id)
  agentMailInboxId: text
  agentMailEmailAddress: text
  createdAt: timestamp
  updatedAt: timestamp
}

// conversation_participants table (NEW)
{
  id: uuid (PK)
  conversationId: uuid (FK → conversations.id)
  userId: text (FK → users.id, nullable for AI)
  participantType: enum('employee', 'admin', 'vendor', 'ai', 'system')
  role: enum('owner', 'participant', 'observer')
  joinedAt: timestamp
  lastReadAt: timestamp
}

// messages table (renamed from chatMessages)
{
  id: uuid (PK)
  conversationId: uuid (FK → conversations.id)
  authorId: text (FK → users.id, nullable for AI)
  authorType: enum('user', 'ai', 'system')
  content: text
  toolCalls: jsonb
  reasoning: text
  model: text
  metadata: jsonb {
    isEmail: boolean
    emailFrom: string
    emailTo: string[]
    emailSubject: string
    mentioned: string[] // @mentions
  }
  createdAt: timestamp
}
```

---

## Migration Steps

### Step 1: Create New Enums

```sql
-- Conversation type enum
CREATE TYPE conversation_type AS ENUM (
  'housing',
  'moving',
  'services',
  'budget',
  'general',
  'vendor',
  'internal'
);

-- Conversation status enum
CREATE TYPE conversation_status AS ENUM (
  'active',
  'archived',
  'closed'
);

-- Participant type enum
CREATE TYPE participant_type AS ENUM (
  'employee',
  'admin',
  'vendor',
  'ai',
  'system'
);

-- Participant role enum
CREATE TYPE participant_role AS ENUM (
  'owner',
  'participant',
  'observer'
);

-- Author type enum
CREATE TYPE author_type AS ENUM (
  'user',
  'ai',
  'system'
);
```

### Step 2: Create New Tables

```sql
-- conversations table
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  move_id UUID NOT NULL REFERENCES moves(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New Conversation',
  type conversation_type DEFAULT 'general',
  status conversation_status DEFAULT 'active',
  created_by TEXT REFERENCES users(id),
  agent_mail_inbox_id TEXT,
  agent_mail_email_address TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_conversations_move_id ON conversations(move_id);
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_conversations_created_by ON conversations(created_by);

-- conversation_participants table
CREATE TABLE conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  participant_type participant_type NOT NULL,
  role participant_role DEFAULT 'participant',
  joined_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_read_at TIMESTAMP
);

CREATE INDEX idx_participants_conversation_id ON conversation_participants(conversation_id);
CREATE INDEX idx_participants_user_id ON conversation_participants(user_id);
CREATE UNIQUE INDEX idx_participants_conversation_user ON conversation_participants(conversation_id, user_id);

-- messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  author_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  author_type author_type NOT NULL DEFAULT 'user',
  content TEXT NOT NULL,
  tool_calls JSONB,
  reasoning TEXT,
  model TEXT,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_author_id ON messages(author_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
```

### Step 3: Data Migration

```sql
-- Migrate chatSessions → conversations
-- Only migrate sessions that have a moveId
INSERT INTO conversations (
  id,
  move_id,
  title,
  type,
  status,
  created_by,
  agent_mail_inbox_id,
  agent_mail_email_address,
  created_at,
  updated_at
)
SELECT
  cs.id,
  cs.move_id,
  cs.title,
  'general'::conversation_type, -- Default type
  'active'::conversation_status, -- Default status
  NULL, -- created_by (we don't track this yet)
  cs.agent_mail_inbox_id,
  cs.agent_mail_email_address,
  cs.created_at,
  cs.updated_at
FROM chat_sessions cs
WHERE cs.move_id IS NOT NULL; -- Only migrate sessions with moves

-- Handle orphaned sessions (no moveId)
-- Option 1: Create a "default" move for orphaned chats
-- Option 2: Delete them (if acceptable)
-- Option 3: Manual review and assignment

-- For now, log orphaned sessions
SELECT id, title, created_at
FROM chat_sessions
WHERE move_id IS NULL;

-- Migrate chatMessages → messages
INSERT INTO messages (
  id,
  conversation_id,
  author_id,
  author_type,
  content,
  tool_calls,
  reasoning,
  model,
  metadata,
  created_at
)
SELECT
  cm.id,
  cm.session_id, -- This becomes conversation_id
  NULL, -- author_id (we'll infer from role)
  CASE
    WHEN cm.role = 'assistant' THEN 'ai'::author_type
    WHEN cm.role = 'system' THEN 'system'::author_type
    ELSE 'user'::author_type
  END,
  cm.content,
  cm.tool_calls,
  cm.reasoning,
  cm.model,
  cm.metadata,
  cm.created_at
FROM chat_messages cm
WHERE cm.session_id IN (SELECT id FROM conversations); -- Only migrate messages from migrated conversations

-- Create AI participant for each conversation
INSERT INTO conversation_participants (
  conversation_id,
  user_id,
  participant_type,
  role
)
SELECT
  id,
  NULL, -- AI doesn't have a user_id
  'ai'::participant_type,
  'participant'::participant_role
FROM conversations;

-- Try to infer employee participants from moves
INSERT INTO conversation_participants (
  conversation_id,
  user_id,
  participant_type,
  role
)
SELECT
  c.id,
  u.id,
  'employee'::participant_type,
  'owner'::participant_role
FROM conversations c
JOIN moves m ON c.move_id = m.id
JOIN employees e ON m.employee_id = e.id
JOIN users u ON u.email = e.email -- Link by email
WHERE u.id IS NOT NULL;
```

### Step 4: Validation

```sql
-- Check migration counts
SELECT
  'chatSessions' as table_name,
  COUNT(*) as count
FROM chat_sessions

UNION ALL

SELECT
  'conversations' as table_name,
  COUNT(*) as count
FROM conversations

UNION ALL

SELECT
  'chatMessages' as table_name,
  COUNT(*) as count
FROM chat_messages

UNION ALL

SELECT
  'messages' as table_name,
  COUNT(*) as count
FROM messages;

-- Check for orphaned data
SELECT 'Orphaned sessions' as issue, COUNT(*) as count
FROM chat_sessions
WHERE move_id IS NULL

UNION ALL

SELECT 'Orphaned messages' as issue, COUNT(*) as count
FROM chat_messages cm
WHERE NOT EXISTS (
  SELECT 1 FROM conversations c WHERE c.id = cm.session_id
);

-- Verify participant counts
SELECT
  c.id,
  c.title,
  COUNT(cp.id) as participant_count
FROM conversations c
LEFT JOIN conversation_participants cp ON cp.conversation_id = c.id
GROUP BY c.id, c.title
HAVING COUNT(cp.id) = 0; -- Should be empty (all conversations should have at least AI)
```

### Step 5: Drop Old Tables (AFTER VERIFICATION)

```sql
-- ONLY run after thorough testing and backup!
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS chat_sessions CASCADE;

-- Drop old enums if not used elsewhere
DROP TYPE IF EXISTS message_role;
```

---

## Drizzle Migration Files

### File: `drizzle/migrations/0001_conversations.sql`

```sql
-- Create enums
CREATE TYPE conversation_type AS ENUM ('housing', 'moving', 'services', 'budget', 'general', 'vendor', 'internal');
CREATE TYPE conversation_status AS ENUM ('active', 'archived', 'closed');
CREATE TYPE participant_type AS ENUM ('employee', 'admin', 'vendor', 'ai', 'system');
CREATE TYPE participant_role AS ENUM ('owner', 'participant', 'observer');
CREATE TYPE author_type AS ENUM ('user', 'ai', 'system');

-- Create conversations table
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  move_id UUID NOT NULL REFERENCES moves(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New Conversation',
  type conversation_type DEFAULT 'general',
  status conversation_status DEFAULT 'active',
  created_by TEXT REFERENCES users(id),
  agent_mail_inbox_id TEXT,
  agent_mail_email_address TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_conversations_move_id ON conversations(move_id);
CREATE INDEX idx_conversations_status ON conversations(status);

-- Create conversation_participants table
CREATE TABLE conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  participant_type participant_type NOT NULL,
  role participant_role DEFAULT 'participant',
  joined_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_read_at TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_participants_conversation_id ON conversation_participants(conversation_id);
CREATE INDEX idx_participants_user_id ON conversation_participants(user_id);
CREATE UNIQUE INDEX idx_participants_conversation_user ON conversation_participants(conversation_id, user_id);

-- Create messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  author_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  author_type author_type NOT NULL DEFAULT 'user',
  content TEXT NOT NULL,
  tool_calls JSONB,
  reasoning TEXT,
  model TEXT,
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_author_id ON messages(author_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
```

### File: `drizzle/migrations/0002_migrate_data.sql`

```sql
-- Migrate chat_sessions → conversations (only those with moveId)
INSERT INTO conversations (id, move_id, title, type, status, agent_mail_inbox_id, agent_mail_email_address, created_at, updated_at)
SELECT id, move_id, title, 'general', 'active', agent_mail_inbox_id, agent_mail_email_address, created_at, updated_at
FROM chat_sessions
WHERE move_id IS NOT NULL;

-- Migrate chat_messages → messages
INSERT INTO messages (id, conversation_id, author_type, content, tool_calls, reasoning, model, metadata, created_at)
SELECT
  cm.id,
  cm.session_id,
  CASE
    WHEN cm.role = 'assistant' THEN 'ai'::author_type
    WHEN cm.role = 'system' THEN 'system'::author_type
    ELSE 'user'::author_type
  END,
  cm.content,
  cm.tool_calls,
  cm.reasoning,
  cm.model,
  cm.metadata,
  cm.created_at
FROM chat_messages cm
WHERE cm.session_id IN (SELECT id FROM conversations);

-- Create AI participants
INSERT INTO conversation_participants (conversation_id, participant_type, role)
SELECT id, 'ai', 'participant'
FROM conversations;
```

### File: `drizzle/migrations/0003_drop_old_tables.sql`

```sql
-- ONLY run after verification!
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS chat_sessions CASCADE;
```

---

## Rollback Plan

If migration fails, we can rollback:

```sql
-- Restore from backup
-- DROP new tables
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversation_participants CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;

-- DROP new enums
DROP TYPE IF EXISTS author_type;
DROP TYPE IF EXISTS participant_role;
DROP TYPE IF EXISTS participant_type;
DROP TYPE IF EXISTS conversation_status;
DROP TYPE IF EXISTS conversation_type;

-- Restore old tables from backup
-- psql -U user -d database < backup.sql
```

---

## Testing Checklist

Before dropping old tables:

- [ ] All conversations have valid moveId
- [ ] Message counts match (chat_messages = messages)
- [ ] All conversations have at least one participant (AI)
- [ ] No orphaned messages
- [ ] Sample conversations load correctly in UI
- [ ] Can create new conversations
- [ ] Can send messages
- [ ] Backend APIs work with new schema
- [ ] Performance is acceptable (< 200ms for queries)

---

## Notes

- **Backup database before migration!**
- Run migration in transaction if possible
- Test on staging environment first
- Monitor performance after migration
- Keep old tables for 1 week before dropping (just in case)
