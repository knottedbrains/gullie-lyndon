import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Briefcase, Loader2 } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

// Helper type matching the structure from the page component
interface Move {
  id: string;
  originCity: string;
  destinationCity: string;
  createdAt: string | Date;
  status: string;
}

interface RecentMovesCardProps {
  moves: Move[] | undefined;
  isLoading: boolean;
}

function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  const normalized = status.toLowerCase();
  if (normalized === "completed") return "default";
  if (normalized === "cancelled") return "destructive";
  if (normalized === "initiated" || normalized === "in_progress" || normalized === "in_transit") return "secondary";
  return "outline";
}

function formatStatus(status: string): string {
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function RecentMovesCard({ moves, isLoading }: RecentMovesCardProps) {
  return (
    <Card className="md:col-span-4 border shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between px-6 py-5 border-b">
        <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
        <Button variant="ghost" size="sm" className="h-8 gap-1 text-muted-foreground hover:text-foreground" asChild>
          <Link href="/moves">
            View All <ArrowRight className="h-3 w-3" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : moves && moves.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Move</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {moves.map((move) => (
                <TableRow 
                  key={move.id}
                  className="cursor-pointer"
                  onClick={() => window.location.href = `/moves/${move.id}`}
                >
                  <TableCell className="font-medium">
                    {move.originCity} <span className="text-muted-foreground mx-1">→</span> {move.destinationCity}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(move.createdAt).toLocaleDateString(undefined, { 
                      month: 'short', 
                      day: 'numeric',
                      year: new Date(move.createdAt).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge 
                      variant={getStatusVariant(move.status)}
                      className={cn(
                        "font-normal capitalize",
                        move.status.toLowerCase() === "cancelled" && "bg-destructive/10 text-destructive hover:bg-destructive/20",
                        move.status.toLowerCase() === "completed" && "bg-green-500/10 text-green-700 dark:text-green-400",
                        (move.status.toLowerCase() === "initiated" || move.status.toLowerCase() === "in_progress") && "bg-blue-500/10 text-blue-700 dark:text-blue-400"
                      )}
                    >
                      {formatStatus(move.status)}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground gap-2 text-sm">
            <Briefcase className="h-8 w-8 opacity-20" />
            <p>No moves yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

