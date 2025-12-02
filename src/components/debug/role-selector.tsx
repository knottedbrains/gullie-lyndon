"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Settings, User } from "lucide-react";
import type { UserRole } from "@/types/dashboard";

const ROLES: UserRole[] = ["admin", "company", "vendor", "employee"];

const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  company: "Company",
  vendor: "Vendor",
  employee: "Employee",
};

const STORAGE_KEY = "debug_user_role";

export function RoleSelector() {
  const [selectedRole, setSelectedRole] = useState<UserRole>("admin");
  const [isOpen, setIsOpen] = useState(false);

  // Load from localStorage or cookie on mount
  useEffect(() => {
    // Try localStorage first
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && ROLES.includes(saved as UserRole)) {
      setSelectedRole(saved as UserRole);
      // Sync to cookie
      document.cookie = `debug_user_role=${saved}; path=/; max-age=31536000; SameSite=Lax`;
    } else {
      // Try cookie
      const cookies = document.cookie.split(";");
      const roleCookie = cookies.find((c) => c.trim().startsWith("debug_user_role="));
      if (roleCookie) {
        const role = roleCookie.split("=")[1]?.trim();
        if (role && ROLES.includes(role as UserRole)) {
          setSelectedRole(role as UserRole);
          localStorage.setItem(STORAGE_KEY, role);
        }
      }
    }
  }, []);

  // Save to localStorage and cookie when changed
  const handleRoleChange = (role: UserRole) => {
    setSelectedRole(role);
    localStorage.setItem(STORAGE_KEY, role);
    // Set cookie for server-side access
    document.cookie = `debug_user_role=${role}; path=/; max-age=31536000; SameSite=Lax`;
    
    // Clear selected employee when switching away from employee role
    if (role !== "employee") {
      localStorage.removeItem("debug_selected_employee_id");
    }
    
    setIsOpen(false);
    // Reload page to apply new role
    window.location.reload();
  };

  // Only show in development
  // In Next.js, NODE_ENV is available on both client and server
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="bg-background/80 backdrop-blur-sm border-2 shadow-lg hover:shadow-xl"
          >
            <Settings className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Debug: </span>
            <Badge variant="secondary" className="ml-2 capitalize">
              {ROLE_LABELS[selectedRole]}
            </Badge>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
            Select User Role
          </div>
          {ROLES.map((role) => (
            <DropdownMenuItem
              key={role}
              onClick={() => handleRoleChange(role)}
              className="flex items-center justify-between cursor-pointer"
            >
              <span className="capitalize">{ROLE_LABELS[role]}</span>
              {selectedRole === role && (
                <User className="h-4 w-4 text-primary" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

