"use client";

import { StatsCard } from "./stats-card";
import type { DashboardStats, UserRole } from "@/types/dashboard";
import { LucideIcon } from "lucide-react";

interface StatsGridProps {
  stats: (DashboardStats & { icon?: LucideIcon })[];
  role?: UserRole;
  className?: string;
}

export function StatsGrid({ stats, role, className }: StatsGridProps) {
  // Convert stats to StatsCard format
  const statsCards = stats.map((stat) => {
    return {
      title: stat.title,
      value: stat.value,
      icon: stat.icon, // Optional icon
      trend: stat.trend || "",
      trendUp: stat.trendUp ?? true,
      color: stat.color || "text-blue-600",
    };
  });

  // Use a fixed grid layout that works well for different numbers of stats
  const gridClass = stats.length === 1 
    ? "grid-cols-1" 
    : stats.length === 2 
    ? "md:grid-cols-2" 
    : stats.length === 3
    ? "md:grid-cols-2 lg:grid-cols-3"
    : "md:grid-cols-2 lg:grid-cols-4";

  return (
    <div className={`grid gap-4 ${gridClass} ${className || ""}`}>
      {statsCards.map((stat, index) => (
        <StatsCard
          key={stat.title || index}
          title={stat.title}
          value={stat.value}
          icon={stat.icon}
          trend={stat.trend}
          trendUp={stat.trendUp}
          color={stat.color}
        />
      ))}
    </div>
  );
}

