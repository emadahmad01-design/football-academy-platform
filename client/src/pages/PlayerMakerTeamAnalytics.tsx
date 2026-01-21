import { useQuery } from "@tanstack/react-query";
import { trpc } from "../lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { ArrowLeft, TrendingUp, Users, Activity, Zap } from "lucide-react";
import { useLocation } from "wouter";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function PlayerMakerTeamAnalytics() {
  const [, setLocation] = useLocation();

  // Fetch team-wide statistics using tRPC
  const { data: teamStats, isLoading, error } = trpc.playermaker.getTeamStats.useQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading team analytics...</p>
        </div>
      </div>
    );
  }

  if (!teamStats) {
    return (
      <div className="container mx-auto p-6">
        <Button
          variant="ghost"
          onClick={() => setLocation("/playermaker")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to PlayerMaker
        </Button>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-600">
              No team data available. Please sync PlayerMaker data first.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Prepare chart data for team performance trends
  const performanceTrendData = {
    labels: teamStats.weeklyTrends.map((w: any) => w.week),
    datasets: [
      {
        label: "Avg Touches",
        data: teamStats.weeklyTrends.map((w: any) => w.avgTouches),
        borderColor: "rgb(34, 197, 94)",
        backgroundColor: "rgba(34, 197, 94, 0.1)",
        fill: true,
      },
      {
        label: "Avg Distance (m)",
        data: teamStats.weeklyTrends.map((w: any) => w.avgDistance / 10), // Scale down for visibility
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        fill: true,
      },
    ],
  };

  // Top performers bar chart
  const topPerformersData = {
    labels: teamStats.topPerformers.map((p: any) => p.playerName),
    datasets: [
      {
        label: "Total Touches",
        data: teamStats.topPerformers.map((p: any) => p.totalTouches),
        backgroundColor: "rgba(34, 197, 94, 0.8)",
      },
    ],
  };

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => setLocation("/playermaker")}
            size="sm"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Team Performance Analytics
            </h1>
            <p className="text-gray-600 mt-1">
              Aggregate PlayerMaker data across all players
            </p>
          </div>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Players
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamStats.totalPlayers}</div>
            <p className="text-xs text-muted-foreground">
              With PlayerMaker data
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Sessions
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamStats.totalSessions}</div>
            <p className="text-xs text-muted-foreground">
              Training & matches
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg Touches
            </CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(teamStats.avgTouches)}
            </div>
            <p className="text-xs text-muted-foreground">
              Per session per player
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg Distance
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(teamStats.avgDistance)}m
            </div>
            <p className="text-xs text-muted-foreground">
              Per session per player
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Performance Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Team Performance Trends</CardTitle>
            <p className="text-sm text-gray-600">
              Weekly average touches and distance
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <Line
                data={performanceTrendData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: "top",
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                    },
                  },
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Performers</CardTitle>
            <p className="text-sm text-gray-600">
              By total touches across all sessions
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <Bar
                data={topPerformersData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                    },
                  },
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Top Performers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performers Details</CardTitle>
          <p className="text-sm text-gray-600">
            Comprehensive performance metrics
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-semibold">#</th>
                  <th className="text-left p-3 font-semibold">Player</th>
                  <th className="text-right p-3 font-semibold">Sessions</th>
                  <th className="text-right p-3 font-semibold">
                    Total Touches
                  </th>
                  <th className="text-right p-3 font-semibold">
                    Avg Touches
                  </th>
                  <th className="text-right p-3 font-semibold">
                    Total Distance (m)
                  </th>
                  <th className="text-right p-3 font-semibold">
                    Avg Distance (m)
                  </th>
                </tr>
              </thead>
              <tbody>
                {teamStats.topPerformers.map((player: any, index: number) => (
                  <tr key={player.playerId} className="border-b hover:bg-gray-50">
                    <td className="p-3">{index + 1}</td>
                    <td className="p-3 font-medium">{player.playerName}</td>
                    <td className="p-3 text-right">{player.sessionCount}</td>
                    <td className="p-3 text-right font-semibold text-green-600">
                      {player.totalTouches}
                    </td>
                    <td className="p-3 text-right">
                      {Math.round(player.avgTouches)}
                    </td>
                    <td className="p-3 text-right font-semibold text-blue-600">
                      {Math.round(player.totalDistance)}
                    </td>
                    <td className="p-3 text-right">
                      {Math.round(player.avgDistance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
