"use client";

import { useState, useRef, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { trpc } from "@/utils/trpc";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Settings, Mail, RefreshCw } from "lucide-react";
import { MessageBubble } from "./message-bubble";
import { ChatInput } from "./chat-input";
import { ChatWelcome } from "./chat-welcome";
import { Button } from "@/components/ui/button";
import { WIDGET_REGISTRY, parseToolResult } from "@/mcp/widget-registry";
import { PolicyStatusSidebar } from "./policy-status-sidebar";

type ToolCallArguments = Record<string, unknown>;

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  metadata?: any;
  toolCalls?: Array<{
    name: string;
    arguments: ToolCallArguments;
    result?: string;
  }> | null;
}

export function ChatInterface() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const urlSessionId = searchParams.get("id");
  const urlMoveId = searchParams.get("moveId"); // Capture moveId from URL
  const [sessionId, setSessionId] = useState<string | null>(urlSessionId);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);
  const isCreatingRef = useRef(false);

  const createSession = trpc.chat.create.useMutation({
    onSuccess: (session) => {
      setSessionId(session.id);
      isCreatingRef.current = false;
      // Preserve moveId in URL if present
      const params = new URLSearchParams();
      params.set("id", session.id);
      if (urlMoveId) params.set("moveId", urlMoveId);
      router.push(`/chat?${params.toString()}`);
    },
    onError: (error) => {
      isCreatingRef.current = false;
      console.error("Failed to create chat session:", error);
    },
  });

  useEffect(() => {
    if (urlSessionId) {
      setSessionId(urlSessionId);
    } else if (!sessionId && !createSession.isLoading && !createSession.isSuccess && !isCreatingRef.current) {
      // Pass moveId when creating session
      isCreatingRef.current = true;
      createSession.mutate(urlMoveId ? { moveId: urlMoveId } : undefined);
    }
  }, [urlSessionId, sessionId, urlMoveId]);

  const { data: history = [], refetch: refetchHistory } = trpc.chat.getHistory.useQuery(
    { sessionId: sessionId! },
    { 
      refetchOnWindowFocus: false,
      refetchInterval: 1000,
      enabled: !!sessionId,
    }
  );

  const { data: session } = trpc.chat.getSession.useQuery(
    { sessionId: sessionId! },
    { enabled: !!sessionId }
  );

  const syncEmails = trpc.chat.syncEmails.useMutation({
    onSuccess: (data) => {
      if (data.count > 0) {
        refetchHistory();
      }
    }
  });

  // Sync emails only happens via webhooks and manual refresh button click

  const sendMessage = trpc.chat.sendMessage.useMutation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sendMessage.isLoading) return;

    const messageToSend = input.trim();
    // Clear input immediately
    setInput("");

    if (!sessionId) {
      // If no session ID yet, create one first then send message
      createSession.mutate(undefined, {
        onSuccess: (session) => {
          setSessionId(session.id);
          router.push(`/chat?id=${session.id}`);
          sendMessage.mutate({ sessionId: session.id, message: messageToSend });
        }
      });
      return;
    }

    sendMessage.mutate({ sessionId, message: messageToSend });
    // Reset to bottom when sending a message
    isAtBottomRef.current = true;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    // Use a smaller threshold to prevent accidental auto-scrolling when slightly up
    const isAtBottom = scrollHeight - scrollTop - clientHeight <= 50;
    isAtBottomRef.current = isAtBottom;
  };

  useEffect(() => {
    // Only auto-scroll if we are already at the bottom
    if (messagesEndRef.current && isAtBottomRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [history]);

  // Log tool calls to console (only once per message)
  const loggedToolCallsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    history.forEach((message: Message) => {
      if (message.toolCalls && message.toolCalls.length > 0) {
        message.toolCalls.forEach((call) => {
          const logKey = `${message.id}-${call.name}`;
          if (call.name === "create_test_move" && !loggedToolCallsRef.current.has(logKey)) {
            loggedToolCallsRef.current.add(logKey);
            let parsedResult = null;
            try {
              parsedResult = call.result ? JSON.parse(call.result) : null;
            } catch (e) {
              parsedResult = call.result;
            }
            console.log("🔧 [Chat Interface] Tool call detected:", {
              name: call.name,
              arguments: call.arguments,
              result: parsedResult,
            });
          }
        });
      }
    });
  }, [history]);

  return (
    <div className="flex h-full bg-background overflow-hidden">
      <div className="flex-1 flex flex-col min-w-0 h-full">
      {session?.agentMailEmailAddress && (
        <div className="border-b p-2 bg-muted/30 flex items-center justify-between text-xs px-4 shrink-0">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="h-3.5 w-3.5" />
            <span className="font-mono">{session.agentMailEmailAddress}</span>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6"
            onClick={() => syncEmails.mutate({ sessionId: sessionId! })}
            disabled={syncEmails.isLoading}
            title="Sync Emails"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${syncEmails.isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      )}
      <ScrollArea className="flex-1 px-4 md:px-8" onScroll={handleScroll}>
        <div className="py-8 space-y-8 max-w-3xl mx-auto min-h-[calc(100vh-12rem)] flex flex-col justify-end pb-12">
          {history.length === 0 ? (
            <ChatWelcome setInput={setInput} />
          ) : (
            history.map((message: Message) => {
              return (
                <MessageBubble key={message.id} message={message}>
                  {message.toolCalls && message.toolCalls.length > 0 && (
                    <div className="w-full space-y-3 mt-1 pl-1">
                      {message.toolCalls.map((call, idx) => {
                        const WidgetComponent = WIDGET_REGISTRY[call.name];
                        const resultData = parseToolResult(call.result);

                        if (WidgetComponent && resultData) {
                          return (
                            <div key={idx} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                              <WidgetComponent 
                                {...resultData}
                                move={resultData} 
                                employee={resultData.employee}
                                employer={resultData.employer}
                              />
                            </div>
                          );
                        }

                        return (
                          <div key={idx} className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/20 px-3 py-2 rounded-lg border border-dashed w-fit">
                            <Settings className="h-3 w-3" />
                            <span className="font-mono">{call.name}</span>
                            <span className="opacity-50">Complete</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </MessageBubble>
              );
            })
          )}
          
          {sendMessage.isLoading && (
            <div className="flex gap-4 w-full justify-start animate-pulse">
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                <Bot className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="bg-muted/50 rounded-2xl rounded-bl-none px-4 py-3 flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="h-1.5 w-1.5 bg-foreground/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <div className="h-1.5 w-1.5 bg-foreground/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <div className="h-1.5 w-1.5 bg-foreground/40 rounded-full animate-bounce" />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </ScrollArea>

      <ChatInput 
        input={input} 
        setInput={setInput} 
        onSubmit={handleSubmit} 
        isLoading={sendMessage.isLoading} 
      />
      </div>
      <PolicyStatusSidebar moveId={session?.moveId || urlMoveId || undefined} />
    </div>
  );
}
