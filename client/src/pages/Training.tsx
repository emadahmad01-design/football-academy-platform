import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Plus, Calendar, Clock, MapPin, Users, CheckCircle, XCircle, PlayCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

function CreateSessionDialog({ defaultTeamId, onSuccess }: { defaultTeamId?: string; onSuccess?: () => void }) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    teamId: defaultTeamId || '',
    title: '',
    description: '',
    sessionDate: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '11:00',
    location: '',
    sessionType: 'mixed' as const,
    objectives: '',
    drills: '',
  });

  const { data: teams } = trpc.teams.getAll.useQuery();
  const utils = trpc.useUtils();
  
  const createSession = trpc.training.create.useMutation({
    onSuccess: () => {
      toast.success('Training session created');
      setOpen(false);
      // Reset form
      setFormData({
        teamId: defaultTeamId || '',
        title: '',
        description: '',
        sessionDate: new Date().toISOString().split('T')[0],
        startTime: '09:00',
        endTime: '11:00',
        location: '',
        sessionType: 'mixed' as const,
        objectives: '',
        drills: '',
      });
      // Invalidate and refetch
      utils.training.getUpcoming.invalidate();
      utils.training.invalidate();
      // Call parent callback to force refetch
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create session');
    },
  });

  // Update formData.teamId when defaultTeamId changes and dialog opens
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && defaultTeamId && defaultTeamId !== 'all') {
      setFormData(prev => ({ ...prev, teamId: defaultTeamId }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[CreateSession] Submitting:', {
      ...formData,
      teamId: formData.teamId ? parseInt(formData.teamId) : undefined,
    });
    createSession.mutate({
      ...formData,
      teamId: formData.teamId ? parseInt(formData.teamId) : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="gradient-primary text-primary-foreground">
          <Plus className="h-4 w-4 mr-2" />
          Schedule Session
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Schedule Training Session</DialogTitle>
          <DialogDescription>
            Create a new training session for a team.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Technical Training"
                  required
                />
              </div>
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
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={formData.sessionDate}
                  onChange={(e) => setFormData({ ...formData, sessionDate: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
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
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="tactical">Tactical</SelectItem>
                    <SelectItem value="physical">Physical</SelectItem>
                    <SelectItem value="match">Match</SelectItem>
                    <SelectItem value="recovery">Recovery</SelectItem>
                    <SelectItem value="mixed">Mixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g., Main Pitch"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Session overview..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Objectives</Label>
              <Textarea
                value={formData.objectives}
                onChange={(e) => setFormData({ ...formData, objectives: e.target.value })}
                placeholder="What players should achieve..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Drills</Label>
              <Textarea
                value={formData.drills}
                onChange={(e) => setFormData({ ...formData, drills: e.target.value })}
                placeholder="List of drills and exercises..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createSession.isPending}>
              {createSession.isPending ? 'Creating...' : 'Create Session'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SessionCard({ session }: { session: any }) {
  const utils = trpc.useUtils();
  
  const updateSession = trpc.training.update.useMutation({
    onSuccess: () => {
      toast.success('Session updated');
      utils.training.getUpcoming.invalidate();
    },
  });

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      technical: 'bg-primary/20 text-primary',
      tactical: 'bg-chart-2/20 text-chart-2',
      physical: 'bg-chart-3/20 text-chart-3',
      match: 'bg-destructive/20 text-destructive',
      recovery: 'bg-chart-4/20 text-chart-4',
      mixed: 'bg-accent/20 text-accent',
    };
    return colors[type] || 'bg-muted text-muted-foreground';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-primary" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'in_progress':
        return <PlayCircle className="h-4 w-4 text-accent" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const sessionDate = new Date(session.sessionDate);
  const isToday = sessionDate.toDateString() === new Date().toDateString();
  const isPast = sessionDate < new Date() && !isToday;

  return (
    <Card className={`${isToday ? 'border-primary/50 bg-primary/5' : ''} ${isPast ? 'opacity-60' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {getStatusIcon(session.status)}
              <h3 className="font-semibold">{session.title}</h3>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className={getTypeColor(session.sessionType)}>
                {session.sessionType}
              </Badge>
              {isToday && (
                <Badge variant="default" className="bg-primary">Today</Badge>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {session.status === 'scheduled' && !isPast && (
              <>
                <Button
                  size="sm"
                  variant="default"
                  className="bg-primary"
                  onClick={() => updateSession.mutate({ id: session.id, status: 'in_progress' })}
                  disabled={updateSession.isPending}
                >
                  <PlayCircle className="h-3 w-3 mr-1" />
                  Start
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => updateSession.mutate({ id: session.id, status: 'cancelled' })}
                  disabled={updateSession.isPending}
                >
                  <XCircle className="h-3 w-3 mr-1" />
                  Cancel
                </Button>
              </>
            )}
            {session.status === 'in_progress' && (
              <>
                <Button
                  size="sm"
                  variant="default"
                  className="bg-primary"
                  onClick={() => updateSession.mutate({ id: session.id, status: 'completed' })}
                  disabled={updateSession.isPending}
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Finish
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => updateSession.mutate({ id: session.id, status: 'cancelled' })}
                  disabled={updateSession.isPending}
                >
                  <XCircle className="h-3 w-3 mr-1" />
                  Stop
                </Button>
              </>
            )}
          </div>
        </div>

        {session.description && (
          <p className="text-sm text-muted-foreground mb-3">{session.description}</p>
        )}

        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{sessionDate.toLocaleDateString()}</span>
          </div>
          {session.startTime && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{session.startTime} - {session.endTime || 'TBD'}</span>
            </div>
          )}
          {session.location && (
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span>{session.location}</span>
            </div>
          )}
          {session.attendanceCount !== null && (
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span>{session.attendanceCount} attended</span>
            </div>
          )}
        </div>

        {session.objectives && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-xs text-muted-foreground">
              <strong>Objectives:</strong> {session.objectives}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Training() {
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(6);
  
  const { data: teams } = trpc.teams.getAll.useQuery();
  const { data: upcomingSessions, refetch } = trpc.training.getUpcoming.useQuery({
    teamId: selectedTeam && selectedTeam !== 'all' ? parseInt(selectedTeam) : undefined,
  });

  console.log('[Training] Selected team:', selectedTeam);
  console.log('[Training] Upcoming sessions:', upcomingSessions);

  // Flatten sessions array for pagination
  const allSessions = upcomingSessions || [];
  
  // Calculate pagination
  const totalPages = Math.ceil(allSessions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedSessions = allSessions.slice(startIndex, endIndex);

  // Group paginated sessions by date
  const groupedSessions = paginatedSessions.reduce((acc: Record<string, any[]>, session) => {
    const date = new Date(session.sessionDate).toLocaleDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(session);
    return acc;
  }, {});

  // Reset to page 1 when team filter changes
  const handleTeamChange = (value: string) => {
    setSelectedTeam(value);
    setCurrentPage(1);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Training Sessions</h1>
            <p className="text-muted-foreground">
              Schedule and manage team training sessions
            </p>
          </div>
          <CreateSessionDialog defaultTeamId={selectedTeam} onSuccess={() => refetch()} />
        </div>

        {/* Team Filter */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Label className="whitespace-nowrap">Filter by Team:</Label>
              <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                <SelectTrigger className="max-w-xs">
                  <SelectValue placeholder="All teams" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Teams</SelectItem>
                  {teams?.map((team) => (
                    <SelectItem key={team.id} value={team.id.toString()}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Sessions List */}
        {allSessions.length > 0 ? (
          <>
            <div className="space-y-6">
              {Object.entries(groupedSessions).map(([date, sessions]) => (
                <div key={date}>
                  <h2 className="text-sm font-medium text-muted-foreground mb-3">{date}</h2>
                  <div className="grid gap-4 md:grid-cols-2">
                    {sessions.map((session: any) => (
                      <SessionCard key={session.id} session={session} />
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm text-muted-foreground">
                        Showing {startIndex + 1}-{Math.min(endIndex, allSessions.length)} of {allSessions.length} sessions
                      </Label>
                      <Select 
                        value={itemsPerPage.toString()} 
                        onValueChange={(value) => {
                          setItemsPerPage(parseInt(value));
                          setCurrentPage(1);
                        }}
                      >
                        <SelectTrigger className="w-20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="6">6</SelectItem>
                          <SelectItem value="12">12</SelectItem>
                          <SelectItem value="24">24</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                        </SelectContent>
                      </Select>
                      <span className="text-sm text-muted-foreground">per page</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Previous
                      </Button>
                      
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className="w-10"
                          >
                            {page}
                          </Button>
                        ))}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Next
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No upcoming sessions</h3>
              <p className="text-muted-foreground mb-4">
                Schedule your first training session
              </p>
              <CreateSessionDialog defaultTeamId={selectedTeam} onSuccess={() => refetch()} />
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
