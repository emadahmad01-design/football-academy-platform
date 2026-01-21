import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  ArrowLeft,
  Save,
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
} from "lucide-react";
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

export default function SkillAssessment() {
  const { user } = useAuth();
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>("");
  const [skills, setSkills] = useState<SkillScore[]>(SKILLS.map(s => ({ ...s })));
  const [notes, setNotes] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Fetch players for coach
  const { data: players, isLoading: playersLoading } = trpc.players.getAll.useQuery();

  // Save skill scores mutation
  const saveSkillsMutation = trpc.skillScores.create.useMutation({
    onSuccess: () => {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    },
  });

  // Get player's skill history
  const { data: skillHistory } = trpc.skillScores.getHistory.useQuery(
    { playerId: parseInt(selectedPlayerId) },
    { enabled: !!selectedPlayerId }
  );

  const selectedPlayer = players?.find(p => p.id.toString() === selectedPlayerId);

  const updateSkill = (key: string, value: number) => {
    setSkills(prev => prev.map(s => s.key === key ? { ...s, value } : s));
  };

  const handleSave = () => {
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
      notes: notes || undefined,
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

  const averageScore = Math.round(skills.reduce((sum, s) => sum + s.value, 0) / skills.length);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-50">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/coach-progress">
                <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-white">Skill Assessment</h1>
                <p className="text-slate-400 text-sm">Rate player skills and track development</p>
              </div>
            </div>
            {selectedPlayerId && (
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => {
                    if (!selectedPlayer) return;
                    exportSkillAssessmentPDF({
                      playerName: `${selectedPlayer.firstName} ${selectedPlayer.lastName}`,
                      date: new Date().toISOString().split('T')[0],
                      skills: skills.map(s => ({ name: s.name, value: s.value })),
                      overallRating: averageScore,
                      coachNotes: notes || undefined,
                    });
                  }}
                  variant="outline"
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  <FileDown className="w-4 h-4 mr-2" />
                  Export PDF
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saveSkillsMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700"
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
            )}
          </div>
        </div>
      </header>

      <div className="container py-6">
        {/* Player Selection */}
        <Card className="bg-slate-800 border-slate-700 mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <User className="w-5 h-5" />
              Select Player
            </CardTitle>
            <CardDescription className="text-slate-400">
              Choose a player to assess their skills
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedPlayerId} onValueChange={setSelectedPlayerId}>
              <SelectTrigger className="w-full md:w-96 bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Select a player..." />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {playersLoading ? (
                  <SelectItem value="loading" disabled>Loading players...</SelectItem>
                ) : players && players.length > 0 ? (
                  players.map((player) => (
                    <SelectItem key={player.id} value={player.id.toString()} className="text-white">
                      {player.firstName} {player.lastName} - {player.position || "No position"}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>No players found</SelectItem>
                )}
              </SelectContent>
            </Select>

            {selectedPlayer && (
              <div className="mt-4 flex items-center gap-4 p-4 bg-slate-700/50 rounded-lg">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
                  {selectedPlayer.firstName?.[0]}{selectedPlayer.lastName?.[0]}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {selectedPlayer.firstName} {selectedPlayer.lastName}
                  </h3>
                  <div className="flex items-center gap-2 text-slate-400 text-sm">
                    <Badge variant="outline" className="border-slate-500">
                      {selectedPlayer.position || "No position"}
                    </Badge>
                    <span>•</span>
                    <span>{selectedPlayer.ageGroup || "No age group"}</span>
                  </div>
                </div>
                <div className="ml-auto text-right">
                  <div className="text-3xl font-bold text-white">{averageScore}</div>
                  <div className={`text-sm ${getScoreLabel(averageScore).color}`}>
                    {getScoreLabel(averageScore).label}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {selectedPlayerId && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Skill Sliders */}
            <div className="lg:col-span-2">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Star className="w-5 h-5" />
                    Skill Ratings
                  </CardTitle>
                  <CardDescription className="text-slate-400">
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
                              <span className="text-white font-medium">{skill.name}</span>
                              <p className="text-slate-500 text-xs">{skill.description}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-2xl font-bold text-white">{skill.value}</span>
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
                        <div className="flex justify-between text-xs text-slate-500">
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
                  <div className="pt-4 border-t border-slate-700">
                    <label className="block text-white font-medium mb-2">Coach Notes</label>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add any observations, recommendations, or areas to focus on..."
                      className="bg-slate-700 border-slate-600 text-white min-h-[100px]"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Skill Summary & History */}
            <div className="space-y-6">
              {/* Radar Summary */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
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
                            <span className="text-slate-300">{skill.name}</span>
                            <span className="text-white font-medium">{skill.value}</span>
                          </div>
                          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${skill.color} transition-all duration-300`}
                              style={{ width: `${skill.value}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-700">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Overall Rating</span>
                      <div className="flex items-center gap-2">
                        <span className="text-3xl font-bold text-white">{averageScore}</span>
                        <span className={`text-sm ${getScoreLabel(averageScore).color}`}>
                          {getScoreLabel(averageScore).label}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Assessment History */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <History className="w-5 h-5" />
                    Recent Assessments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {skillHistory && skillHistory.length > 0 ? (
                    <div className="space-y-3">
                      {skillHistory.slice(0, 5).map((record: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                          <div>
                            <div className="text-white font-medium capitalize">{record.skillName?.replace(/([A-Z])/g, ' $1').trim()}</div>
                            <div className="text-slate-400 text-xs">
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
                    <div className="text-center py-6 text-slate-400">
                      <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No previous assessments</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {!selectedPlayerId && (
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="py-12 text-center">
              <User className="w-16 h-16 mx-auto mb-4 text-slate-500" />
              <h3 className="text-xl font-semibold text-white mb-2">Select a Player</h3>
              <p className="text-slate-400">Choose a player from the dropdown above to start the skill assessment</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
