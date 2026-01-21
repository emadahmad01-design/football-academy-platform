import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Maximize,
  Tag,
  Plus,
  Trash2,
  Clock,
  Star,
  Target,
  Zap,
  Shield,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Circle,
  ArrowRight,
  Square,
  Type,
} from "lucide-react";

// Tag type definitions with colors and icons
const TAG_TYPES = {
  goal: { label: "Goal", color: "bg-green-500", icon: Target },
  assist: { label: "Assist", color: "bg-blue-500", icon: Zap },
  shot: { label: "Shot", color: "bg-orange-500", icon: Target },
  pass: { label: "Pass", color: "bg-cyan-500", icon: ArrowRight },
  dribble: { label: "Dribble", color: "bg-purple-500", icon: Zap },
  tackle: { label: "Tackle", color: "bg-yellow-500", icon: Shield },
  interception: { label: "Interception", color: "bg-teal-500", icon: Shield },
  save: { label: "Save", color: "bg-indigo-500", icon: Shield },
  error: { label: "Error", color: "bg-red-500", icon: AlertTriangle },
  foul: { label: "Foul", color: "bg-red-600", icon: AlertTriangle },
  set_piece: { label: "Set Piece", color: "bg-amber-500", icon: Target },
  highlight: { label: "Highlight", color: "bg-pink-500", icon: Star },
  custom: { label: "Custom", color: "bg-slate-500", icon: Tag },
};

// Annotation tools
const ANNOTATION_TOOLS = [
  { id: "arrow", icon: ArrowRight, label: "Arrow" },
  { id: "circle", icon: Circle, label: "Circle" },
  { id: "rectangle", icon: Square, label: "Rectangle" },
  { id: "line", icon: Pencil, label: "Line" },
  { id: "text", icon: Type, label: "Text" },
];

interface VideoTag {
  id: number;
  tagType: string;
  timestamp: number;
  description?: string;
  rating?: number;
  playerName?: string;
}

interface Annotation {
  id: number;
  type: string;
  timestamp: number;
  data: string;
  color: string;
}

export default function VideoAnalysisAdvanced() {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Video state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  
  // UI state
  const [activeTab, setActiveTab] = useState("tags");
  const [showAddTag, setShowAddTag] = useState(false);
  const [selectedAnnotationTool, setSelectedAnnotationTool] = useState<string | null>(null);
  const [annotationColor, setAnnotationColor] = useState("#ff0000");
  
  // Tag form state
  const [newTagType, setNewTagType] = useState<string>("highlight");
  const [newTagDescription, setNewTagDescription] = useState("");
  const [newTagRating, setNewTagRating] = useState(3);
  
  // Mock data for demo
  const [tags, setTags] = useState<VideoTag[]>([
    { id: 1, tagType: "goal", timestamp: 45, description: "Great finish from outside the box", rating: 5, playerName: "Ahmed" },
    { id: 2, tagType: "assist", timestamp: 43, description: "Through ball to striker", rating: 4, playerName: "Mohamed" },
    { id: 3, tagType: "tackle", timestamp: 67, description: "Clean tackle in the box", rating: 4, playerName: "Omar" },
    { id: 4, tagType: "error", timestamp: 78, description: "Lost possession in midfield", rating: 2, playerName: "Ahmed" },
    { id: 5, tagType: "highlight", timestamp: 120, description: "Excellent team play", rating: 5 },
  ]);
  
  const [annotations, setAnnotations] = useState<Annotation[]>([]);

  // Video controls
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (value: number[]) => {
    if (videoRef.current) {
      videoRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const skipTime = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(duration, currentTime + seconds));
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const changePlaybackRate = (rate: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      setPlaybackRate(rate);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const jumpToTag = (timestamp: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = timestamp;
      setCurrentTime(timestamp);
    }
  };

  const addTag = () => {
    const newTag: VideoTag = {
      id: Date.now(),
      tagType: newTagType,
      timestamp: currentTime,
      description: newTagDescription,
      rating: newTagRating,
    };
    setTags([...tags, newTag].sort((a, b) => a.timestamp - b.timestamp));
    setShowAddTag(false);
    setNewTagDescription("");
    setNewTagRating(3);
  };

  const deleteTag = (tagId: number) => {
    setTags(tags.filter((t) => t.id !== tagId));
  };

  const getTagInfo = (type: string) => {
    return TAG_TYPES[type as keyof typeof TAG_TYPES] || TAG_TYPES.custom;
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
                <h1 className="text-2xl font-bold text-white">Advanced Video Analysis</h1>
                <p className="text-slate-400 text-sm">Tag moments, add annotations, create highlights</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Player */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="bg-slate-800 border-slate-700 overflow-hidden">
              <CardContent className="p-0">
                {/* Video Container */}
                <div className="relative aspect-video bg-black">
                  <video
                    ref={videoRef}
                    className="w-full h-full"
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    poster="/placeholder-video.jpg"
                  >
                    <source src="/sample-match.mp4" type="video/mp4" />
                  </video>
                  
                  {/* Annotation Canvas Overlay */}
                  <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full pointer-events-none"
                  />
                  
                  {/* Demo overlay when no video */}
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80">
                    <div className="text-center">
                      <Play className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                      <p className="text-slate-400">Upload a video to start analysis</p>
                      <Button className="mt-4 bg-emerald-600 hover:bg-emerald-700">
                        Upload Video
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Video Controls */}
                <div className="p-4 bg-slate-900 space-y-3">
                  {/* Progress Bar */}
                  <div className="relative">
                    <Slider
                      value={[currentTime]}
                      max={duration || 100}
                      step={0.1}
                      onValueChange={handleSeek}
                      className="cursor-pointer"
                    />
                    {/* Tag markers on timeline */}
                    <div className="absolute top-0 left-0 right-0 h-full pointer-events-none">
                      {tags.map((tag) => (
                        <div
                          key={tag.id}
                          className={`absolute w-1 h-3 -top-1 ${getTagInfo(tag.tagType).color} rounded-full`}
                          style={{ left: `${(tag.timestamp / (duration || 100)) * 100}%` }}
                          title={`${getTagInfo(tag.tagType).label} at ${formatTime(tag.timestamp)}`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Control Buttons */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => skipTime(-10)}
                        className="text-slate-300 hover:text-white"
                      >
                        <SkipBack className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => skipTime(-1)}
                        className="text-slate-300 hover:text-white"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={togglePlay}
                        className="bg-emerald-600 hover:bg-emerald-700 w-10 h-10 rounded-full"
                      >
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => skipTime(1)}
                        className="text-slate-300 hover:text-white"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => skipTime(10)}
                        className="text-slate-300 hover:text-white"
                      >
                        <SkipForward className="w-4 h-4" />
                      </Button>
                      <span className="text-slate-400 text-sm ml-2">
                        {formatTime(currentTime)} / {formatTime(duration || 0)}
                      </span>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Playback Speed */}
                      <Select value={playbackRate.toString()} onValueChange={(v) => changePlaybackRate(parseFloat(v))}>
                        <SelectTrigger className="w-20 bg-slate-700 border-slate-600 text-white text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-700 border-slate-600">
                          <SelectItem value="0.25">0.25x</SelectItem>
                          <SelectItem value="0.5">0.5x</SelectItem>
                          <SelectItem value="0.75">0.75x</SelectItem>
                          <SelectItem value="1">1x</SelectItem>
                          <SelectItem value="1.5">1.5x</SelectItem>
                          <SelectItem value="2">2x</SelectItem>
                        </SelectContent>
                      </Select>

                      {/* Volume */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleMute}
                        className="text-slate-300 hover:text-white"
                      >
                        {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      </Button>

                      {/* Fullscreen */}
                      <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white">
                        <Maximize className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Annotation Tools */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="py-3">
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <Pencil className="w-5 h-5" />
                  Drawing Tools
                </CardTitle>
              </CardHeader>
              <CardContent className="py-2">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    {ANNOTATION_TOOLS.map((tool) => (
                      <Button
                        key={tool.id}
                        variant={selectedAnnotationTool === tool.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedAnnotationTool(selectedAnnotationTool === tool.id ? null : tool.id)}
                        className={selectedAnnotationTool === tool.id ? "bg-emerald-600" : "border-slate-600 text-slate-300"}
                      >
                        <tool.icon className="w-4 h-4" />
                      </Button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <span className="text-slate-400 text-sm">Color:</span>
                    {["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#ffffff"].map((color) => (
                      <button
                        key={color}
                        className={`w-6 h-6 rounded-full border-2 ${annotationColor === color ? "border-white" : "border-transparent"}`}
                        style={{ backgroundColor: color }}
                        onClick={() => setAnnotationColor(color)}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Tags & Annotations */}
          <div className="lg:col-span-1">
            <Card className="bg-slate-800 border-slate-700 h-full">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <CardHeader className="pb-0">
                  <TabsList className="grid w-full grid-cols-2 bg-slate-700">
                    <TabsTrigger value="tags" className="data-[state=active]:bg-emerald-600">
                      <Tag className="w-4 h-4 mr-2" />
                      Tags
                    </TabsTrigger>
                    <TabsTrigger value="highlights" className="data-[state=active]:bg-emerald-600">
                      <Star className="w-4 h-4 mr-2" />
                      Highlights
                    </TabsTrigger>
                  </TabsList>
                </CardHeader>

                <CardContent className="pt-4">
                  <TabsContent value="tags" className="mt-0 space-y-4">
                    {/* Add Tag Button */}
                    <Dialog open={showAddTag} onOpenChange={setShowAddTag}>
                      <DialogTrigger asChild>
                        <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Tag at {formatTime(currentTime)}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-slate-800 border-slate-700 text-white">
                        <DialogHeader>
                          <DialogTitle>Add Tag at {formatTime(currentTime)}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                          <div>
                            <label className="text-sm text-slate-400">Tag Type</label>
                            <Select value={newTagType} onValueChange={setNewTagType}>
                              <SelectTrigger className="bg-slate-700 border-slate-600 text-white mt-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-slate-700 border-slate-600">
                                {Object.entries(TAG_TYPES).map(([key, value]) => (
                                  <SelectItem key={key} value={key}>
                                    <div className="flex items-center gap-2">
                                      <div className={`w-3 h-3 rounded-full ${value.color}`} />
                                      {value.label}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="text-sm text-slate-400">Description</label>
                            <Textarea
                              value={newTagDescription}
                              onChange={(e) => setNewTagDescription(e.target.value)}
                              placeholder="Describe this moment..."
                              className="bg-slate-700 border-slate-600 text-white mt-1"
                              rows={3}
                            />
                          </div>
                          <div>
                            <label className="text-sm text-slate-400">Rating (1-5)</label>
                            <div className="flex items-center gap-2 mt-1">
                              {[1, 2, 3, 4, 5].map((rating) => (
                                <button
                                  key={rating}
                                  onClick={() => setNewTagRating(rating)}
                                  className={`p-1 ${newTagRating >= rating ? "text-yellow-400" : "text-slate-600"}`}
                                >
                                  <Star className="w-6 h-6 fill-current" />
                                </button>
                              ))}
                            </div>
                          </div>
                          <Button onClick={addTag} className="w-full bg-emerald-600 hover:bg-emerald-700">
                            Add Tag
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>

                    {/* Tags List */}
                    <div className="space-y-2 max-h-[500px] overflow-y-auto">
                      {tags.map((tag) => {
                        const tagInfo = getTagInfo(tag.tagType);
                        const TagIcon = tagInfo.icon;
                        return (
                          <div
                            key={tag.id}
                            className="p-3 bg-slate-700 rounded-lg hover:bg-slate-600 cursor-pointer transition-colors group"
                            onClick={() => jumpToTag(tag.timestamp)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3">
                                <div className={`p-2 rounded-lg ${tagInfo.color}`}>
                                  <TagIcon className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-white font-medium">{tagInfo.label}</span>
                                    <Badge variant="outline" className="text-xs border-slate-500 text-slate-400">
                                      <Clock className="w-3 h-3 mr-1" />
                                      {formatTime(tag.timestamp)}
                                    </Badge>
                                  </div>
                                  {tag.playerName && (
                                    <p className="text-emerald-400 text-sm">{tag.playerName}</p>
                                  )}
                                  {tag.description && (
                                    <p className="text-slate-400 text-sm mt-1">{tag.description}</p>
                                  )}
                                  {tag.rating && (
                                    <div className="flex items-center gap-1 mt-1">
                                      {[1, 2, 3, 4, 5].map((r) => (
                                        <Star
                                          key={r}
                                          className={`w-3 h-3 ${r <= tag.rating! ? "text-yellow-400 fill-yellow-400" : "text-slate-600"}`}
                                        />
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteTag(tag.id);
                                }}
                                className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 hover:bg-red-500/20"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </TabsContent>

                  <TabsContent value="highlights" className="mt-0">
                    <div className="text-center py-8">
                      <Star className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                      <p className="text-slate-400">Highlight reels are auto-generated from your tagged moments</p>
                      <Button className="mt-4 bg-emerald-600 hover:bg-emerald-700">
                        Generate Highlight Reel
                      </Button>
                    </div>
                  </TabsContent>
                </CardContent>
              </Tabs>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
