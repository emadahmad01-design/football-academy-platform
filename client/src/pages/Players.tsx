import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Search, Plus, Filter, User, Activity, Brain, Dumbbell, Apple } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useLocation, useSearch } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";

function PlayerCard({ player }: { player: any }) {
  const [, setLocation] = useLocation();
  
  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      active: 'badge-active',
      injured: 'badge-injured',
      trial: 'badge-trial',
      inactive: 'badge-inactive',
    };
    return badges[status] || badges.inactive;
  };

  const getPositionColor = (position: string) => {
    const colors: Record<string, string> = {
      goalkeeper: 'bg-chart-3/20 text-chart-3',
      defender: 'bg-chart-4/20 text-chart-4',
      midfielder: 'bg-primary/20 text-primary',
      forward: 'bg-destructive/20 text-destructive',
    };
    return colors[position] || 'bg-muted text-muted-foreground';
  };

  return (
    <Card className="card-hover cursor-pointer" onClick={() => setLocation(`/players/${player.id}/scorecard`)}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="player-avatar bg-primary/20 text-primary">
            {player.firstName?.charAt(0)}{player.lastName?.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold truncate">{player.firstName} {player.lastName}</h3>
              {player.jerseyNumber && (
                <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">#{player.jerseyNumber}</span>
              )}
            </div>
            <div className="flex flex-wrap gap-2 mb-2">
              <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${getPositionColor(player.position)}`}>
                {player.position}
              </span>
              <span className={getStatusBadge(player.status)}>
                {player.status}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {player.ageGroup && <span>{player.ageGroup}</span>}
              {player.preferredFoot && <span>{player.preferredFoot} foot</span>}
            </div>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-border">
          <div className="text-center">
            <Activity className="h-4 w-4 mx-auto text-primary mb-1" />
            <div className="text-xs text-muted-foreground">Technical</div>
          </div>
          <div className="text-center">
            <Dumbbell className="h-4 w-4 mx-auto text-chart-2 mb-1" />
            <div className="text-xs text-muted-foreground">Physical</div>
          </div>
          <div className="text-center">
            <Brain className="h-4 w-4 mx-auto text-chart-3 mb-1" />
            <div className="text-xs text-muted-foreground">Mental</div>
          </div>
          <div className="text-center">
            <Apple className="h-4 w-4 mx-auto text-chart-4 mb-1" />
            <div className="text-xs text-muted-foreground">Nutrition</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AddPlayerDialog() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    position: 'midfielder' as const,
    preferredFoot: 'right' as const,
    ageGroup: '',
    jerseyNumber: '',
  });

  const utils = trpc.useUtils();
  const createPlayer = trpc.players.create.useMutation({
    onSuccess: () => {
      toast.success('Player added successfully');
      utils.players.getAll.invalidate();
      setOpen(false);
      setFormData({
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        position: 'midfielder',
        preferredFoot: 'right',
        ageGroup: '',
        jerseyNumber: '',
      });
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to add player');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createPlayer.mutate({
      ...formData,
      jerseyNumber: formData.jerseyNumber ? parseInt(formData.jerseyNumber) : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gradient-primary text-primary-foreground">
          <Plus className="h-4 w-4 mr-2" />
          Add Player
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Player</DialogTitle>
          <DialogDescription>
            Enter the player's information to add them to the academy.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="jerseyNumber">Jersey Number</Label>
                <Input
                  id="jerseyNumber"
                  type="number"
                  value={formData.jerseyNumber}
                  onChange={(e) => setFormData({ ...formData, jerseyNumber: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="position">Position</Label>
                <Select
                  value={formData.position}
                  onValueChange={(value: any) => setFormData({ ...formData, position: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="goalkeeper">Goalkeeper</SelectItem>
                    <SelectItem value="defender">Defender</SelectItem>
                    <SelectItem value="midfielder">Midfielder</SelectItem>
                    <SelectItem value="forward">Forward</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="preferredFoot">Preferred Foot</Label>
                <Select
                  value={formData.preferredFoot}
                  onValueChange={(value: any) => setFormData({ ...formData, preferredFoot: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Left</SelectItem>
                    <SelectItem value="right">Right</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ageGroup">Age Group</Label>
              <Select
                value={formData.ageGroup}
                onValueChange={(value) => setFormData({ ...formData, ageGroup: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select age group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="U8">U8</SelectItem>
                  <SelectItem value="U10">U10</SelectItem>
                  <SelectItem value="U12">U12</SelectItem>
                  <SelectItem value="U14">U14</SelectItem>
                  <SelectItem value="U16">U16</SelectItem>
                  <SelectItem value="U18">U18</SelectItem>
                  <SelectItem value="U21">U21</SelectItem>
                  <SelectItem value="Senior">Senior</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createPlayer.isPending}>
              {createPlayer.isPending ? 'Adding...' : 'Add Player'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Players() {
  const [searchQuery, setSearchQuery] = useState('');
  const [positionFilter, setPositionFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const { language } = useLanguage();
  
  // Get team type from URL query parameter
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const teamType = params.get('team') as 'main' | 'academy' | null;

  // Fetch players based on team type filter
  const { data: allPlayers, isLoading: allLoading } = trpc.players.getAll.useQuery(
    undefined,
    { enabled: !teamType }
  );
  const { data: teamPlayers, isLoading: teamLoading } = trpc.players.getByTeamType.useQuery(
    { teamType: teamType! },
    { enabled: !!teamType }
  );
  
  const players = teamType ? teamPlayers : allPlayers;
  const isLoading = teamType ? teamLoading : allLoading;
  
  const pageTitle = teamType === 'main' 
    ? (language === 'ar' ? 'لاعبي الفريق الأول' : 'Main Team Players')
    : teamType === 'academy'
    ? (language === 'ar' ? 'لاعبي الأكاديمية' : 'Academy Team Players')
    : (language === 'ar' ? 'جميع اللاعبين' : 'All Players');

  const filteredPlayers = players?.filter((player) => {
    const matchesSearch = 
      player.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      player.lastName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPosition = positionFilter === 'all' || player.position === positionFilter;
    const matchesStatus = statusFilter === 'all' || player.status === statusFilter;
    return matchesSearch && matchesPosition && matchesStatus;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{pageTitle}</h1>
            <p className="text-muted-foreground">
              {teamType 
                ? (language === 'ar' ? `إدارة وتتبع لاعبي ${teamType === 'main' ? 'الفريق الأول' : 'الأكاديمية'}` : `Manage and track ${teamType === 'main' ? 'main team' : 'academy'} players`)
                : (language === 'ar' ? 'إدارة وتتبع جميع لاعبي الأكاديمية' : 'Manage and track all academy players')}
            </p>
          </div>
          <AddPlayerDialog />
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search players..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={positionFilter} onValueChange={setPositionFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Position" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Positions</SelectItem>
                  <SelectItem value="goalkeeper">Goalkeeper</SelectItem>
                  <SelectItem value="defender">Defender</SelectItem>
                  <SelectItem value="midfielder">Midfielder</SelectItem>
                  <SelectItem value="forward">Forward</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="injured">Injured</SelectItem>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Players Grid */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredPlayers && filteredPlayers.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredPlayers.map((player) => (
              <PlayerCard key={player.id} player={player} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No players found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || positionFilter !== 'all' || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Add your first player to get started'}
              </p>
              {!searchQuery && positionFilter === 'all' && statusFilter === 'all' && (
                <AddPlayerDialog />
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
