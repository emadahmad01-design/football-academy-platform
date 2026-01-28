import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useParentChild } from "@/contexts/ParentChildContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  User,
  Target,
  Zap,
  Activity,
  Brain,
  Shield,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  History,
  Star,
  FileDown,
  Save,
  Plus,
  Timer,
  Footprints,
} from "lucide-react";
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

// Performance metrics structure
interface PerformanceMetric {
  name: string;
  key: string;
  value: number;
  icon: React.ElementType;
  color: string;
  description: string;
  unit?: string;
}

const PERFORMANCE_METRICS: PerformanceMetric[] = [
  { name: "Touches", key: "touches", value: 0, icon: Footprints, color: "bg-blue-500", description: "Total ball touches" },
  { name: "Passes", key: "passes", value: 0, icon: Target, color: "bg-green-500", description: "Total passes attempted" },
  { name: "Pass Accuracy", key: "passAccuracy", value: 0, icon: Target, color: "bg-emerald-500", description: "Successful pass percentage", unit: "%" },
  { name: "Shots", key: "shots", value: 0, icon: Zap, color: "bg-red-500", description: "Total shots taken" },
  { name: "Shots on Target", key: "shotsOnTarget", value: 0, icon: Target, color: "bg-orange-500", description: "Shots hitting the target" },
  { name: "Dribbles", key: "dribbles", value: 0, icon: Activity, color: "bg-purple-500", description: "Dribble attempts" },
  { name: "Distance Covered", key: "distanceCovered", value: 0, icon: TrendingUp, color: "bg-cyan-500", description: "Total distance run", unit: "km" },
  { name: "Top Speed", key: "topSpeed", value: 0, icon: Zap, color: "bg-yellow-500", description: "Maximum speed reached", unit: "km/h" },
  { name: "Sprints", key: "sprints", value: 0, icon: Timer, color: "bg-pink-500", description: "High-intensity runs" },
  { name: "Tackles", key: "tackles", value: 0, icon: Shield, color: "bg-slate-500", description: "Successful tackles" },
  { name: "Interceptions", key: "interceptions", value: 0, icon: Brain, color: "bg-indigo-500", description: "Passes intercepted" },
];

export default function Performance() {
  const { user } = useAuth();
  const { selectedChildId } = useParentChild();
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("skills");
  
  // Skill Assessment State
  const [skills, setSkills] = useState<SkillScore[]>(SKILLS.map(s => ({ ...s })));
  const [skillNotes, setSkillNotes] = useState("");
  const [saveSkillSuccess, setSaveSkillSuccess] = useState(false);

  // Performance State
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>(PERFORMANCE_METRICS.map(m => ({ ...m })));
  const [sessionType, setSessionType] = useState<string>("training");
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [performanceNotes, setPerformanceNotes] = useState("");
  const [savePerformanceSuccess, setSavePerformanceSuccess] = useState(false);

  // Fetch teams
  const { data: teams, isLoading: teamsLoading } = trpc.teams.getAll.useQuery();

  // Fetch players
  const { data: players, isLoading: playersLoading } = trpc.players.getAll.useQuery();

  // Filter players by selected team
  const filteredPlayers = players?.filter((p: any) => 
    selectedTeamId ? p.teamId?.toString() === selectedTeamId : false
  );

  // Reset player selection when team changes
  useEffect(() => {
    if (selectedTeamId) {
      setSelectedPlayerId("");
    }
  }, [selectedTeamId]);

  // Auto-select child for parent
  useEffect(() => {
    if (user?.role === 'parent' && selectedChildId && !selectedPlayerId) {
      setSelectedPlayerId(selectedChildId);
      // Auto-select the team of the child player
      const childPlayer = players?.find((p: any) => p.id.toString() === selectedChildId);
      if (childPlayer?.teamId) {
        setSelectedTeamId(childPlayer.teamId.toString());
      }
    }
  }, [user, selectedChildId, selectedPlayerId, players]);

  // Save skill scores mutation
  const saveSkillsMutation = trpc.skillScores.create.useMutation({
    onSuccess: () => {
      setSaveSkillSuccess(true);
      setTimeout(() => setSaveSkillSuccess(false), 3000);
      toast.success('Skill assessment saved successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to save skill assessment');
    },
  });

  // Save performance mutation
  const savePerformanceMutation = trpc.performance.create.useMutation({
    onSuccess: () => {
      setSavePerformanceSuccess(true);
      setTimeout(() => setSavePerformanceSuccess(false), 3000);
      toast.success('Performance recorded successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to record performance');
    },
  });

  // Get player's skill history
  const { data: skillHistory } = trpc.skillScores.getHistory.useQuery(
    { playerId: parseInt(selectedPlayerId) },
    { enabled: !!selectedPlayerId }
  );

  // Get player's performance history
  const { data: performanceHistory } = trpc.performance.getPlayerMetrics.useQuery(
    { playerId: parseInt(selectedPlayerId), limit: 10 },
    { enabled: !!selectedPlayerId }
  );

  const selectedPlayer = players?.find((p: any) => p.id.toString() === selectedPlayerId);

  const updateSkill = (key: string, value: number) => {
    setSkills(prev => prev.map(s => s.key === key ? { ...s, value } : s));
  };

  const updatePerformanceMetric = (key: string, value: number) => {
    setPerformanceMetrics(prev => prev.map(m => m.key === key ? { ...m, value } : m));
  };

  const handleSaveSkills = () => {
    if (!selectedPlayerId) return;
    saveSkillsMutation.mutate({
      playerId: parseInt(selectedPlayerId),
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

  const handleSavePerformance = () => {
    if (!selectedPlayerId) return;
    savePerformanceMutation.mutate({
      playerId: parseInt(selectedPlayerId),
      sessionDate: sessionDate,
      sessionType: sessionType as any,
      touches: performanceMetrics.find(m => m.key === 'touches')?.value || undefined,
      passes: performanceMetrics.find(m => m.key === 'passes')?.value || undefined,
      passAccuracy: performanceMetrics.find(m => m.key === 'passAccuracy')?.value || undefined,
      shots: performanceMetrics.find(m => m.key === 'shots')?.value || undefined,
      shotsOnTarget: performanceMetrics.find(m => m.key === 'shotsOnTarget')?.value || undefined,
      dribbles: performanceMetrics.find(m => m.key === 'dribbles')?.value || undefined,
      distanceCovered: performanceMetrics.find(m => m.key === 'distanceCovered')?.value || undefined,
      topSpeed: performanceMetrics.find(m => m.key === 'topSpeed')?.value || undefined,
      sprints: performanceMetrics.find(m => m.key === 'sprints')?.value || undefined,
      tackles: performanceMetrics.find(m => m.key === 'tackles')?.value || undefined,
      interceptions: performanceMetrics.find(m => m.key === 'interceptions')?.value || undefined,
      notes: performanceNotes || undefined,
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Performance & Skills</h1>
            <p className="text-muted-foreground">Track session performance and rate player skills</p>
          </div>
        </div>

        {/* Player Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Select Team & Player
            </CardTitle>
            <CardDescription>
              First select a team, then choose a player to track their performance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Team Selection */}
            <div>
              <Label htmlFor="team-select" className="text-sm font-medium mb-2 block">
                Team
              </Label>
              <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                <SelectTrigger id="team-select" className="w-full md:w-96">
                  <SelectValue placeholder="Select a team..." />
                </SelectTrigger>
                <SelectContent>
                  {teamsLoading ? (
                    <SelectItem value="loading" disabled>Loading teams...</SelectItem>
                  ) : teams && teams.length > 0 ? (
                    teams.map((team: any) => (
                      <SelectItem key={team.id} value={team.id.toString()}>
                        {team.name} - {team.ageGroup || "No age group"}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>No teams found</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Player Selection */}
            <div>
              <Label htmlFor="player-select" className="text-sm font-medium mb-2 block">
                Player
              </Label>
              <Select 
                value={selectedPlayerId} 
                onValueChange={setSelectedPlayerId}
                disabled={!selectedTeamId}
              >
                <SelectTrigger id="player-select" className="w-full md:w-96">
                  <SelectValue placeholder={selectedTeamId ? "Select a player..." : "Select a team first..."} />
                </SelectTrigger>
                <SelectContent>
                  {playersLoading ? (
                    <SelectItem value="loading" disabled>Loading players...</SelectItem>
                  ) : filteredPlayers && filteredPlayers.length > 0 ? (
                    filteredPlayers.map((player: any) => (
                      <SelectItem key={player.id} value={player.id.toString()}>
                        {player.firstName} {player.lastName} - {player.position || "No position"}
                      </SelectItem>
                    ))
                  ) : selectedTeamId ? (
                    <SelectItem value="none" disabled>No players in this team</SelectItem>
                  ) : (
                    <SelectItem value="none" disabled>Select a team first</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {selectedPlayer && (
              <div className="flex items-center gap-4 mt-4 p-4 bg-muted/50 rounded-lg">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
                  {selectedPlayer.firstName?.[0]}{selectedPlayer.lastName?.[0]}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">
                    {selectedPlayer.firstName} {selectedPlayer.lastName}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Badge variant="outline">
                      {selectedPlayer.position || "No position"}
                    </Badge>
                    <span>•</span>
                    <span>{selectedPlayer.ageGroup || "No age group"}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold">{averageSkillScore}</div>
                  <div className={`text-sm ${getScoreLabel(averageSkillScore).color}`}>
                    {getScoreLabel(averageSkillScore).label}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {selectedPlayerId ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="skills">Skill Assessment</TabsTrigger>
              <TabsTrigger value="performance">Session Performance</TabsTrigger>
            </TabsList>

            {/* SKILL ASSESSMENT TAB */}
            <TabsContent value="skills" className="space-y-6">
              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2">
                <Button
                  onClick={() => {
                    if (!selectedPlayer) return;
                    exportSkillAssessmentPDF({
                      playerName: `${selectedPlayer.firstName} ${selectedPlayer.lastName}`,
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
                  ) : saveSkillSuccess ? (
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
            </TabsContent>

            {/* PERFORMANCE TAB */}
            <TabsContent value="performance" className="space-y-6">
              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2">
                <Button
                  onClick={handleSavePerformance}
                  disabled={savePerformanceMutation.isPending}
                >
                  {savePerformanceMutation.isPending ? (
                    <>Saving...</>
                  ) : savePerformanceSuccess ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Saved!
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Record Performance
                    </>
                  )}
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Performance Inputs */}
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="w-5 h-5" />
                        Session Metrics
                      </CardTitle>
                      <CardDescription>
                        Enter performance data from training or match sessions
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Session Info */}
                      <div className="grid grid-cols-2 gap-4 pb-4 border-b">
                        <div className="space-y-2">
                          <Label>Session Type</Label>
                          <Select value={sessionType} onValueChange={setSessionType}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="training">Training</SelectItem>
                              <SelectItem value="match">Match</SelectItem>
                              <SelectItem value="assessment">Assessment</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Session Date</Label>
                          <Input
                            type="date"
                            value={sessionDate}
                            onChange={(e) => setSessionDate(e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Metrics */}
                      {performanceMetrics.map((metric) => (
                        <div key={metric.key} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className={`p-2 rounded-lg ${metric.color}`}>
                                <metric.icon className="w-4 h-4 text-white" />
                              </div>
                              <div>
                                <span className="font-medium">{metric.name}</span>
                                <p className="text-xs text-muted-foreground">{metric.description}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                value={metric.value || ''}
                                onChange={(e) => updatePerformanceMetric(metric.key, parseFloat(e.target.value) || 0)}
                                className="w-24 text-right"
                                placeholder="0"
                              />
                              {metric.unit && <span className="text-sm text-muted-foreground w-12">{metric.unit}</span>}
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Notes */}
                      <div className="pt-4 border-t">
                        <label className="block font-medium mb-2">Session Notes</label>
                        <Textarea
                          value={performanceNotes}
                          onChange={(e) => setPerformanceNotes(e.target.value)}
                          placeholder="Add any observations about the session..."
                          className="min-h-[100px]"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Performance History */}
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <History className="w-5 h-5" />
                        Recent Sessions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {performanceHistory && performanceHistory.length > 0 ? (
                        <div className="space-y-3">
                          {performanceHistory.slice(0, 5).map((record: any, idx: number) => (
                            <div key={idx} className="p-3 bg-secondary/50 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <Badge variant="outline" className="capitalize">{record.sessionType}</Badge>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(record.sessionDate).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="grid grid-cols-3 gap-2 text-sm">
                                <div>
                                  <span className="text-muted-foreground">Passes:</span>
                                  <span className="ml-1 font-medium">{record.passes || '--'}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Shots:</span>
                                  <span className="ml-1 font-medium">{record.shots || '--'}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Dist:</span>
                                  <span className="ml-1 font-medium">{record.distanceCovered || '--'}km</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 text-muted-foreground">
                          <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p>No previous sessions</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <User className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">Select a Player</h3>
              <p className="text-muted-foreground">Choose a player from the dropdown above to start tracking their performance</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
