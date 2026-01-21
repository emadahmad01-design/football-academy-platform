import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, MapPin, Users, TrendingUp, Zap } from "lucide-react";

interface PlayerTrackingData {
  players: {
    id: number;
    teamId: number;
    positions: { x: number; y: number; timestamp: number; playerId: number; teamId: number }[];
    totalDistance: number;
    topSpeed: number;
    averagePosition: { x: number; y: number };
  }[];
  passes: {
    from: number;
    to: number;
    timestamp: number;
    success: boolean;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  }[];
  formation: {
    team1: string;
    team2: string;
  };
  possession: {
    team1: number;
    team2: number;
  };
  heatmaps: {
    playerId: number;
    data: { x: number; y: number; intensity: number }[];
  }[];
  passingNetwork: {
    teamId: number;
    nodes: { playerId: number; x: number; y: number; touches: number }[];
    edges: { from: number; to: number; passes: number; accuracy: number }[];
  }[];
}

interface PlayerTrackingVisualizationProps {
  trackingData: PlayerTrackingData;
}

export default function PlayerTrackingVisualization({ trackingData }: PlayerTrackingVisualizationProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<number>(1);

  const renderPitch = (children: React.ReactNode) => (
    <div className="relative w-full aspect-[2/3] bg-green-700 rounded-lg overflow-hidden">
      {/* Pitch markings */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 150">
        {/* Outer lines */}
        <rect x="2" y="2" width="96" height="146" fill="none" stroke="white" strokeWidth="0.3" />
        
        {/* Center line */}
        <line x1="2" y1="75" x2="98" y2="75" stroke="white" strokeWidth="0.3" />
        
        {/* Center circle */}
        <circle cx="50" cy="75" r="9" fill="none" stroke="white" strokeWidth="0.3" />
        <circle cx="50" cy="75" r="0.5" fill="white" />
        
        {/* Penalty areas */}
        <rect x="20" y="2" width="60" height="16" fill="none" stroke="white" strokeWidth="0.3" />
        <rect x="20" y="132" width="60" height="16" fill="none" stroke="white" strokeWidth="0.3" />
        
        {/* Goal areas */}
        <rect x="35" y="2" width="30" height="6" fill="none" stroke="white" strokeWidth="0.3" />
        <rect x="35" y="142" width="30" height="6" fill="none" stroke="white" strokeWidth="0.3" />
        
        {/* Goals */}
        <rect x="45" y="0" width="10" height="2" fill="none" stroke="white" strokeWidth="0.3" />
        <rect x="45" y="148" width="10" height="2" fill="none" stroke="white" strokeWidth="0.3" />
      </svg>
      
      {children}
    </div>
  );

  const renderHeatmap = (playerId: number) => {
    const heatmap = trackingData.heatmaps.find(h => h.playerId === playerId);
    if (!heatmap) return null;

    return (
      <div className="absolute inset-0">
        {heatmap.data.map((point, idx) => (
          <div
            key={idx}
            className="absolute rounded-full"
            style={{
              left: `${point.x}%`,
              top: `${point.y}%`,
              width: '8%',
              height: '5%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: `rgba(255, 0, 0, ${point.intensity * 0.4})`,
              filter: 'blur(8px)',
            }}
          />
        ))}
      </div>
    );
  };

  const renderPlayerPositions = () => {
    return trackingData.players
      .filter(p => !selectedPlayer || p.id === selectedPlayer)
      .map(player => {
        const avgPos = player.averagePosition;
        const color = player.teamId === 1 ? 'bg-blue-500' : 'bg-red-500';
        
        return (
          <div
            key={player.id}
            className={`absolute w-6 h-6 ${color} rounded-full border-2 border-white cursor-pointer hover:scale-125 transition-transform flex items-center justify-center text-white text-xs font-bold`}
            style={{
              left: `${avgPos.x}%`,
              top: `${avgPos.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
            onClick={() => setSelectedPlayer(player.id === selectedPlayer ? null : player.id)}
          >
            {player.id}
          </div>
        );
      });
  };

  const renderPassingNetwork = (teamId: number) => {
    const network = trackingData.passingNetwork.find(n => n.teamId === teamId);
    if (!network) return null;

    return (
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 150">
        {/* Draw edges (passes) */}
        {network.edges.map((edge, idx) => {
          const fromNode = network.nodes.find(n => n.playerId === edge.from);
          const toNode = network.nodes.find(n => n.playerId === edge.to);
          if (!fromNode || !toNode) return null;

          const opacity = edge.accuracy * 0.6;
          const strokeWidth = Math.max(0.2, edge.passes / 5);

          return (
            <line
              key={idx}
              x1={fromNode.x}
              y1={fromNode.y}
              x2={toNode.x}
              y2={toNode.y}
              stroke={teamId === 1 ? '#3b82f6' : '#ef4444'}
              strokeWidth={strokeWidth}
              opacity={opacity}
            />
          );
        })}
        
        {/* Draw nodes (players) */}
        {network.nodes.map((node, idx) => (
          <g key={idx}>
            <circle
              cx={node.x}
              cy={node.y}
              r={Math.max(2, node.touches / 5)}
              fill={teamId === 1 ? '#3b82f6' : '#ef4444'}
              opacity="0.8"
            />
            <text
              x={node.x}
              y={node.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="white"
              fontSize="3"
              fontWeight="bold"
            >
              {node.playerId}
            </text>
          </g>
        ))}
      </svg>
    );
  };

  const team1Players = trackingData.players.filter(p => p.teamId === 1);
  const team2Players = trackingData.players.filter(p => p.teamId === 2);

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-slate-400 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Formation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-blue-400 text-sm">Team 1:</span>
                <Badge variant="outline" className="border-blue-500 text-blue-400">
                  {trackingData.formation.team1}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-red-400 text-sm">Team 2:</span>
                <Badge variant="outline" className="border-red-500 text-red-400">
                  {trackingData.formation.team2}
                </Badge>
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
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-blue-400">Team 1</span>
                  <span className="text-white font-bold">{trackingData.possession.team1}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${trackingData.possession.team1}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-red-400">Team 2</span>
                  <span className="text-white font-bold">{trackingData.possession.team2}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-red-500 h-2 rounded-full"
                    style={{ width: `${trackingData.possession.team2}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-slate-400 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Total Passes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{trackingData.passes.length}</div>
            <div className="text-sm text-slate-400 mt-1">
              {trackingData.passes.filter(p => p.success).length} successful
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-slate-400 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Avg Distance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {Math.round(trackingData.players.reduce((sum, p) => sum + p.totalDistance, 0) / trackingData.players.length)}m
            </div>
            <div className="text-sm text-slate-400 mt-1">per player</div>
          </CardContent>
        </Card>
      </div>

      {/* Visualization Tabs */}
      <Tabs defaultValue="heatmap" className="w-full">
        <TabsList className="bg-slate-800 border-slate-700">
          <TabsTrigger value="heatmap">Player Heatmaps</TabsTrigger>
          <TabsTrigger value="passing">Passing Network</TabsTrigger>
          <TabsTrigger value="positions">Average Positions</TabsTrigger>
        </TabsList>

        <TabsContent value="heatmap" className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {trackingData.players.slice(0, 11).map(player => (
              <button
                key={player.id}
                onClick={() => setSelectedPlayer(player.id === selectedPlayer ? null : player.id)}
                className={`px-3 py-1 rounded text-sm ${
                  selectedPlayer === player.id
                    ? player.teamId === 1
                      ? 'bg-blue-600 text-white'
                      : 'bg-red-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                Player {player.id}
              </button>
            ))}
          </div>
          
          {renderPitch(
            <>
              {selectedPlayer && renderHeatmap(selectedPlayer)}
              {renderPlayerPositions()}
            </>
          )}
        </TabsContent>

        <TabsContent value="passing" className="space-y-4">
          <div className="flex gap-4">
            <button
              onClick={() => setSelectedTeam(1)}
              className={`px-4 py-2 rounded ${
                selectedTeam === 1 ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'
              }`}
            >
              Team 1
            </button>
            <button
              onClick={() => setSelectedTeam(2)}
              className={`px-4 py-2 rounded ${
                selectedTeam === 2 ? 'bg-red-600 text-white' : 'bg-slate-700 text-slate-300'
              }`}
            >
              Team 2
            </button>
          </div>
          
          {renderPitch(renderPassingNetwork(selectedTeam))}
        </TabsContent>

        <TabsContent value="positions">
          {renderPitch(renderPlayerPositions())}
        </TabsContent>
      </Tabs>

      {/* Player Stats Table */}
      {selectedPlayer && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">
              Player {selectedPlayer} Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const player = trackingData.players.find(p => p.id === selectedPlayer);
              if (!player) return null;

              return (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm text-slate-400">Total Distance</div>
                    <div className="text-xl font-bold text-white">{Math.round(player.totalDistance)}m</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-400">Top Speed</div>
                    <div className="text-xl font-bold text-white">{player.topSpeed.toFixed(1)} km/h</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-400">Avg Position X</div>
                    <div className="text-xl font-bold text-white">{player.averagePosition.x.toFixed(1)}%</div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-400">Avg Position Y</div>
                    <div className="text-xl font-bold text-white">{player.averagePosition.y.toFixed(1)}%</div>
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
