import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { 
  Users, 
  Activity, 
  Calendar, 
  AlertTriangle,
  TrendingUp,
  Trophy,
  Target,
  Brain,
  Dumbbell,
  Apple,
  BookOpen,
  Video,
  BarChart3,
  GraduationCap
} from "lucide-react";
import { AdvancedFeaturesWidgets } from "@/components/AdvancedFeaturesWidgets";
import { OnboardingTour } from "@/components/OnboardingTour";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useLocation } from "wouter";

function StatCard({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  trend,
  color = "primary" 
}: { 
  title: string; 
  value: string | number; 
  description?: string;
  icon: React.ElementType;
  trend?: { value: number; positive: boolean };
  color?: "primary" | "secondary" | "accent" | "destructive";
}) {
  const colorClasses = {
    primary: "text-primary bg-primary/10",
    secondary: "text-chart-2 bg-chart-2/10",
    accent: "text-accent bg-accent/10",
    destructive: "text-destructive bg-destructive/10",
  };

  return (
    <Card className="card-hover">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {trend && (
          <div className={`flex items-center gap-1 mt-2 text-xs ${trend.positive ? 'text-primary' : 'text-destructive'}`}>
            <TrendingUp className={`h-3 w-3 ${!trend.positive && 'rotate-180'}`} />
            <span>{trend.positive ? '+' : ''}{trend.value}% from last month</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function QuickActionCard({ 
  title, 
  description, 
  icon: Icon, 
  onClick,
  color = "primary"
}: { 
  title: string; 
  description: string;
  icon: React.ElementType;
  onClick?: () => void;
  color?: string;
}) {
  return (
    <Card 
      className="card-hover cursor-pointer" 
      onClick={onClick}
    >
      <CardContent className="p-4 flex items-center gap-4">
        <div className={`p-3 rounded-xl bg-${color}/10`}>
          <Icon className={`h-6 w-6 text-${color}`} />
        </div>
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function StaffDashboard() {
  const [, setLocation] = useLocation();
  const { data: stats, isLoading } = trpc.analytics.getAcademyStats.useQuery();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <OnboardingTour />
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Players"
          value={stats?.totalPlayers || 0}
          description="Active academy members"
          icon={Users}
          color="primary"
          trend={{ value: 12, positive: true }}
        />
        <StatCard
          title="Teams"
          value={stats?.totalTeams || 0}
          description="Age group teams"
          icon={Activity}
          color="secondary"
        />
        <StatCard
          title="Active Injuries"
          value={stats?.activeInjuries || 0}
          description="Players currently injured"
          icon={AlertTriangle}
          color="destructive"
        />
        <StatCard
          title="Upcoming Sessions"
          value={stats?.upcomingSessions || 0}
          description="Scheduled training sessions"
          icon={Calendar}
          color="accent"
        />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <QuickActionCard
            title="Record Performance"
            description="Log player metrics from training or match"
            icon={Activity}
            color="primary"
            onClick={() => setLocation("/performance")}
          />
          <QuickActionCard
            title="Mental Assessment"
            description="Conduct psychological evaluation"
            icon={Brain}
            color="chart-2"
            onClick={() => setLocation("/mental")}
          />
          <QuickActionCard
            title="Create Workout"
            description="Design a new training plan"
            icon={Dumbbell}
            color="chart-3"
            onClick={() => setLocation("/coach/training-planner")}
          />
          <QuickActionCard
            title="Meal Planning"
            description="Create nutrition plan for players"
            icon={Apple}
            color="chart-4"
            onClick={() => setLocation("/nutrition")}
          />
          <QuickActionCard
            title="Set Goals"
            description="Define development objectives"
            icon={Target}
            color="accent"
            onClick={() => setLocation("/idp")}
          />
          <QuickActionCard
            title="Award Achievement"
            description="Recognize player accomplishments"
            icon={Trophy}
            color="primary"
            onClick={() => setLocation("/rewards")}
          />
          <Link href="/coach-education/laws">
            <QuickActionCard
              title="Football Laws"
              description="Study the 17 laws of the game"
              icon={BookOpen}
              color="purple"
            />
          </Link>
          <Link href="/coach-education/courses">
            <QuickActionCard
              title="Coach Certification"
              description="FIFA coaching license pathway"
              icon={GraduationCap}
              color="blue"
            />
          </Link>
          <Link href="/coach-education/videos">
            <QuickActionCard
              title="Training Videos"
              description="FIFA Training Centre library"
              icon={Video}
              color="pink"
            />
          </Link>
          <Link href="/data-analysis-pro">
            <QuickActionCard
              title="Advanced Analytics"
              description="InStat/Wyscout style analysis"
              icon={BarChart3}
              color="green"
            />
          </Link>
        </div>
      </div>

      {/* Advanced Features Widgets */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Professional Analytics</h2>
        <AdvancedFeaturesWidgets />
      </div>

      {/* Development Areas Overview */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Development Areas</CardTitle>
            <CardDescription>Holistic player development tracking</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { name: "Technical Skills", score: 78, color: "bg-primary" },
              { name: "Physical Fitness", score: 82, color: "bg-chart-2" },
              { name: "Mental Strength", score: 71, color: "bg-chart-3" },
              { name: "Tactical Awareness", score: 75, color: "bg-chart-4" },
              { name: "Nutrition Compliance", score: 68, color: "bg-accent" },
            ].map((area) => (
              <div key={area.name} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{area.name}</span>
                  <span className="font-medium">{area.score}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${area.color} rounded-full animate-progress`}
                    style={{ width: `${area.score}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates from the academy</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { action: "Performance recorded", player: "Marcus Johnson", time: "2 hours ago", type: "performance" },
                { action: "Mental assessment completed", player: "Sarah Williams", time: "4 hours ago", type: "mental" },
                { action: "Injury reported", player: "James Chen", time: "Yesterday", type: "injury" },
                { action: "Achievement unlocked", player: "Emma Davis", time: "Yesterday", type: "achievement" },
                { action: "Meal plan created", player: "U14 Team", time: "2 days ago", type: "nutrition" },
              ].map((activity, i) => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.type === 'performance' ? 'bg-primary' :
                    activity.type === 'mental' ? 'bg-chart-2' :
                    activity.type === 'injury' ? 'bg-destructive' :
                    activity.type === 'achievement' ? 'bg-accent' :
                    'bg-chart-4'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">{activity.player}</p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">{activity.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
    </>
  );
}

function ParentDashboard() {
  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-primary/10 to-chart-2/10 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-full bg-primary/20">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Welcome to Future Stars FC</h2>
              <p className="text-muted-foreground">Track your child's development journey</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Overall Progress"
          value="76%"
          description="Development score"
          icon={TrendingUp}
          color="primary"
        />
        <StatCard
          title="Sessions Attended"
          value="24"
          description="This month"
          icon={Calendar}
          color="secondary"
        />
        <StatCard
          title="Achievements"
          value="8"
          description="Total earned"
          icon={Trophy}
          color="accent"
        />
        <StatCard
          title="Goals Completed"
          value="5"
          description="This quarter"
          icon={Target}
          color="primary"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Latest Coach Feedback</CardTitle>
          <CardDescription>Recent comments from coaching staff</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-muted/50 border-l-4 border-primary">
              <p className="text-sm italic">"Excellent improvement in ball control this week. Keep up the great work!"</p>
              <p className="text-xs text-muted-foreground mt-2">— Coach Martinez, Technical Training</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 border-l-4 border-chart-2">
              <p className="text-sm italic">"Showing great mental resilience during challenging drills. Very proud of the progress."</p>
              <p className="text-xs text-muted-foreground mt-2">— Dr. Thompson, Mental Coach</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PlayerDashboard() {
  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Your Development Journey</h2>
              <p className="text-muted-foreground">Keep pushing towards your goals</p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-primary">76</div>
              <p className="text-sm text-muted-foreground">Overall Score</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Technical"
          value="78"
          icon={Activity}
          color="primary"
        />
        <StatCard
          title="Physical"
          value="82"
          icon={Dumbbell}
          color="secondary"
        />
        <StatCard
          title="Mental"
          value="71"
          icon={Brain}
          color="accent"
        />
        <StatCard
          title="Tactical"
          value="75"
          icon={Target}
          color="primary"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Today's Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { time: "09:00", activity: "Technical Training", location: "Field A" },
              { time: "11:00", activity: "Gym Session", location: "Fitness Center" },
              { time: "14:00", activity: "Tactical Analysis", location: "Video Room" },
              { time: "16:00", activity: "Team Practice", location: "Main Pitch" },
            ].map((session, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                <div className="text-sm font-mono text-primary">{session.time}</div>
                <div className="flex-1">
                  <p className="font-medium">{session.activity}</p>
                  <p className="text-xs text-muted-foreground">{session.location}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const role = user?.role || 'player';

  const renderDashboard = () => {
    if (['admin', 'coach', 'nutritionist', 'mental_coach', 'physical_trainer'].includes(role)) {
      return <StaffDashboard />;
    } else if (role === 'parent') {
      return <ParentDashboard />;
    } else {
      return <PlayerDashboard />;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back to Future Stars FC
          </p>
        </div>
        {renderDashboard()}
      </div>
    </DashboardLayout>
  );
}
