# Quick Start: Testing New Conversations

## ✅ What's Done

**Backend:**
- ✅ New database schema (conversations, messages, participants)
- ✅ Conversations router with all essential operations
- ✅ Data migration script (ran successfully)

**Frontend:**
- ✅ Chat interface updated to use conversations API

## 🧪 How to Test

### 1. Start the Dev Server
```bash
npm run dev
```

### 2. Create a Test Move First

**Option A: Use existing move**
- Go to `/moves` and find an existing move ID

**Option B: Create new move via UI**
- Navigate to moves section
- Create a new test move
- Copy the move ID

**Option C: Create via database**
```sql
-- Quick test move
INSERT INTO moves (employee_id, employer_id, origin_city, destination_city, office_location)
VALUES (
  (SELECT id FROM employees LIMIT 1),
  (SELECT id FROM employers LIMIT 1),
  'San Francisco',
  'New York',
  'NYC Office'
)
RETURNING id;
```

### 3. Test Chat with Move

Navigate to: `/chat?moveId={your_move_id}`

**Expected Flow:**
1. Page loads with moveId from URL
2. Auto-creates/gets default conversation for that move
3. Shows chat interface
4. Can send messages
5. AI responds
6. Policy status sidebar shows move progress

### 4. Verify Database

```sql
-- Check conversations
SELECT * FROM conversations;

-- Check messages
SELECT * FROM messages ORDER BY created_at DESC;

-- Check participants
SELECT * FROM conversation_participants;
```

## 🐛 Known Issues to Watch For

1. **No moveId in URL** - Won't work yet (need to handle this case)
2. **Message format** - May need to adjust message display
3. **Email sync** - May need to update for conversations

## 📊 Success Criteria

- [ ] Can create conversation for a move
- [ ] Can send message
- [ ] AI responds correctly
- [ ] Messages persist to database
- [ ] Policy status sidebar shows correct move
- [ ] No console errors

## 🔧 If Something Breaks

**Check:**
1. Database migrations ran: `SELECT * FROM conversations LIMIT 1;`
2. TRPC router exported: Check `_app.ts` has `conversations` router
3. Console for errors: Open browser dev tools
4. Network tab: Check API calls to `/api/trpc/conversations.*`

**Common Fixes:**
- Restart dev server
- Clear browser cache
- Check environment variables
- Verify database connection

---

**Next Steps After Testing:**
1. Add conversations list sidebar (multiple convos per move)
2. Add conversation switching
3. Add conversation types (housing, moving, etc.)
4. Add multi-participant features
