"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Users, Loader2 } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Employee, DashboardFilters } from "@/types/dashboard";

interface EmployeeListProps {
  employees: Employee[];
  filters?: DashboardFilters;
  onEmployeeClick?: (employee: Employee) => void;
  showMoveStatus?: boolean;
  isLoading?: boolean;
  className?: string;
}

function getStatusVariant(status?: string): "default" | "secondary" | "destructive" | "outline" {
  if (!status) return "outline";
  const normalized = status.toLowerCase();
  if (normalized === "completed") return "default";
  if (normalized === "cancelled") return "destructive";
  return "secondary";
}

function formatStatus(status?: string): string {
  if (!status) return "No Move";
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function EmployeeList({
  employees,
  filters,
  onEmployeeClick,
  showMoveStatus = true,
  isLoading = false,
  className,
}: EmployeeListProps) {
  const [searchQuery, setSearchQuery] = useState(filters?.search || "");

  const filteredEmployees = employees.filter((employee) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        employee.fullName.toLowerCase().includes(query) ||
        employee.email.toLowerCase().includes(query) ||
        employee.officeLocation.toLowerCase().includes(query)
      );
    }
    return true;
  });

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Users className="h-4 w-4" />
          Employees
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search employees..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground gap-2 text-sm">
            <Users className="h-8 w-8 opacity-20" />
            <p>No employees found</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Office Location</TableHead>
                  {showMoveStatus && <TableHead>Status</TableHead>}
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((employee) => (
                  <TableRow
                    key={employee.id}
                    className={cn(
                      "cursor-pointer",
                      onEmployeeClick && "cursor-pointer"
                    )}
                    onClick={() => onEmployeeClick?.(employee)}
                  >
                    <TableCell className="font-medium">
                      {employee.fullName}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {employee.email}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {employee.officeLocation}
                    </TableCell>
                    {showMoveStatus && (
                      <TableCell>
                        <Badge
                          variant={getStatusVariant(employee.moveStatus)}
                          className="capitalize"
                        >
                          {formatStatus(employee.moveStatus)}
                        </Badge>
                      </TableCell>
                    )}
                    <TableCell className="text-right">
                      {employee.moveId && (
                        <Link
                          href={`/moves/${employee.moveId}`}
                          className="text-xs text-primary hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          View →
                        </Link>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

