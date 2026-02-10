import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Trash2, Plus, Users, RotateCcw, Download, Upload } from "lucide-react";
import { toast } from "sonner";

interface PlayerPosition {
  id: number;
  x: number;
  y: number;
  role: string;
  playerName?: string;
  playerId?: number;
}

// Built-in formation templates for each team size
const BUILT_IN_FORMATIONS: Record<number, Record<string, { role: string; x: number; y: number }[]>> = {
  5: {
    "1-2-1": [
      { role: "GK", x: 50, y: 90 },
      { role: "LB", x: 25, y: 62 },
      { role: "RB", x: 75, y: 62 },
      { role: "CM", x: 50, y: 40 },
      { role: "ST", x: 50, y: 20 },
    ],
    "2-1-1": [
      { role: "GK", x: 50, y: 90 },
      { role: "CB", x: 35, y: 65 },
      { role: "CB", x: 65, y: 65 },
      { role: "CM", x: 50, y: 42 },
      { role: "ST", x: 50, y: 20 },
    ],
    "1-1-2": [
      { role: "GK", x: 50, y: 90 },
      { role: "CB", x: 50, y: 65 },
      { role: "CM", x: 50, y: 42 },
      { role: "ST", x: 35, y: 20 },
      { role: "ST", x: 65, y: 20 },
    ],
    "2-2": [
      { role: "GK", x: 50, y: 90 },
      { role: "CB", x: 30, y: 62 },
      { role: "CB", x: 70, y: 62 },
      { role: "ST", x: 30, y: 28 },
      { role: "ST", x: 70, y: 28 },
    ],
  },
  7: {
    "2-3-1": [
      { role: "GK", x: 50, y: 90 },
      { role: "CB", x: 30, y: 72 },
      { role: "CB", x: 70, y: 72 },
      { role: "LM", x: 20, y: 48 },
      { role: "CM", x: 50, y: 46 },
      { role: "RM", x: 80, y: 48 },
      { role: "ST", x: 50, y: 22 },
    ],
    "3-2-1": [
      { role: "GK", x: 50, y: 90 },
      { role: "CB", x: 25, y: 72 },
      { role: "CB", x: 50, y: 70 },
      { role: "CB", x: 75, y: 72 },
      { role: "CM", x: 35, y: 46 },
      { role: "CM", x: 65, y: 46 },
      { role: "ST", x: 50, y: 22 },
    ],
    "2-1-2-1": [
      { role: "GK", x: 50, y: 90 },
      { role: "CB", x: 30, y: 72 },
      { role: "CB", x: 70, y: 72 },
      { role: "CDM", x: 50, y: 56 },
      { role: "LM", x: 25, y: 38 },
      { role: "RM", x: 75, y: 38 },
      { role: "ST", x: 50, y: 20 },
    ],
    "3-1-2": [
      { role: "GK", x: 50, y: 90 },
      { role: "CB", x: 25, y: 72 },
      { role: "CB", x: 50, y: 70 },
      { role: "CB", x: 75, y: 72 },
      { role: "CM", x: 50, y: 46 },
      { role: "ST", x: 35, y: 22 },
      { role: "ST", x: 65, y: 22 },
    ],
  },
  9: {
    "3-3-2": [
      { role: "GK", x: 50, y: 90 },
      { role: "LB", x: 20, y: 72 },
      { role: "CB", x: 50, y: 74 },
      { role: "RB", x: 80, y: 72 },
      { role: "LM", x: 20, y: 48 },
      { role: "CM", x: 50, y: 48 },
      { role: "RM", x: 80, y: 48 },
      { role: "ST", x: 35, y: 22 },
      { role: "ST", x: 65, y: 22 },
    ],
    "3-2-3": [
      { role: "GK", x: 50, y: 90 },
      { role: "LB", x: 20, y: 72 },
      { role: "CB", x: 50, y: 74 },
      { role: "RB", x: 80, y: 72 },
      { role: "CM", x: 35, y: 50 },
      { role: "CM", x: 65, y: 50 },
      { role: "LW", x: 22, y: 24 },
      { role: "ST", x: 50, y: 20 },
      { role: "RW", x: 78, y: 24 },
    ],
    "2-4-2": [
      { role: "GK", x: 50, y: 90 },
      { role: "CB", x: 35, y: 74 },
      { role: "CB", x: 65, y: 74 },
      { role: "LM", x: 15, y: 48 },
      { role: "CM", x: 38, y: 50 },
      { role: "CM", x: 62, y: 50 },
      { role: "RM", x: 85, y: 48 },
      { role: "ST", x: 35, y: 22 },
      { role: "ST", x: 65, y: 22 },
    ],
    "3-4-1": [
      { role: "GK", x: 50, y: 90 },
      { role: "LB", x: 20, y: 72 },
      { role: "CB", x: 50, y: 74 },
      { role: "RB", x: 80, y: 72 },
      { role: "LM", x: 18, y: 48 },
      { role: "CM", x: 38, y: 50 },
      { role: "CM", x: 62, y: 50 },
      { role: "RM", x: 82, y: 48 },
      { role: "ST", x: 50, y: 20 },
    ],
  },
  11: {
    "4-4-2": [
      { role: "GK", x: 50, y: 90 },
      { role: "LB", x: 18, y: 72 },
      { role: "CB", x: 38, y: 74 },
      { role: "CB", x: 62, y: 74 },
      { role: "RB", x: 82, y: 72 },
      { role: "LM", x: 18, y: 48 },
      { role: "CM", x: 38, y: 50 },
      { role: "CM", x: 62, y: 50 },
      { role: "RM", x: 82, y: 48 },
      { role: "ST", x: 38, y: 22 },
      { role: "ST", x: 62, y: 22 },
    ],
    "4-3-3": [
      { role: "GK", x: 50, y: 90 },
      { role: "LB", x: 18, y: 72 },
      { role: "CB", x: 38, y: 74 },
      { role: "CB", x: 62, y: 74 },
      { role: "RB", x: 82, y: 72 },
      { role: "CM", x: 30, y: 52 },
      { role: "CM", x: 50, y: 48 },
      { role: "CM", x: 70, y: 52 },
      { role: "LW", x: 20, y: 26 },
      { role: "ST", x: 50, y: 20 },
      { role: "RW", x: 80, y: 26 },
    ],
    "4-2-3-1": [
      { role: "GK", x: 50, y: 90 },
      { role: "LB", x: 18, y: 72 },
      { role: "CB", x: 38, y: 74 },
      { role: "CB", x: 62, y: 74 },
      { role: "RB", x: 82, y: 72 },
      { role: "CDM", x: 38, y: 56 },
      { role: "CDM", x: 62, y: 56 },
      { role: "CAM", x: 20, y: 36 },
      { role: "CAM", x: 50, y: 34 },
      { role: "CAM", x: 80, y: 36 },
      { role: "ST", x: 50, y: 18 },
    ],
    "3-5-2": [
      { role: "GK", x: 50, y: 90 },
      { role: "CB", x: 30, y: 74 },
      { role: "CB", x: 50, y: 72 },
      { role: "CB", x: 70, y: 74 },
      { role: "LWB", x: 12, y: 50 },
      { role: "CM", x: 35, y: 52 },
      { role: "CM", x: 50, y: 48 },
      { role: "CM", x: 65, y: 52 },
      { role: "RWB", x: 88, y: 50 },
      { role: "ST", x: 38, y: 22 },
      { role: "ST", x: 62, y: 22 },
    ],
    "3-4-3": [
      { role: "GK", x: 50, y: 90 },
      { role: "CB", x: 30, y: 74 },
      { role: "CB", x: 50, y: 72 },
      { role: "CB", x: 70, y: 74 },
      { role: "LM", x: 18, y: 50 },
      { role: "CM", x: 38, y: 52 },
      { role: "CM", x: 62, y: 52 },
      { role: "RM", x: 82, y: 50 },
      { role: "LW", x: 24, y: 24 },
      { role: "ST", x: 50, y: 20 },
      { role: "RW", x: 76, y: 24 },
    ],
    "4-1-4-1": [
      { role: "GK", x: 50, y: 90 },
      { role: "LB", x: 18, y: 72 },
      { role: "CB", x: 38, y: 74 },
      { role: "CB", x: 62, y: 74 },
      { role: "RB", x: 82, y: 72 },
      { role: "CDM", x: 50, y: 56 },
      { role: "LM", x: 18, y: 38 },
      { role: "CM", x: 38, y: 40 },
      { role: "CM", x: 62, y: 40 },
      { role: "RM", x: 82, y: 38 },
      { role: "ST", x: 50, y: 18 },
    ],
  },
};

export default function FormationBuilder() {
  const { user } = useAuth();
  const [positions, setPositions] = useState<PlayerPosition[]>([]);
  const [teamSize, setTeamSize] = useState<number>(11);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("4-4-2");
  const [formationName, setFormationName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [editingPositionId, setEditingPositionId] = useState<number | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<number | undefined>();
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const pitchRef = useRef<HTMLDivElement>(null);
  const hasDraggedRef = useRef(false);

  // Available position roles
  const availableRoles = [
    { value: "GK", label: "Goalkeeper (GK)", category: "Goalkeeper" },
    { value: "CB", label: "Center Back (CB)", category: "Defender" },
    { value: "LB", label: "Left Back (LB)", category: "Defender" },
    { value: "RB", label: "Right Back (RB)", category: "Defender" },
    { value: "LWB", label: "Left Wing Back (LWB)", category: "Defender" },
    { value: "RWB", label: "Right Wing Back (RWB)", category: "Defender" },
    { value: "CDM", label: "Defensive Midfielder (CDM)", category: "Midfielder" },
    { value: "CM", label: "Central Midfielder (CM)", category: "Midfielder" },
    { value: "CAM", label: "Attacking Midfielder (CAM)", category: "Midfielder" },
    { value: "LM", label: "Left Midfielder (LM)", category: "Midfielder" },
    { value: "RM", label: "Right Midfielder (RM)", category: "Midfielder" },
    { value: "LW", label: "Left Winger (LW)", category: "Forward" },
    { value: "RW", label: "Right Winger (RW)", category: "Forward" },
    { value: "ST", label: "Striker (ST)", category: "Forward" },
    { value: "CF", label: "Center Forward (CF)", category: "Forward" },
  ];

  const [showLoadDialog, setShowLoadDialog] = useState(false);

  const teamsQuery = trpc.teams.getAll.useQuery();
  const { data: formationTemplates, isLoading: templatesLoading } = trpc.tactics.getFormationTemplates.useQuery();
  const { data: savedFormations, refetch: refetchSaved } = trpc.tactics.getUserFormations.useQuery();
  const createFormation = trpc.tactics.createFormation.useMutation();
  const deleteFormation = trpc.tactics.deleteFormation.useMutation();

  // Load a built-in formation by name for the current team size
  const loadBuiltInFormation = (formationName: string, size: number = teamSize) => {
    const sizeFormations = BUILT_IN_FORMATIONS[size];
    if (!sizeFormations) return;
    const template = sizeFormations[formationName];
    if (!template) return;
    setPositions(template.map((p, idx) => ({ id: idx + 1, ...p })));
    setSelectedTemplate(formationName);
  };

  // Initialize with the first built-in formation for the selected team size
  useEffect(() => {
    const sizeFormations = BUILT_IN_FORMATIONS[teamSize];
    if (sizeFormations) {
      const firstFormationName = Object.keys(sizeFormations)[0];
      loadBuiltInFormation(firstFormationName, teamSize);
    }
  }, [teamSize]);

  // Handle team size change
  const handleTeamSizeChange = (size: string) => {
    setTeamSize(Number(size));
  };

  const loadTemplate = (formationId: number) => {
    const template = formationTemplates?.find(t => t.id === formationId);
    if (template && template.positions) {
      setSelectedTemplate(template.name);
      try {
        let parsedPositions = typeof template.positions === 'string' 
          ? JSON.parse(template.positions) 
          : template.positions;
        
        // Skip tactical board format entries (these should be in separate table now)
        if (parsedPositions && typeof parsedPositions === 'object' && 'homePlayers' in parsedPositions) {
          console.log("Skipping tactical board format entry:", template.name);
          toast.error("This is a tactical board setup, not a formation template. Please use the Tactical Board feature.");
          return;
        }
        
        if (!Array.isArray(parsedPositions)) {
          console.error("Formation positions is not an array:", parsedPositions);
          toast.error("Invalid formation format");
          return;
        }
        
        setPositions(
          parsedPositions.map((pos: any, idx: number) => ({
            id: idx + 1,
            x: pos.x,
            y: pos.y,
            role: pos.role || pos.label || "CM",
          }))
        );
      } catch (error) {
        console.error("Failed to parse formation positions:", error);
        toast.error("Failed to load formation template");
      }
    }
  };

  const loadSavedFormation = (formation: any) => {
    try {
      const parsed = typeof formation.positions === 'string'
        ? JSON.parse(formation.positions)
        : formation.positions;
      if (!Array.isArray(parsed)) {
        toast.error("Invalid formation format");
        return;
      }
      const loaded = parsed.map((pos: any, idx: number) => ({
        id: idx + 1,
        x: pos.x,
        y: pos.y,
        role: pos.role || pos.label || "CM",
      }));
      setPositions(loaded);
      setSelectedTemplate(formation.templateName || formation.name);
      // Auto-detect team size from player count
      const count = loaded.length;
      if ([5, 7, 9, 11].includes(count)) setTeamSize(count);
      toast.success(`Loaded "${formation.name}"`);
    } catch {
      toast.error("Failed to load formation");
    }
  };

  const handleMouseDown = (e: React.MouseEvent, positionId: number) => {
    e.preventDefault();
    if (!pitchRef.current) return;
    
    const rect = pitchRef.current.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 100;
    const clickY = ((e.clientY - rect.top) / rect.height) * 100;
    
    // Find the position being dragged
    const position = positions.find(p => p.id === positionId);
    if (position) {
      // Calculate offset between click position and player position
      setDragOffset({
        x: clickX - position.x,
        y: clickY - position.y
      });
    }
    
    setSelectedPosition(positionId);
    setIsDragging(true);
    hasDraggedRef.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || selectedPosition === null || !pitchRef.current) return;
    hasDraggedRef.current = true;

    const rect = pitchRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100 - dragOffset.x;
    const y = ((e.clientY - rect.top) / rect.height) * 100 - dragOffset.y;

    // Clamp values between 5 and 95
    const clampedX = Math.max(5, Math.min(95, x));
    const clampedY = Math.max(5, Math.min(95, y));

    setPositions((prev) =>
      prev.map((pos) =>
        pos.id === selectedPosition ? { ...pos, x: clampedX, y: clampedY } : pos
      )
    );
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setSelectedPosition(null);
    setDragOffset({ x: 0, y: 0 });
  };

  const handlePlayerClick = (positionId: number) => {
    // Only open dialog if it was a clean click (no drag movement)
    if (!hasDraggedRef.current) {
      setEditingPositionId(positionId);
      setShowRoleDialog(true);
    }
  };

  const handleRoleChange = (newRole: string) => {
    if (editingPositionId !== null) {
      setPositions((prev) =>
        prev.map((pos) =>
          pos.id === editingPositionId ? { ...pos, role: newRole } : pos
        )
      );
      setShowRoleDialog(false);
      setEditingPositionId(null);
    }
  };

  const handleSaveFormation = async () => {
    if (!formationName.trim()) {
      toast.error("Please enter a formation name");
      return;
    }

    if (positions.length === 0) {
      toast.error("Please add players to the formation");
      return;
    }

    try {
      const result = await createFormation.mutateAsync({
        name: formationName,
        templateName: selectedTemplate,
        description: description || undefined,
        positions: JSON.stringify(positions),
        teamId: selectedTeamId,
        isTemplate: false,
      });
      
      console.log("Formation saved successfully:", result);
      
      setShowSaveDialog(false);
      setFormationName("");
      setDescription("");
      refetchSaved();
      
      toast.success("Formation saved successfully!", {
        description: `${formationName} has been saved to the database.`
      });
    } catch (error) {
      console.error("Failed to save formation:", error);
      toast.error("Failed to save formation", {
        description: error instanceof Error ? error.message : "An unexpected error occurred"
      });
    }
  };

  const resetFormation = () => {
    loadBuiltInFormation(selectedTemplate);
    toast.success("Formation reset to template");
  };

  const updatePlayerRole = (positionId: number, newRole: string) => {
    setPositions((prev) =>
      prev.map((pos) => (pos.id === positionId ? { ...pos, role: newRole } : pos))
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Formation Builder</h1>
            <p className="text-muted-foreground">Drag players to customize your formation</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={resetFormation}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
            <Dialog open={showLoadDialog} onOpenChange={setShowLoadDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Upload className="w-4 h-4 mr-2" />
                  Load
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Load Saved Formation</DialogTitle>
                </DialogHeader>
                <div className="space-y-2 pt-4 max-h-96 overflow-y-auto">
                  {(() => {
                    // Filter to only show valid formation-builder entries (array format, non-template)
                    const validSaved = (savedFormations || []).filter(f => {
                      if (f.isTemplate) return false;
                      try {
                        const parsed = typeof f.positions === 'string' ? JSON.parse(f.positions) : f.positions;
                        return Array.isArray(parsed);
                      } catch { return false; }
                    });
                    return validSaved.length > 0 ? (
                      validSaved.map((f) => {
                        let playerCount = 0;
                        try {
                          const parsed = typeof f.positions === 'string' ? JSON.parse(f.positions) : f.positions;
                          if (Array.isArray(parsed)) playerCount = parsed.length;
                        } catch {}
                        return (
                          <div key={f.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50">
                            <div className="flex-1 cursor-pointer" onClick={() => {
                              loadSavedFormation(f);
                              setShowLoadDialog(false);
                            }}>
                              <div className="font-medium">{f.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {f.templateName || 'Custom'} · {playerCount} players
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={async (e) => {
                                e.stopPropagation();
                                await deleteFormation.mutateAsync({ id: f.id });
                                refetchSaved();
                                toast.success('Formation deleted');
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">No saved formations yet</div>
                    );
                  })()}
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Save className="w-4 h-4 mr-2" />
                  Save Formation
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Save Formation</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div>
                    <label className="text-sm font-medium">Formation Name</label>
                    <Input
                      value={formationName}
                      onChange={(e) => setFormationName(e.target.value)}
                      placeholder="e.g., Match Day Formation"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Description (optional)</label>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Notes about this formation..."
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                  {teamsQuery.data && teamsQuery.data.length > 0 && (
                    <div>
                      <label className="text-sm font-medium">Team (optional)</label>
                      <Select
                        value={selectedTeamId?.toString() || ""}
                        onValueChange={(v) => setSelectedTeamId(v ? parseInt(v) : undefined)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select a team" />
                        </SelectTrigger>
                        <SelectContent>
                          {teamsQuery.data.map((team) => (
                            <SelectItem key={team.id} value={team.id.toString()}>
                              {team.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <Button
                    onClick={handleSaveFormation}
                    disabled={createFormation.isPending}
                    className="w-full"
                  >
                    {createFormation.isPending ? "Saving..." : "Save Formation"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Role Change Dialog */}
        <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change Position Role</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Select Position</label>
                <div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto">
                  {availableRoles.map((role) => (
                    <Button
                      key={role.value}
                      variant="outline"
                      className="justify-start h-auto py-3"
                      onClick={() => handleRoleChange(role.value)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                          role.value === "GK" ? "bg-yellow-500 text-black" :
                          ["CB", "LB", "RB", "LWB", "RWB"].includes(role.value) ? "bg-blue-500 text-white" :
                          ["CM", "CDM", "CAM", "LM", "RM"].includes(role.value) ? "bg-green-500 text-white" :
                          "bg-red-500 text-white"
                        }`}>
                          {role.value}
                        </div>
                        <div className="text-left">
                          <div className="font-medium">{role.label}</div>
                          <div className="text-xs text-muted-foreground">{role.category}</div>
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Formation Templates */}
          <div className="lg:col-span-1 space-y-4">
            {/* Team Size Selector */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Team Size
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={String(teamSize)} onValueChange={handleTeamSizeChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 v 5</SelectItem>
                    <SelectItem value="7">7 v 7</SelectItem>
                    <SelectItem value="9">9 v 9</SelectItem>
                    <SelectItem value="11">11 v 11</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Formation Templates */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Formations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.keys(BUILT_IN_FORMATIONS[teamSize] || {}).map((name) => (
                  <Button
                    key={name}
                    variant={selectedTemplate === name ? "default" : "outline"}
                    className="w-full justify-start"
                    onClick={() => loadBuiltInFormation(name)}
                  >
                    {name}
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Position Legend */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Position Roles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center text-xs font-bold text-black">
                      GK
                    </div>
                    <span className="text-muted-foreground">Goalkeeper</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold text-white">
                      CB
                    </div>
                    <span className="text-muted-foreground">Center Back</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-xs font-bold text-white">
                      CM
                    </div>
                    <span className="text-muted-foreground">Midfielder</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center text-xs font-bold text-white">
                      ST
                    </div>
                    <span className="text-muted-foreground">Striker</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Instructions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Instructions</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>• Click and drag players to reposition them</p>
                <p>• Click on a player to edit their role</p>
                <p>• Use templates as starting points</p>
                <p>• Save formations for match preparation</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Pitch Area */}
          <div className="lg:col-span-3">
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div
                  ref={pitchRef}
                  className="relative w-full aspect-[3/4] bg-gradient-to-b from-green-700 to-green-800 cursor-crosshair select-none"
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                >
                  {/* Pitch markings */}
                  <svg
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    viewBox="0 0 100 130"
                    preserveAspectRatio="none"
                  >
                    {/* Outer boundary */}
                    <rect
                      x="2"
                      y="2"
                      width="96"
                      height="126"
                      fill="none"
                      stroke="rgba(255,255,255,0.5)"
                      strokeWidth="0.3"
                    />
                    {/* Center line */}
                    <line
                      x1="2"
                      y1="65"
                      x2="98"
                      y2="65"
                      stroke="rgba(255,255,255,0.5)"
                      strokeWidth="0.3"
                    />
                    {/* Center circle */}
                    <circle
                      cx="50"
                      cy="65"
                      r="12"
                      fill="none"
                      stroke="rgba(255,255,255,0.5)"
                      strokeWidth="0.3"
                    />
                    <circle cx="50" cy="65" r="0.8" fill="rgba(255,255,255,0.5)" />
                    {/* Top penalty area */}
                    <rect
                      x="20"
                      y="2"
                      width="60"
                      height="20"
                      fill="none"
                      stroke="rgba(255,255,255,0.5)"
                      strokeWidth="0.3"
                    />
                    <rect
                      x="32"
                      y="2"
                      width="36"
                      height="8"
                      fill="none"
                      stroke="rgba(255,255,255,0.5)"
                      strokeWidth="0.3"
                    />
                    <circle cx="50" cy="15" r="0.8" fill="rgba(255,255,255,0.5)" />
                    {/* Bottom penalty area */}
                    <rect
                      x="20"
                      y="108"
                      width="60"
                      height="20"
                      fill="none"
                      stroke="rgba(255,255,255,0.5)"
                      strokeWidth="0.3"
                    />
                    <rect
                      x="32"
                      y="120"
                      width="36"
                      height="8"
                      fill="none"
                      stroke="rgba(255,255,255,0.5)"
                      strokeWidth="0.3"
                    />
                    <circle cx="50" cy="115" r="0.8" fill="rgba(255,255,255,0.5)" />
                    {/* Corner arcs */}
                    <path
                      d="M 2 5 A 3 3 0 0 0 5 2"
                      fill="none"
                      stroke="rgba(255,255,255,0.5)"
                      strokeWidth="0.3"
                    />
                    <path
                      d="M 95 2 A 3 3 0 0 0 98 5"
                      fill="none"
                      stroke="rgba(255,255,255,0.5)"
                      strokeWidth="0.3"
                    />
                    <path
                      d="M 2 125 A 3 3 0 0 1 5 128"
                      fill="none"
                      stroke="rgba(255,255,255,0.5)"
                      strokeWidth="0.3"
                    />
                    <path
                      d="M 95 128 A 3 3 0 0 1 98 125"
                      fill="none"
                      stroke="rgba(255,255,255,0.5)"
                      strokeWidth="0.3"
                    />
                  </svg>

                  {/* Player positions */}
                  {positions.map((pos) => {
                    const getPositionColor = (role: string) => {
                      if (role === "GK") return "bg-yellow-500 text-black";
                      if (["CB", "LB", "RB", "LWB", "RWB"].includes(role)) return "bg-blue-500 text-white";
                      if (["CM", "CDM", "CAM", "LM", "RM"].includes(role)) return "bg-green-500 text-white";
                      return "bg-red-500 text-white";
                    };

                    return (
                      <div
                        key={pos.id}
                        className={`absolute w-10 h-10 -ml-5 -mt-5 rounded-full ${getPositionColor(
                          pos.role
                        )} flex items-center justify-center text-xs font-bold cursor-pointer shadow-lg transition-transform hover:scale-110 ${
                          selectedPosition === pos.id ? "ring-2 ring-white ring-offset-2 ring-offset-green-700" : ""
                        }`}
                        style={{
                          left: `${pos.x}%`,
                          top: `${pos.y}%`,
                        }}
                        onMouseDown={(e) => handleMouseDown(e, pos.id)}
                        onClick={() => handlePlayerClick(pos.id)}
                      >
                        {pos.role}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>


          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
