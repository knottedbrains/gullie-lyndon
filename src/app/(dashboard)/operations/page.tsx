"use client";

import { trpc } from "@/utils/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Search, AlertTriangle, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { useState } from "react";

export default function OperationsPage() {
  const [searchMoveId, setSearchMoveId] = useState("");
  const { data: exceptions, isLoading: exceptionsLoading } = trpc.operations.policyExceptions.list.useQuery(
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
        <h1 className="text-3xl font-bold tracking-tight">Operations</h1>
        <p className="text-muted-foreground">
          Manage policy exceptions, check-ins, and service breaks
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search Operations</CardTitle>
          <CardDescription>
            Enter a move ID to view operations data
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

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Policy Exceptions
            </CardTitle>
            <CardDescription>
              Requests requiring employer approval
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {exceptionsLoading ? (
              <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Loading...
              </div>
            ) : exceptions && exceptions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exceptions.map((exception) => (
                    <TableRow key={exception.id}>
                      <TableCell className="font-medium">
                        {exception.requestedService}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {exception.serviceType}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant={
                            exception.status === "approved"
                              ? "default"
                              : exception.status === "denied"
                              ? "destructive"
                              : "outline"
                          }
                          className="capitalize"
                        >
                          {exception.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-8 text-center text-sm text-muted-foreground">
                {searchMoveId ? "No exceptions found" : "Enter a move ID to search"}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Check-ins
            </CardTitle>
            <CardDescription>
              Scheduled move check-ins
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              Check-in functionality coming soon
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

