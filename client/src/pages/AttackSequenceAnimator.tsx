import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, RotateCcw, FastForward, Users, Pencil, Trash2, Save, FolderOpen, Zap } from 'lucide-react';
import { RealisticPlayer3D } from '@/components/RealisticPlayer3D';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Attack sequence keyframe structure
interface PlayerKeyframe {
  playerId: number;
  time: number; // seconds
  x: number;
  z: number;
  action?: 'pass' | 'receive' | 'dribble' | 'shoot';
}

interface AttackSequence {
  id: string;
  name: string;
  duration: number; // total duration in seconds
  keyframes: PlayerKeyframe[];
  ballPath: { time: number; x: number; z: number }[];
}

// Pre-built attack sequences
const ATTACK_PATTERNS: Record<string, AttackSequence> = {
  'counter_attack': {
  id: 'counter_attack_1',
  name: 'Counter Attack - Wing Play',
  duration: 12, // 12 seconds
  keyframes: [
    // Phase 1: Ball recovery (0-2s)
    { playerId: 5, time: 0, x: -5, z: 35, action: 'receive' }, // CB recovers ball
    { playerId: 5, time: 2, x: -5, z: 30 },
    
    // Phase 2: Build-up (2-5s)
    { playerId: 7, time: 2, x: -15, z: 15 },
    { playerId: 7, time: 4, x: -20, z: 5, action: 'receive' }, // Winger receives
    { playerId: 10, time: 2, x: 0, z: 10 },
    { playerId: 10, time: 5, x: -5, z: -10 }, // CAM runs forward
    
    // Phase 3: Wing attack (5-8s)
    { playerId: 7, time: 5, x: -20, z: 5 },
    { playerId: 7, time: 8, x: -25, z: -20, action: 'pass' }, // Winger advances
    { playerId: 9, time: 5, x: -5, z: -25 },
    { playerId: 9, time: 8, x: -10, z: -35, action: 'receive' }, // Striker moves
    
    // Phase 4: Final third (8-12s)
    { playerId: 9, time: 8, x: -10, z: -35 },
    { playerId: 9, time: 10, x: -5, z: -40 },
    { playerId: 9, time: 12, x: 0, z: -45, action: 'shoot' }, // Shot on goal
    { playerId: 10, time: 8, x: -5, z: -10 },
    { playerId: 10, time: 12, x: 5, z: -38 }, // CAM supports
    { playerId: 11, time: 8, x: 15, z: -25 },
    { playerId: 11, time: 12, x: 10, z: -38 }, // Other striker
    
    // Supporting players
    { playerId: 6, time: 0, x: 0, z: 30 },
    { playerId: 6, time: 12, x: 0, z: 10 }, // DM stays back
    { playerId: 2, time: 0, x: -20, z: 35 },
    { playerId: 2, time: 12, x: -20, z: 20 }, // LB advances slightly
    { playerId: 3, time: 0, x: 20, z: 35 },
    { playerId: 3, time: 12, x: 20, z: 20 }, // RB advances slightly
  ],
  ballPath: [
    { time: 0, x: -5, z: 35 },
    { time: 2, x: -5, z: 30 },
    { time: 4, x: -20, z: 5 },
    { time: 8, x: -25, z: -20 },
    { time: 10, x: -10, z: -35 },
    { time: 12, x: 0, z: -48 }, // Goal!
  ]
  },
  
  'central_buildup': {
    id: 'central_buildup',
    name: 'Central Build-up Play',
    duration: 14,
    keyframes: [
      // Phase 1: GK distribution (0-2s)
      { playerId: 1, time: 0, x: 0, z: 45, action: 'pass' },
      { playerId: 5, time: 2, x: 0, z: 35, action: 'receive' }, // CB receives
      
      // Phase 2: Central progression (2-6s)
      { playerId: 5, time: 2, x: 0, z: 35 },
      { playerId: 5, time: 4, x: 0, z: 28, action: 'pass' },
      { playerId: 6, time: 4, x: 0, z: 20, action: 'receive' }, // DM receives
      { playerId: 6, time: 6, x: 0, z: 15, action: 'pass' },
      
      // Phase 3: Through the middle (6-10s)
      { playerId: 10, time: 6, x: 0, z: 5, action: 'receive' }, // CAM receives
      { playerId: 10, time: 8, x: 0, z: -5 },
      { playerId: 10, time: 10, x: 0, z: -15, action: 'pass' },
      { playerId: 9, time: 8, x: 0, z: -25 },
      { playerId: 9, time: 10, x: 0, z: -35, action: 'receive' },
      
      // Phase 4: Final pass and shot (10-14s)
      { playerId: 9, time: 12, x: 0, z: -42 },
      { playerId: 9, time: 14, x: 0, z: -45, action: 'shoot' },
      
      // Supporting players
      { playerId: 7, time: 0, x: -15, z: 15 },
      { playerId: 7, time: 14, x: -18, z: -10 },
      { playerId: 8, time: 0, x: 15, z: 15 },
      { playerId: 8, time: 14, x: 18, z: -10 },
      { playerId: 11, time: 0, x: 10, z: -20 },
      { playerId: 11, time: 14, x: 8, z: -38 },
    ],
    ballPath: [
      { time: 0, x: 0, z: 45 },
      { time: 2, x: 0, z: 35 },
      { time: 4, x: 0, z: 20 },
      { time: 6, x: 0, z: 5 },
      { time: 10, x: 0, z: -35 },
      { time: 14, x: 0, z: -48 },
    ]
  },
  
  'high_press': {
    id: 'high_press',
    name: 'High Press Recovery',
    duration: 10,
    keyframes: [
      // Phase 1: Press and win ball (0-3s)
      { playerId: 9, time: 0, x: 0, z: -35 },
      { playerId: 9, time: 2, x: 0, z: -40, action: 'receive' }, // Win ball high
      { playerId: 10, time: 0, x: 0, z: -25 },
      { playerId: 10, time: 2, x: 5, z: -35 },
      
      // Phase 2: Quick combination (3-6s)
      { playerId: 9, time: 3, x: -5, z: -42, action: 'pass' },
      { playerId: 11, time: 3, x: 10, z: -38, action: 'receive' },
      { playerId: 11, time: 5, x: 8, z: -43, action: 'pass' },
      { playerId: 10, time: 5, x: 0, z: -40, action: 'receive' },
      
      // Phase 3: Shot (6-10s)
      { playerId: 10, time: 7, x: 0, z: -44 },
      { playerId: 10, time: 10, x: 0, z: -46, action: 'shoot' },
      
      // Supporting players press high
      { playerId: 7, time: 0, x: -15, z: -30 },
      { playerId: 7, time: 10, x: -12, z: -40 },
      { playerId: 8, time: 0, x: 15, z: -30 },
      { playerId: 8, time: 10, x: 12, z: -40 },
      { playerId: 6, time: 0, x: 0, z: -15 },
      { playerId: 6, time: 10, x: 0, z: -25 },
    ],
    ballPath: [
      { time: 0, x: 0, z: -38 },
      { time: 2, x: 0, z: -40 },
      { time: 3, x: 10, z: -38 },
      { time: 5, x: 0, z: -40 },
      { time: 10, x: 0, z: -48 },
    ]
  },
  
  'wing_attack': {
    id: 'wing_attack',
    name: 'Wing Attack with Overlap',
    duration: 13,
    keyframes: [
      // Phase 1: Switch play (0-4s)
      { playerId: 6, time: 0, x: 0, z: 20, action: 'pass' },
      { playerId: 3, time: 2, x: 20, z: 30, action: 'receive' }, // RB receives
      { playerId: 3, time: 4, x: 25, z: 20, action: 'pass' },
      
      // Phase 2: Wing play (4-8s)
      { playerId: 8, time: 4, x: 25, z: 10, action: 'receive' }, // Winger
      { playerId: 8, time: 6, x: 28, z: -5 },
      { playerId: 3, time: 6, x: 30, z: 5 }, // RB overlaps
      { playerId: 8, time: 8, x: 25, z: -15, action: 'pass' },
      
      // Phase 3: Cross and finish (8-13s)
      { playerId: 3, time: 8, x: 30, z: -20, action: 'receive' },
      { playerId: 3, time: 10, x: 32, z: -35, action: 'pass' }, // Cross
      { playerId: 9, time: 8, x: 0, z: -30 },
      { playerId: 9, time: 11, x: 5, z: -42, action: 'receive' },
      { playerId: 9, time: 13, x: 3, z: -45, action: 'shoot' },
      
      // Supporting players
      { playerId: 10, time: 0, x: 0, z: 5 },
      { playerId: 10, time: 13, x: -5, z: -38 },
      { playerId: 11, time: 0, x: -10, z: -25 },
      { playerId: 11, time: 13, x: -8, z: -40 },
      { playerId: 7, time: 0, x: -20, z: 10 },
      { playerId: 7, time: 13, x: -15, z: -15 },
    ],
    ballPath: [
      { time: 0, x: 0, z: 20 },
      { time: 2, x: 20, z: 30 },
      { time: 4, x: 25, z: 10 },
      { time: 8, x: 25, z: -15 },
      { time: 10, x: 32, z: -35 },
      { time: 11, x: 5, z: -42 },
      { time: 13, x: 3, z: -48 },
    ]
  }
};

export default function AttackSequenceAnimator() {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | undefined>(undefined);
  const cameraRef = useRef<THREE.PerspectiveCamera | undefined>(undefined);
  const rendererRef = useRef<THREE.WebGLRenderer | undefined>(undefined);
  const controlsRef = useRef<OrbitControls | undefined>(undefined);
  const playersRef = useRef<Map<number, THREE.Group>>(new Map());
  const ballRef = useRef<THREE.Mesh | undefined>(undefined);
  const animationFrameRef = useRef<number | undefined>(undefined);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [selectedPattern, setSelectedPattern] = useState('counter_attack');
  const sequence = ATTACK_PATTERNS[selectedPattern];
  const [selectedFormation, setSelectedFormation] = useState('4-4-2');
  const [isDragging, setIsDragging] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null);
  const [isDrawingPath, setIsDrawingPath] = useState(false);
  const [playerPaths, setPlayerPaths] = useState<Map<number, Array<{x: number, z: number}>>>(new Map());
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [planName, setPlanName] = useState('');
  const [showDefensiveTransition, setShowDefensiveTransition] = useState(false);
  const [recoverySpeed, setRecoverySpeed] = useState(1);
  const [showSubstitutionDialog, setShowSubstitutionDialog] = useState(false);
  const [selectedPlayerForSub, setSelectedPlayerForSub] = useState<number | null>(null);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());
  
  const savePlanMutation = trpc.tacticalPlans.savePlan.useMutation();
  const { data: savedPlans, refetch: refetchPlans } = trpc.tacticalPlans.getMyPlans.useQuery();
  const deletePlanMutation = trpc.tacticalPlans.deletePlan.useMutation();
  const { data: allPlayers } = trpc.players.getAll.useQuery();
  
  // Player assignments: Map player ID to database player
  const [playerAssignments, setPlayerAssignments] = useState<Map<number, any>>(new Map());

  // Initialize Three.js scene
  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      60,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 80, 50);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controlsRef.current = controls;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 100, 50);
    scene.add(directionalLight);

    // Create football pitch
    createFootballPitch(scene);

    // Create players
    createPlayers(scene);

    // Create ball
    const ballGeometry = new THREE.SphereGeometry(0.8, 16, 16);
    const ballMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const ball = new THREE.Mesh(ballGeometry, ballMaterial);
    ball.position.y = 0.8;
    scene.add(ball);
    ballRef.current = ball;

    // Animation loop
    const animate = () => {
      controls.update();
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    animate();

    // Mouse event handlers for drag-and-drop
    const handleMouseDown = (event: MouseEvent) => {
      if (!mountRef.current || !cameraRef.current) return;
      
      const rect = mountRef.current.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
      
      // If drawing path mode
      if (isDrawingPath && selectedPlayer !== null) {
        const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        const intersection = new THREE.Vector3();
        raycasterRef.current.ray.intersectPlane(plane, intersection);
        
        if (intersection) {
          const currentPath = playerPaths.get(selectedPlayer) || [];
          currentPath.push({ x: intersection.x, z: intersection.z });
          setPlayerPaths(new Map(playerPaths.set(selectedPlayer, currentPath)));
        }
        return;
      }
      
      const intersects = raycasterRef.current.intersectObjects(Array.from(playersRef.current.values()));
      
      if (intersects.length > 0) {
        const clickedObject = intersects[0].object;
        const playerId = Array.from(playersRef.current.entries()).find(([_, group]) => group === clickedObject || group.children.includes(clickedObject))?.[0];
        if (playerId !== undefined) {
          setSelectedPlayer(playerId);
          if (!isDrawingPath) {
            setIsDragging(true);
            if (controlsRef.current) controlsRef.current.enabled = false;
          }
        }
      }
    };
    
    const handleMouseMove = (event: MouseEvent) => {
      if (!isDragging || selectedPlayer === null || !mountRef.current || !cameraRef.current) return;
      
      const rect = mountRef.current.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
      
      // Intersect with ground plane
      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const intersection = new THREE.Vector3();
      raycasterRef.current.ray.intersectPlane(plane, intersection);
      
      const playerMesh = playersRef.current.get(selectedPlayer);
      if (playerMesh && intersection) {
        // Constrain to pitch boundaries
        intersection.x = Math.max(-35, Math.min(35, intersection.x));
        intersection.z = Math.max(-52.5, Math.min(52.5, intersection.z));
        playerMesh.position.x = intersection.x;
        playerMesh.position.z = intersection.z;
      }
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
      if (controlsRef.current) controlsRef.current.enabled = true;
    };
    
    renderer.domElement.addEventListener('mousedown', handleMouseDown);
    renderer.domElement.addEventListener('mousemove', handleMouseMove);
    renderer.domElement.addEventListener('mouseup', handleMouseUp);

    // Handle resize
    const handleResize = () => {
      if (!mountRef.current) return;
      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('mousedown', handleMouseDown);
      renderer.domElement.removeEventListener('mousemove', handleMouseMove);
      renderer.domElement.removeEventListener('mouseup', handleMouseUp);
      mountRef.current?.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  // Create football pitch
  const createFootballPitch = (scene: THREE.Scene) => {
    // Grass
    const grassGeometry = new THREE.PlaneGeometry(70, 105);
    const grassMaterial = new THREE.MeshStandardMaterial({ color: 0x2d5016 });
    const grass = new THREE.Mesh(grassGeometry, grassMaterial);
    grass.rotation.x = -Math.PI / 2;
    scene.add(grass);

    // White lines
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 });
    
    // Touchlines
    const touchline1 = createLine([-35, 0, -52.5], [-35, 0, 52.5], lineMaterial);
    const touchline2 = createLine([35, 0, -52.5], [35, 0, 52.5], lineMaterial);
    scene.add(touchline1, touchline2);
    
    // Goal lines
    const goalline1 = createLine([-35, 0, -52.5], [35, 0, -52.5], lineMaterial);
    const goalline2 = createLine([-35, 0, 52.5], [35, 0, 52.5], lineMaterial);
    scene.add(goalline1, goalline2);
    
    // Center line
    const centerLine = createLine([-35, 0, 0], [35, 0, 0], lineMaterial);
    scene.add(centerLine);
    
    // Center circle
    const centerCircle = new THREE.RingGeometry(9, 9.5, 64);
    const centerCircleMesh = new THREE.Mesh(centerCircle, new THREE.MeshBasicMaterial({ color: 0xffffff }));
    centerCircleMesh.rotation.x = -Math.PI / 2;
    centerCircleMesh.position.y = 0.1;
    scene.add(centerCircleMesh);

    // Goals
    createGoal(scene, 0, -52.5);
    createGoal(scene, 0, 52.5);
  };

  const createLine = (start: number[], end: number[], material: THREE.LineBasicMaterial) => {
    const geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(...start),
      new THREE.Vector3(...end)
    ]);
    return new THREE.Line(geometry, material);
  };

  const createGoal = (scene: THREE.Scene, x: number, z: number) => {
    const goalMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc });
    const postGeometry = new THREE.CylinderGeometry(0.3, 0.3, 8, 16);
    
    const leftPost = new THREE.Mesh(postGeometry, goalMaterial);
    leftPost.position.set(x - 7.32 / 2, 4, z);
    scene.add(leftPost);
    
    const rightPost = new THREE.Mesh(postGeometry, goalMaterial);
    rightPost.position.set(x + 7.32 / 2, 4, z);
    scene.add(rightPost);
    
    const crossbar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.3, 7.32, 16),
      goalMaterial
    );
    crossbar.rotation.z = Math.PI / 2;
    crossbar.position.set(x, 8, z);
    scene.add(crossbar);
  };

  // Formation definitions
  const FORMATIONS: Record<string, Array<{ id: number; x: number; z: number; color: number; label: string }>> = {
    '4-4-2': [
      { id: 1, x: 0, z: 45, color: 0x0000ff, label: 'GK' },
      { id: 2, x: -20, z: 35, color: 0x0000ff, label: 'LB' },
      { id: 3, x: 20, z: 35, color: 0x0000ff, label: 'RB' },
      { id: 4, x: -7, z: 35, color: 0x0000ff, label: 'CB' },
      { id: 5, x: 7, z: 35, color: 0x0000ff, label: 'CB' },
      { id: 6, x: 0, z: 25, color: 0x0000ff, label: 'DM' },
      { id: 7, x: -20, z: 15, color: 0x0000ff, label: 'LM' },
      { id: 8, x: 20, z: 15, color: 0x0000ff, label: 'RM' },
      { id: 9, x: -7, z: 0, color: 0x0000ff, label: 'ST' },
      { id: 10, x: 0, z: 5, color: 0x0000ff, label: 'CAM' },
      { id: 11, x: 7, z: 0, color: 0x0000ff, label: 'ST' },
    ],
    '4-3-2-1': [
      { id: 1, x: 0, z: 45, color: 0x0000ff, label: 'GK' },
      { id: 2, x: -20, z: 35, color: 0x0000ff, label: 'LB' },
      { id: 3, x: 20, z: 35, color: 0x0000ff, label: 'RB' },
      { id: 4, x: -7, z: 35, color: 0x0000ff, label: 'CB' },
      { id: 5, x: 7, z: 35, color: 0x0000ff, label: 'CB' },
      { id: 6, x: -12, z: 22, color: 0x0000ff, label: 'CM' },
      { id: 7, x: 0, z: 22, color: 0x0000ff, label: 'CM' },
      { id: 8, x: 12, z: 22, color: 0x0000ff, label: 'CM' },
      { id: 9, x: -10, z: 8, color: 0x0000ff, label: 'CAM' },
      { id: 10, x: 10, z: 8, color: 0x0000ff, label: 'CAM' },
      { id: 11, x: 0, z: -5, color: 0x0000ff, label: 'ST' },
    ],
    '4-2-3-1': [
      { id: 1, x: 0, z: 45, color: 0x0000ff, label: 'GK' },
      { id: 2, x: -20, z: 35, color: 0x0000ff, label: 'LB' },
      { id: 3, x: 20, z: 35, color: 0x0000ff, label: 'RB' },
      { id: 4, x: -7, z: 35, color: 0x0000ff, label: 'CB' },
      { id: 5, x: 7, z: 35, color: 0x0000ff, label: 'CB' },
      { id: 6, x: -8, z: 25, color: 0x0000ff, label: 'CDM' },
      { id: 7, x: 8, z: 25, color: 0x0000ff, label: 'CDM' },
      { id: 8, x: -18, z: 10, color: 0x0000ff, label: 'LW' },
      { id: 9, x: 0, z: 10, color: 0x0000ff, label: 'CAM' },
      { id: 10, x: 18, z: 10, color: 0x0000ff, label: 'RW' },
      { id: 11, x: 0, z: -5, color: 0x0000ff, label: 'ST' },
    ],
  };

  // Create players
  const createPlayers = (scene: THREE.Scene) => {
    const formation = FORMATIONS[selectedFormation] || FORMATIONS['4-4-2'];

    formation.forEach(player => {
      // Get assigned player name
      const assignedPlayer = playerAssignments.get(player.id);
      const displayName = assignedPlayer 
        ? `${assignedPlayer.firstName} ${assignedPlayer.lastName}` 
        : `Player ${player.id}`;
      const jerseyNum = assignedPlayer?.jerseyNumber || player.id;

      // Create realistic 3D player model
      const realisticPlayer = new RealisticPlayer3D({
        position: [player.x, 0, player.z],
        jerseyNumber: jerseyNum,
        teamColor: '#0066ff', // Blue team
        name: displayName
      });
      
      realisticPlayer.group.userData.playerId = player.id;
      realisticPlayer.group.userData.position = player.label;
      scene.add(realisticPlayer.group);
      playersRef.current.set(player.id, realisticPlayer.group);

      // Note: Jersey number and name label are now handled by RealisticPlayer3D class
    });
  };

  // Get player position at specific time using interpolation
  const getPlayerPositionAtTime = (playerId: number, time: number) => {
    const playerKeyframes = sequence.keyframes
      .filter(kf => kf.playerId === playerId)
      .sort((a, b) => a.time - b.time);

    if (playerKeyframes.length === 0) {
      // No keyframes for this player, return default position
      const player = playersRef.current.get(playerId);
      return player ? { x: player.position.x, z: player.position.z } : { x: 0, z: 0 };
    }

    // Find surrounding keyframes
    let before = playerKeyframes[0];
    let after = playerKeyframes[playerKeyframes.length - 1];

    for (let i = 0; i < playerKeyframes.length - 1; i++) {
      if (playerKeyframes[i].time <= time && playerKeyframes[i + 1].time >= time) {
        before = playerKeyframes[i];
        after = playerKeyframes[i + 1];
        break;
      }
    }

    // Interpolate
    if (before.time === after.time) {
      return { x: before.x, z: before.z };
    }

    const t = (time - before.time) / (after.time - before.time);
    return {
      x: before.x + (after.x - before.x) * t,
      z: before.z + (after.z - before.z) * t
    };
  };

  // Get ball position at specific time
  const getBallPositionAtTime = (time: number) => {
    const ballPath = sequence.ballPath.sort((a, b) => a.time - b.time);
    
    let before = ballPath[0];
    let after = ballPath[ballPath.length - 1];

    for (let i = 0; i < ballPath.length - 1; i++) {
      if (ballPath[i].time <= time && ballPath[i + 1].time >= time) {
        before = ballPath[i];
        after = ballPath[i + 1];
        break;
      }
    }

    if (before.time === after.time) {
      return { x: before.x, z: before.z };
    }

    const t = (time - before.time) / (after.time - before.time);
    return {
      x: before.x + (after.x - before.x) * t,
      z: before.z + (after.z - before.z) * t
    };
  };

  // Recreate players when formation or assignments change
  useEffect(() => {
    if (!sceneRef.current) return;
    
    // Remove existing players
    playersRef.current.forEach(mesh => {
      sceneRef.current?.remove(mesh);
    });
    playersRef.current.clear();
    
    // Create new players with selected formation
    createPlayers(sceneRef.current);
  }, [selectedFormation, playerAssignments]);

  // Render player paths
  useEffect(() => {
    if (!sceneRef.current) return;
    
    // Remove existing path lines
    const pathObjects = sceneRef.current.children.filter(obj => obj.userData.isPath);
    pathObjects.forEach(obj => sceneRef.current?.remove(obj));
    
    // Draw new paths
    playerPaths.forEach((path, playerId) => {
      if (path.length < 2) return;
      
      const points = path.map(p => new THREE.Vector3(p.x, 0.5, p.z));
      const curve = new THREE.CatmullRomCurve3(points);
      const pathPoints = curve.getPoints(50);
      const geometry = new THREE.BufferGeometry().setFromPoints(pathPoints);
      const material = new THREE.LineBasicMaterial({ color: 0xff6600, linewidth: 3 });
      const line = new THREE.Line(geometry, material);
      line.userData.isPath = true;
      sceneRef.current?.add(line);
      
      // Add arrows along the path
      for (let i = 0; i < path.length - 1; i++) {
        const start = new THREE.Vector3(path[i].x, 0.5, path[i].z);
        const end = new THREE.Vector3(path[i + 1].x, 0.5, path[i + 1].z);
        const direction = new THREE.Vector3().subVectors(end, start).normalize();
        const arrowHelper = new THREE.ArrowHelper(direction, start, start.distanceTo(end), 0xff6600, 2, 1);
        arrowHelper.userData.isPath = true;
        sceneRef.current?.add(arrowHelper);
      }
    });
  }, [playerPaths]);

  // Animation loop for sequence playback
  useEffect(() => {
    if (!isPlaying) return;

    const startTime = Date.now();
    const initialTime = currentTime;

    const animate = () => {
      const elapsed = (Date.now() - startTime) / 1000 * playbackSpeed;
      const newTime = initialTime + elapsed;

      if (newTime >= sequence.duration) {
        setCurrentTime(sequence.duration);
        setIsPlaying(false);
        return;
      }

      setCurrentTime(newTime);

      // Update player positions
      playersRef.current.forEach((mesh, playerId) => {
        const pos = getPlayerPositionAtTime(playerId, newTime);
        mesh.position.x = pos.x;
        mesh.position.z = pos.z;
      });

      // Update ball position
      if (ballRef.current) {
        const ballPos = getBallPositionAtTime(newTime);
        ballRef.current.position.x = ballPos.x;
        ballRef.current.position.z = ballPos.z;
      }

      // Auto-follow camera
      if (ballRef.current && cameraRef.current) {
        const targetZ = ballRef.current.position.z + 30;
        cameraRef.current.position.z += (targetZ - cameraRef.current.position.z) * 0.05;
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, currentTime, playbackSpeed, sequence]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleSavePlan = () => {
    setShowSaveDialog(true);
  };

  const handleSaveConfirm = async () => {
    if (!planName.trim()) {
      toast.error('Please enter a plan name');
      return;
    }

    try {
      const playerPositions = Array.from(playersRef.current.entries()).map(([id, mesh]) => ({
        playerId: id,
        x: mesh.position.x,
        z: mesh.position.z
      }));

      const pathsObject: Record<string, Array<{x: number, z: number}>> = {};
      playerPaths.forEach((path, playerId) => {
        pathsObject[playerId.toString()] = path;
      });

      await savePlanMutation.mutateAsync({
        name: planName,
        formation: selectedFormation,
        attackPattern: selectedPattern,
        playerPositions,
        playerPaths: Object.keys(pathsObject).length > 0 ? pathsObject : undefined,
        isPublic: false
      });

      toast.success('Tactical plan saved successfully!');
      setShowSaveDialog(false);
      setPlanName('');
      refetchPlans();
    } catch (error) {
      toast.error('Failed to save plan');
      console.error(error);
    }
  };

  const handleLoadPlan = (plan: any) => {
    // Load player positions
    plan.playerPositions.forEach((pos: any) => {
      const player = playersRef.current.get(pos.playerId);
      if (player) {
        player.position.set(pos.x, 0.5, pos.z);
      }
    });

    // Load player paths
    if (plan.playerPaths) {
      const newPaths = new Map();
      Object.entries(plan.playerPaths).forEach(([playerId, path]) => {
        newPaths.set(parseInt(playerId), path as Array<{x: number, z: number}>);
      });
      setPlayerPaths(newPaths);
    }

    // Load formation and pattern
    if (plan.formation) setSelectedFormation(plan.formation);
    if (plan.attackPattern) setSelectedPattern(plan.attackPattern);

    setShowLoadDialog(false);
    toast.success(`Loaded plan: ${plan.name}`);
  };

  const handleDeletePlan = async (planId: number) => {
    try {
      await deletePlanMutation.mutateAsync({ planId });
      toast.success('Plan deleted');
      refetchPlans();
    } catch (error) {
      toast.error('Failed to delete plan');
    }
  };

  const handleRestart = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    
    // Reset positions
    playersRef.current.forEach((mesh, playerId) => {
      const pos = getPlayerPositionAtTime(playerId, 0);
      mesh.position.x = pos.x;
      mesh.position.z = pos.z;
    });

    if (ballRef.current) {
      const ballPos = getBallPositionAtTime(0);
      ballRef.current.position.x = ballPos.x;
      ballRef.current.position.z = ballPos.z;
    }
  };

  const handleTimelineChange = (value: number[]) => {
    const newTime = value[0];
    setCurrentTime(newTime);
    setIsPlaying(false);

    // Update positions
    playersRef.current.forEach((mesh, playerId) => {
      const pos = getPlayerPositionAtTime(playerId, newTime);
      mesh.position.x = pos.x;
      mesh.position.z = pos.z;
    });

    if (ballRef.current) {
      const ballPos = getBallPositionAtTime(newTime);
      ballRef.current.position.x = ballPos.x;
      ballRef.current.position.z = ballPos.z;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Attack Sequence Animator</h1>
        <p className="text-muted-foreground">
          مشاهدة هجمة كاملة بتحركات جميع اللاعبين من الدفاع للهجوم
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="p-4">
            <h2 className="text-xl font-semibold mb-4">{sequence.name}</h2>
            <div
              ref={mountRef}
              className="w-full h-[600px] bg-sky-200 rounded-lg overflow-hidden"
            />
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">Playback Controls</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Transition Mode / نوع الانتقال
                </label>
                <div className="flex gap-2 mb-4">
                  <Button
                    onClick={() => setShowDefensiveTransition(false)}
                    variant={!showDefensiveTransition ? 'default' : 'outline'}
                    className="flex-1"
                  >
                    Attack
                  </Button>
                  <Button
                    onClick={() => setShowDefensiveTransition(true)}
                    variant={showDefensiveTransition ? 'default' : 'outline'}
                    className="flex-1"
                  >
                    Defense
                  </Button>
                </div>
              </div>

              {!showDefensiveTransition && (
                <div>
                  <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Attack Pattern / الخطة الهجومية
                  </label>
                  <Select value={selectedPattern} onValueChange={(value) => {
                    setSelectedPattern(value);
                    setCurrentTime(0);
                    setIsPlaying(false);
                  }}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="z-[10001]">
                      <SelectItem value="counter_attack">Counter Attack</SelectItem>
                      <SelectItem value="central_buildup">Central Build-up</SelectItem>
                      <SelectItem value="high_press">High Press Recovery</SelectItem>
                      <SelectItem value="wing_attack">Wing Attack</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {showDefensiveTransition && (
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Recovery Speed / سرعة العودة
                  </label>
                  <Slider
                    value={[recoverySpeed]}
                    onValueChange={(v) => setRecoverySpeed(v[0])}
                    min={0.5}
                    max={2}
                    step={0.1}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {recoverySpeed.toFixed(1)}x speed
                  </p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Formation / التشكيل
                </label>
                <Select value={selectedFormation} onValueChange={setSelectedFormation}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[10001]">
                    <SelectItem value="4-4-2">4-4-2</SelectItem>
                    <SelectItem value="4-3-2-1">4-3-2-1 (Christmas Tree)</SelectItem>
                    <SelectItem value="4-2-3-1">4-2-3-1</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handlePlayPause}
                  className="flex-1"
                  variant={isPlaying ? 'destructive' : 'default'}
                >
                  {isPlaying ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                  {isPlaying ? 'Pause' : 'Play'}
                </Button>
                <Button onClick={handleRestart} variant="outline">
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>

              <div className="border-t pt-4">
                <label className="text-sm font-medium mb-2 block">
                  Player Tools / أدوات اللاعب
                </label>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setIsDrawingPath(!isDrawingPath)}
                    variant={isDrawingPath ? 'default' : 'outline'}
                    className="flex-1"
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    {isDrawingPath ? 'Stop Drawing' : 'Draw Path'}
                  </Button>
                  <Button
                    onClick={() => setPlayerPaths(new Map())}
                    variant="outline"
                    disabled={playerPaths.size === 0}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                {selectedPlayer !== null && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Selected Player: #{selectedPlayer}
                  </p>
                )}
              </div>

              <div className="border-t pt-4">
                <label className="text-sm font-medium mb-2 block">
                  Squad Management / إدارة الفريق
                </label>
                <Button
                  onClick={() => setShowSubstitutionDialog(true)}
                  variant="outline"
                  className="w-full"
                >
                  <Users className="mr-2 h-4 w-4" />
                  Assign Players / تعيين اللاعبين
                </Button>
              </div>

              <div className="border-t pt-4">
                <label className="text-sm font-medium mb-2 block">
                  Tactical Plans / الخطط التكتيكية
                </label>
                <div className="flex gap-2">
                  <Button
                    onClick={handleSavePlan}
                    variant="default"
                    className="flex-1"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Save Plan
                  </Button>
                  <Button
                    onClick={() => setShowLoadDialog(true)}
                    variant="outline"
                    className="flex-1"
                  >
                    <FolderOpen className="mr-2 h-4 w-4" />
                    Load
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Timeline: {currentTime.toFixed(1)}s / {sequence.duration}s
                </label>
                <Slider
                  value={[currentTime]}
                  onValueChange={handleTimelineChange}
                  max={sequence.duration}
                  step={0.1}
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block flex items-center gap-2">
                  <FastForward className="h-4 w-4" />
                  Speed: {playbackSpeed}x
                </label>
                <Slider
                  value={[playbackSpeed]}
                  onValueChange={(v) => setPlaybackSpeed(v[0])}
                  min={0.25}
                  max={2}
                  step={0.25}
                  className="w-full"
                />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="text-lg font-semibold mb-4">Sequence Phases</h3>
            <div className="space-y-2 text-sm">
              <div className={currentTime < 2 ? 'font-bold text-primary' : ''}>
                <span className="text-muted-foreground">0-2s:</span> Ball Recovery
              </div>
              <div className={currentTime >= 2 && currentTime < 5 ? 'font-bold text-primary' : ''}>
                <span className="text-muted-foreground">2-5s:</span> Build-up Play
              </div>
              <div className={currentTime >= 5 && currentTime < 8 ? 'font-bold text-primary' : ''}>
                <span className="text-muted-foreground">5-8s:</span> Wing Attack
              </div>
              <div className={currentTime >= 8 ? 'font-bold text-primary' : ''}>
                <span className="text-muted-foreground">8-12s:</span> Final Third & Shot
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-blue-50 border-blue-200">
            <h3 className="text-lg font-semibold mb-2">How to Use</h3>
            <ul className="text-sm space-y-1 list-disc list-inside">
              <li>Press Play to watch the full attack</li>
              <li>Drag timeline to jump to any moment</li>
              <li>Adjust speed for detailed analysis</li>
              <li>Camera follows the ball automatically</li>
              <li>Use mouse to rotate and zoom the view</li>
            </ul>
          </Card>
        </div>
      </div>

      {/* Save Plan Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Tactical Plan</DialogTitle>
            <DialogDescription>
              Save the current formation, player positions, and paths
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="plan-name">Plan Name</Label>
              <Input
                id="plan-name"
                placeholder="e.g., Wing Attack vs 4-4-2"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveConfirm}>
              Save Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Load Plan Dialog */}
      <Dialog open={showLoadDialog} onOpenChange={setShowLoadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Load Tactical Plan</DialogTitle>
            <DialogDescription>
              Select a saved plan to load
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4 max-h-96 overflow-y-auto">
            {savedPlans && savedPlans.length > 0 ? (
              savedPlans.map((plan: any) => (
                <div key={plan.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div className="flex-1">
                    <h4 className="font-medium">{plan.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {plan.formation} • {plan.attackPattern || 'Custom'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(plan.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleLoadPlan(plan)}
                    >
                      Load
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeletePlan(plan.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No saved plans yet. Create and save your first tactical plan!
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLoadDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Player Assignment Dialog */}
      <Dialog open={showSubstitutionDialog} onOpenChange={setShowSubstitutionDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Assign Players to Formation / تعيين اللاعبين للتشكيل</DialogTitle>
            <DialogDescription>
              Click on a position to assign a real player from your squad
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            {/* Formation Positions */}
            <div>
              <h4 className="font-medium mb-3">Formation Positions</h4>
              <div className="space-y-2">
                {(FORMATIONS[selectedFormation] || FORMATIONS['4-4-2']).map((pos) => {
                  const assignedPlayer = playerAssignments.get(pos.id);
                  return (
                    <div
                      key={pos.id}
                      className={`p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                        selectedPlayerForSub === pos.id ? 'border-blue-500 bg-blue-50' : ''
                      }`}
                      onClick={() => setSelectedPlayerForSub(pos.id)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-medium">Position {pos.id} - {pos.label}</span>
                          {assignedPlayer && (
                            <p className="text-sm text-muted-foreground">
                              {assignedPlayer.firstName} {assignedPlayer.lastName} (#{assignedPlayer.jerseyNumber})
                            </p>
                          )}
                        </div>
                        {assignedPlayer && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              const newAssignments = new Map(playerAssignments);
                              newAssignments.delete(pos.id);
                              setPlayerAssignments(newAssignments);
                            }}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Available Players */}
            <div>
              <h4 className="font-medium mb-3">Available Players</h4>
              {selectedPlayerForSub && (
                <p className="text-sm text-muted-foreground mb-3">
                  Select a player for Position {selectedPlayerForSub}
                </p>
              )}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {allPlayers && allPlayers.length > 0 ? (
                  allPlayers.map((player: any) => (
                    <div
                      key={player.id}
                      className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                      onClick={() => {
                        if (selectedPlayerForSub) {
                          const newAssignments = new Map(playerAssignments);
                          newAssignments.set(selectedPlayerForSub, player);
                          setPlayerAssignments(newAssignments);
                          setSelectedPlayerForSub(null);
                        }
                      }}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">
                            {player.firstName} {player.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            #{player.jerseyNumber} • {player.position} • {player.ageGroup || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No players available. Add players to your squad first.
                  </p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowSubstitutionDialog(false);
              setSelectedPlayerForSub(null);
            }}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
