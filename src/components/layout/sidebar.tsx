"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Home,
  Briefcase,
  DollarSign,
  Settings,
  Plus,
  MessageCircle,
  MoreVertical,
  Edit2,
  Star,
  Trash,
  Building2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { trpc } from "@/utils/trpc";
import type { UserRole } from "@/types/dashboard";

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
  
  // Get current user
  const { data: user } = trpc.users.getCurrentUser.useQuery();
  const role = user?.role || "admin";
  const navigation = getNavigationForRole(role);
  
  const { data: recentChats, refetch: refetchChats } = trpc.chat.list.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  const createChat = trpc.chat.create.useMutation({
    onSuccess: (session) => {
      router.push(`/chat?id=${session.id}`);
      refetchChats();
    },
    onError: (error) => {
      console.error("Failed to create chat session:", error);
    },
  });

  const deleteChat = trpc.chat.delete.useMutation({
    onSuccess: () => {
      refetchChats();
      if (pathname === "/chat") {
        router.push("/chat");
      }
    },
  });

  return (
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

        {/* Chats - Hidden for employees */}
        {role !== "employee" && (
          <div className="flex-1 overflow-hidden px-3 flex flex-col">
            <div className="flex items-center justify-between px-2 pb-2 mb-1">
              {(role === "admin" || role === "company") && (
                <Link href="/conversations" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors">
                  Conversations
                </Link>
              )}
              {role === "vendor" && (
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Chat
                </span>
              )}
              <Button 
                onClick={() => createChat.mutate()} 
                variant="ghost" 
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-foreground"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            <ScrollArea className="flex-1 w-full">
              <div className="space-y-0.5">
                {recentChats?.map((chat) => {
                  const isActive = pathname === "/chat" && window.location.search.includes(chat.id);
                  return (
                    <div
                      key={chat.id}
                      className={cn(
                        "flex items-center w-full max-w-full rounded-md pr-1 text-sm transition-all duration-200 group/item",
                        isActive
                          ? "bg-muted font-medium text-foreground"
                          : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      )}
                    >
                      <Link
                        href={`/chat?id=${chat.id}`}
                        className="flex-1 flex items-center gap-3 pl-3 py-2 overflow-hidden min-w-0"
                      >
                        <MessageCircle className={cn(
                          "h-4 w-4 flex-shrink-0 transition-colors",
                          isActive ? "text-foreground" : "text-muted-foreground group-hover/item:text-foreground"
                        )} />
                        <span className="truncate" title={chat.title}>{chat.title?.split('<')[0].trim() || "New Chat"}</span>
                      </Link>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className={cn(
                              "h-6 w-6 transition-all duration-200", 
                              "opacity-0 group-hover/item:opacity-100 focus:opacity-100 data-[state=open]:opacity-100",
                              isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                            )}
                          >
                            <Settings className="h-3 w-3" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem onClick={() => console.log("Rename")}>
                            <Edit2 className="mr-2 h-3 w-3" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => console.log("Favorite")}>
                            <Star className="mr-2 h-3 w-3" />
                            Favorite
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => deleteChat.mutate({ sessionId: chat.id })}>
                            <Trash className="mr-2 h-3 w-3" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  );
                })}
                {(!recentChats || recentChats.length === 0) && (
                  <div className="px-3 py-8 text-xs text-muted-foreground text-center">
                    No conversations yet
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>

      {/* Footer User */}
      <div className="p-4 border-t bg-muted/5">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
            {user?.name
              ?.split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2) || "U"}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium truncate">{user?.name || "User"}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email || "user@example.com"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
