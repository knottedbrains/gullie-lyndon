import { Suspense } from "react";
import { ChatInterface } from "@/components/chat/chat-interface";

export const dynamic = 'force-dynamic';

export default function ChatPage() {
  return (
    <div className="h-[calc(100vh-6rem)] -m-6">
      <Suspense fallback={<div className="flex items-center justify-center h-full">Loading...</div>}>
        <ChatInterface />
      </Suspense>
    </div>
  );
}
