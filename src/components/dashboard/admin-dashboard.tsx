"use client";

import { StatsGrid } from "./stats-grid";
import { RecentMovesCard } from "./recent-moves-card";
import { AlertsCard } from "./alerts-card";
import { trpc } from "@/utils/trpc";
import { useMemo } from "react";
import { Users, Home, Briefcase, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { DashboardStats } from "@/types/dashboard";

export function AdminDashboard() {
  const { data: moves, isLoading: movesLoading } = trpc.moves.list.useQuery({
    limit: 5,
  });

  const { data: allMoves } = trpc.moves.list.useQuery({
    limit: 100,
  });

  const { data: pendingServicesData, isLoading: servicesLoading } = trpc.services.list.useQuery({
    status: "pending",
  });

  const { data: housingOptions, isLoading: housingLoading } = trpc.housing.list.useQuery({});

  const { data: invoices, isLoading: invoicesLoading } = trpc.financial.invoices.list.useQuery({});

  const activeMoves = useMemo(() => {
    return allMoves?.filter(
      (move) => move.status !== "completed" && move.status !== "cancelled"
    ).length || 0;
  }, [allMoves]);

  const pendingServices = pendingServicesData?.length || 0;
  const housingOptionsFound = housingOptions?.length || 0;

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

  const previousMonthSpend = useMemo(() => {
    if (!invoices) return null;
    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthInvoices = invoices.filter(
      (inv) => inv.createdAt && 
        new Date(inv.createdAt) >= startOfPreviousMonth && 
        new Date(inv.createdAt) < startOfCurrentMonth
    );
    const total = previousMonthInvoices.reduce((sum, inv) => {
      return sum + (parseFloat(inv.total?.toString() || "0") || 0);
    }, 0);
    return total;
  }, [invoices]);

  const spendTrend = useMemo(() => {
    if (!monthlySpend || !previousMonthSpend || previousMonthSpend === 0) return null;
    const change = ((monthlySpend - previousMonthSpend) / previousMonthSpend) * 100;
    return {
      value: `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`,
      up: change >= 0,
    };
  }, [monthlySpend, previousMonthSpend]);

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
      title: "Listings",
      value: housingOptionsFound,
      icon: Home,
      trend: "+5",
      trendUp: true,
      color: "text-purple-600",
    },
    {
      title: "Pending Services",
      value: pendingServices,
      icon: Briefcase,
      trend: "-3",
      trendUp: false,
      color: "text-orange-600",
    },
    {
      title: "Monthly Spend",
      value: monthlySpend !== null 
        ? `$${monthlySpend.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
        : "$0",
      icon: DollarSign,
      trend: spendTrend?.value || "+8%",
      trendUp: spendTrend?.up ?? true,
      color: "text-green-600",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Relocation Operations
          </h1>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="h-9 text-sm">Export</Button>
          <Button className="h-9 text-sm bg-primary hover:bg-primary/90" asChild>
            <Link href="/moves/new">New Move</Link>
          </Button>
        </div>
      </div>

      <StatsGrid stats={stats} role="admin" />

      <div className="grid gap-6 md:grid-cols-7">
        <RecentMovesCard moves={moves} isLoading={movesLoading} />
        <AlertsCard />
      </div>
    </div>
  );
}

