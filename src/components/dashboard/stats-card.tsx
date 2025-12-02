import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  trend: string;
  trendUp: boolean;
  color: string;
}

export function StatsCard({ title, value, icon: Icon, trend, trendUp, color }: StatsCardProps) {
  return (
    <Card className="border shadow-sm hover:shadow-md transition-all">
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {Icon && <Icon className={`h-4 w-4 ${color}`} />}
        </div>
        <div className="flex items-baseline gap-2 mt-2">
          <h2 className="text-3xl font-bold">{value}</h2>
          <span className={`text-xs font-medium ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
            {trend}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

