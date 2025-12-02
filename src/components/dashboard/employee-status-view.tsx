"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, Clock, AlertCircle, Home, Truck, Briefcase } from "lucide-react";
import { trpc } from "@/utils/trpc";
import { useMemo } from "react";

type Status = "completed" | "in_progress" | "pending" | "attention";

interface StatusStep {
  label: string;
  value: string;
  status: Status;
}

interface StatusSection {
  id: string;
  title: string;
  icon: React.ElementType;
  status: Status;
  steps: StatusStep[];
}

function StatusIcon({ status }: { status: Status }) {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case "in_progress":
      return <Clock className="h-4 w-4 text-blue-500" />;
    case "attention":
      return <AlertCircle className="h-4 w-4 text-amber-500" />;
    default:
      return <Circle className="h-4 w-4 text-muted-foreground" />;
  }
}

export function EmployeeStatusView({ moveId }: { moveId?: string }) {
  const { data: move, isLoading: moveLoading } = trpc.moves.getById.useQuery(
    { id: moveId! },
    { enabled: !!moveId }
  );

  const { data: housingOptions } = trpc.housing.list.useQuery(
    { moveId: moveId! },
    { enabled: !!moveId }
  );

  const { data: services } = trpc.services.list.useQuery(
    { moveId: moveId! },
    { enabled: !!moveId }
  );

  const getMoveStatus = (move: any): Status => {
    if (!move) return "pending";
    if (move.status === "completed") return "completed";
    if (move.status === "cancelled") return "pending";
    if (move.status === "initiated" || move.status === "intake_in_progress") return "in_progress";
    return "in_progress";
  };

  // Get housing preferences from move
  const housingPreferences = useMemo(() => {
    if (!move?.housingPreferences) return null;
    const prefs = move.housingPreferences;
    const urbanRural = prefs.urbanRural || "urban";
    const bedrooms = prefs.requiredCriteria?.find((c: string) => c.toLowerCase().includes("bedroom")) || "2 Bedroom";
    return `${urbanRural.charAt(0).toUpperCase() + urbanRural.slice(1)}, ${bedrooms}`;
  }, [move]);

  // Get housing status
  const housingStatus = useMemo(() => {
    if (!housingOptions || housingOptions.length === 0) return "pending";
    // If we have options, we're in progress
    return "in_progress";
  }, [housingOptions]);

  // Get services status
  const servicesStatus = useMemo(() => {
    if (!services || services.length === 0) return "pending";
    const hasInProgress = services.some((s) => s.status === "in_progress" || s.status === "booked");
    if (hasInProgress) return "in_progress";
    const allCompleted = services.every((s) => s.status === "completed");
    return allCompleted ? "completed" : "pending";
  }, [services]);

  // Get cleaning service status
  const cleaningService = useMemo(() => {
    if (!services) return null;
    return services.find((s) => s.type.toLowerCase().includes("cleaning") || s.type.toLowerCase().includes("clean"));
  }, [services]);

  // Get packing service status
  const packingService = useMemo(() => {
    if (!services) return null;
    return services.find((s) => s.type.toLowerCase().includes("packing") || s.type.toLowerCase().includes("pack"));
  }, [services]);

  const sections: StatusSection[] = [
    {
      id: "move",
      title: "Move Logistics",
      icon: Truck,
      status: getMoveStatus(move),
      steps: [
        {
          label: "Move Initiated",
          value: move?.createdAt ? new Date(move.createdAt).toLocaleDateString() : "-",
          status: move ? "completed" : "pending",
        },
        {
          label: "Needs Assessment",
          value: move?.lifestyleIntakeCompleted ? "Completed" : "Pending",
          status: move?.lifestyleIntakeCompleted ? "completed" : "attention",
        },
        {
          label: "Move Date",
          value: move?.moveDate ? new Date(move.moveDate).toLocaleDateString() : "Not set",
          status: move?.moveDate ? "completed" : "pending",
        },
      ],
    },
    {
      id: "housing",
      title: "Housing",
      icon: Home,
      status: housingStatus,
      steps: [
        {
          label: "Preferences",
          value: housingPreferences || "Not set",
          status: housingPreferences ? "completed" : "pending",
        },
        {
          label: "Options Sent",
          value: housingOptions && housingOptions.length > 0 ? `${housingOptions.length} Candidates` : "0 Candidates",
          status: housingOptions && housingOptions.length > 0 ? "completed" : "pending",
        },
        {
          label: "Selection",
          value: "Pending Review",
          status: "attention",
        },
      ],
    },
    {
      id: "services",
      title: "Services",
      icon: Briefcase,
      status: servicesStatus,
      steps: [
        {
          label: "Cleaning",
          value: cleaningService
            ? cleaningService.status === "completed"
              ? "Completed"
              : cleaningService.status === "booked" || cleaningService.status === "in_progress"
              ? "Scheduled"
              : "Requested"
            : "Not requested",
          status: cleaningService
            ? cleaningService.status === "completed"
              ? "completed"
              : cleaningService.status === "booked" || cleaningService.status === "in_progress"
              ? "in_progress"
              : "pending"
            : "pending",
        },
        {
          label: "Packing",
          value: packingService
            ? packingService.status === "completed"
              ? "Completed"
              : packingService.status === "booked" || packingService.status === "in_progress"
              ? "Scheduled"
              : "Requested"
            : "Not requested",
          status: packingService
            ? packingService.status === "completed"
              ? "completed"
              : packingService.status === "booked" || packingService.status === "in_progress"
              ? "in_progress"
              : "pending"
            : "pending",
        },
      ],
    },
  ];

  if (moveLoading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Loading relocation status...
      </div>
    );
  }

  if (!moveId) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
        <p className="text-muted-foreground font-medium">
          No move is assigned to you
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Please contact your relocation coordinator to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <Card key={section.id} className="overflow-hidden">
          <CardHeader className="p-4 bg-muted/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <section.icon className="h-5 w-5 text-muted-foreground" />
                <CardTitle className="text-base font-semibold">{section.title}</CardTitle>
              </div>
              <StatusIcon status={section.status} />
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {section.steps.map((step, idx) => (
              <div key={idx} className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{step.label}</span>
                  <span
                    className={`font-medium ${
                      step.status === "attention"
                        ? "text-amber-600"
                        : step.status === "completed"
                        ? "text-green-600"
                        : step.status === "in_progress"
                        ? "text-blue-600"
                        : "text-muted-foreground"
                    }`}
                  >
                    {step.value}
                  </span>
                </div>
                {idx < section.steps.length - 1 && <div className="h-px bg-border/50 mt-2" />}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

