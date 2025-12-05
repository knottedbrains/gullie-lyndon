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
import { Home, Truck, Briefcase, DollarSign, MessageCircle, Building2, Users } from "lucide-react";

const CONVERSATION_TYPES = [
  { value: "general", label: "General Discussion", icon: MessageCircle },
  { value: "housing", label: "Housing", icon: Home },
  { value: "moving", label: "Moving & Logistics", icon: Truck },
  { value: "services", label: "Services", icon: Briefcase },
  { value: "budget", label: "Budget & Finance", icon: DollarSign },
  { value: "vendor", label: "Vendor Communication", icon: Building2 },
  { value: "internal", label: "Internal Notes", icon: Users },
] as const;

interface CreateConversationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  moveId: string;
  onSuccess: (conversationId: string) => void;
}

export function CreateConversationDialog({
  open,
  onOpenChange,
  moveId,
  onSuccess,
}: CreateConversationDialogProps) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<string>("general");
  const [visibility, setVisibility] = useState<string>("shared");

  const createConversation = trpc.conversations.create.useMutation({
    onSuccess: (conversation) => {
      setTitle("");
      setType("general");
      setVisibility("shared");
      onOpenChange(false);
      onSuccess(conversation.id);
    },
    onError: (error) => {
      console.error("Failed to create conversation:", error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    createConversation.mutate({
      moveId,
      title: title.trim(),
      type: type as any,
      visibility: visibility as any,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>New Conversation</DialogTitle>
            <DialogDescription>
              Start a new conversation for this relocation project.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="type">Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {CONVERSATION_TYPES.map((option) => {
                    const Icon = option.icon;
                    return (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <span>{option.label}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="e.g., Housing Search Downtown"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={createConversation.isLoading}
                autoFocus
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="visibility">Visibility</Label>
              <Select value={visibility} onValueChange={setVisibility}>
                <SelectTrigger id="visibility">
                  <SelectValue placeholder="Select visibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="shared">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Shared</span>
                      <span className="text-xs text-muted-foreground">
                        Invited participants + move stakeholders
                      </span>
                    </div>
                  </SelectItem>
                  <SelectItem value="internal">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Internal Only</span>
                      <span className="text-xs text-muted-foreground">
                        Only company staff can see
                      </span>
                    </div>
                  </SelectItem>
                  <SelectItem value="private">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Private</span>
                      <span className="text-xs text-muted-foreground">
                        Only invited participants
                      </span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createConversation.isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!title.trim() || createConversation.isLoading}
            >
              {createConversation.isLoading ? "Creating..." : "Create Conversation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
