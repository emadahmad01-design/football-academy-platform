import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Video as VideoIcon,
  Save,
  Download,
  Trash2,
  Undo,
  Circle,
  Square,
  ArrowRight,
  Pencil,
  MousePointer
} from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';

type Tool = 'select' | 'player' | 'arrow' | 'line' | 'circle' | 'rectangle' | 'freehand';

interface DrawingElement {
  type: Tool;
  color: string;
  points?: { x: number; y: number }[];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  radius?: number;
  width?: number;
  height?: number;
  timestamp?: number; // Video timestamp when this was drawn
}

interface TacticalAnnotation {
  id?: number;
  videoId: number;
  timestamp: number;
  elements: DrawingElement[];
  notes?: string;
}

export default function TacticalVideoAnalysis() {
  const { t, language } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [selectedVideoId, setSelectedVideoId] = useState<number | null>(null);
  const [tool, setTool] = useState<Tool>('select');
  const [color, setColor] = useState('#FF0000');
  const [isDrawing, setIsDrawing] = useState(false);
  const [elements, setElements] = useState<DrawingElement[]>([]);
  const [currentElement, setCurrentElement] = useState<DrawingElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [annotations, setAnnotations] = useState<TacticalAnnotation[]>([]);

  // Fetch training videos
  const { data: videos } = trpc.trainingVideos.getMyVideos.useQuery();

  const colors = [
    { name: 'Red', value: '#FF0000' },
    { name: 'Blue', value: '#0000FF' },
    { name: 'Yellow', value: '#FFFF00' },
    { name: 'White', value: '#FFFFFF' },
    { name: 'Green', value: '#00FF00' },
  ];

  useEffect(() => {
    if (canvasRef.current) {
      drawPitch();
    }
  }, []);

  useEffect(() => {
    redrawElements();
  }, [elements]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      
      // Load annotations for current timestamp
      const relevantAnnotations = annotations.filter(
        ann => Math.abs(ann.timestamp - video.currentTime) < 1
      );
      
      if (relevantAnnotations.length > 0) {
        setElements(relevantAnnotations[0].elements);
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, [annotations]);

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
    ctx.arc(canvas.width / 2, canvas.height / 2, 50, 0, Math.PI * 2);
    ctx.stroke();

    // Penalty areas
    const penaltyWidth = 200;
    const penaltyHeight = 80;
    
    ctx.strokeRect((canvas.width - penaltyWidth) / 2, 20, penaltyWidth, penaltyHeight);
    ctx.strokeRect((canvas.width - penaltyWidth) / 2, canvas.height - 20 - penaltyHeight, penaltyWidth, penaltyHeight);
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
            element.points.forEach(point => ctx.lineTo(point.x, point.y));
            ctx.stroke();
          }
          break;
      }
    });
  };

  const drawArrow = (ctx: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number, color: string) => {
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    const headLength = 15;
    const angle = Math.atan2(toY - fromY, toX - fromX);

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
        start: pos,
        timestamp: currentTime
      };
      setElements([...elements, newElement]);
      setIsDrawing(false);
    } else if (tool === 'freehand') {
      setCurrentElement({
        type: 'freehand',
        color,
        points: [pos],
        timestamp: currentTime
      });
    } else {
      setCurrentElement({
        type: tool,
        color,
        start: pos,
        timestamp: currentTime
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
  };

  const handleMouseUp = () => {
    if (isDrawing && currentElement) {
      setElements([...elements, currentElement]);
      setCurrentElement(null);
    }
    setIsDrawing(false);
  };

  const handlePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSkipBackward = () => {
    const video = videoRef.current;
    if (video) {
      video.currentTime = Math.max(0, video.currentTime - 5);
    }
  };

  const handleSkipForward = () => {
    const video = videoRef.current;
    if (video) {
      video.currentTime = Math.min(video.duration, video.currentTime + 5);
    }
  };

  const handleSaveAnnotation = () => {
    if (!selectedVideoId) {
      toast.error(language === 'ar' ? 'اختر فيديو أولاً' : 'Select a video first');
      return;
    }

    const newAnnotation: TacticalAnnotation = {
      videoId: selectedVideoId,
      timestamp: currentTime,
      elements: elements
    };

    setAnnotations([...annotations, newAnnotation]);
    toast.success(language === 'ar' ? 'تم حفظ التعليق التوضيحي' : 'Annotation saved');
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
        link.download = `tactical-analysis-${Date.now()}.png`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
        toast.success(language === 'ar' ? 'تم التصدير بنجاح' : 'Exported successfully');
      }
    });
  };

  const selectedVideo = videos?.find(v => v.id === selectedVideoId);

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold flex items-center gap-3">
            <VideoIcon className="h-8 w-8 text-primary" />
            {language === 'ar' ? 'تحليل الفيديو التكتيكي' : 'Tactical Video Analysis'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Video Selector */}
          <div className="flex items-center gap-4">
            <label className="font-semibold">
              {language === 'ar' ? 'اختر فيديو:' : 'Select Video:'}
            </label>
            <Select value={selectedVideoId?.toString()} onValueChange={(value) => setSelectedVideoId(parseInt(value))}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder={language === 'ar' ? 'اختر فيديو...' : 'Select a video...'} />
              </SelectTrigger>
              <SelectContent>
                {videos?.map((video) => (
                  <SelectItem key={video.id} value={video.id.toString()}>
                    {video.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedVideo && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Video Player */}
              <div className="space-y-4">
                <div className="border-4 border-gray-800 rounded-lg overflow-hidden shadow-2xl">
                  <video
                    ref={videoRef}
                    src={selectedVideo.videoUrl}
                    className="w-full h-auto"
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                  />
                </div>

                {/* Video Controls */}
                <div className="flex items-center justify-center gap-4">
                  <Button variant="outline" size="sm" onClick={handleSkipBackward}>
                    <SkipBack className="h-4 w-4" />
                  </Button>
                  <Button variant="default" size="lg" onClick={handlePlayPause}>
                    {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleSkipForward}>
                    <SkipForward className="h-4 w-4" />
                  </Button>
                </div>

                <div className="text-center text-sm text-muted-foreground">
                  {Math.floor(currentTime / 60)}:{Math.floor(currentTime % 60).toString().padStart(2, '0')}
                </div>
              </div>

              {/* Tactical Board */}
              <div className="space-y-4">
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
                <div className="flex gap-2">
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

                {/* Canvas */}
                <div className="border-4 border-gray-800 rounded-lg overflow-hidden shadow-2xl">
                  <canvas
                    ref={canvasRef}
                    width={600}
                    height={400}
                    className="cursor-crosshair bg-green-800"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" size="sm" onClick={handleUndo}>
                    <Undo className="h-4 w-4 mr-2" />
                    {language === 'ar' ? 'تراجع' : 'Undo'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleClear}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    {language === 'ar' ? 'مسح' : 'Clear'}
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleSaveAnnotation}>
                    <Save className="h-4 w-4 mr-2" />
                    {language === 'ar' ? 'حفظ' : 'Save'}
                  </Button>
                  <Button variant="default" size="sm" onClick={handleExport}>
                    <Download className="h-4 w-4 mr-2" />
                    {language === 'ar' ? 'تصدير' : 'Export'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {!selectedVideo && (
            <div className="text-center py-12 text-muted-foreground">
              <VideoIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">
                {language === 'ar' ? 'اختر فيديو لبدء التحليل التكتيكي' : 'Select a video to start tactical analysis'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
