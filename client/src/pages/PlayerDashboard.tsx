import { useState } from 'react';
import { Link, useParams } from 'wouter';
import { trpc } from '@/lib/trpc';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import SkillsRadar from '@/components/SkillsRadar';
import PlayerCard from '@/components/PlayerCard';
import { 
  User, Activity, Target, TrendingUp, Gift, 
  Calendar, Clock, Trophy, Star, ChevronRight,
  Play, Award, Zap, Settings, ArrowLeft, Dumbbell, CheckCircle2
} from 'lucide-react';

export default function PlayerDashboard() {
  const { id } = useParams<{ id: string }>();
  const playerId = parseInt(id || '0');
  const { language, t } = useLanguage();
  const isRTL = language === 'ar';
  
  const [showPlayerCard, setShowPlayerCard] = useState(false);
  const [activeTab, setActiveTab] = useState('me');

  // Fetch player data
  const { data: player } = trpc.players.getById.useQuery({ id: playerId }, { enabled: !!playerId });
  const { data: skillScore } = trpc.skillScores.getLatest.useQuery({ playerId }, { enabled: !!playerId });
  const { data: activities } = trpc.activities.getPlayerActivities.useQuery({ playerId, limit: 10 }, { enabled: !!playerId });
  const { data: weeklyTargets } = trpc.weeklyTargets.getPlayerTargets.useQuery({ playerId }, { enabled: !!playerId });
  const { data: points } = trpc.points.getPlayerPoints.useQuery({ playerId }, { enabled: !!playerId });
  const { data: attendance } = trpc.attendance.getPlayerRate.useQuery({ playerId }, { enabled: !!playerId });
  const { data: assignedDrills } = trpc.drillAssignments.getForPlayer.useQuery({ playerId }, { enabled: !!playerId });

  // Transform skill score to expected format or use mock data
  // Map existing schema fields to display fields
  const mockSkills = {
    twoFooted: (skillScore as any)?.weakFootAbility ?? 46,
    dribbling: skillScore?.dribbling ?? 62,
    firstTouch: skillScore?.firstTouch ?? 60,
    agility: skillScore?.agility ?? 97,
    speed: skillScore?.speed ?? 70,
    power: (skillScore as any)?.strength ?? 71,
  };

  const mockPlayer = {
    name: player ? `${player.firstName} ${player.lastName}` : 'Player Name',
    position: player?.position || 'DM',
    photoUrl: player?.photoUrl || '',
    club: 'Future Stars FC',
    nationality: 'Egypt',
  };

  const mockActivities = activities || [
    { id: 1, activityType: 'match', activityDate: new Date(), durationMinutes: 108, opponent: 'Al Ahly FC', score: '2:0', possessions: 129, workRate: 43.9 },
    { id: 2, activityType: 'match', activityDate: new Date(Date.now() - 86400000), durationMinutes: 15, possessions: 8, workRate: 73.3 },
    { id: 3, activityType: 'training', activityDate: new Date(Date.now() - 172800000), durationMinutes: 96, ballTouches: 76 },
  ];

  const mockTargets = weeklyTargets || [
    { id: 1, targetType: 'speed_actions', targetValue: 50, currentValue: 35, isCompleted: false },
    { id: 2, targetType: 'ball_touches', targetValue: 100, currentValue: 76, isCompleted: false },
  ];

  return (
    <div className={`min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <header className="bg-navy-900 text-white sticky top-0 z-40">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => window.history.back()}
                className="text-white hover:bg-navy-800"
              >
                <ArrowLeft className={`h-5 w-5 ${isRTL ? 'rotate-180' : ''}`} />
              </Button>
              <Link href="/">
                <img src="/logo-transparent.png" alt="Future Stars FC" className="h-10" />
              </Link>
            </div>
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Player Profile Header */}
      <div className="bg-gradient-to-r from-navy-800 to-navy-900 text-white py-6">
        <div className="container">
          <div className="flex items-center gap-4">
            <div 
              className="w-16 h-16 rounded-full bg-gray-300 overflow-hidden cursor-pointer border-2 border-cyan-400"
              onClick={() => setShowPlayerCard(true)}
            >
              {mockPlayer.photoUrl ? (
                <img src={mockPlayer.photoUrl} alt={mockPlayer.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl text-gray-600">
                  {mockPlayer.name.charAt(0)}
                </div>
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold">{mockPlayer.name}</h1>
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <span className="flex items-center gap-1">
                  <div className="w-5 h-3 flex flex-col rounded overflow-hidden">
                    <div className="flex-1 bg-red-600" />
                    <div className="flex-1 bg-white" />
                    <div className="flex-1 bg-black" />
                  </div>
                </span>
                <span>{mockPlayer.position}</span>
                <span>•</span>
                <span>{mockPlayer.club || 'Future Stars FC'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Targets */}
      <div className="bg-navy-800 py-4 border-b border-navy-700">
        <div className="container">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white font-semibold flex items-center gap-2">
              <Target className="h-4 w-4" />
              {isRTL ? 'الأهداف الأسبوعية' : 'Weekly targets'}
            </h2>
            <Button variant="link" className="text-cyan-400 text-sm p-0">
              + {isRTL ? 'إضافة' : 'Add'} <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {mockTargets.map((target: any) => (
              <Card key={target.id} className="bg-navy-700/50 border-navy-600">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    {target.targetType === 'speed_actions' ? (
                      <Zap className="h-5 w-5 text-yellow-400" />
                    ) : (
                      <Activity className="h-5 w-5 text-cyan-400" />
                    )}
                    <span className="text-sm text-gray-300">
                      {target.targetType === 'speed_actions' 
                        ? (isRTL ? 'حركات السرعة' : 'Speed actions')
                        : (isRTL ? 'لمسات الكرة' : 'Ball touches')}
                    </span>
                  </div>
                  <div className="text-gray-400 text-xs">
                    {target.currentValue || '--'} / {target.targetValue || '--'}
                  </div>
                  <Progress 
                    value={target.currentValue ? (target.currentValue / target.targetValue) * 100 : 0} 
                    className="h-1 mt-2"
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Assigned Drills Section */}
      {assignedDrills && assignedDrills.length > 0 && (
        <div className="bg-gradient-to-r from-cyan-900/30 to-navy-800 py-4 border-b border-navy-700">
          <div className="container">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-white font-semibold flex items-center gap-2">
                <Dumbbell className="h-4 w-4 text-cyan-400" />
                {isRTL ? 'التمارين المعينة لك' : 'Assigned Drills'}
              </h2>
              <Badge className="bg-cyan-600">
                {assignedDrills.filter((d: any) => d.status === 'pending').length} {isRTL ? 'معلق' : 'pending'}
              </Badge>
            </div>
            <div className="space-y-3">
              {assignedDrills.slice(0, 3).map((drill: any) => (
                <Card key={drill.id} className={`border ${drill.status === 'completed' ? 'bg-green-900/20 border-green-700' : 'bg-navy-700/50 border-navy-600'}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${drill.status === 'completed' ? 'bg-green-600' : 'bg-cyan-600'}`}>
                          {drill.status === 'completed' ? (
                            <CheckCircle2 className="h-5 w-5 text-white" />
                          ) : (
                            <Dumbbell className="h-5 w-5 text-white" />
                          )}
                        </div>
                        <div>
                          <p className="text-white font-medium">{isRTL ? drill.drillNameAr || drill.drillName : drill.drillName}</p>
                          <p className="text-xs text-gray-400">
                            {drill.category && <span className="capitalize">{drill.category.replace('_', ' ')}</span>}
                            {drill.dueDate && (
                              <span className="ml-2">
                                <Calendar className="h-3 w-3 inline mr-1" />
                                {new Date(drill.dueDate).toLocaleDateString()}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={`${drill.priority === 'high' ? 'bg-red-600' : drill.priority === 'medium' ? 'bg-yellow-600' : 'bg-green-600'}`}>
                          {drill.priority}
                        </Badge>
                        {drill.status !== 'completed' && (
                          <Link href="/training-library">
                            <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700 text-xs">
                              {isRTL ? 'ابدأ' : 'Start'}
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                    {drill.reason && (
                      <p className="text-xs text-gray-500 mt-2 italic">
                        {isRTL ? 'ملاحظة المدرب: ' : 'Coach note: '}{drill.reason}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
              {assignedDrills.length > 3 && (
                <Button variant="link" className="text-cyan-400 text-sm w-full">
                  {isRTL ? `عرض الكل (${assignedDrills.length})` : `View all (${assignedDrills.length})`}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Skills Section */}
      <div className="container py-6">
        <Card className="bg-navy-800/50 border-navy-700">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-400" />
                {isRTL ? 'المهارات' : 'Skills'}
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-cyan-400"
                onClick={() => setShowPlayerCard(true)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <SkillsRadar skills={mockSkills} size={280} showLabels={true} showTrends={true} />
            <p className="text-xs text-gray-500 text-center mt-4">
              * {isRTL ? 'بناءً على الأنشطة منذ' : 'Based on activities since'} November 14, 2025
              <br />
              {isRTL ? 'محسوب لـ' : 'Calculated for'} {mockPlayer.position}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex justify-around py-2">
          <button 
            onClick={() => setActiveTab('me')}
            className={`flex flex-col items-center p-2 ${activeTab === 'me' ? 'text-cyan-600' : 'text-gray-500'}`}
          >
            <User className="h-5 w-5" />
            <span className="text-xs mt-1">{isRTL ? 'أنا' : 'Me'}</span>
          </button>
          <button 
            onClick={() => setActiveTab('activities')}
            className={`flex flex-col items-center p-2 ${activeTab === 'activities' ? 'text-cyan-600' : 'text-gray-500'}`}
          >
            <Activity className="h-5 w-5" />
            <span className="text-xs mt-1">{isRTL ? 'الأنشطة' : 'Activities'}</span>
          </button>
          <button 
            onClick={() => setActiveTab('targets')}
            className={`flex flex-col items-center p-2 ${activeTab === 'targets' ? 'text-cyan-600' : 'text-gray-500'}`}
          >
            <Target className="h-5 w-5" />
            <span className="text-xs mt-1">{isRTL ? 'الأهداف' : 'Targets'}</span>
          </button>
          <button 
            onClick={() => setActiveTab('trends')}
            className={`flex flex-col items-center p-2 ${activeTab === 'trends' ? 'text-cyan-600' : 'text-gray-500'}`}
          >
            <TrendingUp className="h-5 w-5" />
            <span className="text-xs mt-1">{isRTL ? 'التطور' : 'Trends'}</span>
          </button>
          <button 
            onClick={() => setActiveTab('explore')}
            className={`flex flex-col items-center p-2 relative ${activeTab === 'explore' ? 'text-cyan-600' : 'text-gray-500'}`}
          >
            <div className="relative">
              <Play className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 bg-yellow-400 text-black text-xs rounded-full w-4 h-4 flex items-center justify-center">
                4
              </span>
            </div>
            <span className="text-xs mt-1">{isRTL ? 'استكشف' : 'Explore'}</span>
          </button>
        </div>
      </nav>

      {/* Player Card Modal */}
      {showPlayerCard && (
        <PlayerCard
          player={{
            name: mockPlayer.name,
            position: mockPlayer.position,
            photoUrl: mockPlayer.photoUrl,
            club: mockPlayer.club,
            nationality: mockPlayer.nationality,
            skills: mockSkills,
          }}
          onClose={() => setShowPlayerCard(false)}
        />
      )}

      {/* Spacer for bottom nav */}
      <div className="h-20" />
    </div>
  );
}
