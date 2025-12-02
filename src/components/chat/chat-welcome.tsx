import { Sparkles } from "lucide-react";

interface ChatWelcomeProps {
  setInput: (value: string) => void;
}

export function ChatWelcome({ setInput }: ChatWelcomeProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center space-y-8 py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-2 shadow-sm ring-1 ring-inset ring-primary/10">
        <Sparkles className="h-8 w-8 text-primary" />
      </div>
      <div className="text-center space-y-2 max-w-md">
        <h3 className="text-2xl font-semibold tracking-tight">How can I help you today?</h3>
        <p className="text-muted-foreground text-sm">
          I can help you manage moves, find housing, check status, and process invoices.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 w-full max-w-lg mt-4">
        {["New Move", "Find Housing", "Status Check", "Invoices"].map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => setInput(suggestion)}
            className="px-4 py-3 text-sm bg-muted/40 hover:bg-muted rounded-xl transition-all text-left border border-transparent hover:border-border hover:shadow-sm"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}

