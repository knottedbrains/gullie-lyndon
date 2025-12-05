import { Bot } from "lucide-react";
import { cn } from "@/lib/utils";

export function MessageSkeleton() {
  return (
    <div className="flex gap-4 w-full justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
        <Bot className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="bg-muted/50 rounded-2xl rounded-bl-none px-4 py-3 max-w-[80%] min-w-[200px]">
        <div className="space-y-2 animate-pulse">
          <div className="h-4 bg-muted-foreground/20 rounded w-3/4"></div>
          <div className="h-4 bg-muted-foreground/20 rounded w-full"></div>
          <div className="h-4 bg-muted-foreground/20 rounded w-5/6"></div>
        </div>
        <div className="mt-2 flex gap-1">
          <div className="h-1.5 w-1.5 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
          <div className="h-1.5 w-1.5 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
          <div className="h-1.5 w-1.5 bg-muted-foreground/40 rounded-full animate-bounce" />
        </div>
      </div>
    </div>
  );
}
