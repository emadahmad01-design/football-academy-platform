import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { DashboardLayoutSkeleton } from "@/components/DashboardLayoutSkeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useState } from "react";
import { 
  Plus, 
  Video, 
  Play,
  Clock,
  User,
  Tag,
  Calendar,
  Film
} from "lucide-react";
import { toast } from "sonner";

export default function Videos() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<any>(null);

  const { data: videos, isLoading, refetch } = trpc.videos.getAll.useQuery();
  const { data: players } = trpc.players.getAll.useQuery();
  const { data: matches } = trpc.matches.getAll.useQuery();

  const createVideo = trpc.videos.create.useMutation({
    onSuccess: () => {
      toast.success("Video added successfully!");
      setIsCreateOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const [formData, setFormData] = useState({
    title: "",
    videoUrl: "",
    thumbnailUrl: "",
    playerId: "",
    matchId: "",
    videoType: "training_clip" as const,
    duration: 0,
    tags: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createVideo.mutate({
      ...formData,
      playerId: formData.playerId ? parseInt(formData.playerId) : undefined,
      matchId: formData.matchId ? parseInt(formData.matchId) : undefined,
      tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : undefined,
    });
  };

  if (authLoading) return <DashboardLayoutSkeleton />;
  if (!user) {
    setLocation("/");
    return null;
  }

  const getVideoTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      match_highlight: "bg-amber-500",
      training_clip: "bg-blue-500",
      skill_demo: "bg-purple-500",
      analysis: "bg-emerald-500",
      full_match: "bg-red-500",
    };
    return <Badge className={colors[type] || "bg-gray-500"}>{type.replace('_', ' ')}</Badge>;
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Video Analysis</h1>
            <p className="text-muted-foreground">Match highlights and training clips</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Video
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Add New Video</DialogTitle>
                <DialogDescription>Upload a training clip or match highlight</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Video title"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Video URL</Label>
                  <Input
                    value={formData.videoUrl}
                    onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                    placeholder="https://..."
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Thumbnail URL (optional)</Label>
                  <Input
                    value={formData.thumbnailUrl}
                    onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                    placeholder="https://..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Video Type</Label>
                    <Select
                      value={formData.videoType}
                      onValueChange={(value: any) => setFormData({ ...formData, videoType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="z-[10001]">
                        <SelectItem value="training_clip">Training Clip</SelectItem>
                        <SelectItem value="match_highlight">Match Highlight</SelectItem>
                        <SelectItem value="skill_demo">Skill Demo</SelectItem>
                        <SelectItem value="analysis">Analysis</SelectItem>
                        <SelectItem value="full_match">Full Match</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Duration (seconds)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Player (optional)</Label>
                    <Select
                      value={formData.playerId}
                      onValueChange={(value) => setFormData({ ...formData, playerId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select player" />
                      </SelectTrigger>
                      <SelectContent className="z-[10001]">
                        {players?.map((player) => (
                          <SelectItem key={player.id} value={player.id.toString()}>
                            {player.firstName} {player.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Match (optional)</Label>
                    <Select
                      value={formData.matchId}
                      onValueChange={(value) => setFormData({ ...formData, matchId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select match" />
                      </SelectTrigger>
                      <SelectContent className="z-[10001]">
                        {matches?.map((match) => (
                          <SelectItem key={match.id} value={match.id.toString()}>
                            vs {match.opponent} ({new Date(match.matchDate).toLocaleDateString()})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Tags (comma-separated)</Label>
                  <Input
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="dribbling, goal, assist"
                  />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createVideo.isPending}>
                    {createVideo.isPending ? "Adding..." : "Add Video"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Video Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : videos && videos.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video) => (
              <Card 
                key={video.id} 
                className="overflow-hidden group cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
                onClick={() => setSelectedVideo(video)}
              >
                {/* Thumbnail */}
                <div className="relative aspect-video bg-muted">
                  {video.thumbnailUrl ? (
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Film className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  {/* Play overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
                      <Play className="h-8 w-8 text-primary-foreground ml-1" />
                    </div>
                  </div>
                  {/* Duration badge */}
                  {video.duration && (
                    <div className="absolute bottom-2 right-2 bg-black/75 text-white text-xs px-2 py-1 rounded">
                      {formatDuration(video.duration)}
                    </div>
                  )}
                </div>

                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold line-clamp-2">{video.title}</h3>
                    {getVideoTypeBadge(video.videoType)}
                  </div>

                  <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                    {video.playerId && (
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>Player #{video.playerId}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(video.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Tags */}
                  {video.tags && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {JSON.parse(video.tags).slice(0, 3).map((tag: string, i: number) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Video className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Videos Yet</h3>
              <p className="text-muted-foreground mb-4">Start adding training clips and match highlights</p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Video
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Video Player Dialog */}
        <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{selectedVideo?.title}</DialogTitle>
              <DialogDescription>
                {selectedVideo && getVideoTypeBadge(selectedVideo.videoType)}
              </DialogDescription>
            </DialogHeader>
            <div className="aspect-video w-full">
              <iframe
                src={selectedVideo?.videoUrl}
                className="w-full h-full rounded-lg"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            </div>
            {selectedVideo?.tags && (
              <div className="flex flex-wrap gap-2 mt-4">
                {JSON.parse(selectedVideo.tags).map((tag: string, i: number) => (
                  <Badge key={i} variant="outline">
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
