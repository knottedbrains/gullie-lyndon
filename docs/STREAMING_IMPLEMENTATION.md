# Streaming AI Responses Implementation Plan

## ✅ Phase 1: Skeleton Loader (COMPLETE)

**Status:** Built and ready to test

**What it does:**
- Shows a message-shaped placeholder while AI is thinking
- 3 shimmer lines + bouncing dots
- Prevents layout shift when message appears
- Smooth transition from skeleton → real message

**Implementation:**
- Component: `src/components/chat/message-skeleton.tsx`
- Integrated into `ChatInterface`
- Shows during `sendMessage.isLoading`

---

## 🚀 Phase 2: Streaming (TODO)

### Why Streaming?

**Current (Non-streaming):**
```
User: "Explain quantum computing"
  ↓
[Skeleton shows for 3-5 seconds]
  ↓
AI: [Full response appears all at once - 500 words]
```

**With Streaming:**
```
User: "Explain quantum computing"
  ↓
AI: "Quantum computing is..." [types in real-time]
    "...based on principles of..." [keeps typing]
    "...superposition and entanglement..." [feels alive]
```

**Benefits:**
- ⚡ Feels faster (user sees progress immediately)
- 💬 More conversational (like a real chat)
- 🎯 Better UX (user can start reading while AI types)
- ⏹️ Can be interrupted (stop generation)

---

## Architecture

### Current Setup
```
Frontend (TRPC)
  ↓
  sendMessage.mutate()
  ↓
Backend (TRPC endpoint)
  ↓
  OpenAI API (complete response)
  ↓
  Save to DB
  ↓
  Return { userMessage, aiMessage }
  ↓
Frontend displays both
```

### Streaming Setup
```
Frontend (WebSocket)
  ↓
  ws.send({ type: "message", content: "..." })
  ↓
Backend (WebSocket handler)
  ↓
  OpenAI API (stream: true)
  ↓
  For each token:
    ws.send({ type: "token", token: "word" })
  ↓
  Save complete message to DB
  ↓
  ws.send({ type: "complete", messageId: "123" })
  ↓
Frontend updates message in real-time
```

---

## Implementation Steps

### 1. Backend: OpenAI Streaming

**File:** `src/server/services/openai-service.ts`

**Current:**
```typescript
export async function getAIResponse(messages, conversationId, db, config) {
  const response = await openai.chat.completions.create({
    model: config?.model || "gpt-4o-mini",
    messages,
    // ...
  });

  return {
    content: response.choices[0].message.content,
    // ...
  };
}
```

**With Streaming:**
```typescript
export async function streamAIResponse(
  messages,
  conversationId,
  db,
  config,
  onToken: (token: string) => void,
  onComplete: (message: any) => void
) {
  const stream = await openai.chat.completions.create({
    model: config?.model || "gpt-4o-mini",
    messages,
    stream: true, // ← Enable streaming
  });

  let fullContent = "";

  for await (const chunk of stream) {
    const token = chunk.choices[0]?.delta?.content || "";
    if (token) {
      fullContent += token;
      onToken(token); // Send to WebSocket
    }
  }

  // Save complete message to DB
  const [message] = await db.insert(messages).values({
    conversationId,
    authorType: "ai",
    content: fullContent,
    // ...
  }).returning();

  onComplete(message);
}
```

### 2. Backend: WebSocket Handler

**File:** `src/server/websocket/chat-handler.ts` (new file)

```typescript
import { WebSocket } from "ws";
import { streamAIResponse } from "../services/openai-service";

export function handleChatWebSocket(ws: WebSocket, db: any) {
  ws.on("message", async (data) => {
    const { type, conversationId, message, config } = JSON.parse(data.toString());

    if (type === "send_message") {
      // Save user message
      const [userMsg] = await db.insert(messages).values({
        conversationId,
        authorType: "user",
        content: message,
      }).returning();

      // Send confirmation
      ws.send(JSON.stringify({
        type: "message_saved",
        message: userMsg,
      }));

      // Get conversation history
      const history = await getConversationHistory(conversationId, db);

      // Stream AI response
      await streamAIResponse(
        history,
        conversationId,
        db,
        config,
        (token) => {
          // Send each token to frontend
          ws.send(JSON.stringify({
            type: "token",
            token,
          }));
        },
        (completeMessage) => {
          // Send complete message
          ws.send(JSON.stringify({
            type: "complete",
            message: completeMessage,
          }));
        }
      );
    }
  });
}
```

### 3. Backend: WebSocket Server Setup

**File:** `src/server/websocket/server.ts` (new file)

```typescript
import { WebSocketServer } from "ws";
import { handleChatWebSocket } from "./chat-handler";
import { db } from "../db";

export function setupWebSocketServer(server: any) {
  const wss = new WebSocketServer({
    server,
    path: "/api/ws/chat",
  });

  wss.on("connection", (ws) => {
    console.log("Client connected to chat WebSocket");

    handleChatWebSocket(ws, db);

    ws.on("close", () => {
      console.log("Client disconnected from chat WebSocket");
    });
  });

  return wss;
}
```

### 4. Next.js: Custom Server (Optional)

If using WebSockets with Next.js, you may need a custom server.

**File:** `server.js` (new file)

```javascript
const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { setupWebSocketServer } = require("./src/server/websocket/server");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  // Setup WebSocket server
  setupWebSocketServer(server);

  const port = process.env.PORT || 3000;
  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});
```

**Update package.json:**
```json
{
  "scripts": {
    "dev": "node server.js",
    "build": "next build",
    "start": "NODE_ENV=production node server.js"
  }
}
```

### 5. Frontend: WebSocket Hook

**File:** `src/hooks/use-chat-websocket.ts` (new file)

```typescript
import { useEffect, useRef, useState } from "react";

export function useChatWebSocket(conversationId: string | null) {
  const ws = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState<string>("");

  useEffect(() => {
    if (!conversationId) return;

    // Connect to WebSocket
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    ws.current = new WebSocket(`${protocol}//${window.location.host}/api/ws/chat`);

    ws.current.onopen = () => {
      console.log("WebSocket connected");
      setIsConnected(true);
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "token") {
        // Append token to streaming message
        setStreamingMessage((prev) => prev + data.token);
      } else if (data.type === "complete") {
        // Message complete, clear streaming state
        setStreamingMessage("");
      }
    };

    ws.current.onclose = () => {
      console.log("WebSocket disconnected");
      setIsConnected(false);
    };

    return () => {
      ws.current?.close();
    };
  }, [conversationId]);

  const sendMessage = (message: string, config: any) => {
    if (!ws.current || !isConnected) return;

    ws.current.send(JSON.stringify({
      type: "send_message",
      conversationId,
      message,
      config,
    }));
  };

  return { sendMessage, streamingMessage, isConnected };
}
```

### 6. Frontend: Update ChatInterface

**File:** `src/components/chat/chat-interface.tsx`

```typescript
import { useChatWebSocket } from "@/hooks/use-chat-websocket";

export function ChatInterface() {
  // ... existing code

  const { sendMessage: wsSendMessage, streamingMessage, isConnected } = useChatWebSocket(conversationId);

  // Add streaming message to history
  const history: Message[] = [
    ...apiHistory,
    optimisticMessage ? optimisticMessage : null,
    streamingMessage ? {
      id: "streaming",
      role: "assistant",
      content: streamingMessage,
      timestamp: new Date(),
      metadata: { streaming: true },
    } : null,
  ].filter(Boolean);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const messageToSend = input.trim();

    // Show optimistic message
    setOptimisticMessage({
      id: `optimistic-${Date.now()}`,
      role: "user",
      content: messageToSend,
      timestamp: new Date(),
    });

    setInput("");

    // Send via WebSocket for streaming
    if (isConnected) {
      wsSendMessage(messageToSend, aiConfig);
    } else {
      // Fallback to TRPC
      sendMessage.mutate({ conversationId, message: messageToSend, config: aiConfig });
    }
  };

  // ...
}
```

---

## Visual Comparison

### Without Streaming (Current with Skeleton)
```
┌─────────────────────────────────────┐
│ User: "Explain quantum computing"   │
├─────────────────────────────────────┤
│ AI: ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓         │ ← Skeleton
│     ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓   │
│     ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓        │
│     ● ● ●                           │ ← Bouncing dots
└─────────────────────────────────────┘
        [Wait 3-5 seconds]
               ↓
┌─────────────────────────────────────┐
│ User: "Explain quantum computing"   │
├─────────────────────────────────────┤
│ AI: Quantum computing is a          │ ← Full message appears
│     revolutionary approach to...    │
│     [500 words of content]          │
└─────────────────────────────────────┘
```

### With Streaming
```
┌─────────────────────────────────────┐
│ User: "Explain quantum computing"   │
├─────────────────────────────────────┤
│ AI: Quantum▊                        │ ← Types in real-time
└─────────────────────────────────────┘
        [0.5 seconds later]
               ↓
┌─────────────────────────────────────┐
│ User: "Explain quantum computing"   │
├─────────────────────────────────────┤
│ AI: Quantum computing is a▊         │ ← Keeps typing
└─────────────────────────────────────┘
        [1 second later]
               ↓
┌─────────────────────────────────────┐
│ User: "Explain quantum computing"   │
├─────────────────────────────────────┤
│ AI: Quantum computing is a          │ ← Complete
│     revolutionary approach to       │
│     information processing...       │
└─────────────────────────────────────┘
```

---

## Testing Plan

### Skeleton Loader (Phase 1) ✅
1. Send a message
2. Verify your message appears immediately
3. Verify skeleton shows (3 lines + dots)
4. Verify smooth transition to real message
5. Verify no layout shift

### Streaming (Phase 2) 🚧
1. **Backend Test:**
   ```bash
   # Test OpenAI streaming
   curl -N http://localhost:3000/api/test-stream
   ```

2. **WebSocket Test:**
   ```javascript
   // Browser console
   const ws = new WebSocket("ws://localhost:3000/api/ws/chat");
   ws.onmessage = (e) => console.log(JSON.parse(e.data));
   ws.send(JSON.stringify({
     type: "send_message",
     conversationId: "abc-123",
     message: "Hello"
   }));
   ```

3. **Frontend Test:**
   - Send message
   - Verify tokens appear immediately
   - Verify smooth typing animation
   - Verify final message saved to DB

---

## Performance Considerations

### Skeleton Loader
- **Pros:**
  - Zero backend changes
  - Works immediately
  - Prevents layout shift
  - ~50KB bundle increase
- **Cons:**
  - Still waits for full response
  - Doesn't feel as "alive"

### Streaming
- **Pros:**
  - Feels much faster
  - Better perceived performance
  - User can read while generating
  - Can stop generation early
- **Cons:**
  - Requires WebSocket setup
  - More complex error handling
  - Slightly higher server load
  - ~100KB bundle increase

---

## Rollout Strategy

**Week 1:** Skeleton loader (Done ✅)
- Deploy to production
- Gather user feedback
- Monitor for issues

**Week 2:** Streaming prototype
- Build backend streaming
- Test with small user group
- Measure performance impact

**Week 3:** Full streaming
- Roll out to all users
- A/B test vs non-streaming
- Optimize token buffering

---

## Alternative: SSE (Server-Sent Events)

If WebSockets are too complex, can use SSE:

**Pros:**
- Simpler than WebSockets
- Works over HTTP
- Auto-reconnect
- Built into browsers

**Cons:**
- One-way (server → client only)
- Less efficient than WebSockets

**Implementation:**
```typescript
// Backend
export async function streamResponse(req, res) {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  for await (const chunk of stream) {
    res.write(`data: ${JSON.stringify({ token: chunk })}\n\n`);
  }

  res.end();
}

// Frontend
const eventSource = new EventSource("/api/stream");
eventSource.onmessage = (e) => {
  const { token } = JSON.parse(e.data);
  setStreamingMessage((prev) => prev + token);
};
```

---

## Next Steps

### Immediate (Done ✅)
- [x] Skeleton loader component
- [x] Integrate into chat interface
- [x] Build and test

### Short-term (This week)
- [ ] Test skeleton in production
- [ ] Gather user feedback
- [ ] Decide: WebSockets vs SSE

### Medium-term (Next 2 weeks)
- [ ] Implement streaming backend
- [ ] Add WebSocket/SSE handler
- [ ] Update frontend for streaming
- [ ] Beta test with select users

### Long-term (Future)
- [ ] Add "Stop generation" button
- [ ] Add regenerate response
- [ ] Add token usage metrics
- [ ] Optimize for mobile

---

## Questions?

**Q: Why not both skeleton + streaming?**
A: We do! Skeleton shows first ~100ms, then streaming takes over.

**Q: What about errors during streaming?**
A: Add error boundaries, fallback to non-streaming on failure.

**Q: Mobile support?**
A: WebSockets work great on mobile, SSE even better.

**Q: Cost implications?**
A: Streaming costs same as non-streaming (same tokens generated).

---

## Summary

✅ **Skeleton loader** - COMPLETE
- Prevents layout shift
- Better UX than simple loading spinner
- Ready to test now

🚧 **Streaming** - PLANNED
- Requires backend changes
- Best UX (real-time typing)
- 1-2 weeks to implement

**Recommendation:** Test skeleton loader first, then add streaming if user feedback is positive.
