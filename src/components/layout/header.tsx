"use client";

import { Bell, Search, User, Move, Users, Briefcase, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/utils/trpc";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const getSearchPlaceholder = (role?: string) => {
  switch (role) {
    case "employee":
      return "Search your relocation info...";
    case "company":
      return "Search employees, moves...";
    case "vendor":
      return "Search services, orders...";
    case "admin":
    default:
      return "Search moves, employees, services...";
  }
};

const getTypeIcon = (type: "move" | "employee" | "service") => {
  switch (type) {
    case "move":
      return Move;
    case "employee":
      return Users;
    case "service":
      return Briefcase;
  }
};

export function Header() {
  const { data: user } = trpc.users.getCurrentUser.useQuery();
  const role = user?.role || "admin";
  const placeholder = getSearchPlaceholder(role);
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: searchResults, isLoading } = trpc.search.global.useQuery(
    { query: debouncedQuery, limit: 10 },
    { enabled: debouncedQuery.length > 0 }
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const allResults = searchResults
    ? [
        ...searchResults.moves.map((r) => ({ ...r, category: "Moves" })),
        ...searchResults.employees.map((r) => ({ ...r, category: "Employees" })),
        ...searchResults.services.map((r) => ({ ...r, category: "Services" })),
      ].sort((a, b) => b.score - a.score)
    : [];

  const handleResultClick = (url: string) => {
    router.push(url);
    setIsOpen(false);
    setSearchQuery("");
  };

  return (
    <header className="flex h-16 items-center gap-4 border-b bg-background px-6">
      <div className="flex flex-1 items-center gap-4">
        <div className="relative flex-1 max-w-md" ref={searchRef}>
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder={placeholder}
            className="pl-9"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => {
              if (searchQuery.length > 0) setIsOpen(true);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setIsOpen(false);
              }
            }}
          />
          {isOpen && searchQuery.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-50 mt-2 max-h-96 overflow-auto rounded-md border bg-popover shadow-lg">
              {isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : allResults.length > 0 ? (
                <div className="p-2">
                  {allResults.map((result) => {
                    const Icon = getTypeIcon(result.type);
                    return (
                      <button
                        key={`${result.type}-${result.id}`}
                        onClick={() => handleResultClick(result.url)}
                        className="w-full rounded-sm px-3 py-2 text-left text-sm hover:bg-accent focus:bg-accent focus:outline-none"
                      >
                        <div className="flex items-start gap-3">
                          <Icon className="mt-0.5 h-4 w-4 text-muted-foreground" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium">{result.title}</div>
                            <div className="text-xs text-muted-foreground truncate">
                              {result.subtitle}
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {result.category}
                          </Badge>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  No results found
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="capitalize">
          {role}
        </Badge>
        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon">
          <User className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}

