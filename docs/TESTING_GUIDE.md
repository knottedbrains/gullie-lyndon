# Testing Guide: Move-Centric Conversations

## 🎯 What We Built

**Complete Move-Centric Architecture:**
- ✅ Conversations belong to moves (no orphans)
- ✅ Multiple conversations per move
- ✅ Conversation types (Housing, Moving, Services, etc.)
- ✅ Conversation switching
- ✅ Multi-participant support (ready for future)
- ✅ Policy status per move

---

## 🧪 Testing Checklist

### Pre-Test: Get a Move ID

**Option 1: Use existing move**
```sql
SELECT id, employee_id, origin_city, destination_city
FROM moves
LIMIT 1;
```

**Option 2: Create test move**
```sql
INSERT INTO moves (
  employee_id,
  employer_id,
  origin_city,
  destination_city,
  office_location,
  status
)
VALUES (
  (SELECT id FROM employees LIMIT 1),
  (SELECT id FROM employers LIMIT 1),
  'San Francisco',
  'New York',
  'NYC Office',
  'initiated'
)
RETURNING id;
```

**Option 3: Create via UI**
- Navigate to `/moves`
- Click "Create New Move"
- Fill in details
- Copy the move ID from URL

---

## 📋 Test Scenarios

### Test 1: Basic Flow ✅

**Steps:**
1. Navigate to: `/chat?moveId={your_move_id}`
2. Wait for page to load

**Expected:**
- ✅ Conversations list sidebar appears (left side)
- ✅ "No conversations yet" message
- ✅ "+ Start Conversation" button visible
- ✅ Policy Status sidebar (right side) shows move details
- ✅ Chat interface in middle

**Screenshot:** Should see 3 panels:
```
┌───────────────┬─────────────────┬────────────┐
│ Conversations │   Chat Area     │  Policy    │
│   (Empty)     │   (Welcome)     │  Status    │
└───────────────┴─────────────────┴────────────┘
```

---

### Test 2: Create Default Conversation ✅

**Steps:**
1. Type a message: "Hello, I need help with my relocation"
2. Press Enter

**Expected:**
- ✅ Auto-creates "General Discussion" conversation
- ✅ Message appears in chat
- ✅ AI responds
- ✅ Conversation appears in left sidebar
- ✅ Conversation is highlighted as active
- ✅ URL updates to include conversationId

**Verify Database:**
```sql
-- Should see 1 conversation
SELECT * FROM conversations WHERE move_id = '{your_move_id}';

-- Should see 2+ messages (user + AI)
SELECT * FROM messages WHERE conversation_id IN (
  SELECT id FROM conversations WHERE move_id = '{your_move_id}'
);

-- Should see 2 participants (user + AI)
SELECT * FROM conversation_participants WHERE conversation_id IN (
  SELECT id FROM conversations WHERE move_id = '{your_move_id}'
);
```

---

### Test 3: Create Multiple Conversations ✅

**Steps:**
1. Click "+ New" button in conversations sidebar
2. Dialog opens
3. Select "Housing" type
4. Enter title: "Downtown Housing Search"
5. Click "Create Conversation"

**Expected:**
- ✅ Dialog closes
- ✅ New conversation appears in sidebar
- ✅ New conversation is now active
- ✅ Chat area is empty (no messages yet)
- ✅ URL updates with new conversationId

**Repeat for:**
- Type: "Moving", Title: "Moving Company Quotes"
- Type: "Budget", Title: "Expense Tracking"
- Type: "Services", Title: "Airport Transfer"

**Expected Result:**
- ✅ 5 total conversations in sidebar
- ✅ Each with different icon
- ✅ Each with type label

---

### Test 4: Switch Between Conversations ✅

**Steps:**
1. Click on "General Discussion" in sidebar
2. See original messages
3. Click on "Downtown Housing Search"
4. Empty chat (no messages)
5. Type: "I'm looking for a 2BR apartment"
6. AI responds
7. Click back to "General Discussion"

**Expected:**
- ✅ Conversations switch correctly
- ✅ Messages persist per conversation
- ✅ Active conversation highlighted
- ✅ URL updates each time
- ✅ No data loss

---

### Test 5: Conversation Metadata ✅

**Check in sidebar:**
- ✅ Each conversation shows:
  - Icon (based on type)
  - Title
  - Type label (Housing, Moving, etc.)
  - Participant count
  - Last message preview
  - "..." menu button on hover

**Test menu:**
1. Hover over conversation
2. Click "..." button
3. See options: Archive, Rename, Delete

---

### Test 6: Policy Status Integration ✅

**Verify:**
- ✅ Policy status sidebar visible on right
- ✅ Shows correct move data (doesn't change when switching conversations)
- ✅ All conversations for same move see same policy status
- ✅ Can collapse/expand policy sidebar

---

### Test 7: Multiple Message Types ✅

**In any conversation, test:**

1. **Regular messages**
   - Type and send normal messages
   - ✅ User messages appear
   - ✅ AI responds

2. **Tool calls** (if applicable)
   - Ask: "Can you create a test task for this move?"
   - ✅ AI uses tools
   - ✅ Tool results appear

3. **Long conversations**
   - Send 10+ messages
   - ✅ Scrolling works
   - ✅ Auto-scroll to bottom on new message
   - ✅ Can scroll up to see history

---

### Test 8: Edge Cases ✅

**Test:**
1. **No moveId in URL**
   - Navigate to `/chat` (no moveId)
   - ✅ Should show appropriate message or redirect

2. **Invalid moveId**
   - Navigate to `/chat?moveId=invalid-uuid`
   - ✅ Should handle gracefully (error message)

3. **Rapid conversation switching**
   - Click between conversations quickly
   - ✅ No race conditions
   - ✅ Correct messages load

4. **Create conversation while one is loading**
   - Click "New" while page is loading
   - ✅ Dialog works correctly

---

## 🐛 Common Issues & Fixes

### Issue: "Cannot send message: no moveId available"
**Fix:** Ensure you navigate to `/chat?moveId={valid_move_id}`

### Issue: Conversations list is empty
**Fix:** Check database - `SELECT * FROM conversations WHERE move_id = '...'`

### Issue: AI not responding
**Fix:**
- Check OpenAI API key in `.env`
- Check console for errors
- Verify `openai-service.ts` is working

### Issue: Conversation doesn't switch
**Fix:**
- Check URL updates
- Check `conversationId` in React state
- Clear browser cache

### Issue: Database errors
**Fix:**
- Run migrations: `npm run db:push`
- Check schema: `\d conversations` in psql
- Verify foreign keys

---

## ✅ Success Criteria

After testing, you should be able to:

- [x] Create a move
- [x] Auto-create default conversation
- [x] Send and receive messages
- [x] Create multiple conversations per move
- [x] Switch between conversations
- [x] See conversation types and icons
- [x] View policy status for the move
- [x] All data persists in database
- [x] No console errors
- [x] URLs update correctly

---

## 📊 Database Verification

**After testing, run:**

```sql
-- Count conversations per move
SELECT
  m.id as move_id,
  m.origin_city || ' → ' || m.destination_city as move,
  COUNT(c.id) as conversation_count
FROM moves m
LEFT JOIN conversations c ON m.id = c.move_id
GROUP BY m.id, m.origin_city, m.destination_city;

-- List conversations with message counts
SELECT
  c.id,
  c.title,
  c.type,
  c.status,
  COUNT(m.id) as message_count,
  COUNT(DISTINCT cp.id) as participant_count
FROM conversations c
LEFT JOIN messages m ON c.id = m.conversation_id
LEFT JOIN conversation_participants cp ON c.id = cp.conversation_id
GROUP BY c.id, c.title, c.type, c.status
ORDER BY c.created_at DESC;

-- Check participant distribution
SELECT
  participant_type,
  COUNT(*) as count
FROM conversation_participants
GROUP BY participant_type;
```

**Expected Results:**
- Multiple conversations per move
- Each conversation has 2+ participants (user + AI)
- Messages distributed across conversations
- No orphaned data

---

## 🎉 If All Tests Pass

Congratulations! The move-centric architecture is working!

**What's working:**
- ✅ Database schema
- ✅ Backend APIs
- ✅ Frontend UI
- ✅ Conversation management
- ✅ Multi-conversation support
- ✅ Policy status integration

**Next enhancements:**
- Add @mentions for participants
- Add conversation archiving
- Add search across conversations
- Add email integration per conversation
- Add real-time collaboration (websockets)

---

## 📝 Report Format

When reporting test results, use this format:

```
## Test Results

**Environment:**
- Date: [Date]
- Browser: [Chrome/Firefox/Safari]
- Database: [PostgreSQL version]

**Test 1: Basic Flow**
- Status: ✅ Pass / ❌ Fail
- Notes: [Any observations]

**Test 2: Create Conversation**
- Status: ✅ Pass / ❌ Fail
- Notes: [Any observations]

[... continue for all tests ...]

**Bugs Found:**
1. [Description]
2. [Description]

**Screenshots:**
[Attach screenshots if relevant]
```
