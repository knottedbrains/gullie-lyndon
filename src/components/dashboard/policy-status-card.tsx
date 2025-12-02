"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, AlertCircle, CheckCircle2 } from "lucide-react";
import { trpc } from "@/utils/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { PolicyStatus } from "@/types/dashboard";

interface PolicyStatusCardProps {
  moveId?: string;
  employeeId?: string;
  onUpdate?: () => void;
  className?: string;
}

export function PolicyStatusCard({ moveId, employeeId, onUpdate, className }: PolicyStatusCardProps) {
  const { data: move } = trpc.moves.getById.useQuery(
    { id: moveId! },
    { enabled: !!moveId }
  );

  const { data: policy } = trpc.employers.policies.getByMoveId.useQuery(
    { moveId: moveId! },
    { enabled: !!moveId && !!move?.policyId }
  );

  if (!moveId) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Policy Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>No move is assigned to you. Please contact your relocation coordinator.</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Check if we have a move but no policy yet
  const hasMove = !!move;
  const hasPolicy = policy?.hasFormalPolicy ?? false;
  const requiresApproval = policy?.requiresApprovalForAll ?? false;
  const isLoadingPolicy = !!moveId && !!move?.policyId && !policy;

  if (isLoadingPolicy) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Policy Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Loading policy information...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Policy Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasPolicy && policy ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium">Formal Policy Active</span>
            </div>
            
            {policy.maxHousingBudget && (
              <div className="text-sm">
                <span className="text-muted-foreground">Housing Budget: </span>
                <span className="font-medium">${parseFloat(policy.maxHousingBudget.toString()).toLocaleString()}</span>
              </div>
            )}
            
            {policy.maxTemporaryHousingBudget && (
              <div className="text-sm">
                <span className="text-muted-foreground">Temporary Housing: </span>
                <span className="font-medium">${parseFloat(policy.maxTemporaryHousingBudget.toString()).toLocaleString()}</span>
              </div>
            )}
            
            {policy.overallRelocationBudget && (
              <div className="text-sm">
                <span className="text-muted-foreground">Total Budget: </span>
                <span className="font-medium">${parseFloat(policy.overallRelocationBudget.toString()).toLocaleString()}</span>
              </div>
            )}
            
            {policy.coveredServices && policy.coveredServices.length > 0 && (
              <div className="text-sm">
                <span className="text-muted-foreground">Covered Services: </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {policy.coveredServices.map((service, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {service}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {requiresApproval && (
              <div className="flex items-center gap-2 text-sm text-amber-600">
                <AlertCircle className="h-4 w-4" />
                <span>All services require approval</span>
              </div>
            )}
          </div>
        ) : hasMove ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-amber-600">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm font-medium">No Policy</span>
            </div>
            <p className="text-sm text-muted-foreground">
              No relocation policy has been assigned to your move yet. Please contact your relocation coordinator.
            </p>
            {onUpdate && (
              <Button variant="outline" size="sm" onClick={onUpdate}>
                Check Policy
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-amber-600">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm font-medium">No Policy Available</span>
            </div>
            <p className="text-sm text-muted-foreground">
              No move is assigned to you. Please contact your relocation coordinator.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

