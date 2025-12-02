"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, AlertCircle, Briefcase } from "lucide-react";
import { trpc } from "@/utils/trpc";
import Link from "next/link";
import { useMemo } from "react";

export function AlertsCard() {
  const { data: policyExceptions, isLoading: exceptionsLoading } = trpc.operations.policyExceptions.list.useQuery({
    status: "pending",
  });

  const { data: pendingServices, isLoading: servicesLoading } = trpc.services.list.useQuery({
    status: "pending",
  });

  const exceptionsCount = policyExceptions?.length || 0;
  const servicesCount = pendingServices?.length || 0;

  const housingExceptions = useMemo(() => {
    return policyExceptions?.filter(
      (ex) => ex.serviceType?.toLowerCase().includes("housing") || 
              ex.requestedService?.toLowerCase().includes("housing") ||
              ex.requestedService?.toLowerCase().includes("budget")
    ) || [];
  }, [policyExceptions]);

  const needsVendorConfirmation = useMemo(() => {
    return pendingServices?.filter(
      (service) => service.status === "pending" && !service.vendorName
    ) || [];
  }, [pendingServices]);

  if (exceptionsLoading || servicesLoading) {
    return (
      <div className="md:col-span-3 space-y-6">
        <Card className="border shadow-sm h-full">
          <CardHeader className="px-6 py-5 border-b">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Needs Attention
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-sm text-muted-foreground">Loading...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="md:col-span-3 space-y-6">
      <Card className="border shadow-sm h-full">
        <CardHeader className="px-6 py-5 border-b">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Needs Attention
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {exceptionsCount > 0 && (
            <Link href="/operations" className="block">
              <div className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer group">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium group-hover:text-primary transition-colors">
                      {exceptionsCount} Policy Exception{exceptionsCount !== 1 ? 's' : ''}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      {housingExceptions.length > 0 
                        ? `${housingExceptions.length} housing request${housingExceptions.length !== 1 ? 's' : ''} exceeding budget.`
                        : "Requests requiring employer approval."
                      }
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          )}

          {servicesCount > 0 && (
            <Link href="/services" className="block">
              <div className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer group">
                <div className="flex items-start gap-3">
                  <Briefcase className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium group-hover:text-primary transition-colors">
                      {servicesCount} Pending Service{servicesCount !== 1 ? 's' : ''}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      {needsVendorConfirmation.length > 0
                        ? `${needsVendorConfirmation.length} awaiting vendor confirmation.`
                        : "Services pending action."
                      }
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          )}

          {exceptionsCount === 0 && servicesCount === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-2 text-sm">
              <Activity className="h-8 w-8 opacity-20" />
              <p>All clear! No items need attention.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

