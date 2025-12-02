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
import { Search, Briefcase, Loader2 } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Service, DashboardFilters } from "@/types/dashboard";

interface ServiceListProps {
  services: Service[];
  filters?: DashboardFilters;
  onServiceClick?: (service: Service) => void;
  showVendorInfo?: boolean;
  isLoading?: boolean;
  className?: string;
}

function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  const normalized = status.toLowerCase();
  if (normalized === "completed") return "default";
  if (normalized === "cancelled") return "destructive";
  if (normalized === "pending" || normalized === "quoted") return "outline";
  return "secondary";
}

function formatStatus(status: string): string {
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatServiceType(type: string): string {
  return type
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function ServiceList({
  services,
  filters,
  onServiceClick,
  showVendorInfo = false,
  isLoading = false,
  className,
}: ServiceListProps) {
  const [searchQuery, setSearchQuery] = useState(filters?.search || "");

  const filteredServices = services.filter((service) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        service.type.toLowerCase().includes(query) ||
        service.status.toLowerCase().includes(query) ||
        (service.vendorName && service.vendorName.toLowerCase().includes(query))
      );
    }
    if (filters?.status) {
      return service.status === filters.status;
    }
    return true;
  });

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Briefcase className="h-4 w-4" />
          Services
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Loading...
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground gap-2 text-sm">
            <Briefcase className="h-8 w-8 opacity-20" />
            <p>No services found</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service Type</TableHead>
                  <TableHead>Status</TableHead>
                  {showVendorInfo && <TableHead>Vendor</TableHead>}
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredServices.map((service) => (
                  <TableRow
                    key={service.id}
                    className={cn(onServiceClick && "cursor-pointer")}
                    onClick={() => onServiceClick?.(service)}
                  >
                    <TableCell className="font-medium">
                      {formatServiceType(service.type)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={getStatusVariant(service.status)}
                        className="capitalize"
                      >
                        {formatStatus(service.status)}
                      </Badge>
                    </TableCell>
                    {showVendorInfo && (
                      <TableCell className="text-muted-foreground">
                        {service.vendorName || "-"}
                      </TableCell>
                    )}
                    <TableCell className="text-muted-foreground">
                      {new Date(service.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/moves/${service.moveId}`}
                        className="text-xs text-primary hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View →
                      </Link>
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

