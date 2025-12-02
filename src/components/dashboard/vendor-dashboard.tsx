"use client";

import { StatsGrid } from "./stats-grid";
import { ServiceList } from "./service-list";
import { trpc } from "@/utils/trpc";
import { useMemo } from "react";
import { Briefcase, DollarSign, CheckCircle2, Clock } from "lucide-react";
import type { DashboardStats, Service } from "@/types/dashboard";

interface VendorDashboardProps {
  vendorId?: string;
}

export function VendorDashboard({ vendorId }: VendorDashboardProps) {
  const { data: services, isLoading: servicesLoading } = trpc.services.list.useQuery({});

  // Filter services assigned to this vendor
  // Note: Services table currently only has vendorName, not vendorId
  // In a real implementation, we'd add vendorId field or create a vendors table
  const vendorServices = useMemo(() => {
    if (!services) return [];
    // For now, show all services with vendorName
    // In production, this would filter by vendorId matching the user's vendorId
    return services
      .filter((service) => {
        // If vendorName exists, include it (in real app, would match vendorId)
        // For demo purposes, showing all services with vendors assigned
        return service.vendorName || true; // Show all for now
      })
      .map((service) => ({
        id: service.id,
        moveId: service.moveId,
        type: service.type,
        status: service.status,
        vendorId: undefined, // Would be vendorId from services table
        vendorName: service.vendorName,
        createdAt: service.createdAt ? new Date(service.createdAt) : new Date(),
      })) as Service[];
  }, [services]);

  const pendingServices = useMemo(() => {
    return vendorServices.filter((s) => s.status === "pending" || s.status === "quoted").length;
  }, [vendorServices]);

  const completedServices = useMemo(() => {
    return vendorServices.filter((s) => s.status === "completed").length;
  }, [vendorServices]);

  const inProgressServices = useMemo(() => {
    return vendorServices.filter((s) => s.status === "in_progress" || s.status === "booked").length;
  }, [vendorServices]);

  const stats: DashboardStats[] = [
    {
      title: "Pending",
      value: pendingServices,
      icon: Clock,
      trend: "",
      trendUp: false,
      color: "text-orange-600",
    },
    {
      title: "In Progress",
      value: inProgressServices,
      icon: Briefcase,
      trend: "",
      trendUp: true,
      color: "text-blue-600",
    },
    {
      title: "Completed",
      value: completedServices,
      icon: CheckCircle2,
      trend: "",
      trendUp: true,
      color: "text-green-600",
    },
    {
      title: "Total Services",
      value: vendorServices.length,
      icon: Briefcase,
      trend: "",
      trendUp: true,
      color: "text-purple-600",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Vendor Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage your assigned services
          </p>
        </div>
      </div>

      <StatsGrid stats={stats} role="vendor" />

      <ServiceList
        services={vendorServices}
        showVendorInfo={false}
        isLoading={servicesLoading}
      />
    </div>
  );
}

