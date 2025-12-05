"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronRight,
  Settings,
  MessageCircle,
  Home,
  Truck,
  Briefcase,
  DollarSign,
  Users,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

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

interface Conversation {
  id: string;
  title: string;
  type: ConversationType;
}

interface ProjectFolderProps {
  projectId: string;
  projectName: string;
  employeeName?: string;
  companyName?: string;
  conversations: Conversation[];
  isActive?: boolean;
  currentConversationId?: string;
  onCreateConversation: (projectId: string) => void;
  onOpenSettings?: (projectId: string) => void;
}

export function ProjectFolder({
  projectId,
  projectName,
  employeeName,
  companyName,
  conversations,
  isActive = false,
  currentConversationId,
  onCreateConversation,
  onOpenSettings,
}: ProjectFolderProps) {
  const [isExpanded, setIsExpanded] = useState(isActive);
  const pathname = usePathname();
  const router = useRouter();

  const handleProjectClick = () => {
    router.push(`/chat?moveId=${projectId}`);
  };

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const handleCreateConversation = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCreateConversation(projectId);
  };

  const handleOpenSettings = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onOpenSettings) {
      onOpenSettings(projectId);
    }
  };

  return (
    <div className="w-full">
      {/* Project Header */}
      <div
        className={cn(
          "flex items-start gap-1 rounded-md px-2 py-2 text-sm transition-colors group/project cursor-pointer",
          isActive
            ? "bg-muted font-medium"
            : "hover:bg-muted/50"
        )}
        onClick={handleProjectClick}
      >
        <Button
          variant="ghost"
          size="icon"
          className="h-4 w-4 p-0 hover:bg-transparent shrink-0 mt-0.5"
          onClick={handleToggleExpand}
        >
          {isExpanded ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )}
        </Button>

        <div className="flex-1 min-w-0 flex flex-col gap-0.5">
          {employeeName && (
            <div className="text-xs font-medium truncate leading-tight">
              {employeeName}
            </div>
          )}
          {companyName && (
            <div className="text-[10px] text-muted-foreground truncate leading-tight">
              {companyName}
            </div>
          )}
          <div className={cn(
            "text-xs truncate leading-tight",
            !employeeName && !companyName && "font-medium"
          )}>
            {projectName}
          </div>
        </div>

        {onOpenSettings && (
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 opacity-0 group-hover/project:opacity-100 transition-opacity shrink-0 mt-0.5"
            onClick={handleOpenSettings}
            title="Project settings"
          >
            <Settings className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {/* Conversations List */}
      {isExpanded && conversations.length > 0 && (
        <div className="ml-4 mt-0.5 space-y-0.5">
          {conversations.map((conversation) => {
            const Icon = CONVERSATION_ICONS[conversation.type];
            const isConversationActive = conversation.id === currentConversationId;

            return (
              <Link
                key={conversation.id}
                href={`/chat?moveId=${projectId}&conversationId=${conversation.id}`}
                className={cn(
                  "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                  isConversationActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{conversation.title}</span>
              </Link>
            );
          })}
        </div>
      )}

      {/* Empty state when expanded */}
      {isExpanded && conversations.length === 0 && (
        <div className="ml-4 mt-0.5 px-2 py-2 text-xs text-muted-foreground">
          No conversations yet
        </div>
      )}
    </div>
  );
}
