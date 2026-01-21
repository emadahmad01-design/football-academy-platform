import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { DashboardLayoutSkeleton } from "@/components/DashboardLayoutSkeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { TrendingUp, Loader2, Sparkles, Target, AlertCircle, CheckCircle2, Users, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default function PerformancePrediction() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [predictionType, setPredictionType] = useState<'player' | 'team'>('team');
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
  const [prediction, setPrediction] = useState<any>(null);
  const [isPredicting, setIsPredicting] = useState(false);

  const { data: teams } = trpc.teams.getAll.useQuery();
  const { data: players } = trpc.players.getAll.useQuery();
  const { data: matches } = trpc.matches.getAll.useQuery();

  const generatePrediction = trpc.performancePrediction.predict.useMutation({
    onSuccess: (data) => {
      setPrediction(data);
      setIsPredicting(false);
      toast.success("Prediction generated!");
    },
    onError: (error) => {
      setIsPredicting(false);
      toast.error("Prediction failed: " + error.message);
    },
  });

  if (authLoading) return <DashboardLayoutSkeleton />;
  if (!user) {
    setLocation("/");
    return null;
  }

  const handlePredict = () => {
    if (predictionType === 'team' && !selectedTeamId) {
      toast.error("Please select a team");
      return;
    }
    if (predictionType === 'player' && !selectedPlayerId) {
      toast.error("Please select a player");
      return;
    }
    
    setIsPredicting(true);
    setPrediction(null);
    generatePrediction.mutate({
      type: predictionType,
      teamId: predictionType === 'team' ? selectedTeamId! : undefined,
      playerId: predictionType === 'player' ? selectedPlayerId! : undefined,
      matchId: selectedMatchId || undefined
    });
  };

  const teamMatches = matches?.filter(m => m.teamId === selectedTeamId) || [];
  const upcomingMatches = teamMatches.filter(m => !m.result || m.result === 'pending');

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-500';
    if (confidence >= 60) return 'text-yellow-500';
    return 'text-orange-500';
  };

  const getConfidenceBg = (confidence: number) => {
    if (confidence >= 80) return 'bg-green-500';
    if (confidence >= 60) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <TrendingUp className="h-8 w-8 text-primary" />
            Performance Prediction
          </h1>
          <p className="text-muted-foreground mt-2">
            AI-powered predictions for player and team performance in upcoming matches
          </p>
        </div>

        {/* Prediction Setup */}
        <Card>
          <CardHeader>
            <CardTitle>Generate Prediction</CardTitle>
            <CardDescription>
              Select prediction type and parameters to forecast performance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Prediction Type */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Prediction Type</label>
              <div className="flex gap-2">
                <Button
                  variant={predictionType === 'team' ? 'default' : 'outline'}
                  onClick={() => setPredictionType('team')}
                  className="flex-1"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Team Performance
                </Button>
                <Button
                  variant={predictionType === 'player' ? 'default' : 'outline'}
                  onClick={() => setPredictionType('player')}
                  className="flex-1"
                >
                  <Target className="h-4 w-4 mr-2" />
                  Player Performance
                </Button>
              </div>
            </div>

            {/* Team Selection */}
            {predictionType === 'team' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Team</label>
                <Select
                  value={selectedTeamId?.toString() || ""}
                  onValueChange={(value) => setSelectedTeamId(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a team" />
                  </SelectTrigger>
                  <SelectContent className="z-[10001]">
                    {teams?.map(team => (
                      <SelectItem key={team.id} value={team.id.toString()}>
                        {team.name} ({team.ageGroup})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Player Selection */}
            {predictionType === 'player' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Player</label>
                <Select
                  value={selectedPlayerId?.toString() || ""}
                  onValueChange={(value) => setSelectedPlayerId(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a player" />
                  </SelectTrigger>
                  <SelectContent className="z-[10001]">
                    {players?.map(player => (
                      <SelectItem key={player.id} value={player.id.toString()}>
                        {player.firstName} {player.lastName} - {player.position}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Match Selection (Optional) */}
            {selectedTeamId && upcomingMatches.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Specific Match (Optional)</label>
                <Select
                  value={selectedMatchId?.toString() || ""}
                  onValueChange={(value) => setSelectedMatchId(value ? parseInt(value) : null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="General prediction" />
                  </SelectTrigger>
                  <SelectContent className="z-[10001]">
                    <SelectItem value="0">General prediction</SelectItem>
                    {upcomingMatches.map(match => (
                      <SelectItem key={match.id} value={match.id.toString()}>
                        vs {match.opponent} - {match.matchDate ? new Date(match.matchDate).toLocaleDateString() : 'TBD'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button 
              onClick={handlePredict} 
              disabled={isPredicting || (predictionType === 'team' ? !selectedTeamId : !selectedPlayerId)}
              className="w-full gap-2"
              size="lg"
            >
              {isPredicting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Generating Prediction...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  Generate Prediction
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Loading State */}
        {isPredicting && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground">Analyzing historical data and generating predictions...</p>
            </CardContent>
          </Card>
        )}

        {/* Prediction Results */}
        {prediction && !isPredicting && (
          <div className="space-y-4">
            {/* Overall Prediction */}
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Performance Forecast
                  </span>
                  <Badge variant="outline" className={getConfidenceColor(prediction.confidence || 75)}>
                    {prediction.confidence || 75}% Confidence
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-2">{prediction.overallPrediction || 'Good Performance Expected'}</div>
                <p className="text-sm text-muted-foreground">
                  {prediction.summary || 'Based on recent performance trends and historical data'}
                </p>
              </CardContent>
            </Card>

            {/* Predicted Metrics */}
            {prediction.metrics && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Predicted Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(prediction.metrics).map(([key, value]: [string, any]) => (
                      <div key={key} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                          <span className="font-semibold">{value}%</span>
                        </div>
                        <Progress value={value} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Confidence Factors */}
            {prediction.factors && (
              <Card>
                <CardHeader>
                  <CardTitle>Factors Influencing Prediction</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {prediction.factors.split('\n').filter((f: string) => f.trim()).map((factor: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-3 p-3 border rounded-lg">
                        <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm flex-1">{factor}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Trend Analysis */}
            {prediction.trend && (
              <Card className="border-blue-500/20 bg-blue-500/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-500" />
                    Performance Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="whitespace-pre-wrap text-sm">{prediction.trend}</pre>
                </CardContent>
              </Card>
            )}

            {/* Recommendations */}
            {prediction.recommendations && (
              <Card className="border-green-500/20 bg-green-500/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-green-500" />
                    AI Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="whitespace-pre-wrap text-sm">{prediction.recommendations}</pre>
                </CardContent>
              </Card>
            )}

            {/* Risk Factors */}
            {prediction.risks && (
              <Card className="border-orange-500/20 bg-orange-500/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-orange-500" />
                    Potential Risk Factors
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="whitespace-pre-wrap text-sm">{prediction.risks}</pre>
                </CardContent>
              </Card>
            )}

            {/* Full Analysis */}
            {prediction.fullAnalysis && (
              <Card>
                <CardHeader>
                  <CardTitle>Complete Prediction Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="whitespace-pre-wrap text-sm">{prediction.fullAnalysis}</pre>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Empty State */}
        {!prediction && !isPredicting && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
              <TrendingUp className="h-16 w-16 text-muted-foreground" />
              <div className="text-center space-y-2">
                <p className="text-lg font-semibold">No Prediction Yet</p>
                <p className="text-sm text-muted-foreground max-w-md">
                  Select a team or player above and click "Generate Prediction" to get AI-powered 
                  performance forecasts based on historical data and trends.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info Card */}
        <Card className="border-purple-500/20 bg-purple-500/5">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-purple-500 mt-0.5" />
              <div>
                <p className="font-medium mb-1">How Performance Prediction Works</p>
                <p className="text-sm text-muted-foreground">
                  Our AI analyzes historical performance data, recent form, training metrics, and match statistics 
                  to forecast future performance. Predictions include confidence levels based on data quality and 
                  consistency. Use these insights to prepare strategies and set realistic expectations.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
