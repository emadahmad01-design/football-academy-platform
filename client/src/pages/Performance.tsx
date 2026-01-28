import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { useParentChild } from "@/contexts/ParentChildContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { Plus, Activity, Zap, Target, TrendingUp, Footprints, Timer } from "lucide-react";
import { toast } from "sonner";

function MetricCard({ 
  label, 
  value, 
  unit, 
  icon: Icon, 
  trend,
  color = "primary" 
}: { 
  label: string; 
  value: number | string; 
  unit?: string;
  icon: React.ElementType;
  trend?: number;
  color?: string;
}) {
  return (
    <div className="p-4 rounded-xl bg-muted/50 border border-border">
      <div className="flex items-center justify-between mb-2">
        <Icon className={`h-5 w-5 text-${color}`} />
        {trend !== undefined && (
          <span className={`text-xs ${trend >= 0 ? 'text-primary' : 'text-destructive'}`}>
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <div className="text-2xl font-bold">
        {value}
        {unit && <span className="text-sm font-normal text-muted-foreground ml-1">{unit}</span>}
      </div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function RecordPerformanceDialog({ preselectedPlayerId }: { preselectedPlayerId?: string }) {
  const [open, setOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [formData, setFormData] = useState({
    sessionDate: new Date().toISOString().split('T')[0],
    sessionType: 'training' as const,
    touches: '',
    passes: '',
    passAccuracy: '',
    shots: '',
    shotsOnTarget: '',
    dribbles: '',
    successfulDribbles: '',
    distanceCovered: '',
    topSpeed: '',
    sprints: '',
    accelerations: '',
    decelerations: '',
    possessionWon: '',
    possessionLost: '',
    interceptions: '',
    tackles: '',
    technicalScore: '',
    physicalScore: '',
    tacticalScore: '',
    overallScore: '',
    notes: '',
  });

  const { data: players } = trpc.players.getAll.useQuery();
  const utils = trpc.useUtils();
  
  const createMetric = trpc.performance.create.useMutation({
    onSuccess: () => {
      toast.success('Performance recorded successfully');
      setOpen(false);
      utils.performance.getPlayerMetrics.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to record performance');
    },
  });

  useEffect(() => {
    if (open && preselectedPlayerId) {
      setSelectedPlayer(preselectedPlayerId);
    }
  }, [open, preselectedPlayerId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlayer) {
      toast.error('Please select a player');
      return;
    }
    createMetric.mutate({
      playerId: parseInt(selectedPlayer),
      ...formData,
      touches: formData.touches ? parseInt(formData.touches) : undefined,
      passes: formData.passes ? parseInt(formData.passes) : undefined,
      passAccuracy: formData.passAccuracy ? parseInt(formData.passAccuracy) : undefined,
      shots: formData.shots ? parseInt(formData.shots) : undefined,
      shotsOnTarget: formData.shotsOnTarget ? parseInt(formData.shotsOnTarget) : undefined,
      dribbles: formData.dribbles ? parseInt(formData.dribbles) : undefined,
      successfulDribbles: formData.successfulDribbles ? parseInt(formData.successfulDribbles) : undefined,
      distanceCovered: formData.distanceCovered ? parseFloat(formData.distanceCovered) : undefined,
      topSpeed: formData.topSpeed ? parseFloat(formData.topSpeed) : undefined,
      sprints: formData.sprints ? parseInt(formData.sprints) : undefined,
      accelerations: formData.accelerations ? parseInt(formData.accelerations) : undefined,
      decelerations: formData.decelerations ? parseInt(formData.decelerations) : undefined,
      possessionWon: formData.possessionWon ? parseInt(formData.possessionWon) : undefined,
      possessionLost: formData.possessionLost ? parseInt(formData.possessionLost) : undefined,
      interceptions: formData.interceptions ? parseInt(formData.interceptions) : undefined,
      tackles: formData.tackles ? parseInt(formData.tackles) : undefined,
      technicalScore: formData.technicalScore ? parseInt(formData.technicalScore) : undefined,
      physicalScore: formData.physicalScore ? parseInt(formData.physicalScore) : undefined,
      tacticalScore: formData.tacticalScore ? parseInt(formData.tacticalScore) : undefined,
      overallScore: formData.overallScore ? parseInt(formData.overallScore) : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gradient-primary text-primary-foreground">
          <Plus className="h-4 w-4 mr-2" />
          Record Performance
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Record Performance Metrics</DialogTitle>
          <DialogDescription>
            Enter performance data from training or match sessions.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Player</Label>
                <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select player" />
                  </SelectTrigger>
                  <SelectContent className="z-[10001]">
                    {players?.map((player: any) => (
                      <SelectItem key={player.id} value={player.id.toString()}>
                        {player.firstName} {player.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Session Type</Label>
                <Select
                  value={formData.sessionType}
                  onValueChange={(value: any) => setFormData({ ...formData, sessionType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[10001]">
                    <SelectItem value="training">Training</SelectItem>
                    <SelectItem value="match">Match</SelectItem>
                    <SelectItem value="assessment">Assessment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Session Date</Label>
              <Input
                type="date"
                value={formData.sessionDate}
                onChange={(e) => setFormData({ ...formData, sessionDate: e.target.value })}
              />
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Technical Metrics</h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Touches</Label>
                  <Input
                    type="number"
                    value={formData.touches}
                    onChange={(e) => setFormData({ ...formData, touches: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Passes</Label>
                  <Input
                    type="number"
                    value={formData.passes}
                    onChange={(e) => setFormData({ ...formData, passes: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Pass Accuracy %</Label>
                  <Input
                    type="number"
                    value={formData.passAccuracy}
                    onChange={(e) => setFormData({ ...formData, passAccuracy: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Shots</Label>
                  <Input
                    type="number"
                    value={formData.shots}
                    onChange={(e) => setFormData({ ...formData, shots: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Shots on Target</Label>
                  <Input
                    type="number"
                    value={formData.shotsOnTarget}
                    onChange={(e) => setFormData({ ...formData, shotsOnTarget: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Dribbles</Label>
                  <Input
                    type="number"
                    value={formData.dribbles}
                    onChange={(e) => setFormData({ ...formData, dribbles: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Successful Dribbles</Label>
                  <Input
                    type="number"
                    value={formData.successfulDribbles}
                    onChange={(e) => setFormData({ ...formData, successfulDribbles: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Physical Metrics</h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Distance (km)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.distanceCovered}
                    onChange={(e) => setFormData({ ...formData, distanceCovered: e.target.value })}
                    placeholder="0.0"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Top Speed (km/h)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.topSpeed}
                    onChange={(e) => setFormData({ ...formData, topSpeed: e.target.value })}
                    placeholder="0.0"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Sprints</Label>
                  <Input
                    type="number"
                    value={formData.sprints}
                    onChange={(e) => setFormData({ ...formData, sprints: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Accelerations</Label>
                  <Input
                    type="number"
                    value={formData.accelerations}
                    onChange={(e) => setFormData({ ...formData, accelerations: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Decelerations</Label>
                  <Input
                    type="number"
                    value={formData.decelerations}
                    onChange={(e) => setFormData({ ...formData, decelerations: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Possession & Defensive</h4>
              <div className="grid grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Possession Won</Label>
                  <Input
                    type="number"
                    value={formData.possessionWon}
                    onChange={(e) => setFormData({ ...formData, possessionWon: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Possession Lost</Label>
                  <Input
                    type="number"
                    value={formData.possessionLost}
                    onChange={(e) => setFormData({ ...formData, possessionLost: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Interceptions</Label>
                  <Input
                    type="number"
                    value={formData.interceptions}
                    onChange={(e) => setFormData({ ...formData, interceptions: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Tackles</Label>
                  <Input
                    type="number"
                    value={formData.tackles}
                    onChange={(e) => setFormData({ ...formData, tackles: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Overall Scores (0-100)</h4>
              <div className="grid grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Technical</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.technicalScore}
                    onChange={(e) => setFormData({ ...formData, technicalScore: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Physical</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.physicalScore}
                    onChange={(e) => setFormData({ ...formData, physicalScore: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Tactical</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.tacticalScore}
                    onChange={(e) => setFormData({ ...formData, tacticalScore: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Overall</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.overallScore}
                    onChange={(e) => setFormData({ ...formData, overallScore: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Input
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional observations..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMetric.isPending}>
              {createMetric.isPending ? 'Saving...' : 'Save Performance'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Performance() {
  const { user } = useAuth();
  const { selectedChildId } = useParentChild();
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  
  // For parents, get their linked children; for staff, get all players
  const { data: players } = user?.role === 'parent' 
    ? trpc.parentRelations.getLinkedPlayers.useQuery()
    : trpc.players.getAll.useQuery();
  
  // Auto-select child for parents
  useEffect(() => {
    if (user?.role === 'parent' && selectedChildId && !selectedPlayer) {
      setSelectedPlayer(selectedChildId);
    }
  }, [user, selectedChildId, selectedPlayer]);
  
  const { data: metrics } = trpc.performance.getPlayerMetrics.useQuery(
    { playerId: parseInt(selectedPlayer), limit: 10 },
    { enabled: !!selectedPlayer }
  );

  const [selectedMetricId, setSelectedMetricId] = useState<number | null>(null);

  useEffect(() => {
    if (metrics && metrics.length > 0 && selectedMetricId === null) {
      setSelectedMetricId(metrics[0].id);
    } else if (metrics && metrics.length > 0 && !metrics.find(m => m.id === selectedMetricId)) {
        // If selected ID is no longer in the list (e.g. switched player), reset to first
        setSelectedMetricId(metrics[0].id);
    } else if (!metrics || metrics.length === 0) {
        setSelectedMetricId(null);
    }
  }, [metrics, selectedMetricId]);

  const currentMetric = metrics?.find(m => m.id === selectedMetricId) || metrics?.[0];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Performance Tracking</h1>
            <p className="text-muted-foreground">
              Monitor and analyze player performance metrics
            </p>
          </div>
          <RecordPerformanceDialog preselectedPlayerId={selectedPlayer} />
        </div>

        {/* Player Selection */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Label className="whitespace-nowrap">Select Player:</Label>
              <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
                <SelectTrigger className="max-w-xs">
                  <SelectValue placeholder="Choose a player to view" />
                </SelectTrigger>
                <SelectContent>
                  {players?.map((player: any) => (
                    <SelectItem key={player.id} value={player.id.toString()}>
                      {player.firstName} {player.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {selectedPlayer && currentMetric ? (
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="technical">Technical</TabsTrigger>
              <TabsTrigger value="physical">Physical</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Score Cards */}
              <div className="grid gap-4 md:grid-cols-4">
                <Card className="stat-glow">
                  <CardContent className="p-6 text-center">
                    <div className="text-5xl font-bold text-primary mb-2">
                      {currentMetric.overallScore || '--'}
                    </div>
                    <div className="text-sm text-muted-foreground">Overall Score</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="text-4xl font-bold text-chart-1 mb-2">
                      {currentMetric.technicalScore || '--'}
                    </div>
                    <div className="text-sm text-muted-foreground">Technical</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="text-4xl font-bold text-chart-2 mb-2">
                      {currentMetric.physicalScore || '--'}
                    </div>
                    <div className="text-sm text-muted-foreground">Physical</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="text-4xl font-bold text-chart-3 mb-2">
                      {currentMetric.tacticalScore || '--'}
                    </div>
                    <div className="text-sm text-muted-foreground">Tactical</div>
                  </CardContent>
                </Card>
              </div>

              {/* Latest Session Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Session Details</CardTitle>
                  <CardDescription>
                    {currentMetric.sessionType} on {new Date(currentMetric.sessionDate).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
                    <MetricCard
                      label="Touches"
                      value={currentMetric.touches || 0}
                      icon={Footprints}
                      color="primary"
                    />
                    <MetricCard
                      label="Passes"
                      value={currentMetric.passes || 0}
                      icon={Activity}
                      color="chart-2"
                    />
                    <MetricCard
                      label="Pass Accuracy"
                      value={currentMetric.passAccuracy || 0}
                      unit="%"
                      icon={Target}
                      color="chart-3"
                    />
                    <MetricCard
                      label="Distance"
                      value={currentMetric.distanceCovered || 0}
                      unit="km"
                      icon={TrendingUp}
                      color="chart-4"
                    />
                    <MetricCard
                      label="Top Speed"
                      value={currentMetric.topSpeed || 0}
                      unit="km/h"
                      icon={Zap}
                      color="accent"
                    />
                    <MetricCard
                      label="Sprints"
                      value={currentMetric.sprints || 0}
                      icon={Timer}
                      color="primary"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="technical" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Technical Metrics</CardTitle>
                  <CardDescription>Ball control, passing, and shooting analysis</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                      <h4 className="font-medium">Ball Control</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Touches</span>
                          <span className="font-medium">{currentMetric.touches || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Dribbles Attempted</span>
                          <span className="font-medium">{currentMetric.dribbles || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Successful Dribbles</span>
                          <span className="font-medium">{currentMetric.successfulDribbles || 0}</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h4 className="font-medium">Passing</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Total Passes</span>
                          <span className="font-medium">{currentMetric.passes || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Pass Accuracy</span>
                          <span className="font-medium">{currentMetric.passAccuracy || 0}%</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h4 className="font-medium">Shooting</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Shots</span>
                          <span className="font-medium">{currentMetric.shots || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Shots on Target</span>
                          <span className="font-medium">{currentMetric.shotsOnTarget || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Shot Accuracy</span>
                          <span className="font-medium">
                            {currentMetric.shots ? Math.round((currentMetric.shotsOnTarget || 0) / currentMetric.shots * 100) : 0}%
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h4 className="font-medium">Defensive</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Interceptions</span>
                          <span className="font-medium">{currentMetric.interceptions || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Tackles</span>
                          <span className="font-medium">{currentMetric.tackles || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="physical" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Physical Metrics</CardTitle>
                  <CardDescription>Movement, speed, and endurance data</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <MetricCard
                      label="Distance Covered"
                      value={currentMetric.distanceCovered || 0}
                      unit="km"
                      icon={TrendingUp}
                      color="primary"
                    />
                    <MetricCard
                      label="Top Speed"
                      value={currentMetric.topSpeed || 0}
                      unit="km/h"
                      icon={Zap}
                      color="chart-2"
                    />
                    <MetricCard
                      label="Sprints"
                      value={currentMetric.sprints || 0}
                      icon={Timer}
                      color="chart-3"
                    />
                    <MetricCard
                      label="Accelerations"
                      value={currentMetric.accelerations || 0}
                      icon={Activity}
                      color="chart-4"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Performance History</CardTitle>
                  <CardDescription>Recent session records</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {metrics?.map((metric, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedMetricId(metric.id)}
                        className={`w-full flex items-center gap-4 p-4 rounded-lg transition-colors text-left ${
                          metric.id === selectedMetricId ? 'bg-primary/20 ring-2 ring-primary' : 'bg-muted/50 hover:bg-muted'
                        }`}
                      >
                        <div className="text-center min-w-[80px]">
                          <div className="text-2xl font-bold text-primary">{metric.overallScore || '--'}</div>
                          <div className="text-xs text-muted-foreground">Overall</div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium capitalize">{metric.sessionType}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(metric.sessionDate).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex gap-4 text-sm text-muted-foreground">
                            <span>Tech: {metric.technicalScore || '--'}</span>
                            <span>Phys: {metric.physicalScore || '--'}</span>
                            <span>Tact: {metric.tacticalScore || '--'}</span>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : selectedPlayer ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No performance data</h3>
              <p className="text-muted-foreground mb-4">
                Start recording performance metrics for this player
              </p>
              <RecordPerformanceDialog preselectedPlayerId={selectedPlayer} />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Select a Player</h3>
              <p className="text-muted-foreground">
                Choose a player from the dropdown above to view their performance data
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
