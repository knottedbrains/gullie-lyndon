"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/utils/trpc";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  MessageCircle,
  Plus,
  Home,
  Truck,
  Briefcase,
  DollarSign,
  Users,
  Building2,
  MoreVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ConversationType = "housing" | "moving" | "services" | "budget" | "general" | "vendor" | "internal";

const CONVERSATION_ICONS: Record<ConversationType, React.ElementType> = {
  housing: Home,
  moving: Truck,
  services: Briefcase,
  budget: DollarSign,
  general: MessageCircle,
  vendor: Building2,
  internal: Users,
};

const CONVERSATION_LABELS: Record<ConversationType, string> = {
  housing: "Housing",
  moving: "Moving",
  services: "Services",
  budget: "Budget",
  general: "General",
  vendor: "Vendor",
  internal: "Internal",
};

interface ConversationsListProps {
  moveId: string;
  currentConversationId?: string;
  onConversationSelect: (conversationId: string) => void;
  onCreateNew: () => void;
}

export function ConversationsList({
  moveId,
  currentConversationId,
  onConversationSelect,
  onCreateNew,
}: ConversationsListProps) {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<string | null>(null);

  // Fetch conversations for this move
  const { data: conversations = [], isLoading, refetch } = trpc.conversations.listByMove.useQuery(
    { moveId },
    {
      refetchOnWindowFocus: false,
      enabled: !!moveId,
    }
  );

  // Delete conversation mutation
  const deleteConversation = trpc.conversations.delete.useMutation({
    onSuccess: (_, variables) => {
      // If deleting the current conversation, redirect to move without conversation
      if (variables.conversationId === currentConversationId) {
        router.push(`/chat?moveId=${moveId}`);
      }
      setDeleteDialogOpen(false);
      setConversationToDelete(null);
      refetch();
    },
    onError: (error) => {
      console.error("Failed to delete conversation:", error);
      setDeleteDialogOpen(false);
      setConversationToDelete(null);
    },
  });

  const handleDeleteClick = (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConversationToDelete(conversationId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (conversationToDelete) {
      deleteConversation.mutate({ conversationId: conversationToDelete });
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 text-sm text-muted-foreground text-center">
        Loading conversations...
      </div>
    );
  }

  if (!moveId) {
    return (
      <div className="p-4 text-sm text-muted-foreground text-center">
        No move selected
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-w-0">
      {/* Header */}
      <div className="p-3 border-b">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold">Conversations</h3>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={onCreateNew}
            title="New conversation"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          {conversations.length} conversation{conversations.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1 min-w-0" viewportClassName="w-full overflow-x-hidden">
        <div className="p-2 space-y-1 w-full">
          {conversations.length === 0 ? (
            <div className="p-8 text-center">
              <MessageCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-3">
                No conversations yet
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={onCreateNew}
              >
                <Plus className="h-3 w-3 mr-1" />
                Start Conversation
              </Button>
            </div>
          ) : (
            conversations.map((conversation) => {
              const Icon = CONVERSATION_ICONS[conversation.type as ConversationType];
              const isActive = conversation.id === currentConversationId;
              const lastMessagePreview = conversation.lastMessage
                ? conversation.lastMessage.content.slice(0, 60) + (conversation.lastMessage.content.length > 60 ? "..." : "")
                : "No messages yet";

              return (
                <div
                  key={conversation.id}
                  className={cn(
                    "group flex items-start gap-2 p-2 rounded-md cursor-pointer transition-colors overflow-hidden",
                    isActive
                      ? "bg-primary/10 border border-primary/20"
                      : "hover:bg-muted/50"
                  )}
                  onClick={() => onConversationSelect(conversation.id)}
                >
                  <div className={cn(
                    "mt-0.5 p-1.5 rounded-md shrink-0",
                    isActive ? "bg-primary text-primary-foreground" : "bg-muted"
                  )}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1 mb-0.5 overflow-hidden">
                      <h4 className={cn(
                        "text-sm font-medium truncate min-w-0",
                        isActive && "text-primary"
                      )}>
                        {conversation.title}
                      </h4>
                      {conversation.status === "archived" && (
                        <Badge variant="outline" className="text-xs shrink-0">
                          Archived
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground overflow-hidden">
                      <span className="capitalize shrink-0">{CONVERSATION_LABELS[conversation.type as ConversationType]}</span>
                      <span className="shrink-0">•</span>
                      <span className="truncate">{conversation.participantCount} participant{conversation.participantCount !== 1 ? "s" : ""}</span>
                    </div>

                    <p className="text-xs text-muted-foreground truncate mt-1">
                      {lastMessagePreview}
                    </p>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => console.log("Archive")}>
                        Archive
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => console.log("Rename")}>
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={(e) => handleDeleteClick(conversation.id, e as any)}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Conversation</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this conversation? This action cannot be undone.
              All messages in this conversation will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleteConversation.isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteConversation.isLoading}
            >
              {deleteConversation.isLoading ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
