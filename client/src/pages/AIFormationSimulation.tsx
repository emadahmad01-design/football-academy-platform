import { useState, useEffect, useRef } from 'react';
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { DashboardLayoutSkeleton } from "@/components/DashboardLayoutSkeleton";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { useLocation } from 'wouter';
import { Play, Pause, RotateCcw, Sparkles, Loader2, FastForward, Rewind, GitCompare, Download } from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';
import jsPDF from 'jspdf';

type Formation = '4-3-3' | '4-4-2' | '3-5-2' | '4-2-3-1';
type TacticalScenario = 'attack' | 'defense' | 'counter' | 'possession';

interface Player {
  id: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  team: 'home' | 'away';
  number: number;
  label: string;
  role: string;
}

interface MovementKeyframe {
  time: number;
  description: string;
  players: { id: string; x: number; y: number }[];
}

export default function AIFormationSimulation() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const canvasRef1 = useRef<HTMLCanvasElement>(null);
  const canvasRef2 = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  
  const [comparisonMode, setComparisonMode] = useState(false);
  
  // Formation 1 (left side)
  const [formation1, setFormation1] = useState<Formation>('4-3-3');
  const [scenario1, setScenario1] = useState<TacticalScenario>('attack');
  const [players1, setPlayers1] = useState<Player[]>([]);
  const [keyframes1, setKeyframes1] = useState<MovementKeyframe[]>([]);
  const [description1, setDescription1] = useState('');
  
  // Formation 2 (right side - for comparison)
  const [formation2, setFormation2] = useState<Formation>('4-4-2');
  const [scenario2, setScenario2] = useState<TacticalScenario>('attack');
  const [players2, setPlayers2] = useState<Player[]>([]);
  const [keyframes2, setKeyframes2] = useState<MovementKeyframe[]>([]);
  const [description2, setDescription2] = useState('');
  
  // Shared controls
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [comparisonInsights, setComparisonInsights] = useState('');

  const { data: teams } = trpc.teams.getAll.useQuery();

  if (authLoading) return <DashboardLayoutSkeleton />;
  if (!user) {
    setLocation("/");
    return null;
  }

  const CANVAS_WIDTH = comparisonMode ? 600 : 1200;
  const CANVAS_HEIGHT = 800;
  const PLAYER_RADIUS = 20;
  const FPS = 30;

  const getInitialPositions = (formation: Formation): Player[] => {
    const positions: { x: number; y: number; label: string; role: string }[] = [];
    const width = comparisonMode ? 600 : 1200;
    
    switch (formation) {
      case '4-3-3':
        positions.push({ x: width * 0.08, y: 400, label: 'GK', role: 'Goalkeeper' });
        positions.push({ x: width * 0.21, y: 150, label: 'LB', role: 'Left Back' });
        positions.push({ x: width * 0.21, y: 300, label: 'CB', role: 'Center Back' });
        positions.push({ x: width * 0.21, y: 500, label: 'CB', role: 'Center Back' });
        positions.push({ x: width * 0.21, y: 650, label: 'RB', role: 'Right Back' });
        positions.push({ x: width * 0.38, y: 200, label: 'CM', role: 'Central Midfielder' });
        positions.push({ x: width * 0.38, y: 400, label: 'CM', role: 'Central Midfielder' });
        positions.push({ x: width * 0.38, y: 600, label: 'CM', role: 'Central Midfielder' });
        positions.push({ x: width * 0.54, y: 150, label: 'LW', role: 'Left Winger' });
        positions.push({ x: width * 0.54, y: 400, label: 'ST', role: 'Striker' });
        positions.push({ x: width * 0.54, y: 650, label: 'RW', role: 'Right Winger' });
        break;
      case '4-4-2':
        positions.push({ x: width * 0.08, y: 400, label: 'GK', role: 'Goalkeeper' });
        positions.push({ x: width * 0.21, y: 150, label: 'LB', role: 'Left Back' });
        positions.push({ x: width * 0.21, y: 300, label: 'CB', role: 'Center Back' });
        positions.push({ x: width * 0.21, y: 500, label: 'CB', role: 'Center Back' });
        positions.push({ x: width * 0.21, y: 650, label: 'RB', role: 'Right Back' });
        positions.push({ x: width * 0.38, y: 150, label: 'LM', role: 'Left Midfielder' });
        positions.push({ x: width * 0.38, y: 300, label: 'CM', role: 'Central Midfielder' });
        positions.push({ x: width * 0.38, y: 500, label: 'CM', role: 'Central Midfielder' });
        positions.push({ x: width * 0.38, y: 650, label: 'RM', role: 'Right Midfielder' });
        positions.push({ x: width * 0.54, y: 300, label: 'ST', role: 'Striker' });
        positions.push({ x: width * 0.54, y: 500, label: 'ST', role: 'Striker' });
        break;
      case '3-5-2':
        positions.push({ x: width * 0.08, y: 400, label: 'GK', role: 'Goalkeeper' });
        positions.push({ x: width * 0.21, y: 200, label: 'CB', role: 'Center Back' });
        positions.push({ x: width * 0.21, y: 400, label: 'CB', role: 'Center Back' });
        positions.push({ x: width * 0.21, y: 600, label: 'CB', role: 'Center Back' });
        positions.push({ x: width * 0.38, y: 100, label: 'LM', role: 'Left Midfielder' });
        positions.push({ x: width * 0.38, y: 250, label: 'CM', role: 'Central Midfielder' });
        positions.push({ x: width * 0.38, y: 400, label: 'CM', role: 'Central Midfielder' });
        positions.push({ x: width * 0.38, y: 550, label: 'CM', role: 'Central Midfielder' });
        positions.push({ x: width * 0.38, y: 700, label: 'RM', role: 'Right Midfielder' });
        positions.push({ x: width * 0.54, y: 300, label: 'ST', role: 'Striker' });
        positions.push({ x: width * 0.54, y: 500, label: 'ST', role: 'Striker' });
        break;
      case '4-2-3-1':
        positions.push({ x: width * 0.08, y: 400, label: 'GK', role: 'Goalkeeper' });
        positions.push({ x: width * 0.21, y: 150, label: 'LB', role: 'Left Back' });
        positions.push({ x: width * 0.21, y: 300, label: 'CB', role: 'Center Back' });
        positions.push({ x: width * 0.21, y: 500, label: 'CB', role: 'Center Back' });
        positions.push({ x: width * 0.21, y: 650, label: 'RB', role: 'Right Back' });
        positions.push({ x: width * 0.33, y: 300, label: 'CDM', role: 'Defensive Midfielder' });
        positions.push({ x: width * 0.33, y: 500, label: 'CDM', role: 'Defensive Midfielder' });
        positions.push({ x: width * 0.46, y: 150, label: 'LW', role: 'Left Winger' });
        positions.push({ x: width * 0.46, y: 400, label: 'CAM', role: 'Attacking Midfielder' });
        positions.push({ x: width * 0.46, y: 650, label: 'RW', role: 'Right Winger' });
        positions.push({ x: width * 0.58, y: 400, label: 'ST', role: 'Striker' });
        break;
      default:
        return getInitialPositions('4-3-3');
    }

    return positions.map((pos, idx) => ({
      id: `player-${idx}`,
      x: pos.x,
      y: pos.y,
      targetX: pos.x,
      targetY: pos.y,
      team: 'home',
      number: idx + 1,
      label: pos.label,
      role: pos.role
    }));
  };

  useEffect(() => {
    setPlayers1(getInitialPositions(formation1));
    setKeyframes1([]);
    setCurrentFrame(0);
  }, [formation1, comparisonMode]);

  useEffect(() => {
    if (comparisonMode) {
      setPlayers2(getInitialPositions(formation2));
      setKeyframes2([]);
      setCurrentFrame(0);
    }
  }, [formation2, comparisonMode]);

  const generateSimulationMutation = trpc.aiFormation.generateSimulation.useMutation();
  const compareFormationsMutation = trpc.aiFormation.compareFormations.useMutation();

  const generateAISimulation = async () => {
    setIsGenerating(true);
    try {
      if (comparisonMode) {
        // Generate both simulations
        const [result1, result2] = await Promise.all([
          generateSimulationMutation.mutateAsync({
            formation: formation1,
            scenario: scenario1,
            duration: 10
          }),
          generateSimulationMutation.mutateAsync({
            formation: formation2,
            scenario: scenario2,
            duration: 10
          })
        ]);
        
        setKeyframes1(result1.keyframes);
        setDescription1(result1.description);
        setKeyframes2(result2.keyframes);
        setDescription2(result2.description);
        
        // Get AI comparison insights
        const comparisonResult = await compareFormationsMutation.mutateAsync({
          formation1,
          scenario1,
          formation2,
          scenario2
        });
        setComparisonInsights(comparisonResult.insights);
        
        toast.success("Comparison simulations generated successfully!");
      } else {
        // Generate single simulation
        const result = await generateSimulationMutation.mutateAsync({
          formation: formation1,
          scenario: scenario1,
          duration: 10
        });
        setKeyframes1(result.keyframes);
        setDescription1(result.description);
        toast.success("AI simulation generated successfully!");
      }
      setIsGenerating(false);
    } catch (error: any) {
      toast.error("Failed to generate simulation: " + error.message);
      setIsGenerating(false);
    }
  };

  const drawPitch = (ctx: CanvasRenderingContext2D, width: number) => {
    // Clear canvas
    ctx.fillStyle = '#2d5016';
    ctx.fillRect(0, 0, width, CANVAS_HEIGHT);

    // Draw pitch markings
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;

    // Outer boundary
    ctx.strokeRect(50, 50, width - 100, CANVAS_HEIGHT - 100);

    // Center line
    ctx.beginPath();
    ctx.moveTo(width / 2, 50);
    ctx.lineTo(width / 2, CANVAS_HEIGHT - 50);
    ctx.stroke();

    // Center circle
    ctx.beginPath();
    ctx.arc(width / 2, CANVAS_HEIGHT / 2, 80, 0, Math.PI * 2);
    ctx.stroke();

    // Left penalty area
    ctx.strokeRect(50, 200, 150, 400);
    ctx.strokeRect(50, 300, 60, 200);

    // Right penalty area
    ctx.strokeRect(width - 200, 200, 150, 400);
    ctx.strokeRect(width - 110, 300, 60, 200);
  };

  const drawPlayers = (ctx: CanvasRenderingContext2D, playerPositions: Player[]) => {
    playerPositions.forEach(player => {
      // Player circle
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(player.x, player.y, PLAYER_RADIUS, 0, Math.PI * 2);
      ctx.fill();

      // Border
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Number
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(player.number.toString(), player.x, player.y);

      // Label
      ctx.font = '10px Arial';
      ctx.fillText(player.label, player.x, player.y + PLAYER_RADIUS + 12);

      // Movement trail
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(player.x, player.y);
      ctx.lineTo(player.targetX, player.targetY);
      ctx.stroke();
      ctx.setLineDash([]);
    });
  };

  useEffect(() => {
    const canvas1 = canvasRef1.current;
    if (!canvas1) return;

    const ctx1 = canvas1.getContext('2d');
    if (!ctx1) return;

    drawPitch(ctx1, CANVAS_WIDTH);

    if (keyframes1.length > 0 && currentFrame < keyframes1.length) {
      const frame = keyframes1[currentFrame];
      const currentPlayers = players1.map(player => {
        const framePlayer = frame.players.find(p => p.id === player.id);
        return framePlayer ? { ...player, x: framePlayer.x, y: framePlayer.y } : player;
      });
      drawPlayers(ctx1, currentPlayers);

      // Draw frame info
      ctx1.fillStyle = '#ffffff';
      ctx1.font = '14px Arial';
      ctx1.fillText(frame.description, 20, 30);
      ctx1.fillText(`Frame: ${currentFrame + 1}/${keyframes1.length}`, 20, 50);
    } else {
      drawPlayers(ctx1, players1);
    }
  }, [players1, keyframes1, currentFrame, comparisonMode]);

  useEffect(() => {
    if (!comparisonMode) return;
    
    const canvas2 = canvasRef2.current;
    if (!canvas2) return;

    const ctx2 = canvas2.getContext('2d');
    if (!ctx2) return;

    drawPitch(ctx2, CANVAS_WIDTH);

    if (keyframes2.length > 0 && currentFrame < keyframes2.length) {
      const frame = keyframes2[currentFrame];
      const currentPlayers = players2.map(player => {
        const framePlayer = frame.players.find(p => p.id === player.id);
        return framePlayer ? { ...player, x: framePlayer.x, y: framePlayer.y } : player;
      });
      drawPlayers(ctx2, currentPlayers);

      // Draw frame info
      ctx2.fillStyle = '#ffffff';
      ctx2.font = '14px Arial';
      ctx2.fillText(frame.description, 20, 30);
      ctx2.fillText(`Frame: ${currentFrame + 1}/${keyframes2.length}`, 20, 50);
    } else {
      drawPlayers(ctx2, players2);
    }
  }, [players2, keyframes2, currentFrame, comparisonMode]);

  useEffect(() => {
    if (isPlaying && keyframes1.length > 0) {
      const maxFrames = comparisonMode ? Math.max(keyframes1.length, keyframes2.length) : keyframes1.length;
      animationRef.current = window.setInterval(() => {
        setCurrentFrame(prev => {
          if (prev >= maxFrames - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1000 / (FPS * playbackSpeed));
    } else {
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
    }

    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
    };
  }, [isPlaying, keyframes1, keyframes2, playbackSpeed, comparisonMode]);

  const handlePlayPause = () => {
    if (keyframes1.length === 0) {
      toast.error("Generate a simulation first!");
      return;
    }
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setCurrentFrame(0);
    setIsPlaying(false);
  };

  const handleStepForward = () => {
    const maxFrames = comparisonMode ? Math.max(keyframes1.length, keyframes2.length) : keyframes1.length;
    if (currentFrame < maxFrames - 1) {
      setCurrentFrame(prev => prev + 1);
    }
  };

  const handleStepBackward = () => {
    if (currentFrame > 0) {
      setCurrentFrame(prev => prev - 1);
    }
  };

  const toggleComparisonMode = () => {
    setComparisonMode(!comparisonMode);
    setKeyframes1([]);
    setKeyframes2([]);
    setCurrentFrame(0);
    setIsPlaying(false);
    setComparisonInsights('');
  };

  const exportComparisonToPDF = () => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPos = 20;

    // Title
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Formation Comparison Report', pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    // Formation 1 Details
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Formation 1', 20, yPos);
    yPos += 8;
    
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Formation: ${formation1}`, 25, yPos);
    yPos += 6;
    pdf.text(`Scenario: ${scenario1}`, 25, yPos);
    yPos += 10;
    
    if (description1) {
      pdf.setFontSize(10);
      const lines1 = pdf.splitTextToSize(description1, pageWidth - 50);
      pdf.text(lines1, 25, yPos);
      yPos += lines1.length * 5 + 10;
    }

    // Formation 2 Details
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Formation 2', 20, yPos);
    yPos += 8;
    
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Formation: ${formation2}`, 25, yPos);
    yPos += 6;
    pdf.text(`Scenario: ${scenario2}`, 25, yPos);
    yPos += 10;
    
    if (description2) {
      pdf.setFontSize(10);
      const lines2 = pdf.splitTextToSize(description2, pageWidth - 50);
      pdf.text(lines2, 25, yPos);
      yPos += lines2.length * 5 + 10;
    }

    // Add new page for comparison insights
    if (comparisonInsights) {
      pdf.addPage();
      yPos = 20;
      
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('AI Tactical Analysis', 20, yPos);
      yPos += 10;
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const insightLines = pdf.splitTextToSize(comparisonInsights, pageWidth - 40);
      pdf.text(insightLines, 20, yPos);
    }

    // Save PDF
    pdf.save(`formation-comparison-${formation1}-vs-${formation2}.pdf`);
    toast.success('PDF exported successfully!');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-primary" />
            AI Formation Simulation
          </h1>
          <p className="text-muted-foreground mt-2">
            AI-powered tactical movement simulation with animated player positioning
          </p>
        </div>

        {/* Comparison Mode Toggle */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Comparison Mode</h3>
                <p className="text-sm text-muted-foreground">Compare two formations side-by-side</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={toggleComparisonMode} variant={comparisonMode ? "default" : "outline"}>
                  <GitCompare className="h-4 w-4 mr-2" />
                  {comparisonMode ? "Single Mode" : "Compare Formations"}
                </Button>
                {comparisonMode && comparisonInsights && (
                  <Button onClick={exportComparisonToPDF} variant="outline" className="border-green-500 text-green-600 hover:bg-green-50">
                    <Download className="h-4 w-4 mr-2" />
                    Export PDF
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Simulation Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className={`grid ${comparisonMode ? 'grid-cols-2' : 'grid-cols-1'} gap-6`}>
              {/* Formation 1 Controls */}
              <div className="space-y-4">
                {comparisonMode && <h3 className="font-semibold text-blue-600">Formation 1</h3>}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Formation</label>
                    <Select value={formation1} onValueChange={(v) => setFormation1(v as Formation)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="4-3-3">4-3-3</SelectItem>
                        <SelectItem value="4-4-2">4-4-2</SelectItem>
                        <SelectItem value="3-5-2">3-5-2</SelectItem>
                        <SelectItem value="4-2-3-1">4-2-3-1</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tactical Scenario</label>
                    <Select value={scenario1} onValueChange={(v) => setScenario1(v as TacticalScenario)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="attack">Attack</SelectItem>
                        <SelectItem value="defense">Defense</SelectItem>
                        <SelectItem value="counter">Counter-Attack</SelectItem>
                        <SelectItem value="possession">Possession</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {description1 && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <p className="text-sm text-blue-900 dark:text-blue-100">{description1}</p>
                  </div>
                )}
              </div>

              {/* Formation 2 Controls (Comparison Mode) */}
              {comparisonMode && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-green-600">Formation 2</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Formation</label>
                      <Select value={formation2} onValueChange={(v) => setFormation2(v as Formation)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="4-3-3">4-3-3</SelectItem>
                          <SelectItem value="4-4-2">4-4-2</SelectItem>
                          <SelectItem value="3-5-2">3-5-2</SelectItem>
                          <SelectItem value="4-2-3-1">4-2-3-1</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Tactical Scenario</label>
                      <Select value={scenario2} onValueChange={(v) => setScenario2(v as TacticalScenario)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="attack">Attack</SelectItem>
                          <SelectItem value="defense">Defense</SelectItem>
                          <SelectItem value="counter">Counter-Attack</SelectItem>
                          <SelectItem value="possession">Possession</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {description2 && (
                    <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                      <p className="text-sm text-green-900 dark:text-green-100">{description2}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Playback Speed: {playbackSpeed}x</label>
              <Slider
                value={[playbackSpeed]}
                onValueChange={(v) => setPlaybackSpeed(v[0])}
                min={0.5}
                max={3}
                step={0.5}
                className="w-full"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={generateAISimulation} disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate AI Simulation
                  </>
                )}
              </Button>

              <Button onClick={handlePlayPause} variant="outline" disabled={keyframes1.length === 0}>
                {isPlaying ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Play
                  </>
                )}
              </Button>

              <Button onClick={handleStepBackward} variant="outline" size="icon" disabled={currentFrame === 0}>
                <Rewind className="h-4 w-4" />
              </Button>

              <Button onClick={handleStepForward} variant="outline" size="icon" disabled={currentFrame >= keyframes1.length - 1}>
                <FastForward className="h-4 w-4" />
              </Button>

              <Button onClick={handleReset} variant="outline">
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>

            {comparisonMode && comparisonInsights && (
              <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg border-2 border-purple-200 dark:border-purple-800">
                <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2 flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  AI Comparison Insights
                </h4>
                <p className="text-sm text-purple-800 dark:text-purple-200 whitespace-pre-wrap">{comparisonInsights}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Canvas */}
        <div className={`grid ${comparisonMode ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
          <Card>
            <CardHeader>
              {comparisonMode && <CardTitle className="text-blue-600">Formation 1: {formation1}</CardTitle>}
            </CardHeader>
            <CardContent className="p-4">
              <div className="flex justify-center">
                <canvas
                  ref={canvasRef1}
                  width={CANVAS_WIDTH}
                  height={CANVAS_HEIGHT}
                  className="border border-gray-300 rounded-lg"
                />
              </div>
              <div className="mt-4 text-center text-sm text-muted-foreground">
                <Badge variant="outline" className="mr-2">Blue = Your Team</Badge>
              </div>
            </CardContent>
          </Card>

          {comparisonMode && (
            <Card>
              <CardHeader>
                <CardTitle className="text-green-600">Formation 2: {formation2}</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex justify-center">
                  <canvas
                    ref={canvasRef2}
                    width={CANVAS_WIDTH}
                    height={CANVAS_HEIGHT}
                    className="border border-gray-300 rounded-lg"
                  />
                </div>
                <div className="mt-4 text-center text-sm text-muted-foreground">
                  <Badge variant="outline" className="mr-2">Blue = Your Team</Badge>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
