import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Move, 
  Pencil, 
  Circle, 
  Square,
  ArrowRight,
  Trash2,
  Save,
  Play,
  Pause,
  Upload
} from 'lucide-react';
import { toast } from 'sonner';

// Player position type
interface PlayerPosition {
  id: number;
  name: string;
  number: number;
  team: 'home' | 'away';
  x: number; // -52.5 to 52.5 (meters)
  y: number; // -34 to 34 (meters)
  z: number; // height
}

// Keyframe for player positions at a specific time
interface PositionKeyframe {
  timestamp: number; // seconds
  positions: PlayerPosition[];
}

// Trail point for movement visualization
interface TrailPoint {
  x: number;
  y: number;
  z: number;
  timestamp: number;
}

// Player trail history
interface PlayerTrail {
  playerId: number;
  points: TrailPoint[];
  line: THREE.Line | null;
}

// Event marker for timeline
interface EventMarker {
  id: number;
  timestamp: number;
  type: 'goal' | 'foul' | 'substitution' | 'tactical_change' | 'highlight';
  title: string;
  description?: string;
  playerIds?: number[];
}

// Drawing annotation
interface DrawingAnnotation {
  id: number;
  type: 'arrow' | 'circle' | 'freehand';
  points: THREE.Vector3[];
  object: THREE.Object3D | null;
  color: string;
}

// Player detailed stats
interface PlayerStats {
  playerId: number;
  number: number;
  name: string;
  position: string;
  distanceCovered: number; // km
  topSpeed: number; // km/h
  averageSpeed: number; // km/h
  touches: number;
  passes: number;
  passAccuracy: number; // percentage
  tackles: number;
  interceptions: number;
}

// Sample player stats
const PLAYER_STATS: Record<number, PlayerStats> = {
  7: {
    playerId: 7,
    number: 7,
    name: 'Ahmed Hassan',
    position: 'Right Midfielder',
    distanceCovered: 10.2,
    topSpeed: 32.5,
    averageSpeed: 7.8,
    touches: 68,
    passes: 45,
    passAccuracy: 87,
    tackles: 3,
    interceptions: 2,
  },
  9: {
    playerId: 9,
    number: 9,
    name: 'Mohamed Ali',
    position: 'Striker',
    distanceCovered: 9.8,
    topSpeed: 34.2,
    averageSpeed: 8.1,
    touches: 52,
    passes: 28,
    passAccuracy: 75,
    tackles: 1,
    interceptions: 0,
  },
};

// Sample event markers
const SAMPLE_EVENTS: EventMarker[] = [
  { id: 1, timestamp: 3, type: 'tactical_change', title: 'Press Initiated', description: 'High press formation', playerIds: [6, 7, 8, 9] },
  { id: 2, timestamp: 8, type: 'highlight', title: 'Key Pass', description: 'Through ball to striker', playerIds: [7, 10] },
  { id: 3, timestamp: 12, type: 'goal', title: 'GOAL!', description: 'Team scores', playerIds: [10] },
];

// Sample movement data (simulated match scenario)
const SAMPLE_MOVEMENT_DATA: PositionKeyframe[] = [
  {
    timestamp: 0,
    positions: [
      // Home team in 4-4-2 formation
      { id: 1, name: 'GK', number: 1, team: 'home', x: -45, y: 0, z: 0 },
      { id: 2, name: 'LB', number: 2, team: 'home', x: -30, y: -20, z: 0 },
      { id: 3, name: 'CB', number: 3, team: 'home', x: -30, y: -7, z: 0 },
      { id: 4, name: 'CB', number: 4, team: 'home', x: -30, y: 7, z: 0 },
      { id: 5, name: 'RB', number: 5, team: 'home', x: -30, y: 20, z: 0 },
      { id: 6, name: 'LM', number: 6, team: 'home', x: -10, y: -15, z: 0 },
      { id: 7, name: 'CM', number: 7, team: 'home', x: -10, y: -5, z: 0 },
      { id: 8, name: 'CM', number: 8, team: 'home', x: -10, y: 5, z: 0 },
      { id: 9, name: 'RM', number: 9, team: 'home', x: -10, y: 15, z: 0 },
      { id: 10, name: 'ST', number: 10, team: 'home', x: 20, y: -10, z: 0 },
      { id: 11, name: 'ST', number: 11, team: 'home', x: 20, y: 10, z: 0 },
    ]
  },
  {
    timestamp: 5,
    positions: [
      // Attack building up - midfielders push forward
      { id: 1, name: 'GK', number: 1, team: 'home', x: -45, y: 0, z: 0 },
      { id: 2, name: 'LB', number: 2, team: 'home', x: -25, y: -22, z: 0 },
      { id: 3, name: 'CB', number: 3, team: 'home', x: -28, y: -7, z: 0 },
      { id: 4, name: 'CB', number: 4, team: 'home', x: -28, y: 7, z: 0 },
      { id: 5, name: 'RB', number: 5, team: 'home', x: -25, y: 22, z: 0 },
      { id: 6, name: 'LM', number: 6, team: 'home', x: 5, y: -20, z: 0 },
      { id: 7, name: 'CM', number: 7, team: 'home', x: 0, y: -5, z: 0 },
      { id: 8, name: 'CM', number: 8, team: 'home', x: 0, y: 5, z: 0 },
      { id: 9, name: 'RM', number: 9, team: 'home', x: 5, y: 20, z: 0 },
      { id: 10, name: 'ST', number: 10, team: 'home', x: 30, y: -12, z: 0 },
      { id: 11, name: 'ST', number: 11, team: 'home', x: 30, y: 12, z: 0 },
    ]
  },
  {
    timestamp: 10,
    positions: [
      // Final third - attacking positions
      { id: 1, name: 'GK', number: 1, team: 'home', x: -45, y: 0, z: 0 },
      { id: 2, name: 'LB', number: 2, team: 'home', x: -20, y: -25, z: 0 },
      { id: 3, name: 'CB', number: 3, team: 'home', x: -25, y: -7, z: 0 },
      { id: 4, name: 'CB', number: 4, team: 'home', x: -25, y: 7, z: 0 },
      { id: 5, name: 'RB', number: 5, team: 'home', x: -20, y: 25, z: 0 },
      { id: 6, name: 'LM', number: 6, team: 'home', x: 15, y: -25, z: 0 },
      { id: 7, name: 'CM', number: 7, team: 'home', x: 10, y: -8, z: 0 },
      { id: 8, name: 'CM', number: 8, team: 'home', x: 10, y: 8, z: 0 },
      { id: 9, name: 'RM', number: 9, team: 'home', x: 15, y: 25, z: 0 },
      { id: 10, name: 'ST', number: 10, team: 'home', x: 40, y: -15, z: 0 },
      { id: 11, name: 'ST', number: 11, team: 'home', x: 40, y: 15, z: 0 },
    ]
  },
  {
    timestamp: 15,
    positions: [
      // Return to defensive shape
      { id: 1, name: 'GK', number: 1, team: 'home', x: -45, y: 0, z: 0 },
      { id: 2, name: 'LB', number: 2, team: 'home', x: -30, y: -20, z: 0 },
      { id: 3, name: 'CB', number: 3, team: 'home', x: -30, y: -7, z: 0 },
      { id: 4, name: 'CB', number: 4, team: 'home', x: -30, y: 7, z: 0 },
      { id: 5, name: 'RB', number: 5, team: 'home', x: -30, y: 20, z: 0 },
      { id: 6, name: 'LM', number: 6, team: 'home', x: -10, y: -15, z: 0 },
      { id: 7, name: 'CM', number: 7, team: 'home', x: -10, y: -5, z: 0 },
      { id: 8, name: 'CM', number: 8, team: 'home', x: -10, y: 5, z: 0 },
      { id: 9, name: 'RM', number: 9, team: 'home', x: -10, y: 15, z: 0 },
      { id: 10, name: 'ST', number: 10, team: 'home', x: 20, y: -10, z: 0 },
      { id: 11, name: 'ST', number: 11, team: 'home', x: 20, y: 10, z: 0 },
    ]
  }
];

// Formation presets
const FORMATIONS = {
  '4-4-2': [
    // Goalkeeper
    { x: -45, y: 0 },
    // Defenders
    { x: -30, y: -20 }, { x: -30, y: -7 }, { x: -30, y: 7 }, { x: -30, y: 20 },
    // Midfielders
    { x: -10, y: -15 }, { x: -10, y: -5 }, { x: -10, y: 5 }, { x: -10, y: 15 },
    // Forwards
    { x: 20, y: -10 }, { x: 20, y: 10 }
  ],
  '4-3-3': [
    // Goalkeeper
    { x: -45, y: 0 },
    // Defenders
    { x: -30, y: -20 }, { x: -30, y: -7 }, { x: -30, y: 7 }, { x: -30, y: 20 },
    // Midfielders
    { x: -10, y: -12 }, { x: -10, y: 0 }, { x: -10, y: 12 },
    // Forwards
    { x: 25, y: -18 }, { x: 25, y: 0 }, { x: 25, y: 18 }
  ],
  '3-5-2': [
    // Goalkeeper
    { x: -45, y: 0 },
    // Defenders
    { x: -30, y: -15 }, { x: -30, y: 0 }, { x: -30, y: 15 },
    // Midfielders
    { x: -10, y: -20 }, { x: -10, y: -10 }, { x: -10, y: 0 }, { x: -10, y: 10 }, { x: -10, y: 20 },
    // Forwards
    { x: 20, y: -10 }, { x: 20, y: 10 }
  ]
};

export default function MatchReview3D() {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const playerMarkersRef = useRef<THREE.Mesh[]>([]);
  
  const [formation, setFormation] = useState<keyof typeof FORMATIONS>('4-4-2');
  const [cameraAngle, setCameraAngle] = useState<'top' | 'side' | 'corner'>('corner');
  const [showGrid, setShowGrid] = useState(true);
  const [selectedTool, setSelectedTool] = useState<'move' | 'arrow' | 'circle' | 'square' | 'pencil'>('move');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [duration, setDuration] = useState(15); // Total duration in seconds
  const [showVideo, setShowVideo] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const playerTrailsRef = useRef<PlayerTrail[]>([]);
  
  const [showTrails, setShowTrails] = useState(true);
  const [trailLength, setTrailLength] = useState(5); // seconds of trail history
  const [events, setEvents] = useState<EventMarker[]>(SAMPLE_EVENTS);
  const [showEvents, setShowEvents] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Drawing and player selection state
  const [annotations, setAnnotations] = useState<DrawingAnnotation[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingPoints, setDrawingPoints] = useState<THREE.Vector3[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null);
  const [comparisonPlayer, setComparisonPlayer] = useState<number | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const raycasterRef = useRef(new THREE.Raycaster());
  const mouseRef = useRef(new THREE.Vector2());
  
  // Initialize Three.js scene
  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Sky blue
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      60,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 80, 80);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 30;
    controls.maxDistance = 200;
    controls.maxPolarAngle = Math.PI / 2.1;
    controlsRef.current = controls;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(50, 100, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.left = -60;
    directionalLight.shadow.camera.right = 60;
    directionalLight.shadow.camera.top = 60;
    directionalLight.shadow.camera.bottom = -60;
    scene.add(directionalLight);

    // Create football pitch
    createFootballPitch(scene);

    // Add players
    createPlayers(scene, formation);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Handle window resize
    const handleResize = () => {
      if (!mountRef.current || !camera || !renderer) return;
      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      mountRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  // Update players when formation changes
  useEffect(() => {
    if (!sceneRef.current) return;
    
    // Remove old player markers
    playerMarkersRef.current.forEach(marker => {
      sceneRef.current?.remove(marker);
    });
    playerMarkersRef.current = [];

    // Add new players
    createPlayers(sceneRef.current, formation);
  }, [formation]);

  // Create football pitch
  const createFootballPitch = (scene: THREE.Scene) => {
    // Pitch dimensions (standard: 105m x 68m)
    const pitchLength = 105;
    const pitchWidth = 68;

    // Grass field
    const grassGeometry = new THREE.PlaneGeometry(pitchLength, pitchWidth);
    const grassMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x2d5016,
      roughness: 0.8
    });
    const grass = new THREE.Mesh(grassGeometry, grassMaterial);
    grass.rotation.x = -Math.PI / 2;
    grass.receiveShadow = true;
    grass.name = 'pitch'; // For raycasting
    scene.add(grass);

    // White lines material
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 });

    // Outer boundary
    const boundaryPoints = [
      new THREE.Vector3(-pitchLength/2, 0.1, -pitchWidth/2),
      new THREE.Vector3(pitchLength/2, 0.1, -pitchWidth/2),
      new THREE.Vector3(pitchLength/2, 0.1, pitchWidth/2),
      new THREE.Vector3(-pitchLength/2, 0.1, pitchWidth/2),
      new THREE.Vector3(-pitchLength/2, 0.1, -pitchWidth/2),
    ];
    const boundaryGeometry = new THREE.BufferGeometry().setFromPoints(boundaryPoints);
    const boundary = new THREE.Line(boundaryGeometry, lineMaterial);
    scene.add(boundary);

    // Center line
    const centerLinePoints = [
      new THREE.Vector3(0, 0.1, -pitchWidth/2),
      new THREE.Vector3(0, 0.1, pitchWidth/2),
    ];
    const centerLineGeometry = new THREE.BufferGeometry().setFromPoints(centerLinePoints);
    const centerLine = new THREE.Line(centerLineGeometry, lineMaterial);
    scene.add(centerLine);

    // Center circle
    const centerCircleGeometry = new THREE.CircleGeometry(9.15, 64);
    const centerCircleEdges = new THREE.EdgesGeometry(centerCircleGeometry);
    const centerCircle = new THREE.LineSegments(centerCircleEdges, lineMaterial);
    centerCircle.rotation.x = -Math.PI / 2;
    centerCircle.position.y = 0.1;
    scene.add(centerCircle);

    // Penalty areas
    [-1, 1].forEach(side => {
      const penaltyBoxPoints = [
        new THREE.Vector3(side * pitchLength/2, 0.1, -20.16),
        new THREE.Vector3(side * (pitchLength/2 - 16.5), 0.1, -20.16),
        new THREE.Vector3(side * (pitchLength/2 - 16.5), 0.1, 20.16),
        new THREE.Vector3(side * pitchLength/2, 0.1, 20.16),
      ];
      const penaltyBoxGeometry = new THREE.BufferGeometry().setFromPoints(penaltyBoxPoints);
      const penaltyBox = new THREE.Line(penaltyBoxGeometry, lineMaterial);
      scene.add(penaltyBox);

      // Goal areas
      const goalBoxPoints = [
        new THREE.Vector3(side * pitchLength/2, 0.1, -9.16),
        new THREE.Vector3(side * (pitchLength/2 - 5.5), 0.1, -9.16),
        new THREE.Vector3(side * (pitchLength/2 - 5.5), 0.1, 9.16),
        new THREE.Vector3(side * pitchLength/2, 0.1, 9.16),
      ];
      const goalBoxGeometry = new THREE.BufferGeometry().setFromPoints(goalBoxPoints);
      const goalBox = new THREE.Line(goalBoxGeometry, lineMaterial);
      scene.add(goalBox);

      // Goals
      const goalGeometry = new THREE.BoxGeometry(2.44, 2.44, 7.32);
      const goalMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xffffff,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide
      });
      const goal = new THREE.Mesh(goalGeometry, goalMaterial);
      goal.position.set(side * (pitchLength/2 + 1.22), 1.22, 0);
      scene.add(goal);
    });
  };

  // Create player markers
  const createPlayers = (scene: THREE.Scene, formationType: keyof typeof FORMATIONS) => {
    const positions = FORMATIONS[formationType];
    
    positions.forEach((pos, index) => {
      // Player marker (cylinder)
      const geometry = new THREE.CylinderGeometry(1.5, 1.5, 3, 32);
      const material = new THREE.MeshStandardMaterial({ 
        color: 0x0066cc,
        metalness: 0.3,
        roughness: 0.7
      });
      const player = new THREE.Mesh(geometry, material);
      player.position.set(pos.x, 1.5, pos.y);
      player.castShadow = true;
      scene.add(player);
      playerMarkersRef.current.push(player);

      // Jersey number
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = 'white';
      ctx.font = 'bold 80px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText((index + 1).toString(), 64, 64);

      const texture = new THREE.CanvasTexture(canvas);
      const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
      const sprite = new THREE.Sprite(spriteMaterial);
      sprite.scale.set(3, 3, 1);
      sprite.position.set(pos.x, 5, pos.y);
      scene.add(sprite);
      playerMarkersRef.current.push(sprite as any);
    });
  };

  // Camera angle presets
  const setCameraView = (angle: 'top' | 'side' | 'corner') => {
    if (!cameraRef.current || !controlsRef.current) return;
    
    const camera = cameraRef.current;
    const controls = controlsRef.current;

    switch (angle) {
      case 'top':
        camera.position.set(0, 120, 0);
        controls.target.set(0, 0, 0);
        break;
      case 'side':
        camera.position.set(0, 40, 100);
        controls.target.set(0, 0, 0);
        break;
      case 'corner':
        camera.position.set(60, 80, 80);
        controls.target.set(0, 0, 0);
        break;
    }
    
    controls.update();
    setCameraAngle(angle);
  };

  const resetCamera = () => {
    setCameraView('corner');
    toast.success('Camera reset');
  };

  // Interpolate between two keyframes
  const interpolatePositions = (time: number): PlayerPosition[] => {
    // Find surrounding keyframes
    let prevKeyframe = SAMPLE_MOVEMENT_DATA[0];
    let nextKeyframe = SAMPLE_MOVEMENT_DATA[SAMPLE_MOVEMENT_DATA.length - 1];
    
    for (let i = 0; i < SAMPLE_MOVEMENT_DATA.length - 1; i++) {
      if (time >= SAMPLE_MOVEMENT_DATA[i].timestamp && time <= SAMPLE_MOVEMENT_DATA[i + 1].timestamp) {
        prevKeyframe = SAMPLE_MOVEMENT_DATA[i];
        nextKeyframe = SAMPLE_MOVEMENT_DATA[i + 1];
        break;
      }
    }
    
    // Calculate interpolation factor
    const timeDiff = nextKeyframe.timestamp - prevKeyframe.timestamp;
    const t = timeDiff > 0 ? (time - prevKeyframe.timestamp) / timeDiff : 0;
    
    // Interpolate each player's position
    return prevKeyframe.positions.map((prevPos, index) => {
      const nextPos = nextKeyframe.positions[index];
      return {
        ...prevPos,
        x: prevPos.x + (nextPos.x - prevPos.x) * t,
        y: prevPos.y + (nextPos.y - prevPos.y) * t,
        z: prevPos.z + (nextPos.z - prevPos.z) * t,
      };
    });
  };

  // Update player positions based on current time
  const updatePlayerPositions = (time: number) => {
    const positions = interpolatePositions(time);
    
    positions.forEach((pos, index) => {
      if (playerMarkersRef.current[index]) {
        playerMarkersRef.current[index].position.set(pos.x, 1.5, pos.y);
        
        // Update trail history
        if (showTrails) {
          updatePlayerTrail(pos.id, pos.x, pos.y, pos.z, time);
        }
      }
    });
  };

  // Update trail for a single player
  const updatePlayerTrail = (playerId: number, x: number, y: number, z: number, time: number) => {
    if (!sceneRef.current) return;
    
    // Find or create trail for this player
    let trail = playerTrailsRef.current.find(t => t.playerId === playerId);
    if (!trail) {
      trail = { playerId, points: [], line: null };
      playerTrailsRef.current.push(trail);
    }
    
    // Add new point
    trail.points.push({ x, y, z, timestamp: time });
    
    // Remove old points outside trail length window
    trail.points = trail.points.filter(p => time - p.timestamp <= trailLength);
    
    // Update or create line
    if (trail.points.length > 1) {
      // Remove old line
      if (trail.line) {
        sceneRef.current.remove(trail.line);
        trail.line.geometry.dispose();
        (trail.line.material as THREE.Material).dispose();
      }
      
      // Create new line geometry
      const points = trail.points.map(p => new THREE.Vector3(p.x, 0.5, p.y));
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      
      // Create gradient material (fade effect)
      const colors = new Float32Array(points.length * 3);
      for (let i = 0; i < points.length; i++) {
        const alpha = i / (points.length - 1); // 0 to 1
        colors[i * 3] = 0.2 + alpha * 0.6; // R
        colors[i * 3 + 1] = 0.4 + alpha * 0.4; // G
        colors[i * 3 + 2] = 1.0; // B (blue trail)
      }
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      
      const material = new THREE.LineBasicMaterial({ 
        vertexColors: true,
        linewidth: 2,
        transparent: true,
        opacity: 0.8
      });
      
      trail.line = new THREE.Line(geometry, material);
      sceneRef.current.add(trail.line);
    }
  };

  // Clear all trails
  const clearTrails = () => {
    if (!sceneRef.current) return;
    
    playerTrailsRef.current.forEach(trail => {
      if (trail.line) {
        sceneRef.current!.remove(trail.line);
        trail.line.geometry.dispose();
        (trail.line.material as THREE.Material).dispose();
      }
    });
    playerTrailsRef.current = [];
  };

  // Toggle trails visibility
  useEffect(() => {
    if (!showTrails) {
      clearTrails();
    }
  }, [showTrails]);

  // Animation loop
  useEffect(() => {
    if (!isPlaying) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    let lastTime = Date.now();
    
    const animate = () => {
      const now = Date.now();
      const delta = (now - lastTime) / 1000; // seconds
      lastTime = now;

      setCurrentTime(prev => {
        const newTime = prev + delta * playbackSpeed;
        if (newTime >= duration) {
          setIsPlaying(false);
          return duration;
        }
        return newTime;
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, playbackSpeed, duration]);

  // Update player positions when time changes
  useEffect(() => {
    updatePlayerPositions(currentTime);
    
    // Sync video if present
    if (videoRef.current && showVideo) {
      videoRef.current.currentTime = currentTime;
    }
  }, [currentTime]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    if (videoRef.current && showVideo) {
      if (!isPlaying) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  };

  const handleTimelineChange = (value: number[]) => {
    setCurrentTime(value[0]);
    setIsPlaying(false);
  };

  const handleSpeedChange = (value: number[]) => {
    setPlaybackSpeed(value[0]);
  };

  // Jump to event timestamp
  const jumpToEvent = (timestamp: number) => {
    setCurrentTime(timestamp);
    setIsPlaying(false);
    toast.success('Jumped to event');
  };

  // Import movement data from JSON/CSV
  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const data = JSON.parse(content);
        
        // Validate data structure
        if (Array.isArray(data) && data.length > 0 && data[0].timestamp !== undefined) {
          // Update movement data (in real app, would update SAMPLE_MOVEMENT_DATA)
          toast.success(`Imported ${data.length} keyframes`);
        } else {
          toast.error('Invalid data format');
        }
      } catch (error) {
        toast.error('Failed to parse file');
      }
    };
    reader.readAsText(file);
  };

  // Handle mouse click for player selection and drawing
  const handleCanvasClick = (event: MouseEvent) => {
    if (!mountRef.current || !cameraRef.current || !sceneRef.current) return;
    
    const rect = mountRef.current.getBoundingClientRect();
    mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
    
    // Check for player clicks
    const intersects = raycasterRef.current.intersectObjects(playerMarkersRef.current);
    if (intersects.length > 0 && selectedTool === 'move') {
      // Find which player was clicked
      const clickedMarker = intersects[0].object;
      const playerIndex = playerMarkersRef.current.indexOf(clickedMarker as THREE.Mesh);
      if (playerIndex !== -1) {
        const positions = interpolatePositions(currentTime);
        const player = positions[playerIndex];
        setSelectedPlayer(player.number);
        toast.success(`Selected Player #${player.number}`);
      }
    }
    
    // Handle drawing
    if (selectedTool !== 'move') {
      const planeIntersects = raycasterRef.current.intersectObject(sceneRef.current.getObjectByName('pitch') as THREE.Object3D);
      if (planeIntersects.length > 0) {
        const point = planeIntersects[0].point;
        handleDrawingClick(point);
      }
    }
  };

  // Handle drawing click
  const handleDrawingClick = (point: THREE.Vector3) => {
    if (selectedTool === 'arrow') {
      if (drawingPoints.length === 0) {
        setDrawingPoints([point]);
        setIsDrawing(true);
      } else {
        // Complete arrow
        const start = drawingPoints[0];
        const end = point;
        createArrowAnnotation(start, end);
        setDrawingPoints([]);
        setIsDrawing(false);
      }
    } else if (selectedTool === 'circle') {
      if (drawingPoints.length === 0) {
        setDrawingPoints([point]);
        setIsDrawing(true);
      } else {
        // Complete circle
        const center = drawingPoints[0];
        const radius = center.distanceTo(point);
        createCircleAnnotation(center, radius);
        setDrawingPoints([]);
        setIsDrawing(false);
      }
    } else if (selectedTool === 'pencil') {
      // Freehand drawing - add point to current path
      setDrawingPoints(prev => [...prev, point]);
      if (!isDrawing) {
        setIsDrawing(true);
      }
    }
  };
  
  // Handle mouse move for freehand drawing
  const handleCanvasMouseMove = (event: MouseEvent) => {
    if (!mountRef.current || !cameraRef.current || !sceneRef.current) return;
    if (selectedTool !== 'pencil' || !isDrawing) return;
    
    const rect = mountRef.current.getBoundingClientRect();
    mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
    const planeIntersects = raycasterRef.current.intersectObject(sceneRef.current.getObjectByName('pitch') as THREE.Object3D);
    
    if (planeIntersects.length > 0) {
      const point = planeIntersects[0].point;
      setDrawingPoints(prev => [...prev, point]);
    }
  };
  
  // Handle mouse up to complete freehand drawing
  const handleCanvasMouseUp = () => {
    if (selectedTool === 'pencil' && isDrawing && drawingPoints.length > 1) {
      createFreehandAnnotation(drawingPoints);
      setDrawingPoints([]);
      setIsDrawing(false);
    }
  };

  // Create arrow annotation
  const createArrowAnnotation = (start: THREE.Vector3, end: THREE.Vector3) => {
    if (!sceneRef.current) return;
    
    const direction = new THREE.Vector3().subVectors(end, start);
    const length = direction.length();
    direction.normalize();
    
    const arrow = new THREE.ArrowHelper(
      direction,
      start,
      length,
      0xff0000,
      length * 0.2,
      length * 0.15
    );
    arrow.line.position.y = 0.5;
    arrow.cone.position.y = 0.5;
    
    sceneRef.current.add(arrow);
    
    const annotation: DrawingAnnotation = {
      id: Date.now(),
      type: 'arrow',
      points: [start, end],
      object: arrow,
      color: '#ff0000',
    };
    
    setAnnotations(prev => [...prev, annotation]);
    toast.success('Arrow added');
  };

  // Create circle annotation
  const createCircleAnnotation = (center: THREE.Vector3, radius: number) => {
    if (!sceneRef.current) return;
    
    const geometry = new THREE.RingGeometry(radius - 0.5, radius, 32);
    const material = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.6,
    });
    
    const circle = new THREE.Mesh(geometry, material);
    circle.position.copy(center);
    circle.position.y = 0.2;
    circle.rotation.x = -Math.PI / 2;
    
    sceneRef.current.add(circle);
    
    const annotation: DrawingAnnotation = {
      id: Date.now(),
      type: 'circle',
      points: [center],
      object: circle,
      color: '#ffff00',
    };
    
    setAnnotations(prev => [...prev, annotation]);
    toast.success('Zone added');
  };

  // Create freehand annotation
  const createFreehandAnnotation = (points: THREE.Vector3[]) => {
    if (!sceneRef.current || points.length < 2) return;
    
    // Create smooth curve from points
    const curve = new THREE.CatmullRomCurve3(points);
    const curvePoints = curve.getPoints(points.length * 2);
    
    const geometry = new THREE.BufferGeometry().setFromPoints(curvePoints);
    const material = new THREE.LineBasicMaterial({
      color: 0x00ff00,
      linewidth: 3,
    });
    
    const line = new THREE.Line(geometry, material);
    line.position.y = 0.3;
    
    sceneRef.current.add(line);
    
    const annotation: DrawingAnnotation = {
      id: Date.now(),
      type: 'freehand',
      points: curvePoints,
      object: line,
      color: '#00ff00',
    };
    
    setAnnotations(prev => [...prev, annotation]);
    toast.success('Drawing added');
  };

  // Add event listeners for drawing
  useEffect(() => {
    const canvas = mountRef.current;
    if (!canvas) return;
    
    canvas.addEventListener('click', handleCanvasClick);
    canvas.addEventListener('mousemove', handleCanvasMouseMove);
    canvas.addEventListener('mouseup', handleCanvasMouseUp);
    
    return () => {
      canvas.removeEventListener('click', handleCanvasClick);
      canvas.removeEventListener('mousemove', handleCanvasMouseMove);
      canvas.removeEventListener('mouseup', handleCanvasMouseUp);
    };
  }, [selectedTool, drawingPoints, currentTime, isDrawing]);

  const handleSaveAnnotations = () => {
    toast.success(`Saved ${annotations.length} annotations`);
  };

  const handleClearAnnotations = () => {
    if (!sceneRef.current) return;
    
    // Remove all annotation objects from scene
    annotations.forEach(ann => {
      if (ann.object) {
        sceneRef.current!.remove(ann.object);
      }
    });
    
    setAnnotations([]);
    setDrawingPoints([]);
    setIsDrawing(false);
    toast.success('Annotations cleared');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-[1800px] mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-gray-900">3D Match Review</h1>
          <p className="text-gray-600 mt-2">Interactive tactical analysis and match review tools</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 3D Viewport */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>3D Pitch View</span>
                <div className="flex gap-2 items-center">
                  <Button
                    variant={isPlaying ? "default" : "outline"}
                    size="sm"
                    onClick={handlePlayPause}
                  >
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  <span className="text-sm text-gray-600">
                    {Math.floor(currentTime)}s / {duration}s
                  </span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div 
                ref={mountRef} 
                className="w-full h-[600px] bg-gray-900 rounded-lg"
              />
              
              {/* Optional Video Player */}
              {showVideo && (
                <div className="w-full">
                  <video
                    ref={videoRef}
                    className="w-full rounded-lg"
                    controls={false}
                    muted
                  >
                    <source src="/sample-match.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                  <p className="text-sm text-gray-500 mt-2 text-center">
                    Video playback synchronized with player movements
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Control Panel */}
          <div className="space-y-4">
            {/* Camera Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Camera</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant={cameraAngle === 'top' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCameraView('top')}
                  >
                    Top
                  </Button>
                  <Button
                    variant={cameraAngle === 'side' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCameraView('side')}
                  >
                    Side
                  </Button>
                  <Button
                    variant={cameraAngle === 'corner' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCameraView('corner')}
                  >
                    Corner
                  </Button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={resetCamera}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </CardContent>
            </Card>

            {/* Formation */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Formation</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={formation} onValueChange={(value: any) => setFormation(value)}>
                  <SelectTrigger className="z-[10001]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[10001]">
                    <SelectItem value="4-4-2">4-4-2</SelectItem>
                    <SelectItem value="4-3-3">4-3-3</SelectItem>
                    <SelectItem value="3-5-2">3-5-2</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Drawing Tools */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Drawing Tools</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={selectedTool === 'move' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedTool('move')}
                  >
                    <Move className="h-4 w-4 mr-1" />
                    Move
                  </Button>
                  <Button
                    variant={selectedTool === 'arrow' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedTool('arrow')}
                  >
                    <ArrowRight className="h-4 w-4 mr-1" />
                    Arrow
                  </Button>
                  <Button
                    variant={selectedTool === 'circle' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedTool('circle')}
                  >
                    <Circle className="h-4 w-4 mr-1" />
                    Zone
                  </Button>
                  <Button
                    variant={selectedTool === 'pencil' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedTool('pencil')}
                  >
                    <Pencil className="h-4 w-4 mr-1" />
                    Draw
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={handleSaveAnnotations}
                  >
                    <Save className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={handleClearAnnotations}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Timeline and Playback Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Playback</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Timeline Slider */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Timeline</label>
                  <Slider
                    value={[currentTime]}
                    onValueChange={handleTimelineChange}
                    max={duration}
                    step={0.1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>0:00</span>
                    <span>{Math.floor(currentTime / 60)}:{String(Math.floor(currentTime % 60)).padStart(2, '0')}</span>
                    <span>0:{String(duration).padStart(2, '0')}</span>
                  </div>
                </div>

                {/* Playback Speed */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Speed: {playbackSpeed}x</label>
                  <Slider
                    value={[playbackSpeed]}
                    onValueChange={handleSpeedChange}
                    min={0.25}
                    max={2}
                    step={0.25}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>0.25x</span>
                    <span>1x</span>
                    <span>2x</span>
                  </div>
                </div>

                {/* Trail Length */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Trail Length: {trailLength}s</label>
                  <Slider
                    value={[trailLength]}
                    onValueChange={(v) => setTrailLength(v[0])}
                    min={2}
                    max={10}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>2s</span>
                    <span>6s</span>
                    <span>10s</span>
                  </div>
                </div>

                {/* Control Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentTime(0)}
                  >
                    Reset
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowVideo(!showVideo)}
                  >
                    {showVideo ? 'Hide' : 'Show'} Video
                  </Button>
                  <Button
                    variant={showTrails ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setShowTrails(!showTrails)}
                  >
                    {showTrails ? 'Hide' : 'Show'} Trails
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearTrails}
                  >
                    Clear Trails
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Event Markers */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>Events</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowEvents(!showEvents)}
                  >
                    {showEvents ? 'Hide' : 'Show'}
                  </Button>
                </CardTitle>
              </CardHeader>
              {showEvents && (
                <CardContent className="space-y-2">
                  {events.map((event) => (
                    <button
                      key={event.id}
                      onClick={() => jumpToEvent(event.timestamp)}
                      className="w-full text-left p-2 rounded hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{event.title}</div>
                          <div className="text-xs text-gray-500">{event.description}</div>
                        </div>
                        <div className="text-xs text-gray-400">{event.timestamp}s</div>
                      </div>
                    </button>
                  ))}
                </CardContent>
              )}
            </Card>

            {/* Data Import */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Import Data</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,.csv"
                  onChange={handleImportData}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Import JSON/CSV
                </Button>
                <p className="text-xs text-gray-500">
                  Upload player position data from GPS tracking or video analysis software
                </p>
              </CardContent>
            </Card>

            {/* Player Information */}
            {selectedPlayer && PLAYER_STATS[selectedPlayer] && (
              <Card className="border-blue-500 border-2">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span>Player #{PLAYER_STATS[selectedPlayer].number}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedPlayer(null)}
                    >
                      ✕
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <h3 className="font-bold text-lg">{PLAYER_STATS[selectedPlayer].name}</h3>
                    <p className="text-sm text-gray-600">{PLAYER_STATS[selectedPlayer].position}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Distance Covered</span>
                      <span className="font-semibold">{PLAYER_STATS[selectedPlayer].distanceCovered} km</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Top Speed</span>
                      <span className="font-semibold">{PLAYER_STATS[selectedPlayer].topSpeed} km/h</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Avg Speed</span>
                      <span className="font-semibold">{PLAYER_STATS[selectedPlayer].averageSpeed} km/h</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Touches</span>
                      <span className="font-semibold">{PLAYER_STATS[selectedPlayer].touches}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Passes</span>
                      <span className="font-semibold">{PLAYER_STATS[selectedPlayer].passes}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Pass Accuracy</span>
                      <span className="font-semibold">{PLAYER_STATS[selectedPlayer].passAccuracy}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Tackles</span>
                      <span className="font-semibold">{PLAYER_STATS[selectedPlayer].tackles}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Interceptions</span>
                      <span className="font-semibold">{PLAYER_STATS[selectedPlayer].interceptions}</span>
                    </div>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setComparisonPlayer(selectedPlayer);
                      setShowComparison(true);
                      setSelectedPlayer(null);
                      toast.success('Select another player to compare');
                    }}
                  >
                    Compare with Another Player
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Player Comparison */}
            {showComparison && comparisonPlayer && PLAYER_STATS[comparisonPlayer] && (
              <Card className="border-purple-500 border-2">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span>Player Comparison</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowComparison(false);
                        setComparisonPlayer(null);
                        setSelectedPlayer(null);
                      }}
                    >
                      ✕
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedPlayer && PLAYER_STATS[selectedPlayer] ? (
                    <>
                      {/* Player Names */}
                      <div className="grid grid-cols-2 gap-2 text-center">
                        <div>
                          <div className="font-bold">#{PLAYER_STATS[comparisonPlayer].number}</div>
                          <div className="text-sm">{PLAYER_STATS[comparisonPlayer].name}</div>
                        </div>
                        <div>
                          <div className="font-bold">#{PLAYER_STATS[selectedPlayer].number}</div>
                          <div className="text-sm">{PLAYER_STATS[selectedPlayer].name}</div>
                        </div>
                      </div>
                      
                      {/* Comparison Stats */}
                      <div className="space-y-2">
                        {/* Distance */}
                        <div>
                          <div className="text-xs text-gray-500 text-center mb-1">Distance Covered (km)</div>
                          <div className="grid grid-cols-2 gap-2 text-center">
                            <div className={`font-semibold ${PLAYER_STATS[comparisonPlayer].distanceCovered > PLAYER_STATS[selectedPlayer].distanceCovered ? 'text-green-600' : ''}`}>
                              {PLAYER_STATS[comparisonPlayer].distanceCovered}
                            </div>
                            <div className={`font-semibold ${PLAYER_STATS[selectedPlayer].distanceCovered > PLAYER_STATS[comparisonPlayer].distanceCovered ? 'text-green-600' : ''}`}>
                              {PLAYER_STATS[selectedPlayer].distanceCovered}
                            </div>
                          </div>
                        </div>
                        
                        {/* Top Speed */}
                        <div>
                          <div className="text-xs text-gray-500 text-center mb-1">Top Speed (km/h)</div>
                          <div className="grid grid-cols-2 gap-2 text-center">
                            <div className={`font-semibold ${PLAYER_STATS[comparisonPlayer].topSpeed > PLAYER_STATS[selectedPlayer].topSpeed ? 'text-green-600' : ''}`}>
                              {PLAYER_STATS[comparisonPlayer].topSpeed}
                            </div>
                            <div className={`font-semibold ${PLAYER_STATS[selectedPlayer].topSpeed > PLAYER_STATS[comparisonPlayer].topSpeed ? 'text-green-600' : ''}`}>
                              {PLAYER_STATS[selectedPlayer].topSpeed}
                            </div>
                          </div>
                        </div>
                        
                        {/* Touches */}
                        <div>
                          <div className="text-xs text-gray-500 text-center mb-1">Touches</div>
                          <div className="grid grid-cols-2 gap-2 text-center">
                            <div className={`font-semibold ${PLAYER_STATS[comparisonPlayer].touches > PLAYER_STATS[selectedPlayer].touches ? 'text-green-600' : ''}`}>
                              {PLAYER_STATS[comparisonPlayer].touches}
                            </div>
                            <div className={`font-semibold ${PLAYER_STATS[selectedPlayer].touches > PLAYER_STATS[comparisonPlayer].touches ? 'text-green-600' : ''}`}>
                              {PLAYER_STATS[selectedPlayer].touches}
                            </div>
                          </div>
                        </div>
                        
                        {/* Pass Accuracy */}
                        <div>
                          <div className="text-xs text-gray-500 text-center mb-1">Pass Accuracy (%)</div>
                          <div className="grid grid-cols-2 gap-2 text-center">
                            <div className={`font-semibold ${PLAYER_STATS[comparisonPlayer].passAccuracy > PLAYER_STATS[selectedPlayer].passAccuracy ? 'text-green-600' : ''}`}>
                              {PLAYER_STATS[comparisonPlayer].passAccuracy}
                            </div>
                            <div className={`font-semibold ${PLAYER_STATS[selectedPlayer].passAccuracy > PLAYER_STATS[comparisonPlayer].passAccuracy ? 'text-green-600' : ''}`}>
                              {PLAYER_STATS[selectedPlayer].passAccuracy}
                            </div>
                          </div>
                        </div>
                        
                        {/* Tackles */}
                        <div>
                          <div className="text-xs text-gray-500 text-center mb-1">Tackles</div>
                          <div className="grid grid-cols-2 gap-2 text-center">
                            <div className={`font-semibold ${PLAYER_STATS[comparisonPlayer].tackles > PLAYER_STATS[selectedPlayer].tackles ? 'text-green-600' : ''}`}>
                              {PLAYER_STATS[comparisonPlayer].tackles}
                            </div>
                            <div className={`font-semibold ${PLAYER_STATS[selectedPlayer].tackles > PLAYER_STATS[comparisonPlayer].tackles ? 'text-green-600' : ''}`}>
                              {PLAYER_STATS[selectedPlayer].tackles}
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center text-sm text-gray-500">
                      <p>Click a player to compare with #{PLAYER_STATS[comparisonPlayer].number}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Controls</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600 space-y-2">
                <p><strong>Left Click + Drag:</strong> Rotate view</p>
                <p><strong>Right Click + Drag:</strong> Pan view</p>
                <p><strong>Scroll:</strong> Zoom in/out</p>
                <p><strong>Click Player:</strong> View stats</p>
                <p><strong>Arrow Tool:</strong> Click twice to draw</p>
                <p><strong>Zone Tool:</strong> Click center then edge</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
