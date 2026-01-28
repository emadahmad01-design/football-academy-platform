import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { useParentChild } from "@/contexts/ParentChildContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { trpc } from "@/lib/trpc";
import { useState, useEffect, useMemo } from "react";
import { Plus, Activity, Zap, Target, TrendingUp, Footprints, Timer, Star, Brain, Shield, FileDown, Save, CheckCircle, History, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { exportSkillAssessmentPDF } from "@/lib/pdfExport";

interface SkillScore {
  name: string;
  key: string;
  value: number;
  icon: React.ElementType;
  color: string;
  description: string;
}

const SKILLS: SkillScore[] = [
  { name: "Ball Control", key: "ballControl", value: 50, icon: Target, color: "bg-blue-500", description: "First touch, receiving, trapping" },
  { name: "Passing", key: "passing", value: 50, icon: Zap, color: "bg-green-500", description: "Short, long, through balls" },
  { name: "Shooting", key: "shooting", value: 50, icon: Target, color: "bg-red-500", description: "Power, accuracy, finishing" },
  { name: "Dribbling", key: "dribbling", value: 50, icon: Activity, color: "bg-purple-500", description: "Close control, 1v1, skill moves" },
  { name: "Speed", key: "speed", value: 50, icon: Zap, color: "bg-yellow-500", description: "Acceleration, top speed, agility" },
  { name: "Stamina", key: "stamina", value: 50, icon: Activity, color: "bg-orange-500", description: "Endurance, recovery, work rate" },
  { name: "Defending", key: "defending", value: 50, icon: Shield, color: "bg-slate-500", description: "Tackling, positioning, marking" },
  { name: "Tactical Awareness", key: "tactical", value: 50, icon: Brain, color: "bg-indigo-500", description: "Positioning, decision making, game reading" },
];

function MetricCard({ 
  label, 
  value, 
  unit, 
  icon: Icon, 
  trend,
  color = "primary" 
}: { 
  label: string; 
  value: number | string; 
  unit?: string;
  icon: React.ElementType;
  trend?: number;
  color?: string;
}) {
  return (
    <div className="p-4 rounded-xl bg-muted/50 border border-border">
      <div className="flex items-center justify-between mb-2">
        <Icon className={`h-5 w-5 text-${color}`} />
        {trend !== undefined && (
          <span className={`text-xs ${trend >= 0 ? 'text-primary' : 'text-destructive'}`}>
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <div className="text-2xl font-bold">
        {value}
        {unit && <span className="text-sm font-normal text-muted-foreground ml-1">{unit}</span>}
      </div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function RecordPerformanceDialog({ preselectedPlayerId }: { preselectedPlayerId?: string }) {
  const [open, setOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [formData, setFormData] = useState({
    sessionDate: new Date().toISOString().split('T')[0],
    sessionType: 'training' as const,
    touches: '',
    passes: '',
    passAccuracy: '',
    shots: '',
    shotsOnTarget: '',
    dribbles: '',
    successfulDribbles: '',
    distanceCovered: '',
    topSpeed: '',
    sprints: '',
    accelerations: '',
    decelerations: '',
    possessionWon: '',
    possessionLost: '',
    interceptions: '',
    tackles: '',
    technicalScore: '',
    physicalScore: '',
    tacticalScore: '',
    mentalScore: '',
    overallScore: '',
    notes: '',
  });

  const { data: players } = trpc.players.getAll.useQuery();
  const utils = trpc.useUtils();
  
  const createMetric = trpc.performance.create.useMutation({
    onSuccess: () => {
      toast.success('Performance recorded successfully');
      setOpen(false);
      utils.performance.getPlayerMetrics.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to record performance');
    },
  });

  useEffect(() => {
    if (open && preselectedPlayerId) {
      setSelectedPlayer(preselectedPlayerId);
    }
  }, [open, preselectedPlayerId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlayer) {
      toast.error('Please select a player');
      return;
    }
    createMetric.mutate({
      playerId: parseInt(selectedPlayer),
      ...formData,
      touches: formData.touches ? parseInt(formData.touches) : undefined,
      passes: formData.passes ? parseInt(formData.passes) : undefined,
      passAccuracy: formData.passAccuracy ? parseInt(formData.passAccuracy) : undefined,
      shots: formData.shots ? parseInt(formData.shots) : undefined,
      shotsOnTarget: formData.shotsOnTarget ? parseInt(formData.shotsOnTarget) : undefined,
      dribbles: formData.dribbles ? parseInt(formData.dribbles) : undefined,
      successfulDribbles: formData.successfulDribbles ? parseInt(formData.successfulDribbles) : undefined,
      distanceCovered: formData.distanceCovered ? parseFloat(formData.distanceCovered) : undefined,
      topSpeed: formData.topSpeed ? parseFloat(formData.topSpeed) : undefined,
      sprints: formData.sprints ? parseInt(formData.sprints) : undefined,
      accelerations: formData.accelerations ? parseInt(formData.accelerations) : undefined,
      decelerations: formData.decelerations ? parseInt(formData.decelerations) : undefined,
      possessionWon: formData.possessionWon ? parseInt(formData.possessionWon) : undefined,
      possessionLost: formData.possessionLost ? parseInt(formData.possessionLost) : undefined,
      interceptions: formData.interceptions ? parseInt(formData.interceptions) : undefined,
      tackles: formData.tackles ? parseInt(formData.tackles) : undefined,
      technicalScore: formData.technicalScore ? parseInt(formData.technicalScore) : undefined,
      physicalScore: formData.physicalScore ? parseInt(formData.physicalScore) : undefined,
      tacticalScore: formData.tacticalScore ? parseInt(formData.tacticalScore) : undefined,
      mentalScore: formData.mentalScore ? parseInt(formData.mentalScore) : undefined,
      overallScore: formData.overallScore ? parseInt(formData.overallScore) : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gradient-primary text-primary-foreground">
          <Plus className="h-4 w-4 mr-2" />
          Record Performance
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Record Performance Metrics</DialogTitle>
          <DialogDescription>
            Enter performance data from training or match sessions.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Player</Label>
                <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select player" />
                  </SelectTrigger>
                  <SelectContent className="z-[10001]">
                    {players?.map((player: any) => (
                      <SelectItem key={player.id} value={player.id.toString()}>
                        {player.firstName} {player.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Session Type</Label>
                <Select
                  value={formData.sessionType}
                  onValueChange={(value: any) => setFormData({ ...formData, sessionType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[10001]">
                    <SelectItem value="training">Training</SelectItem>
                    <SelectItem value="match">Match</SelectItem>
                    <SelectItem value="assessment">Assessment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Session Date</Label>
              <Input
                type="date"
                value={formData.sessionDate}
                onChange={(e) => setFormData({ ...formData, sessionDate: e.target.value })}
              />
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Technical Metrics</h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Touches</Label>
                  <Input
                    type="number"
                    value={formData.touches}
                    onChange={(e) => setFormData({ ...formData, touches: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Passes</Label>
                  <Input
                    type="number"
                    value={formData.passes}
                    onChange={(e) => setFormData({ ...formData, passes: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Pass Accuracy %</Label>
                  <Input
                    type="number"
                    value={formData.passAccuracy}
                    onChange={(e) => setFormData({ ...formData, passAccuracy: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Shots</Label>
                  <Input
                    type="number"
                    value={formData.shots}
                    onChange={(e) => setFormData({ ...formData, shots: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Shots on Target</Label>
                  <Input
                    type="number"
                    value={formData.shotsOnTarget}
                    onChange={(e) => setFormData({ ...formData, shotsOnTarget: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Dribbles</Label>
                  <Input
                    type="number"
                    value={formData.dribbles}
                    onChange={(e) => setFormData({ ...formData, dribbles: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Successful Dribbles</Label>
                  <Input
                    type="number"
                    value={formData.successfulDribbles}
                    onChange={(e) => setFormData({ ...formData, successfulDribbles: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Physical Metrics</h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Distance (km)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.distanceCovered}
                    onChange={(e) => setFormData({ ...formData, distanceCovered: e.target.value })}
                    placeholder="0.0"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Top Speed (km/h)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.topSpeed}
                    onChange={(e) => setFormData({ ...formData, topSpeed: e.target.value })}
                    placeholder="0.0"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Sprints</Label>
                  <Input
                    type="number"
                    value={formData.sprints}
                    onChange={(e) => setFormData({ ...formData, sprints: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Accelerations</Label>
                  <Input
                    type="number"
                    value={formData.accelerations}
                    onChange={(e) => setFormData({ ...formData, accelerations: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Decelerations</Label>
                  <Input
                    type="number"
                    value={formData.decelerations}
                    onChange={(e) => setFormData({ ...formData, decelerations: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Possession & Defensive</h4>
              <div className="grid grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Possession Won</Label>
                  <Input
                    type="number"
                    value={formData.possessionWon}
                    onChange={(e) => setFormData({ ...formData, possessionWon: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Possession Lost</Label>
                  <Input
                    type="number"
                    value={formData.possessionLost}
                    onChange={(e) => setFormData({ ...formData, possessionLost: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Interceptions</Label>
                  <Input
                    type="number"
                    value={formData.interceptions}
                    onChange={(e) => setFormData({ ...formData, interceptions: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Tackles</Label>
                  <Input
                    type="number"
                    value={formData.tackles}
                    onChange={(e) => setFormData({ ...formData, tackles: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Overall Scores (0-100)</h4>
              <div className="grid grid-cols-5 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Technical</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.technicalScore}
                    onChange={(e) => setFormData({ ...formData, technicalScore: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Physical</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.physicalScore}
                    onChange={(e) => setFormData({ ...formData, physicalScore: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Tactical</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.tacticalScore}
                    onChange={(e) => setFormData({ ...formData, tacticalScore: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Mental</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.mentalScore}
                    onChange={(e) => setFormData({ ...formData, mentalScore: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Overall</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.overallScore}
                    onChange={(e) => setFormData({ ...formData, overallScore: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Input
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional observations..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMetric.isPending}>
              {createMetric.isPending ? 'Saving...' : 'Save Performance'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Performance() {
  const { user } = useAuth();
  const { selectedChildId } = useParentChild();
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [viewMode, setViewMode] = useState<'player' | 'team'>('player');
  
  // For parents, get their linked children; for staff, get all players
  const { data: players } = user?.role === 'parent' 
    ? trpc.parentRelations.getLinkedPlayers.useQuery()
    : trpc.players.getAll.useQuery();
  
  const { data: teams } = trpc.teams.getAll.useQuery();
  
  // Filter players by selected team
  const filteredPlayers = useMemo(() => {
    if (!players) return [];
    if (!selectedTeam) return [];
    const filtered = players.filter(p => p.teamId === parseInt(selectedTeam));
    console.log('[Performance] Filtering players:', {
      selectedTeam,
      totalPlayers: players.length,
      filteredCount: filtered.length,
      samplePlayer: filtered[0]
    });
    return filtered;
  }, [players, selectedTeam]);
  
  // Reset player selection when team changes
  useEffect(() => {
    setSelectedPlayer('');
  }, [selectedTeam]);
  
  // Auto-select child for parents
  useEffect(() => {
    if (user?.role === 'parent' && selectedChildId && !selectedPlayer) {
      setSelectedPlayer(selectedChildId);
    }
  }, [user, selectedChildId, selectedPlayer]);
  
  const { data: metrics } = trpc.performance.getPlayerMetrics.useQuery(
    { playerId: parseInt(selectedPlayer), limit: 10 },
    { enabled: !!selectedPlayer && viewMode === 'player' }
  );
  
  const { data: teamAverages } = trpc.performance.getTeamAverages.useQuery(
    { teamId: parseInt(selectedTeam) },
    { enabled: !!selectedTeam && viewMode === 'team' }
  );

  const [selectedMetricId, setSelectedMetricId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'performance' | 'skills'>('performance');
  
  // Skill Assessment State
  const [skills, setSkills] = useState<SkillScore[]>(SKILLS.map(s => ({ ...s })));
  const [skillNotes, setSkillNotes] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Save skill scores mutation
  const saveSkillsMutation = trpc.skillScores.create.useMutation({
    onSuccess: () => {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      toast.success('Skill assessment saved successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to save skill assessment');
    },
  });

  // Get player's skill history
  const { data: skillHistory } = trpc.skillScores.getHistory.useQuery(
    { playerId: parseInt(selectedPlayer) },
    { enabled: !!selectedPlayer }
  );

  const updateSkill = (key: string, value: number) => {
    setSkills(prev => prev.map(s => s.key === key ? { ...s, value } : s));
  };

  const handleSaveSkills = () => {
    if (!selectedPlayer) return;

    saveSkillsMutation.mutate({
      playerId: parseInt(selectedPlayer),
      assessmentDate: new Date().toISOString().split('T')[0],
      ballControl: skills.find(s => s.key === 'ballControl')?.value,
      passing: skills.find(s => s.key === 'passing')?.value,
      shooting: skills.find(s => s.key === 'shooting')?.value,
      dribbling: skills.find(s => s.key === 'dribbling')?.value,
      speed: skills.find(s => s.key === 'speed')?.value,
      stamina: skills.find(s => s.key === 'stamina')?.value,
      tackling: skills.find(s => s.key === 'defending')?.value,
      positioning: skills.find(s => s.key === 'tactical')?.value,
      notes: skillNotes || undefined,
    });
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return { label: "Elite", color: "text-purple-500" };
    if (score >= 80) return { label: "Excellent", color: "text-green-500" };
    if (score >= 70) return { label: "Good", color: "text-blue-500" };
    if (score >= 60) return { label: "Average", color: "text-yellow-500" };
    if (score >= 50) return { label: "Developing", color: "text-orange-500" };
    return { label: "Needs Work", color: "text-red-500" };
  };

  const averageSkillScore = Math.round(skills.reduce((sum, s) => sum + s.value, 0) / skills.length);

  // Reset selected metric when player changes
  useEffect(() => {
    setSelectedMetricId(null);
  }, [selectedPlayer]);

  useEffect(() => {
    if (metrics && metrics.length > 0 && selectedMetricId === null) {
      setSelectedMetricId(metrics[0].id);
    } else if (metrics && metrics.length > 0 && !metrics.find(m => m.id === selectedMetricId)) {
        // If selected ID is no longer in the list (e.g. switched player), reset to first
        setSelectedMetricId(metrics[0].id);
    } else if (!metrics || metrics.length === 0) {
        setSelectedMetricId(null);
    }
  }, [metrics, selectedMetricId]);

  const currentMetric = viewMode === 'team' ? teamAverages : (metrics?.find(m => m.id === selectedMetricId) || metrics?.[0]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Performance Tracking</h1>
            <p className="text-muted-foreground">
              Monitor and analyze player performance metrics
            </p>
          </div>
          <RecordPerformanceDialog preselectedPlayerId={selectedPlayer} />
        </div>

        {/* Team/Player Selection */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'player' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('player')}
                >
                  Player
                </Button>
                <Button
                  variant={viewMode === 'team' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('team')}
                >
                  Team Average
                </Button>
              </div>
              
              {viewMode === 'player' ? (
                <>
                  <div className="flex items-center gap-4">
                    <Label className="whitespace-nowrap">Select Team:</Label>
                    <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                      <SelectTrigger className="max-w-xs">
                        <SelectValue placeholder="Choose a team first" />
                      </SelectTrigger>
                      <SelectContent>
                        {teams?.map((team: any) => (
                          <SelectItem key={team.id} value={team.id.toString()}>
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-4">
                    <Label className="whitespace-nowrap">Select Player:</Label>
                    <Select 
                      value={selectedPlayer} 
                      onValueChange={setSelectedPlayer}
                      disabled={!selectedTeam}
                    >
                      <SelectTrigger className="max-w-xs">
                        <SelectValue placeholder={selectedTeam ? "Choose a player" : "Select team first"} />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredPlayers?.map((player: any) => (
                          <SelectItem key={player.id} value={player.id.toString()}>
                            {player.firstName} {player.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-4">
                  <Label className="whitespace-nowrap">Select Team:</Label>
                  <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                    <SelectTrigger className="max-w-xs">
                      <SelectValue placeholder="Choose a team to view" />
                    </SelectTrigger>
                    <SelectContent>
                      {teams?.map((team: any) => (
                        <SelectItem key={team.id} value={team.id.toString()}>
                          {team.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {((viewMode === 'player' && selectedPlayer) || (viewMode === 'team' && selectedTeam)) && currentMetric ? (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-6">
            <TabsList>
              <TabsTrigger value="performance">Session Performance</TabsTrigger>
              <TabsTrigger value="skills">Skill Assessment</TabsTrigger>
            </TabsList>

            <TabsContent value="performance" className="space-y-6">
              <Tabs defaultValue="overview" className="space-y-6">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="technical">Technical</TabsTrigger>
                  <TabsTrigger value="physical">Physical</TabsTrigger>
                  <TabsTrigger value="history">History</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
              {/* Score Cards */}
              <div className="grid gap-4 md:grid-cols-4">
                <Card className="stat-glow">
                  <CardContent className="p-6 text-center">
                    <div className="text-5xl font-bold text-primary mb-2">
                      {currentMetric.overallScore || '--'}
                    </div>
                    <div className="text-sm text-muted-foreground">Overall Score</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="text-4xl font-bold text-chart-1 mb-2">
                      {currentMetric.technicalScore || '--'}
                    </div>
                    <div className="text-sm text-muted-foreground">Technical</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="text-4xl font-bold text-chart-2 mb-2">
                      {currentMetric.physicalScore || '--'}
                    </div>
                    <div className="text-sm text-muted-foreground">Physical</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="text-4xl font-bold text-chart-3 mb-2">
                      {currentMetric.tacticalScore || '--'}
                    </div>
                    <div className="text-sm text-muted-foreground">Tactical</div>
                  </CardContent>
                </Card>
              </div>

              {/* Latest Session Info */}
              <Card>
                <CardHeader>
                  <CardTitle>{viewMode === 'team' ? 'Team Average Metrics' : 'Session Details'}</CardTitle>
                  <CardDescription>
                    {viewMode === 'team' ? 'Average performance across all team players' : `${currentMetric.sessionType} on ${new Date(currentMetric.sessionDate).toLocaleDateString()}`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
                    <MetricCard
                      label="Touches"
                      value={currentMetric.touches || 0}
                      icon={Footprints}
                      color="primary"
                    />
                    <MetricCard
                      label="Passes"
                      value={currentMetric.passes || 0}
                      icon={Activity}
                      color="chart-2"
                    />
                    <MetricCard
                      label="Pass Accuracy"
                      value={currentMetric.passAccuracy || 0}
                      unit="%"
                      icon={Target}
                      color="chart-3"
                    />
                    <MetricCard
                      label="Distance"
                      value={currentMetric.distanceCovered || 0}
                      unit="km"
                      icon={TrendingUp}
                      color="chart-4"
                    />
                    <MetricCard
                      label="Top Speed"
                      value={currentMetric.topSpeed || 0}
                      unit="km/h"
                      icon={Zap}
                      color="accent"
                    />
                    <MetricCard
                      label="Sprints"
                      value={currentMetric.sprints || 0}
                      icon={Timer}
                      color="primary"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="technical" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Technical Metrics</CardTitle>
                  <CardDescription>Ball control, passing, and shooting analysis</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                      <h4 className="font-medium">Ball Control</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Touches</span>
                          <span className="font-medium">{currentMetric.touches || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Dribbles Attempted</span>
                          <span className="font-medium">{currentMetric.dribbles || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Successful Dribbles</span>
                          <span className="font-medium">{currentMetric.successfulDribbles || 0}</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h4 className="font-medium">Passing</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Total Passes</span>
                          <span className="font-medium">{currentMetric.passes || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Pass Accuracy</span>
                          <span className="font-medium">{currentMetric.passAccuracy || 0}%</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h4 className="font-medium">Shooting</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Shots</span>
                          <span className="font-medium">{currentMetric.shots || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Shots on Target</span>
                          <span className="font-medium">{currentMetric.shotsOnTarget || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Shot Accuracy</span>
                          <span className="font-medium">
                            {currentMetric.shots ? Math.round((currentMetric.shotsOnTarget || 0) / currentMetric.shots * 100) : 0}%
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h4 className="font-medium">Defensive</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Interceptions</span>
                          <span className="font-medium">{currentMetric.interceptions || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Tackles</span>
                          <span className="font-medium">{currentMetric.tackles || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="physical" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Physical Metrics</CardTitle>
                  <CardDescription>Movement, speed, and endurance data</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <MetricCard
                      label="Distance Covered"
                      value={currentMetric.distanceCovered || 0}
                      unit="km"
                      icon={TrendingUp}
                      color="primary"
                    />
                    <MetricCard
                      label="Top Speed"
                      value={currentMetric.topSpeed || 0}
                      unit="km/h"
                      icon={Zap}
                      color="chart-2"
                    />
                    <MetricCard
                      label="Sprints"
                      value={currentMetric.sprints || 0}
                      icon={Timer}
                      color="chart-3"
                    />
                    <MetricCard
                      label="Accelerations"
                      value={currentMetric.accelerations || 0}
                      icon={Activity}
                      color="chart-4"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Performance History</CardTitle>
                  <CardDescription>Recent session records</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {metrics?.map((metric, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedMetricId(metric.id)}
                        className={`w-full flex items-center gap-4 p-4 rounded-lg transition-colors text-left ${
                          metric.id === selectedMetricId ? 'bg-primary/20 ring-2 ring-primary' : 'bg-muted/50 hover:bg-muted'
                        }`}
                      >
                        <div className="text-center min-w-[80px]">
                          <div className="text-2xl font-bold text-primary">{metric.overallScore || '--'}</div>
                          <div className="text-xs text-muted-foreground">Overall</div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium capitalize">{metric.sessionType}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(metric.sessionDate).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex gap-4 text-sm text-muted-foreground">
                            <span>Tech: {metric.technicalScore || '--'}</span>
                            <span>Phys: {metric.physicalScore || '--'}</span>
                            <span>Tact: {metric.tacticalScore || '--'}</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
              </Tabs>
            </TabsContent>

            {/* Skill Assessment Tab */}
            <TabsContent value="skills" className="space-y-6">
              {selectedPlayer && players ? (
                <>
                  {/* Header with Export and Save */}
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      onClick={() => {
                        const player = players.find((p: any) => p.id.toString() === selectedPlayer);
                        if (!player) return;
                        exportSkillAssessmentPDF({
                          playerName: `${player.firstName} ${player.lastName}`,
                          date: new Date().toISOString().split('T')[0],
                          skills: skills.map(s => ({ name: s.name, value: s.value })),
                          overallRating: averageSkillScore,
                          coachNotes: skillNotes || undefined,
                        });
                      }}
                      variant="outline"
                    >
                      <FileDown className="w-4 h-4 mr-2" />
                      Export PDF
                    </Button>
                    <Button
                      onClick={handleSaveSkills}
                      disabled={saveSkillsMutation.isPending}
                    >
                      {saveSkillsMutation.isPending ? (
                        <>Saving...</>
                      ) : saveSuccess ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Saved!
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save Assessment
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Skill Sliders */}
                    <div className="lg:col-span-2">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Star className="w-5 h-5" />
                            Skill Ratings
                          </CardTitle>
                          <CardDescription>
                            Drag sliders to rate each skill from 0-100
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          {skills.map((skill) => {
                            const scoreInfo = getScoreLabel(skill.value);
                            return (
                              <div key={skill.key} className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div className={`p-2 rounded-lg ${skill.color}`}>
                                      <skill.icon className="w-4 h-4 text-white" />
                                    </div>
                                    <div>
                                      <span className="font-medium">{skill.name}</span>
                                      <p className="text-xs text-muted-foreground">{skill.description}</p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-2xl font-bold">{skill.value}</span>
                                    <span className={`block text-xs ${scoreInfo.color}`}>{scoreInfo.label}</span>
                                  </div>
                                </div>
                                <Slider
                                  value={[skill.value]}
                                  onValueChange={([v]) => updateSkill(skill.key, v)}
                                  max={100}
                                  step={1}
                                  className="w-full"
                                />
                                <div className="flex justify-between text-xs text-muted-foreground">
                                  <span>0</span>
                                  <span>25</span>
                                  <span>50</span>
                                  <span>75</span>
                                  <span>100</span>
                                </div>
                              </div>
                            );
                          })}

                          {/* Notes */}
                          <div className="pt-4 border-t">
                            <label className="block font-medium mb-2">Coach Notes</label>
                            <Textarea
                              value={skillNotes}
                              onChange={(e) => setSkillNotes(e.target.value)}
                              placeholder="Add any observations, recommendations, or areas to focus on..."
                              className="min-h-[100px]"
                            />
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Skill Summary & History */}
                    <div className="space-y-6">
                      {/* Skill Overview */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5" />
                            Skill Overview
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {skills.map((skill) => (
                              <div key={skill.key} className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg ${skill.color} flex items-center justify-center`}>
                                  <skill.icon className="w-4 h-4 text-white" />
                                </div>
                                <div className="flex-1">
                                  <div className="flex justify-between text-sm mb-1">
                                    <span className="text-muted-foreground">{skill.name}</span>
                                    <span className="font-medium">{skill.value}</span>
                                  </div>
                                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                    <div
                                      className={`h-full ${skill.color} transition-all duration-300`}
                                      style={{ width: `${skill.value}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="mt-6 pt-4 border-t">
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Overall Rating</span>
                              <div className="flex items-center gap-2">
                                <span className="text-3xl font-bold">{averageSkillScore}</span>
                                <span className={`text-sm ${getScoreLabel(averageSkillScore).color}`}>
                                  {getScoreLabel(averageSkillScore).label}
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Assessment History */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <History className="w-5 h-5" />
                            Recent Assessments
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {skillHistory && skillHistory.length > 0 ? (
                            <div className="space-y-3">
                              {skillHistory.slice(0, 5).map((record: any, idx: number) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                                  <div>
                                    <div className="font-medium capitalize">{record.skillName?.replace(/([A-Z])/g, ' $1').trim()}</div>
                                    <div className="text-muted-foreground text-xs">
                                      {new Date(record.recordedAt).toLocaleDateString()}
                                    </div>
                                  </div>
                                  <Badge className={record.score >= 70 ? "bg-green-600" : record.score >= 50 ? "bg-yellow-600" : "bg-red-600"}>
                                    {record.score}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-6 text-muted-foreground">
                              <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                              <p>No previous assessments</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Star className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-xl font-semibold mb-2">Select a Player</h3>
                    <p className="text-muted-foreground">Choose a player from the dropdown above to start the skill assessment</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        ) : selectedPlayer ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No performance data</h3>
              <p className="text-muted-foreground mb-4">
                Start recording performance metrics for this player
              </p>
              <RecordPerformanceDialog preselectedPlayerId={selectedPlayer} />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Select a Player</h3>
              <p className="text-muted-foreground">
                Choose a player from the dropdown above to view their performance data
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
