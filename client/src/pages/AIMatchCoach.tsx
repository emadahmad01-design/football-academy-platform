import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Brain, 
  Trophy, 
  Activity, 
  Shirt, 
  Target, 
  Shield, 
  TrendingUp, 
  Users,
  Zap,
  AlertTriangle,
  CheckCircle,
  MessageSquare,
  History,
  Sparkles
} from "lucide-react";

// --- 1. Data & Constants ---
const PLAYERS_DATA = [
  { id: 1, name: "Salah", speed: 95, passing: 85, finishing: 92, role: "Forward", stamina: 88 },
  { id: 2, name: "Modric", speed: 70, passing: 96, finishing: 75, role: "Midfield", stamina: 85 },
  { id: 3, name: "Van Dijk", speed: 78, passing: 82, finishing: 60, role: "Defender", stamina: 90 },
  { id: 4, name: "Vinicius", speed: 97, passing: 80, finishing: 88, role: "Forward", stamina: 86 },
  { id: 5, name: "Kimmich", speed: 80, passing: 90, finishing: 70, role: "Midfield", stamina: 92 },
  { id: 6, name: "Ramos", speed: 75, passing: 80, finishing: 68, role: "Defender", stamina: 88 },
  { id: 7, name: "De Bruyne", speed: 85, passing: 94, finishing: 87, role: "Midfield", stamina: 84 },
  { id: 8, name: "Mbappe", speed: 99, passing: 80, finishing: 90, role: "Forward", stamina: 89 },
  { id: 9, name: "Alisson", speed: 60, passing: 75, finishing: 10, role: "Goalkeeper", stamina: 85 },
  { id: 10, name: "Trent", speed: 88, passing: 90, finishing: 70, role: "Defender", stamina: 87 },
  { id: 11, name: "Bruno F.", speed: 82, passing: 90, finishing: 89, role: "Midfield", stamina: 86 },
  { id: 12, name: "Ronaldo", speed: 80, passing: 70, finishing: 95, role: "Forward", stamina: 82 },
];

const TACTICS = {
  COUNTER: "Counter-Attack",
  POSSESSION: "Possession",
  PRESSING: "Gegenpressing",
};

const OPPONENT_STYLES = {
  HIGH_PRESS: "High Press",
  TIKI_TAKA: "Tiki-Taka",
  LOW_BLOCK: "Low Block (Defense)",
};

const FORMATIONS = {
  "4-4-2": "4-4-2",
  "4-3-3": "4-3-3",
  "4-2-3-1": "4-2-3-1",
  "3-5-2": "3-5-2",
  "5-3-2": "5-3-2",
};

// Mock opponent team data
const OPPONENT_TEAM = {
  name: "Rival FC",
  formation: "4-4-2",
  recentMatches: [
    { opponent: "Team A", goalsAgainst: 2, weakSide: "right", result: "L" },
    { opponent: "Team B", goalsAgainst: 1, weakSide: "left", result: "W" },
    { opponent: "Team C", goalsAgainst: 3, weakSide: "right", result: "L" },
    { opponent: "Team D", goalsAgainst: 0, weakSide: "center", result: "W" },
    { opponent: "Team E", goalsAgainst: 2, weakSide: "right", result: "D" },
  ],
  defenders: [
    { name: "Left Back", speed: 72, strength: 80, position: "left" },
    { name: "Center Back 1", speed: 68, strength: 88, position: "center" },
    { name: "Center Back 2", speed: 70, strength: 85, position: "center" },
    { name: "Right Back", speed: 65, strength: 78, position: "right" },
  ],
  avgGoalsConceded: 1.6,
  weaknesses: ["Slow right-back", "Vulnerable to pace", "Poor aerial defense"],
};

// Historical match data
const HISTORICAL_MATCHES = [
  { 
    date: "2024-01-15", 
    opponent: "Similar Team A", 
    myFormation: "4-3-3", 
    oppFormation: "4-4-2", 
    myTactic: "Counter-Attack",
    result: "3-1 Win",
    success: true 
  },
  { 
    date: "2024-02-20", 
    opponent: "Similar Team B", 
    myFormation: "4-4-2", 
    oppFormation: "4-4-2", 
    myTactic: "Possession",
    result: "1-1 Draw",
    success: false 
  },
  { 
    date: "2024-03-10", 
    opponent: "Similar Team C", 
    myFormation: "4-2-3-1", 
    oppFormation: "4-4-2", 
    myTactic: "Gegenpressing",
    result: "2-0 Win",
    success: true 
  },
];

// --- 2. Logic Functions ---

// AI Advice Logic
const getAIAdvice = (oppStyle: string, myTactic: string) => {
  if (oppStyle === OPPONENT_STYLES.HIGH_PRESS && myTactic === TACTICS.COUNTER) {
    return { type: "success", msg: "✅ Excellent choice! Counter-attacks will exploit the space behind their high line." };
  }
  if (oppStyle === OPPONENT_STYLES.LOW_BLOCK && myTactic === TACTICS.COUNTER) {
    return { type: "warning", msg: "⚠️ Warning: Opponent sits deep. Counters won't work well. Try Possession to open gaps." };
  }
  if (oppStyle === OPPONENT_STYLES.TIKI_TAKA && myTactic === TACTICS.PRESSING) {
    return { type: "success", msg: "🎯 Great! High pressing will disrupt their passing rhythm and force errors." };
  }
  if (oppStyle === OPPONENT_STYLES.TIKI_TAKA && myTactic === TACTICS.POSSESSION) {
    return { type: "destructive", msg: "❌ Risky. Winning a possession battle against Tiki-Taka is hard. Try High Press." };
  }
  return { type: "info", msg: "ℹ️ Balanced approach. Check your team stamina vs their strength." };
};

// NEW: Opposition Weakness Analysis
const analyzeOpponentWeaknesses = () => {
  const rightSideGoals = OPPONENT_TEAM.recentMatches.filter(m => m.weakSide === "right").length;
  const totalMatches = OPPONENT_TEAM.recentMatches.length;
  const rightSidePercentage = Math.round((rightSideGoals / totalMatches) * 100);
  
  const slowestDefender = OPPONENT_TEAM.defenders.reduce((prev, current) => 
    (prev.speed < current.speed) ? prev : current
  );
  
  return {
    primaryWeakness: rightSidePercentage > 50 ? "Right Defensive Flank" : "Central Defense",
    percentage: rightSidePercentage,
    slowestDefender,
    recommendations: [
      `Target ${slowestDefender.position} side with fast wingers`,
      `${rightSidePercentage}% of goals conceded from right side`,
      `Exploit pace advantage against ${slowestDefender.name} (Speed: ${slowestDefender.speed})`,
    ],
  };
};

// NEW: Formation Counter Suggestions
const getFormationCounters = (oppFormation: string) => {
  const counters = {
    "4-4-2": [
      { 
        formation: "4-3-3", 
        success: 68, 
        reason: "Numerical superiority in midfield (3v2) allows control",
        tactics: "Dominate center, wide attacks" 
      },
      { 
        formation: "4-2-3-1", 
        success: 65, 
        reason: "CAM finds space between lines, overloads midfield",
        tactics: "Through balls, creative playmaking" 
      },
      { 
        formation: "3-5-2", 
        success: 62, 
        reason: "Wing-backs exploit wide areas, 5-man midfield dominance",
        tactics: "Wide overloads, midfield control" 
      },
    ],
    "4-3-3": [
      { 
        formation: "4-4-2", 
        success: 64, 
        reason: "Compact midfield blocks passing lanes",
        tactics: "Defensive solidity, counter-attacks" 
      },
      { 
        formation: "5-3-2", 
        success: 70, 
        reason: "Extra defender neutralizes wingers, solid base",
        tactics: "Defensive stability, quick counters" 
      },
      { 
        formation: "4-2-3-1", 
        success: 58, 
        reason: "Match their shape, focus on transitions",
        tactics: "Balanced approach, quick switches" 
      },
    ],
  };
  
  return counters[oppFormation as keyof typeof counters] || counters["4-4-2"];
};

// NEW: Player Role Optimization
const optimizePlayerRoles = (myTactic: string) => {
  const weakness = analyzeOpponentWeaknesses();
  
  return PLAYERS_DATA.slice(0, 11).map(player => {
    let advantage = "Neutral";
    let recommendation = "";
    let matchupScore = 50;
    
    if (weakness.slowestDefender.position === "right" && player.speed > 90 && player.role === "Forward") {
      advantage = "High";
      recommendation = `Deploy on LEFT wing to exploit slow ${weakness.slowestDefender.name}`;
      matchupScore = 85;
    } else if (player.passing > 90 && myTactic === TACTICS.POSSESSION) {
      advantage = "Medium";
      recommendation = "Key playmaker for possession game";
      matchupScore = 75;
    } else if (player.speed > 85 && myTactic === TACTICS.COUNTER) {
      advantage = "Medium";
      recommendation = "Perfect for counter-attack transitions";
      matchupScore = 70;
    }
    
    return {
      ...player,
      advantage,
      recommendation,
      matchupScore,
    };
  }).sort((a, b) => b.matchupScore - a.matchupScore);
};

// NEW: AI Commentary Generator
const generateAICommentary = (oppStyle: string, myTactic: string, myFormation: string) => {
  const comments = [];
  
  // Formation analysis
  comments.push({
    type: "formation",
    text: `Your ${myFormation} formation provides structural balance for ${myTactic} tactics.`,
  });
  
  // Tactical matchup
  const advice = getAIAdvice(oppStyle, myTactic);
  if (advice.type === "success") {
    comments.push({
      type: "positive",
      text: "Tactical advantage detected! Your approach directly counters their style.",
    });
  } else if (advice.type === "warning" || advice.type === "destructive") {
    comments.push({
      type: "warning",
      text: "Tactical mismatch! Consider adjusting your approach for better results.",
    });
  }
  
  // Player-specific insights
  const weakness = analyzeOpponentWeaknesses();
  comments.push({
    type: "insight",
    text: `Opposition weakness: ${weakness.primaryWeakness}. Deploy fast attackers on that flank.`,
  });
  
  return comments;
};

// Formation Positions (CSS percentages for Top/Left)
const getFormationPositions = (tactic: string) => {
  if (tactic === TACTICS.COUNTER) {
    // 4-4-2 Deep
    return [
      { top: "90%", left: "50%" }, // GK
      { top: "75%", left: "20%" }, { top: "75%", left: "40%" }, { top: "75%", left: "60%" }, { top: "75%", left: "80%" }, // DF
      { top: "55%", left: "20%" }, { top: "55%", left: "40%" }, { top: "55%", left: "60%" }, { top: "55%", left: "80%" }, // MF
      { top: "25%", left: "40%" }, { top: "25%", left: "60%" } // FW
    ];
  } else if (tactic === TACTICS.POSSESSION) {
    // 4-3-3 Wide
    return [
      { top: "90%", left: "50%" }, // GK
      { top: "70%", left: "15%" }, { top: "70%", left: "38%" }, { top: "70%", left: "62%" }, { top: "70%", left: "85%" }, // DF
      { top: "50%", left: "30%" }, { top: "50%", left: "50%" }, { top: "50%", left: "70%" }, // MF
      { top: "20%", left: "20%" }, { top: "15%", left: "50%" }, { top: "20%", left: "80%" } // FW
    ];
  } else {
    // 4-2-3-1 Pressing
    return [
      { top: "90%", left: "50%" }, // GK
      { top: "75%", left: "20%" }, { top: "75%", left: "40%" }, { top: "75%", left: "60%" }, { top: "75%", left: "80%" }, // DF
      { top: "60%", left: "35%" }, { top: "60%", left: "65%" }, // DMF
      { top: "40%", left: "20%" }, { top: "40%", left: "50%" }, { top: "40%", left: "80%" }, // AMF
      { top: "15%", left: "50%" } // ST
    ];
  }
};

export default function AIMatchCoach() {
  const [oppStyle, setOppStyle] = useState(OPPONENT_STYLES.HIGH_PRESS);
  const [oppStrength, setOppStrength] = useState([75]);
  const [myTactic, setMyTactic] = useState(TACTICS.COUNTER);
  const [myFormation, setMyFormation] = useState("4-4-2");
  const [matchResult, setMatchResult] = useState<null | { myScore: number, oppScore: number }>(null);
  const [activeTab, setActiveTab] = useState("overview");

  // Calculate Best XI based on tactic
  const scoredPlayers = PLAYERS_DATA.map(p => {
    let score = 0;
    if (myTactic === TACTICS.COUNTER) score = (p.speed * 0.7 + p.finishing * 0.3);
    else if (myTactic === TACTICS.POSSESSION) score = (p.passing * 0.8 + p.speed * 0.2);
    else score = (p.speed * 0.4 + p.passing * 0.3 + p.stamina * 0.3);
    return { ...p, score: score.toFixed(1) };
  }).sort((a, b) => Number(b.score) - Number(a.score)).slice(0, 11);

  const advice = getAIAdvice(oppStyle, myTactic);
  const positions = getFormationPositions(myTactic);
  const weaknessAnalysis = analyzeOpponentWeaknesses();
  const formationCounters = getFormationCounters(OPPONENT_TEAM.formation);
  const optimizedPlayers = optimizePlayerRoles(myTactic);
  const aiCommentary = generateAICommentary(oppStyle, myTactic, myFormation);

  const simulateMatch = () => {
    let myExpGoals = 1.8;
    let oppExpGoals = 1.2;

    // Apply modifiers
    if (advice.type === "success") { myExpGoals *= 1.4; oppExpGoals *= 0.8; }
    if (advice.type === "warning" || advice.type === "destructive") { myExpGoals *= 0.8; oppExpGoals *= 1.2; }
    
    // Simple Poisson Simulation approximation for JS
    const poisson = (lambda: number) => {
      let L = Math.exp(-lambda), k = 0, p = 1;
      do { k++; p *= Math.random(); } while (p > L);
      return k - 1;
    };

    setMatchResult({
      myScore: poisson(myExpGoals),
      oppScore: poisson(oppExpGoals)
    });
  };

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Brain className="text-orange-500" /> AI Tactical Analyst
        </h1>
        <Badge variant="secondary" className="flex items-center gap-1">
          <Sparkles className="h-4 w-4" />
          Enhanced AI
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="weakness">Weakness Finder</TabsTrigger>
          <TabsTrigger value="formation">Formation Counter</TabsTrigger>
          <TabsTrigger value="players">Player Optimizer</TabsTrigger>
          <TabsTrigger value="history">Historical Data</TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Settings Column */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Match Setup</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Opponent Style</label>
                    <Select value={oppStyle} onValueChange={setOppStyle}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.values(OPPONENT_STYLES).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Opponent Strength: {oppStrength[0]}</label>
                    <Slider value={oppStrength} onValueChange={setOppStrength} min={50} max={100} step={5} />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Your Tactic</label>
                    <Select value={myTactic} onValueChange={setMyTactic}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.values(TACTICS).map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Your Formation</label>
                    <Select value={myFormation} onValueChange={setMyFormation}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.values(FORMATIONS).map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Alert variant={advice.type as any}>
                <Brain className="h-4 w-4" />
                <AlertTitle>AI Tactical Advice</AlertTitle>
                <AlertDescription>{advice.msg}</AlertDescription>
              </Alert>

              {/* AI Commentary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-orange-500" />
                    AI Commentary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {aiCommentary.map((comment, idx) => (
                    <div key={idx} className="flex items-start gap-2 p-3 bg-muted rounded-lg">
                      {comment.type === "positive" && <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />}
                      {comment.type === "warning" && <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />}
                      {comment.type === "insight" && <Zap className="h-5 w-5 text-blue-500 mt-0.5" />}
                      {comment.type === "formation" && <Shield className="h-5 w-5 text-purple-500 mt-0.5" />}
                      <p className="text-sm">{comment.text}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Button onClick={simulateMatch} className="w-full" size="lg">
                <Trophy className="mr-2" /> Simulate Match
              </Button>

              {matchResult && (
                <Card>
                  <CardHeader>
                    <CardTitle>Match Result</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="text-5xl font-bold mb-2">
                        {matchResult.myScore} - {matchResult.oppScore}
                      </div>
                      <div className="text-muted-foreground">
                        {matchResult.myScore > matchResult.oppScore ? "🎉 Victory!" : 
                         matchResult.myScore === matchResult.oppScore ? "⚖️ Draw" : "😔 Defeat"}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Visualization Column */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shirt /> Best XI (by {myTactic})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative bg-green-600 rounded-lg h-[500px] border-4 border-white">
                    {scoredPlayers.map((p, i) => (
                      <div
                        key={p.id}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2"
                        style={{ top: positions[i].top, left: positions[i].left }}
                      >
                        <div className="bg-orange-500 text-white rounded-full w-12 h-12 flex items-center justify-center text-xs font-bold shadow-lg">
                          {p.name.split(" ")[0].slice(0, 3)}
                        </div>
                        <div className="text-white text-xs text-center mt-1 font-semibold bg-black/50 px-1 rounded">
                          {p.score}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* WEAKNESS FINDER TAB */}
        <TabsContent value="weakness" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-red-500" />
                Opposition Weakness Analysis
              </CardTitle>
              <CardDescription>AI-powered analysis of {OPPONENT_TEAM.name}'s vulnerabilities</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-red-50 dark:bg-red-950/20 border-red-200">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-red-600">{weaknessAnalysis.percentage}%</div>
                      <div className="text-sm text-muted-foreground mt-2">Goals from Right Side</div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-orange-50 dark:bg-orange-950/20 border-orange-200">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">{weaknessAnalysis.slowestDefender.name}</div>
                      <div className="text-sm text-muted-foreground mt-2">Slowest Defender</div>
                      <Badge variant="secondary" className="mt-2">Speed: {weaknessAnalysis.slowestDefender.speed}</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-blue-600">{OPPONENT_TEAM.avgGoalsConceded}</div>
                      <div className="text-sm text-muted-foreground mt-2">Avg Goals Conceded</div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  Tactical Recommendations
                </h3>
                <div className="space-y-2">
                  {weaknessAnalysis.recommendations.map((rec, idx) => (
                    <div key={idx} className="flex items-start gap-2 p-3 bg-muted rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Recent Match Analysis</h3>
                <div className="space-y-2">
                  {OPPONENT_TEAM.recentMatches.map((match, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant={match.result === "W" ? "default" : match.result === "D" ? "secondary" : "destructive"}>
                          {match.result}
                        </Badge>
                        <span className="text-sm">vs {match.opponent}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">{match.goalsAgainst} goals</span>
                        <Badge variant="outline">{match.weakSide} side</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Defensive Vulnerabilities</h3>
                <div className="space-y-2">
                  {OPPONENT_TEAM.weaknesses.map((weakness, idx) => (
                    <div key={idx} className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200">
                      <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{weakness}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* FORMATION COUNTER TAB */}
        <TabsContent value="formation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-500" />
                Formation Counter Suggestions
              </CardTitle>
              <CardDescription>Best formations to counter {OPPONENT_TEAM.name}'s {OPPONENT_TEAM.formation}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {formationCounters.map((counter, idx) => (
                <Card key={idx} className={idx === 0 ? "border-2 border-green-500" : ""}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-2xl font-bold">{counter.formation}</h3>
                          {idx === 0 && <Badge variant="default">Recommended</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">{counter.tactics}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-green-600">{counter.success}%</div>
                        <div className="text-xs text-muted-foreground">Success Rate</div>
                      </div>
                    </div>
                    
                    <Progress value={counter.success} className="mb-3" />
                    
                    <div className="flex items-start gap-2 p-3 bg-muted rounded-lg">
                      <TrendingUp className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-semibold text-sm mb-1">Why it works:</div>
                        <p className="text-sm text-muted-foreground">{counter.reason}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* PLAYER OPTIMIZER TAB */}
        <TabsContent value="players" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-500" />
                Player Role Optimizer
              </CardTitle>
              <CardDescription>Optimized player positions based on opponent weaknesses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {optimizedPlayers.map((player, idx) => (
                  <Card key={player.id} className={
                    player.advantage === "High" ? "border-2 border-green-500" : 
                    player.advantage === "Medium" ? "border-2 border-yellow-500" : ""
                  }>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="text-2xl font-bold text-muted-foreground">#{idx + 1}</div>
                          <div>
                            <div className="font-semibold">{player.name}</div>
                            <div className="text-sm text-muted-foreground">{player.role}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={
                            player.advantage === "High" ? "default" : 
                            player.advantage === "Medium" ? "secondary" : "outline"
                          }>
                            {player.advantage} Advantage
                          </Badge>
                          <div className="text-sm text-muted-foreground mt-1">Match-up: {player.matchupScore}/100</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-2 mb-3">
                        <div className="text-center p-2 bg-muted rounded">
                          <div className="text-xs text-muted-foreground">Speed</div>
                          <div className="font-bold">{player.speed}</div>
                        </div>
                        <div className="text-center p-2 bg-muted rounded">
                          <div className="text-xs text-muted-foreground">Passing</div>
                          <div className="font-bold">{player.passing}</div>
                        </div>
                        <div className="text-center p-2 bg-muted rounded">
                          <div className="text-xs text-muted-foreground">Finishing</div>
                          <div className="font-bold">{player.finishing}</div>
                        </div>
                        <div className="text-center p-2 bg-muted rounded">
                          <div className="text-xs text-muted-foreground">Stamina</div>
                          <div className="font-bold">{player.stamina}</div>
                        </div>
                      </div>

                      {player.recommendation && (
                        <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200">
                          <Sparkles className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                          <div className="text-sm">
                            <span className="font-semibold">AI Recommendation: </span>
                            {player.recommendation}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* HISTORICAL DATA TAB */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-indigo-500" />
                Historical Performance
              </CardTitle>
              <CardDescription>Similar tactical matchups from past matches</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {HISTORICAL_MATCHES.map((match, idx) => (
                  <Card key={idx} className={match.success ? "border-2 border-green-500" : "border-2 border-gray-300"}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="font-semibold">{match.opponent}</div>
                          <div className="text-sm text-muted-foreground">{match.date}</div>
                        </div>
                        <Badge variant={match.success ? "default" : "secondary"}>
                          {match.result}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-3 gap-3 text-sm">
                        <div>
                          <div className="text-muted-foreground mb-1">My Formation</div>
                          <div className="font-semibold">{match.myFormation}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground mb-1">Opp Formation</div>
                          <div className="font-semibold">{match.oppFormation}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground mb-1">My Tactic</div>
                          <div className="font-semibold">{match.myTactic}</div>
                        </div>
                      </div>

                      {match.success && (
                        <div className="flex items-center gap-2 mt-3 p-2 bg-green-50 dark:bg-green-950/20 rounded border border-green-200">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm text-green-700 dark:text-green-400">Successful tactical approach - consider replicating</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="mt-6 p-4 bg-muted rounded-lg">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                  Pattern Analysis
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Success rate with 4-3-3:</span>
                    <span className="font-bold text-green-600">100%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Success rate with Counter-Attack:</span>
                    <span className="font-bold text-green-600">100%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Success rate vs 4-4-2:</span>
                    <span className="font-bold text-green-600">67%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
