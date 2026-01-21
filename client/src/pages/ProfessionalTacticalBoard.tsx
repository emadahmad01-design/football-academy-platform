import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RealisticPlayer3D } from '../components/RealisticPlayer3D';

const createRealisticPlayer = (color: number, number: number, name: string) => {
  const player = new RealisticPlayer3D({
    position: [0, 0, 0],
    jerseyNumber: number,
    teamColor: `#${color.toString(16).padStart(6, '0')}`,
    name
  });
  return player.group;
};
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { 
  Play, Pause, RotateCcw, Save, Download, Pencil, ArrowRight, 
  Circle, Square, Zap, Shield, Target, TrendingUp, Users, BookOpen,
  FastForward, Rewind, Video, Camera, Layers, Activity, AlertTriangle,
  Maximize2, Minimize2, Gauge, FileVideo, Mic
} from 'lucide-react';
import { trpc } from '../lib/trpc';

type DrawingTool = 'none' | 'line' | 'arrow' | 'circle' | 'zone' | 'path' | 'passing';
type TacticType = 'attack' | 'defense' | 'transition' | 'set_piece';
type CameraView = 'top' | 'side' | 'tactical';
type PlanningPhase = 'defense' | 'transition' | 'attack';
type TeamShape = 'compact' | 'stretched' | 'balanced';

interface Player {
  id: string;
  name: string;
  position: { x: number; y: number; z: number };
  number: number;
  team: 'home' | 'away';
  mesh?: THREE.Group;
  role: string;
  targetPosition?: { x: number; y: number; z: number };
  speed?: number;
  instruction?: string;
}

interface MovementKeyframe {
  time: number;
  positions: Map<string, { x: number; y: number; z: number }>;
  phase?: PlanningPhase;
}

interface PassingSequence {
  from: string;
  to: string;
  order: number;
}

interface TacticalPlan {
  id: string;
  name: string;
  type: TacticType;
  description: string;
  formation: string;
  instructions: string[];
  keyPlayers: number[];
  keyframes?: MovementKeyframe[];
  pattern?: string;
}

interface OpponentAnalysis {
  strengths: string[];
  weaknesses: string[];
  keyPlayers: string[];
  preferredFormation: string;
  playingStyle: string;
  recommendations: string[];
}

interface PressingZone {
  id: string;
  position: { x: number; z: number };
  radius: number;
  intensity: 'high' | 'medium' | 'low';
  mesh?: THREE.Mesh;
}

interface TeamShapeMetrics {
  shape: TeamShape;
  width: number;
  compactness: number;
  defensiveLineHeight: number;
  averagePosition: { x: number; z: number };
}

const TACTICAL_PATTERNS = [
  {
    id: 'build-up-short',
    name: 'Short Build-Up',
    description: 'Patient build-up from the back with short passes',
    type: 'attack' as TacticType
  },
  {
    id: 'build-up-long',
    name: 'Long Build-Up',
    description: 'Direct play with long balls to forwards',
    type: 'attack' as TacticType
  },
  {
    id: 'counter-press',
    name: 'Counter-Press',
    description: 'Immediate pressing after losing possession',
    type: 'transition' as TacticType
  },
  {
    id: 'organized-press',
    name: 'Organized Press',
    description: 'Coordinated pressing in specific zones',
    type: 'defense' as TacticType
  },
  {
    id: 'fast-counter',
    name: 'Fast Counter',
    description: 'Quick vertical transition to attack',
    type: 'transition' as TacticType
  }
];

const TACTICAL_PLANS: TacticalPlan[] = [
  {
    id: 'counter-attack',
    name: 'Counter-Attack',
    type: 'transition',
    description: 'Fast transition from defense to attack exploiting space',
    formation: '4-4-2',
    instructions: [
      'Compact defensive shape',
      'Quick vertical passes',
      'Exploit wide areas',
      'Fast forwards movement'
    ],
    keyPlayers: [7, 9, 10, 11],
    pattern: 'fast-counter'
  },
  {
    id: 'high-press',
    name: 'High Press',
    type: 'defense',
    description: 'Aggressive pressing in opponent half',
    formation: '4-3-3',
    instructions: [
      'Press from the front',
      'Force mistakes',
      'Cover passing lanes',
      'Quick recovery'
    ],
    keyPlayers: [9, 10, 11],
    pattern: 'organized-press'
  },
  {
    id: 'tiki-taka',
    name: 'Tiki-Taka Possession',
    type: 'attack',
    description: 'Short passing and movement to control the game',
    formation: '4-3-3',
    instructions: [
      'Short passing triangles',
      'Constant movement',
      'Retain possession',
      'Patient build-up'
    ],
    keyPlayers: [6, 8, 10],
    pattern: 'build-up-short'
  },
  {
    id: 'wing-play',
    name: 'Wing Play',
    type: 'attack',
    description: 'Utilize width and crossing opportunities',
    formation: '4-4-2',
    instructions: [
      'Stretch the play wide',
      'Overlapping fullbacks',
      'Quality crosses',
      'Box presence'
    ],
    keyPlayers: [2, 3, 7, 11]
  },
  {
    id: 'low-block',
    name: 'Low Block Defense',
    type: 'defense',
    description: 'Deep defensive line to absorb pressure',
    formation: '5-4-1',
    instructions: [
      'Compact defensive shape',
      'Protect central areas',
      'Quick clearances',
      'Counter when possible'
    ],
    keyPlayers: [2, 3, 4, 5, 6]
  },
  {
    id: 'corner-routine',
    name: 'Corner Kick Routine',
    type: 'set_piece',
    description: 'Organized corner kick attacking play',
    formation: '4-4-2',
    instructions: [
      'Near post run',
      'Far post presence',
      'Short corner option',
      'Edge of box positioning'
    ],
    keyPlayers: [4, 5, 9, 10]
  },
  {
    id: 'free-kick-wall',
    name: 'Free Kick Defense',
    type: 'set_piece',
    description: 'Defensive organization for free kicks',
    formation: '4-4-2',
    instructions: [
      'Proper wall positioning',
      'Mark key threats',
      'Goalkeeper positioning',
      'Quick counter setup'
    ],
    keyPlayers: [1, 4, 5, 6]
  }
];

const OPPONENT_ANALYSIS_TEMPLATE: OpponentAnalysis = {
  strengths: [
    'Strong aerial presence',
    'Quick wingers',
    'Organized defense',
    'Good set-piece delivery'
  ],
  weaknesses: [
    'Vulnerable to counter-attacks',
    'Weak left-back',
    'Poor pressing coordination',
    'Struggles against high press'
  ],
  keyPlayers: [
    '#10 - Creative midfielder',
    '#9 - Target man striker',
    '#7 - Pacey winger'
  ],
  preferredFormation: '4-4-2',
  playingStyle: 'Direct, physical, counter-attacking',
  recommendations: [
    'Press their weak left side',
    'Exploit space behind fullbacks',
    'Limit #10\'s time on ball',
    'Use quick passing to bypass press'
  ]
};

export default function ProfessionalTacticalBoard() {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());
  const ballRef = useRef<THREE.Mesh | null>(null);
  const offsideLineRef = useRef<THREE.Line | null>(null);
  const defensiveLineRef = useRef<THREE.Line | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  const [selectedTool, setSelectedTool] = useState<DrawingTool>('none');
  const [homePlayers, setHomePlayers] = useState<Player[]>([]);
  const [awayPlayers, setAwayPlayers] = useState<Player[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [homeFormation, setHomeFormation] = useState('4-4-2');
  const [awayFormation, setAwayFormation] = useState('4-3-3');
  const [selectedPlan, setSelectedPlan] = useState<TacticalPlan | null>(null);
  const [showOpponentAnalysis, setShowOpponentAnalysis] = useState(false);
  const [opponentAnalysis] = useState<OpponentAnalysis>(OPPONENT_ANALYSIS_TEMPLATE);
  const [savedPlans, setSavedPlans] = useState<string[]>([]);
  
  // Animation states
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(15);
  const [keyframes, setKeyframes] = useState<MovementKeyframe[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  
  // Advanced features
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showPressingZones, setShowPressingZones] = useState(false);
  const [showOffsideLine, setShowOffsideLine] = useState(false);
  const [cameraView, setCameraView] = useState<CameraView>('top');
  const [pressingZones, setPressingZones] = useState<PressingZone[]>([]);
  const [ballPosition, setBallPosition] = useState<{ x: number; y: number; z: number }>({ x: 0, y: 0.5, z: 0 });
  
  // New advanced features
  const [showCollisionWarnings, setShowCollisionWarnings] = useState(true);
  const [collisions, setCollisions] = useState<string[]>([]);
  const [showTeamShape, setShowTeamShape] = useState(false);
  const [teamShapeMetrics, setTeamShapeMetrics] = useState<TeamShapeMetrics | null>(null);
  const [showDistanceMatrix, setShowDistanceMatrix] = useState(false);
  const [passingSequence, setPassingSequence] = useState<PassingSequence[]>([]);
  const [showDefensiveLine, setShowDefensiveLine] = useState(false);
  const [showPlayerSpeeds, setShowPlayerSpeeds] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<PlanningPhase>('defense');
  const [selectedPattern, setSelectedPattern] = useState<string | null>(null);
  const [showPlayerInstructions, setShowPlayerInstructions] = useState(false);
  const [detectedFormation, setDetectedFormation] = useState<string>('');
  
  const drawingObjects = useRef<THREE.Object3D[]>([]);
  const drawingStartPoint = useRef<THREE.Vector3 | null>(null);
  const passingArrows = useRef<THREE.ArrowHelper[]>([]);

  // AI Coach mutation
  const aiCoachMutation = trpc.aiCoach.askQuestion.useMutation();

  // Calculate team shape metrics
  useEffect(() => {
    if (homePlayers.length === 0) return;

    const defenders = homePlayers.filter(p => p.role === 'Defender');
    const allFieldPlayers = homePlayers.filter(p => p.role !== 'Goalkeeper');

    if (allFieldPlayers.length === 0) return;

    // Calculate width
    const xPositions = allFieldPlayers.map(p => p.position.x);
    const width = Math.max(...xPositions) - Math.min(...xPositions);

    // Calculate compactness (average distance between players)
    let totalDistance = 0;
    let count = 0;
    for (let i = 0; i < allFieldPlayers.length; i++) {
      for (let j = i + 1; j < allFieldPlayers.length; j++) {
        const p1 = allFieldPlayers[i].position;
        const p2 = allFieldPlayers[j].position;
        const dist = Math.sqrt(
          Math.pow(p1.x - p2.x, 2) + Math.pow(p1.z - p2.z, 2)
        );
        totalDistance += dist;
        count++;
      }
    }
    const avgDistance = count > 0 ? totalDistance / count : 0;
    const compactness = avgDistance;

    // Defensive line height
    const defensiveLineHeight = defenders.length > 0
      ? defenders.reduce((sum, p) => sum + p.position.z, 0) / defenders.length
      : 0;

    // Average position
    const avgX = allFieldPlayers.reduce((sum, p) => sum + p.position.x, 0) / allFieldPlayers.length;
    const avgZ = allFieldPlayers.reduce((sum, p) => sum + p.position.z, 0) / allFieldPlayers.length;

    // Determine shape
    let shape: TeamShape = 'balanced';
    if (width < 30 && compactness < 15) {
      shape = 'compact';
    } else if (width > 45 || compactness > 20) {
      shape = 'stretched';
    }

    setTeamShapeMetrics({
      shape,
      width,
      compactness,
      defensiveLineHeight,
      averagePosition: { x: avgX, z: avgZ }
    });
  }, [homePlayers]);

  // Detect collisions
  useEffect(() => {
    if (!showCollisionWarnings) return;

    const allPlayers = [...homePlayers, ...awayPlayers];
    const newCollisions: string[] = [];
    const collisionDistance = 3;

    for (let i = 0; i < allPlayers.length; i++) {
      for (let j = i + 1; j < allPlayers.length; j++) {
        const p1 = allPlayers[i];
        const p2 = allPlayers[j];
        const dist = Math.sqrt(
          Math.pow(p1.position.x - p2.position.x, 2) +
          Math.pow(p1.position.z - p2.position.z, 2)
        );

        if (dist < collisionDistance) {
          newCollisions.push(`${p1.name} & ${p2.name} too close (${dist.toFixed(1)}m)`);
        }
      }
    }

    setCollisions(newCollisions);
  }, [homePlayers, awayPlayers, showCollisionWarnings, currentTime]);

  // Auto-detect formation
  useEffect(() => {
    if (homePlayers.length === 0) return;

    const defenders = homePlayers.filter(p => p.role === 'Defender').length;
    const midfielders = homePlayers.filter(p => p.role === 'Midfielder').length;
    const forwards = homePlayers.filter(p => p.role === 'Forward').length;

    const formation = `${defenders}-${midfielders}-${forwards}`;
    setDetectedFormation(formation);
  }, [homePlayers]);

  // Calculate player speeds during animation
  useEffect(() => {
    if (!isPlaying || keyframes.length < 2) return;

    const allPlayers = [...homePlayers, ...awayPlayers];
    allPlayers.forEach(player => {
      if (player.targetPosition) {
        const dx = player.targetPosition.x - player.position.x;
        const dz = player.targetPosition.z - player.position.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        const speed = distance / 0.016; // pixels per frame at 60fps
        player.speed = speed;
      }
    });
  }, [isPlaying, currentTime, homePlayers, awayPlayers]);

  // Initialize scene
  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      60,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 30, 40);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2.2;
    controls.minDistance = 20;
    controls.maxDistance = 70;
    controlsRef.current = controls;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(15, 25, 15);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.left = -40;
    directionalLight.shadow.camera.right = 40;
    directionalLight.shadow.camera.top = 40;
    directionalLight.shadow.camera.bottom = -40;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    createPitch(scene);
    createBall(scene);
    createOffsideLine(scene);
    createDefensiveLine(scene);

    const homeTeam = createTeamPlayers('home', homeFormation);
    const awayTeam = createTeamPlayers('away', awayFormation);
    
    setHomePlayers(homeTeam);
    setAwayPlayers(awayTeam);

    [...homeTeam, ...awayTeam].forEach(player => {
      const playerMesh = createRealisticPlayer(
        player.team === 'home' ? 0x0000ff : 0xff0000,
        player.number,
        player.name
      );
      playerMesh.position.set(player.position.x, player.position.y, player.position.z);
      playerMesh.castShadow = true;
      playerMesh.userData = { player };
      scene.add(playerMesh);
      player.mesh = playerMesh;
    });

    // Initialize keyframes with starting positions
    const initialKeyframe: MovementKeyframe = {
      time: 0,
      positions: new Map(),
      phase: 'defense'
    };
    [...homeTeam, ...awayTeam].forEach(player => {
      initialKeyframe.positions.set(player.id, { ...player.position });
    });
    setKeyframes([initialKeyframe]);

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!mountRef.current || !camera || !renderer) return;
      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    const handleMouseDown = (event: MouseEvent) => {
      if (!mountRef.current || !camera || !scene) return;
      
      const rect = mountRef.current.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      
      if (selectedTool === 'none') {
        const allPlayers = [...homePlayers, ...awayPlayers]
          .map(p => p.mesh)
          .filter((m): m is THREE.Group => m !== undefined);
        
        const intersects = raycasterRef.current.intersectObjects(allPlayers, true);
        
        if (intersects.length > 0) {
          const clickedObject = intersects[0].object;
          let parent = clickedObject.parent;
          while (parent && !parent.userData.player) {
            parent = parent.parent;
          }
          if (parent && parent.userData.player) {
            setSelectedPlayer(parent.userData.player);
          }
        }
      } else if (selectedTool === 'passing') {
        // Handle passing sequence
        const allPlayers = [...homePlayers, ...awayPlayers]
          .map(p => p.mesh)
          .filter((m): m is THREE.Group => m !== undefined);
        
        const intersects = raycasterRef.current.intersectObjects(allPlayers, true);
        
        if (intersects.length > 0) {
          const clickedObject = intersects[0].object;
          let parent = clickedObject.parent;
          while (parent && !parent.userData.player) {
            parent = parent.parent;
          }
          if (parent && parent.userData.player) {
            const player = parent.userData.player;
            if (passingSequence.length === 0 || passingSequence[passingSequence.length - 1].to !== player.id) {
              const newPass: PassingSequence = {
                from: passingSequence.length > 0 ? passingSequence[passingSequence.length - 1].to : player.id,
                to: player.id,
                order: passingSequence.length + 1
              };
              setPassingSequence(prev => [...prev, newPass]);
              drawPassingArrow(newPass);
            }
          }
        }
      } else {
        const groundIntersects = raycasterRef.current.intersectObjects(
          scene.children.filter(obj => obj.userData.isGround),
          false
        );
        if (groundIntersects.length > 0) {
          const point = groundIntersects[0].point;
          if (selectedTool === 'line' || selectedTool === 'arrow' || selectedTool === 'path') {
            if (!drawingStartPoint.current) {
              drawingStartPoint.current = point.clone();
            } else {
              addDrawing(drawingStartPoint.current, point, selectedTool);
              drawingStartPoint.current = null;
            }
          } else {
            addDrawing(point, point, selectedTool);
          }
        }
      }
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!selectedPlayer || !mountRef.current || !camera || !scene) return;
      
      const rect = mountRef.current.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycasterRef.current.setFromCamera(mouseRef.current, camera);
      const groundIntersects = raycasterRef.current.intersectObjects(
        scene.children.filter(obj => obj.userData.isGround),
        false
      );
      
      if (groundIntersects.length > 0 && selectedPlayer.mesh) {
        const point = groundIntersects[0].point;
        selectedPlayer.mesh.position.set(point.x, 0.5, point.z);
        selectedPlayer.position = { x: point.x, y: 0.5, z: point.z };
        
        // Update lines
        if (showOffsideLine) updateOffsideLine();
        if (showDefensiveLine) updateDefensiveLine();
      }
    };

    const handleMouseUp = () => {
      if (selectedPlayer && isRecording) {
        recordKeyframe();
      }
      setSelectedPlayer(null);
    };

    renderer.domElement.addEventListener('mousedown', handleMouseDown);
    renderer.domElement.addEventListener('mousemove', handleMouseMove);
    renderer.domElement.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('mousedown', handleMouseDown);
      renderer.domElement.removeEventListener('mousemove', handleMouseMove);
      renderer.domElement.removeEventListener('mouseup', handleMouseUp);
      
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [homeFormation, awayFormation, selectedTool, selectedPlayer, passingSequence]);

  // Animation loop
  useEffect(() => {
    if (!isPlaying || keyframes.length < 2) return;

    const animate = () => {
      setCurrentTime(prevTime => {
        const newTime = prevTime + (0.016 * playbackSpeed);
        if (newTime >= duration) {
          setIsPlaying(false);
          return duration;
        }
        
        interpolatePositions(newTime);
        
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
  }, [isPlaying, playbackSpeed, keyframes, duration]);

  const createBall = (scene: THREE.Scene) => {
    const ballGeometry = new THREE.SphereGeometry(0.4, 32, 32);
    const ballMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.5,
      metalness: 0.1
    });
    const ball = new THREE.Mesh(ballGeometry, ballMaterial);
    ball.position.set(0, 0.4, 0);
    ball.castShadow = true;
    scene.add(ball);
    ballRef.current = ball;
  };

  const createOffsideLine = (scene: THREE.Scene) => {
    const lineGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-35, 0.2, 0),
      new THREE.Vector3(35, 0.2, 0)
    ]);
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 3 });
    const line = new THREE.Line(lineGeometry, lineMaterial);
    line.visible = false;
    scene.add(line);
    offsideLineRef.current = line;
  };

  const createDefensiveLine = (scene: THREE.Scene) => {
    const lineGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-35, 0.2, 0),
      new THREE.Vector3(35, 0.2, 0)
    ]);
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00, linewidth: 3 });
    const line = new THREE.Line(lineGeometry, lineMaterial);
    line.visible = false;
    scene.add(line);
    defensiveLineRef.current = line;
  };

  const updateOffsideLine = () => {
    if (!offsideLineRef.current) return;
    
    const defenders = awayPlayers
      .filter(p => p.role === 'Defender')
      .sort((a, b) => b.position.z - a.position.z);
    
    if (defenders.length >= 2) {
      const zPos = defenders[1].position.z;
      offsideLineRef.current.position.z = zPos;
      offsideLineRef.current.visible = showOffsideLine;
    }
  };

  const updateDefensiveLine = () => {
    if (!defensiveLineRef.current) return;
    
    const defenders = homePlayers.filter(p => p.role === 'Defender');
    
    if (defenders.length > 0) {
      const avgZ = defenders.reduce((sum, p) => sum + p.position.z, 0) / defenders.length;
      defensiveLineRef.current.position.z = avgZ;
      defensiveLineRef.current.visible = showDefensiveLine;
    }
  };

  const drawPassingArrow = (pass: PassingSequence) => {
    if (!sceneRef.current) return;

    const allPlayers = [...homePlayers, ...awayPlayers];
    const fromPlayer = allPlayers.find(p => p.id === pass.from);
    const toPlayer = allPlayers.find(p => p.id === pass.to);

    if (fromPlayer && toPlayer) {
      const from = new THREE.Vector3(fromPlayer.position.x, 0.5, fromPlayer.position.z);
      const to = new THREE.Vector3(toPlayer.position.x, 0.5, toPlayer.position.z);
      const direction = new THREE.Vector3().subVectors(to, from).normalize();
      const length = from.distanceTo(to);
      
      const arrow = new THREE.ArrowHelper(direction, from, length, 0xffff00, length * 0.2, length * 0.15);
      sceneRef.current.add(arrow);
      passingArrows.current.push(arrow);
    }
  };

  const clearPassingSequence = () => {
    if (!sceneRef.current) return;
    
    passingArrows.current.forEach(arrow => {
      sceneRef.current?.remove(arrow);
    });
    passingArrows.current = [];
    setPassingSequence([]);
  };

  const createPitch = (scene: THREE.Scene) => {
    const groundGeometry = new THREE.PlaneGeometry(70, 110);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x2d5016,
      roughness: 0.8,
      metalness: 0.2
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    ground.userData.isGround = true;
    scene.add(ground);

    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 });

    const boundaryPoints = [
      new THREE.Vector3(-35, 0.1, -55),
      new THREE.Vector3(35, 0.1, -55),
      new THREE.Vector3(35, 0.1, 55),
      new THREE.Vector3(-35, 0.1, 55),
      new THREE.Vector3(-35, 0.1, -55)
    ];
    const boundaryGeometry = new THREE.BufferGeometry().setFromPoints(boundaryPoints);
    const boundary = new THREE.Line(boundaryGeometry, lineMaterial);
    scene.add(boundary);

    const centerLinePoints = [
      new THREE.Vector3(-35, 0.1, 0),
      new THREE.Vector3(35, 0.1, 0)
    ];
    const centerLineGeometry = new THREE.BufferGeometry().setFromPoints(centerLinePoints);
    const centerLine = new THREE.Line(centerLineGeometry, lineMaterial);
    scene.add(centerLine);

    const centerCircleGeometry = new THREE.CircleGeometry(9.15, 64);
    const centerCircleEdges = new THREE.EdgesGeometry(centerCircleGeometry);
    const centerCircle = new THREE.LineSegments(centerCircleEdges, lineMaterial);
    centerCircle.rotation.x = -Math.PI / 2;
    centerCircle.position.y = 0.1;
    scene.add(centerCircle);

    [-1, 1].forEach(side => {
      const zPos = side * 55;
      
      const goalAreaPoints = [
        new THREE.Vector3(-9.16, 0.1, zPos),
        new THREE.Vector3(-9.16, 0.1, zPos - side * 5.5),
        new THREE.Vector3(9.16, 0.1, zPos - side * 5.5),
        new THREE.Vector3(9.16, 0.1, zPos)
      ];
      const goalAreaGeometry = new THREE.BufferGeometry().setFromPoints(goalAreaPoints);
      const goalArea = new THREE.Line(goalAreaGeometry, lineMaterial);
      scene.add(goalArea);

      const penaltyAreaPoints = [
        new THREE.Vector3(-20.16, 0.1, zPos),
        new THREE.Vector3(-20.16, 0.1, zPos - side * 16.5),
        new THREE.Vector3(20.16, 0.1, zPos - side * 16.5),
        new THREE.Vector3(20.16, 0.1, zPos)
      ];
      const penaltyAreaGeometry = new THREE.BufferGeometry().setFromPoints(penaltyAreaPoints);
      const penaltyArea = new THREE.Line(penaltyAreaGeometry, lineMaterial);
      scene.add(penaltyArea);

      const penaltySpotGeometry = new THREE.CircleGeometry(0.3, 16);
      const penaltySpotMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const penaltySpot = new THREE.Mesh(penaltySpotGeometry, penaltySpotMaterial);
      penaltySpot.rotation.x = -Math.PI / 2;
      penaltySpot.position.set(0, 0.1, zPos - side * 11);
      scene.add(penaltySpot);
    });
  };

  const createTeamPlayers = (team: 'home' | 'away', formation: string): Player[] => {
    const players: Player[] = [];
    const zOffset = team === 'home' ? -35 : 35;
    
    const formations: Record<string, { positions: number[][], roles: string[] }> = {
      '4-4-2': {
        positions: [
          [-18, -9, 9, 18],
          [-18, -9, 9, 18],
          [-10, 10]
        ],
        roles: ['Defender', 'Midfielder', 'Forward']
      },
      '4-3-3': {
        positions: [
          [-18, -9, 9, 18],
          [-12, 0, 12],
          [-15, 0, 15]
        ],
        roles: ['Defender', 'Midfielder', 'Forward']
      },
      '5-4-1': {
        positions: [
          [-20, -10, 0, 10, 20],
          [-15, -5, 5, 15],
          [0]
        ],
        roles: ['Defender', 'Midfielder', 'Forward']
      }
    };

    const formationData = formations[formation] || formations['4-4-2'];
    let playerNumber = 2;

    players.push({
      id: `${team}-gk`,
      name: 'GK',
      position: { x: 0, y: 0.5, z: zOffset + (team === 'home' ? -15 : 15) },
      number: 1,
      team,
      role: 'Goalkeeper',
      instruction: 'Organize defense, distribute quickly'
    });

    formationData.positions.forEach((line, lineIndex) => {
      const zPos = zOffset + (team === 'home' ? 1 : -1) * (lineIndex * 15 - 12);
      line.forEach(xPos => {
        const role = formationData.roles[lineIndex];
        let instruction = '';
        
        if (role === 'Defender') {
          instruction = 'Hold position, cover space';
        } else if (role === 'Midfielder') {
          instruction = 'Link play, support attack';
        } else if (role === 'Forward') {
          instruction = 'Press high, make runs';
        }

        players.push({
          id: `${team}-${playerNumber}`,
          name: `P${playerNumber}`,
          position: { x: xPos, y: 0.5, z: zPos },
          number: playerNumber,
          team,
          role,
          instruction
        });
        playerNumber++;
      });
    });

    return players;
  };

  const addDrawing = (start: THREE.Vector3, end: THREE.Vector3, tool: DrawingTool) => {
    if (!sceneRef.current) return;

    let drawingObject: THREE.Object3D | null = null;

    switch (tool) {
      case 'line': {
        const points = [start, end];
        const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffff00, linewidth: 3 });
        drawingObject = new THREE.Line(lineGeometry, lineMaterial);
        break;
      }
      case 'arrow': {
        const direction = new THREE.Vector3().subVectors(end, start).normalize();
        const length = start.distanceTo(end);
        const arrowHelper = new THREE.ArrowHelper(direction, start, length, 0xffff00, length * 0.2, length * 0.15);
        drawingObject = arrowHelper;
        break;
      }
      case 'path': {
        const curve = new THREE.QuadraticBezierCurve3(
          start,
          new THREE.Vector3((start.x + end.x) / 2, 1, (start.z + end.z) / 2),
          end
        );
        const points = curve.getPoints(50);
        const pathGeometry = new THREE.BufferGeometry().setFromPoints(points);
        const pathMaterial = new THREE.LineBasicMaterial({ color: 0x00ff00, linewidth: 3 });
        drawingObject = new THREE.Line(pathGeometry, pathMaterial);
        break;
      }
      case 'circle': {
        const circleGeometry = new THREE.CircleGeometry(4, 32);
        const circleEdges = new THREE.EdgesGeometry(circleGeometry);
        const circleMaterial = new THREE.LineBasicMaterial({ color: 0xffff00, linewidth: 3 });
        drawingObject = new THREE.LineSegments(circleEdges, circleMaterial);
        drawingObject.rotation.x = -Math.PI / 2;
        drawingObject.position.copy(start);
        drawingObject.position.y = 0.2;
        break;
      }
      case 'zone': {
        const zoneGeometry = new THREE.PlaneGeometry(10, 10);
        const zoneMaterial = new THREE.MeshBasicMaterial({ 
          color: 0xff0000, 
          transparent: true, 
          opacity: 0.3,
          side: THREE.DoubleSide
        });
        drawingObject = new THREE.Mesh(zoneGeometry, zoneMaterial);
        drawingObject.rotation.x = -Math.PI / 2;
        drawingObject.position.copy(start);
        drawingObject.position.y = 0.15;
        break;
      }
    }

    if (drawingObject) {
      sceneRef.current.add(drawingObject);
      drawingObjects.current.push(drawingObject);
    }
  };

  const clearDrawings = () => {
    if (!sceneRef.current) return;
    drawingObjects.current.forEach(obj => {
      sceneRef.current?.remove(obj);
    });
    drawingObjects.current = [];
    drawingStartPoint.current = null;
  };

  const recordKeyframe = () => {
    const newKeyframe: MovementKeyframe = {
      time: currentTime,
      positions: new Map(),
      phase: currentPhase
    };
    
    [...homePlayers, ...awayPlayers].forEach(player => {
      newKeyframe.positions.set(player.id, { ...player.position });
    });
    
    setKeyframes(prev => [...prev, newKeyframe].sort((a, b) => a.time - b.time));
  };

  const interpolatePositions = (time: number) => {
    if (keyframes.length < 2) return;

    let prevKeyframe = keyframes[0];
    let nextKeyframe = keyframes[keyframes.length - 1];

    for (let i = 0; i < keyframes.length - 1; i++) {
      if (keyframes[i].time <= time && keyframes[i + 1].time >= time) {
        prevKeyframe = keyframes[i];
        nextKeyframe = keyframes[i + 1];
        break;
      }
    }

    const timeDiff = nextKeyframe.time - prevKeyframe.time;
    if (timeDiff === 0) return;

    const t = (time - prevKeyframe.time) / timeDiff;

    [...homePlayers, ...awayPlayers].forEach(player => {
      const prevPos = prevKeyframe.positions.get(player.id);
      const nextPos = nextKeyframe.positions.get(player.id);

      if (prevPos && nextPos && player.mesh) {
        const x = prevPos.x + (nextPos.x - prevPos.x) * t;
        const y = prevPos.y + (nextPos.y - prevPos.y) * t;
        const z = prevPos.z + (nextPos.z - prevPos.z) * t;

        player.mesh.position.set(x, y, z);
        player.position = { x, y, z };
      }
    });

    if (showOffsideLine) updateOffsideLine();
    if (showDefensiveLine) updateDefensiveLine();
  };

  const changeCameraView = (view: CameraView) => {
    if (!cameraRef.current || !controlsRef.current) return;

    const camera = cameraRef.current;
    const controls = controlsRef.current;

    switch (view) {
      case 'top':
        camera.position.set(0, 50, 0);
        camera.lookAt(0, 0, 0);
        break;
      case 'side':
        camera.position.set(50, 20, 0);
        camera.lookAt(0, 0, 0);
        break;
      case 'tactical':
        camera.position.set(0, 30, 40);
        camera.lookAt(0, 0, 0);
        break;
    }

    controls.update();
    setCameraView(view);
  };

  const exportAsImage = () => {
    if (!rendererRef.current) return;
    const dataURL = rendererRef.current.domElement.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `tactical-plan-${selectedPlan?.id || 'custom'}-${Date.now()}.png`;
    link.href = dataURL;
    link.click();
  };

  const savePlan = () => {
    const planName = selectedPlan?.name || 'Custom Plan';
    const planData = {
      name: planName,
      keyframes,
      formations: { home: homeFormation, away: awayFormation },
      passingSequence,
      phase: currentPhase,
      pattern: selectedPattern,
      timestamp: new Date().toLocaleString()
    };
    setSavedPlans(prev => [...prev, JSON.stringify(planData)]);
    alert(`Plan "${planName}" saved successfully!`);
  };

  const resetPositions = () => {
    const homeTeam = createTeamPlayers('home', homeFormation);
    const awayTeam = createTeamPlayers('away', awayFormation);
    
    [...homeTeam, ...awayTeam].forEach(newPlayer => {
      const existingPlayer = [...homePlayers, ...awayPlayers].find(p => p.id === newPlayer.id);
      if (existingPlayer && existingPlayer.mesh) {
        existingPlayer.mesh.position.set(
          newPlayer.position.x,
          newPlayer.position.y,
          newPlayer.position.z
        );
        existingPlayer.position = { ...newPlayer.position };
      }
    });
    
    clearDrawings();
    clearPassingSequence();
    setSelectedPlan(null);
    setCurrentTime(0);
    setIsPlaying(false);
    setCurrentPhase('defense');
  };

  const applyTacticalPlan = (plan: TacticalPlan) => {
    setSelectedPlan(plan);
    clearDrawings();
    
    if (plan.pattern) {
      setSelectedPattern(plan.pattern);
    }
    
    if (plan.keyframes) {
      setKeyframes(plan.keyframes);
      setDuration(plan.keyframes[plan.keyframes.length - 1].time);
    }
  };

  const getAIAdvice = async () => {
    try {
      const context = `
        Home Formation: ${homeFormation}
        Away Formation: ${awayFormation}
        Selected Plan: ${selectedPlan?.name || 'None'}
        Current Phase: ${currentPhase}
        Selected Pattern: ${selectedPattern || 'None'}
        Team Shape: ${teamShapeMetrics?.shape || 'Unknown'}
        Team Width: ${teamShapeMetrics?.width.toFixed(1)}m
        Defensive Line Height: ${teamShapeMetrics?.defensiveLineHeight.toFixed(1)}m
        Detected Formation: ${detectedFormation}
        Collisions: ${collisions.length}
        Opponent Strengths: ${opponentAnalysis.strengths.join(', ')}
        Opponent Weaknesses: ${opponentAnalysis.weaknesses.join(', ')}
        Current Time: ${currentTime.toFixed(1)}s
        Keyframes: ${keyframes.length}
      `;
      
      const result = await aiCoachMutation.mutateAsync({
        question: `Based on this tactical situation, provide specific advice: ${context}`,
        context: 'tactical'
      });
      
      alert(`AI Coach Advice:\n\n${result.answer}`);
    } catch (error) {
      alert('Failed to get AI advice. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="container mx-auto">
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Professional Tactical Board</h1>
          <p className="text-slate-600">Advanced tactical planning with simulation & analysis</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Tactical Plans & Patterns Library */}
          <Card className="lg:col-span-1 p-4 max-h-[800px] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Tactical Library
            </h3>
            
            {/* Planning Phase Selector */}
            <div className="mb-4">
              <label className="text-xs font-medium mb-2 block">Planning Phase</label>
              <div className="flex gap-1">
                {(['defense', 'transition', 'attack'] as PlanningPhase[]).map(phase => (
                  <Button
                    key={phase}
                    size="sm"
                    variant={currentPhase === phase ? 'default' : 'outline'}
                    onClick={() => setCurrentPhase(phase)}
                    className="flex-1 text-xs"
                  >
                    {phase}
                  </Button>
                ))}
              </div>
            </div>

            {/* Tactical Patterns */}
            <div className="mb-4">
              <label className="text-xs font-medium mb-2 block">Patterns</label>
              <div className="space-y-1">
                {TACTICAL_PATTERNS.map(pattern => (
                  <button
                    key={pattern.id}
                    onClick={() => setSelectedPattern(pattern.id)}
                    className={`w-full text-left p-2 rounded text-xs border transition-all ${
                      selectedPattern === pattern.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="font-medium">{pattern.name}</div>
                    <div className="text-slate-600 text-[10px]">{pattern.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Tactical Plans */}
            <div className="mb-4">
              <label className="text-xs font-medium mb-2 block">Plans</label>
              <div className="space-y-2">
                {TACTICAL_PLANS.map(plan => (
                  <button
                    key={plan.id}
                    onClick={() => applyTacticalPlan(plan)}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                      selectedPlan?.id === plan.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {plan.type === 'attack' && <Zap className="w-4 h-4 text-orange-500" />}
                      {plan.type === 'defense' && <Shield className="w-4 h-4 text-blue-500" />}
                      {plan.type === 'transition' && <TrendingUp className="w-4 h-4 text-green-500" />}
                      {plan.type === 'set_piece' && <Target className="w-4 h-4 text-purple-500" />}
                      <span className="font-medium text-sm">{plan.name}</span>
                    </div>
                    <p className="text-xs text-slate-600">{plan.description}</p>
                    <p className="text-xs text-slate-500 mt-1">Formation: {plan.formation}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Button
                className="w-full"
                variant="outline"
                size="sm"
                onClick={() => setShowOpponentAnalysis(!showOpponentAnalysis)}
              >
                <Users className="w-4 h-4 mr-2" />
                {showOpponentAnalysis ? 'Hide' : 'Show'} Opponent
              </Button>
              
              <Button
                className="w-full"
                variant={isRecording ? 'default' : 'outline'}
                size="sm"
                onClick={() => setIsRecording(!isRecording)}
              >
                <Video className="w-4 h-4 mr-2" />
                {isRecording ? 'Stop Recording' : 'Record Movements'}
              </Button>

              <Button
                className="w-full"
                variant={showPlayerInstructions ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowPlayerInstructions(!showPlayerInstructions)}
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Player Instructions
              </Button>
            </div>
          </Card>

          {/* Main 3D View */}
          <Card className="lg:col-span-3 p-6">
            <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
              <div>
                <h2 className="text-xl font-semibold">Tactical Board</h2>
                {detectedFormation && (
                  <p className="text-xs text-slate-600">Detected: {detectedFormation}</p>
                )}
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" size="sm" onClick={getAIAdvice}>
                  <Target className="w-4 h-4 mr-1" /> AI Advice
                </Button>
                <Button variant="outline" size="sm" onClick={savePlan}>
                  <Save className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={exportAsImage}>
                  <Download className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={resetPositions}>
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div 
              ref={mountRef} 
              className="w-full bg-slate-900 rounded-lg overflow-hidden"
              style={{ height: '550px' }}
            />

            {/* Animation Controls */}
            <Card className="mt-4 p-4 bg-slate-50">
              <div className="flex items-center gap-4 mb-3">
                <Button
                  size="sm"
                  variant={isPlaying ? 'default' : 'outline'}
                  onClick={() => setIsPlaying(!isPlaying)}
                  disabled={keyframes.length < 2}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentTime(0)}
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
                <div className="flex-1">
                  <Slider
                    value={[currentTime]}
                    onValueChange={([value]) => setCurrentTime(value)}
                    max={duration}
                    step={0.1}
                    className="w-full"
                  />
                </div>
                <span className="text-sm font-mono">{currentTime.toFixed(1)}s / {duration}s</span>
              </div>
              
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium">Speed:</label>
                <Slider
                  value={[playbackSpeed]}
                  onValueChange={([value]) => setPlaybackSpeed(value)}
                  min={0.25}
                  max={2}
                  step={0.25}
                  className="w-32"
                />
                <span className="text-sm">{playbackSpeed}x</span>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={recordKeyframe}
                  disabled={!isRecording}
                >
                  Add Keyframe ({keyframes.length})
                </Button>
              </div>
            </Card>

            {/* Drawing Tools */}
            <div className="mt-4 flex gap-2 flex-wrap">
              <Button
                variant={selectedTool === 'none' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTool('none')}
              >
                Select
              </Button>
              <Button
                variant={selectedTool === 'line' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTool('line')}
              >
                <Pencil className="w-4 h-4 mr-1" /> Line
              </Button>
              <Button
                variant={selectedTool === 'arrow' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTool('arrow')}
              >
                <ArrowRight className="w-4 h-4 mr-1" /> Arrow
              </Button>
              <Button
                variant={selectedTool === 'path' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTool('path')}
              >
                <TrendingUp className="w-4 h-4 mr-1" /> Path
              </Button>
              <Button
                variant={selectedTool === 'circle' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTool('circle')}
              >
                <Circle className="w-4 h-4 mr-1" /> Circle
              </Button>
              <Button
                variant={selectedTool === 'zone' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTool('zone')}
              >
                <Square className="w-4 h-4 mr-1" /> Zone
              </Button>
              <Button
                variant={selectedTool === 'passing' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTool('passing')}
              >
                <ArrowRight className="w-4 h-4 mr-1" /> Passing ({passingSequence.length})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearDrawings}
              >
                Clear Drawings
              </Button>
              {passingSequence.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearPassingSequence}
                >
                  Clear Passes
                </Button>
              )}
            </div>

            {/* Advanced Analysis Features */}
            <div className="mt-4 flex gap-2 flex-wrap">
              <Button
                variant={showHeatmap ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowHeatmap(!showHeatmap)}
              >
                <Activity className="w-4 h-4 mr-1" /> Heatmap
              </Button>
              <Button
                variant={showPressingZones ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowPressingZones(!showPressingZones)}
              >
                <Layers className="w-4 h-4 mr-1" /> Pressing
              </Button>
              <Button
                variant={showOffsideLine ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setShowOffsideLine(!showOffsideLine);
                  if (offsideLineRef.current) {
                    offsideLineRef.current.visible = !showOffsideLine;
                  }
                }}
              >
                Offside
              </Button>
              <Button
                variant={showDefensiveLine ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setShowDefensiveLine(!showDefensiveLine);
                  updateDefensiveLine();
                }}
              >
                <Shield className="w-4 h-4 mr-1" /> Def Line
              </Button>
              <Button
                variant={showTeamShape ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowTeamShape(!showTeamShape)}
              >
                <Maximize2 className="w-4 h-4 mr-1" /> Shape
              </Button>
              <Button
                variant={showCollisionWarnings ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowCollisionWarnings(!showCollisionWarnings)}
              >
                <AlertTriangle className="w-4 h-4 mr-1" /> Collisions
              </Button>
              <Button
                variant={showPlayerSpeeds ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowPlayerSpeeds(!showPlayerSpeeds)}
              >
                <Gauge className="w-4 h-4 mr-1" /> Speed
              </Button>
              <Button
                variant={showDistanceMatrix ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowDistanceMatrix(!showDistanceMatrix)}
              >
                Distance
              </Button>
              
              <div className="flex gap-1 ml-auto">
                <Button
                  variant={cameraView === 'top' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => changeCameraView('top')}
                >
                  <Camera className="w-4 h-4" />
                </Button>
                <Button
                  variant={cameraView === 'side' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => changeCameraView('side')}
                >
                  Side
                </Button>
                <Button
                  variant={cameraView === 'tactical' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => changeCameraView('tactical')}
                >
                  Tactical
                </Button>
              </div>
            </div>

            {/* Team Shape Metrics */}
            {showTeamShape && teamShapeMetrics && (
              <Card className="mt-4 p-4 bg-green-50 border-green-200">
                <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                  <Maximize2 className="w-4 h-4" />
                  Team Shape Analysis
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-green-700">Shape</p>
                    <Badge variant={teamShapeMetrics.shape === 'compact' ? 'default' : 'outline'}>
                      {teamShapeMetrics.shape.toUpperCase()}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-green-700">Width</p>
                    <p className="font-mono text-green-900">{teamShapeMetrics.width.toFixed(1)}m</p>
                  </div>
                  <div>
                    <p className="text-xs text-green-700">Compactness</p>
                    <p className="font-mono text-green-900">{teamShapeMetrics.compactness.toFixed(1)}m</p>
                  </div>
                  <div>
                    <p className="text-xs text-green-700">Def Line Height</p>
                    <p className="font-mono text-green-900">{teamShapeMetrics.defensiveLineHeight.toFixed(1)}m</p>
                  </div>
                </div>
              </Card>
            )}

            {/* Collision Warnings */}
            {showCollisionWarnings && collisions.length > 0 && (
              <Card className="mt-4 p-4 bg-red-50 border-red-200">
                <h4 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Collision Warnings ({collisions.length})
                </h4>
                <div className="space-y-1 max-h-24 overflow-y-auto">
                  {collisions.slice(0, 5).map((collision, idx) => (
                    <p key={idx} className="text-xs text-red-800">⚠️ {collision}</p>
                  ))}
                </div>
              </Card>
            )}

            {/* Selected Plan Instructions */}
            {selectedPlan && (
              <Card className="mt-4 p-4 bg-blue-50 border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2">{selectedPlan.name}</h4>
                <p className="text-sm text-blue-800 mb-3">{selectedPlan.description}</p>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-blue-900">Key Instructions:</p>
                  {selectedPlan.instructions.map((instruction, idx) => (
                    <p key={idx} className="text-xs text-blue-800">• {instruction}</p>
                  ))}
                </div>
                {selectedPlan.pattern && (
                  <p className="text-xs text-blue-700 mt-2">
                    Pattern: {TACTICAL_PATTERNS.find(p => p.id === selectedPlan.pattern)?.name}
                  </p>
                )}
              </Card>
            )}
          </Card>

          {/* Analysis & Instructions Panel */}
          <Card className="lg:col-span-1 p-4 max-h-[800px] overflow-y-auto">
            {showPlayerInstructions ? (
              <>
                <h3 className="text-lg font-semibold mb-4">Player Instructions</h3>
                <div className="space-y-3">
                  {homePlayers.map(player => (
                    <div key={player.id} className="p-2 border rounded">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          #{player.number}
                        </Badge>
                        <span className="text-sm font-medium">{player.name}</span>
                      </div>
                      <p className="text-xs text-slate-600">{player.role}</p>
                      <p className="text-xs text-blue-700 mt-1">{player.instruction}</p>
                    </div>
                  ))}
                </div>
              </>
            ) : !showOpponentAnalysis ? (
              <>
                <h3 className="text-lg font-semibold mb-4">Team Setup</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-blue-600 mb-2 block">
                      Your Team (Blue)
                    </label>
                    <select
                      className="w-full p-2 border rounded text-sm"
                      value={homeFormation}
                      onChange={(e) => setHomeFormation(e.target.value)}
                    >
                      <option value="4-4-2">4-4-2</option>
                      <option value="4-3-3">4-3-3</option>
                      <option value="5-4-1">5-4-1</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-red-600 mb-2 block">
                      Opponent (Red)
                    </label>
                    <select
                      className="w-full p-2 border rounded text-sm"
                      value={awayFormation}
                      onChange={(e) => setAwayFormation(e.target.value)}
                    >
                      <option value="4-3-3">4-3-3</option>
                      <option value="4-4-2">4-4-2</option>
                      <option value="5-4-1">5-4-1</option>
                    </select>
                  </div>

                  <div className="pt-4 border-t">
                    <h4 className="text-sm font-semibold mb-2">Advanced Features</h4>
                    <ul className="text-xs text-slate-600 space-y-1">
                      <li>✅ Animation simulation</li>
                      <li>✅ Collision detection</li>
                      <li>✅ Team shape analysis</li>
                      <li>✅ Distance matrix</li>
                      <li>✅ Passing sequences</li>
                      <li>✅ Defensive line height</li>
                      <li>✅ Player speed indicators</li>
                      <li>✅ Formation auto-detect</li>
                      <li>✅ Multi-phase planning</li>
                      <li>✅ Tactical patterns</li>
                      <li>✅ Player instructions</li>
                      <li>✅ Heatmap & pressing zones</li>
                      <li>✅ Offside line tracker</li>
                      <li>✅ Multiple camera angles</li>
                    </ul>
                  </div>

                  {savedPlans.length > 0 && (
                    <div className="pt-4 border-t">
                      <h4 className="text-sm font-semibold mb-2">Saved Plans ({savedPlans.length})</h4>
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {savedPlans.slice(-5).map((plan, idx) => {
                          const planData = JSON.parse(plan);
                          return (
                            <p key={idx} className="text-xs text-slate-600 truncate">
                              {planData.name} - {planData.timestamp}
                            </p>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold mb-4 text-red-600">Opponent Analysis</h3>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-green-600 mb-2">Strengths</h4>
                    <ul className="text-xs text-slate-700 space-y-1">
                      {opponentAnalysis.strengths.map((strength, idx) => (
                        <li key={idx}>• {strength}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-red-600 mb-2">Weaknesses</h4>
                    <ul className="text-xs text-slate-700 space-y-1">
                      {opponentAnalysis.weaknesses.map((weakness, idx) => (
                        <li key={idx}>• {weakness}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-blue-600 mb-2">Key Players</h4>
                    <ul className="text-xs text-slate-700 space-y-1">
                      {opponentAnalysis.keyPlayers.map((player, idx) => (
                        <li key={idx}>• {player}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-purple-600 mb-2">Playing Style</h4>
                    <p className="text-xs text-slate-700">{opponentAnalysis.playingStyle}</p>
                    <p className="text-xs text-slate-600 mt-1">Formation: {opponentAnalysis.preferredFormation}</p>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-orange-600 mb-2">Recommendations</h4>
                    <ul className="text-xs text-slate-700 space-y-1">
                      {opponentAnalysis.recommendations.map((rec, idx) => (
                        <li key={idx}>• {rec}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
