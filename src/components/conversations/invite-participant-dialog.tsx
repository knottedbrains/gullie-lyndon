"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/utils/trpc";
import { UserPlus } from "lucide-react";

interface InviteParticipantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: string;
  onSuccess: () => void;
}

export function InviteParticipantDialog({
  open,
  onOpenChange,
  conversationId,
  onSuccess,
}: InviteParticipantDialogProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>("participant");

  const addParticipant = trpc.conversations.addParticipant.useMutation({
    onSuccess: () => {
      setEmail("");
      setRole("participant");
      onOpenChange(false);
      onSuccess();
    },
    onError: (error) => {
      console.error("Failed to add participant:", error);
      // TODO: Show error toast
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    addParticipant.mutate({
      conversationId,
      email: email.trim(),
      role: role as any,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Invite Participant
            </DialogTitle>
            <DialogDescription>
              Add someone to this conversation by their email address.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={addParticipant.isLoading}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                User must have an account to be invited
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="participant">
                    <div>
                      <div className="font-medium">Participant</div>
                      <div className="text-xs text-muted-foreground">
                        Can read and write messages
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="observer">
                    <div>
                      <div className="font-medium">Observer</div>
                      <div className="text-xs text-muted-foreground">
                        Can read but not write messages
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="owner">
                    <div>
                      <div className="font-medium">Owner</div>
                      <div className="text-xs text-muted-foreground">
                        Full access including invite/remove
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {addParticipant.error && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">
                {addParticipant.error.message}
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={addParticipant.isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!email.trim() || addParticipant.isLoading}
            >
              {addParticipant.isLoading ? "Inviting..." : "Invite"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
