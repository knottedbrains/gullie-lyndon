"use client";

import { useState, useRef, useEffect } from "react";
import { trpc } from "@/utils/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  toolCalls?: Array<{
    name: string;
    arguments: unknown;
    result?: unknown;
  }>;
}

export function ChatInterface() {
  const [sessionId] = useState(() => `session-${Date.now()}`);
  const [input, setInput] = useState("");
  const [selectedWorkflow, setSelectedWorkflow] = useState<
    "moves" | "housing" | "services" | "financial" | "operations" | "all"
  >("all");
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Get chat history
  const { data: history = [] } = trpc.chat.getHistory.useQuery(
    { sessionId },
    { refetchOnWindowFocus: false }
  );

  // Subscribe to new messages
  trpc.chat.onMessage.useSubscription(
    { sessionId },
    {
      onData: (message) => {
        // Message is automatically added to history via subscription
        setTimeout(() => {
          scrollAreaRef.current?.scrollTo({
            top: scrollAreaRef.current.scrollHeight,
            behavior: "smooth",
          });
        }, 100);
      },
      onError: (err) => {
        console.error("Subscription error:", err);
      },
    }
  );

  // Send message mutation
  const sendMessage = trpc.chat.sendMessage.useMutation({
    onSuccess: () => {
      setInput("");
      setTimeout(() => {
        scrollAreaRef.current?.scrollTo({
          top: scrollAreaRef.current.scrollHeight,
          behavior: "smooth",
        });
      }, 100);
    },
  });

  // Get available tools
  const { data: tools = [] } = trpc.chat.listTools.useQuery(
    { workflow: selectedWorkflow === "all" ? "moves" : selectedWorkflow },
    { enabled: selectedWorkflow !== "all" }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sendMessage.isLoading) return;

    sendMessage.mutate({
      sessionId,
      message: input.trim(),
      workflow: selectedWorkflow === "all" ? undefined : selectedWorkflow,
    });
  };

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    scrollAreaRef.current?.scrollTo({
      top: scrollAreaRef.current.scrollHeight,
    });
  }, [history]);

  return (
    <div className="flex flex-col h-full">
      <Card className="flex-1 flex flex-col">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>AI Assistant</CardTitle>
            <Select
              value={selectedWorkflow}
              onValueChange={(value) =>
                setSelectedWorkflow(
                  value as
                    | "moves"
                    | "housing"
                    | "services"
                    | "financial"
                    | "operations"
                    | "all"
                )
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select workflow" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Workflows</SelectItem>
                <SelectItem value="moves">Moves</SelectItem>
                <SelectItem value="housing">Housing</SelectItem>
                <SelectItem value="services">Services</SelectItem>
                <SelectItem value="financial">Financial</SelectItem>
                <SelectItem value="operations">Operations</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {selectedWorkflow !== "all" && tools.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {tools.slice(0, 3).map((tool) => (
                <Badge key={tool.name} variant="outline" className="text-xs">
                  {tool.name}
                </Badge>
              ))}
              {tools.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{tools.length - 3} more
                </Badge>
              )}
            </div>
          )}
        </CardHeader>
        <CardContent className="flex-1 flex flex-col min-h-0">
          <ScrollArea className="flex-1 pr-4" ref={scrollAreaRef}>
            <div className="space-y-4">
              {history.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">
                    Start a conversation by asking about moves, housing, services,
                    financial, or operations.
                  </p>
                </div>
              ) : (
                history.map((message: Message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {message.role === "assistant" && (
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Bot className="h-4 w-4 text-primary" />
                        </div>
                      </div>
                    )}
                    <div
                      className={`rounded-lg px-4 py-2 max-w-[80%] ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">
                        {message.content}
                      </p>
                      {message.toolCalls && message.toolCalls.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-border/50">
                          <p className="text-xs opacity-75 mb-1">Tool calls:</p>
                          {message.toolCalls.map((call, idx) => (
                            <div key={idx} className="text-xs opacity-75">
                              <span className="font-mono">{call.name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      <p className="text-xs opacity-50 mt-1">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                    {message.role === "user" && (
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
              {sendMessage.isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                  <div className="rounded-lg px-4 py-2 bg-muted">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about moves, housing, services..."
              disabled={sendMessage.isLoading}
              className="flex-1"
            />
            <Button
              type="submit"
              disabled={!input.trim() || sendMessage.isLoading}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

