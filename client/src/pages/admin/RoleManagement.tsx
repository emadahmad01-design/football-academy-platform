import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Shield, Plus, Edit, Trash2, Users, Key, Layout } from "lucide-react";
import { toast } from "sonner";

export function RoleManagement() {
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Queries
  const { data: roles, refetch: refetchRoles } = trpc.permissions.getAllRoles.useQuery();
  const { data: selectedRole } = trpc.permissions.getRoleById.useQuery(
    { roleId: selectedRoleId! },
    { enabled: !!selectedRoleId }
  );
  const { data: allPermissions } = trpc.permissions.getPermissionsByCategory.useQuery();
  const { data: allTabs } = trpc.permissions.getAllTabs.useQuery();

  // Mutations
  const createRoleMutation = trpc.permissions.createRole.useMutation({
    onSuccess: () => {
      toast.success("Role created successfully");
      refetchRoles();
      setIsCreateDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Error creating role: ${error.message}`);
    },
  });

  const updateRoleMutation = trpc.permissions.updateRole.useMutation({
    onSuccess: () => {
      toast.success("Role updated successfully");
      refetchRoles();
      setIsEditDialogOpen(false);
    },
  });

  const deleteRoleMutation = trpc.permissions.deleteRole.useMutation({
    onSuccess: () => {
      toast.success("Role deleted successfully");
      refetchRoles();
      setSelectedRoleId(null);
    },
  });

  const assignPermissionsMutation = trpc.permissions.assignPermissionsToRole.useMutation({
    onSuccess: () => {
      toast.success("Permissions updated successfully");
      refetchRoles();
    },
  });

  const assignTabsMutation = trpc.permissions.assignTabsToRole.useMutation({
    onSuccess: () => {
      toast.success("Tabs updated successfully");
      refetchRoles();
    },
  });

  const handleCreateRole = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createRoleMutation.mutate({
      name: formData.get("name") as string,
      displayName: formData.get("displayName") as string,
      description: formData.get("description") as string,
      color: formData.get("color") as string,
      priority: parseInt(formData.get("priority") as string) || 0,
    });
  };

  const handleUpdateRole = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedRoleId) return;
    const formData = new FormData(e.currentTarget);
    updateRoleMutation.mutate({
      roleId: selectedRoleId,
      displayName: formData.get("displayName") as string,
      description: formData.get("description") as string,
      color: formData.get("color") as string,
      priority: parseInt(formData.get("priority") as string) || 0,
    });
  };

  const handleDeleteRole = (roleId: number) => {
    if (confirm("Are you sure you want to delete this role?")) {
      deleteRoleMutation.mutate({ roleId });
    }
  };

  const handlePermissionToggle = (permissionId: number, checked: boolean) => {
    if (!selectedRoleId || !selectedRole) return;
    
    const currentPermissionIds = selectedRole.permissions.map(p => p.id);
    const newPermissionIds = checked
      ? [...currentPermissionIds, permissionId]
      : currentPermissionIds.filter(id => id !== permissionId);
    
    assignPermissionsMutation.mutate({
      roleId: selectedRoleId,
      permissionIds: newPermissionIds,
    });
  };

  const handleTabToggle = (tabId: number, checked: boolean) => {
    if (!selectedRoleId || !selectedRole) return;
    
    const currentTabIds = selectedRole.tabs.map(t => t.id);
    const newTabIds = checked
      ? [...currentTabIds, tabId]
      : currentTabIds.filter(id => id !== tabId);
    
    assignTabsMutation.mutate({
      roleId: selectedRoleId,
      tabIds: newTabIds,
    });
  };

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Role & Permission Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage custom roles, assign permissions, and control tab visibility
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Role
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Role</DialogTitle>
              <DialogDescription>
                Create a custom role with specific permissions and tab access
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateRole} className="space-y-4">
              <div>
                <Label htmlFor="name">Role Name (Code)</Label>
                <Input id="name" name="name" placeholder="marketing_manager" required />
              </div>
              <div>
                <Label htmlFor="displayName">Display Name</Label>
                <Input id="displayName" name="displayName" placeholder="Marketing Manager" required />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" placeholder="Manages marketing campaigns and leads" />
              </div>
              <div>
                <Label htmlFor="color">Color (Hex)</Label>
                <Input id="color" name="color" type="color" defaultValue="#3b82f6" />
              </div>
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Input id="priority" name="priority" type="number" defaultValue="50" />
              </div>
              <Button type="submit" className="w-full">Create Role</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Roles List */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Roles</CardTitle>
            <CardDescription>Select a role to manage</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {roles?.map((role) => (
              <div
                key={role.id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedRoleId === role.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
                onClick={() => setSelectedRoleId(role.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: role.color || "#3b82f6" }}
                    />
                    <span className="font-medium">{role.displayName}</span>
                  </div>
                  {role.isSystemRole && (
                    <Badge variant="secondary" className="text-xs">System</Badge>
                  )}
                </div>
                {role.description && (
                  <p className="text-xs text-muted-foreground mt-1">{role.description}</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Role Details */}
        <Card className="md:col-span-2">
          {selectedRole ? (
            <>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: selectedRole.color || "#3b82f6" }}
                      />
                      {selectedRole.displayName}
                    </CardTitle>
                    <CardDescription>{selectedRole.description}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    {!selectedRole.isSystemRole && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsEditDialogOpen(true)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteRole(selectedRole.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="permissions">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="permissions">
                      <Key className="h-4 w-4 mr-2" />
                      Permissions
                    </TabsTrigger>
                    <TabsTrigger value="tabs">
                      <Layout className="h-4 w-4 mr-2" />
                      Tabs
                    </TabsTrigger>
                    <TabsTrigger value="users">
                      <Users className="h-4 w-4 mr-2" />
                      Users
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="permissions" className="space-y-4">
                    {allPermissions && Object.entries(allPermissions).map(([category, perms]) => (
                      <div key={category} className="space-y-2">
                        <h3 className="font-semibold text-sm text-muted-foreground">{category}</h3>
                        <div className="space-y-2">
                          {perms.map((perm) => {
                            const isChecked = selectedRole.permissions.some(p => p.id === perm.id);
                            return (
                              <div key={perm.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`perm-${perm.id}`}
                                  checked={isChecked}
                                  onCheckedChange={(checked) => 
                                    handlePermissionToggle(perm.id, checked as boolean)
                                  }
                                />
                                <label
                                  htmlFor={`perm-${perm.id}`}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                >
                                  {perm.name}
                                  {perm.description && (
                                    <span className="text-xs text-muted-foreground block">
                                      {perm.description}
                                    </span>
                                  )}
                                </label>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </TabsContent>

                  <TabsContent value="tabs" className="space-y-2">
                    {allTabs?.map((tab) => {
                      const isChecked = selectedRole.tabs.some(t => t.id === tab.id);
                      return (
                        <div key={tab.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`tab-${tab.id}`}
                            checked={isChecked}
                            onCheckedChange={(checked) => 
                              handleTabToggle(tab.id, checked as boolean)
                            }
                          />
                          <label
                            htmlFor={`tab-${tab.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {tab.name}
                            {tab.description && (
                              <span className="text-xs text-muted-foreground block">
                                {tab.description}
                              </span>
                            )}
                          </label>
                        </div>
                      );
                    })}
                  </TabsContent>

                  <TabsContent value="users">
                    <p className="text-sm text-muted-foreground">
                      User assignment feature coming soon. Use the User Management page to assign roles to users.
                    </p>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex items-center justify-center h-96">
              <div className="text-center">
                <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Select a role to view and manage permissions</p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>

      {/* Edit Role Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Role</DialogTitle>
            <DialogDescription>Update role information</DialogDescription>
          </DialogHeader>
          {selectedRole && (
            <form onSubmit={handleUpdateRole} className="space-y-4">
              <div>
                <Label htmlFor="edit-displayName">Display Name</Label>
                <Input
                  id="edit-displayName"
                  name="displayName"
                  defaultValue={selectedRole.displayName}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  name="description"
                  defaultValue={selectedRole.description || ""}
                />
              </div>
              <div>
                <Label htmlFor="edit-color">Color (Hex)</Label>
                <Input
                  id="edit-color"
                  name="color"
                  type="color"
                  defaultValue={selectedRole.color || "#3b82f6"}
                />
              </div>
              <div>
                <Label htmlFor="edit-priority">Priority</Label>
                <Input
                  id="edit-priority"
                  name="priority"
                  type="number"
                  defaultValue={selectedRole.priority}
                />
              </div>
              <Button type="submit" className="w-full">Update Role</Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default RoleManagement;
