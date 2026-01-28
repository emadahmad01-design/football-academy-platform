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
import { Plus, Calendar, Clock, MapPin, Users, CheckCircle, XCircle, PlayCircle } from "lucide-react";
import { toast } from "sonner";

function CreateSessionDialog() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    teamId: '',
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
      utils.training.getUpcoming.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create session');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createSession.mutate({
      ...formData,
      teamId: formData.teamId ? parseInt(formData.teamId) : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
          {session.status === 'scheduled' && !isPast && (
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => updateSession.mutate({ id: session.id, status: 'in_progress' })}
              >
                Start
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => updateSession.mutate({ id: session.id, status: 'completed' })}
              >
                Complete
              </Button>
            </div>
          )}
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
  const { data: teams } = trpc.teams.getAll.useQuery();
  const { data: upcomingSessions } = trpc.training.getUpcoming.useQuery({
    teamId: selectedTeam ? parseInt(selectedTeam) : undefined,
  });

  // Group sessions by date
  const groupedSessions = upcomingSessions?.reduce((acc: Record<string, any[]>, session) => {
    const date = new Date(session.sessionDate).toLocaleDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(session);
    return acc;
  }, {});

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
          <CreateSessionDialog />
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
        {groupedSessions && Object.keys(groupedSessions).length > 0 ? (
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
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No upcoming sessions</h3>
              <p className="text-muted-foreground mb-4">
                Schedule your first training session
              </p>
              <CreateSessionDialog />
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
