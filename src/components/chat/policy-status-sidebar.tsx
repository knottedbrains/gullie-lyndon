"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Clock, AlertCircle, Home, Truck, CreditCard, Briefcase, ChevronRight, ChevronLeft } from "lucide-react";
import { trpc } from "@/utils/trpc";
import { cn } from "@/lib/utils";

type Status = "completed" | "in_progress" | "pending" | "attention";

interface PolicyStep {
  label: string;
  value: string;
  status: Status;
}

interface PolicySection {
  id: string;
  title: string;
  icon: React.ElementType;
  status: Status;
  steps: PolicyStep[];
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

function StatusBadge({ status }: { status: Status }) {
  switch (status) {
    case "completed":
      return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Complete</Badge>;
    case "in_progress":
      return <Badge variant="secondary" className="text-blue-600 bg-blue-100">In Progress</Badge>;
    case "attention":
      return <Badge variant="destructive" className="bg-amber-500 hover:bg-amber-600">Action Needed</Badge>;
    default:
      return <Badge variant="outline">Pending</Badge>;
  }
}

export function PolicyStatusSidebar({ moveId }: { moveId?: string }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Fetch the specific move if moveId is provided, otherwise no move
  const { data: move } = trpc.moves.getById.useQuery(
    { id: moveId! },
    { enabled: !!moveId }
  );

  // In a real app, we would fetch specific status details for each section
  // For now, we derive some basic status from the move object or use placeholders

  const currentMove = move;

  const getMoveStatus = (move: any): Status => {
    if (!move) return "pending";
    if (move.status === "completed") return "completed";
    if (move.status === "initiated") return "in_progress";
    return "pending";
  };

  const sections: PolicySection[] = [
    {
      id: "move",
      title: "Move Logistics",
      icon: Truck,
      status: getMoveStatus(currentMove),
      steps: [
        { label: "Move Initiated", value: currentMove?.createdAt ? new Date(currentMove.createdAt).toLocaleDateString() : "-", status: currentMove ? "completed" : "pending" },
        { label: "Needs Assessment", value: currentMove?.lifestyleIntakeCompleted ? "Completed" : "Pending", status: currentMove?.lifestyleIntakeCompleted ? "completed" : "attention" },
        { label: "Move Date", value: currentMove?.moveDate ? new Date(currentMove.moveDate).toLocaleDateString() : "Not set", status: currentMove?.moveDate ? "completed" : "pending" },
      ],
    },
    {
      id: "housing",
      title: "Housing",
      icon: Home,
      status: "in_progress", // Placeholder
      steps: [
        { label: "Preferences", value: "Urban, 2 Bedroom", status: "completed" },
        { label: "Options Sent", value: "5 Candidates", status: "completed" },
        { label: "Selection", value: "Pending Review", status: "attention" },
      ],
    },
    {
      id: "services",
      title: "Services",
      icon: Briefcase,
      status: "pending", // Placeholder
      steps: [
        { label: "Cleaning", value: "Not requested", status: "pending" },
        { label: "Packing", value: "Scheduled", status: "in_progress" },
      ],
    },
    {
      id: "financial",
      title: "Financial",
      icon: CreditCard,
      status: "in_progress", // Placeholder
      steps: [
        { label: "Budget", value: currentMove?.benefitAmount ? `$${currentMove.benefitAmount}` : "$0.00", status: "completed" },
        { label: "Expenses", value: "$0.00 Used", status: "in_progress" },
      ],
    },
  ];

  return (
    <div className={cn(
      "h-full border-l bg-muted/5 flex flex-col transition-all duration-300 ease-in-out relative",
      isCollapsed ? "w-12" : "w-80"
    )}>
      {/* Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={cn(
          "absolute top-4 -left-3 z-10 h-6 w-6 rounded-full border bg-background shadow-md hover:bg-accent",
          "transition-transform duration-300"
        )}
        title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {isCollapsed ? (
          <ChevronLeft className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </Button>

      {/* Collapsed State */}
      {isCollapsed && (
        <div className="flex-1 flex flex-col items-center pt-16 gap-4">
          {sections.map((section) => (
            <div
              key={section.id}
              className="flex flex-col items-center gap-1 cursor-pointer hover:bg-muted/50 p-2 rounded transition-colors"
              title={section.title}
            >
              <section.icon className="h-5 w-5 text-muted-foreground" />
              <StatusIcon status={section.status} />
            </div>
          ))}
        </div>
      )}

      {/* Expanded State */}
      {!isCollapsed && (
        <>
          <div className="p-4 border-b bg-background/50 backdrop-blur supports-[backdrop-filter]:bg-background/50">
            <h2 className="font-semibold">Policy Status</h2>
            <p className="text-xs text-muted-foreground">Track your relocation progress</p>
          </div>
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {sections.map((section) => (
                <Card key={section.id} className="overflow-hidden">
                  <CardHeader className="p-3 bg-muted/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <section.icon className="h-4 w-4 text-muted-foreground" />
                        <CardTitle className="text-sm font-medium">{section.title}</CardTitle>
                      </div>
                      <StatusIcon status={section.status} />
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 space-y-3">
                    {section.steps.map((step, idx) => (
                      <div key={idx} className="flex flex-col gap-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">{step.label}</span>
                          <span className={`font-medium ${
                            step.status === 'attention' ? 'text-amber-600' :
                            step.status === 'completed' ? 'text-green-600' : ''
                          }`}>
                            {step.value}
                          </span>
                        </div>
                        {idx < section.steps.length - 1 && <div className="h-px bg-border/50 mt-1" />}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </>
      )}
    </div>
  );
}

