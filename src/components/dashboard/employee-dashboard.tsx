"use client";

import { useState, useEffect } from "react";
import { PolicyStatusCard } from "./policy-status-card";
import { EmployeeStatusView } from "./employee-status-view";
import { EmployeeSelector } from "./employee-selector";
import { trpc } from "@/utils/trpc";
import { Button } from "@/components/ui/button";
import { User, X } from "lucide-react";

interface EmployeeDashboardProps {
  employeeId?: string;
  moveId?: string;
}

const STORAGE_KEY = "debug_selected_employee_id";

export function EmployeeDashboard({ employeeId, moveId }: EmployeeDashboardProps) {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [selectedMoveId, setSelectedMoveId] = useState<string | null>(null);

  // Load selected employee from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setSelectedEmployeeId(saved);
    }
  }, []);

  // Find move for selected employee
  const { data: allMoves } = trpc.moves.list.useQuery(
    { limit: 1000 },
    { enabled: !!selectedEmployeeId && !moveId }
  );

  // Update selectedMoveId when moves are loaded
  useEffect(() => {
    if (selectedEmployeeId && allMoves && !moveId) {
      const move = allMoves.find((m) => m.employeeId === selectedEmployeeId);
      if (move) {
        setSelectedMoveId(move.id);
      }
    }
  }, [selectedEmployeeId, allMoves, moveId]);

  // Use provided moveId or selected moveId (convert null to undefined for type safety)
  const activeMoveId: string | undefined = moveId ?? (selectedMoveId ? selectedMoveId : undefined);

  // Get employee info if we have an ID
  const { data: employee } = trpc.employees.getById.useQuery(
    { id: selectedEmployeeId! },
    { enabled: !!selectedEmployeeId }
  );

  const handleEmployeeSelect = (empId: string, movId?: string) => {
    setSelectedEmployeeId(empId);
    setSelectedMoveId(movId || null);
    localStorage.setItem(STORAGE_KEY, empId);
  };

  const handleClearSelection = () => {
    setSelectedEmployeeId(null);
    setSelectedMoveId(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  // If no employee selected, show selector
  if (!selectedEmployeeId && !employeeId) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Employee Portal
          </h1>
          <p className="text-muted-foreground mt-2">
            Select an employee to view their relocation portal
          </p>
        </div>
        <EmployeeSelector onSelect={handleEmployeeSelect} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Your Relocation Portal
          </h1>
          <p className="text-muted-foreground mt-2">
            Track your relocation progress and check your policy status
          </p>
        </div>
        {selectedEmployeeId && (
          <div className="flex items-center gap-2">
            {employee && (
              <div className="text-right text-sm">
                <p className="font-medium">{employee.fullName}</p>
                <p className="text-muted-foreground text-xs">{employee.email}</p>
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearSelection}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Switch Employee
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <PolicyStatusCard moveId={activeMoveId} />
        </div>
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Track your relocation progress</h2>
            <EmployeeStatusView moveId={activeMoveId} />
          </div>
        </div>
      </div>
    </div>
  );
}

