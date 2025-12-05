"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ConversationsPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to chat page - conversations are now organized by moves
    router.push("/chat");
  }, [router]);

  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <p className="text-muted-foreground">Redirecting to chat...</p>
      </div>
    </div>
  );
}
