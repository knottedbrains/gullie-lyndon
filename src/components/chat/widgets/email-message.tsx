import { Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

interface EmailMessageProps {
  from: string;
  to?: string[];
  subject: string;
  body: string;
  html?: string;
  timestamp?: Date;
  isIncoming?: boolean;
}

export function EmailMessage({ from, to, subject, body, html, timestamp, isIncoming = true }: EmailMessageProps) {
  return (
    <div className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm w-full max-w-2xl my-2 overflow-hidden",
      isIncoming ? "ml-0 mr-auto" : "ml-auto mr-0"
    )}>
      <div className="flex flex-col space-y-1.5 p-4 border-b bg-muted/30">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{isIncoming ? "Incoming Email" : "Sent Email"}</span>
            </div>
            {timestamp && <div className="text-xs text-muted-foreground">{timestamp.toLocaleTimeString()}</div>}
        </div>
      </div>
      <div className="p-4 space-y-2 text-sm">
        <div className="grid grid-cols-[60px_1fr] gap-1">
            <span className="text-muted-foreground font-medium text-xs uppercase tracking-wider">From:</span>
            <span className="font-mono text-xs truncate">{from}</span>
        </div>
        {to && to.length > 0 && (
            <div className="grid grid-cols-[60px_1fr] gap-1">
                <span className="text-muted-foreground font-medium text-xs uppercase tracking-wider">To:</span>
                <span className="font-mono text-xs truncate">{to.join(", ")}</span>
            </div>
        )}
        <div className="grid grid-cols-[60px_1fr] gap-1">
            <span className="text-muted-foreground font-medium text-xs uppercase tracking-wider">Subject:</span>
            <span className="font-medium">{subject}</span>
        </div>
        
        <div className="mt-4 pt-4 border-t prose prose-sm dark:prose-invert max-w-none">
            <div className="bg-muted/10 p-3 rounded-md text-foreground/90 leading-relaxed font-sans text-sm">
               {/* We use a simplified renderer that respects newlines but also renders links */}
               {html ? (
                 <div dangerouslySetInnerHTML={{ __html: html }} className="email-html-content" />
               ) : (
                 <div className="whitespace-pre-wrap">
                   <ReactMarkdown 
                      components={{
                          a: ({ node, ...props }) => <a {...props} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer" />,
                          p: ({ node, ...props }) => <p {...props} className="mb-2 last:mb-0" />
                      }}
                   >
                      {body}
                   </ReactMarkdown>
                 </div>
               )}
            </div>
        </div>
      </div>
    </div>
  );
}
