import { useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import DashboardLayout from '@/components/DashboardLayout';
import { DashboardLayoutSkeleton } from '@/components/DashboardLayoutSkeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { trpc } from '@/lib/trpc';
import { useLocation, useSearch } from 'wouter';
import { 
  Users,
  Trophy,
  Shield,
  Activity,
  Calendar,
  Target,
  TrendingUp,
  Heart,
  Dumbbell,
  Brain,
  BarChart3,
  ChevronRight,
  Loader2,
  AlertCircle,
} from 'lucide-react';

const teamTypeLabels: Record<string, { en: string; ar: string }> = {
  main: { en: 'Main Team', ar: 'الفريق الأول' },
  academy: { en: 'Academy Team', ar: 'فريق الأكاديمية' },
};

export default function TeamDashboard() {
  const { user, loading: authLoading } = useAuth();
  const { language } = useLanguage();
  const [, setLocation] = useLocation();
  
  // Get team type from URL query parameter
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const teamType = params.get('team') as 'main' | 'academy' | null;

  // Fetch team-specific data
  const { data: teams, isLoading: teamsLoading } = trpc.teams.getByType.useQuery(
    { teamType: teamType! },
    { enabled: !!teamType }
  );
  
  const { data: players, isLoading: playersLoading } = trpc.players.getByTeamType.useQuery(
    { teamType: teamType! },
    { enabled: !!teamType }
  );

  const { data: coaches, isLoading: coachesLoading } = trpc.teams.getAllCoachAssignments.useQuery();

  if (authLoading) return <DashboardLayoutSkeleton />;
  if (!user) {
    setLocation('/');
    return null;
  }

  const isLoading = teamsLoading || playersLoading || coachesLoading;

  // Filter coaches for this team type
  const teamCoaches = coaches?.filter(c => c.teamType === teamType) || [];

  // Calculate statistics
  const totalPlayers = players?.length || 0;
  const activePlayers = players?.filter(p => p.status === 'active').length || 0;
  const injuredPlayers = players?.filter(p => p.status === 'injured').length || 0;
  const trialPlayers = players?.filter(p => p.status === 'trial').length || 0;

  // Position distribution
  const positionStats = {
    goalkeeper: players?.filter(p => p.position === 'goalkeeper').length || 0,
    defender: players?.filter(p => p.position === 'defender').length || 0,
    midfielder: players?.filter(p => p.position === 'midfielder').length || 0,
    forward: players?.filter(p => p.position === 'forward').length || 0,
  };

  // Age group distribution
  const ageGroups = players?.reduce((acc, player) => {
    const group = player.ageGroup || 'Unknown';
    acc[group] = (acc[group] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  const pageTitle = teamType === 'main' 
    ? (language === 'ar' ? 'لوحة تحكم الفريق الأول' : 'Main Team Dashboard')
    : teamType === 'academy'
    ? (language === 'ar' ? 'لوحة تحكم الأكاديمية' : 'Academy Dashboard')
    : (language === 'ar' ? 'لوحة التحكم' : 'Dashboard');

  if (!teamType) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Card className="w-96">
            <CardContent className="pt-6 text-center">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {language === 'ar' 
                  ? 'يرجى اختيار فريق من القائمة الجانبية' 
                  : 'Please select a team from the sidebar'}
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-lg ${teamType === 'main' ? 'bg-yellow-100 dark:bg-yellow-900' : 'bg-blue-100 dark:bg-blue-900'}`}>
              {teamType === 'main' ? (
                <Trophy className={`h-8 w-8 ${teamType === 'main' ? 'text-yellow-600 dark:text-yellow-400' : 'text-blue-600 dark:text-blue-400'}`} />
              ) : (
                <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold">{pageTitle}</h1>
              <p className="text-muted-foreground">
                {language === 'ar' 
                  ? `نظرة عامة على ${teamTypeLabels[teamType][language]}`
                  : `Overview of ${teamTypeLabels[teamType][language]}`}
              </p>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {!isLoading && (
          <>
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {language === 'ar' ? 'إجمالي اللاعبين' : 'Total Players'}
                      </p>
                      <p className="text-2xl font-bold">{totalPlayers}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                      <Activity className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {language === 'ar' ? 'اللاعبين النشطين' : 'Active Players'}
                      </p>
                      <p className="text-2xl font-bold">{activePlayers}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-red-100 dark:bg-red-900 rounded-lg">
                      <Heart className="h-6 w-6 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {language === 'ar' ? 'المصابين' : 'Injured'}
                      </p>
                      <p className="text-2xl font-bold">{injuredPlayers}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                      <Target className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {language === 'ar' ? 'تحت التجربة' : 'On Trial'}
                      </p>
                      <p className="text-2xl font-bold">{trialPlayers}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Position Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    {language === 'ar' ? 'توزيع المراكز' : 'Position Distribution'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{language === 'ar' ? 'حراس المرمى' : 'Goalkeepers'}</span>
                        <span>{positionStats.goalkeeper}</span>
                      </div>
                      <Progress value={(positionStats.goalkeeper / totalPlayers) * 100} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{language === 'ar' ? 'المدافعين' : 'Defenders'}</span>
                        <span>{positionStats.defender}</span>
                      </div>
                      <Progress value={(positionStats.defender / totalPlayers) * 100} className="h-2 bg-blue-100 [&>div]:bg-blue-500" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{language === 'ar' ? 'لاعبي الوسط' : 'Midfielders'}</span>
                        <span>{positionStats.midfielder}</span>
                      </div>
                      <Progress value={(positionStats.midfielder / totalPlayers) * 100} className="h-2 bg-green-100 [&>div]:bg-green-500" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{language === 'ar' ? 'المهاجمين' : 'Forwards'}</span>
                        <span>{positionStats.forward}</span>
                      </div>
                      <Progress value={(positionStats.forward / totalPlayers) * 100} className="h-2 bg-red-100 [&>div]:bg-red-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Age Groups */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    {language === 'ar' ? 'الفئات العمرية' : 'Age Groups'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(ageGroups).sort().map(([group, count]) => (
                      <div key={group} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                        <span className="font-medium">{group}</span>
                        <Badge variant="secondary">{count} {language === 'ar' ? 'لاعب' : 'players'}</Badge>
                      </div>
                    ))}
                    {Object.keys(ageGroups).length === 0 && (
                      <p className="text-muted-foreground text-center py-4">
                        {language === 'ar' ? 'لا توجد بيانات' : 'No data available'}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Coaching Staff */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    {language === 'ar' ? 'الطاقم الفني' : 'Coaching Staff'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {teamCoaches.map((coach) => (
                      <div key={coach.id} className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{coach.coachName || coach.coachEmail}</p>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {coach.role?.replace('_', ' ')}
                            </Badge>
                            {coach.isPrimary && (
                              <Badge className="text-xs bg-yellow-500">
                                {language === 'ar' ? 'رئيسي' : 'Primary'}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {teamCoaches.length === 0 && (
                      <p className="text-muted-foreground text-center py-4">
                        {language === 'ar' ? 'لم يتم تعيين مدربين' : 'No coaches assigned'}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>{language === 'ar' ? 'إجراءات سريعة' : 'Quick Actions'}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button 
                    variant="outline" 
                    className="h-auto py-4 flex flex-col items-center gap-2"
                    onClick={() => setLocation(`/players?team=${teamType}`)}
                  >
                    <Users className="h-6 w-6" />
                    <span>{language === 'ar' ? 'عرض اللاعبين' : 'View Players'}</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-auto py-4 flex flex-col items-center gap-2"
                    onClick={() => setLocation(`/training?team=${teamType}`)}
                  >
                    <Calendar className="h-6 w-6" />
                    <span>{language === 'ar' ? 'التدريب' : 'Training'}</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-auto py-4 flex flex-col items-center gap-2"
                    onClick={() => setLocation(`/matches?team=${teamType}`)}
                  >
                    <Trophy className="h-6 w-6" />
                    <span>{language === 'ar' ? 'المباريات' : 'Matches'}</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-auto py-4 flex flex-col items-center gap-2"
                    onClick={() => setLocation(`/analytics?team=${teamType}`)}
                  >
                    <TrendingUp className="h-6 w-6" />
                    <span>{language === 'ar' ? 'التحليلات' : 'Analytics'}</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Players */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{language === 'ar' ? 'أحدث اللاعبين' : 'Recent Players'}</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setLocation(`/players?team=${teamType}`)}>
                  {language === 'ar' ? 'عرض الكل' : 'View All'}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {players?.slice(0, 5).map((player) => (
                    <div 
                      key={player.id} 
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted transition-colors"
                      onClick={() => setLocation(`/players/${player.id}/scorecard`)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-medium">
                          {player.firstName?.charAt(0)}{player.lastName?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium">{player.firstName} {player.lastName}</p>
                          <p className="text-sm text-muted-foreground">{player.position} • {player.ageGroup}</p>
                        </div>
                      </div>
                      <Badge variant={player.status === 'active' ? 'default' : player.status === 'injured' ? 'destructive' : 'secondary'}>
                        {player.status}
                      </Badge>
                    </div>
                  ))}
                  {(!players || players.length === 0) && (
                    <p className="text-muted-foreground text-center py-4">
                      {language === 'ar' ? 'لا يوجد لاعبين' : 'No players found'}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
