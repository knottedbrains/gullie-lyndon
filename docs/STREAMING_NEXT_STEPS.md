# Streaming Implementation - Next Steps

## Current Status

✅ **Completed:**
- Backend streaming service (`src/server/services/openai-streaming.ts`)
- TRPC subscription endpoint (`src/server/routers/conversations.router.ts`)
- Skeleton loader for better UX (`src/components/chat/message-skeleton.tsx`)
- Optimistic UI (user messages appear immediately)
- Tool call streaming architecture documented

🚧 **Pending:**
- WebSocket server setup for TRPC subscriptions
- Frontend streaming subscription integration

---

## Why Streaming Wasn't Fully Implemented

TRPC subscriptions require a WebSocket server, which isn't available by default in Next.js App Router. Setting this up requires:

1. **Custom Next.js server** with WebSocket support
2. **WebSocket adapter** configuration for TRPC
3. **Production deployment** considerations (WebSocket support on hosting platform)

Given these complexities, we implemented the foundation (backend services + skeleton loader) and documented the remaining steps for future implementation.

---

## What Works Now

### 1. Skeleton Loader
- Prevents layout shift when AI responds
- Shows 3 shimmer lines + bouncing dots animation
- Provides visual feedback while waiting

### 2. Optimistic UI
- User messages appear immediately when sent
- No waiting for server confirmation
- Better perceived performance

### 3. Backend Streaming Ready
- `streamAIResponse()` generator function handles OpenAI streaming
- Tool calls accumulate and execute correctly
- TRPC subscription endpoint ready to use

---

## Complete WebSocket Setup Guide

### Step 1: Create Custom Next.js Server

**File:** `server.mjs` (ESM format for better compatibility)

```javascript
import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { WebSocketServer } from "ws";
import { applyWSSHandler } from "@trpc/server/adapters/ws";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

async function startServer() {
  await app.prepare();

  // Dynamic import of router after Next.js builds
  const { appRouter } = await import("./.next/server/chunks/[router-chunk].js");
  const { createTRPCContext } = await import("./.next/server/chunks/[context-chunk].js");

  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("internal server error");
    }
  });

  // WebSocket server for TRPC subscriptions
  const wss = new WebSocketServer({
    server,
    path: "/api/trpc",
  });

  const handler = applyWSSHandler({
    wss,
    router: appRouter,
    createContext: createTRPCContext,
  });

  wss.on("connection", (ws) => {
    console.log(`WebSocket connection established (${wss.clients.size} clients)`);
    ws.once("close", () => {
      console.log(`WebSocket connection closed (${wss.clients.size} clients)`);
    });
  });

  process.on("SIGTERM", () => {
    console.log("SIGTERM signal received: closing HTTP server and WebSocket connections");
    handler.broadcastReconnectNotification();
    wss.close();
    server.close(() => {
      console.log("HTTP server closed");
    });
  });

  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> WebSocket server ready on ws://${hostname}:${port}/api/trpc`);
  });
}

startServer().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

**Challenge:** Importing the compiled router and context from `.next/` directory is tricky because:
- Chunk names change between builds
- TypeScript modules need to be compiled first
- ES modules vs CommonJS compatibility

**Solution:** Either:
1. Export router and context from a stable entry point
2. Use a build script to generate the import paths
3. Keep router in a non-TypeScript file (`server/router.js`)

### Step 2: Update package.json Scripts

```json
{
  "scripts": {
    "dev": "node server.mjs",
    "build": "next build",
    "start": "NODE_ENV=production node server.mjs"
  }
}
```

### Step 3: Update TRPC Client (Already Done)

The WebSocket client setup in `src/app/providers.tsx` is ready (currently reverted).

Restore this code:

```typescript
import { httpBatchLink, splitLink, createWSClient, wsLink } from "@trpc/client";

function getWsUrl() {
  if (typeof window !== "undefined") {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${window.location.host}/api/trpc`;
  }
  return "";
}

const wsClient = typeof window !== "undefined"
  ? createWSClient({ url: getWsUrl() })
  : null;

const trpcClient = trpc.createClient({
  links: [
    splitLink({
      condition: (op) => op.type === "subscription",
      true: wsClient ? wsLink({ client: wsClient }) : httpBatchLink({...}),
      false: httpBatchLink({...}),
    }),
  ],
  transformer: superjson,
});
```

### Step 4: Update ChatInterface (Already Done)

The streaming subscription code in `src/components/chat/chat-interface.tsx` is ready (currently reverted).

Restore this code:

```typescript
const [streamingContent, setStreamingContent] = useState("");
const [streamingToolCalls, setStreamingToolCalls] = useState([]);
const [pendingStreamMessage, setPendingStreamMessage] = useState(null);

trpc.conversations.streamMessage.useSubscription(
  {
    conversationId: conversationId!,
    message: pendingStreamMessage || "",
    config: aiConfig,
  },
  {
    enabled: !!pendingStreamMessage && !!conversationId,
    onData: (event) => {
      if (event.type === "text_delta") {
        setStreamingContent((prev) => prev + event.content);
      } else if (event.type === "tool_call_complete") {
        setStreamingToolCalls((prev) => [...prev, {
          name: event.toolName,
          result: event.result
        }]);
      } else if (event.type === "complete") {
        setStreamingContent("");
        setStreamingToolCalls([]);
        setPendingStreamMessage(null);
        refetchHistory();
      }
    },
  }
);

// Show streaming message in history
const history = [
  ...apiHistory,
  optimisticMessage,
  streamingContent ? {
    id: "streaming",
    role: "assistant",
    content: streamingContent,
    timestamp: new Date(),
    toolCalls: streamingToolCalls,
    metadata: { streaming: true },
  } : null,
].filter(Boolean);

// Trigger streaming
const handleSubmit = (e) => {
  // ... show optimistic message
  setPendingStreamMessage(messageToSend);
};
```

### Step 5: Production Deployment

**Hosting Requirements:**
- WebSocket support (check with hosting provider)
- Long-lived connections allowed
- Proper WebSocket proxy configuration

**Platforms with WebSocket Support:**
- ✅ Railway (native support)
- ✅ Fly.io (native support)
- ✅ AWS ECS/EKS (with load balancer)
- ✅ DigitalOcean App Platform (with sticky sessions)
- ❌ Vercel (no WebSocket support for serverless)
- ❌ Netlify (no WebSocket support for serverless)

---

## Alternative: Server-Sent Events (SSE)

If WebSocket setup is too complex, use SSE instead:

### Pros
- Simpler than WebSocket (HTTP-based)
- No custom server needed
- Works with serverless platforms
- Auto-reconnect built-in

### Cons
- One-way only (server → client)
- Less efficient than WebSocket
- Still requires custom API route

### Implementation

**File:** `src/app/api/stream/route.ts`

```typescript
import { streamAIResponse } from "@/server/services/openai-streaming";

export async function POST(req: Request) {
  const { conversationId, message, config } = await req.json();

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      for await (const event of streamAIResponse(
        // ... history and params
      )) {
        const data = `data: ${JSON.stringify(event)}\n\n`;
        controller.enqueue(encoder.encode(data));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
```

**Frontend:**

```typescript
const eventSource = new EventSource("/api/stream");
eventSource.onmessage = (e) => {
  const event = JSON.parse(e.data);
  if (event.type === "text_delta") {
    setStreamingContent((prev) => prev + event.content);
  }
};
```

---

## Recommended Approach

**For MVP/Development:**
1. Keep current setup (skeleton loader + optimistic UI)
2. Provides good UX without infrastructure complexity
3. Backend streaming code is ready when needed

**For Production:**
1. If on Vercel/Netlify → Use SSE approach
2. If on Railway/Fly.io → Use full WebSocket approach
3. If high scale → Use dedicated WebSocket service

---

## Performance Comparison

| Approach | First Token | Complexity | Serverless | Cost |
|----------|-------------|------------|------------|------|
| **Current (Polling)** | 3-5s | Low | ✅ Yes | Low |
| **SSE** | 200-500ms | Medium | ✅ Yes | Medium |
| **WebSocket** | 200-500ms | High | ❌ No | Medium-High |

---

## Files Ready for Streaming

✅ Backend:
- `src/server/services/openai-streaming.ts`
- `src/server/routers/conversations.router.ts`

✅ Frontend (commented/reverted):
- `src/app/providers.tsx` (WebSocket client setup)
- `src/components/chat/chat-interface.tsx` (subscription logic)

📝 Documentation:
- `docs/STREAMING_WITH_TOOL_CALLS.md` (architecture explained)
- `docs/STREAMING_IMPLEMENTATION.md` (skeleton loader plan)

---

## Quick Start When Ready

1. **Choose deployment platform** (WebSocket or SSE)
2. **Uncomment frontend code** in providers.tsx and chat-interface.tsx
3. **Set up custom server** OR **create SSE route**
4. **Test locally** with `npm run dev`
5. **Deploy** with WebSocket configuration

---

## Testing Checklist

- [ ] WebSocket connection establishes
- [ ] Text streams word-by-word
- [ ] Tool calls execute mid-stream
- [ ] Tool results appear immediately
- [ ] Stream completes and saves to DB
- [ ] Errors handled gracefully
- [ ] Reconnection works on disconnect
- [ ] Multiple concurrent users work
- [ ] Production deployment stable

---

## Questions?

See `docs/STREAMING_WITH_TOOL_CALLS.md` for detailed architecture explanation of how streaming works with tool execution.
