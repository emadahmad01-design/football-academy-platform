import { useState } from 'react';
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { DashboardLayoutSkeleton } from "@/components/DashboardLayoutSkeleton";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useLocation } from 'wouter';
import { AlertTriangle, Plus, Calendar, TrendingUp, Activity, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';
import { Streamdown } from 'streamdown';

type InjuryType = 'muscle' | 'ligament' | 'bone' | 'concussion' | 'other';
type InjurySeverity = 'minor' | 'moderate' | 'severe';

interface Injury {
  id: string;
  playerId: number;
  playerName: string;
  type: InjuryType;
  severity: InjurySeverity;
  description: string;
  injuryDate: string;
  expectedRecoveryWeeks: number;
  status: 'recovering' | 'recovered';
  aiRecommendations?: string;
}

export default function InjuryTracking() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [injuryType, setInjuryType] = useState<InjuryType>('muscle');
  const [severity, setSeverity] = useState<InjurySeverity>('moderate');
  const [description, setDescription] = useState('');
  const [injuryDate, setInjuryDate] = useState(new Date().toISOString().split('T')[0]);
  const [expectedWeeks, setExpectedWeeks] = useState('2');
  const [injuries, setInjuries] = useState<Injury[]>([]);
  const [selectedInjury, setSelectedInjury] = useState<Injury | null>(null);
  const [isGeneratingRecommendations, setIsGeneratingRecommendations] = useState(false);

  const { data: players } = trpc.players.getAll.useQuery();

  if (authLoading) return <DashboardLayoutSkeleton />;
  if (!user) {
    setLocation("/");
    return null;
  }

  const handleAddInjury = () => {
    if (!selectedPlayerId || !description) {
      toast.error("Please fill in all required fields");
      return;
    }

    const player = players?.find(p => p.id === parseInt(selectedPlayerId));
    if (!player) return;

    const newInjury: Injury = {
      id: Date.now().toString(),
      playerId: player.id,
      playerName: player.name,
      type: injuryType,
      severity,
      description,
      injuryDate,
      expectedRecoveryWeeks: parseInt(expectedWeeks),
      status: 'recovering'
    };

    setInjuries(prev => [...prev, newInjury]);
    setShowAddForm(false);
    resetForm();
    toast.success("Injury recorded successfully");
  };

  const resetForm = () => {
    setSelectedPlayerId('');
    setDescription('');
    setInjuryDate(new Date().toISOString().split('T')[0]);
    setExpectedWeeks('2');
  };

  const generateAIRecommendations = async (injury: Injury) => {
    setIsGeneratingRecommendations(true);
    setSelectedInjury(injury);

    try {
      // Simulate AI recommendations (in real app, this would call the backend)
      await new Promise(resolve => setTimeout(resolve, 2000));

      const recommendations = `## Recovery Plan for ${injury.playerName}

**Injury Type:** ${injury.type.charAt(0).toUpperCase() + injury.type.slice(1)} - ${injury.severity}

### Phase 1: Initial Recovery (Weeks 1-2)
- **Rest and Ice**: Apply ice packs 3-4 times daily for 15-20 minutes
- **Compression**: Use compression bandages to reduce swelling
- **Elevation**: Keep injured area elevated when resting
- **Pain Management**: Over-the-counter anti-inflammatories as needed
- **Gentle Range of Motion**: Start with passive movements after 48 hours

### Phase 2: Rehabilitation (Weeks 3-${Math.ceil(injury.expectedRecoveryWeeks * 0.7)})
- **Physical Therapy**: 3 sessions per week focusing on:
  - Strengthening exercises
  - Flexibility training
  - Balance and proprioception work
- **Gradual Load Increase**: Progressive resistance training
- **Pool Therapy**: Low-impact cardiovascular work
- **Monitoring**: Weekly assessments of pain levels and mobility

### Phase 3: Return to Play (Weeks ${Math.ceil(injury.expectedRecoveryWeeks * 0.7)}-${injury.expectedRecoveryWeeks})
- **Sport-Specific Drills**: Gradual introduction of football-specific movements
- **Fitness Testing**: Ensure 90%+ of pre-injury fitness levels
- **Modified Training**: Start with individual training, progress to group
- **Match Fitness**: Begin with 20-30 minute substitute appearances
- **Ongoing Monitoring**: Regular check-ins with medical staff

### Key Milestones
1. **Week 1**: Pain-free at rest
2. **Week ${Math.ceil(injury.expectedRecoveryWeeks * 0.4)}**: Full range of motion restored
3. **Week ${Math.ceil(injury.expectedRecoveryWeeks * 0.6)}**: Running without pain
4. **Week ${Math.ceil(injury.expectedRecoveryWeeks * 0.8)}**: Passing fitness tests
5. **Week ${injury.expectedRecoveryWeeks}**: Cleared for full training

### Warning Signs (Seek immediate medical attention)
- Increased pain or swelling
- Loss of function or mobility
- Numbness or tingling
- Fever or signs of infection

### Nutrition Recommendations
- **Protein**: 1.6-2.2g per kg body weight for tissue repair
- **Omega-3**: Anti-inflammatory benefits
- **Vitamin D & Calcium**: For bone health
- **Hydration**: Minimum 3L water daily

### Psychological Support
- Regular communication with coaching staff
- Set realistic short-term goals
- Maintain team involvement (attend matches, training observations)
- Consider sports psychology sessions if needed`;

      setInjuries(prev => prev.map(inj => 
        inj.id === injury.id ? { ...inj, aiRecommendations: recommendations } : inj
      ));

      toast.success("AI recommendations generated!");
    } catch (error: any) {
      toast.error("Failed to generate recommendations: " + error.message);
    } finally {
      setIsGeneratingRecommendations(false);
    }
  };

  const markAsRecovered = (injuryId: string) => {
    setInjuries(prev => prev.map(inj => 
      inj.id === injuryId ? { ...inj, status: 'recovered' } : inj
    ));
    toast.success("Player marked as recovered!");
  };

  const getSeverityColor = (severity: InjurySeverity) => {
    switch (severity) {
      case 'minor': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'moderate': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'severe': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'recovering' 
      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
  };

  const activeInjuries = injuries.filter(inj => inj.status === 'recovering');
  const recoveredInjuries = injuries.filter(inj => inj.status === 'recovered');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <AlertTriangle className="h-8 w-8 text-primary" />
              Injury Tracking System
            </h1>
            <p className="text-muted-foreground mt-2">
              Track player injuries with AI-powered recovery recommendations
            </p>
          </div>
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Record Injury
          </Button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Injuries</p>
                  <p className="text-3xl font-bold">{activeInjuries.length}</p>
                </div>
                <Activity className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Recovered</p>
                  <p className="text-3xl font-bold">{recoveredInjuries.length}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Tracked</p>
                  <p className="text-3xl font-bold">{injuries.length}</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add Injury Form */}
        {showAddForm && (
          <Card>
            <CardHeader>
              <CardTitle>Record New Injury</CardTitle>
              <CardDescription>Document player injury details for tracking and recovery planning</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Player</label>
                  <Select value={selectedPlayerId} onValueChange={setSelectedPlayerId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select player" />
                    </SelectTrigger>
                    <SelectContent>
                      {players?.map(player => (
                        <SelectItem key={player.id} value={player.id.toString()}>
                          {player.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Injury Date</label>
                  <Input
                    type="date"
                    value={injuryDate}
                    onChange={(e) => setInjuryDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Type</label>
                  <Select value={injuryType} onValueChange={(v) => setInjuryType(v as InjuryType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="muscle">Muscle</SelectItem>
                      <SelectItem value="ligament">Ligament</SelectItem>
                      <SelectItem value="bone">Bone</SelectItem>
                      <SelectItem value="concussion">Concussion</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Severity</label>
                  <Select value={severity} onValueChange={(v) => setSeverity(v as InjurySeverity)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="minor">Minor</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="severe">Severe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Expected Recovery (weeks)</label>
                  <Input
                    type="number"
                    min="1"
                    value={expectedWeeks}
                    onChange={(e) => setExpectedWeeks(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  placeholder="Describe the injury, how it occurred, and initial symptoms..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleAddInjury}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Injury
                </Button>
                <Button variant="outline" onClick={() => { setShowAddForm(false); resetForm(); }}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Active Injuries */}
        {activeInjuries.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Active Injuries</h2>
            {activeInjuries.map(injury => (
              <Card key={injury.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{injury.playerName}</CardTitle>
                      <CardDescription>
                        {injury.type.charAt(0).toUpperCase() + injury.type.slice(1)} injury • Injured on {new Date(injury.injuryDate).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={getSeverityColor(injury.severity)}>
                        {injury.severity}
                      </Badge>
                      <Badge className={getStatusColor(injury.status)}>
                        {injury.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Description:</p>
                    <p className="text-sm">{injury.description}</p>
                  </div>

                  <div className="flex items-center gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Expected Recovery:</span>
                      <span className="ml-2 font-medium">{injury.expectedRecoveryWeeks} weeks</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Return Date:</span>
                      <span className="ml-2 font-medium">
                        {new Date(new Date(injury.injuryDate).getTime() + injury.expectedRecoveryWeeks * 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {injury.aiRecommendations && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-blue-600" />
                        AI Recovery Plan
                      </h4>
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <Streamdown>{injury.aiRecommendations}</Streamdown>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {!injury.aiRecommendations && (
                      <Button
                        onClick={() => generateAIRecommendations(injury)}
                        disabled={isGeneratingRecommendations && selectedInjury?.id === injury.id}
                        size="sm"
                      >
                        {isGeneratingRecommendations && selectedInjury?.id === injury.id ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4 mr-2" />
                            Generate AI Recovery Plan
                          </>
                        )}
                      </Button>
                    )}
                    <Button
                      onClick={() => markAsRecovered(injury.id)}
                      variant="outline"
                      size="sm"
                    >
                      Mark as Recovered
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Recovered Injuries */}
        {recoveredInjuries.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Recovery History</h2>
            {recoveredInjuries.map(injury => (
              <Card key={injury.id} className="opacity-75">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{injury.playerName}</CardTitle>
                      <CardDescription>
                        {injury.type.charAt(0).toUpperCase() + injury.type.slice(1)} injury • {new Date(injury.injuryDate).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(injury.status)}>
                      Recovered
                    </Badge>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}

        {injuries.length === 0 && !showAddForm && (
          <Card>
            <CardContent className="py-12 text-center">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No injuries recorded</h3>
              <p className="text-muted-foreground mb-4">Start tracking player injuries to monitor recovery and plan return-to-play</p>
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Record First Injury
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
