import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Pencil, 
  Circle, 
  Square,
  ArrowRight,
  Trash2,
  Undo,
  Download,
  Save,
  Users,
  Palette,
  MousePointer,
  ZoomIn,
  ZoomOut,
  Maximize
} from 'lucide-react';
import { toast } from 'sonner';

type Tool = 'select' | 'player' | 'arrow' | 'line' | 'circle' | 'rectangle' | 'freehand';
type Formation = '4-4-2' | '4-3-3' | '3-5-2' | '4-2-3-1' | '3-4-3' | 'custom';

interface DrawingElement {
  type: Tool;
  color: string;
  points?: { x: number; y: number }[];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  radius?: number;
  width?: number;
  height?: number;
  text?: string;
}

export default function TacticalBoard2D() {
  const { t, language } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tool, setTool] = useState<Tool>('select');
  const [color, setColor] = useState('#FF0000');
  const [formation, setFormation] = useState<Formation>('4-4-2');
  const [isDrawing, setIsDrawing] = useState(false);
  const [elements, setElements] = useState<DrawingElement[]>([]);
  const [currentElement, setCurrentElement] = useState<DrawingElement | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastTouchDistance, setLastTouchDistance] = useState<number | null>(null);
  const [lastPanPoint, setLastPanPoint] = useState<{ x: number; y: number } | null>(null);

  const colors = [
    { name: 'Red', value: '#FF0000' },
    { name: 'Blue', value: '#0000FF' },
    { name: 'Yellow', value: '#FFFF00' },
    { name: 'White', value: '#FFFFFF' },
    { name: 'Black', value: '#000000' },
    { name: 'Green', value: '#00FF00' },
  ];

  const formations: Record<Formation, { x: number; y: number }[]> = {
    '4-4-2': [
      // Goalkeeper
      { x: 0.5, y: 0.05 },
      // Defenders
      { x: 0.2, y: 0.25 }, { x: 0.4, y: 0.25 }, { x: 0.6, y: 0.25 }, { x: 0.8, y: 0.25 },
      // Midfielders
      { x: 0.2, y: 0.5 }, { x: 0.4, y: 0.5 }, { x: 0.6, y: 0.5 }, { x: 0.8, y: 0.5 },
      // Forwards
      { x: 0.35, y: 0.8 }, { x: 0.65, y: 0.8 }
    ],
    '4-3-3': [
      { x: 0.5, y: 0.05 },
      { x: 0.2, y: 0.25 }, { x: 0.4, y: 0.25 }, { x: 0.6, y: 0.25 }, { x: 0.8, y: 0.25 },
      { x: 0.3, y: 0.5 }, { x: 0.5, y: 0.5 }, { x: 0.7, y: 0.5 },
      { x: 0.25, y: 0.8 }, { x: 0.5, y: 0.8 }, { x: 0.75, y: 0.8 }
    ],
    '3-5-2': [
      { x: 0.5, y: 0.05 },
      { x: 0.3, y: 0.25 }, { x: 0.5, y: 0.25 }, { x: 0.7, y: 0.25 },
      { x: 0.15, y: 0.5 }, { x: 0.35, y: 0.5 }, { x: 0.5, y: 0.5 }, { x: 0.65, y: 0.5 }, { x: 0.85, y: 0.5 },
      { x: 0.4, y: 0.8 }, { x: 0.6, y: 0.8 }
    ],
    '4-2-3-1': [
      { x: 0.5, y: 0.05 },
      { x: 0.2, y: 0.25 }, { x: 0.4, y: 0.25 }, { x: 0.6, y: 0.25 }, { x: 0.8, y: 0.25 },
      { x: 0.35, y: 0.45 }, { x: 0.65, y: 0.45 },
      { x: 0.25, y: 0.65 }, { x: 0.5, y: 0.65 }, { x: 0.75, y: 0.65 },
      { x: 0.5, y: 0.85 }
    ],
    '3-4-3': [
      { x: 0.5, y: 0.05 },
      { x: 0.3, y: 0.25 }, { x: 0.5, y: 0.25 }, { x: 0.7, y: 0.25 },
      { x: 0.2, y: 0.5 }, { x: 0.4, y: 0.5 }, { x: 0.6, y: 0.5 }, { x: 0.8, y: 0.5 },
      { x: 0.25, y: 0.8 }, { x: 0.5, y: 0.8 }, { x: 0.75, y: 0.8 }
    ],
    'custom': []
  };

  useEffect(() => {
    drawPitch();
    redrawElements();
  }, [elements]);

  const drawPitch = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#2D5016';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw pitch markings
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;

    // Outer boundary
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

    // Center line
    ctx.beginPath();
    ctx.moveTo(20, canvas.height / 2);
    ctx.lineTo(canvas.width - 20, canvas.height / 2);
    ctx.stroke();

    // Center circle
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, 60, 0, Math.PI * 2);
    ctx.stroke();

    // Center spot
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();

    // Penalty areas
    const penaltyWidth = 200;
    const penaltyHeight = 80;
    
    // Top penalty area
    ctx.strokeRect((canvas.width - penaltyWidth) / 2, 20, penaltyWidth, penaltyHeight);
    
    // Bottom penalty area
    ctx.strokeRect((canvas.width - penaltyWidth) / 2, canvas.height - 20 - penaltyHeight, penaltyWidth, penaltyHeight);

    // Goal areas
    const goalWidth = 100;
    const goalHeight = 40;
    
    // Top goal area
    ctx.strokeRect((canvas.width - goalWidth) / 2, 20, goalWidth, goalHeight);
    
    // Bottom goal area
    ctx.strokeRect((canvas.width - goalWidth) / 2, canvas.height - 20 - goalHeight, goalWidth, goalHeight);

    // Penalty spots
    ctx.beginPath();
    ctx.arc(canvas.width / 2, 70, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height - 70, 3, 0, Math.PI * 2);
    ctx.fill();
  };

  const redrawElements = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawPitch();

    elements.forEach(element => {
      ctx.strokeStyle = element.color;
      ctx.fillStyle = element.color;
      ctx.lineWidth = 3;

      switch (element.type) {
        case 'player':
          if (element.start) {
            ctx.beginPath();
            ctx.arc(element.start.x, element.start.y, 15, 0, Math.PI * 2);
            ctx.fillStyle = element.color;
            ctx.fill();
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2;
            ctx.stroke();
          }
          break;

        case 'arrow':
          if (element.start && element.end) {
            drawArrow(ctx, element.start.x, element.start.y, element.end.x, element.end.y, element.color);
          }
          break;

        case 'line':
          if (element.start && element.end) {
            ctx.beginPath();
            ctx.moveTo(element.start.x, element.start.y);
            ctx.lineTo(element.end.x, element.end.y);
            ctx.stroke();
          }
          break;

        case 'circle':
          if (element.start && element.radius) {
            ctx.beginPath();
            ctx.arc(element.start.x, element.start.y, element.radius, 0, Math.PI * 2);
            ctx.stroke();
          }
          break;

        case 'rectangle':
          if (element.start && element.width && element.height) {
            ctx.strokeRect(element.start.x, element.start.y, element.width, element.height);
          }
          break;

        case 'freehand':
          if (element.points && element.points.length > 1) {
            ctx.beginPath();
            ctx.moveTo(element.points[0].x, element.points[0].y);
            for (let i = 1; i < element.points.length; i++) {
              ctx.lineTo(element.points[i].x, element.points[i].y);
            }
            ctx.stroke();
          }
          break;
      }
    });
  };

  const drawArrow = (ctx: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number, color: string) => {
    const headLength = 15;
    const angle = Math.atan2(toY - fromY, toX - fromX);

    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 3;

    // Draw line
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    // Draw arrowhead
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headLength * Math.cos(angle - Math.PI / 6), toY - headLength * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(toX - headLength * Math.cos(angle + Math.PI / 6), toY - headLength * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
  };

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool === 'select') return;

    const pos = getMousePos(e);
    setIsDrawing(true);

    if (tool === 'player') {
      const newElement: DrawingElement = {
        type: 'player',
        color,
        start: pos
      };
      setElements([...elements, newElement]);
      setIsDrawing(false);
    } else if (tool === 'freehand') {
      setCurrentElement({
        type: 'freehand',
        color,
        points: [pos]
      });
    } else {
      setCurrentElement({
        type: tool,
        color,
        start: pos
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentElement) return;

    const pos = getMousePos(e);

    if (tool === 'freehand' && currentElement.points) {
      setCurrentElement({
        ...currentElement,
        points: [...currentElement.points, pos]
      });
      
      // Draw in real-time
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (ctx && currentElement.points.length > 0) {
        const lastPoint = currentElement.points[currentElement.points.length - 1];
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(lastPoint.x, lastPoint.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
      }
    } else if (currentElement.start) {
      const updatedElement = { ...currentElement };

      if (tool === 'circle') {
        const dx = pos.x - currentElement.start.x;
        const dy = pos.y - currentElement.start.y;
        updatedElement.radius = Math.sqrt(dx * dx + dy * dy);
      } else if (tool === 'rectangle') {
        updatedElement.width = pos.x - currentElement.start.x;
        updatedElement.height = pos.y - currentElement.start.y;
      } else {
        updatedElement.end = pos;
      }

      setCurrentElement(updatedElement);
      
      // Redraw with current element
      const tempElements = [...elements, updatedElement];
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (ctx) {
        drawPitch();
        tempElements.forEach(el => {
          ctx.strokeStyle = el.color;
          ctx.fillStyle = el.color;
          ctx.lineWidth = 3;

          if (el.type === 'arrow' && el.start && el.end) {
            drawArrow(ctx, el.start.x, el.start.y, el.end.x, el.end.y, el.color);
          } else if (el.type === 'line' && el.start && el.end) {
            ctx.beginPath();
            ctx.moveTo(el.start.x, el.start.y);
            ctx.lineTo(el.end.x, el.end.y);
            ctx.stroke();
          } else if (el.type === 'circle' && el.start && el.radius) {
            ctx.beginPath();
            ctx.arc(el.start.x, el.start.y, el.radius, 0, Math.PI * 2);
            ctx.stroke();
          } else if (el.type === 'rectangle' && el.start && el.width && el.height) {
            ctx.strokeRect(el.start.x, el.start.y, el.width, el.height);
          }
        });
      }
    }
  };

  const handleMouseUp = () => {
    if (currentElement && isDrawing) {
      setElements([...elements, currentElement]);
      setCurrentElement(null);
    }
    setIsDrawing(false);
  };

  const handleFormationChange = (newFormation: Formation) => {
    setFormation(newFormation);
    
    if (newFormation === 'custom') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const positions = formations[newFormation];
    const playerElements: DrawingElement[] = positions.map(pos => ({
      type: 'player',
      color: '#0000FF',
      start: {
        x: pos.x * (canvas.width - 40) + 20,
        y: pos.y * (canvas.height - 40) + 20
      }
    }));

    setElements([...elements, ...playerElements]);
    toast.success(language === 'ar' ? 'تم تطبيق التشكيل' : 'Formation applied');
  };

  const handleClear = () => {
    setElements([]);
    drawPitch();
    toast.success(language === 'ar' ? 'تم مسح اللوحة' : 'Board cleared');
  };

  const handleUndo = () => {
    if (elements.length > 0) {
      setElements(elements.slice(0, -1));
      toast.success(language === 'ar' ? 'تم التراجع' : 'Undo successful');
    }
  };

  const handleExport = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `tactical-board-${Date.now()}.png`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
        toast.success(language === 'ar' ? 'تم التصدير بنجاح' : 'Exported successfully');
      }
    });
  };

  // Touch event handlers
  const getTouchPos = (touch: React.Touch) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: (touch.clientX - rect.left - offset.x) / scale,
      y: (touch.clientY - rect.top - offset.y) / scale
    };
  };

  const getTouchDistance = (touch1: React.Touch, touch2: React.Touch) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    
    if (e.touches.length === 2) {
      // Two-finger gesture: pinch or pan
      setIsPanning(true);
      const distance = getTouchDistance(e.touches[0], e.touches[1]);
      setLastTouchDistance(distance);
      
      const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      setLastPanPoint({ x: midX, y: midY });
    } else if (e.touches.length === 1 && tool !== 'select') {
      // Single touch: drawing
      const pos = getTouchPos(e.touches[0]);
      setIsDrawing(true);

      if (tool === 'player') {
        const newElement: DrawingElement = {
          type: 'player',
          color,
          start: pos
        };
        setElements([...elements, newElement]);
        setIsDrawing(false);
      } else if (tool === 'freehand') {
        setCurrentElement({
          type: 'freehand',
          color,
          points: [pos]
        });
      } else {
        setCurrentElement({
          type: tool,
          color,
          start: pos
        });
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();

    if (e.touches.length === 2 && isPanning) {
      // Pinch to zoom
      const distance = getTouchDistance(e.touches[0], e.touches[1]);
      if (lastTouchDistance) {
        const delta = distance - lastTouchDistance;
        const newScale = Math.max(0.5, Math.min(3, scale + delta * 0.01));
        setScale(newScale);
        setLastTouchDistance(distance);
      }

      // Two-finger pan
      const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
      
      if (lastPanPoint) {
        setOffset({
          x: offset.x + (midX - lastPanPoint.x),
          y: offset.y + (midY - lastPanPoint.y)
        });
      }
      setLastPanPoint({ x: midX, y: midY });
    } else if (e.touches.length === 1 && isDrawing && currentElement) {
      // Continue drawing
      const pos = getTouchPos(e.touches[0]);

      if (tool === 'freehand' && currentElement.points) {
        setCurrentElement({
          ...currentElement,
          points: [...currentElement.points, pos]
        });
      } else if (currentElement.start) {
        const updatedElement = { ...currentElement };

        if (tool === 'circle') {
          const dx = pos.x - currentElement.start.x;
          const dy = pos.y - currentElement.start.y;
          updatedElement.radius = Math.sqrt(dx * dx + dy * dy);
        } else if (tool === 'rectangle') {
          updatedElement.width = pos.x - currentElement.start.x;
          updatedElement.height = pos.y - currentElement.start.y;
        } else {
          updatedElement.end = pos;
        }

        setCurrentElement(updatedElement);
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();

    if (e.touches.length === 0) {
      setIsPanning(false);
      setLastTouchDistance(null);
      setLastPanPoint(null);

      if (isDrawing && currentElement) {
        setElements([...elements, currentElement]);
        setCurrentElement(null);
      }
      setIsDrawing(false);
    }
  };

  // Zoom controls
  const handleZoomIn = () => {
    setScale(Math.min(3, scale + 0.2));
    toast.success(language === 'ar' ? 'تم التكبير' : 'Zoomed in');
  };

  const handleZoomOut = () => {
    setScale(Math.max(0.5, scale - 0.2));
    toast.success(language === 'ar' ? 'تم التصغير' : 'Zoomed out');
  };

  const handleResetZoom = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
    toast.success(language === 'ar' ? 'تم إعادة التعيين' : 'Reset zoom');
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            {language === 'ar' ? 'لوحة التكتيك ثنائية الأبعاد' : '2D Tactical Board'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Toolbar */}
          <div className="flex flex-wrap gap-4 items-center justify-between border-b pb-4">
            {/* Drawing Tools */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={tool === 'select' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTool('select')}
              >
                <MousePointer className="h-4 w-4 mr-2" />
                {language === 'ar' ? 'تحديد' : 'Select'}
              </Button>
              <Button
                variant={tool === 'player' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTool('player')}
              >
                <Circle className="h-4 w-4 mr-2" />
                {language === 'ar' ? 'لاعب' : 'Player'}
              </Button>
              <Button
                variant={tool === 'arrow' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTool('arrow')}
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                {language === 'ar' ? 'سهم' : 'Arrow'}
              </Button>
              <Button
                variant={tool === 'line' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTool('line')}
              >
                {language === 'ar' ? 'خط' : 'Line'}
              </Button>
              <Button
                variant={tool === 'circle' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTool('circle')}
              >
                <Circle className="h-4 w-4 mr-2" />
                {language === 'ar' ? 'دائرة' : 'Circle'}
              </Button>
              <Button
                variant={tool === 'rectangle' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTool('rectangle')}
              >
                <Square className="h-4 w-4 mr-2" />
                {language === 'ar' ? 'مربع' : 'Rectangle'}
              </Button>
              <Button
                variant={tool === 'freehand' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTool('freehand')}
              >
                <Pencil className="h-4 w-4 mr-2" />
                {language === 'ar' ? 'رسم حر' : 'Freehand'}
              </Button>
            </div>

            {/* Color Picker */}
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-muted-foreground" />
              <div className="flex gap-1">
                {colors.map((c) => (
                  <button
                    key={c.value}
                    className={`w-8 h-8 rounded-full border-2 ${
                      color === c.value ? 'border-primary ring-2 ring-primary/50' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: c.value }}
                    onClick={() => setColor(c.value)}
                    title={c.name}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Formation Selector and Actions */}
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-3">
              <Label>{language === 'ar' ? 'التشكيل:' : 'Formation:'}</Label>
              <Select value={formation} onValueChange={(value) => handleFormationChange(value as Formation)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="4-4-2">4-4-2</SelectItem>
                  <SelectItem value="4-3-3">4-3-3</SelectItem>
                  <SelectItem value="3-5-2">3-5-2</SelectItem>
                  <SelectItem value="4-2-3-1">4-2-3-1</SelectItem>
                  <SelectItem value="3-4-3">3-4-3</SelectItem>
                  <SelectItem value="custom">{language === 'ar' ? 'مخصص' : 'Custom'}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleZoomIn}>
                <ZoomIn className="h-4 w-4 mr-2" />
                {language === 'ar' ? 'تكبير' : 'Zoom In'}
              </Button>
              <Button variant="outline" size="sm" onClick={handleZoomOut}>
                <ZoomOut className="h-4 w-4 mr-2" />
                {language === 'ar' ? 'تصغير' : 'Zoom Out'}
              </Button>
              <Button variant="outline" size="sm" onClick={handleResetZoom}>
                <Maximize className="h-4 w-4 mr-2" />
                {language === 'ar' ? 'إعادة ضبط' : 'Reset'}
              </Button>
              <Button variant="outline" size="sm" onClick={handleUndo}>
                <Undo className="h-4 w-4 mr-2" />
                {language === 'ar' ? 'تراجع' : 'Undo'}
              </Button>
              <Button variant="outline" size="sm" onClick={handleClear}>
                <Trash2 className="h-4 w-4 mr-2" />
                {language === 'ar' ? 'مسح' : 'Clear'}
              </Button>
              <Button variant="default" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                {language === 'ar' ? 'تصدير' : 'Export'}
              </Button>
            </div>
          </div>

          {/* Canvas */}
          <div className="border-4 border-gray-800 rounded-lg overflow-hidden shadow-2xl">
            <canvas
              ref={canvasRef}
              width={800}
              height={600}
              className="cursor-crosshair bg-green-800"
              style={{
                transform: `scale(${scale}) translate(${offset.x / scale}px, ${offset.y / scale}px)`,
                transformOrigin: 'top left',
                touchAction: 'none'
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            />
          </div>

          {/* Instructions */}
          <div className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg">
            <p className="font-semibold mb-2">
              {language === 'ar' ? 'التعليمات:' : 'Instructions:'}
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>{language === 'ar' ? 'اختر أداة من شريط الأدوات' : 'Select a tool from the toolbar'}</li>
              <li>{language === 'ar' ? 'انقر أو المس على اللوحة للرسم أو وضع اللاعبين' : 'Click or touch on the board to draw or place players'}</li>
              <li>{language === 'ar' ? 'استخدم إصبعين للتكبير/التصغير والتحريك' : 'Use two fingers to pinch-zoom and pan'}</li>
              <li>{language === 'ar' ? 'اختر تشكيلاً لوضع اللاعبين تلقائياً' : 'Choose a formation to place players automatically'}</li>
              <li>{language === 'ar' ? 'استخدم الألوان المختلفة للتمييز بين الفرق' : 'Use different colors to distinguish between teams'}</li>
              <li>{language === 'ar' ? 'صدّر اللوحة كصورة PNG' : 'Export the board as a PNG image'}</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
