"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// Progress component - using a simple div-based progress bar for now
import { CheckCircle2, Circle, Clock } from "lucide-react";
import { trpc } from "@/utils/trpc";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { MoveStatus } from "@/types/dashboard";

interface RelocationProgressCardProps {
  moveId?: string;
  showDetails?: boolean;
  className?: string;
}

const milestones = [
  { key: "initiated", label: "Move Initiated" },
  { key: "intake_in_progress", label: "Intake Complete" },
  { key: "housing_search", label: "Housing Search" },
  { key: "services_booked", label: "Services Booked" },
  { key: "in_transit", label: "In Transit" },
  { key: "completed", label: "Completed" },
];

const statusOrder: MoveStatus[] = [
  "initiated",
  "intake_in_progress",
  "housing_search",
  "services_booked",
  "in_transit",
  "completed",
  "cancelled",
];

function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  const normalized = status.toLowerCase();
  if (normalized === "completed") return "default";
  if (normalized === "cancelled") return "destructive";
  return "secondary";
}

function calculateProgress(status: MoveStatus): number {
  if (status === "cancelled") return 0;
  const index = statusOrder.indexOf(status);
  return index >= 0 ? ((index + 1) / (statusOrder.length - 1)) * 100 : 0;
}

export function RelocationProgressCard({ moveId, showDetails = true, className }: RelocationProgressCardProps) {
  const { data: move, isLoading } = trpc.moves.getById.useQuery(
    { id: moveId! },
    { enabled: !!moveId }
  );

  if (!moveId) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Relocation Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            No move selected. Start a conversation to track your relocation progress.
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Relocation Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  if (!move) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Relocation Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Move not found</div>
        </CardContent>
      </Card>
    );
  }

  const currentStatus = move.status as MoveStatus;
  const progress = calculateProgress(currentStatus);
  const currentIndex = statusOrder.indexOf(currentStatus);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Relocation Progress</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Status</span>
            <Badge variant={getStatusVariant(currentStatus)} className="capitalize">
              {currentStatus.replace(/_/g, " ")}
            </Badge>
          </div>
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-primary/20">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-xs text-muted-foreground text-right">
            {Math.round(progress)}% complete
          </div>
        </div>

        {showDetails && (
          <div className="space-y-2 pt-2 border-t">
            <div className="text-sm font-medium mb-2">Milestones</div>
            <div className="space-y-2">
              {milestones.map((milestone, index) => {
                const milestoneIndex = statusOrder.indexOf(milestone.key as MoveStatus);
                const isCompleted = milestoneIndex >= 0 && milestoneIndex <= currentIndex && currentStatus !== "cancelled";
                const isCurrent = milestoneIndex === currentIndex && currentStatus !== "cancelled";

                return (
                  <div key={milestone.key} className="flex items-center gap-2 text-sm">
                    {isCompleted ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                    ) : isCurrent ? (
                      <Clock className="h-4 w-4 text-blue-600 flex-shrink-0" />
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    )}
                    <span className={cn(
                      isCompleted && "text-foreground",
                      isCurrent && "text-blue-600 font-medium",
                      !isCompleted && !isCurrent && "text-muted-foreground"
                    )}>
                      {milestone.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {showDetails && (
          <div className="pt-2 border-t">
            <Link href={`/moves/${move.id}`} className="text-sm text-primary hover:underline">
              View full details →
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

