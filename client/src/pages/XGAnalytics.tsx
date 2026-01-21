import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, Target, TrendingUp, Activity, Zap, 
  Download, Filter, BarChart3, PieChart, MapPin 
} from "lucide-react";

// Mock data - in production, this would come from the backend
const mockMatchData = {
  matchId: 1,
  homeTeam: "Future Stars FC U16",
  awayTeam: "Elite Academy U16",
  date: "2025-12-20",
  score: { home: 2, away: 1 },
  shots: [
    { id: 1, teamId: 1, playerId: 5, playerName: "Ahmed Hassan", x: 85, y: 45, xG: 0.32, isGoal: true, minute: 15 },
    { id: 2, teamId: 1, playerId: 10, playerName: "Mohamed Salah Jr", x: 75, y: 30, xG: 0.15, isGoal: false, minute: 22 },
    { id: 3, teamId: 2, playerId: 15, playerName: "Opponent Player", x: 20, y: 50, xG: 0.45, isGoal: true, minute: 35 },
    { id: 4, teamId: 1, playerId: 7, playerName: "Omar Ali", x: 90, y: 55, xG: 0.65, isGoal: true, minute: 58 },
    { id: 5, teamId: 2, playerId: 18, playerName: "Opponent Player 2", x: 15, y: 40, xG: 0.22, isGoal: false, minute: 67 },
    { id: 6, teamId: 1, playerId: 10, playerName: "Mohamed Salah Jr", x: 80, y: 60, xG: 0.18, isGoal: false, minute: 75 },
    { id: 7, teamId: 2, playerId: 16, playerName: "Opponent Player 3", x: 25, y: 35, xG: 0.28, isGoal: false, minute: 82 },
  ],
  passes: [
    { id: 1, teamId: 1, from: 5, to: 10, fromName: "Ahmed Hassan", toName: "Mohamed Salah Jr", x1: 60, y1: 40, x2: 75, y2: 30, xA: 0.12, success: true },
    { id: 2, teamId: 1, from: 10, to: 7, fromName: "Mohamed Salah Jr", toName: "Omar Ali", x1: 75, y1: 30, x2: 85, y2: 45, xA: 0.28, success: true },
    { id: 3, teamId: 2, from: 15, to: 18, fromName: "Opponent", toName: "Opponent 2", x1: 40, y1: 50, x2: 20, y2: 50, xA: 0.35, success: true },
  ],
  defensiveActions: [
    { id: 1, teamId: 1, playerId: 3, playerName: "Defender 1", type: "tackle", x: 35, y: 45, success: true, minute: 12 },
    { id: 2, teamId: 1, playerId: 4, playerName: "Defender 2", type: "interception", x: 40, y: 55, success: true, minute: 28 },
    { id: 3, teamId: 2, playerId: 20, playerName: "Opp Defender", type: "block", x: 65, y: 50, success: true, minute: 45 },
  ],
  teamStats: {
    home: {
      xG: 1.30,
      actualGoals: 2,
      shots: 4,
      shotsOnTarget: 3,
      passAccuracy: 82,
      possession: 58,
    },
    away: {
      xG: 0.95,
      actualGoals: 1,
      shots: 3,
      shotsOnTarget: 2,
      passAccuracy: 76,
      possession: 42,
    }
  },
  playerStats: [
    { playerId: 5, name: "Ahmed Hassan", xG: 0.32, xA: 0.12, shots: 1, keyPasses: 2, touches: 45 },
    { playerId: 10, name: "Mohamed Salah Jr", xG: 0.33, xA: 0.28, shots: 2, keyPasses: 3, touches: 52 },
    { playerId: 7, name: "Omar Ali", xG: 0.65, xA: 0.05, shots: 1, keyPasses: 1, touches: 38 },
  ]
};

export default function XGAnalytics() {
  const [selectedTeam, setSelectedTeam] = useState<number>(1);
  const [selectedView, setSelectedView] = useState<'shots' | 'passes' | 'defensive'>('shots');

  const renderPitch = (children: React.ReactNode) => (
    <div className="relative w-full aspect-[2/3] bg-green-700 rounded-lg overflow-hidden">
      {/* Pitch markings */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 150">
        {/* Outer lines */}
        <rect x="2" y="2" width="96" height="146" fill="none" stroke="white" strokeWidth="0.3" opacity="0.6" />
        
        {/* Center line */}
        <line x1="2" y1="75" x2="98" y2="75" stroke="white" strokeWidth="0.3" opacity="0.6" />
        
        {/* Center circle */}
        <circle cx="50" cy="75" r="9" fill="none" stroke="white" strokeWidth="0.3" opacity="0.6" />
        
        {/* Penalty areas */}
        <rect x="20" y="2" width="60" height="16" fill="none" stroke="white" strokeWidth="0.3" opacity="0.6" />
        <rect x="20" y="132" width="60" height="16" fill="none" stroke="white" strokeWidth="0.3" opacity="0.6" />
        
        {/* Goal areas */}
        <rect x="35" y="2" width="30" height="6" fill="none" stroke="white" strokeWidth="0.3" opacity="0.6" />
        <rect x="35" y="142" width="30" height="6" fill="none" stroke="white" strokeWidth="0.3" opacity="0.6" />
      </svg>
      
      {children}
    </div>
  );

  const renderShotMap = () => {
    const filteredShots = mockMatchData.shots.filter(s => s.teamId === selectedTeam);
    
    return renderPitch(
      <div className="absolute inset-0">
        {filteredShots.map(shot => {
          const size = 20 + shot.xG * 30; // Larger circles for higher xG
          const color = shot.isGoal ? '#22c55e' : '#ef4444';
          
          return (
            <div
              key={shot.id}
              className="absolute group cursor-pointer"
              style={{
                left: `${shot.x}%`,
                top: `${shot.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <div
                className="rounded-full border-2 border-white transition-transform hover:scale-125"
                style={{
                  width: `${size}px`,
                  height: `${size}px`,
                  backgroundColor: color,
                  opacity: 0.7,
                }}
              />
              
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-slate-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                <div className="font-bold">{shot.playerName}</div>
                <div>xG: {shot.xG.toFixed(2)}</div>
                <div>{shot.isGoal ? '⚽ Goal' : '❌ Miss'}</div>
                <div>{shot.minute}'</div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderPassMap = () => {
    const filteredPasses = mockMatchData.passes.filter(p => p.teamId === selectedTeam);
    
    return renderPitch(
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 150">
        {filteredPasses.map(pass => {
          const opacity = pass.success ? 0.8 : 0.3;
          const color = pass.success ? '#3b82f6' : '#ef4444';
          const strokeWidth = 0.5 + pass.xA * 2;
          
          return (
            <g key={pass.id}>
              {/* Pass line */}
              <line
                x1={pass.x1}
                y1={pass.y1}
                x2={pass.x2}
                y2={pass.y2}
                stroke={color}
                strokeWidth={strokeWidth}
                opacity={opacity}
                markerEnd="url(#arrowhead)"
              />
              
              {/* Start point */}
              <circle cx={pass.x1} cy={pass.y1} r="1.5" fill={color} opacity={opacity} />
              
              {/* End point */}
              <circle cx={pass.x2} cy={pass.y2} r="1.5" fill={color} opacity={opacity} />
            </g>
          );
        })}
        
        {/* Arrow marker definition */}
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#3b82f6" />
          </marker>
        </defs>
      </svg>
    );
  };

  const renderDefensiveMap = () => {
    const filteredActions = mockMatchData.defensiveActions.filter(a => a.teamId === selectedTeam);
    
    return renderPitch(
      <div className="absolute inset-0">
        {filteredActions.map(action => {
          const colors: Record<string, string> = {
            tackle: '#f59e0b',
            interception: '#3b82f6',
            block: '#ef4444',
          };
          const icons: Record<string, string> = {
            tackle: '🦵',
            interception: '✋',
            block: '🛡️',
          };
          
          return (
            <div
              key={action.id}
              className="absolute group cursor-pointer"
              style={{
                left: `${action.x}%`,
                top: `${action.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <div
                className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-lg transition-transform hover:scale-125"
                style={{
                  backgroundColor: colors[action.type],
                  opacity: action.success ? 0.9 : 0.4,
                }}
              >
                {icons[action.type]}
              </div>
              
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-slate-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                <div className="font-bold">{action.playerName}</div>
                <div className="capitalize">{action.type}</div>
                <div>{action.success ? '✓ Success' : '✗ Failed'}</div>
                <div>{action.minute}'</div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const homeXG = mockMatchData.teamStats.home.xG;
  const awayXG = mockMatchData.teamStats.away.xG;
  const homeGoals = mockMatchData.teamStats.home.actualGoals;
  const awayGoals = mockMatchData.teamStats.away.actualGoals;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-navy-900 to-slate-900">
      {/* Header */}
      <header className="bg-slate-800/50 border-b border-slate-700 sticky top-0 z-10 backdrop-blur-sm">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm" className="text-slate-300">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-white">xG Analytics Dashboard</h1>
                <p className="text-slate-400 text-sm">Expected Goals & Advanced Statistics</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="border-slate-600 text-slate-300">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>
      </header>

      <div className="container py-8 space-y-6">
        {/* Match Header */}
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div className="text-center flex-1">
                <div className="text-2xl font-bold text-white mb-2">{mockMatchData.homeTeam}</div>
                <div className="text-4xl font-bold text-emerald-500">{homeGoals}</div>
                <div className="text-sm text-slate-400 mt-2">xG: {homeXG.toFixed(2)}</div>
              </div>
              
              <div className="text-center px-8">
                <div className="text-slate-400 text-sm mb-2">{mockMatchData.date}</div>
                <div className="text-2xl font-bold text-white">VS</div>
              </div>
              
              <div className="text-center flex-1">
                <div className="text-2xl font-bold text-white mb-2">{mockMatchData.awayTeam}</div>
                <div className="text-4xl font-bold text-red-500">{awayGoals}</div>
                <div className="text-sm text-slate-400 mt-2">xG: {awayXG.toFixed(2)}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team Stats Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-slate-400 flex items-center gap-2">
                <Target className="w-4 h-4" />
                Shots
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{mockMatchData.teamStats.home.shots}</div>
                  <div className="text-xs text-slate-400">{mockMatchData.teamStats.home.shotsOnTarget} on target</div>
                </div>
                <div className="text-slate-500">vs</div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{mockMatchData.teamStats.away.shots}</div>
                  <div className="text-xs text-slate-400">{mockMatchData.teamStats.away.shotsOnTarget} on target</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-slate-400 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Possession
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white">{mockMatchData.teamStats.home.possession}%</span>
                  <span className="text-white">{mockMatchData.teamStats.away.possession}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-3 flex overflow-hidden">
                  <div
                    className="bg-emerald-500"
                    style={{ width: `${mockMatchData.teamStats.home.possession}%` }}
                  />
                  <div
                    className="bg-red-500"
                    style={{ width: `${mockMatchData.teamStats.away.possession}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-slate-400 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Pass Accuracy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{mockMatchData.teamStats.home.passAccuracy}%</div>
                </div>
                <div className="text-slate-500">vs</div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{mockMatchData.teamStats.away.passAccuracy}%</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Visualization Section */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">Match Visualization</CardTitle>
              <div className="flex gap-2">
                <Select value={selectedTeam.toString()} onValueChange={(v) => setSelectedTeam(parseInt(v))}>
                  <SelectTrigger className="w-48 bg-slate-700 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="1">{mockMatchData.homeTeam}</SelectItem>
                    <SelectItem value="2">{mockMatchData.awayTeam}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedView} onValueChange={(v) => setSelectedView(v as any)}>
              <TabsList className="bg-slate-700 border-slate-600">
                <TabsTrigger value="shots">Shot Map</TabsTrigger>
                <TabsTrigger value="passes">Pass Map</TabsTrigger>
                <TabsTrigger value="defensive">Defensive Actions</TabsTrigger>
              </TabsList>

              <div className="mt-6">
                <TabsContent value="shots" className="m-0">
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-green-500" />
                        <span className="text-slate-300">Goal</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-red-500" />
                        <span className="text-slate-300">Miss</span>
                      </div>
                      <div className="text-slate-400 ml-4">
                        Circle size = xG value
                      </div>
                    </div>
                    {renderShotMap()}
                  </div>
                </TabsContent>

                <TabsContent value="passes" className="m-0">
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-0.5 bg-blue-500" />
                        <span className="text-slate-300">Successful Pass</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-0.5 bg-red-500" />
                        <span className="text-slate-300">Failed Pass</span>
                      </div>
                      <div className="text-slate-400 ml-4">
                        Line thickness = xA value
                      </div>
                    </div>
                    {renderPassMap()}
                  </div>
                </TabsContent>

                <TabsContent value="defensive" className="m-0">
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center">🦵</div>
                        <span className="text-slate-300">Tackle</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">✋</div>
                        <span className="text-slate-300">Interception</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">🛡️</div>
                        <span className="text-slate-300">Block</span>
                      </div>
                    </div>
                    {renderDefensiveMap()}
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>

        {/* Player Stats Table */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Player Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Player</th>
                    <th className="text-center py-3 px-4 text-slate-400 font-medium">xG</th>
                    <th className="text-center py-3 px-4 text-slate-400 font-medium">xA</th>
                    <th className="text-center py-3 px-4 text-slate-400 font-medium">Shots</th>
                    <th className="text-center py-3 px-4 text-slate-400 font-medium">Key Passes</th>
                    <th className="text-center py-3 px-4 text-slate-400 font-medium">Touches</th>
                  </tr>
                </thead>
                <tbody>
                  {mockMatchData.playerStats.map(player => (
                    <tr key={player.playerId} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                      <td className="py-3 px-4 text-white font-medium">{player.name}</td>
                      <td className="py-3 px-4 text-center text-emerald-400 font-bold">{player.xG.toFixed(2)}</td>
                      <td className="py-3 px-4 text-center text-blue-400 font-bold">{player.xA.toFixed(2)}</td>
                      <td className="py-3 px-4 text-center text-slate-300">{player.shots}</td>
                      <td className="py-3 px-4 text-center text-slate-300">{player.keyPasses}</td>
                      <td className="py-3 px-4 text-center text-slate-300">{player.touches}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
