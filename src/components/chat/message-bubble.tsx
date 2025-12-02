import { cn } from "@/lib/utils";
import { Bot } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { EmailMessage } from "./widgets/email-message";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: Date;
  metadata?: any;
}

interface MessageBubbleProps {
  message: Message;
  children?: React.ReactNode; // For tool calls
}

export function MessageBubble({ message, children }: MessageBubbleProps) {
  if (message.metadata?.isEmail) {
    return (
      <EmailMessage 
        from={message.metadata.emailFrom || "Unknown"}
        to={message.metadata.emailTo}
        subject={message.metadata.emailSubject || "No Subject"}
        body={message.metadata.emailBody || message.content.split("\n\n").slice(1).join("\n\n") || message.content}
        html={message.metadata.emailHtml}
        timestamp={message.timestamp ? new Date(message.timestamp) : undefined}
        isIncoming={message.role === "user"}
      />
    );
  }

  return (
    <div className={cn("flex gap-4 w-full group", message.role === "user" ? "justify-end" : "justify-start")}>
      {message.role === "assistant" && (
        <div className="flex-shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
            <Bot className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      )}
      
      <div className={cn("flex flex-col gap-2 max-w-[85%]", message.role === "user" ? "items-end" : "items-start")}>
        <div className={cn(
          "rounded-2xl px-5 py-3 text-sm shadow-sm overflow-hidden prose-p:leading-relaxed",
          message.role === "user" 
            ? "bg-primary text-primary-foreground rounded-br-sm" 
            : "bg-muted/50 hover:bg-muted/80 transition-colors rounded-bl-sm"
        )}>
          <div className="prose prose-sm dark:prose-invert max-w-none break-words">
            <ReactMarkdown components={{
              p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
              ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
              li: ({ children }) => <li>{children}</li>,
              code: ({ children }) => <code className="bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded font-mono text-xs">{children}</code>,
            }}>
              {message.content}
            </ReactMarkdown>
          </div>
        </div>

        {children}
      </div>
    </div>
  );
}

