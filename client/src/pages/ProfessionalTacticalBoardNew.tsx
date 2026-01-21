import { useState, useRef, useEffect } from 'react';
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { DashboardLayoutSkeleton } from "@/components/DashboardLayoutSkeleton";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useLocation } from 'wouter';
import { 
  Play, Pause, RotateCcw, Save, Download, Pencil, ArrowRight, 
  Circle, Square, Type, Eraser, Sparkles, Target, Users
} from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';

type DrawingTool = 'none' | 'line' | 'arrow' | 'circle' | 'rect' | 'text' | 'eraser';
type Formation = '4-3-3' | '4-4-2' | '3-5-2' | '4-2-3-1' | '3-4-3' | '5-3-2';

interface Player {
  id: string;
  x: number;
  y: number;
  team: 'home' | 'away';
  number: number;
  label: string;
}

interface DrawingElement {
  id: string;
  type: 'line' | 'arrow' | 'circle' | 'rect' | 'text';
  startX: number;
  startY: number;
  endX?: number;
  endY?: number;
  radius?: number;
  text?: string;
  color: string;
}

// Formation positions (landscape - horizontal pitch) - MOVED OUTSIDE COMPONENT
const getFormationPositions = (formation: Formation, team: 'home' | 'away'): Player[] => {
  const positions: { x: number; y: number; label: string }[] = [];
  const isHome = team === 'home';
  
  switch (formation) {
    case '4-3-3':
      if (isHome) {
        positions.push({ x: 100, y: 400, label: 'GK' });
        positions.push({ x: 250, y: 150, label: 'LB' });
        positions.push({ x: 250, y: 300, label: 'CB' });
        positions.push({ x: 250, y: 500, label: 'CB' });
        positions.push({ x: 250, y: 650, label: 'RB' });
        positions.push({ x: 450, y: 200, label: 'CM' });
        positions.push({ x: 450, y: 400, label: 'CM' });
        positions.push({ x: 450, y: 600, label: 'CM' });
        positions.push({ x: 650, y: 150, label: 'LW' });
        positions.push({ x: 650, y: 400, label: 'ST' });
        positions.push({ x: 650, y: 650, label: 'RW' });
      } else {
        positions.push({ x: 1100, y: 400, label: 'GK' });
        positions.push({ x: 950, y: 150, label: 'LB' });
        positions.push({ x: 950, y: 300, label: 'CB' });
        positions.push({ x: 950, y: 500, label: 'CB' });
        positions.push({ x: 950, y: 650, label: 'RB' });
        positions.push({ x: 750, y: 200, label: 'CM' });
        positions.push({ x: 750, y: 400, label: 'CM' });
        positions.push({ x: 750, y: 600, label: 'CM' });
        positions.push({ x: 550, y: 150, label: 'LW' });
        positions.push({ x: 550, y: 400, label: 'ST' });
        positions.push({ x: 550, y: 650, label: 'RW' });
      }
      break;
    case '4-4-2':
      if (isHome) {
        positions.push({ x: 100, y: 400, label: 'GK' });
        positions.push({ x: 250, y: 150, label: 'LB' });
        positions.push({ x: 250, y: 300, label: 'CB' });
        positions.push({ x: 250, y: 500, label: 'CB' });
        positions.push({ x: 250, y: 650, label: 'RB' });
        positions.push({ x: 450, y: 150, label: 'LM' });
        positions.push({ x: 450, y: 300, label: 'CM' });
        positions.push({ x: 450, y: 500, label: 'CM' });
        positions.push({ x: 450, y: 650, label: 'RM' });
        positions.push({ x: 650, y: 300, label: 'ST' });
        positions.push({ x: 650, y: 500, label: 'ST' });
      } else {
        positions.push({ x: 1100, y: 400, label: 'GK' });
        positions.push({ x: 950, y: 150, label: 'LB' });
        positions.push({ x: 950, y: 300, label: 'CB' });
        positions.push({ x: 950, y: 500, label: 'CB' });
        positions.push({ x: 950, y: 650, label: 'RB' });
        positions.push({ x: 750, y: 150, label: 'LM' });
        positions.push({ x: 750, y: 300, label: 'CM' });
        positions.push({ x: 750, y: 500, label: 'CM' });
        positions.push({ x: 750, y: 650, label: 'RM' });
        positions.push({ x: 550, y: 300, label: 'ST' });
        positions.push({ x: 550, y: 500, label: 'ST' });
      }
      break;
    default:
      return getFormationPositions('4-3-3', team);
  }

  return positions.map((pos, idx) => ({
    id: `${team}-${idx}`,
    x: pos.x,
    y: pos.y,
    team,
    number: idx + 1,
    label: pos.label
  }));
};

export default function ProfessionalTacticalBoard() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [homeFormation, setHomeFormation] = useState<Formation>('4-3-3');
  const [awayFormation, setAwayFormation] = useState<Formation>('4-4-2');
  const [homePlayers, setHomePlayers] = useState<Player[]>([]);
  const [awayPlayers, setAwayPlayers] = useState<Player[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [drawingTool, setDrawingTool] = useState<DrawingTool>('none');
  const [drawings, setDrawings] = useState<DrawingElement[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentDrawing, setCurrentDrawing] = useState<DrawingElement | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationFrame, setSimulationFrame] = useState(0);

  const { data: teams } = trpc.teams.getAll.useQuery();

  const CANVAS_WIDTH = 1200;
  const CANVAS_HEIGHT = 800;
  const PLAYER_RADIUS = 20;

  // Initialize players
  useEffect(() => {
    setHomePlayers(getFormationPositions(homeFormation, 'home'));
  }, [homeFormation]);

  useEffect(() => {
    setAwayPlayers(getFormationPositions(awayFormation, 'away'));
  }, [awayFormation]);

  // Draw pitch and players
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#2d5016';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw pitch markings (landscape orientation)
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;

    // Outer boundary
    ctx.strokeRect(50, 50, CANVAS_WIDTH - 100, CANVAS_HEIGHT - 100);

    // Center line
    ctx.beginPath();
    ctx.moveTo(CANVAS_WIDTH / 2, 50);
    ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT - 50);
    ctx.stroke();

    // Center circle
    ctx.beginPath();
    ctx.arc(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 80, 0, Math.PI * 2);
    ctx.stroke();

    // Center spot
    ctx.beginPath();
    ctx.arc(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 3, 0, Math.PI * 2);
    ctx.fill();

    // Left penalty area
    ctx.strokeRect(50, 200, 150, 400);
    // Left goal area
    ctx.strokeRect(50, 300, 60, 200);

    // Right penalty area
    ctx.strokeRect(CANVAS_WIDTH - 200, 200, 150, 400);
    // Right goal area
    ctx.strokeRect(CANVAS_WIDTH - 110, 300, 60, 200);

    // Draw drawings
    drawings.forEach(drawing => {
      ctx.strokeStyle = drawing.color;
      ctx.lineWidth = 3;

      switch (drawing.type) {
        case 'line':
          if (drawing.endX && drawing.endY) {
            ctx.beginPath();
            ctx.moveTo(drawing.startX, drawing.startY);
            ctx.lineTo(drawing.endX, drawing.endY);
            ctx.stroke();
          }
          break;
        case 'arrow':
          if (drawing.endX && drawing.endY) {
            // Draw line
            ctx.beginPath();
            ctx.moveTo(drawing.startX, drawing.startY);
            ctx.lineTo(drawing.endX, drawing.endY);
            ctx.stroke();
            
            // Draw arrowhead
            const angle = Math.atan2(drawing.endY - drawing.startY, drawing.endX - drawing.startX);
            const headLength = 15;
            ctx.beginPath();
            ctx.moveTo(drawing.endX, drawing.endY);
            ctx.lineTo(
              drawing.endX - headLength * Math.cos(angle - Math.PI / 6),
              drawing.endY - headLength * Math.sin(angle - Math.PI / 6)
            );
            ctx.moveTo(drawing.endX, drawing.endY);
            ctx.lineTo(
              drawing.endX - headLength * Math.cos(angle + Math.PI / 6),
              drawing.endY - headLength * Math.sin(angle + Math.PI / 6)
            );
            ctx.stroke();
          }
          break;
        case 'circle':
          if (drawing.radius) {
            ctx.beginPath();
            ctx.arc(drawing.startX, drawing.startY, drawing.radius, 0, Math.PI * 2);
            ctx.stroke();
          }
          break;
        case 'rect':
          if (drawing.endX && drawing.endY) {
            ctx.strokeRect(
              drawing.startX,
              drawing.startY,
              drawing.endX - drawing.startX,
              drawing.endY - drawing.startY
            );
          }
          break;
        case 'text':
          if (drawing.text) {
            ctx.font = '16px Arial';
            ctx.fillStyle = drawing.color;
            ctx.fillText(drawing.text, drawing.startX, drawing.startY);
          }
          break;
      }
    });

    // Draw current drawing
    if (currentDrawing && currentDrawing.endX && currentDrawing.endY) {
      ctx.strokeStyle = currentDrawing.color;
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 5]);

      switch (currentDrawing.type) {
        case 'line':
        case 'arrow':
          ctx.beginPath();
          ctx.moveTo(currentDrawing.startX, currentDrawing.startY);
          ctx.lineTo(currentDrawing.endX, currentDrawing.endY);
          ctx.stroke();
          break;
        case 'circle':
          const radius = Math.sqrt(
            Math.pow(currentDrawing.endX - currentDrawing.startX, 2) +
            Math.pow(currentDrawing.endY - currentDrawing.startY, 2)
          );
          ctx.beginPath();
          ctx.arc(currentDrawing.startX, currentDrawing.startY, radius, 0, Math.PI * 2);
          ctx.stroke();
          break;
        case 'rect':
          ctx.strokeRect(
            currentDrawing.startX,
            currentDrawing.startY,
            currentDrawing.endX - currentDrawing.startX,
            currentDrawing.endY - currentDrawing.startY
          );
          break;
      }
      ctx.setLineDash([]);
    }

    // Draw players
    [...homePlayers, ...awayPlayers].forEach(player => {
      // Player circle
      ctx.fillStyle = player.team === 'home' ? '#3b82f6' : '#ef4444';
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

      // Highlight selected player
      if (selectedPlayer && selectedPlayer.id === player.id) {
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(player.x, player.y, PLAYER_RADIUS + 5, 0, Math.PI * 2);
        ctx.stroke();
      }
    });
  }, [homePlayers, awayPlayers, selectedPlayer, drawings, currentDrawing]);

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (drawingTool !== 'none' && drawingTool !== 'eraser') {
      setIsDrawing(true);
      setCurrentDrawing({
        id: Date.now().toString(),
        type: drawingTool as any,
        startX: x,
        startY: y,
        color: '#ffff00'
      });
      return;
    }

    if (drawingTool === 'eraser') {
      // Remove drawings near click
      setDrawings(prev => prev.filter(d => {
        const dist = Math.sqrt(Math.pow(d.startX - x, 2) + Math.pow(d.startY - y, 2));
        return dist > 30;
      }));
      return;
    }

    // Check if clicked on a player
    const clickedPlayer = [...homePlayers, ...awayPlayers].find(player => {
      const dist = Math.sqrt(Math.pow(player.x - x, 2) + Math.pow(player.y - y, 2));
      return dist <= PLAYER_RADIUS;
    });

    setSelectedPlayer(clickedPlayer || null);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (isDrawing && currentDrawing) {
      setCurrentDrawing(prev => prev ? { ...prev, endX: x, endY: y } : null);
      return;
    }

    if (selectedPlayer && e.buttons === 1) {
      // Drag player
      if (selectedPlayer.team === 'home') {
        setHomePlayers(prev => prev.map(p => 
          p.id === selectedPlayer.id ? { ...p, x, y } : p
        ));
      } else {
        setAwayPlayers(prev => prev.map(p => 
          p.id === selectedPlayer.id ? { ...p, x, y } : p
        ));
      }
      setSelectedPlayer(prev => prev ? { ...prev, x, y } : null);
    }
  };

  const handleCanvasMouseUp = () => {
    if (isDrawing && currentDrawing && currentDrawing.endX && currentDrawing.endY) {
      let finalDrawing = { ...currentDrawing };
      
      if (currentDrawing.type === 'circle') {
        finalDrawing.radius = Math.sqrt(
          Math.pow(currentDrawing.endX - currentDrawing.startX, 2) +
          Math.pow(currentDrawing.endY - currentDrawing.startY, 2)
        );
      }
      
      setDrawings(prev => [...prev, finalDrawing]);
      setCurrentDrawing(null);
    }
    setIsDrawing(false);
  };

  const resetBoard = () => {
    setHomePlayers(getFormationPositions(homeFormation, 'home'));
    setAwayPlayers(getFormationPositions(awayFormation, 'away'));
    setDrawings([]);
    setSelectedPlayer(null);
    toast.success("Board reset!");
  };

  const saveBoard = () => {
    const boardData = {
      homePlayers,
      awayPlayers,
      drawings,
      homeFormation,
      awayFormation,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('tactical-board', JSON.stringify(boardData));
    toast.success("Board saved!");
  };

  const exportImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const dataURL = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `tactical-board-${Date.now()}.png`;
    link.href = dataURL;
    link.click();
    toast.success("Image exported!");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Target className="h-8 w-8 text-primary" />
            Professional Tactical Board
          </h1>
          <p className="text-muted-foreground mt-2">
            Interactive tactical board with drawing tools and player movement
          </p>
        </div>

        {/* Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Formations */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Home Formation (Blue)</label>
                <Select value={homeFormation} onValueChange={(v) => setHomeFormation(v as Formation)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="4-3-3">4-3-3</SelectItem>
                    <SelectItem value="4-4-2">4-4-2</SelectItem>
                    <SelectItem value="3-5-2">3-5-2</SelectItem>
                    <SelectItem value="4-2-3-1">4-2-3-1</SelectItem>
                    <SelectItem value="3-4-3">3-4-3</SelectItem>
                    <SelectItem value="5-3-2">5-3-2</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Away Formation (Red)</label>
                <Select value={awayFormation} onValueChange={(v) => setAwayFormation(v as Formation)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="4-3-3">4-3-3</SelectItem>
                    <SelectItem value="4-4-2">4-4-2</SelectItem>
                    <SelectItem value="3-5-2">3-5-2</SelectItem>
                    <SelectItem value="4-2-3-1">4-2-3-1</SelectItem>
                    <SelectItem value="3-4-3">3-4-3</SelectItem>
                    <SelectItem value="5-3-2">5-3-2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Drawing Tools */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Drawing Tools</label>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={drawingTool === 'none' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDrawingTool('none')}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Move Players
                </Button>
                <Button
                  variant={drawingTool === 'line' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDrawingTool('line')}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Line
                </Button>
                <Button
                  variant={drawingTool === 'arrow' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDrawingTool('arrow')}
                >
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Arrow
                </Button>
                <Button
                  variant={drawingTool === 'circle' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDrawingTool('circle')}
                >
                  <Circle className="h-4 w-4 mr-2" />
                  Circle
                </Button>
                <Button
                  variant={drawingTool === 'rect' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDrawingTool('rect')}
                >
                  <Square className="h-4 w-4 mr-2" />
                  Rectangle
                </Button>
                <Button
                  variant={drawingTool === 'eraser' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setDrawingTool('eraser')}
                >
                  <Eraser className="h-4 w-4 mr-2" />
                  Eraser
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button onClick={resetBoard} variant="outline" size="sm">
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Button onClick={saveBoard} variant="outline" size="sm">
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button onClick={exportImage} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Image
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Canvas */}
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-center">
              <canvas
                ref={canvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                className="border border-gray-300 rounded-lg cursor-crosshair"
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseUp}
              />
            </div>
            <div className="mt-4 text-center text-sm text-muted-foreground">
              <Badge variant="outline" className="mr-2">Blue = Your Team</Badge>
              <Badge variant="outline" className="mr-2">Red = Opponents</Badge>
              <span>• Drag blue players • Click pitch to place ball • Use drawing tools to annotate</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
