import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, DollarSign, Home, Clock } from "lucide-react";

interface HousingOption {
  id: string;
  type: string;
  address: string;
  city: string;
  price: string;
  commuteToOffice?: number;
  matchCategory?: string;
  isTemporary: boolean;
}

export interface HousingListProps {
  options: HousingOption[];
}

export function HousingListWidget({ options }: HousingListProps) {
  if (!options || options.length === 0) {
    return (
      <Card className="w-full max-w-md border-dashed">
        <CardContent className="p-6 text-center text-muted-foreground text-sm">
          No housing options found.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md overflow-hidden border-2 shadow-md">
      <div className="h-2 bg-purple-500 w-full" />
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Housing Options</CardTitle>
          <Badge variant="outline">{options.length} found</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
        {options.map((option) => (
          <div 
            key={option.id} 
            className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors text-sm space-y-2"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium flex items-center gap-1.5">
                  <Home className="h-3.5 w-3.5 text-muted-foreground" />
                  {option.type.replace("_", " ")}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <MapPin className="h-3 w-3" />
                  {option.address}, {option.city}
                </p>
              </div>
              <Badge 
                className={
                  option.matchCategory === "optimal" ? "bg-green-100 text-green-700 hover:bg-green-100" :
                  option.matchCategory === "strong" ? "bg-blue-100 text-blue-700 hover:bg-blue-100" :
                  "bg-gray-100 text-gray-700 hover:bg-gray-100"
                }
                variant="secondary"
              >
                {option.matchCategory || "Match"}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between pt-2 border-t border-border/50">
              <div className="font-medium flex items-center gap-1">
                <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                {option.price}
              </div>
              {option.commuteToOffice && (
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {option.commuteToOffice} min commute
                </div>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

