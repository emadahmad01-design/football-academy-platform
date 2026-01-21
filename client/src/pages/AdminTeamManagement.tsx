import { useState } from "react";
import { useAuth } from '@/_core/hooks/useAuth';
import { useLanguage } from "@/contexts/LanguageContext";
import DashboardLayout from "@/components/DashboardLayout";
import { DashboardLayoutSkeleton } from "@/components/DashboardLayoutSkeleton";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useLocation } from "wouter";
import {
  Plus,
  Users,
  Trophy,
  Shield,
  Edit,
  Trash2,
  UserPlus,
  Loader2,
  Search,
  Filter,
} from "lucide-react";

const AGE_GROUPS = ['U-9', 'U-10', 'U-11', 'U-12', 'U-13', 'U-14', 'U-15', 'U-16', 'U-17', 'U-18', 'U-19', 'U-21', 'Senior'];

export default function AdminTeamManagement() {
  const { user, loading: authLoading } = useAuth();
  const { language } = useLanguage();
  const [, setLocation] = useLocation();
  const isRTL = language === 'ar';

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [teamTypeFilter, setTeamTypeFilter] = useState<string>("all");
  const [selectedPlayers, setSelectedPlayers] = useState<number[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    ageGroup: '',
    teamType: 'academy' as 'main' | 'academy',
    description: '',
  });

  const utils = trpc.useUtils();
  const { data: teams, isLoading: teamsLoading } = trpc.teams.getAll.useQuery();
  const { data: players } = trpc.players.getAll.useQuery();

  const createTeam = trpc.teams.create.useMutation({
    onSuccess: () => {
      toast.success(isRTL ? 'تم إنشاء الفريق بنجاح' : 'Team created successfully');
      utils.teams.getAll.invalidate();
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updatePlayerTeam = trpc.players.updateTeam.useMutation({
    onSuccess: () => {
      toast.success(isRTL ? 'تم تحديث الفريق بنجاح' : 'Team assignment updated');
      utils.teams.getAll.invalidate();
      utils.players.getAll.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const resetForm = () => {
    setFormData({ name: '', ageGroup: '', teamType: 'academy', description: '' });
  };

  const handleCreateTeam = () => {
    if (!formData.name || !formData.ageGroup) {
      toast.error(isRTL ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill all required fields');
      return;
    }
    createTeam.mutate(formData);
  };

  const handleAssignPlayers = () => {
    if (!selectedTeam || selectedPlayers.length === 0) return;
    selectedPlayers.forEach(playerId => {
      updatePlayerTeam.mutate({ playerId, teamId: selectedTeam.id });
    });
    setIsAssignDialogOpen(false);
    setSelectedPlayers([]);
    setSelectedTeam(null);
  };

  const openAssignDialog = (team: any) => {
    setSelectedTeam(team);
    const teamPlayers = players?.filter(p => p.teamId === team.id).map(p => p.id) || [];
    setSelectedPlayers(teamPlayers);
    setIsAssignDialogOpen(true);
  };

  const togglePlayerSelection = (playerId: number) => {
    setSelectedPlayers(prev => 
      prev.includes(playerId) ? prev.filter(id => id !== playerId) : [...prev, playerId]
    );
  };

  const filteredTeams = teams?.filter(team => {
    const matchesSearch = team.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = teamTypeFilter === 'all' || team.teamType === teamTypeFilter;
    return matchesSearch && matchesType;
  });

  const getTeamPlayers = (teamId: number) => players?.filter(p => p.teamId === teamId) || [];

  const totalTeams = teams?.length || 0;
  const mainTeams = teams?.filter(t => t.teamType === 'main').length || 0;
  const academyTeams = teams?.filter(t => t.teamType === 'academy').length || 0;
  const assignedPlayers = players?.filter(p => p.teamId).length || 0;
  const totalPlayers = players?.length || 0;

  if (authLoading) return <DashboardLayoutSkeleton />;
  if (!user || user.role !== 'admin') { setLocation('/dashboard'); return null; }

  return (
    <DashboardLayout>
      <div className={`container mx-auto p-6 \${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Users className="w-8 h-8" />
              {isRTL ? 'إدارة الفرق' : 'Team Management'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isRTL ? 'إنشاء الفرق وتعيين اللاعبين' : 'Create teams and assign players'}
            </p>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            {isRTL ? 'إنشاء فريق جديد' : 'Create New Team'}
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card><CardContent className="p-4 flex items-center gap-3"><Users className="w-8 h-8 text-primary" /><div><p className="text-2xl font-bold">{totalTeams}</p><p className="text-sm text-muted-foreground">{isRTL ? 'إجمالي الفرق' : 'Total Teams'}</p></div></CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3"><Trophy className="w-8 h-8 text-yellow-500" /><div><p className="text-2xl font-bold">{mainTeams}</p><p className="text-sm text-muted-foreground">{isRTL ? 'الفرق الرئيسية' : 'Main Teams'}</p></div></CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3"><Shield className="w-8 h-8 text-blue-500" /><div><p className="text-2xl font-bold">{academyTeams}</p><p className="text-sm text-muted-foreground">{isRTL ? 'فرق الأكاديمية' : 'Academy Teams'}</p></div></CardContent></Card>
          <Card><CardContent className="p-4 flex items-center gap-3"><UserPlus className="w-8 h-8 text-green-500" /><div><p className="text-2xl font-bold">{assignedPlayers}/{totalPlayers}</p><p className="text-sm text-muted-foreground">{isRTL ? 'اللاعبون المعينون' : 'Assigned Players'}</p></div></CardContent></Card>
        </div>

        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder={isRTL ? 'بحث عن فريق...' : 'Search teams...'} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
              </div>
              <Select value={teamTypeFilter} onValueChange={setTeamTypeFilter}>
                <SelectTrigger className="w-full md:w-48"><Filter className="w-4 h-4 mr-2" /><SelectValue placeholder={isRTL ? 'نوع الفريق' : 'Team Type'} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isRTL ? 'جميع الفرق' : 'All Teams'}</SelectItem>
                  <SelectItem value="main">{isRTL ? 'الفريق الرئيسي' : 'Main Team'}</SelectItem>
                  <SelectItem value="academy">{isRTL ? 'فريق الأكاديمية' : 'Academy Team'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {teamsLoading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin" /></div>
        ) : filteredTeams && filteredTeams.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredTeams.map((team) => {
              const teamPlayers = getTeamPlayers(team.id);
              return (
                <Card key={team.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {team.teamType === 'main' ? <Trophy className="w-5 h-5 text-yellow-500" /> : <Shield className="w-5 h-5 text-blue-500" />}
                        <CardTitle className="text-lg">{team.name}</CardTitle>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => openAssignDialog(team)} className="gap-1">
                        <UserPlus className="w-4 h-4" />{isRTL ? 'تعيين لاعبين' : 'Assign Players'}
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary">{team.ageGroup}</Badge>
                      <Badge variant={team.teamType === 'main' ? 'default' : 'outline'}>{team.teamType === 'main' ? (isRTL ? 'رئيسي' : 'Main') : (isRTL ? 'أكاديمية' : 'Academy')}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {team.description && <p className="text-sm text-muted-foreground mb-3">{team.description}</p>}
                    <div className="flex items-center gap-2 text-sm"><Users className="w-4 h-4" /><span className="font-medium">{isRTL ? 'اللاعبون' : 'Players'} ({teamPlayers.length})</span></div>
                    {teamPlayers.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {teamPlayers.slice(0, 5).map((player) => (<Badge key={player.id} variant="secondary" className="text-xs">{player.firstName} {player.lastName}</Badge>))}
                        {teamPlayers.length > 5 && <Badge variant="secondary" className="text-xs">+{teamPlayers.length - 5}</Badge>}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card><CardContent className="p-12 text-center"><Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" /><h3 className="text-lg font-semibold mb-2">{isRTL ? 'لا توجد فرق' : 'No Teams Found'}</h3><p className="text-muted-foreground mb-4">{isRTL ? 'ابدأ بإنشاء فريق جديد' : 'Start by creating a new team'}</p><Button onClick={() => setIsCreateDialogOpen(true)}><Plus className="w-4 h-4 mr-2" />{isRTL ? 'إنشاء فريق' : 'Create Team'}</Button></CardContent></Card>
        )}

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle className="flex items-center gap-2"><Plus className="w-5 h-5" />{isRTL ? 'إنشاء فريق جديد' : 'Create New Team'}</DialogTitle><DialogDescription>{isRTL ? 'أدخل تفاصيل الفريق الجديد' : 'Enter the details for the new team'}</DialogDescription></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2"><Label>{isRTL ? 'اسم الفريق' : 'Team Name'} *</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder={isRTL ? 'مثال: فريق الشباب U14' : 'e.g., U14 Youth Team'} /></div>
              <div className="space-y-2"><Label>{isRTL ? 'الفئة العمرية' : 'Age Group'}</Label><Select value={formData.ageGroup} onValueChange={(v) => setFormData({ ...formData, ageGroup: v })}><SelectTrigger><SelectValue placeholder={isRTL ? 'اختر الفئة العمرية' : 'Select age group'} /></SelectTrigger><SelectContent>{AGE_GROUPS.map((age) => (<SelectItem key={age} value={age}>{age}</SelectItem>))}</SelectContent></Select></div>
              <div className="space-y-2"><Label>{isRTL ? 'نوع الفريق' : 'Team Type'}</Label><Select value={formData.teamType} onValueChange={(v) => setFormData({ ...formData, teamType: v as 'main' | 'academy' })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="academy"><div className="flex items-center gap-2"><Shield className="w-4 h-4 text-blue-500" />{isRTL ? 'فريق الأكاديمية' : 'Academy Team'}</div></SelectItem><SelectItem value="main"><div className="flex items-center gap-2"><Trophy className="w-4 h-4 text-yellow-500" />{isRTL ? 'الفريق الرئيسي' : 'Main Team'}</div></SelectItem></SelectContent></Select></div>
              <div className="space-y-2"><Label>{isRTL ? 'الوصف' : 'Description'}</Label><Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder={isRTL ? 'وصف اختياري للفريق...' : 'Optional team description...'} rows={3} /></div>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>{isRTL ? 'إلغاء' : 'Cancel'}</Button><Button onClick={handleCreateTeam} disabled={createTeam.isPending}>{createTeam.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}{isRTL ? 'إنشاء' : 'Create'}</Button></DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="flex items-center gap-2"><UserPlus className="w-5 h-5" />{isRTL ? 'تعيين لاعبين إلى' : 'Assign Players to'} {selectedTeam?.name}</DialogTitle><DialogDescription>{isRTL ? 'اختر اللاعبين لتعيينهم لهذا الفريق' : 'Select players to assign to this team'}</DialogDescription></DialogHeader>
            <div className="py-4">
              <div className="grid gap-2 max-h-96 overflow-y-auto">
                {players?.map((player) => (
                  <div key={player.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors \${selectedPlayers.includes(player.id) ? 'bg-primary/10 border-primary' : 'hover:bg-muted'}`} onClick={() => togglePlayerSelection(player.id)}>
                    <Checkbox checked={selectedPlayers.includes(player.id)} onCheckedChange={() => togglePlayerSelection(player.id)} />
                    <div className="flex-1"><p className="font-medium">{player.firstName} {player.lastName}</p><p className="text-sm text-muted-foreground">{player.position} • {player.dateOfBirth ? new Date().getFullYear() - new Date(player.dateOfBirth).getFullYear() : '-'} {isRTL ? 'سنة' : 'years'}</p></div>
                    {player.teamId && player.teamId !== selectedTeam?.id && <Badge variant="secondary" className="text-xs">{teams?.find(t => t.id === player.teamId)?.name || 'Other Team'}</Badge>}
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-4">{selectedPlayers.length} {isRTL ? 'لاعب محدد' : 'player(s) selected'}</p>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>{isRTL ? 'إلغاء' : 'Cancel'}</Button><Button onClick={handleAssignPlayers} disabled={updatePlayerTeam.isPending}>{updatePlayerTeam.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}{isRTL ? 'تعيين' : 'Assign'}</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
