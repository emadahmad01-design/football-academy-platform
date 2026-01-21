import { useState } from 'react';
import { Link } from 'wouter';
import { trpc } from '@/lib/trpc';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, Users, Star, Trophy, Target, 
  Search, Filter, ChevronRight, MapPin,
  Zap, Activity, Brain, Footprints
} from 'lucide-react';

// Age group teams
const TEAMS = [
  { id: 'u9', name: 'U-9', nameAr: 'تحت 9 سنوات', ageRange: '7-9' },
  { id: 'u10', name: 'U-10', nameAr: 'تحت 10 سنوات', ageRange: '9-10' },
  { id: 'u11', name: 'U-11', nameAr: 'تحت 11 سنوات', ageRange: '10-11' },
  { id: 'u12', name: 'U-12', nameAr: 'تحت 12 سنوات', ageRange: '11-12' },
  { id: 'u13', name: 'U-13', nameAr: 'تحت 13 سنوات', ageRange: '12-13' },
  { id: 'u14', name: 'U-14', nameAr: 'تحت 14 سنوات', ageRange: '13-14' },
  { id: 'u15', name: 'U-15', nameAr: 'تحت 15 سنوات', ageRange: '14-15' },
  { id: 'u16', name: 'U-16', nameAr: 'تحت 16 سنوات', ageRange: '15-16' },
  { id: 'u17', name: 'U-17', nameAr: 'تحت 17 سنوات', ageRange: '16-17' },
  { id: 'u18', name: 'U-18', nameAr: 'تحت 18 سنوات', ageRange: '17-18' },
];

// Mock players data with TIPS model
const MOCK_PLAYERS: Record<string, any[]> = {
  'u9': [
    { id: 1, name: 'يوسف أحمد', nameEn: 'Youssef Ahmed', age: 8, position: 'Forward', positionAr: 'مهاجم', photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=youssef1', technique: 72, insight: 68, personality: 85, speed: 78, overall: 76, goals: 12, assists: 5, attendance: 95 },
    { id: 2, name: 'عمر محمد', nameEn: 'Omar Mohamed', age: 9, position: 'Midfielder', positionAr: 'وسط', photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=omar1', technique: 75, insight: 72, personality: 78, speed: 70, overall: 74, goals: 5, assists: 8, attendance: 92 },
    { id: 3, name: 'أحمد علي', nameEn: 'Ahmed Ali', age: 8, position: 'Defender', positionAr: 'مدافع', photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ahmed1', technique: 68, insight: 75, personality: 82, speed: 72, overall: 74, goals: 1, assists: 3, attendance: 98 },
    { id: 4, name: 'كريم حسن', nameEn: 'Karim Hassan', age: 9, position: 'Goalkeeper', positionAr: 'حارس مرمى', photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=karim1', technique: 70, insight: 78, personality: 88, speed: 65, overall: 75, goals: 0, assists: 0, attendance: 100 },
  ],
  'u10': [
    { id: 5, name: 'محمد سعيد', nameEn: 'Mohamed Said', age: 10, position: 'Forward', positionAr: 'مهاجم', photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mohamed2', technique: 78, insight: 74, personality: 80, speed: 82, overall: 79, goals: 18, assists: 7, attendance: 94 },
    { id: 6, name: 'علي إبراهيم', nameEn: 'Ali Ibrahim', age: 10, position: 'Midfielder', positionAr: 'وسط', photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ali2', technique: 80, insight: 76, personality: 75, speed: 74, overall: 76, goals: 8, assists: 12, attendance: 90 },
    { id: 7, name: 'حسين أمين', nameEn: 'Hussein Amin', age: 9, position: 'Defender', positionAr: 'مدافع', photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=hussein1', technique: 72, insight: 80, personality: 85, speed: 70, overall: 77, goals: 2, assists: 4, attendance: 96 },
  ],
  'u11': [
    { id: 8, name: 'خالد عبدالله', nameEn: 'Khaled Abdullah', age: 11, position: 'Forward', positionAr: 'مهاجم', photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=khaled1', technique: 82, insight: 78, personality: 76, speed: 85, overall: 80, goals: 22, assists: 9, attendance: 93 },
    { id: 9, name: 'طارق نبيل', nameEn: 'Tarek Nabil', age: 11, position: 'Midfielder', positionAr: 'وسط', photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=tarek1', technique: 84, insight: 82, personality: 78, speed: 76, overall: 80, goals: 10, assists: 15, attendance: 97 },
    { id: 10, name: 'سامي رضا', nameEn: 'Sami Reda', age: 10, position: 'Defender', positionAr: 'مدافع', photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sami1', technique: 75, insight: 85, personality: 88, speed: 72, overall: 80, goals: 3, assists: 6, attendance: 99 },
  ],
  'u12': [
    { id: 11, name: 'أحمد حسان', nameEn: 'Ahmed Hassan', age: 12, position: 'Forward', positionAr: 'مهاجم', photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ahmedh1', technique: 85, insight: 80, personality: 82, speed: 88, overall: 84, goals: 28, assists: 11, attendance: 95 },
    { id: 12, name: 'مروان فتحي', nameEn: 'Marwan Fathy', age: 12, position: 'Midfielder', positionAr: 'وسط', photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=marwan1', technique: 86, insight: 84, personality: 80, speed: 78, overall: 82, goals: 12, assists: 18, attendance: 92 },
    { id: 13, name: 'ياسر محمود', nameEn: 'Yasser Mahmoud', age: 11, position: 'Defender', positionAr: 'مدافع', photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=yasser1', technique: 78, insight: 88, personality: 90, speed: 75, overall: 83, goals: 4, assists: 8, attendance: 98 },
    { id: 14, name: 'عمرو سمير', nameEn: 'Amr Samir', age: 12, position: 'Goalkeeper', positionAr: 'حارس مرمى', photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=amr1', technique: 75, insight: 85, personality: 92, speed: 68, overall: 80, goals: 0, assists: 1, attendance: 100 },
  ],
  'u13': [
    { id: 15, name: 'زياد كريم', nameEn: 'Ziad Karim', age: 13, position: 'Forward', positionAr: 'مهاجم', photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ziad1', technique: 87, insight: 82, personality: 78, speed: 90, overall: 84, goals: 32, assists: 14, attendance: 94 },
    { id: 16, name: 'باسم عادل', nameEn: 'Basem Adel', age: 13, position: 'Midfielder', positionAr: 'وسط', photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=basem1', technique: 88, insight: 86, personality: 82, speed: 80, overall: 84, goals: 15, assists: 22, attendance: 96 },
  ],
  'u14': [
    { id: 17, name: 'نادر حسين', nameEn: 'Nader Hussein', age: 14, position: 'Forward', positionAr: 'مهاجم', photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=nader1', technique: 89, insight: 84, personality: 80, speed: 92, overall: 86, goals: 38, assists: 16, attendance: 93 },
    { id: 18, name: 'فادي رامي', nameEn: 'Fadi Rami', age: 14, position: 'Midfielder', positionAr: 'وسط', photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=fadi1', technique: 90, insight: 88, personality: 84, speed: 82, overall: 86, goals: 18, assists: 28, attendance: 97 },
    { id: 19, name: 'هاني وليد', nameEn: 'Hani Walid', age: 13, position: 'Defender', positionAr: 'مدافع', photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=hani1', technique: 82, insight: 90, personality: 92, speed: 78, overall: 86, goals: 5, assists: 10, attendance: 99 },
  ],
  'u15': [
    { id: 20, name: 'سيف الدين', nameEn: 'Seif Eldin', age: 15, position: 'Forward', positionAr: 'مهاجم', photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=seif1', technique: 91, insight: 86, personality: 82, speed: 94, overall: 88, goals: 42, assists: 18, attendance: 95 },
    { id: 21, name: 'مصطفى شريف', nameEn: 'Mostafa Sherif', age: 15, position: 'Midfielder', positionAr: 'وسط', photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mostafa1', technique: 92, insight: 90, personality: 86, speed: 84, overall: 88, goals: 20, assists: 32, attendance: 98 },
  ],
  'u16': [
    { id: 22, name: 'عبدالرحمن', nameEn: 'Abdelrahman', age: 16, position: 'Forward', positionAr: 'مهاجم', photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=abdel1', technique: 93, insight: 88, personality: 84, speed: 95, overall: 90, goals: 48, assists: 20, attendance: 94 },
    { id: 23, name: 'إسلام محمد', nameEn: 'Islam Mohamed', age: 16, position: 'Midfielder', positionAr: 'وسط', photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=islam1', technique: 94, insight: 92, personality: 88, speed: 86, overall: 90, goals: 22, assists: 36, attendance: 97 },
    { id: 24, name: 'محمود عزت', nameEn: 'Mahmoud Ezzat', age: 15, position: 'Defender', positionAr: 'مدافع', photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mahmoud1', technique: 86, insight: 94, personality: 94, speed: 82, overall: 89, goals: 6, assists: 12, attendance: 100 },
  ],
  'u17': [
    { id: 25, name: 'يحيى حمدي', nameEn: 'Yahia Hamdy', age: 17, position: 'Forward', positionAr: 'مهاجم', photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=yahia1', technique: 94, insight: 90, personality: 86, speed: 96, overall: 92, goals: 52, assists: 22, attendance: 95 },
    { id: 26, name: 'أيمن سعد', nameEn: 'Ayman Saad', age: 17, position: 'Midfielder', positionAr: 'وسط', photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ayman1', technique: 95, insight: 94, personality: 90, speed: 88, overall: 92, goals: 24, assists: 40, attendance: 98 },
  ],
  'u18': [
    { id: 27, name: 'كريم مصطفى', nameEn: 'Karim Mostafa', age: 18, position: 'Forward', positionAr: 'مهاجم', photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=karimm1', technique: 95, insight: 92, personality: 88, speed: 97, overall: 93, goals: 58, assists: 24, attendance: 96 },
    { id: 28, name: 'أحمد فاروق', nameEn: 'Ahmed Farouk', age: 18, position: 'Midfielder', positionAr: 'وسط', photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ahmedf1', technique: 96, insight: 95, personality: 92, speed: 90, overall: 93, goals: 26, assists: 44, attendance: 99 },
    { id: 29, name: 'عمر الشناوي', nameEn: 'Omar El-Shenawy', age: 17, position: 'Goalkeeper', positionAr: 'حارس مرمى', photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=omars1', technique: 88, insight: 96, personality: 96, speed: 75, overall: 89, goals: 0, assists: 2, attendance: 100 },
    { id: 30, name: 'حسام غالي', nameEn: 'Hossam Ghaly', age: 18, position: 'Defender', positionAr: 'مدافع', photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=hossam1', technique: 90, insight: 96, personality: 96, speed: 85, overall: 92, goals: 8, assists: 14, attendance: 98 },
  ],
};

// Position colors
const POSITION_COLORS: Record<string, string> = {
  'Forward': 'bg-red-500',
  'Midfielder': 'bg-green-500',
  'Defender': 'bg-blue-500',
  'Goalkeeper': 'bg-yellow-500',
};

export default function TeamPlayers() {
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const [selectedTeam, setSelectedTeam] = useState('u12');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);

  const players = MOCK_PLAYERS[selectedTeam] || [];
  const filteredPlayers = players.filter(p => 
    p.name.includes(searchQuery) || 
    p.nameEn.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTIPSColor = (value: number) => {
    if (value >= 85) return 'text-green-400';
    if (value >= 70) return 'text-yellow-400';
    return 'text-orange-400';
  };

  const getOverallColor = (value: number) => {
    if (value >= 90) return 'from-yellow-400 to-yellow-600';
    if (value >= 80) return 'from-green-400 to-green-600';
    if (value >= 70) return 'from-blue-400 to-blue-600';
    return 'from-gray-400 to-gray-600';
  };

  return (
    <div className={`min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="icon" className="text-white hover:bg-slate-700">
                  <ArrowLeft className={`h-5 w-5 ${isRTL ? 'rotate-180' : ''}`} />
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">
                    {isRTL ? 'فرق الأكاديمية' : 'Academy Teams'}
                  </h1>
                  <p className="text-sm text-slate-400">
                    {isRTL ? 'جميع الفرق والفئات العمرية' : 'All Teams & Age Groups'}
                  </p>
                </div>
              </div>
            </div>

            {/* Search */}
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder={isRTL ? 'بحث عن لاعب...' : 'Search player...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
              />
            </div>
          </div>
        </div>
      </header>

      <main className="container py-8">
        {/* Team Tabs */}
        <Tabs value={selectedTeam} onValueChange={setSelectedTeam} className="w-full">
          <TabsList className="w-full flex flex-wrap gap-2 bg-slate-800/50 p-2 rounded-xl mb-8">
            {TEAMS.map((team) => (
              <TabsTrigger
                key={team.id}
                value={team.id}
                className="flex-1 min-w-[80px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-600 data-[state=active]:text-white text-slate-300 hover:text-white transition-all"
              >
                {team.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {TEAMS.map((team) => (
            <TabsContent key={team.id} value={team.id}>
              {/* Team Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {isRTL ? team.nameAr : team.name}
                  </h2>
                  <p className="text-slate-400">
                    {isRTL ? `الفئة العمرية: ${team.ageRange} سنة` : `Age Range: ${team.ageRange} years`}
                    {' • '}
                    {filteredPlayers.length} {isRTL ? 'لاعب' : 'players'}
                  </p>
                </div>
                <Badge className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-4 py-2 text-lg">
                  {team.name}
                </Badge>
              </div>

              {/* Players Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredPlayers.map((player) => (
                  <Card 
                    key={player.id} 
                    className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 hover:border-cyan-500/50 transition-all cursor-pointer group"
                    onClick={() => setSelectedPlayer(player)}
                  >
                    <CardContent className="p-6">
                      {/* Player Photo & Overall */}
                      <div className="relative mb-4">
                        <div className="w-24 h-24 mx-auto rounded-full overflow-hidden border-4 border-slate-600 group-hover:border-cyan-500 transition-all">
                          <img 
                            src={player.photo} 
                            alt={player.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-12 h-12 rounded-xl bg-gradient-to-br ${getOverallColor(player.overall)} flex items-center justify-center shadow-lg`}>
                          <span className="text-white font-bold text-lg">{player.overall}</span>
                        </div>
                      </div>

                      {/* Player Info */}
                      <div className="text-center mb-4">
                        <h3 className="text-lg font-bold text-white mb-1">
                          {isRTL ? player.name : player.nameEn}
                        </h3>
                        <Badge className={`${POSITION_COLORS[player.position]} text-white`}>
                          {isRTL ? player.positionAr : player.position}
                        </Badge>
                        <p className="text-slate-400 text-sm mt-2">
                          {isRTL ? `العمر: ${player.age} سنة` : `Age: ${player.age}`}
                        </p>
                      </div>

                      {/* TIPS Model Stats */}
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="text-center p-2 bg-slate-700/50 rounded-lg">
                          <Footprints className="h-4 w-4 mx-auto text-cyan-400 mb-1" />
                          <p className={`text-lg font-bold ${getTIPSColor(player.technique)}`}>{player.technique}</p>
                          <p className="text-xs text-slate-400">{isRTL ? 'تقنية' : 'Technique'}</p>
                        </div>
                        <div className="text-center p-2 bg-slate-700/50 rounded-lg">
                          <Brain className="h-4 w-4 mx-auto text-purple-400 mb-1" />
                          <p className={`text-lg font-bold ${getTIPSColor(player.insight)}`}>{player.insight}</p>
                          <p className="text-xs text-slate-400">{isRTL ? 'رؤية' : 'Insight'}</p>
                        </div>
                        <div className="text-center p-2 bg-slate-700/50 rounded-lg">
                          <Star className="h-4 w-4 mx-auto text-yellow-400 mb-1" />
                          <p className={`text-lg font-bold ${getTIPSColor(player.personality)}`}>{player.personality}</p>
                          <p className="text-xs text-slate-400">{isRTL ? 'شخصية' : 'Personality'}</p>
                        </div>
                        <div className="text-center p-2 bg-slate-700/50 rounded-lg">
                          <Zap className="h-4 w-4 mx-auto text-green-400 mb-1" />
                          <p className={`text-lg font-bold ${getTIPSColor(player.speed)}`}>{player.speed}</p>
                          <p className="text-xs text-slate-400">{isRTL ? 'سرعة' : 'Speed'}</p>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex justify-between text-center border-t border-slate-700 pt-3">
                        <div>
                          <p className="text-lg font-bold text-white">{player.goals}</p>
                          <p className="text-xs text-slate-400">{isRTL ? 'أهداف' : 'Goals'}</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-white">{player.assists}</p>
                          <p className="text-xs text-slate-400">{isRTL ? 'تمريرات' : 'Assists'}</p>
                        </div>
                        <div>
                          <p className="text-lg font-bold text-green-400">{player.attendance}%</p>
                          <p className="text-xs text-slate-400">{isRTL ? 'حضور' : 'Attendance'}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {filteredPlayers.length === 0 && (
                <div className="text-center py-16">
                  <Users className="h-16 w-16 mx-auto text-slate-600 mb-4" />
                  <h3 className="text-xl font-semibold text-slate-400">
                    {isRTL ? 'لا يوجد لاعبون في هذه الفئة' : 'No players in this category'}
                  </h3>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>

        {/* Player Detail Modal */}
        {selectedPlayer && (
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedPlayer(null)}
          >
            <Card 
              className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <CardHeader className="border-b border-slate-700">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center gap-3">
                    <img 
                      src={selectedPlayer.photo} 
                      alt={selectedPlayer.name}
                      className="w-16 h-16 rounded-full border-4 border-cyan-500"
                    />
                    <div>
                      <h2 className="text-2xl">{isRTL ? selectedPlayer.name : selectedPlayer.nameEn}</h2>
                      <p className="text-slate-400 text-sm font-normal">
                        {isRTL ? selectedPlayer.positionAr : selectedPlayer.position} • {selectedPlayer.age} {isRTL ? 'سنة' : 'years'}
                      </p>
                    </div>
                  </CardTitle>
                  <div className={`w-20 h-20 rounded-xl bg-gradient-to-br ${getOverallColor(selectedPlayer.overall)} flex items-center justify-center shadow-lg`}>
                    <span className="text-white font-bold text-3xl">{selectedPlayer.overall}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {/* TIPS Model Full */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Target className="h-5 w-5 text-cyan-400" />
                    {isRTL ? 'نموذج TIPS للتقييم' : 'TIPS Assessment Model'}
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-slate-300">{isRTL ? 'التقنية (Technique)' : 'Technique'}</span>
                        <span className={`font-bold ${getTIPSColor(selectedPlayer.technique)}`}>{selectedPlayer.technique}</span>
                      </div>
                      <Progress value={selectedPlayer.technique} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-slate-300">{isRTL ? 'الرؤية (Insight)' : 'Insight'}</span>
                        <span className={`font-bold ${getTIPSColor(selectedPlayer.insight)}`}>{selectedPlayer.insight}</span>
                      </div>
                      <Progress value={selectedPlayer.insight} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-slate-300">{isRTL ? 'الشخصية (Personality)' : 'Personality'}</span>
                        <span className={`font-bold ${getTIPSColor(selectedPlayer.personality)}`}>{selectedPlayer.personality}</span>
                      </div>
                      <Progress value={selectedPlayer.personality} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-slate-300">{isRTL ? 'السرعة (Speed)' : 'Speed'}</span>
                        <span className={`font-bold ${getTIPSColor(selectedPlayer.speed)}`}>{selectedPlayer.speed}</span>
                      </div>
                      <Progress value={selectedPlayer.speed} className="h-2" />
                    </div>
                  </div>
                </div>

                {/* Season Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-slate-700/50 rounded-xl">
                    <Trophy className="h-6 w-6 mx-auto text-yellow-400 mb-2" />
                    <p className="text-2xl font-bold text-white">{selectedPlayer.goals}</p>
                    <p className="text-sm text-slate-400">{isRTL ? 'أهداف هذا الموسم' : 'Season Goals'}</p>
                  </div>
                  <div className="text-center p-4 bg-slate-700/50 rounded-xl">
                    <Activity className="h-6 w-6 mx-auto text-cyan-400 mb-2" />
                    <p className="text-2xl font-bold text-white">{selectedPlayer.assists}</p>
                    <p className="text-sm text-slate-400">{isRTL ? 'تمريرات حاسمة' : 'Assists'}</p>
                  </div>
                  <div className="text-center p-4 bg-slate-700/50 rounded-xl">
                    <MapPin className="h-6 w-6 mx-auto text-green-400 mb-2" />
                    <p className="text-2xl font-bold text-green-400">{selectedPlayer.attendance}%</p>
                    <p className="text-sm text-slate-400">{isRTL ? 'نسبة الحضور' : 'Attendance'}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-4">
                  <Link href="/player-dashboard" className="flex-1">
                    <Button className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700">
                      {isRTL ? 'عرض الملف الكامل' : 'View Full Profile'}
                      <ChevronRight className={`h-4 w-4 ${isRTL ? 'rotate-180 mr-2' : 'ml-2'}`} />
                    </Button>
                  </Link>
                  <Link href="/video-analysis">
                    <Button variant="outline" className="border-slate-600 text-white hover:bg-slate-700">
                      {isRTL ? 'تحليل الفيديو' : 'Video Analysis'}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
