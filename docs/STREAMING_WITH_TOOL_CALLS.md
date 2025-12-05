# Streaming AI Responses with Tool Calls

## ✅ IMPLEMENTED (Backend Complete)

**Status:** Backend streaming ready, frontend integration needed
**Build:** ✅ Successful

---

## What I Built

### 1. Streaming Service
**File:** `src/server/services/openai-streaming.ts`

Handles OpenAI streaming with:
- **Text tokens** → Stream as they arrive
- **Tool calls** → Accumulate, execute, return results
- **Reasoning** → Stream o1/o3 thinking
- **Errors** → Graceful error handling

### 2. TRPC Subscription
**File:** `src/server/routers/conversations.router.ts`

Added `streamMessage` subscription that:
- Saves user message immediately
- Streams AI response in real-time
- Executes tool calls as they complete
- Saves final AI message to database

---

## How It Works

### Flow with Tool Calls

```
User: "Create a move from SF to NY and find housing"
  ↓
1. User message saved to DB immediately
   emit: { type: "user_message_saved", message: {...} }
  ↓
2. AI starts generating text
   emit: { type: "text_delta", content: "Let" }
   emit: { type: "text_delta", content: " me" }
   emit: { type: "text_delta", content: " help" }
   emit: { type: "text_delta", content: " you" }
  ↓
3. AI calls create_move tool
   emit: { type: "tool_call_start", toolName: "create_move", callId: "call_1" }
   emit: { type: "tool_call_args", callId: "call_1", args: "{\"origin\":" }
   emit: { type: "tool_call_args", callId: "call_1", args: "\"SF\"," }
   emit: { type: "tool_call_args", callId: "call_1", args: "\"dest\":\"NY\"}" }
  ↓
4. Tool executes (backend)
   → create_move({ origin: "SF", dest: "NY" })
   → Returns: { moveId: "abc-123", status: "created" }
   emit: { type: "tool_call_complete", callId: "call_1", result: "{...}" }
  ↓
5. AI continues streaming
   emit: { type: "text_delta", content: "I've" }
   emit: { type: "text_delta", content: " created" }
   emit: { type: "text_delta", content: " the" }
   emit: { type: "text_delta", content: " move" }
  ↓
6. AI calls list_housing_options
   emit: { type: "tool_call_start", toolName: "list_housing_options", callId: "call_2" }
   [... accumulate args ...]
   emit: { type: "tool_call_complete", callId: "call_2", result: "[...]" }
  ↓
7. AI finishes streaming
   emit: { type: "text_delta", content: " options" }
   emit: { type: "complete", fullContent: "...", toolCalls: [...] }
```

---

## Stream Event Types

```typescript
type StreamEvent =
  // Text streaming
  | { type: "text_delta"; content: string }           // Each word/token

  // Tool calls
  | { type: "tool_call_start"; toolName: string; callId: string }
  | { type: "tool_call_args"; callId: string; args: string }
  | { type: "tool_call_complete"; callId: string; toolName: string; result: string }

  // Reasoning (o1/o3 models)
  | { type: "reasoning"; content: string }

  // Completion
  | { type: "complete"; fullContent: string; toolCalls: any[] }

  // Errors
  | { type: "error"; error: string };
```

---

## Frontend Integration (TODO)

### Option 1: TRPC Subscription (Recommended)

**Update TRPC client to support WebSocket:**

**File:** `src/utils/trpc.ts` (needs update)

```typescript
import { createWSClient, wsLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink, splitLink } from "@trpc/client";
import type { AppRouter } from "@/server/routers/_app";

// Create WebSocket client
const wsClient = createWSClient({
  url: process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3000/api/trpc",
});

export const trpc = createTRPCReact<AppRouter>();

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        splitLink({
          condition: (op) => op.type === "subscription",
          true: wsLink({ client: wsClient }),
          false: httpBatchLink({ url: "/api/trpc" }),
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}
```

**Use in ChatInterface:**

```typescript
// src/components/chat/chat-interface.tsx

import { useEffect, useState } from "react";

export function ChatInterface() {
  const [streamingContent, setStreamingContent] = useState("");
  const [streamingToolCalls, setStreamingToolCalls] = useState<any[]>([]);

  // Subscribe to streaming
  trpc.conversations.streamMessage.useSubscription(
    {
      conversationId: conversationId!,
      message: messageToSend,
      config: aiConfig,
    },
    {
      enabled: false, // Control manually
      onData: (event) => {
        if (event.type === "text_delta") {
          // Append text token
          setStreamingContent((prev) => prev + event.content);
        } else if (event.type === "tool_call_complete") {
          // Show tool execution
          setStreamingToolCalls((prev) => [
            ...prev,
            { name: event.toolName, result: event.result },
          ]);
        } else if (event.type === "complete") {
          // Stream finished
          refetchHistory();
          setStreamingContent("");
          setStreamingToolCalls([]);
        }
      },
      onError: (error) => {
        console.error("Streaming error:", error);
      },
    }
  );

  // Display streaming message
  const displayHistory = [
    ...history,
    streamingContent ? {
      id: "streaming",
      role: "assistant",
      content: streamingContent,
      timestamp: new Date(),
      toolCalls: streamingToolCalls,
      metadata: { streaming: true },
    } : null,
  ].filter(Boolean);

  return (
    <div>
      {displayHistory.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
    </div>
  );
}
```

### Option 2: Manual WebSocket (Alternative)

If TRPC WebSocket is complex, use raw WebSocket:

```typescript
// src/hooks/use-stream-message.ts

export function useStreamMessage() {
  const [streamingContent, setStreamingContent] = useState("");
  const wsRef = useRef<WebSocket | null>(null);

  const sendMessage = (conversationId: string, message: string, config: any) => {
    const ws = new WebSocket("ws://localhost:3000/api/ws/chat");

    ws.onopen = () => {
      ws.send(JSON.stringify({
        type: "stream_message",
        conversationId,
        message,
        config,
      }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "text_delta") {
        setStreamingContent((prev) => prev + data.content);
      } else if (data.type === "complete") {
        setStreamingContent("");
        ws.close();
      }
    };

    wsRef.current = ws;
  };

  return { sendMessage, streamingContent };
}
```

---

## Example: Streaming with Tool Execution

### User sees this in real-time:

```
User: Create a move and find housing

AI: Let me help you with that█              ← Typing animation

AI: Let me help you with that.
    [🔧 Creating move...]                   ← Tool executing

AI: Let me help you with that.
    [✅ Move created: SF → NY]              ← Tool result

AI: Let me help you with that.
    [✅ Move created: SF → NY]
    Now searching for housing options█      ← Continue typing

AI: Let me help you with that.
    [✅ Move created: SF → NY]
    Now searching for housing options.
    [🔧 Searching housing...]               ← Another tool

AI: Let me help you with that.
    [✅ Move created: SF → NY]
    Now searching for housing options.
    [✅ Found 5 housing options]            ← Tool result
    Here are your options█                  ← Final typing
```

---

## Tool Call Visualization

**During tool execution, show:**

```tsx
{message.toolCalls?.map((call) => (
  <div className="tool-execution">
    {call.status === "executing" && (
      <>
        <Loader className="animate-spin" />
        <span>Executing {call.name}...</span>
      </>
    )}
    {call.status === "complete" && (
      <>
        <CheckCircle className="text-green-500" />
        <span>{call.name} completed</span>
        {/* Render widget if available */}
        <ToolResultWidget data={JSON.parse(call.result)} />
      </>
    )}
  </div>
))}
```

---

## Benefits of Streaming + Tool Calls

### ✅ Better UX
- Text appears immediately (feels faster)
- See tools executing in real-time
- Progress indicators for each tool
- Can interrupt long responses

### ✅ Transparency
- User sees what tools are being called
- Can watch data being fetched
- Understand AI's process step-by-step

### ✅ Performance
- Perceived performance boost
- Start reading while AI generates
- Tools execute as soon as arguments complete

---

## Testing

### Test Scenarios

**1. Simple text response:**
```
User: "Hello"
Expected: Text streams word by word
```

**2. Single tool call:**
```
User: "Show me my moves"
Expected:
- Text: "Let me fetch your moves"
- Tool: list_moves executes
- Text: "Here are your moves"
- Widget: Move list renders
```

**3. Multiple tool calls:**
```
User: "Create a move from SF to NY and find housing"
Expected:
- Text: "I'll help you with that"
- Tool: create_move executes
- Text: "Move created, searching housing"
- Tool: list_housing_options executes
- Text: "Here are your options"
- Widgets: Move card + Housing list render
```

**4. Error handling:**
```
User: "Create a move with invalid data"
Expected:
- Text: "Let me create that move"
- Tool: create_move fails
- Error: "Failed to create move: validation error"
- Text: "I couldn't create the move because..."
```

---

## Performance Considerations

### Bandwidth
- **Text streaming:** ~10-50 bytes/token
- **Tool calls:** ~200-1000 bytes/call
- **Total:** Similar to non-streaming (same content)

### Latency
- **First token:** ~200-500ms (vs 3-5s for full response)
- **Tool execution:** Depends on tool (100ms-2s)
- **Perceived speed:** ⚡ Much faster

### Server Load
- **Streaming:** Slightly higher (keep connection open)
- **Tool execution:** Same as non-streaming
- **Overall:** ~10-20% more server resources

---

## Next Steps

### Immediate (You need to do)
1. **Update TRPC client** to support WebSocket
2. **Add WebSocket link** to TRPC provider
3. **Update ChatInterface** to use subscription
4. **Test streaming** with simple messages

### Short-term
1. Add tool execution indicators
2. Add "Stop generation" button
3. Show typing indicator during streaming
4. Add retry on WebSocket disconnect

### Long-term
1. Add streaming analytics
2. Optimize for mobile
3. Add streaming to email responses
4. Cache streamed responses

---

## Configuration

**Environment variables needed:**

```env
# .env
NEXT_PUBLIC_WS_URL=ws://localhost:3000/api/trpc
```

**For production:**
```env
NEXT_PUBLIC_WS_URL=wss://yourdomain.com/api/trpc
```

---

## Summary

✅ **Backend streaming complete**
- OpenAI streaming service ✅
- Tool call handling ✅
- TRPC subscription endpoint ✅
- Error handling ✅
- Build successful ✅

🚧 **Frontend integration needed**
- TRPC WebSocket setup
- Subscription consumer
- Streaming UI components
- Tool execution indicators

**Files created:**
- `src/server/services/openai-streaming.ts` ✅
- Updated `src/server/routers/conversations.router.ts` ✅
- This documentation ✅

**Estimated time to complete frontend:** 2-4 hours

Want me to implement the frontend integration now?
