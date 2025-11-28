"use client";

import { trpc } from "@/utils/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import Link from "next/link";

export default function MovesPage() {
  const { data: moves, isLoading } = trpc.moves.list.useQuery({
    limit: 50,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Moves</h1>
          <p className="text-muted-foreground">
            Manage all relocation moves
          </p>
        </div>
        <Link href="/moves/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Move
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search moves..."
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading moves...</div>
          ) : moves && moves.length > 0 ? (
            <div className="space-y-4">
              {moves.map((move) => (
                <Link
                  key={move.id}
                  href={`/moves/${move.id}`}
                  className="block p-4 rounded-lg border hover:bg-accent transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">
                          {move.originCity} → {move.destinationCity}
                        </p>
                        <Badge variant="outline">{move.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Created {new Date(move.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{move.officeLocation}</p>
                      {move.moveDate && (
                        <p className="text-xs text-muted-foreground">
                          Move date: {new Date(move.moveDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No moves found. Create your first move to get started.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

