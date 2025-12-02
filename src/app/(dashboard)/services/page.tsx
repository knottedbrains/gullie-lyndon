"use client";

import { trpc } from "@/utils/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Package, Car, Plane, Building2, Loader2 } from "lucide-react";
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
        <Card>
          <CardContent className="py-8">
            <div className="flex items-center justify-center text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              Loading services...
            </div>
          </CardContent>
        </Card>
      )}

      {services && services.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service Type</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((service) => {
                  const Icon = getServiceIcon(service.type);
                  return (
                    <TableRow key={service.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Icon className="h-4 w-4 text-primary" />
                          </div>
                          <span className="font-medium capitalize">
                            {service.type.replace(/_/g, " ")}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {service.vendorName || "No vendor assigned"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {service.status.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {service.cost ? `$${service.cost}` : "-"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
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

