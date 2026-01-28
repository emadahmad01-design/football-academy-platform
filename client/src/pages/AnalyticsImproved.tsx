import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { useState, useMemo } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, 
  LineChart, Line, PieChart, Pie, Cell, Area, AreaChart, ComposedChart 
} from "recharts";
import { Users, TrendingUp, Award, Target, Activity, Brain, Utensils, Dumbbell, AlertCircle, CheckCircle2, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const COLORS = {
  primary: '#10b981',
  secondary: '#3b82f6',
  warning: '#f59e0b',
  danger: '#ef4444',
  purple: '#8b5cf6',
  pink: '#ec4899',
  teal: '#14b8a6',
  indigo: '#6366f1'
};

const GRADIENT_IDS = ['technical', 'physical', 'tactical', 'mental'];

function StatCard({ title, value, description, icon: Icon, trend, status }: { 
  title: string; 
  value: string | number; 
  description: string;
  icon: any;
  trend?: { value: number; positive: boolean };
  status?: 'good' | 'warning' | 'critical';
}) {
  const statusColors = {
    good: 'text-green-500 bg-green-50',
    warning: 'text-yellow-500 bg-yellow-50',
    critical: 'text-red-500 bg-red-50'
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={`p-2 rounded-lg ${status ? statusColors[status] : 'bg-muted'}`}>
          <Icon className="h-5 w-5" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold mb-1">{value}</div>
        <p className="text-xs text-muted-foreground mb-2">{description}</p>
        {trend && (
          <div className="flex items-center gap-1">
            {trend.positive ? (
              <ArrowUpRight className="h-4 w-4 text-green-500" />
            ) : (
              <ArrowDownRight className="h-4 w-4 text-red-500" />
            )}
            <span className={`text-sm font-medium ${trend.positive ? 'text-green-500' : 'text-red-500'}`}>
              {Math.abs(trend.value)}%
            </span>
            <span className="text-xs text-muted-foreground">vs last month</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border rounded-lg shadow-lg p-3">
        <p className="font-semibold mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-semibold">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

export default function AnalyticsImproved() {
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('6months');
  
  const { data: players } = trpc.players.getAll.useQuery();
  const { data: teams } = trpc.teams.getAll.useQuery();
  const { data: performanceData } = trpc.performance.getAll.useQuery();
  
  // Get player IDs for the selected team
  const teamPlayerIds = useMemo(() => {
    if (!players || selectedTeam === 'all') return null;
    return players
      .filter(p => p.teamId === parseInt(selectedTeam))
      .map(p => p.id);
  }, [players, selectedTeam]);
  
  // Filter stats by selected team
  const allStats = useMemo(() => {
    if (!performanceData) return [];
    if (selectedTeam === 'all' || !teamPlayerIds) return performanceData;
    return performanceData.filter(stat => teamPlayerIds.includes(stat.playerId));
  }, [performanceData, selectedTeam, teamPlayerIds]);

  // Calculate real performance trends from database
  const performanceTrendData = useMemo(() => {
    if (!allStats || allStats.length === 0) {
      return [];
    }

    // Determine how many months to show based on timeRange
    const monthsToShow = timeRange === '3months' ? 3 : 
                        timeRange === '6months' ? 6 : 12;

    // Group stats by month
    const statsByMonth = allStats.reduce((acc: Record<string, any[]>, stat) => {
      const date = new Date(stat.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!acc[monthKey]) acc[monthKey] = [];
      acc[monthKey].push(stat);
      return acc;
    }, {});

    // Calculate averages per month
    return Object.entries(statsByMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-monthsToShow) // Dynamic based on selected time range
      .map(([month, stats]) => {
        const avgTechnical = stats.reduce((sum, s) => sum + (s.technicalScore || 0), 0) / stats.length;
        const avgPhysical = stats.reduce((sum, s) => sum + (s.physicalScore || 0), 0) / stats.length;
        const avgTactical = stats.reduce((sum, s) => sum + (s.tacticalScore || 0), 0) / stats.length;
        const avgMental = stats.reduce((sum, s) => sum + (s.mentalScore || 0), 0) / stats.length;
        
        const [year, monthNum] = month.split('-');
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        return {
          month: monthNames[parseInt(monthNum) - 1],
          technical: Math.round(avgTechnical),
          physical: Math.round(avgPhysical),
          tactical: Math.round(avgTactical),
          mental: Math.round(avgMental),
          overall: Math.round((avgTechnical + avgPhysical + avgTactical + avgMental) / 4)
        };
      });
  }, [allStats, timeRange]);

  // Calculate player distribution
  const playersByPosition = useMemo(() => {
    if (!players) return [];
    
    // Filter players by selected team if not "all"
    const playersToAnalyze = selectedTeam === 'all' || !teamPlayerIds 
      ? players 
      : players.filter(p => teamPlayerIds.includes(p.id));
    
    if (playersToAnalyze.length === 0) return [];
    
    const positionCounts = playersToAnalyze.reduce((acc: Record<string, number>, player) => {
      const position = player.position || 'Unassigned';
      acc[position] = (acc[position] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(positionCounts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      percentage: ((value / playersToAnalyze.length) * 100).toFixed(1)
    }));
  }, [players, selectedTeam, teamPlayerIds]);

  // Calculate current averages
  const currentAverages = useMemo(() => {
    if (!allStats || allStats.length === 0) {
      return { technical: 0, physical: 0, tactical: 0, mental: 0, overall: 0 };
    }

    // Get recent stats (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentStats = allStats.filter(s => new Date(s.createdAt) >= thirtyDaysAgo);
    
    if (recentStats.length === 0) return { technical: 0, physical: 0, tactical: 0, mental: 0, overall: 0 };

    const technical = recentStats.reduce((sum, s) => sum + (s.technicalScore || 0), 0) / recentStats.length;
    const physical = recentStats.reduce((sum, s) => sum + (s.physicalScore || 0), 0) / recentStats.length;
    const tactical = recentStats.reduce((sum, s) => sum + (s.tacticalScore || 0), 0) / recentStats.length;
    const mental = recentStats.reduce((sum, s) => sum + (s.mentalScore || 0), 0) / recentStats.length;

    return {
      technical: Math.round(technical),
      physical: Math.round(physical),
      tactical: Math.round(tactical),
      mental: Math.round(mental),
      overall: Math.round((technical + physical + tactical + mental) / 4)
    };
  }, [allStats]);

  // Radar chart data for current performance
  const radarData = [
    { subject: 'Technical', value: currentAverages.technical, fullMark: 100 },
    { subject: 'Physical', value: currentAverages.physical, fullMark: 100 },
    { subject: 'Tactical', value: currentAverages.tactical, fullMark: 100 },
    { subject: 'Mental', value: currentAverages.mental, fullMark: 100 },
  ];

  // Calculate trends
  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return { value: 0, positive: true };
    const change = ((current - previous) / previous) * 100;
    return { value: Math.round(Math.abs(change)), positive: change >= 0 };
  };

  const previousMonth = performanceTrendData.length >= 2 ? performanceTrendData[performanceTrendData.length - 2] : null;
  const currentMonth = performanceTrendData.length >= 1 ? performanceTrendData[performanceTrendData.length - 1] : null;

  const trends = previousMonth && currentMonth ? {
    technical: calculateTrend(currentMonth.technical, previousMonth.technical),
    physical: calculateTrend(currentMonth.physical, previousMonth.physical),
    tactical: calculateTrend(currentMonth.tactical, previousMonth.tactical),
    mental: calculateTrend(currentMonth.mental, previousMonth.mental),
  } : null;

  // Determine status based on score
  const getStatus = (score: number): 'good' | 'warning' | 'critical' => {
    if (score >= 75) return 'good';
    if (score >= 60) return 'warning';
    return 'critical';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Performance Analytics</h1>
            <p className="text-muted-foreground mt-1">
              Comprehensive insights into player and team development
            </p>
          </div>
          <div className="flex gap-2">
            <Select value={selectedTeam} onValueChange={setSelectedTeam}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select team" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Teams</SelectItem>
                {teams?.map((team) => (
                  <SelectItem key={team.id} value={team.id.toString()}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3months">Last 3 Months</SelectItem>
                <SelectItem value="6months">Last 6 Months</SelectItem>
                <SelectItem value="1year">Last Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Technical Score"
            value={currentAverages.technical}
            description="Average technical ability"
            icon={Target}
            trend={trends?.technical}
            status={getStatus(currentAverages.technical)}
          />
          <StatCard
            title="Physical Score"
            value={currentAverages.physical}
            description="Average physical fitness"
            icon={Activity}
            trend={trends?.physical}
            status={getStatus(currentAverages.physical)}
          />
          <StatCard
            title="Tactical Score"
            value={currentAverages.tactical}
            description="Average tactical awareness"
            icon={Brain}
            trend={trends?.tactical}
            status={getStatus(currentAverages.tactical)}
          />
          <StatCard
            title="Mental Score"
            value={currentAverages.mental}
            description="Average mental strength"
            icon={Award}
            trend={trends?.mental}
            status={getStatus(currentAverages.mental)}
          />
        </div>

        {/* Main Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Performance Trends */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
              <CardDescription>
                Track development across all performance categories over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={performanceTrendData}>
                  <defs>
                    <linearGradient id="technicalGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="physicalGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.secondary} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={COLORS.secondary} stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="tacticalGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.warning} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={COLORS.warning} stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="mentalGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.purple} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={COLORS.purple} stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" domain={[0, 100]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="technical" 
                    stroke={COLORS.primary} 
                    fill="url(#technicalGradient)"
                    strokeWidth={2}
                    name="Technical"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="physical" 
                    stroke={COLORS.secondary} 
                    fill="url(#physicalGradient)"
                    strokeWidth={2}
                    name="Physical"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="tactical" 
                    stroke={COLORS.warning} 
                    fill="url(#tacticalGradient)"
                    strokeWidth={2}
                    name="Tactical"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="mental" 
                    stroke={COLORS.purple} 
                    fill="url(#mentalGradient)"
                    strokeWidth={2}
                    name="Mental"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Current Performance Radar */}
          <Card>
            <CardHeader>
              <CardTitle>Current Performance Profile</CardTitle>
              <CardDescription>
                Overall academy performance across key areas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="subject" stroke="#6b7280" />
                  <PolarRadiusAxis domain={[0, 100]} stroke="#6b7280" />
                  <Radar 
                    name="Academy" 
                    dataKey="value" 
                    stroke={COLORS.primary} 
                    fill={COLORS.primary} 
                    fillOpacity={0.6}
                    strokeWidth={2}
                  />
                  <Tooltip content={<CustomTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {radarData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                    <span className="text-sm font-medium">{item.subject}</span>
                    <Badge variant={item.value >= 75 ? "default" : item.value >= 60 ? "secondary" : "destructive"}>
                      {item.value}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Player Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Squad Distribution</CardTitle>
              <CardDescription>
                Players by position across the academy
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={playersByPosition}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name} (${percentage}%)`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {playersByPosition.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={Object.values(COLORS)[index % Object.values(COLORS).length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {playersByPosition.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: Object.values(COLORS)[index % Object.values(COLORS).length] }}
                      />
                      <span className="text-sm">{item.name}</span>
                    </div>
                    <span className="text-sm font-semibold">{item.value} players</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Insights & Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle>AI-Powered Insights</CardTitle>
            <CardDescription>
              Automated analysis and recommendations based on current data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {currentAverages.tactical < 70 && (
                <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-yellow-900">Tactical Development Needed</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      Tactical scores are below target ({currentAverages.tactical}/100). Consider increasing tactical training sessions and video analysis.
                    </p>
                  </div>
                </div>
              )}
              
              {currentAverages.physical >= 80 && (
                <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-green-900">Excellent Physical Conditioning</h4>
                    <p className="text-sm text-green-700 mt-1">
                      Physical scores are outstanding ({currentAverages.physical}/100). Maintain current training intensity.
                    </p>
                  </div>
                </div>
              )}

              {trends && trends.technical.positive && trends.technical.value > 10 && (
                <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-900">Strong Technical Improvement</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Technical skills have improved by {trends.technical.value}% this month. Current training methods are highly effective.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
