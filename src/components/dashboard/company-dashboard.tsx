"use client";

import { StatsGrid } from "./stats-grid";
import { EmployeeList } from "./employee-list";
import { RecentMovesCard } from "./recent-moves-card";
import { trpc } from "@/utils/trpc";
import { useMemo } from "react";
import { Users, Home, Briefcase, DollarSign } from "lucide-react";
import type { DashboardStats, Employee } from "@/types/dashboard";

interface CompanyDashboardProps {
  employerId?: string;
}

export function CompanyDashboard({ employerId }: CompanyDashboardProps) {
  const { data: moves, isLoading: movesLoading } = trpc.moves.list.useQuery({
    limit: 5,
    employerId: employerId,
  });

  const { data: allMoves } = trpc.moves.list.useQuery({
    limit: 100,
    employerId: employerId,
  });

  // Get employees for this company through moves
  // Note: Using the list endpoint and filtering client-side for now
  // In production, you'd use getByEmployer endpoint if available
  const { data: employees } = trpc.employees.list.useQuery({
    limit: 100,
  });

  const { data: invoices, isLoading: invoicesLoading } = trpc.financial.invoices.list.useQuery({});

  // Filter employees that have moves with this employer
  const companyEmployees = useMemo(() => {
    if (!employees || !allMoves) return [];
    const moveEmployeeIds = new Set(allMoves.map((move) => move.employeeId));
    return employees
      .filter((emp) => moveEmployeeIds.has(emp.id))
      .map((emp) => {
        const move = allMoves.find((m) => m.employeeId === emp.id);
        return {
          id: emp.id,
          fullName: emp.fullName,
          email: emp.email,
          phone: emp.phone,
          officeLocation: emp.officeLocation,
          moveId: move?.id,
          moveStatus: move?.status,
        } as Employee;
      });
  }, [employees, allMoves]);

  const activeMoves = useMemo(() => {
    return allMoves?.filter(
      (move) => move.status !== "completed" && move.status !== "cancelled"
    ).length || 0;
  }, [allMoves]);

  const monthlySpend = useMemo(() => {
    if (!invoices) return null;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthInvoices = invoices.filter(
      (inv) => inv.createdAt && new Date(inv.createdAt) >= startOfMonth
    );
    const total = monthInvoices.reduce((sum, inv) => {
      return sum + (parseFloat(inv.total?.toString() || "0") || 0);
    }, 0);
    return total;
  }, [invoices]);

  const stats: DashboardStats[] = [
    {
      title: "Active Moves",
      value: activeMoves,
      icon: Users,
      trend: "+12%",
      trendUp: true,
      color: "text-blue-600",
    },
    {
      title: "Employees",
      value: companyEmployees.length,
      icon: Users,
      trend: "+2",
      trendUp: true,
      color: "text-purple-600",
    },
    {
      title: "Monthly Spend",
      value: monthlySpend !== null 
        ? `$${monthlySpend.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
        : "$0",
      icon: DollarSign,
      trend: "+8%",
      trendUp: true,
      color: "text-green-600",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Company Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your employees' relocations
          </p>
        </div>
      </div>

      <StatsGrid stats={stats} role="company" />

      <div className="grid gap-6 md:grid-cols-7">
        <RecentMovesCard moves={moves} isLoading={movesLoading} />
        <EmployeeList
          employees={companyEmployees}
          showMoveStatus={true}
          className="md:col-span-3"
        />
      </div>
    </div>
  );
}

