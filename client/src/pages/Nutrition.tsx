import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/_core/hooks/useAuth";
import { useParentChild } from "@/contexts/ParentChildContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { Plus, Apple, Droplets, Flame, Beef, Wheat, Cookie } from "lucide-react";
import { toast } from "sonner";

function MacroCard({ 
  label, 
  value, 
  target, 
  unit, 
  icon: Icon, 
  color 
}: { 
  label: string; 
  value: number; 
  target: number;
  unit: string;
  icon: React.ElementType;
  color: string;
}) {
  const percentage = Math.min((value / target) * 100, 100);
  
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className={`p-2 rounded-lg ${color}`}>
            <Icon className="h-4 w-4" />
          </div>
          <span className="text-xs text-muted-foreground">{Math.round(percentage)}%</span>
        </div>
        <div className="text-2xl font-bold mb-1">
          {value}<span className="text-sm font-normal text-muted-foreground ml-1">{unit}</span>
        </div>
        <div className="text-xs text-muted-foreground mb-2">{label}</div>
        <Progress value={percentage} className="h-1.5" />
        <div className="text-xs text-muted-foreground mt-1">Target: {target}{unit}</div>
      </CardContent>
    </Card>
  );
}

function CreateMealPlanDialog() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    playerId: '',
    title: '',
    planDate: new Date().toISOString().split('T')[0],
    mealType: 'lunch' as const,
    foods: '',
    calories: '',
    protein: '',
    carbs: '',
    fats: '',
    hydrationMl: '',
    notes: '',
  });

  const { data: players } = trpc.players.getAll.useQuery();
  const utils = trpc.useUtils();
  
  const createMealPlan = trpc.nutrition.createMealPlan.useMutation({
    onSuccess: () => {
      toast.success('Meal plan created');
      setOpen(false);
      utils.nutrition.getPlayerMealPlans.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create meal plan');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.playerId) {
      toast.error('Please select a player');
      return;
    }
    createMealPlan.mutate({
      ...formData,
      playerId: parseInt(formData.playerId),
      calories: formData.calories ? parseInt(formData.calories) : undefined,
      protein: formData.protein ? parseInt(formData.protein) : undefined,
      carbs: formData.carbs ? parseInt(formData.carbs) : undefined,
      fats: formData.fats ? parseInt(formData.fats) : undefined,
      hydrationMl: formData.hydrationMl ? parseInt(formData.hydrationMl) : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gradient-primary text-primary-foreground">
          <Plus className="h-4 w-4 mr-2" />
          Create Meal Plan
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Meal Plan</DialogTitle>
          <DialogDescription>
            Design a personalized nutrition plan for a player.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Player</Label>
                <Select
                  value={formData.playerId}
                  onValueChange={(value) => setFormData({ ...formData, playerId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select player" />
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
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={formData.planDate}
                  onChange={(e) => setFormData({ ...formData, planDate: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Match Day Fuel"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Meal Type</Label>
                <Select
                  value={formData.mealType}
                  onValueChange={(value: any) => setFormData({ ...formData, mealType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="breakfast">Breakfast</SelectItem>
                    <SelectItem value="lunch">Lunch</SelectItem>
                    <SelectItem value="dinner">Dinner</SelectItem>
                    <SelectItem value="snack">Snack</SelectItem>
                    <SelectItem value="pre_training">Pre-Training</SelectItem>
                    <SelectItem value="post_training">Post-Training</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Foods</Label>
              <Textarea
                value={formData.foods}
                onChange={(e) => setFormData({ ...formData, foods: e.target.value })}
                placeholder="List the foods and portions..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Calories</Label>
                <Input
                  type="number"
                  value={formData.calories}
                  onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
                  placeholder="kcal"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Protein (g)</Label>
                <Input
                  type="number"
                  value={formData.protein}
                  onChange={(e) => setFormData({ ...formData, protein: e.target.value })}
                  placeholder="g"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Carbs (g)</Label>
                <Input
                  type="number"
                  value={formData.carbs}
                  onChange={(e) => setFormData({ ...formData, carbs: e.target.value })}
                  placeholder="g"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Fats (g)</Label>
                <Input
                  type="number"
                  value={formData.fats}
                  onChange={(e) => setFormData({ ...formData, fats: e.target.value })}
                  placeholder="g"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Hydration (ml)</Label>
              <Input
                type="number"
                value={formData.hydrationMl}
                onChange={(e) => setFormData({ ...formData, hydrationMl: e.target.value })}
                placeholder="e.g., 500"
              />
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional instructions..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMealPlan.isPending}>
              {createMealPlan.isPending ? 'Creating...' : 'Create Plan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function MealCard({ meal }: { meal: any }) {
  const getMealTypeIcon = (type: string) => {
    const icons: Record<string, React.ElementType> = {
      breakfast: Cookie,
      lunch: Apple,
      dinner: Beef,
      snack: Cookie,
      pre_training: Flame,
      post_training: Droplets,
    };
    return icons[type] || Apple;
  };

  const getMealTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      breakfast: 'bg-accent/20 text-accent',
      lunch: 'bg-primary/20 text-primary',
      dinner: 'bg-chart-2/20 text-chart-2',
      snack: 'bg-chart-3/20 text-chart-3',
      pre_training: 'bg-destructive/20 text-destructive',
      post_training: 'bg-chart-4/20 text-chart-4',
    };
    return colors[type] || 'bg-muted text-muted-foreground';
  };

  const Icon = getMealTypeIcon(meal.mealType);

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className={`p-2 rounded-lg ${getMealTypeColor(meal.mealType)}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">{meal.title}</h3>
            <p className="text-xs text-muted-foreground capitalize">{meal.mealType.replace('_', ' ')}</p>
          </div>
          {meal.calories && (
            <div className="text-right">
              <div className="font-bold text-primary">{meal.calories}</div>
              <div className="text-xs text-muted-foreground">kcal</div>
            </div>
          )}
        </div>

        {meal.foods && (
          <p className="text-sm text-muted-foreground mb-3">{meal.foods}</p>
        )}

        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          <div className="p-2 rounded bg-muted/50">
            <div className="font-medium">{meal.protein || 0}g</div>
            <div className="text-muted-foreground">Protein</div>
          </div>
          <div className="p-2 rounded bg-muted/50">
            <div className="font-medium">{meal.carbs || 0}g</div>
            <div className="text-muted-foreground">Carbs</div>
          </div>
          <div className="p-2 rounded bg-muted/50">
            <div className="font-medium">{meal.fats || 0}g</div>
            <div className="text-muted-foreground">Fats</div>
          </div>
          <div className="p-2 rounded bg-muted/50">
            <div className="font-medium">{meal.hydrationMl || 0}</div>
            <div className="text-muted-foreground">ml H₂O</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Nutrition() {
  const { user } = useAuth();
  const { selectedChildId } = useParentChild();
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
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
  const { data: mealPlans } = trpc.nutrition.getPlayerMealPlans.useQuery(
    { playerId: parseInt(selectedPlayer), date: selectedDate },
    { enabled: !!selectedPlayer }
  );
  const { data: nutritionLogs } = trpc.nutrition.getPlayerLogs.useQuery(
    { playerId: parseInt(selectedPlayer), limit: 7 },
    { enabled: !!selectedPlayer }
  );

  // Calculate daily totals from meal plans
  const dailyTotals = mealPlans?.reduce((acc, meal) => ({
    calories: acc.calories + (meal.calories || 0),
    protein: acc.protein + (meal.protein || 0),
    carbs: acc.carbs + (meal.carbs || 0),
    fats: acc.fats + (meal.fats || 0),
    hydration: acc.hydration + (meal.hydrationMl || 0),
  }), { calories: 0, protein: 0, carbs: 0, fats: 0, hydration: 0 });

  // Target values (these could be personalized per player)
  const targets = {
    calories: 2500,
    protein: 150,
    carbs: 300,
    fats: 80,
    hydration: 3000,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Nutrition Planning</h1>
            <p className="text-muted-foreground">
              Personalized meal plans and dietary tracking
            </p>
          </div>
          <CreateMealPlanDialog />
        </div>

        {/* Player and Date Selection */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex items-center gap-2">
                <Label className="whitespace-nowrap">Player:</Label>
                <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select player" />
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
              <div className="flex items-center gap-2">
                <Label className="whitespace-nowrap">Date:</Label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-[180px]"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {selectedPlayer ? (
          <div className="space-y-6">
            {/* Daily Macros Overview */}
            <div className="grid gap-4 md:grid-cols-5">
              <MacroCard
                label="Calories"
                value={dailyTotals?.calories || 0}
                target={targets.calories}
                unit="kcal"
                icon={Flame}
                color="bg-destructive/20 text-destructive"
              />
              <MacroCard
                label="Protein"
                value={dailyTotals?.protein || 0}
                target={targets.protein}
                unit="g"
                icon={Beef}
                color="bg-primary/20 text-primary"
              />
              <MacroCard
                label="Carbohydrates"
                value={dailyTotals?.carbs || 0}
                target={targets.carbs}
                unit="g"
                icon={Wheat}
                color="bg-accent/20 text-accent"
              />
              <MacroCard
                label="Fats"
                value={dailyTotals?.fats || 0}
                target={targets.fats}
                unit="g"
                icon={Cookie}
                color="bg-chart-3/20 text-chart-3"
              />
              <MacroCard
                label="Hydration"
                value={dailyTotals?.hydration || 0}
                target={targets.hydration}
                unit="ml"
                icon={Droplets}
                color="bg-chart-4/20 text-chart-4"
              />
            </div>

            {/* Meal Plans */}
            <div>
              <h2 className="text-lg font-semibold mb-4">
                Meal Plan for {new Date(selectedDate).toLocaleDateString()}
              </h2>
              {mealPlans && mealPlans.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {mealPlans.map((meal) => (
                    <MealCard key={meal.id} meal={meal} />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Apple className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                    <h3 className="font-semibold mb-1">No meals planned</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Create a meal plan for this date
                    </p>
                    <CreateMealPlanDialog />
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Nutrition History */}
            {nutritionLogs && nutritionLogs.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Recent Nutrition Logs</CardTitle>
                  <CardDescription>Last 7 days of tracked nutrition</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {nutritionLogs.map((log: any, i: number) => (
                      <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                        <div className="text-sm font-medium min-w-[100px]">
                          {new Date(log.logDate).toLocaleDateString()}
                        </div>
                        <div className="flex-1 grid grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Cal:</span> {log.totalCalories || 0}
                          </div>
                          <div>
                            <span className="text-muted-foreground">P:</span> {log.totalProtein || 0}g
                          </div>
                          <div>
                            <span className="text-muted-foreground">C:</span> {log.totalCarbs || 0}g
                          </div>
                          <div>
                            <span className="text-muted-foreground">F:</span> {log.totalFats || 0}g
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Apple className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Select a Player</h3>
              <p className="text-muted-foreground">
                Choose a player to view and manage their nutrition plans
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
