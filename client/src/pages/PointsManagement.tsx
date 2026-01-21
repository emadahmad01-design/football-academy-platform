import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Plus, Coins, Trophy, Star, Users, Search,
  TrendingUp, Gift, Award, ChevronLeft
} from 'lucide-react';
import { Link } from 'wouter';

export default function PointsManagement() {
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [pointsAmount, setPointsAmount] = useState('');
  const [reason, setReason] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data - replace with actual tRPC queries
  const players = [
    { id: '1', name: 'Omar Ahmed', team: 'U-12', points: 450, avatar: null },
    { id: '2', name: 'Youssef Khaled', team: 'U-10', points: 380, avatar: null },
    { id: '3', name: 'Ali Hassan', team: 'U-14', points: 520, avatar: null },
    { id: '4', name: 'Mohamed Tarek', team: 'U-12', points: 290, avatar: null },
    { id: '5', name: 'Adam Sherif', team: 'U-8', points: 180, avatar: null },
  ];

  const pointsReasons = [
    { value: 'attendance', label: isRTL ? 'حضور التدريب' : 'Training Attendance', points: 10 },
    { value: 'match_attendance', label: isRTL ? 'حضور المباراة' : 'Match Attendance', points: 20 },
    { value: 'goal', label: isRTL ? 'تسجيل هدف' : 'Goal Scored', points: 50 },
    { value: 'assist', label: isRTL ? 'صناعة هدف' : 'Assist', points: 30 },
    { value: 'motm', label: isRTL ? 'رجل المباراة' : 'Man of the Match', points: 100 },
    { value: 'improvement', label: isRTL ? 'تحسن ملحوظ' : 'Notable Improvement', points: 75 },
    { value: 'teamwork', label: isRTL ? 'روح الفريق' : 'Great Teamwork', points: 40 },
    { value: 'discipline', label: isRTL ? 'الانضباط' : 'Excellent Discipline', points: 25 },
    { value: 'talent_bonus', label: isRTL ? 'مكافأة الموهبة' : 'Talent Bonus', points: 150 },
    { value: 'custom', label: isRTL ? 'مخصص' : 'Custom', points: 0 },
  ];

  const recentTransactions = [
    { player: 'Omar Ahmed', reason: 'Goal Scored', points: 50, date: '2024-12-05' },
    { player: 'Youssef Khaled', reason: 'Training Attendance', points: 10, date: '2024-12-05' },
    { player: 'Ali Hassan', reason: 'Man of the Match', points: 100, date: '2024-12-04' },
    { player: 'Mohamed Tarek', reason: 'Assist', points: 30, date: '2024-12-04' },
  ];

  const filteredPlayers = players.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.team.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddPoints = () => {
    if (!selectedPlayer || !pointsAmount || !reason) {
      toast.error(isRTL ? 'يرجى ملء جميع الحقول' : 'Please fill all fields');
      return;
    }
    
    toast.success(
      isRTL 
        ? `تم إضافة ${pointsAmount} نقطة بنجاح` 
        : `Successfully added ${pointsAmount} points`
    );
    setShowAddDialog(false);
    setSelectedPlayer('');
    setPointsAmount('');
    setReason('');
  };

  const handleReasonChange = (value: string) => {
    setReason(value);
    const selectedReason = pointsReasons.find(r => r.value === value);
    if (selectedReason && selectedReason.points > 0) {
      setPointsAmount(selectedReason.points.toString());
    }
  };

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-950 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="icon">
                  <ChevronLeft className={`h-5 w-5 ${isRTL ? 'rotate-180' : ''}`} />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {isRTL ? 'إدارة النقاط' : 'Points Management'}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {isRTL ? 'أضف وأدر نقاط اللاعبين' : 'Add and manage player points'}
                </p>
              </div>
            </div>
            <Button onClick={() => setShowAddDialog(true)} className="bg-gold-500 hover:bg-gold-600 text-navy-900">
              <Plus className="h-4 w-4 mr-2" />
              {isRTL ? 'إضافة نقاط' : 'Add Points'}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-gold-500 to-gold-600 text-navy-900">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-80">{isRTL ? 'إجمالي النقاط' : 'Total Points'}</p>
                  <p className="text-3xl font-bold">1,820</p>
                </div>
                <Coins className="h-10 w-10 opacity-80" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-navy-800 to-navy-900 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-80">{isRTL ? 'اللاعبون' : 'Players'}</p>
                  <p className="text-3xl font-bold">{players.length}</p>
                </div>
                <Users className="h-10 w-10 opacity-80" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-80">{isRTL ? 'نقاط اليوم' : "Today's Points"}</p>
                  <p className="text-3xl font-bold">190</p>
                </div>
                <TrendingUp className="h-10 w-10 opacity-80" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-80">{isRTL ? 'المكافآت المستبدلة' : 'Rewards Redeemed'}</p>
                  <p className="text-3xl font-bold">12</p>
                </div>
                <Gift className="h-10 w-10 opacity-80" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Players List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    {isRTL ? 'اللاعبون' : 'Players'}
                  </CardTitle>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder={isRTL ? 'بحث...' : 'Search...'}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredPlayers.map((player, index) => (
                    <div 
                      key={player.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-navy-600 to-navy-800 flex items-center justify-center text-white font-bold">
                            {player.name.charAt(0)}
                          </div>
                          {index < 3 && (
                            <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                              index === 0 ? 'bg-gold-500 text-navy-900' :
                              index === 1 ? 'bg-gray-300 text-gray-700' :
                              'bg-amber-600 text-white'
                            }`}>
                              {index + 1}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">{player.name}</p>
                          <Badge variant="outline" className="text-xs">{player.team}</Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-2xl font-bold text-gold-500">{player.points}</p>
                          <p className="text-xs text-gray-500">{isRTL ? 'نقطة' : 'points'}</p>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedPlayer(player.id);
                            setShowAddDialog(true);
                          }}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Transactions */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  {isRTL ? 'آخر المعاملات' : 'Recent Transactions'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentTransactions.map((tx, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                      <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                        <Coins className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm text-gray-900 dark:text-white">{tx.player}</p>
                        <p className="text-xs text-gray-500">{tx.reason}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">+{tx.points}</p>
                        <p className="text-xs text-gray-400">{tx.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  {isRTL ? 'إجراءات سريعة' : 'Quick Actions'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" className="h-auto py-3 flex-col">
                    <Trophy className="h-5 w-5 mb-1 text-gold-500" />
                    <span className="text-xs">{isRTL ? 'مكافأة الفريق' : 'Team Bonus'}</span>
                  </Button>
                  <Button variant="outline" className="h-auto py-3 flex-col">
                    <Star className="h-5 w-5 mb-1 text-gold-500" />
                    <span className="text-xs">{isRTL ? 'نقاط الحضور' : 'Attendance'}</span>
                  </Button>
                  <Button variant="outline" className="h-auto py-3 flex-col">
                    <Gift className="h-5 w-5 mb-1 text-purple-500" />
                    <span className="text-xs">{isRTL ? 'المكافآت' : 'Rewards'}</span>
                  </Button>
                  <Button variant="outline" className="h-auto py-3 flex-col">
                    <Users className="h-5 w-5 mb-1 text-blue-500" />
                    <span className="text-xs">{isRTL ? 'نقاط جماعية' : 'Bulk Points'}</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Add Points Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-gold-500" />
              {isRTL ? 'إضافة نقاط' : 'Add Points'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{isRTL ? 'اللاعب' : 'Player'}</Label>
              <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
                <SelectTrigger>
                  <SelectValue placeholder={isRTL ? 'اختر لاعب' : 'Select player'} />
                </SelectTrigger>
                <SelectContent>
                  {players.map(player => (
                    <SelectItem key={player.id} value={player.id}>
                      {player.name} ({player.team})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{isRTL ? 'السبب' : 'Reason'}</Label>
              <Select value={reason} onValueChange={handleReasonChange}>
                <SelectTrigger>
                  <SelectValue placeholder={isRTL ? 'اختر السبب' : 'Select reason'} />
                </SelectTrigger>
                <SelectContent>
                  {pointsReasons.map(r => (
                    <SelectItem key={r.value} value={r.value}>
                      {r.label} {r.points > 0 && `(+${r.points})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{isRTL ? 'عدد النقاط' : 'Points Amount'}</Label>
              <Input
                type="number"
                value={pointsAmount}
                onChange={(e) => setPointsAmount(e.target.value)}
                placeholder="0"
                min="1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              {isRTL ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button onClick={handleAddPoints} className="bg-gold-500 hover:bg-gold-600 text-navy-900">
              <Plus className="h-4 w-4 mr-2" />
              {isRTL ? 'إضافة' : 'Add Points'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
