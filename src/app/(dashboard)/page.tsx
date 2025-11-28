"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/utils/trpc";
import { Users, Home, Briefcase, DollarSign, TrendingUp, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function DashboardPage() {
  const { data: moves, isLoading: movesLoading } = trpc.moves.list.useQuery({
    limit: 10,
  });

  const activeMoves = moves?.filter(
    (move) => move.status !== "completed" && move.status !== "cancelled"
  ).length || 0;

  const pendingServices = 0; // TODO: Calculate from services
  const upcomingCheckIns = 0; // TODO: Calculate from check-ins

  const stats = [
    {
      title: "Active Moves",
      value: activeMoves,
      description: "Moves in progress",
      icon: Users,
      trend: "+12%",
    },
    {
      title: "Housing Options",
      value: "24",
      description: "Available listings",
      icon: Home,
      trend: "+5",
    },
    {
      title: "Pending Services",
      value: pendingServices,
      description: "Awaiting approval",
      icon: Briefcase,
      trend: "-3",
    },
    {
      title: "Revenue",
      value: "$124,500",
      description: "This month",
      icon: DollarSign,
      trend: "+8%",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your relocation operations
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3" />
                {stat.trend} from last month
              </p>
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Moves</CardTitle>
            <CardDescription>Latest move activity</CardDescription>
          </CardHeader>
          <CardContent>
            {movesLoading ? (
              <div className="text-sm text-muted-foreground">Loading...</div>
            ) : moves && moves.length > 0 ? (
              <div className="space-y-4">
                {moves.slice(0, 5).map((move) => (
                  <div
                    key={move.id}
                    className="flex items-center justify-between border-b pb-3 last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium">{move.originCity} → {move.destinationCity}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(move.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="outline">{move.status}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No moves yet</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alerts & Notifications</CardTitle>
            <CardDescription>Items requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-3 p-3 rounded-lg border border-yellow-200 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800">
              <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              <div>
                <p className="text-sm font-medium">3 policy exceptions pending</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Require employer approval
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

