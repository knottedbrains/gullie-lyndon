"use client";

import { trpc } from "@/utils/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState } from "react";
import { HousingOptionCard, HousingOption } from "@/components/housing/housing-option-card";

export default function HousingPage() {
  const [searchMoveId, setSearchMoveId] = useState("");
  const { data: housingOptions, isLoading } = trpc.housing.list.useQuery(
    {
      moveId: searchMoveId || undefined,
    },
    {
      enabled: !!searchMoveId,
    }
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Housing</h1>
        <p className="text-muted-foreground">
          Search and manage housing options
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search Housing Options</CardTitle>
          <CardDescription>
            Enter a move ID to view available housing options
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Enter move ID..."
                value={searchMoveId}
                onChange={(e) => setSearchMoveId(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="text-center py-8 text-muted-foreground">Loading housing options...</div>
      )}

      {housingOptions && housingOptions.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {housingOptions.map((option) => (
            <HousingOptionCard key={option.id} option={option} />
          ))}
        </div>
      )}

      {housingOptions && housingOptions.length === 0 && searchMoveId && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No housing options found for this move.
          </CardContent>
        </Card>
      )}

      {!searchMoveId && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Enter a move ID to search for housing options.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
