"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, User, ArrowRight } from "lucide-react";
import { trpc } from "@/utils/trpc";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "debug_selected_employee_id";

interface EmployeeSelectorProps {
  onSelect: (employeeId: string, moveId?: string) => void;
}

export function EmployeeSelector({ onSelect }: EmployeeSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: employees, isLoading } = trpc.employees.list.useQuery({
    limit: 100,
  });

  const { data: allMoves } = trpc.moves.list.useQuery({
    limit: 1000,
  });

  const filteredEmployees = employees?.filter((emp) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        emp.fullName.toLowerCase().includes(query) ||
        emp.email.toLowerCase().includes(query) ||
        emp.officeLocation.toLowerCase().includes(query)
      );
    }
    return true;
  }) || [];

  const handleSelect = (employeeId: string) => {
    // Find the employee's move
    const move = allMoves?.find((m) => m.employeeId === employeeId);
    localStorage.setItem(STORAGE_KEY, employeeId);
    onSelect(employeeId, move?.id);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <User className="h-5 w-5" />
          Select Employee to View
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          Choose an employee to view their relocation portal
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search employees by name, email, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Loading employees...
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No employees found
          </div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {filteredEmployees.map((employee) => {
              const move = allMoves?.find((m) => m.employeeId === employee.id);
              const hasMove = !!move;
              
              return (
                <button
                  key={employee.id}
                  onClick={() => handleSelect(employee.id)}
                  className={cn(
                    "w-full flex items-center justify-between p-4 rounded-lg border",
                    "hover:bg-muted/50 transition-colors text-left",
                    "group"
                  )}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-xs flex-shrink-0">
                      {employee.fullName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm group-hover:text-primary transition-colors truncate">
                        {employee.fullName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {employee.email}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {employee.officeLocation}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {hasMove && (
                      <span className="text-xs text-muted-foreground">
                        Has Move
                      </span>
                    )}
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

