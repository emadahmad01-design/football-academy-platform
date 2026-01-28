import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { DashboardLayoutSkeleton } from "@/components/DashboardLayoutSkeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useState } from "react";
import { 
  Plus, 
  Calendar, 
  MapPin, 
  Trophy, 
  Users,
  Target,
  Clock,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { toast } from "sonner";

export default function Matches() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { data: matches, isLoading, refetch } = trpc.matches.getAll.useQuery();
  const { data: teams } = trpc.teams.getAll.useQuery();

  const createMatch = trpc.matches.create.useMutation({
    onSuccess: () => {
      toast.success("Match created successfully!");
      setIsCreateOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const [formData, setFormData] = useState({
    teamId: "",
    matchDate: new Date().toISOString().split('T')[0],
    matchType: "training_match" as const,
    opponent: "",
    venue: "",
    isHome: true,
    teamScore: 0,
    opponentScore: 0,
    notes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMatch.mutate({
      ...formData,
      teamId: formData.teamId ? parseInt(formData.teamId) : undefined,
      matchDate: formData.matchDate,
    });
  };

  if (authLoading) return <DashboardLayoutSkeleton />;
  if (!user) {
    setLocation("/");
    return null;
  }

  const getResultBadge = (result?: string | null) => {
    switch (result) {
      case 'win':
        return <Badge className="bg-green-500">Win</Badge>;
      case 'draw':
        return <Badge className="bg-yellow-500">Draw</Badge>;
      case 'loss':
        return <Badge className="bg-red-500">Loss</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const getMatchTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      friendly: "bg-blue-500",
      league: "bg-purple-500",
      cup: "bg-amber-500",
      tournament: "bg-emerald-500",
      training_match: "bg-gray-500",
    };
    return <Badge className={colors[type] || "bg-gray-500"}>{type.replace('_', ' ')}</Badge>;
  };

  // Stats summary
  const stats = matches?.reduce(
    (acc, match) => ({
      total: acc.total + 1,
      wins: acc.wins + (match.result === 'win' ? 1 : 0),
      draws: acc.draws + (match.result === 'draw' ? 1 : 0),
      losses: acc.losses + (match.result === 'loss' ? 1 : 0),
      goalsFor: acc.goalsFor + (match.teamScore || 0),
      goalsAgainst: acc.goalsAgainst + (match.opponentScore || 0),
    }),
    { total: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0 }
  ) || { total: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0 };

  // Pagination logic
  const totalMatches = matches?.length || 0;
  const totalPages = Math.ceil(totalMatches / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedMatches = matches?.slice(startIndex, endIndex) || [];

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Match Records</h1>
            <p className="text-muted-foreground">Track training matches and competitive games</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Match
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Match</DialogTitle>
                <DialogDescription>Record a new training match or competitive game</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Match Date</Label>
                    <Input
                      type="date"
                      value={formData.matchDate}
                      onChange={(e) => setFormData({ ...formData, matchDate: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Match Type</Label>
                    <Select
                      value={formData.matchType}
                      onValueChange={(value: any) => setFormData({ ...formData, matchType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="z-[10001]">
                        <SelectItem value="training_match">Training Match</SelectItem>
                        <SelectItem value="friendly">Friendly</SelectItem>
                        <SelectItem value="league">League</SelectItem>
                        <SelectItem value="cup">Cup</SelectItem>
                        <SelectItem value="tournament">Tournament</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Team</Label>
                    <Select
                      value={formData.teamId}
                      onValueChange={(value) => setFormData({ ...formData, teamId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select team" />
                      </SelectTrigger>
                      <SelectContent className="z-[10001]">
                        {teams?.map((team) => (
                          <SelectItem key={team.id} value={team.id.toString()}>
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Opponent</Label>
                    <Input
                      value={formData.opponent}
                      onChange={(e) => setFormData({ ...formData, opponent: e.target.value })}
                      placeholder="Opponent team name"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Venue</Label>
                    <Input
                      value={formData.venue}
                      onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                      placeholder="Match venue"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Home/Away</Label>
                    <Select
                      value={formData.isHome ? "home" : "away"}
                      onValueChange={(value) => setFormData({ ...formData, isHome: value === "home" })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="z-[10001]">
                        <SelectItem value="home">Home</SelectItem>
                        <SelectItem value="away">Away</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Our Score</Label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.teamScore}
                      onChange={(e) => setFormData({ ...formData, teamScore: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Opponent Score</Label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.opponentScore}
                      onChange={(e) => setFormData({ ...formData, opponentScore: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Match notes, observations..."
                  />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMatch.isPending}>
                    {createMatch.isPending ? "Creating..." : "Create Match"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total Matches</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-500">{stats.wins}</div>
              <div className="text-sm text-muted-foreground">Wins</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-500">{stats.draws}</div>
              <div className="text-sm text-muted-foreground">Draws</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-500">{stats.losses}</div>
              <div className="text-sm text-muted-foreground">Losses</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{stats.goalsFor}</div>
              <div className="text-sm text-muted-foreground">Goals For</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{stats.goalsAgainst}</div>
              <div className="text-sm text-muted-foreground">Goals Against</div>
            </CardContent>
          </Card>
        </div>

        {/* Matches Table */}
        <Card>
          <CardHeader>
            <CardTitle>Match History</CardTitle>
            <CardDescription>All recorded matches and results</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : matches && matches.length > 0 ? (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Opponent</TableHead>
                      <TableHead>Venue</TableHead>
                      <TableHead className="text-center">Score</TableHead>
                      <TableHead>Result</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedMatches.map((match) => (
                      <TableRow key={match.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {new Date(match.matchDate).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>{getMatchTypeBadge(match.matchType)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            {match.opponent || "TBD"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            {match.venue || "-"}
                            {match.isHome && <Badge variant="outline" className="ml-1">H</Badge>}
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-bold">
                          {match.teamScore ?? "-"} - {match.opponentScore ?? "-"}
                        </TableCell>
                        <TableCell>{getResultBadge(match.result)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      Showing {startIndex + 1} to {Math.min(endIndex, totalMatches)} of {totalMatches} matches
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                          .filter(page => {
                            if (totalPages <= 7) return true;
                            if (page === 1 || page === totalPages) return true;
                            if (Math.abs(page - currentPage) <= 1) return true;
                            return false;
                          })
                          .map((page, index, array) => {
                            const showEllipsis = index > 0 && array[index - 1] !== page - 1;
                            return (
                              <span key={`page-${page}`} className="flex items-center gap-1">
                                {showEllipsis && (
                                  <span className="px-2 text-muted-foreground">...</span>
                                )}
                                <Button
                                  variant={currentPage === page ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => goToPage(page)}
                                  className="w-8 h-8 p-0"
                                >
                                  {page}
                                </Button>
                              </span>
                            );
                          })}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Matches Recorded</h3>
                <p className="text-muted-foreground mb-4">Start tracking your team's matches</p>
                <Button onClick={() => setIsCreateOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Match
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
