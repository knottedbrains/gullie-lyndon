"use client";

import { trpc } from "@/utils/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Home, MapPin, DollarSign, Clock } from "lucide-react";
import { useState } from "react";

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
            <Card key={option.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{option.address}</CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" />
                      {option.city}, {option.state || "N/A"}
                    </CardDescription>
                  </div>
                  <Badge variant={option.isTemporary ? "default" : "secondary"}>
                    {option.isTemporary ? "Temporary" : "Permanent"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Home className="h-4 w-4 text-muted-foreground" />
                  <span className="capitalize">{option.type.replace("_", " ")}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">${option.price}</span>
                  {option.pricePerMonth && (
                    <span className="text-muted-foreground">/month</span>
                  )}
                  {option.pricePerNight && (
                    <span className="text-muted-foreground">/night</span>
                  )}
                </div>
                {option.commuteToOffice && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{option.commuteToOffice} min commute</span>
                    {option.commuteMode && (
                      <span className="text-muted-foreground">({option.commuteMode})</span>
                    )}
                  </div>
                )}
                {option.matchCategory && (
                  <Badge variant="outline" className="mt-2">
                    {option.matchCategory} match
                  </Badge>
                )}
                <div className="flex gap-2 pt-2">
                  <Button size="sm" className="flex-1">View Details</Button>
                  {!option.selected && (
                    <Button size="sm" variant="outline">Select</Button>
                  )}
                </div>
              </CardContent>
            </Card>
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

