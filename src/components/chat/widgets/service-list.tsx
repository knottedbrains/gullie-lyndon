import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Truck, Plane, Home, Box, Info } from "lucide-react";

interface Service {
  id: string;
  type: string;
  status?: string;
  createdAt?: string | Date;
  metadata?: Record<string, unknown>;
}

export interface ServiceListProps {
  services: Service[];
}

export function ServiceListWidget({ services }: ServiceListProps) {
  const getServiceIcon = (type: string) => {
    switch (type) {
      case "hhg": return <Box className="h-3.5 w-3.5" />;
      case "flight": return <Plane className="h-3.5 w-3.5" />;
      case "car_shipment": return <Truck className="h-3.5 w-3.5" />;
      case "temporary_housing":
      case "permanent_housing": return <Home className="h-3.5 w-3.5" />;
      default: return <Info className="h-3.5 w-3.5" />;
    }
  };

  if (!services || services.length === 0) {
    return (
      <Card className="w-full max-w-md border-dashed">
        <CardContent className="p-6 text-center text-muted-foreground text-sm">
          No services found.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md overflow-hidden border-2 shadow-md">
      <div className="h-2 bg-blue-500 w-full" />
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Services</CardTitle>
          <Badge variant="outline">{services.length} found</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
        {services.map((service) => (
          <div 
            key={service.id} 
            className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors text-sm flex justify-between items-center"
          >
            <div>
              <p className="font-medium flex items-center gap-1.5 capitalize">
                <span className="text-muted-foreground">{getServiceIcon(service.type)}</span>
                {service.type.replace(/_/g, " ")}
              </p>
              {service.createdAt && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Created {new Date(service.createdAt).toLocaleDateString()}
                </p>
              )}
            </div>
            <Badge 
              className={
                service.status === "completed" || service.status === "approved" ? "bg-green-100 text-green-700 hover:bg-green-100" :
                service.status === "cancelled" ? "bg-red-100 text-red-700 hover:bg-red-100" :
                "bg-blue-50 text-blue-700 hover:bg-blue-50"
              }
              variant="secondary"
            >
              {service.status || "Pending"}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

