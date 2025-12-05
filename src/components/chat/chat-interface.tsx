"use client";

import { useState, useRef, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { trpc } from "@/utils/trpc";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Settings, Mail, RefreshCw, Sparkles, MessageSquare, Users } from "lucide-react";
import { MessageBubble } from "./message-bubble";
import { ChatInput } from "./chat-input";
import { ChatWelcome } from "./chat-welcome";
import { MessageSkeleton } from "./message-skeleton";
import { Button } from "@/components/ui/button";
import { WIDGET_REGISTRY, parseToolResult } from "@/mcp/widget-registry";
import { PolicyStatusSidebar } from "./policy-status-sidebar";
import { ChatConfigPanel } from "./chat-config-panel";
import { CreateConversationDialog } from "@/components/conversations/create-conversation-dialog";
import { ParticipantsPanel } from "@/components/conversations/participants-panel";

type ToolCallArguments = Record<string, unknown>;

export interface AIConfig {
  model?:
    // GPT-5.1 (Latest)
    | "gpt-5.1"
    | "gpt-5.1-2025-11-13"
    | "gpt-5.1-chat-latest"
    // GPT-5
    | "gpt-5"
    | "gpt-5-2025-08-07"
    | "gpt-5-chat-latest"
    | "gpt-5-mini"
    | "gpt-5-mini-2025-08-07"
    | "gpt-5-pro"
    | "gpt-5-pro-2025-10-06"
    // GPT-4.1
    | "gpt-4.1"
    | "gpt-4.1-2025-04-14"
    | "gpt-4.1-mini"
    | "gpt-4.1-mini-2025-04-14"
    // GPT-4o
    | "gpt-4o"
    | "gpt-4o-2024-11-20"
    | "gpt-4o-mini"
    | "chatgpt-4o-latest"
    // o1 (Reasoning)
    | "o1"
    | "o1-2024-12-17"
    | "o1-pro"
    | "o1-pro-2025-03-19"
    // o3 (Latest Reasoning)
    | "o3"
    | "o3-2025-04-16"
    | "o3-mini"
    | "o3-mini-2025-01-31";
  enableParallelExecution?: boolean;
  enableExtendedThinking?: boolean;
  maxReasoningTokens?: number;
}

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
  reasoning?: string | null;
  model?: string | null;
}

export function ChatInterface() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const urlMoveId = searchParams.get("moveId");
  const urlConversationId = searchParams.get("conversationId");
  const [conversationId, setConversationId] = useState<string | null>(urlConversationId);
  const [moveId, setMoveId] = useState<string | null>(urlMoveId);
  const [input, setInput] = useState("");
  const [showConfig, setShowConfig] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [aiConfig, setAiConfig] = useState<AIConfig>({
    model: "gpt-4o-mini",
    enableParallelExecution: true,
    enableExtendedThinking: false,
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);
  const [lastActivityTime, setLastActivityTime] = useState<number>(Date.now());
  const [optimisticMessage, setOptimisticMessage] = useState<Message | null>(null);
  const [isInitializing, setIsInitializing] = useState(!urlMoveId);

  // Fetch available moves if no moveId is provided
  const { data: availableMoves } = trpc.moves.list.useQuery(
    { limit: 1, offset: 0 },
    { enabled: !urlMoveId && !moveId }
  );

  // Create a test move if none exist
  const createTestMove = trpc.moves.createTestMove.useMutation({
    onSuccess: (data) => {
      const newMoveId = data.move.id;
      setMoveId(newMoveId);
      setIsInitializing(false);
      const params = new URLSearchParams();
      params.set("moveId", newMoveId);
      router.push(`/chat?${params.toString()}`);
    },
    onError: (error) => {
      console.error("Failed to create test move:", error);
      setIsInitializing(false);
    },
  });

  // Get or create default conversation for the move
  const getOrCreateConversation = trpc.conversations.getOrCreateDefault.useMutation({
    onSuccess: (conversation) => {
      setConversationId(conversation.id);
      setMoveId(conversation.moveId);
      const params = new URLSearchParams();
      params.set("moveId", conversation.moveId);
      router.push(`/chat?${params.toString()}`);
    },
    onError: (error) => {
      console.error("Failed to get/create conversation:", error);
    },
  });

  // Initialize moveId if not provided in URL
  useEffect(() => {
    if (!urlMoveId && !moveId && availableMoves && !createTestMove.isLoading) {
      if (availableMoves.length > 0) {
        // Use the first available move
        const firstMoveId = availableMoves[0].id;
        setMoveId(firstMoveId);
        setIsInitializing(false);
        const params = new URLSearchParams();
        params.set("moveId", firstMoveId);
        router.push(`/chat?${params.toString()}`);
      } else {
        // No moves exist, create a test move
        createTestMove.mutate({
          originCity: "San Francisco, CA",
          destinationCity: "New York, NY",
          officeLocation: "New York Office",
        });
      }
    }
  }, [urlMoveId, moveId, availableMoves, createTestMove.isLoading]);

  // Reset conversation when moveId changes
  useEffect(() => {
    // If URL moveId is different from current moveId, reset conversation
    if (urlMoveId && urlMoveId !== moveId) {
      setMoveId(urlMoveId);
      setConversationId(null); // Clear current conversation
    }
  }, [urlMoveId, moveId]);

  // Auto-create conversation if we have a moveId but no conversationId
  useEffect(() => {
    if (urlMoveId && !urlConversationId && !conversationId && !getOrCreateConversation.isLoading) {
      getOrCreateConversation.mutate({ moveId: urlMoveId });
    } else if (urlConversationId && urlConversationId !== conversationId) {
      setConversationId(urlConversationId);
    }
  }, [urlMoveId, urlConversationId, conversationId]);

  // Handle conversation selection
  const handleConversationSelect = (newConversationId: string) => {
    setConversationId(newConversationId);
    const params = new URLSearchParams();
    if (moveId) params.set("moveId", moveId);
    params.set("conversationId", newConversationId);
    router.push(`/chat?${params.toString()}`);
  };

  // Handle new conversation created
  const handleConversationCreated = (newConversationId: string) => {
    handleConversationSelect(newConversationId);
  };

  // Define sendMessage mutation
  const sendMessage = trpc.conversations.sendMessage.useMutation();

  // Smart polling: use a function to check if we should poll
  const getRefetchInterval = () => {
    const timeSinceActivity = Date.now() - lastActivityTime;
    // Poll for 30 seconds after activity, then stop
    return timeSinceActivity < 30000 ? 3000 : false;
  };

  const { data: rawMessages = [], refetch: refetchHistory } = trpc.conversations.getMessages.useQuery(
    { conversationId: conversationId! },
    {
      refetchOnWindowFocus: false,
      // Dynamic polling interval based on activity
      refetchInterval: getRefetchInterval,
      enabled: !!conversationId,
    }
  );

  // Map API messages to expected Message format
  const apiHistory: Message[] = rawMessages.map((msg) => ({
    id: msg.id,
    role: msg.authorType === "ai" ? "assistant" : msg.authorType === "system" ? "system" : "user",
    content: msg.content,
    timestamp: new Date(msg.createdAt),
    toolCalls: msg.toolCalls,
    reasoning: msg.reasoning,
    model: msg.model,
    metadata: msg.metadata,
  }));

  // Add optimistic message if present
  const history: Message[] = optimisticMessage
    ? [...apiHistory, optimisticMessage]
    : apiHistory;

  // Refetch history when message is sent and mark activity
  useEffect(() => {
    if (!sendMessage.isLoading && sendMessage.isSuccess) {
      setLastActivityTime(Date.now());
      setOptimisticMessage(null); // Clear optimistic message
      refetchHistory();
    }
  }, [sendMessage.isLoading, sendMessage.isSuccess, refetchHistory]);

  const { data: conversation } = trpc.conversations.get.useQuery(
    { conversationId: conversationId! },
    { enabled: !!conversationId }
  );

  const syncEmails = trpc.chat.syncEmails.useMutation({
    onSuccess: (data) => {
      if (data.count > 0) {
        setLastActivityTime(Date.now());
        refetchHistory();
      }
    }
  });

  // Sync emails only happens via webhooks and manual refresh button click

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sendMessage.isLoading) return;

    const messageToSend = input.trim();

    // Show optimistic user message immediately
    setOptimisticMessage({
      id: `optimistic-${Date.now()}`,
      role: "user",
      content: messageToSend,
      timestamp: new Date(),
      metadata: null,
    });

    // Clear input immediately
    setInput("");

    if (!conversationId) {
      // If no conversation yet, create one with the moveId
      // moveId is guaranteed to exist at this point due to initialization logic
      if (!moveId) {
        console.error("Cannot send message: no moveId available");
        return;
      }
      // Create conversation first then send message
      getOrCreateConversation.mutate({ moveId }, {
        onSuccess: (conv) => {
          sendMessage.mutate({
            conversationId: conv.id,
            message: messageToSend,
            config: aiConfig,
          });
        }
      });
      return;
    }

    sendMessage.mutate({
      conversationId,
      message: messageToSend,
      config: aiConfig,
    });
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

  // Show loading state while initializing
  if (isInitializing) {
    return (
      <div className="flex h-full bg-background items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          <p className="text-muted-foreground text-sm">Initializing chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-background overflow-hidden">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
      <div className="border-b p-2 bg-muted/30 flex items-center justify-between text-xs px-4 shrink-0">
        <div className="flex items-center gap-3">
          {conversation?.agentMailEmailAddress && (
            <>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-3.5 w-3.5" />
                <span className="font-mono">{conversation.agentMailEmailAddress}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => syncEmails.mutate({ sessionId: conversationId! })}
                disabled={syncEmails.isLoading}
                title="Sync Emails"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${syncEmails.isLoading ? "animate-spin" : ""}`} />
              </Button>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">
            {aiConfig.model} {aiConfig.enableParallelExecution && "⚡"}{aiConfig.enableExtendedThinking && "🧠"}
          </span>
          {conversationId && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setShowParticipants(!showParticipants)}
              title="Show Participants"
            >
              <Users className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setShowConfig(!showConfig)}
            title="AI Configuration"
          >
            <Sparkles className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
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
          
          {sendMessage.isLoading && <MessageSkeleton />}
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
      {showConfig && (
        <ChatConfigPanel
          config={aiConfig}
          onConfigChange={setAiConfig}
          onClose={() => setShowConfig(false)}
        />
      )}
      {showParticipants && conversationId && (
        <ParticipantsPanel
          conversationId={conversationId}
          onClose={() => setShowParticipants(false)}
        />
      )}
      {!showParticipants && (
        <PolicyStatusSidebar moveId={conversation?.moveId || moveId || undefined} />
      )}

      {/* Create Conversation Dialog */}
      {moveId && (
        <CreateConversationDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          moveId={moveId}
          onSuccess={handleConversationCreated}
        />
      )}
    </div>
  );
}
