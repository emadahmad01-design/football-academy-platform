import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { trpc } from '@/lib/trpc';
import { EmptyState } from '../components/EmptyState';
import { 
  Trophy, 
  Download, 
  GraduationCap, 
  BarChart3,
  Clock,
  CheckCircle2,
  XCircle,
  Calendar,
  Award,
  Users,
  Target,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { useLanguage } from '@/contexts/LanguageContext';
import WeeklyChallenges from '@/components/WeeklyChallenges';
import { useLocation } from 'wouter';

export default function CoachDashboard() {
  const { language } = useLanguage();
  const [, setLocation] = useLocation();
  
  // Fetch enrollments with certificates
  const { data: enrollments = [] } = trpc.coachEducation.getMyEnrollments.useQuery();
  
  // Fetch quiz attempts
  const { data: attempts = [] } = trpc.coachEducation.getMyAttempts.useQuery();
  
  // Fetch courses for reference
  const { data: courses = [] } = trpc.coachEducation.getCourses.useQuery();
  
  // Fetch statistics and leaderboard
  const { data: stats } = trpc.dataAnalysis.getCoachStatistics.useQuery();
  const { data: leaderboard = [] } = trpc.dataAnalysis.getLeaderboard.useQuery();
  const { data: userBadges = [] } = trpc.dataAnalysis.getUserBadges.useQuery();
  
  const completedCourses = enrollments.filter((e: any) => e.certificateUrl);
  const inProgressCourses = enrollments.filter((e: any) => !e.certificateUrl && (e.progress || 0) > 0);
  
  const totalAttempts = attempts.length;
  const passedAttempts = attempts.filter(a => a.passed).length;
  const averageScore = attempts.length > 0 
    ? Math.round(attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-950 dark:via-blue-950 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <GraduationCap className="h-10 w-10 text-blue-600" />
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Coach Dashboard
              </h1>
              <p className="text-muted-foreground">Track your progress and view your certificates</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Certificates Earned</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedCourses.length}</div>
              <p className="text-xs text-muted-foreground">
                {completedCourses.length === 1 ? 'certificate' : 'certificates'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Courses In Progress</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inProgressCourses.length}</div>
              <p className="text-xs text-muted-foreground">
                {inProgressCourses.length === 1 ? 'course' : 'courses'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Attempts</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalAttempts}</div>
              <p className="text-xs text-muted-foreground">
                {passedAttempts} passed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Score</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{averageScore}%</div>
              <p className="text-xs text-muted-foreground">
                across all attempts
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Certificates Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">My Certificates</h2>
          {completedCourses.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Trophy className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No certificates yet. Complete a course to earn one!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {completedCourses.map((enrollment: any) => {
                const course = courses.find(c => c.id === enrollment.courseId);
                if (!course) return null;

                return (
                  <Card key={enrollment.id} className="card-hover">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{course.title}</CardTitle>
                          <CardDescription className="mt-1">
                            {course.level.replace('_', ' ').toUpperCase()}
                          </CardDescription>
                        </div>
                        <Trophy className="h-8 w-8 text-yellow-500" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Completed</span>
                          <span className="font-semibold">
                            {enrollment.completedAt 
                              ? new Date(enrollment.completedAt).toLocaleDateString()
                              : 'N/A'}
                          </span>
                        </div>
                        {enrollment.certificateUrl && (
                          <Button 
                            className="w-full" 
                            onClick={() => window.open(enrollment.certificateUrl || '', '_blank')}
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Download Certificate
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Badges Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Award className="h-6 w-6 text-yellow-500" />
            {language === 'ar' ? 'شاراتي' : 'My Badges'}
          </h2>
          {userBadges.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Sparkles className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {language === 'ar' ? 'لا توجد شارات بعد. أكمل الاختبارات لكسب الشارات!' : 'No badges yet. Complete quizzes to earn badges!'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {userBadges.map((userBadge: any) => (
                <Card key={userBadge.id} className="card-hover bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 border-yellow-200 dark:border-yellow-800">
                  <CardHeader>
                    <div className="flex flex-col items-center text-center">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center mb-3">
                        <Award className="h-8 w-8 text-white" />
                      </div>
                      <CardTitle className="text-lg">{userBadge.badge.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {userBadge.badge.description}
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">
                        {language === 'ar' ? 'حصل عليها في' : 'Earned on'}
                      </p>
                      <p className="text-sm font-semibold">
                        {new Date(userBadge.earnedAt).toLocaleDateString()}
                      </p>
                      {userBadge.progress < 100 && (
                        <div className="mt-3">
                          <Progress value={userBadge.progress} className="h-2" />
                          <p className="text-xs text-muted-foreground mt-1">
                            {userBadge.progress}% {language === 'ar' ? 'مكتمل' : 'complete'}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Performance Chart */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                {language === 'ar' ? 'أداء الاختبارات' : 'Quiz Performance'}
              </CardTitle>
              <CardDescription>
                {language === 'ar' ? 'درجاتك عبر الزمن' : 'Your scores over time'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats?.performanceData && stats.performanceData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={stats.performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="score" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      name={language === 'ar' ? 'الدرجة' : 'Score'}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  {language === 'ar' ? 'لا توجد بيانات بعد' : 'No data yet'}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Weekly Challenges */}
        <div className="mb-8">
          <WeeklyChallenges />
        </div>

        {/* Leaderboard */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {language === 'ar' ? 'لوحة المتصدرين' : 'Leaderboard'}
              </CardTitle>
              <CardDescription>
                {language === 'ar' ? 'أفضل المدربين على المنصة' : 'Top coaches on the platform'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {leaderboard.length > 0 ? (
                <div className="space-y-3">
                  {leaderboard.map((coach, index) => (
                    <div
                      key={coach.userId}
                      className={`flex items-center justify-between p-4 rounded-lg border-2 ${
                        index === 0 ? 'bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 border-yellow-300 dark:border-yellow-700' :
                        index === 1 ? 'bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/50 border-slate-300 dark:border-slate-700' :
                        index === 2 ? 'bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 border-orange-300 dark:border-orange-700' :
                        'bg-slate-50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`text-2xl font-bold ${
                          index === 0 ? 'text-yellow-600' :
                          index === 1 ? 'text-slate-600' :
                          index === 2 ? 'text-orange-600' :
                          'text-slate-400'
                        }`}>
                          #{index + 1}
                        </div>
                        <div>
                          <h4 className="font-semibold">{coach.userName}</h4>
                          <p className="text-sm text-muted-foreground">
                            {coach.badgeCount} {language === 'ar' ? 'شارة' : 'badges'} • 
                            {coach.avgScore ? Number(coach.avgScore).toFixed(1) : '0.0'}% {language === 'ar' ? 'متوسط' : 'avg'}
                          </p>
                        </div>
                      </div>
                      {index < 3 && (
                        <Trophy className={`h-6 w-6 ${
                          index === 0 ? 'text-yellow-600' :
                          index === 1 ? 'text-slate-600' :
                          'text-orange-600'
                        }`} />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon="🏆"
                  title={language === 'ar' ? 'لا توجد بيانات بعد' : 'No Leaderboard Data'}
                  description={language === 'ar' ? 'أكمل الدورات واكسب الشارات للظهور في لوحة المتصدرين' : 'Complete courses and earn badges to appear on the leaderboard'}
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Quiz Attempts */}
        <div>
          <h2 className="text-2xl font-bold mb-4">{language === 'ar' ? 'محاولات الاختبارات الأخيرة' : 'Recent Quiz Attempts'}</h2>
          {attempts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <BarChart3 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No quiz attempts yet. Start a course assessment!</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {attempts.slice(0, 10).map((attempt) => {
                    const course = courses.find(c => c.id === attempt.courseId);
                    if (!course) return null;

                    return (
                      <div key={attempt.id} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-4">
                          {attempt.passed ? (
                            <CheckCircle2 className="h-8 w-8 text-green-600" />
                          ) : (
                            <XCircle className="h-8 w-8 text-red-600" />
                          )}
                          <div>
                            <p className="font-semibold">{course.title}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {new Date(attempt.attemptedAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-2xl font-bold">{attempt.score}%</div>
                            <Badge variant={attempt.passed ? 'default' : 'destructive'}>
                              {attempt.passed ? 'Passed' : 'Failed'}
                            </Badge>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setLocation(`/quiz-review/${attempt.id}`)}
                          >
                            Review
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
