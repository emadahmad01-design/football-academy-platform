import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { DashboardLayoutSkeleton } from "@/components/DashboardLayoutSkeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Video, Loader2, Sparkles, Play, Target, TrendingUp, Users, Download } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function AIVideoAnalysis() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [videoUrl, setVideoUrl] = useState("");
  const [videoDescription, setVideoDescription] = useState("");
  const [analysis, setAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeVideo = trpc.videoAnalysis.analyze.useMutation({
    onSuccess: (data) => {
      setAnalysis(data);
      setIsAnalyzing(false);
      toast.success("Video analysis complete!");
    },
    onError: (error) => {
      setIsAnalyzing(false);
      toast.error("Analysis failed: " + error.message);
    },
  });

  if (authLoading) return <DashboardLayoutSkeleton />;
  if (!user) {
    setLocation("/");
    return null;
  }

  const handleAnalyze = () => {
    if (!videoUrl.trim() && !videoDescription.trim()) {
      toast.error("Please provide either a video URL or description");
      return;
    }
    setIsAnalyzing(true);
    setAnalysis(null);
    analyzeVideo.mutate({ 
      videoUrl: videoUrl.trim() || undefined, 
      description: videoDescription.trim() || undefined 
    });
  };

  const handleExport = () => {
    if (!analysis) return;
    
    const report = `AI VIDEO ANALYSIS REPORT
========================

Video: ${videoUrl || 'Description-based analysis'}
Date: ${new Date().toLocaleDateString()}

FORMATION DETECTED
------------------
${analysis.formation || 'N/A'}

TACTICAL PATTERNS
-----------------
${analysis.tacticalPatterns || 'N/A'}

PLAYER MOVEMENTS
----------------
${analysis.playerMovements || 'N/A'}

PASSING PATTERNS
----------------
${analysis.passingPatterns || 'N/A'}

KEY MOMENTS
-----------
${analysis.keyMoments || 'N/A'}

RECOMMENDATIONS
---------------
${analysis.recommendations || 'N/A'}

FULL ANALYSIS
-------------
${analysis.fullAnalysis || 'N/A'}
`;

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `video-analysis-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Report exported!");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Video className="h-8 w-8 text-primary" />
            AI Video Analysis
          </h1>
          <p className="text-muted-foreground mt-2">
            Analyze match videos with AI to detect tactical patterns, formations, and player movements
          </p>
        </div>

        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle>Video Input</CardTitle>
            <CardDescription>
              Provide a video URL or describe the match scenario for AI analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="videoUrl">Video URL (YouTube, Vimeo, or direct link)</Label>
              <Input
                id="videoUrl"
                type="url"
                placeholder="https://youtube.com/watch?v=..."
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Paste a link to the match video you want to analyze
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-1 border-t"></div>
              <span className="text-sm text-muted-foreground">OR</span>
              <div className="flex-1 border-t"></div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Match Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the match scenario, formations, key moments, and tactical patterns you observed..."
                value={videoDescription}
                onChange={(e) => setVideoDescription(e.target.value)}
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Describe what you saw in the match for AI to analyze the tactical aspects
              </p>
            </div>

            <Button 
              onClick={handleAnalyze} 
              disabled={isAnalyzing || (!videoUrl.trim() && !videoDescription.trim())}
              className="w-full gap-2"
              size="lg"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Analyzing Video...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  Analyze with AI
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Loading State */}
        {isAnalyzing && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground">Analyzing tactical patterns and player movements...</p>
              <p className="text-sm text-muted-foreground">This may take a moment</p>
            </CardContent>
          </Card>
        )}

        {/* Analysis Results */}
        {analysis && !isAnalyzing && (
          <div className="space-y-4">
            {/* Video Preview */}
            {videoUrl && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Play className="h-5 w-5 text-primary" />
                    Video
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video bg-black rounded-lg flex items-center justify-center">
                    <p className="text-white text-sm">Video preview: {videoUrl}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Formation Detected */}
            {analysis.formation && (
              <Card className="border-blue-500/20 bg-blue-500/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-blue-500" />
                    Formation Detected
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold mb-2">{analysis.formation}</div>
                  <p className="text-sm text-muted-foreground">
                    {analysis.formationDetails || 'Formation identified from tactical positioning'}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Tactical Patterns */}
            {analysis.tacticalPatterns && (
              <Card className="border-green-500/20 bg-green-500/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    Tactical Patterns
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="whitespace-pre-wrap text-sm">{analysis.tacticalPatterns}</pre>
                </CardContent>
              </Card>
            )}

            {/* Player Movements */}
            {analysis.playerMovements && (
              <Card className="border-purple-500/20 bg-purple-500/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-purple-500" />
                    Player Movements & Positioning
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="whitespace-pre-wrap text-sm">{analysis.playerMovements}</pre>
                </CardContent>
              </Card>
            )}

            {/* Passing Patterns */}
            {analysis.passingPatterns && (
              <Card className="border-orange-500/20 bg-orange-500/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-orange-500" />
                    Passing Patterns
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="whitespace-pre-wrap text-sm">{analysis.passingPatterns}</pre>
                </CardContent>
              </Card>
            )}

            {/* Key Moments */}
            {analysis.keyMoments && (
              <Card>
                <CardHeader>
                  <CardTitle>Key Moments Timeline</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analysis.keyMoments.split('\n').filter((m: string) => m.trim()).map((moment: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-3 p-3 border rounded-lg">
                        <Badge variant="outline">{idx + 1}</Badge>
                        <p className="text-sm flex-1">{moment}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recommendations */}
            {analysis.recommendations && (
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    AI Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="whitespace-pre-wrap text-sm">{analysis.recommendations}</pre>
                </CardContent>
              </Card>
            )}

            {/* Full Analysis */}
            {analysis.fullAnalysis && (
              <Card>
                <CardHeader>
                  <CardTitle>Complete Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="whitespace-pre-wrap text-sm">{analysis.fullAnalysis}</pre>
                </CardContent>
              </Card>
            )}

            {/* Export Button */}
            <div className="flex justify-end">
              <Button onClick={handleExport} variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Export Report
              </Button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!analysis && !isAnalyzing && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
              <Video className="h-16 w-16 text-muted-foreground" />
              <div className="text-center space-y-2">
                <p className="text-lg font-semibold">No Analysis Yet</p>
                <p className="text-sm text-muted-foreground max-w-md">
                  Provide a video URL or describe a match scenario above, then click "Analyze with AI" 
                  to get tactical insights, formation detection, and pattern analysis.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info Card */}
        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-2">What AI Video Analysis Can Detect:</h3>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Team formations and tactical setups (4-3-3, 4-4-2, etc.)</li>
              <li>Player positioning and movement patterns</li>
              <li>Passing networks and build-up play</li>
              <li>Pressing triggers and defensive organization</li>
              <li>Transition moments (attack to defense and vice versa)</li>
              <li>Set piece routines and patterns</li>
              <li>Individual player roles and responsibilities</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
