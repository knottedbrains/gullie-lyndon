"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight, Building2, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProjectFolder } from "./project-folder";

interface Move {
  id: string;
  originCity: string;
  destinationCity: string;
  employee?: {
    id: string;
    fullName: string;
    email: string;
  } | null;
  employer?: {
    id: string;
    name: string;
  } | null;
}

interface Conversation {
  id: string;
  title: string;
  type: "housing" | "moving" | "services" | "budget" | "general" | "vendor" | "internal";
}

interface CompanyFolderProps {
  companyId: string;
  companyName: string;
  moves: Move[];
  conversationsByMove: Record<string, Conversation[]>;
  currentMoveId?: string;
  currentConversationId?: string;
  onCreateConversation: (moveId: string) => void;
  onOpenCompanySettings?: (companyId: string) => void;
  onOpenProjectSettings?: (projectId: string) => void;
}

export function CompanyFolder({
  companyId,
  companyName,
  moves,
  conversationsByMove,
  currentMoveId,
  currentConversationId,
  onCreateConversation,
  onOpenCompanySettings,
  onOpenProjectSettings,
}: CompanyFolderProps) {
  // Check if any move in this company is active
  const hasActiveMove = moves.some((move) => move.id === currentMoveId);
  const [isExpanded, setIsExpanded] = useState(hasActiveMove);

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const handleOpenCompanySettings = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onOpenCompanySettings) {
      onOpenCompanySettings(companyId);
    }
  };

  return (
    <div className="w-full">
      {/* Company Header */}
      <div
        className={cn(
          "flex items-center gap-1 rounded-md px-2 py-2 text-sm transition-colors cursor-pointer group/company",
          hasActiveMove ? "bg-muted/50" : "hover:bg-muted/30"
        )}
        onClick={handleToggleExpand}
      >
        <Button
          variant="ghost"
          size="icon"
          className="h-4 w-4 p-0 hover:bg-transparent shrink-0"
          onClick={handleToggleExpand}
        >
          {isExpanded ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )}
        </Button>

        <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />

        <div className="flex-1 min-w-0 flex items-center gap-2">
          <span className="text-xs font-semibold truncate">{companyName}</span>
          <span className="text-[10px] text-muted-foreground shrink-0">
            ({moves.length} {moves.length === 1 ? "move" : "moves"})
          </span>
        </div>

        {onOpenCompanySettings && companyId !== "unassigned" && (
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 opacity-0 group-hover/company:opacity-100 transition-opacity shrink-0"
            onClick={handleOpenCompanySettings}
            title="Company settings"
          >
            <Settings className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {/* Moves List */}
      {isExpanded && (
        <div className="ml-2 mt-0.5 space-y-0.5">
          {moves.map((move) => {
            const conversations = conversationsByMove?.[move.id] || [];
            const isActive = currentMoveId === move.id;
            const employeeName = move.employee?.fullName || move.employee?.email;
            const route = `${move.originCity} → ${move.destinationCity}`;

            return (
              <ProjectFolder
                key={move.id}
                projectId={move.id}
                projectName={route}
                employeeName={employeeName}
                companyName={undefined} // Don't show company name since it's already in the parent
                conversations={conversations}
                isActive={isActive}
                currentConversationId={currentConversationId}
                onCreateConversation={onCreateConversation}
                onOpenSettings={onOpenProjectSettings}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
