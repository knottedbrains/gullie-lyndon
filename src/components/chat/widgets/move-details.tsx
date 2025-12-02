import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, Building, User, DollarSign, Briefcase } from "lucide-react";

export interface MoveDetailsProps {
  move: {
    id: string;
    originCity: string;
    destinationCity: string;
    moveDate?: string | Date;
    status: string;
    programType?: string;
    benefitAmount?: string;
    officeLocation?: string;
  };
  employee?: {
    fullName: string;
    email: string;
  };
  employer?: {
    name: string;
  };
}

export function MoveDetailsWidget({ move, employee, employer }: MoveDetailsProps) {
  const formattedDate = move.moveDate 
    ? new Date(move.moveDate).toLocaleDateString(undefined, { dateStyle: "long" }) 
    : "Not scheduled";

  return (
    <Card className="w-full max-w-md overflow-hidden border-2 shadow-md">
      <div className="h-2 bg-primary w-full" />
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">Move Details</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {move.originCity || "Unknown"} → {move.destinationCity || "Unknown"}
            </p>
          </div>
          <Badge variant={move.status === "completed" ? "default" : "secondary"} className="capitalize">
            {move.status ? move.status.replace("_", " ") : "Unknown"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span className="text-xs">Move Date</span>
            </div>
            <p className="font-medium">{formattedDate}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Building className="h-3.5 w-3.5" />
              <span className="text-xs">Office</span>
            </div>
            <p className="font-medium">{move.officeLocation || "N/A"}</p>
          </div>
        </div>

        {(employee || employer) && (
          <div className="pt-3 border-t space-y-3">
            {employee && (
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">{employee.fullName}</p>
                  <p className="text-xs text-muted-foreground">{employee.email}</p>
                </div>
              </div>
            )}
            {employer && (
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">{employer.name}</p>
                  <p className="text-xs text-muted-foreground">Employer</p>
                </div>
              </div>
            )}
          </div>
        )}

        {(move.programType || move.benefitAmount) && (
          <div className="pt-3 border-t grid grid-cols-2 gap-4">
            {move.programType && (
              <div>
                <span className="text-xs text-muted-foreground">Program</span>
                <p className="font-medium">{move.programType}</p>
              </div>
            )}
            {move.benefitAmount && (
              <div>
                <span className="text-xs text-muted-foreground">Benefit</span>
                <p className="font-medium flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  {move.benefitAmount}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

