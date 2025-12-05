"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Home,
  Briefcase,
  DollarSign,
  Settings,
  Plus,
  Building2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/utils/trpc";
import type { UserRole } from "@/types/dashboard";
import { CompanyFolder } from "./company-folder";
import { CreateConversationDialog } from "@/components/conversations/create-conversation-dialog";
import { CompanySettingsDialog } from "@/components/settings/company-settings-dialog";

// Role-specific navigation items
const getNavigationForRole = (role: UserRole | undefined) => {
  switch (role) {
    case "employee":
      return [
        { name: "Overview", href: "/", icon: LayoutDashboard },
      ];
    case "company":
      return [
        { name: "Overview", href: "/", icon: LayoutDashboard },
        { name: "Moves", href: "/moves", icon: Users },
      ];
    case "vendor":
      return [
        { name: "Overview", href: "/", icon: LayoutDashboard },
        { name: "Services", href: "/services", icon: Briefcase },
      ];
    case "admin":
    default:
      return [
        { name: "Overview", href: "/", icon: LayoutDashboard },
        { name: "Moves", href: "/moves", icon: Users },
        { name: "Housing", href: "/housing", icon: Home },
        { name: "Services", href: "/services", icon: Briefcase },
        { name: "Vendors", href: "/vendors", icon: Building2 },
        { name: "Financial", href: "/financial", icon: DollarSign },
        { name: "Settings", href: "/operations", icon: Settings },
      ];
  }
};

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentMoveId = searchParams.get("moveId") || undefined;
  const currentConversationId = searchParams.get("conversationId") || undefined;

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedMoveId, setSelectedMoveId] = useState<string | undefined>();
  const [companySettingsOpen, setCompanySettingsOpen] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | undefined>();
  const [selectedCompanyName, setSelectedCompanyName] = useState<string | undefined>();
  const [projectSettingsOpen, setProjectSettingsOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>();

  // Get current user
  const { data: user } = trpc.users.getCurrentUser.useQuery();
  const role = user?.role || "admin";
  const navigation = getNavigationForRole(role);

  // Get recent moves for sidebar
  const { data: recentMoves, refetch: refetchMoves } = trpc.moves.list.useQuery({}, {
    refetchOnWindowFocus: false,
  });

  // Get move IDs for fetching conversations
  const moveIds = recentMoves?.slice(0, 10).map(move => move.id) || [];

  // Fetch conversations for all recent moves in a single query
  const { data: conversationsByMove, refetch: refetchConversations } = trpc.conversations.listByMoves.useQuery(
    { moveIds },
    {
      enabled: moveIds.length > 0,
      refetchOnWindowFocus: false,
    }
  );

  // Group moves by company
  const movesByCompany = recentMoves?.reduce((acc, move) => {
    const companyName = move.employer?.name || "Unassigned";
    const companyId = move.employer?.id || "unassigned";

    if (!acc[companyId]) {
      acc[companyId] = {
        companyName,
        companyId,
        moves: [],
      };
    }

    acc[companyId].moves.push(move);
    return acc;
  }, {} as Record<string, { companyName: string; companyId: string; moves: typeof recentMoves }>);

  const companies = Object.values(movesByCompany || {}).sort((a, b) =>
    a.companyName.localeCompare(b.companyName)
  );

  const handleCreateConversation = (moveId: string) => {
    setSelectedMoveId(moveId);
    setCreateDialogOpen(true);
  };

  const handleConversationCreated = () => {
    setCreateDialogOpen(false);
    setSelectedMoveId(undefined);
    // Refetch conversations
    refetchConversations();
  };

  const handleOpenCompanySettings = (companyId: string) => {
    const company = companies.find(c => c.companyId === companyId);
    setSelectedCompanyId(companyId);
    setSelectedCompanyName(company?.companyName);
    setCompanySettingsOpen(true);
  };

  const handleOpenProjectSettings = (projectId: string) => {
    setSelectedProjectId(projectId);
    setProjectSettingsOpen(true);
    // TODO: Implement project settings dialog
    alert(`Project settings for ${projectId} - Coming soon!`);
  };

  return (
    <>
      <div className="flex h-full w-64 flex-col border-r bg-background">
        {/* Logo */}
        <div className="flex h-16 items-center px-6 border-b">
          <span className="font-bold text-lg tracking-tight">Gullie</span>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden py-4">
          <div className="px-3 space-y-1 mb-6">
            {navigation.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className={cn("h-4 w-4", isActive ? "text-primary-foreground" : "text-muted-foreground")} />
                  {item.name}
                </Link>
              );
            })}
          </div>

          {/* Projects & Conversations */}
          {role !== "employee" && (
            <div className="flex-1 overflow-hidden px-3 flex flex-col min-w-0">
              <div className="flex items-center justify-between px-2 pb-2 mb-1 flex-shrink-0">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Projects
                </span>
                <Button
                  onClick={() => router.push("/moves/new")}
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 flex-shrink-0 text-muted-foreground hover:text-foreground"
                  title="New Project"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
                <div className="space-y-1 pr-2">
                  {companies.map((company) => (
                    <CompanyFolder
                      key={company.companyId}
                      companyId={company.companyId}
                      companyName={company.companyName}
                      moves={company.moves}
                      conversationsByMove={conversationsByMove || {}}
                      currentMoveId={currentMoveId}
                      currentConversationId={currentConversationId}
                      onCreateConversation={handleCreateConversation}
                      onOpenCompanySettings={handleOpenCompanySettings}
                      onOpenProjectSettings={handleOpenProjectSettings}
                    />
                  ))}
                  {(!recentMoves || recentMoves.length === 0) && (
                    <div className="px-3 py-8 text-xs text-muted-foreground text-center">
                      No projects yet
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Conversation Dialog */}
      {selectedMoveId && (
        <CreateConversationDialog
          moveId={selectedMoveId}
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onSuccess={handleConversationCreated}
        />
      )}

      {/* Company Settings Dialog */}
      {selectedCompanyId && selectedCompanyName && (
        <CompanySettingsDialog
          companyId={selectedCompanyId}
          companyName={selectedCompanyName}
          open={companySettingsOpen}
          onOpenChange={setCompanySettingsOpen}
        />
      )}
    </>
  );
}
