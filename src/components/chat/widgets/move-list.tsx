
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase } from "lucide-react";
import Link from "next/link";

interface Move {
  id: string;
  originCity: string;
  destinationCity: string;
  createdAt?: string | Date;
  status: string;
}

interface MoveListWidgetProps {
  items?: Move[];
}

export function MoveListWidget({ items }: MoveListWidgetProps) {
  const moves = items || [];

  if (moves.length === 0) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="p-6 flex flex-col items-center justify-center text-muted-foreground gap-2">
          <Briefcase className="h-8 w-8 opacity-20" />
          <p>No moves found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md overflow-hidden border-2 shadow-md">
      <CardHeader className="pb-2 border-b bg-muted/30">
        <CardTitle className="text-base">Moves Found ({moves.length})</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y max-h-[300px] overflow-y-auto">
          {moves.map((move) => (
            <Link
              key={move.id}
              href={`/moves/${move.id}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-xs shrink-0">
                  {move.originCity?.[0] || "?"}{move.destinationCity?.[0] || "?"}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                    {move.originCity} → {move.destinationCity}
                  </p>
                  {move.createdAt && (
                    <p className="text-xs text-muted-foreground">
                      {new Date(move.createdAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
              <Badge 
                variant="secondary" 
                className="font-normal bg-muted text-muted-foreground border-0 shrink-0 text-[10px]"
              >
                {move.status.replace(/_/g, ' ')}
              </Badge>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

