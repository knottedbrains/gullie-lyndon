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
import { Plus, Search, Loader2 } from "lucide-react";
import Link from "next/link";

export default function MovesPage() {
  const { data: user } = trpc.users.getCurrentUser.useQuery();
  const isAdmin = user?.role === "admin";
  
  const { data: moves, isLoading } = trpc.moves.list.useQuery(
    {
      limit: 50,
    },
    {
      refetchInterval: 5000, // Refetch every 5 seconds to catch moves created via email/webhook
      refetchOnWindowFocus: true,
    }
  );

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
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Origin → Destination</TableHead>
                {isAdmin && <TableHead>Company</TableHead>}
                <TableHead>Office Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Move Date</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 6 : 5} className="h-24 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : moves && moves.length > 0 ? (
                moves.map((move) => (
                  <TableRow 
                    key={move.id} 
                    className="cursor-pointer"
                    onClick={() => window.location.href = `/moves/${move.id}`}
                  >
                    <TableCell className="font-medium">
                      {move.originCity} → {move.destinationCity}
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="text-muted-foreground">
                        {(move as { employer?: { name: string } | null }).employer?.name ?? "-"}
                      </TableCell>
                    )}
                    <TableCell>{move.officeLocation}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {move.status.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {move.moveDate 
                        ? new Date(move.moveDate).toLocaleDateString()
                        : "-"
                      }
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(move.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 6 : 5} className="h-24 text-center text-muted-foreground">
                    No moves found. Create your first move to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

