import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { DashboardLayoutSkeleton } from "@/components/DashboardLayoutSkeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  Sparkles, 
  FileText, 
  Calendar, 
  Users, 
  TrendingUp, 
  Target,
  Brain,
  Activity,
  ArrowRight,
  Zap
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AIDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { t, isRTL } = useLanguage();

  if (authLoading) return <DashboardLayoutSkeleton />;
  if (!user) {
    setLocation("/");
    return null;
  }

  const aiTools = [
    {
      titleKey: "aiDashboard.playerAnalysis",
      descKey: "aiDashboard.playerAnalysisDesc",
      icon: Users,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20",
      path: "/players",
      actionKey: "aiDashboard.viewPlayers"
    },
    {
      titleKey: "aiDashboard.matchReportGen",
      descKey: "aiDashboard.matchReportGenDesc",
      icon: FileText,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      borderColor: "border-green-500/20",
      path: "/coach/match-report-generator",
      actionKey: "aiDashboard.generateReport"
    },
    {
      titleKey: "aiDashboard.trainingPlanner",
      descKey: "aiDashboard.trainingPlannerDesc",
      icon: Calendar,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-500/20",
      path: "/coach/training-planner",
      actionKey: "aiDashboard.planTraining"
    },
    {
      titleKey: "aiDashboard.aiCalendar",
      descKey: "aiDashboard.aiCalendarDesc",
      icon: Calendar,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
      borderColor: "border-orange-500/20",
      path: "/coach/ai-calendar",
      actionKey: "aiDashboard.viewCalendar"
    },
    {
      titleKey: "aiDashboard.playerComparison",
      descKey: "aiDashboard.playerComparisonDesc",
      icon: Users,
      color: "text-pink-500",
      bgColor: "bg-pink-500/10",
      borderColor: "border-pink-500/20",
      path: "/coach/player-comparison",
      actionKey: "aiDashboard.comparePlayers"
    },
    {
      titleKey: "aiDashboard.tacticalHub",
      descKey: "aiDashboard.tacticalHubDesc",
      icon: Target,
      color: "text-indigo-500",
      bgColor: "bg-indigo-500/10",
      borderColor: "border-indigo-500/20",
      path: "/tactical-hub",
      actionKey: "aiDashboard.openHub"
    },
    {
      titleKey: "aiDashboard.aiCoach",
      descKey: "aiDashboard.aiCoachDesc",
      icon: Brain,
      color: "text-cyan-500",
      bgColor: "bg-cyan-500/10",
      borderColor: "border-cyan-500/20",
      path: "/coach/ai-assistant",
      actionKey: "aiDashboard.askAICoach"
    },
    {
      titleKey: "aiDashboard.aiVideoAnalysis",
      descKey: "aiDashboard.aiVideoAnalysisDesc",
      icon: Activity,
      color: "text-teal-500",
      bgColor: "bg-teal-500/10",
      borderColor: "border-teal-500/20",
      path: "/coach/ai-video-analysis",
      actionKey: "aiDashboard.analyzeVideo"
    },
    {
      titleKey: "aiDashboard.performancePrediction",
      descKey: "aiDashboard.performancePredictionDesc",
      icon: TrendingUp,
      color: "text-violet-500",
      bgColor: "bg-violet-500/10",
      borderColor: "border-violet-500/20",
      path: "/coach/performance-prediction",
      actionKey: "aiDashboard.viewPredictions"
    },
    {
      titleKey: "aiDashboard.emergencyMode",
      descKey: "aiDashboard.emergencyModeDesc",
      icon: Zap,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/20",
      path: "/ai-emergency-enhanced",
      actionKey: "aiEmergency.title"
    }
  ];

  const insights = [
    {
      titleKey: "aiDashboard.teamTrend",
      value: t("aiDashboard.improving"),
      change: "+12%",
      icon: TrendingUp,
      color: "text-green-500"
    },
    {
      titleKey: "aiDashboard.analysesThisWeek",
      value: "23",
      change: "+5",
      icon: Activity,
      color: "text-blue-500"
    },
    {
      titleKey: "aiDashboard.trainingPlans",
      value: "8",
      change: "+3",
      icon: Calendar,
      color: "text-purple-500"
    },
    {
      titleKey: "aiDashboard.matchReports",
      value: "5",
      change: "+2",
      icon: FileText,
      color: "text-orange-500"
    }
  ];

  return (
    <DashboardLayout>
      <div className={`space-y-6 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-primary" />
            {t("aiDashboard.title")}
          </h1>
          <p className="text-muted-foreground mt-2">
            {t("aiDashboard.subtitle")}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {insights.map((insight, idx) => {
            const Icon = insight.icon;
            return (
              <Card key={idx}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{t(insight.titleKey)}</p>
                      <p className="text-2xl font-bold mt-1">{insight.value}</p>
                      <p className={`text-xs mt-1 ${insight.color}`}>{insight.change} {t("aiDashboard.thisWeek")}</p>
                    </div>
                    <Icon className={`h-8 w-8 ${insight.color}`} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* AI Tools Grid */}
        <div>
          <h2 className="text-xl font-semibold mb-4">{t("aiDashboard.aiTools")}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {aiTools.map((tool, idx) => {
              const Icon = tool.icon;
              return (
                <Card 
                  key={idx} 
                  className={`${tool.borderColor} hover:shadow-lg transition-all cursor-pointer group`}
                  onClick={() => setLocation(tool.path)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className={`p-3 rounded-lg ${tool.bgColor}`}>
                        <Icon className={`h-6 w-6 ${tool.color}`} />
                      </div>
                      <Badge variant="outline" className="text-xs">
                        AI
                      </Badge>
                    </div>
                    <CardTitle className="text-lg mt-4">{t(tool.titleKey)}</CardTitle>
                    <CardDescription className="text-sm">
                      {t(tool.descKey)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      variant="ghost" 
                      className="w-full group-hover:bg-primary/10 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLocation(tool.path);
                      }}
                    >
                      {t(tool.actionKey)}
                      <ArrowRight className={`h-4 w-4 ${isRTL ? 'mr-2 rotate-180' : 'ml-2'}`} />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>{t("aiDashboard.recommendations")}</CardTitle>
            <CardDescription>{t("aiDashboard.smartSuggestions")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 border rounded-lg">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Users className="h-5 w-5 text-blue-500" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{t("aiDashboard.analyzeTopPerformers")}</p>
                  <p className="text-sm text-muted-foreground">
                    {t("aiDashboard.topPerformersDesc")}
                  </p>
                  <Button 
                    variant="link" 
                    className="p-0 h-auto mt-1"
                    onClick={() => setLocation("/players")}
                  >
                    {t("aiDashboard.viewPlayers")} →
                  </Button>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 border rounded-lg">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Calendar className="h-5 w-5 text-purple-500" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{t("aiDashboard.scheduleTraining")}</p>
                  <p className="text-sm text-muted-foreground">
                    {t("aiDashboard.scheduleTrainingDesc")}
                  </p>
                  <Button 
                    variant="link" 
                    className="p-0 h-auto mt-1"
                    onClick={() => setLocation("/coach/training-planner")}
                  >
                    {t("aiDashboard.planTraining")} →
                  </Button>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 border rounded-lg">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <FileText className="h-5 w-5 text-green-500" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{t("aiDashboard.generateMatchReport")}</p>
                  <p className="text-sm text-muted-foreground">
                    {t("aiDashboard.generateMatchReportDesc")}
                  </p>
                  <Button 
                    variant="link" 
                    className="p-0 h-auto mt-1"
                    onClick={() => setLocation("/coach/match-report-generator")}
                  >
                    {t("aiDashboard.generateReport")} →
                  </Button>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 border rounded-lg">
                <div className="p-2 rounded-lg bg-pink-500/10">
                  <Users className="h-5 w-5 text-pink-500" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{t("aiDashboard.compareKeyPlayers")}</p>
                  <p className="text-sm text-muted-foreground">
                    {t("aiDashboard.compareKeyPlayersDesc")}
                  </p>
                  <Button 
                    variant="link" 
                    className="p-0 h-auto mt-1"
                    onClick={() => setLocation("/coach/player-comparison")}
                  >
                    {t("aiDashboard.compareNow")} →
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="text-lg font-semibold mb-1">{t("aiDashboard.needHelp")}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("aiDashboard.aiCoachDesc")}
                </p>
              </div>
              <Button 
                size="lg"
                onClick={() => setLocation("/coach/ai-assistant")}
                className="gap-2"
              >
                <Brain className="h-5 w-5" />
                {t("aiDashboard.askAI")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
