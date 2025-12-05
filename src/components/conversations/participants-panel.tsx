"use client";

import { useState } from "react";
import { trpc } from "@/utils/trpc";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  UserPlus,
  Users,
  X,
  Bot,
  User,
  Crown,
  Eye,
  Shield,
  Building2
} from "lucide-react";
import { InviteParticipantDialog } from "./invite-participant-dialog";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ParticipantsPanelProps {
  conversationId: string;
  onClose?: () => void;
}

const PARTICIPANT_ICONS = {
  employee: User,
  admin: Shield,
  vendor: Building2,
  ai: Bot,
  system: Bot,
};

const ROLE_ICONS = {
  owner: Crown,
  participant: User,
  observer: Eye,
};

export function ParticipantsPanel({
  conversationId,
  onClose,
}: ParticipantsPanelProps) {
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [participantToRemove, setParticipantToRemove] = useState<string | null>(null);

  const { data: conversation, refetch } = trpc.conversations.get.useQuery(
    { conversationId },
    { enabled: !!conversationId }
  );

  const removeParticipant = trpc.conversations.removeParticipant.useMutation({
    onSuccess: () => {
      setRemoveDialogOpen(false);
      setParticipantToRemove(null);
      refetch();
    },
    onError: (error) => {
      console.error("Failed to remove participant:", error);
      setRemoveDialogOpen(false);
      setParticipantToRemove(null);
    },
  });

  const handleRemoveClick = (participantId: string) => {
    setParticipantToRemove(participantId);
    setRemoveDialogOpen(true);
  };

  const handleConfirmRemove = () => {
    if (participantToRemove) {
      removeParticipant.mutate({ conversationId, participantId: participantToRemove });
    }
  };

  const participants = conversation?.participants || [];

  return (
    <div className="w-80 border-l bg-background flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <h3 className="font-semibold">Participants</h3>
          </div>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {participants.length} participant{participants.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Participants List */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-2">
          {participants.map((participant) => {
            const ParticipantIcon = PARTICIPANT_ICONS[participant.participantType];
            const RoleIcon = ROLE_ICONS[participant.role];
            const isAI = participant.participantType === "ai";

            return (
              <div
                key={participant.id}
                className={cn(
                  "group flex items-start gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors",
                  isAI && "bg-primary/5"
                )}
              >
                <div className={cn(
                  "p-2 rounded-full shrink-0",
                  isAI ? "bg-primary/10" : "bg-muted"
                )}>
                  <ParticipantIcon className={cn(
                    "h-4 w-4",
                    isAI && "text-primary"
                  )} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm truncate">
                      {participant.user?.name || "AI Assistant"}
                    </span>
                    <RoleIcon className="h-3 w-3 text-muted-foreground shrink-0" />
                  </div>

                  {participant.user?.email && (
                    <p className="text-xs text-muted-foreground truncate">
                      {participant.user.email}
                    </p>
                  )}

                  <div className="flex items-center gap-1.5 mt-1.5">
                    <Badge
                      variant="outline"
                      className="text-xs capitalize"
                    >
                      {participant.participantType}
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="text-xs capitalize"
                    >
                      {participant.role}
                    </Badge>
                  </div>
                </div>

                {!isAI && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    onClick={() => handleRemoveClick(participant.id)}
                    disabled={removeParticipant.isLoading}
                    title="Remove participant"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Footer: Invite Button */}
      <div className="p-3 border-t">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setShowInviteDialog(true)}
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Invite Participant
        </Button>
      </div>

      {/* Invite Dialog */}
      <InviteParticipantDialog
        open={showInviteDialog}
        onOpenChange={setShowInviteDialog}
        conversationId={conversationId}
        onSuccess={() => refetch()}
      />

      {/* Remove Confirmation Dialog */}
      <Dialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Participant</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this participant from the conversation?
              They will no longer be able to view or send messages.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRemoveDialogOpen(false)}
              disabled={removeParticipant.isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmRemove}
              disabled={removeParticipant.isLoading}
            >
              {removeParticipant.isLoading ? "Removing..." : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
