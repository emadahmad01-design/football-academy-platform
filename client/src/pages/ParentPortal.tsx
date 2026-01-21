import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import SkillsRadar from "@/components/SkillsRadar";
import PlayerCard from "@/components/PlayerCard";
import { 
  User, Activity, Brain, Dumbbell, Apple, Target, TrendingUp, 
  Calendar, Bell, MessageSquare, Star, Award, Clock, ArrowLeft,
  Gift, Zap, Trophy, CheckCircle2, XCircle, Video
} from "lucide-react";

function ProgressRing({ value, label, color }: { value: number; label: string; color: string }) {
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg width="100" height="100" className="transform -rotate-90">
          <circle
            cx="50"
            cy="50"
            r="40"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-muted"
          />
          <circle
            cx="50"
            cy="50"
            r="40"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={color}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold">{value}</span>
        </div>
      </div>
      <span className="text-sm text-muted-foreground mt-2">{label}</span>
    </div>
  );
}

export default function ParentPortal() {
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const [selectedChild, setSelectedChild] = useState<string>('');
  const [showPlayerCard, setShowPlayerCard] = useState(false);
  
  // In a real app, this would fetch children linked to the parent's account
  const { data: players } = trpc.players.getAll.useQuery();
  const { data: performance } = trpc.performance.getPlayerMetrics.useQuery(
    { playerId: parseInt(selectedChild), limit: 1 },
    { enabled: !!selectedChild }
  );
  const { data: mental } = trpc.mental.getPlayerAssessments.useQuery(
    { playerId: parseInt(selectedChild), limit: 1 },
    { enabled: !!selectedChild }
  );
  const { data: attendance } = trpc.attendance.getPlayerAttendance.useQuery(
    { playerId: parseInt(selectedChild) },
    { enabled: !!selectedChild }
  );
  const { data: playerPoints } = trpc.points.getPlayerPoints.useQuery(
    { playerId: parseInt(selectedChild) },
    { enabled: !!selectedChild }
  );

  const latestPerformance = performance?.[0];
  const latestMental = mental?.[0];
  const selectedPlayer = players?.find(p => p.id.toString() === selectedChild);

  // Calculate attendance rate
  const attendanceRate = attendance?.length 
    ? Math.round((attendance.filter(a => a.status === 'present').length / attendance.length) * 100)
    : 0;

  // Mock skills data (in real app, would come from player data)
  const mockSkills = {
    twoFooted: 46,
    dribbling: 62,
    firstTouch: 60,
    agility: 97,
    speed: 70,
    power: 71,
  };

  // Mock weekly targets
  const weeklyTargets = [
    { name: isRTL ? 'إجراءات السرعة' : 'Speed actions', current: 35, target: 50, icon: Zap },
    { name: isRTL ? 'لمسات الكرة' : 'Ball touches', current: 76, target: 100, icon: Target },
    { name: isRTL ? 'جلسات التدريب' : 'Training sessions', current: 4, target: 5, icon: Activity },
  ];

  // Mock activities
  const recentActivities = [
    { 
      type: 'training', 
      title: isRTL ? 'تدريب تقني' : 'Technical Training',
      date: new Date(Date.now() - 86400000),
      duration: 90,
      attended: true,
      workRate: 85,
      possessions: 47
    },
    { 
      type: 'match', 
      title: isRTL ? 'مباراة ودية' : 'Friendly Match',
      date: new Date(Date.now() - 172800000),
      duration: 70,
      attended: true,
      workRate: 92,
      possessions: 38,
      goals: 1,
      assists: 0
    },
    { 
      type: 'training', 
      title: isRTL ? 'تدريب بدني' : 'Physical Training',
      date: new Date(Date.now() - 259200000),
      duration: 60,
      attended: true,
      workRate: 78,
      possessions: 0
    },
  ];

  // Mock upcoming events
  const upcomingEvents = [
    { title: isRTL ? 'تدريب تقني' : 'Technical Training', date: new Date(Date.now() + 86400000), time: '09:00', type: 'training' },
    { title: isRTL ? 'مباراة الدوري' : 'U-14 League Match', date: new Date(Date.now() + 172800000), time: '14:00', type: 'match' },
    { title: isRTL ? 'استشارة التغذية' : 'Nutrition Consultation', date: new Date(Date.now() + 259200000), time: '11:00', type: 'appointment' },
  ];

  // Mock achievements
  const achievements = [
    { title: isRTL ? 'سريع البرق' : 'Speed Demon', description: isRTL ? 'وصل لسرعة 28 كم/س' : 'Reached top speed of 28 km/h' },
    { title: isRTL ? 'لاعب فريق' : 'Team Player', description: isRTL ? 'أعلى تمريرات حاسمة هذا الشهر' : 'Highest assist count this month' },
    { title: isRTL ? 'إرادة حديدية' : 'Iron Will', description: isRTL ? 'حضور مثالي لـ 30 يوم' : 'Perfect attendance for 30 days' },
  ];

  return (
    <div className={`min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <header className="bg-navy-900 text-white sticky top-0 z-40">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white hover:bg-navy-800"
                onClick={() => window.history.back()}
              >
                <ArrowLeft className={`h-5 w-5 ${isRTL ? 'rotate-180' : ''}`} />
              </Button>
              <Link href="/">
                <img src="/logo-transparent.png" alt="Future Stars FC" className="h-10" />
              </Link>
              <h1 className="text-xl font-bold">{isRTL ? 'بوابة الوالدين' : 'Parent Portal'}</h1>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" className="text-white">
                <Bell className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-white">
                <MessageSquare className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container py-6 space-y-6">
        {/* Child Selection */}
        <Card className="bg-navy-800/50 border-navy-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Label className="whitespace-nowrap text-white">
                {isRTL ? 'اختر طفلك:' : 'Select Child:'}
              </Label>
              <Select value={selectedChild} onValueChange={setSelectedChild}>
                <SelectTrigger className="max-w-xs bg-navy-700 border-navy-600 text-white">
                  <SelectValue placeholder={isRTL ? 'اختر طفلك' : 'Choose your child'} />
                </SelectTrigger>
                <SelectContent className="bg-navy-800 border-navy-700">
                  {players?.map((player) => (
                    <SelectItem key={player.id} value={player.id.toString()} className="text-white hover:bg-navy-700">
                      {player.firstName} {player.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {selectedChild && selectedPlayer ? (
          <>
            {/* Player Profile Header - FIFA Style */}
            <div className="bg-gradient-to-r from-navy-800 to-navy-900 rounded-xl p-6">
              <div className="flex items-center gap-6">
                <div 
                  className="relative cursor-pointer"
                  onClick={() => setShowPlayerCard(true)}
                >
                  <div className="h-24 w-24 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
                    <User className="h-12 w-12 text-white" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-yellow-500 rounded-full p-1">
                    <Star className="h-4 w-4 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white">
                    {selectedPlayer.firstName} {selectedPlayer.lastName}
                  </h2>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge className="bg-cyan-600">{selectedPlayer.position || 'MF'}</Badge>
                    <Badge variant="outline" className="text-gray-300 border-gray-600">
                      {isRTL ? 'العمر:' : 'Age:'} {selectedPlayer.dateOfBirth ? 
                        Math.floor((Date.now() - new Date(selectedPlayer.dateOfBirth).getTime()) / 31557600000) : 'N/A'
                      }
                    </Badge>
                    <Badge variant="outline" className="text-gray-300 border-gray-600 capitalize">
                      {selectedPlayer.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center gap-1">
                      <Gift className="h-4 w-4 text-yellow-400" />
                      <span className="text-yellow-400 font-bold">{playerPoints?.points || 0}</span>
                      <span className="text-gray-400 text-sm">{isRTL ? 'نقطة' : 'pts'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4 text-green-400" />
                      <span className="text-green-400 font-bold">{attendanceRate}%</span>
                      <span className="text-gray-400 text-sm">{isRTL ? 'حضور' : 'attendance'}</span>
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-5xl font-bold text-cyan-400">
                    {latestPerformance?.overallScore || 78}
                  </div>
                  <p className="text-sm text-gray-400">{isRTL ? 'التقييم العام' : 'Overall Rating'}</p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="bg-navy-800/50 border border-navy-700">
                <TabsTrigger value="overview" className="data-[state=active]:bg-cyan-600">
                  {isRTL ? 'نظرة عامة' : 'Overview'}
                </TabsTrigger>
                <TabsTrigger value="skills" className="data-[state=active]:bg-cyan-600">
                  {isRTL ? 'المهارات' : 'Skills'}
                </TabsTrigger>
                <TabsTrigger value="activities" className="data-[state=active]:bg-cyan-600">
                  {isRTL ? 'الأنشطة' : 'Activities'}
                </TabsTrigger>
                <TabsTrigger value="targets" className="data-[state=active]:bg-cyan-600">
                  {isRTL ? 'الأهداف' : 'Targets'}
                </TabsTrigger>
                <TabsTrigger value="attendance" className="data-[state=active]:bg-cyan-600">
                  {isRTL ? 'الحضور' : 'Attendance'}
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                {/* Quick Stats */}
                <div className="grid gap-4 md:grid-cols-4">
                  <Card className="bg-navy-800/50 border-navy-700">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="p-2 rounded-lg bg-cyan-600/20 text-cyan-400">
                          <Target className="h-5 w-5" />
                        </div>
                        <Badge className="bg-green-600 text-xs">+5%</Badge>
                      </div>
                      <h3 className="font-semibold text-white mb-1">{isRTL ? 'تقني' : 'Technical'}</h3>
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-3xl font-bold text-white">{latestPerformance?.technicalScore || 75}</span>
                        <span className="text-sm text-gray-400">/100</span>
                      </div>
                      <Progress value={latestPerformance?.technicalScore || 75} className="h-1.5" />
                    </CardContent>
                  </Card>

                  <Card className="bg-navy-800/50 border-navy-700">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="p-2 rounded-lg bg-green-600/20 text-green-400">
                          <Dumbbell className="h-5 w-5" />
                        </div>
                        <Badge className="bg-green-600 text-xs">+3%</Badge>
                      </div>
                      <h3 className="font-semibold text-white mb-1">{isRTL ? 'بدني' : 'Physical'}</h3>
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-3xl font-bold text-white">{latestPerformance?.physicalScore || 72}</span>
                        <span className="text-sm text-gray-400">/100</span>
                      </div>
                      <Progress value={latestPerformance?.physicalScore || 72} className="h-1.5" />
                    </CardContent>
                  </Card>

                  <Card className="bg-navy-800/50 border-navy-700">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="p-2 rounded-lg bg-purple-600/20 text-purple-400">
                          <Brain className="h-5 w-5" />
                        </div>
                        <Badge className="bg-yellow-600 text-xs">-2%</Badge>
                      </div>
                      <h3 className="font-semibold text-white mb-1">{isRTL ? 'ذهني' : 'Mental'}</h3>
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-3xl font-bold text-white">{latestMental?.overallMentalScore || 80}</span>
                        <span className="text-sm text-gray-400">/100</span>
                      </div>
                      <Progress value={latestMental?.overallMentalScore || 80} className="h-1.5" />
                    </CardContent>
                  </Card>

                  <Card className="bg-navy-800/50 border-navy-700">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="p-2 rounded-lg bg-yellow-600/20 text-yellow-400">
                          <Activity className="h-5 w-5" />
                        </div>
                        <Badge className="bg-green-600 text-xs">+8%</Badge>
                      </div>
                      <h3 className="font-semibold text-white mb-1">{isRTL ? 'تكتيكي' : 'Tactical'}</h3>
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-3xl font-bold text-white">{latestPerformance?.tacticalScore || 68}</span>
                        <span className="text-sm text-gray-400">/100</span>
                      </div>
                      <Progress value={latestPerformance?.tacticalScore || 68} className="h-1.5" />
                    </CardContent>
                  </Card>
                </div>

                {/* Upcoming Events */}
                <Card className="bg-navy-800/50 border-navy-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-cyan-400" />
                      {isRTL ? 'الأحداث القادمة' : 'Upcoming Events'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {upcomingEvents.map((event, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-navy-700/50">
                          <div className="p-2 rounded-lg bg-cyan-600/20 text-cyan-400">
                            <Calendar className="h-4 w-4" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-white text-sm">{event.title}</p>
                            <p className="text-xs text-gray-400">
                              {new Date(event.date).toLocaleDateString()} at {event.time}
                            </p>
                          </div>
                          <Badge variant="outline" className="capitalize text-gray-300 border-gray-600">
                            {event.type}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Achievements */}
                <Card className="bg-navy-800/50 border-navy-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-yellow-400" />
                      {isRTL ? 'الإنجازات' : 'Achievements'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3 md:grid-cols-3">
                      {achievements.map((achievement, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                          <div className="p-2 rounded-full bg-yellow-500/20 text-yellow-400">
                            <Award className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium text-white text-sm">{achievement.title}</p>
                            <p className="text-xs text-gray-400">{achievement.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Skills Tab - FIFA Style Radar */}
              <TabsContent value="skills" className="space-y-6">
                <Card className="bg-navy-800/50 border-navy-700">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white flex items-center gap-2">
                        <Star className="h-5 w-5 text-yellow-400" />
                        {isRTL ? 'مهارات اللاعب' : 'Player Skills'}
                      </CardTitle>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-cyan-400"
                        onClick={() => setShowPlayerCard(true)}
                      >
                        {isRTL ? 'عرض البطاقة' : 'View Card'}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <SkillsRadar skills={mockSkills} size={320} showLabels={true} />
                    <p className="text-xs text-gray-500 text-center mt-4">
                      * {isRTL ? 'بناءً على الأنشطة منذ' : 'Based on activities since'} November 14, 2025
                    </p>
                  </CardContent>
                </Card>

                {/* Skill Breakdown */}
                <Card className="bg-navy-800/50 border-navy-700">
                  <CardHeader>
                    <CardTitle className="text-white">{isRTL ? 'تفاصيل المهارات' : 'Skill Breakdown'}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Object.entries(mockSkills).map(([skill, value]) => (
                      <div key={skill} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-300 capitalize">
                            {isRTL ? {
                              twoFooted: 'استخدام القدمين',
                              dribbling: 'المراوغة',
                              firstTouch: 'اللمسة الأولى',
                              agility: 'الرشاقة',
                              speed: 'السرعة',
                              power: 'القوة'
                            }[skill] : skill.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                          <span className={`font-bold ${
                            value >= 80 ? 'text-green-400' : 
                            value >= 60 ? 'text-yellow-400' : 
                            value >= 40 ? 'text-orange-400' : 'text-red-400'
                          }`}>{value}</span>
                        </div>
                        <Progress value={value} className="h-2" />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Activities Tab */}
              <TabsContent value="activities" className="space-y-6">
                <Card className="bg-navy-800/50 border-navy-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Activity className="h-5 w-5 text-cyan-400" />
                      {isRTL ? 'الأنشطة الأخيرة' : 'Recent Activities'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentActivities.map((activity, i) => (
                        <div key={i} className="p-4 rounded-lg bg-navy-700/50 border border-navy-600">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${
                                activity.type === 'match' ? 'bg-green-600/20 text-green-400' : 'bg-cyan-600/20 text-cyan-400'
                              }`}>
                                {activity.type === 'match' ? <Trophy className="h-5 w-5" /> : <Activity className="h-5 w-5" />}
                              </div>
                              <div>
                                <p className="font-medium text-white">{activity.title}</p>
                                <p className="text-xs text-gray-400">
                                  {new Date(activity.date).toLocaleDateString()} • {activity.duration} min
                                </p>
                              </div>
                            </div>
                            {activity.attended ? (
                              <Badge className="bg-green-600">{isRTL ? 'حضر' : 'Attended'}</Badge>
                            ) : (
                              <Badge className="bg-red-600">{isRTL ? 'غائب' : 'Absent'}</Badge>
                            )}
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-center">
                            <div className="p-2 rounded bg-navy-800/50">
                              <p className="text-lg font-bold text-white">{activity.workRate}%</p>
                              <p className="text-xs text-gray-400">{isRTL ? 'معدل العمل' : 'Work Rate'}</p>
                            </div>
                            <div className="p-2 rounded bg-navy-800/50">
                              <p className="text-lg font-bold text-white">{activity.possessions}</p>
                              <p className="text-xs text-gray-400">{isRTL ? 'الاستحواذات' : 'Possessions'}</p>
                            </div>
                            {activity.type === 'match' && (
                              <div className="p-2 rounded bg-navy-800/50">
                                <p className="text-lg font-bold text-white">{activity.goals}G / {activity.assists}A</p>
                                <p className="text-xs text-gray-400">{isRTL ? 'أهداف/تمريرات' : 'Goals/Assists'}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Targets Tab */}
              <TabsContent value="targets" className="space-y-6">
                <Card className="bg-navy-800/50 border-navy-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Target className="h-5 w-5 text-cyan-400" />
                      {isRTL ? 'الأهداف الأسبوعية' : 'Weekly Targets'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {weeklyTargets.map((target, i) => {
                        const percentage = Math.round((target.current / target.target) * 100);
                        const Icon = target.icon;
                        return (
                          <div key={i} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Icon className="h-5 w-5 text-cyan-400" />
                                <span className="text-white font-medium">{target.name}</span>
                              </div>
                              <span className="text-gray-400">
                                <span className="text-white font-bold">{target.current}</span>/{target.target}
                              </span>
                            </div>
                            <Progress value={percentage} className="h-3" />
                            <p className="text-xs text-gray-500 text-right">
                              {percentage}% {isRTL ? 'مكتمل' : 'complete'}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Attendance Tab */}
              <TabsContent value="attendance" className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <Card className="bg-green-900/20 border-green-700">
                    <CardContent className="p-6 text-center">
                      <CheckCircle2 className="h-10 w-10 text-green-400 mx-auto mb-2" />
                      <p className="text-3xl font-bold text-green-400">{attendanceRate}%</p>
                      <p className="text-sm text-gray-400">{isRTL ? 'نسبة الحضور' : 'Attendance Rate'}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-cyan-900/20 border-cyan-700">
                    <CardContent className="p-6 text-center">
                      <Activity className="h-10 w-10 text-cyan-400 mx-auto mb-2" />
                      <p className="text-3xl font-bold text-cyan-400">{attendance?.filter(a => a.status === 'present').length || 0}</p>
                      <p className="text-sm text-gray-400">{isRTL ? 'جلسات حضرها' : 'Sessions Attended'}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-red-900/20 border-red-700">
                    <CardContent className="p-6 text-center">
                      <XCircle className="h-10 w-10 text-red-400 mx-auto mb-2" />
                      <p className="text-3xl font-bold text-red-400">{attendance?.filter(a => a.status === 'absent').length || 0}</p>
                      <p className="text-sm text-gray-400">{isRTL ? 'جلسات غائب' : 'Sessions Missed'}</p>
                    </CardContent>
                  </Card>
                </div>

                <Card className="bg-navy-800/50 border-navy-700">
                  <CardHeader>
                    <CardTitle className="text-white">{isRTL ? 'سجل الحضور' : 'Attendance History'}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {(attendance || []).slice(0, 10).map((record, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-navy-700/50">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${
                              record.status === 'present' ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'
                            }`}>
                              {record.status === 'present' ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                            </div>
                            <div>
                              <p className="text-white text-sm">{record.sessionType}</p>
                              <p className="text-xs text-gray-400">
                                {new Date(record.sessionDate).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <Badge className={record.status === 'present' ? 'bg-green-600' : 'bg-red-600'}>
                            {record.status === 'present' ? (isRTL ? 'حاضر' : 'Present') : (isRTL ? 'غائب' : 'Absent')}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Quick Actions */}
            <Card className="bg-navy-800/50 border-navy-700">
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-3">
                  <Link href="/video-analysis">
                    <Button className="bg-cyan-600 hover:bg-cyan-700">
                      <Video className="h-4 w-4 mr-2" />
                      {isRTL ? 'تحليل الفيديو' : 'Video Analysis'}
                    </Button>
                  </Link>
                  <Link href="/rewards">
                    <Button variant="outline" className="border-yellow-500 text-yellow-400 hover:bg-yellow-500/10">
                      <Gift className="h-4 w-4 mr-2" />
                      {isRTL ? 'المكافآت' : 'Rewards'} ({playerPoints?.points || 0} pts)
                    </Button>
                  </Link>
                  <Link href="/explore">
                    <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                      <Star className="h-4 w-4 mr-2" />
                      {isRTL ? 'استكشف' : 'Explore'}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card className="bg-navy-800/50 border-navy-700">
            <CardContent className="p-12 text-center">
              <User className="h-12 w-12 mx-auto text-gray-500 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">
                {isRTL ? 'اختر طفلك' : 'Select Your Child'}
              </h3>
              <p className="text-gray-400">
                {isRTL 
                  ? 'اختر طفلك من القائمة أعلاه لعرض تقدمه في التطوير'
                  : 'Choose your child from the dropdown above to view their development progress'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Player Card Modal */}
      {showPlayerCard && selectedPlayer && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setShowPlayerCard(false)}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <PlayerCard
              player={{
                name: `${selectedPlayer.firstName} ${selectedPlayer.lastName}`,
                position: selectedPlayer.position || 'MF',
                nationality: 'Egypt',
                club: 'Future Stars FC',
                
                skills: mockSkills,
              }}
              onClose={() => setShowPlayerCard(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
