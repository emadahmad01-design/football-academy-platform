import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { Users, TrendingUp, Award, Target, Activity, Brain, Utensils, Dumbbell } from "lucide-react";

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

function StatCard({ title, value, description, icon: Icon, trend }: { 
  title: string; 
  value: string | number; 
  description: string;
  icon: any;
  trend?: { value: number; positive: boolean };
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
        {trend && (
          <div className={`text-xs mt-1 ${trend.positive ? 'text-green-500' : 'text-red-500'}`}>
            {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}% from last month
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Analytics() {
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<string>('all');
  const [selectedMetric, setSelectedMetric] = useState<string>('overall');
  
  const { data: academyStats } = trpc.analytics.getAcademyStats.useQuery();
  const { data: players } = trpc.players.getAll.useQuery();
  const { data: teams } = trpc.teams.getAll.useQuery();

  // Calculate stats from players data
  const playersByPosition = players?.reduce((acc: Record<string, number>, player) => {
    acc[player.position] = (acc[player.position] || 0) + 1;
    return acc;
  }, {}) || {};

  const positionData = Object.entries(playersByPosition).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value
  }));

  const playersByAgeGroup = players?.reduce((acc: Record<string, number>, player) => {
    const group = player.ageGroup || 'Unassigned';
    acc[group] = (acc[group] || 0) + 1;
    return acc;
  }, {}) || {};

  const ageGroupData = Object.entries(playersByAgeGroup).map(([name, count]) => ({
    name,
    players: count
  }));

  // Mock performance data for visualization
  const performanceTrendData = [
    { month: 'Jul', technical: 65, physical: 70, mental: 60, tactical: 55 },
    { month: 'Aug', technical: 68, physical: 72, mental: 63, tactical: 58 },
    { month: 'Sep', technical: 72, physical: 75, mental: 67, tactical: 62 },
    { month: 'Oct', technical: 75, physical: 78, mental: 70, tactical: 66 },
    { month: 'Nov', technical: 78, physical: 80, mental: 73, tactical: 70 },
    { month: 'Dec', technical: 80, physical: 82, mental: 76, tactical: 73 },
  ];

  const benchmarkData = [
    { subject: 'Ball Control', academy: 78, national: 72, elite: 85 },
    { subject: 'Passing', academy: 75, national: 70, elite: 82 },
    { subject: 'Shooting', academy: 70, national: 68, elite: 80 },
    { subject: 'Speed', academy: 82, national: 75, elite: 88 },
    { subject: 'Endurance', academy: 76, national: 72, elite: 84 },
    { subject: 'Tactical IQ', academy: 72, national: 68, elite: 78 },
  ];

  const developmentMetrics = [
    { category: 'Technical', progress: 78, target: 85 },
    { category: 'Physical', progress: 82, target: 85 },
    { category: 'Mental', progress: 70, target: 80 },
    { category: 'Tactical', progress: 68, target: 75 },
    { category: 'Nutrition', progress: 75, target: 80 },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Academy Analytics</h1>
            <p className="text-muted-foreground">
              Comprehensive insights into player development and academy performance
            </p>
          </div>
          <div className="flex gap-2">
            <Select value={selectedAgeGroup} onValueChange={setSelectedAgeGroup}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Age Group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Groups</SelectItem>
                <SelectItem value="U10">U10</SelectItem>
                <SelectItem value="U12">U12</SelectItem>
                <SelectItem value="U14">U14</SelectItem>
                <SelectItem value="U16">U16</SelectItem>
                <SelectItem value="U18">U18</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Key Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Players"
            value={academyStats?.totalPlayers || 0}
            description="Active academy players"
            icon={Users}
            trend={{ value: 12, positive: true }}
          />
          <StatCard
            title="Teams"
            value={academyStats?.totalTeams || 0}
            description="Across all age groups"
            icon={Target}
          />
          <StatCard
            title="Active Injuries"
            value={academyStats?.activeInjuries || 0}
            description="Players in recovery"
            icon={Activity}
            trend={{ value: 5, positive: false }}
          />
          <StatCard
            title="Upcoming Sessions"
            value={academyStats?.upcomingSessions || 0}
            description="Scheduled this week"
            icon={TrendingUp}
          />
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="benchmarks">Benchmarks</TabsTrigger>
            <TabsTrigger value="development">Development</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              {/* Players by Position */}
              <Card>
                <CardHeader>
                  <CardTitle>Players by Position</CardTitle>
                  <CardDescription>Distribution across playing positions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={positionData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {positionData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Players by Age Group */}
              <Card>
                <CardHeader>
                  <CardTitle>Players by Age Group</CardTitle>
                  <CardDescription>Distribution across academy levels</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={ageGroupData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <XAxis dataKey="name" stroke="#888" />
                        <YAxis stroke="#888" />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                        />
                        <Bar dataKey="players" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Development Areas Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Development Areas Overview</CardTitle>
                <CardDescription>Academy-wide progress across key development domains</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-5">
                  <div className="flex flex-col items-center p-4 rounded-lg bg-primary/10">
                    <Target className="h-8 w-8 text-primary mb-2" />
                    <span className="text-2xl font-bold">78%</span>
                    <span className="text-sm text-muted-foreground">Technical</span>
                  </div>
                  <div className="flex flex-col items-center p-4 rounded-lg bg-chart-2/10">
                    <Dumbbell className="h-8 w-8 text-chart-2 mb-2" />
                    <span className="text-2xl font-bold">82%</span>
                    <span className="text-sm text-muted-foreground">Physical</span>
                  </div>
                  <div className="flex flex-col items-center p-4 rounded-lg bg-chart-3/10">
                    <Brain className="h-8 w-8 text-chart-3 mb-2" />
                    <span className="text-2xl font-bold">70%</span>
                    <span className="text-sm text-muted-foreground">Mental</span>
                  </div>
                  <div className="flex flex-col items-center p-4 rounded-lg bg-chart-4/10">
                    <Activity className="h-8 w-8 text-chart-4 mb-2" />
                    <span className="text-2xl font-bold">68%</span>
                    <span className="text-sm text-muted-foreground">Tactical</span>
                  </div>
                  <div className="flex flex-col items-center p-4 rounded-lg bg-chart-5/10">
                    <Utensils className="h-8 w-8 text-chart-5 mb-2" />
                    <span className="text-2xl font-bold">75%</span>
                    <span className="text-sm text-muted-foreground">Nutrition</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Performance Trends</CardTitle>
                <CardDescription>Academy-wide performance metrics over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={performanceTrendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis dataKey="month" stroke="#888" />
                      <YAxis stroke="#888" domain={[0, 100]} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="technical" stroke="#10b981" strokeWidth={2} name="Technical" />
                      <Line type="monotone" dataKey="physical" stroke="#3b82f6" strokeWidth={2} name="Physical" />
                      <Line type="monotone" dataKey="mental" stroke="#f59e0b" strokeWidth={2} name="Mental" />
                      <Line type="monotone" dataKey="tactical" stroke="#8b5cf6" strokeWidth={2} name="Tactical" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="benchmarks" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Academy Benchmarking</CardTitle>
                <CardDescription>Compare Future Stars FC against national and elite academy standards</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={benchmarkData}>
                      <PolarGrid stroke="#333" />
                      <PolarAngleAxis dataKey="subject" stroke="#888" />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#888" />
                      <Radar name="Future Stars FC" dataKey="academy" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                      <Radar name="National Average" dataKey="national" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                      <Radar name="Elite Academies" dataKey="elite" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} />
                      <Legend />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="development" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Development Progress vs Targets</CardTitle>
                <CardDescription>Academy-wide progress toward development goals</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {developmentMetrics.map((metric) => (
                    <div key={metric.category}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{metric.category}</span>
                        <span className="text-sm text-muted-foreground">
                          {metric.progress}% / {metric.target}%
                        </span>
                      </div>
                      <div className="relative h-4 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="absolute h-full bg-primary/30 rounded-full"
                          style={{ width: `${metric.target}%` }}
                        />
                        <div 
                          className="absolute h-full bg-primary rounded-full transition-all duration-500"
                          style={{ width: `${metric.progress}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 lg:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Top Performers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold">
                          {i}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">Player {i}</p>
                          <p className="text-xs text-muted-foreground">U14 • Midfielder</p>
                        </div>
                        <Award className="h-4 w-4 text-yellow-500" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Most Improved</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-chart-2/20 flex items-center justify-center text-sm font-bold">
                          {i}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">Player {i + 3}</p>
                          <p className="text-xs text-muted-foreground">U12 • Forward</p>
                        </div>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Needs Attention</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-destructive/20 flex items-center justify-center text-sm font-bold">
                          !
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">Player {i + 6}</p>
                          <p className="text-xs text-muted-foreground">U16 • Defender</p>
                        </div>
                        <Activity className="h-4 w-4 text-orange-500" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
