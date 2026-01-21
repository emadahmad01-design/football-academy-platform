import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Plus,
  Save,
  Trash2,
  Users,
  Target,
  Shield,
  AlertTriangle,
  Star,
  TrendingUp,
  TrendingDown,
  Eye,
  FileText,
  Zap,
  FileDown,
} from "lucide-react";
import { exportOppositionAnalysisPDF } from "@/lib/pdfExport";

interface KeyPlayer {
  id: number;
  name: string;
  number: number;
  position: string;
  strengths: string[];
  weaknesses: string[];
  threatLevel: "high" | "medium" | "low";
  notes: string;
}

interface TacticalPattern {
  id: number;
  type: string;
  description: string;
  frequency: "always" | "often" | "sometimes" | "rarely";
}

interface OppositionReport {
  id: number;
  teamName: string;
  formation: string;
  playStyle: string;
  keyPlayers: KeyPlayer[];
  strengths: string[];
  weaknesses: string[];
  tacticalPatterns: TacticalPattern[];
  setPieceNotes: string;
  generalNotes: string;
}

export default function OppositionAnalysis() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [showAddPattern, setShowAddPattern] = useState(false);

  // Form state for new key player
  const [newPlayer, setNewPlayer] = useState<Partial<KeyPlayer>>({
    name: "",
    number: 0,
    position: "",
    strengths: [],
    weaknesses: [],
    threatLevel: "medium",
    notes: "",
  });

  // Form state for new pattern
  const [newPattern, setNewPattern] = useState<Partial<TacticalPattern>>({
    type: "",
    description: "",
    frequency: "sometimes",
  });

  // Mock data for demo
  const [report, setReport] = useState<OppositionReport>({
    id: 1,
    teamName: "Al Ahly Youth",
    formation: "4-3-3",
    playStyle: "Possession-based with quick transitions",
    keyPlayers: [
      {
        id: 1,
        name: "Ahmed Sayed",
        number: 10,
        position: "CAM",
        strengths: ["Vision", "Passing", "Set pieces"],
        weaknesses: ["Defensive work rate", "Physical duels"],
        threatLevel: "high",
        notes: "Main playmaker, always looks for through balls",
      },
      {
        id: 2,
        name: "Mohamed Hassan",
        number: 9,
        position: "ST",
        strengths: ["Pace", "Finishing", "Movement"],
        weaknesses: ["Aerial duels", "Hold-up play"],
        threatLevel: "high",
        notes: "Runs in behind, dangerous on counter attacks",
      },
      {
        id: 3,
        name: "Omar Ali",
        number: 6,
        position: "CDM",
        strengths: ["Tackling", "Positioning", "Distribution"],
        weaknesses: ["Pace", "Turning"],
        threatLevel: "medium",
        notes: "Shield for defense, press him high",
      },
    ],
    strengths: [
      "Strong in possession",
      "Quick counter attacks",
      "Set piece delivery",
      "Team pressing",
    ],
    weaknesses: [
      "Vulnerable to long balls",
      "Full backs push high",
      "Goalkeeper distribution",
      "Defending crosses",
    ],
    tacticalPatterns: [
      {
        id: 1,
        type: "Build-up",
        description: "Play out from the back through CDM, rarely go long",
        frequency: "always",
      },
      {
        id: 2,
        type: "Attack",
        description: "Overload left side with LW and LB combinations",
        frequency: "often",
      },
      {
        id: 3,
        type: "Defense",
        description: "High press for first 20 minutes, then drop deeper",
        frequency: "often",
      },
      {
        id: 4,
        type: "Transition",
        description: "Quick vertical passes to striker when winning ball",
        frequency: "always",
      },
    ],
    setPieceNotes: "Dangerous from corners - target near post. Free kicks usually go for direct shot. Penalty taker is #10.",
    generalNotes: "Well-organized team with good discipline. Coach prefers rotation in second half. Tend to lose concentration after scoring.",
  });

  const [strengthInput, setStrengthInput] = useState("");
  const [weaknessInput, setWeaknessInput] = useState("");

  const addStrength = () => {
    if (strengthInput.trim()) {
      setReport({ ...report, strengths: [...report.strengths, strengthInput.trim()] });
      setStrengthInput("");
    }
  };

  const addWeakness = () => {
    if (weaknessInput.trim()) {
      setReport({ ...report, weaknesses: [...report.weaknesses, weaknessInput.trim()] });
      setWeaknessInput("");
    }
  };

  const removeStrength = (index: number) => {
    setReport({ ...report, strengths: report.strengths.filter((_, i) => i !== index) });
  };

  const removeWeakness = (index: number) => {
    setReport({ ...report, weaknesses: report.weaknesses.filter((_, i) => i !== index) });
  };

  const addKeyPlayer = () => {
    if (newPlayer.name && newPlayer.position) {
      const player: KeyPlayer = {
        id: Date.now(),
        name: newPlayer.name,
        number: newPlayer.number || 0,
        position: newPlayer.position,
        strengths: newPlayer.strengths || [],
        weaknesses: newPlayer.weaknesses || [],
        threatLevel: newPlayer.threatLevel || "medium",
        notes: newPlayer.notes || "",
      };
      setReport({ ...report, keyPlayers: [...report.keyPlayers, player] });
      setNewPlayer({
        name: "",
        number: 0,
        position: "",
        strengths: [],
        weaknesses: [],
        threatLevel: "medium",
        notes: "",
      });
      setShowAddPlayer(false);
    }
  };

  const removeKeyPlayer = (id: number) => {
    setReport({ ...report, keyPlayers: report.keyPlayers.filter((p) => p.id !== id) });
  };

  const addPattern = () => {
    if (newPattern.type && newPattern.description) {
      const pattern: TacticalPattern = {
        id: Date.now(),
        type: newPattern.type,
        description: newPattern.description,
        frequency: newPattern.frequency || "sometimes",
      };
      setReport({ ...report, tacticalPatterns: [...report.tacticalPatterns, pattern] });
      setNewPattern({ type: "", description: "", frequency: "sometimes" });
      setShowAddPattern(false);
    }
  };

  const removePattern = (id: number) => {
    setReport({ ...report, tacticalPatterns: report.tacticalPatterns.filter((p) => p.id !== id) });
  };

  const getThreatColor = (level: string) => {
    switch (level) {
      case "high":
        return "bg-red-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-green-500";
      default:
        return "bg-slate-500";
    }
  };

  const getFrequencyColor = (freq: string) => {
    switch (freq) {
      case "always":
        return "bg-red-500";
      case "often":
        return "bg-orange-500";
      case "sometimes":
        return "bg-yellow-500";
      case "rarely":
        return "bg-green-500";
      default:
        return "bg-slate-500";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-50">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/parent-dashboard">
                <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-white">Opposition Analysis</h1>
                <p className="text-slate-400 text-sm">Scout and analyze opponent teams</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                <Save className="w-4 h-4 mr-2" />
                Save Report
              </Button>
              <Button size="sm" variant="outline" className="border-slate-600 text-slate-300">
                <FileText className="w-4 h-4 mr-2" />
                Generate Briefing
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-slate-600 text-slate-300"
                onClick={() => {
                  exportOppositionAnalysisPDF({
                    opponentName: report.teamName,
                    date: new Date().toISOString().split('T')[0],
                    keyPlayers: report.keyPlayers.map(p => ({
                      name: `#${p.number} ${p.name}`,
                      position: p.position,
                      threat: p.threatLevel.charAt(0).toUpperCase() + p.threatLevel.slice(1),
                      notes: p.notes,
                    })),
                    patterns: report.tacticalPatterns.map(p => ({
                      name: p.type,
                      frequency: p.frequency.charAt(0).toUpperCase() + p.frequency.slice(1),
                      description: p.description,
                    })),
                    strengths: report.strengths,
                    weaknesses: report.weaknesses,
                  });
                }}
              >
                <FileDown className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container py-6">
        {/* Team Header */}
        <Card className="bg-slate-800 border-slate-700 mb-6">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <div>
                  <Input
                    value={report.teamName}
                    onChange={(e) => setReport({ ...report, teamName: e.target.value })}
                    className="text-2xl font-bold bg-transparent border-none text-white p-0 h-auto focus-visible:ring-0"
                    placeholder="Team Name"
                  />
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 text-sm">Formation:</span>
                      <Select
                        value={report.formation}
                        onValueChange={(v) => setReport({ ...report, formation: v })}
                      >
                        <SelectTrigger className="w-24 h-7 bg-slate-700 border-slate-600 text-white text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-700 border-slate-600">
                          {["4-4-2", "4-3-3", "3-5-2", "4-2-3-1", "5-3-2", "4-1-4-1"].map((f) => (
                            <SelectItem key={f} value={f}>{f}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Badge variant="outline" className="border-slate-500 text-slate-300">
                      {report.keyPlayers.length} Key Players
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-slate-400 text-sm">Play Style</p>
                <Input
                  value={report.playStyle}
                  onChange={(e) => setReport({ ...report, playStyle: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white mt-1 w-64"
                  placeholder="e.g., Possession-based"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 bg-slate-800 mb-6">
            <TabsTrigger value="overview" className="data-[state=active]:bg-emerald-600">
              <Eye className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="players" className="data-[state=active]:bg-emerald-600">
              <Users className="w-4 h-4 mr-2" />
              Key Players
            </TabsTrigger>
            <TabsTrigger value="tactics" className="data-[state=active]:bg-emerald-600">
              <Target className="w-4 h-4 mr-2" />
              Tactics
            </TabsTrigger>
            <TabsTrigger value="notes" className="data-[state=active]:bg-emerald-600">
              <FileText className="w-4 h-4 mr-2" />
              Notes
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Strengths */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                    Strengths
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      value={strengthInput}
                      onChange={(e) => setStrengthInput(e.target.value)}
                      placeholder="Add a strength..."
                      className="bg-slate-700 border-slate-600 text-white"
                      onKeyDown={(e) => e.key === "Enter" && addStrength()}
                    />
                    <Button onClick={addStrength} size="sm" className="bg-green-600 hover:bg-green-700">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {report.strengths.map((strength, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/30 rounded-lg"
                      >
                        <span className="text-green-400">{strength}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeStrength(idx)}
                          className="text-red-400 hover:text-red-300 h-6 w-6 p-0"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Weaknesses */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <TrendingDown className="w-5 h-5 text-red-500" />
                    Weaknesses
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      value={weaknessInput}
                      onChange={(e) => setWeaknessInput(e.target.value)}
                      placeholder="Add a weakness..."
                      className="bg-slate-700 border-slate-600 text-white"
                      onKeyDown={(e) => e.key === "Enter" && addWeakness()}
                    />
                    <Button onClick={addWeakness} size="sm" className="bg-red-600 hover:bg-red-700">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {report.weaknesses.map((weakness, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-red-500/10 border border-red-500/30 rounded-lg"
                      >
                        <span className="text-red-400">{weakness}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeWeakness(idx)}
                          className="text-red-400 hover:text-red-300 h-6 w-6 p-0"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Key Players Tab */}
          <TabsContent value="players">
            <div className="space-y-4">
              <div className="flex justify-end">
                <Dialog open={showAddPlayer} onOpenChange={setShowAddPlayer}>
                  <DialogTrigger asChild>
                    <Button className="bg-emerald-600 hover:bg-emerald-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Key Player
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-slate-800 border-slate-700 text-white">
                    <DialogHeader>
                      <DialogTitle>Add Key Player</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm text-slate-400">Name</label>
                          <Input
                            value={newPlayer.name}
                            onChange={(e) => setNewPlayer({ ...newPlayer, name: e.target.value })}
                            className="bg-slate-700 border-slate-600 text-white mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-slate-400">Number</label>
                          <Input
                            type="number"
                            value={newPlayer.number}
                            onChange={(e) => setNewPlayer({ ...newPlayer, number: parseInt(e.target.value) })}
                            className="bg-slate-700 border-slate-600 text-white mt-1"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm text-slate-400">Position</label>
                          <Input
                            value={newPlayer.position}
                            onChange={(e) => setNewPlayer({ ...newPlayer, position: e.target.value })}
                            placeholder="e.g., CAM, ST, CB"
                            className="bg-slate-700 border-slate-600 text-white mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-slate-400">Threat Level</label>
                          <Select
                            value={newPlayer.threatLevel}
                            onValueChange={(v: "high" | "medium" | "low") => setNewPlayer({ ...newPlayer, threatLevel: v })}
                          >
                            <SelectTrigger className="bg-slate-700 border-slate-600 text-white mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-700 border-slate-600">
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="low">Low</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm text-slate-400">Notes</label>
                        <Textarea
                          value={newPlayer.notes}
                          onChange={(e) => setNewPlayer({ ...newPlayer, notes: e.target.value })}
                          className="bg-slate-700 border-slate-600 text-white mt-1"
                          rows={3}
                        />
                      </div>
                      <Button onClick={addKeyPlayer} className="w-full bg-emerald-600 hover:bg-emerald-700">
                        Add Player
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {report.keyPlayers.map((player) => (
                  <Card key={player.id} className="bg-slate-800 border-slate-700">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center text-white font-bold text-lg">
                            {player.number}
                          </div>
                          <div>
                            <h3 className="text-white font-semibold">{player.name}</h3>
                            <p className="text-slate-400 text-sm">{player.position}</p>
                          </div>
                        </div>
                        <Badge className={`${getThreatColor(player.threatLevel)} text-white`}>
                          {player.threatLevel.toUpperCase()}
                        </Badge>
                      </div>

                      {player.strengths.length > 0 && (
                        <div className="mb-3">
                          <p className="text-green-400 text-xs font-medium mb-1">Strengths</p>
                          <div className="flex flex-wrap gap-1">
                            {player.strengths.map((s, i) => (
                              <Badge key={i} variant="outline" className="text-xs border-green-500/50 text-green-400">
                                {s}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {player.weaknesses.length > 0 && (
                        <div className="mb-3">
                          <p className="text-red-400 text-xs font-medium mb-1">Weaknesses</p>
                          <div className="flex flex-wrap gap-1">
                            {player.weaknesses.map((w, i) => (
                              <Badge key={i} variant="outline" className="text-xs border-red-500/50 text-red-400">
                                {w}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {player.notes && (
                        <p className="text-slate-400 text-sm italic">{player.notes}</p>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeKeyPlayer(player.id)}
                        className="mt-3 text-red-400 hover:text-red-300 hover:bg-red-500/20 w-full"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remove
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Tactics Tab */}
          <TabsContent value="tactics">
            <div className="space-y-4">
              <div className="flex justify-end">
                <Dialog open={showAddPattern} onOpenChange={setShowAddPattern}>
                  <DialogTrigger asChild>
                    <Button className="bg-emerald-600 hover:bg-emerald-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Pattern
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-slate-800 border-slate-700 text-white">
                    <DialogHeader>
                      <DialogTitle>Add Tactical Pattern</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm text-slate-400">Type</label>
                          <Select
                            value={newPattern.type}
                            onValueChange={(v) => setNewPattern({ ...newPattern, type: v })}
                          >
                            <SelectTrigger className="bg-slate-700 border-slate-600 text-white mt-1">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-700 border-slate-600">
                              <SelectItem value="Build-up">Build-up</SelectItem>
                              <SelectItem value="Attack">Attack</SelectItem>
                              <SelectItem value="Defense">Defense</SelectItem>
                              <SelectItem value="Transition">Transition</SelectItem>
                              <SelectItem value="Set Piece">Set Piece</SelectItem>
                              <SelectItem value="Pressing">Pressing</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-sm text-slate-400">Frequency</label>
                          <Select
                            value={newPattern.frequency}
                            onValueChange={(v: "always" | "often" | "sometimes" | "rarely") =>
                              setNewPattern({ ...newPattern, frequency: v })
                            }
                          >
                            <SelectTrigger className="bg-slate-700 border-slate-600 text-white mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-700 border-slate-600">
                              <SelectItem value="always">Always</SelectItem>
                              <SelectItem value="often">Often</SelectItem>
                              <SelectItem value="sometimes">Sometimes</SelectItem>
                              <SelectItem value="rarely">Rarely</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm text-slate-400">Description</label>
                        <Textarea
                          value={newPattern.description}
                          onChange={(e) => setNewPattern({ ...newPattern, description: e.target.value })}
                          className="bg-slate-700 border-slate-600 text-white mt-1"
                          rows={3}
                        />
                      </div>
                      <Button onClick={addPattern} className="w-full bg-emerald-600 hover:bg-emerald-700">
                        Add Pattern
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="space-y-3">
                {report.tacticalPatterns.map((pattern) => (
                  <Card key={pattern.id} className="bg-slate-800 border-slate-700">
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="p-2 rounded-lg bg-blue-500/20">
                            <Zap className="w-5 h-5 text-blue-400" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-white font-semibold">{pattern.type}</h3>
                              <Badge className={`${getFrequencyColor(pattern.frequency)} text-white text-xs`}>
                                {pattern.frequency}
                              </Badge>
                            </div>
                            <p className="text-slate-400">{pattern.description}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removePattern(pattern.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent value="notes">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Set Piece Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={report.setPieceNotes}
                    onChange={(e) => setReport({ ...report, setPieceNotes: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white min-h-[200px]"
                    placeholder="Notes about their set pieces..."
                  />
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    General Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={report.generalNotes}
                    onChange={(e) => setReport({ ...report, generalNotes: e.target.value })}
                    className="bg-slate-700 border-slate-600 text-white min-h-[200px]"
                    placeholder="General observations..."
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
