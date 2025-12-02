import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Home, DollarSign, Clock } from "lucide-react";

export interface HousingOption {
  id: string;
  address: string;
  city: string;
  state?: string | null;
  isTemporary: boolean;
  type: string;
  price: string | number;
  pricePerMonth?: string | number | null;
  pricePerNight?: string | number | null;
  commuteToOffice?: number | null;
  commuteMode?: string | null;
  matchCategory?: string | null;
  selected?: boolean;
}

interface HousingOptionCardProps {
  option: HousingOption;
}

export function HousingOptionCard({ option }: HousingOptionCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
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
  );
}

