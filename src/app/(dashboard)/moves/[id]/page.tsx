"use client";

import { useParams } from "next/navigation";
import { trpc } from "@/utils/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function MoveDetailPage() {
  const params = useParams();
  
  // Safely extract id from params
  let id: string | undefined;
  if (params?.id) {
    if (Array.isArray(params.id)) {
      id = params.id[0];
    } else if (typeof params.id === "string") {
      id = params.id;
    }
  }
  
  const { data: move, isLoading } = trpc.moves.getById.useQuery(
    { id: id! },
    { enabled: !!id && typeof id === "string" }
  );

  if (!id || typeof id !== "string") {
    return <div className="p-6">Invalid move ID</div>;
  }

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!move) {
    return <div className="p-6">Move not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/moves">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {move.originCity} → {move.destinationCity}
          </h1>
          <p className="text-muted-foreground">Move Details</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Move Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <Badge className="mt-1">{move.status}</Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Origin</p>
              <p className="mt-1">{move.originCity}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Destination</p>
              <p className="mt-1">{move.destinationCity}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Office Location</p>
              <p className="mt-1">{move.officeLocation}</p>
            </div>
            {move.moveDate && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Move Date</p>
                <p className="mt-1">{new Date(move.moveDate).toLocaleDateString()}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lifestyle Intake</CardTitle>
            <CardDescription>
              {move.lifestyleIntakeCompleted ? "Completed" : "Pending"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {move.householdComposition && (
              <div className="space-y-2">
                <p className="text-sm">
                  {move.householdComposition.relocatingAlone
                    ? "Relocating alone"
                    : "Relocating with family"}
                </p>
              </div>
            )}
            {!move.lifestyleIntakeCompleted && (
              <Button className="mt-4">Start Intake</Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

