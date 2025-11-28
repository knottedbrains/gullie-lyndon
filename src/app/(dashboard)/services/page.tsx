"use client";

import { trpc } from "@/utils/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Package, Car, Plane, Building2 } from "lucide-react";
import { useState } from "react";

export default function ServicesPage() {
  const [searchMoveId, setSearchMoveId] = useState("");
  const { data: services, isLoading } = trpc.services.list.useQuery(
    {
      moveId: searchMoveId || undefined,
    },
    {
      enabled: !!searchMoveId,
    }
  );

  const getServiceIcon = (type: string) => {
    switch (type) {
      case "hhg":
        return Package;
      case "car_shipment":
        return Car;
      case "flight":
        return Plane;
      case "temporary_housing":
      case "permanent_housing":
        return Building2;
      default:
        return Package;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Services</h1>
        <p className="text-muted-foreground">
          Manage all relocation services
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search Services</CardTitle>
          <CardDescription>
            Enter a move ID to view associated services
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
        <div className="text-center py-8 text-muted-foreground">Loading services...</div>
      )}

      {services && services.length > 0 && (
        <div className="grid gap-4">
          {services.map((service) => {
            const Icon = getServiceIcon(service.type);
            return (
              <Card key={service.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-lg bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold capitalize">
                          {service.type.replace("_", " ")}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {service.vendorName || "No vendor assigned"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{service.status}</Badge>
                      {service.cost && (
                        <span className="text-sm font-medium">${service.cost}</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {services && services.length === 0 && searchMoveId && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No services found for this move.
          </CardContent>
        </Card>
      )}

      {!searchMoveId && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Enter a move ID to search for services.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

