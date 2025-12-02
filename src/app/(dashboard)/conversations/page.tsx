"use client";

import { useState } from "react";
import { trpc } from "@/utils/trpc";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Search, 
  Trash, 
  MessageCircle, 
  MoreVertical,
  Loader2,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function ConversationsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { data: chats, isLoading, refetch } = trpc.chat.list.useQuery();
  
  const createChat = trpc.chat.create.useMutation({
    onSuccess: (session) => {
      router.push(`/chat?id=${session.id}`);
    },
    onError: (error) => {
      console.error("Failed to create chat session:", error);
    },
  });

  const deleteChat = trpc.chat.delete.useMutation({
    onSuccess: () => {
      refetch();
      setSelectedIds(new Set());
    },
  });

  const bulkDeleteChats = trpc.chat.bulkDelete.useMutation({
    onSuccess: () => {
      refetch();
      setSelectedIds(new Set());
    },
  });

  const filteredChats = chats?.filter(chat => 
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredChats.length && filteredChats.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredChats.map(c => c.id)));
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    if (confirm(`Are you sure you want to delete ${selectedIds.size} conversations?`)) {
      bulkDeleteChats.mutate({ sessionIds: Array.from(selectedIds) });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this conversation?")) {
      deleteChat.mutate({ sessionId: id });
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Conversations</h1>
          <p className="text-muted-foreground">Manage your chat history and sessions.</p>
        </div>
        <Button onClick={() => createChat.mutate()} disabled={createChat.isLoading}>
          <Plus className="mr-2 h-4 w-4" />
          New Chat
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
        {selectedIds.size > 0 && (
          <Button 
            variant="destructive" 
            size="sm"
            onClick={handleBulkDelete}
            disabled={bulkDeleteChats.isLoading}
          >
            <Trash className="mr-2 h-4 w-4" />
            Delete ({selectedIds.size})
          </Button>
        )}
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <input 
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 accent-primary cursor-pointer"
                  checked={filteredChats.length > 0 && selectedIds.size === filteredChats.length}
                  onChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead>Title</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Last Active</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : filteredChats.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No conversations found.
                </TableCell>
              </TableRow>
            ) : (
              filteredChats.map((chat) => (
                <TableRow 
                  key={chat.id}
                  data-state={selectedIds.has(chat.id) ? "selected" : ""}
                >
                  <TableCell>
                    <input 
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 accent-primary cursor-pointer"
                      checked={selectedIds.has(chat.id)}
                      onChange={() => toggleSelect(chat.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link href={`/chat?id=${chat.id}`} className="flex items-center hover:underline decoration-primary/50 underline-offset-4">
                      <MessageCircle className="mr-2 h-4 w-4 text-muted-foreground" />
                      {chat.title}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {(chat as any).employee?.fullName || 
                     (chat as any).employee?.email || 
                     (chat as any).moveId ? "Employee (via move)" : "-"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {(chat as any).employer?.name || "-"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(chat.updatedAt))}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                           <Link href={`/chat?id=${chat.id}`}>Open</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleDelete(chat.id)}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

