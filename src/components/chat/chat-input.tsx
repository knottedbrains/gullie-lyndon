import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowUp } from "lucide-react";
import { FormEvent, useRef, useEffect, KeyboardEvent } from "react";

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
  isLoading: boolean;
}

export function ChatInput({ input, setInput, onSubmit, isLoading }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isLoading) {
        onSubmit(e as unknown as FormEvent);
      }
    }
  };

  return (
    <div className="p-4 bg-background/80 backdrop-blur-sm pb-6 pt-2">
      <div className="max-w-3xl mx-auto relative">
        <form onSubmit={onSubmit} className="relative flex items-end gap-2 bg-muted/50 rounded-lg p-2 pr-2 border focus-within:ring-1 focus-within:ring-primary/20 focus-within:border-primary/50 transition-all shadow-sm hover:shadow-md">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message Agent... (Shift+Enter for new line)"
            className="min-h-[40px] max-h-[200px] bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 px-4 py-2 placeholder:text-muted-foreground/70 resize-none overflow-y-auto"
            rows={1}
          />
          <Button
            type="submit"
            size="icon"
            disabled={!input.trim() || isLoading}
            className="h-9 w-9 rounded-full shadow-none shrink-0 bg-primary hover:bg-primary/90 mb-0.5"
          >
            {isLoading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
            ) : (
              <ArrowUp className="h-4 w-4" />
            )}
          </Button>
        </form>
        <div className="text-[10px] text-center text-muted-foreground mt-2 opacity-70">
          AI can make mistakes. Please review generated actions.
        </div>
      </div>
    </div>
  );
}

