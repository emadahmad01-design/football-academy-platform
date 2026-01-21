import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useState } from "react";
import { Users, Shield, Settings as SettingsIcon, Link2, UserPlus, Building2, UserCog, Video } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrator',
  coach: 'Coach',
  nutritionist: 'Nutritionist',
  mental_coach: 'Mental Coach',
  physical_trainer: 'Physical Trainer',
  parent: 'Parent',
  player: 'Player',
};

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-red-500/20 text-red-500',
  coach: 'bg-primary/20 text-primary',
  nutritionist: 'bg-chart-4/20 text-chart-4',
  mental_coach: 'bg-chart-3/20 text-chart-3',
  physical_trainer: 'bg-chart-2/20 text-chart-2',
  parent: 'bg-blue-500/20 text-blue-500',
  player: 'bg-muted text-muted-foreground',
};

function LinkParentDialog() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    parentUserId: '',
    playerId: '',
    relationship: 'guardian',
    isPrimary: true,
  });

  const { data: users } = trpc.users.getAll.useQuery();
  const { data: players } = trpc.players.getAll.useQuery();
  const utils = trpc.useUtils();

  const linkParent = trpc.parentRelations.link.useMutation({
    onSuccess: () => {
      toast.success('Parent linked to player successfully');
      setOpen(false);
      utils.parentRelations.getRelations.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to link parent');
    },
  });

  const parentUsers = users?.filter(u => u.role === 'parent') || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.parentUserId || !formData.playerId) {
      toast.error('Please select both parent and player');
      return;
    }
    linkParent.mutate({
      parentUserId: parseInt(formData.parentUserId),
      playerId: parseInt(formData.playerId),
      relationship: formData.relationship,
      isPrimary: formData.isPrimary,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Link2 className="h-4 w-4 mr-2" />
          Link Parent to Player
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Link Parent to Player</DialogTitle>
          <DialogDescription>
            Connect a parent account to their child's player profile.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Parent</Label>
              <Select
                value={formData.parentUserId}
                onValueChange={(value) => setFormData({ ...formData, parentUserId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select parent user" />
                </SelectTrigger>
                <SelectContent>
                  {parentUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.name || user.email || `User ${user.id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
                  {players?.map((player) => (
                    <SelectItem key={player.id} value={player.id.toString()}>
                      {player.firstName} {player.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Relationship</Label>
              <Select
                value={formData.relationship}
                onValueChange={(value) => setFormData({ ...formData, relationship: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="father">Father</SelectItem>
                  <SelectItem value="mother">Mother</SelectItem>
                  <SelectItem value="guardian">Guardian</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={linkParent.isPending}>
              {linkParent.isPending ? 'Linking...' : 'Link Parent'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function UserRoleManager({ user, onUpdate }: { user: any; onUpdate: () => void }) {
  const [selectedRole, setSelectedRole] = useState(user.role);
  
  const updateRole = trpc.users.updateRole.useMutation({
    onSuccess: () => {
      toast.success('User role updated');
      onUpdate();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update role');
    },
  });

  const handleRoleChange = (newRole: string) => {
    setSelectedRole(newRole);
    updateRole.mutate({ userId: user.id, role: newRole as any });
  };

  return (
    <Select value={selectedRole} onValueChange={handleRoleChange}>
      <SelectTrigger className="w-40">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="admin">Administrator</SelectItem>
        <SelectItem value="coach">Coach</SelectItem>
        <SelectItem value="nutritionist">Nutritionist</SelectItem>
        <SelectItem value="mental_coach">Mental Coach</SelectItem>
        <SelectItem value="physical_trainer">Physical Trainer</SelectItem>
        <SelectItem value="parent">Parent</SelectItem>
        <SelectItem value="player">Player</SelectItem>
      </SelectContent>
    </Select>
  );
}

export default function Settings() {
  const { user } = useAuth();
  const { data: users, refetch: refetchUsers } = trpc.users.getAll.useQuery();
  const { data: teams } = trpc.teams.getAll.useQuery();

  const isAdmin = user?.role === 'admin';

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Card className="max-w-md">
            <CardContent className="p-8 text-center">
              <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Access Restricted</h2>
              <p className="text-muted-foreground">
                Only administrators can access the settings page.
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const usersByRole = users?.reduce((acc: Record<string, number>, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {}) || {};

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage users, roles, and academy configuration
          </p>
        </div>

        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users">
              <Users className="h-4 w-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="roles">
              <Shield className="h-4 w-4 mr-2" />
              Roles
            </TabsTrigger>
            <TabsTrigger value="academy">
              <Building2 className="h-4 w-4 mr-2" />
              Academy
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold">User Management</h2>
                <p className="text-sm text-muted-foreground">
                  {users?.length || 0} registered users
                </p>
              </div>
              <div className="flex gap-2">
                <Link href="/user-management">
                  <Button variant="outline">
                    <UserCog className="w-4 h-4 mr-2" />
                    Manage Registrations
                  </Button>
                </Link>
                <Link href="/video-management">
                  <Button variant="outline">
                    <Video className="w-4 h-4 mr-2" />
                    Manage Videos
                  </Button>
                </Link>
                <LinkParentDialog />
              </div>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Last Active</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users?.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                              {(u.name?.[0] || u.email?.[0] || 'U').toUpperCase()}
                            </div>
                            <span className="font-medium">{u.name || 'Unnamed User'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {u.email || '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={ROLE_COLORS[u.role]}>
                            {ROLE_LABELS[u.role]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {u.lastSignedIn ? new Date(u.lastSignedIn).toLocaleDateString() : '-'}
                        </TableCell>
                        <TableCell>
                          <UserRoleManager user={u} onUpdate={() => refetchUsers()} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="roles" className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Role Distribution</h2>
              <p className="text-sm text-muted-foreground">
                Overview of user roles in the academy
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {Object.entries(ROLE_LABELS).map(([role, label]) => (
                <Card key={role}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{label}</p>
                        <p className="text-2xl font-bold">{usersByRole[role] || 0}</p>
                      </div>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${ROLE_COLORS[role]}`}>
                        <Users className="h-5 w-5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Role Permissions</CardTitle>
                <CardDescription>Access levels for each role in the system</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-6 gap-2 text-sm font-medium text-muted-foreground border-b pb-2">
                    <div>Role</div>
                    <div>Players</div>
                    <div>Performance</div>
                    <div>Training</div>
                    <div>Nutrition</div>
                    <div>Admin</div>
                  </div>
                  {[
                    { role: 'admin', players: '✓', performance: '✓', training: '✓', nutrition: '✓', admin: '✓' },
                    { role: 'coach', players: '✓', performance: '✓', training: '✓', nutrition: 'View', admin: '✗' },
                    { role: 'nutritionist', players: 'View', performance: 'View', training: 'View', nutrition: '✓', admin: '✗' },
                    { role: 'mental_coach', players: 'View', performance: '✓', training: 'View', nutrition: 'View', admin: '✗' },
                    { role: 'physical_trainer', players: 'View', performance: '✓', training: '✓', nutrition: 'View', admin: '✗' },
                    { role: 'parent', players: 'Own', performance: 'Own', training: 'View', nutrition: 'Own', admin: '✗' },
                    { role: 'player', players: 'Own', performance: 'Own', training: 'View', nutrition: 'Own', admin: '✗' },
                  ].map((row) => (
                    <div key={row.role} className="grid grid-cols-6 gap-2 text-sm py-2 border-b border-border/50">
                      <div className="font-medium">{ROLE_LABELS[row.role]}</div>
                      <div className={row.players === '✓' ? 'text-green-500' : row.players === '✗' ? 'text-red-500' : 'text-muted-foreground'}>{row.players}</div>
                      <div className={row.performance === '✓' ? 'text-green-500' : row.performance === '✗' ? 'text-red-500' : 'text-muted-foreground'}>{row.performance}</div>
                      <div className={row.training === '✓' ? 'text-green-500' : row.training === '✗' ? 'text-red-500' : 'text-muted-foreground'}>{row.training}</div>
                      <div className={row.nutrition === '✓' ? 'text-green-500' : row.nutrition === '✗' ? 'text-red-500' : 'text-muted-foreground'}>{row.nutrition}</div>
                      <div className={row.admin === '✓' ? 'text-green-500' : 'text-red-500'}>{row.admin}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="academy" className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Academy Settings</h2>
              <p className="text-sm text-muted-foreground">
                Configure academy-wide settings and preferences
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Academy Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <img src="/logo.png" alt="Future Stars FC" className="w-16 h-16 object-contain" />
                    <div>
                      <h3 className="font-semibold">Future Stars FC</h3>
                      <p className="text-sm text-muted-foreground">Technology-Driven Football Academy</p>
                    </div>
                  </div>
                  <div className="grid gap-3">
                    <div>
                      <Label className="text-muted-foreground">Total Teams</Label>
                      <p className="font-medium">{teams?.length || 0}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Age Groups</Label>
                      <p className="font-medium">U10, U12, U14, U16, U18</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Development Framework</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <span className="text-sm">Technical Development</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-chart-2/10">
                      <div className="w-2 h-2 rounded-full bg-chart-2" />
                      <span className="text-sm">Physical Conditioning</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-chart-3/10">
                      <div className="w-2 h-2 rounded-full bg-chart-3" />
                      <span className="text-sm">Mental Coaching</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-chart-4/10">
                      <div className="w-2 h-2 rounded-full bg-chart-4" />
                      <span className="text-sm">Nutrition Planning</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
