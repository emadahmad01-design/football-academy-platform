import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { 
  Play, 
  Pause, 
  RotateCcw,
  Users,
  Target,
  TrendingUp,
  Shield,
  Swords,
  Activity,
  AlertTriangle,
  Maximize2,
  BookOpen,
  Download,
  Save,
  Layers,
  Camera,
  Gauge
} from 'lucide-react';
import { RealisticPlayer3D } from '@/components/RealisticPlayer3D';
import { toast } from 'sonner';
import { trpc } from '../lib/trpc';

const createRealisticPlayer = (color: number, number: number, name: string) => {
  const player = new RealisticPlayer3D({
    position: [0, 0, 0],
    jerseyNumber: number,
    teamColor: `#${color.toString(16).padStart(6, '0')}`,
    name
  });
  return player.group;
};

type CameraView = 'top' | 'side' | 'tactical';
type PlanningPhase = 'defense' | 'transition' | 'attack';
type TeamShape = 'compact' | 'stretched' | 'balanced';

// Player type
interface Player {
  id: number;
  name: string;
  number: number;
  team: 'home' | 'away';
  position: string;
  x: number;
  y: number;
  marking?: number | null;
  role: 'defender' | 'midfielder' | 'forward' | 'goalkeeper';
  mesh?: THREE.Group;
  speed?: number;
  instruction?: string;
}

interface MovementKeyframe {
  time: number;
  positions: Map<number, { x: number; y: number }>;
  phase?: PlanningPhase;
}

interface TeamShapeMetrics {
  shape: TeamShape;
  width: number;
  compactness: number;
  defensiveLineHeight: number;
  averagePosition: { x: number; y: number };
}

// Formation preset
interface Formation {
  name: string;
  positions: { x: number; y: number; role: string }[];
}

// Transition scenario
interface TransitionScenario {
  id: number;
  name: string;
  description: string;
  type: 'defense_to_attack' | 'attack_to_defense';
  keyPlayers: number[];
}

// AI Strategy Recommendation
interface StrategyRecommendation {
  id: number;
  name: string;
  type: 'defensive' | 'balanced' | 'offensive';
  formation: string;
  description: string;
  instructions: string[];
  markingAssignments: Array<{ homePlayer: number; awayPlayer: number }>;
  confidence: number;
}

// Formation presets
const FORMATIONS: Record<string, Formation> = {
  '4-4-2': {
    name: '4-4-2',
    positions: [
      { x: -45, y: 0, role: 'goalkeeper' },
      { x: -35, y: -20, role: 'defender' },
      { x: -35, y: -7, role: 'defender' },
      { x: -35, y: 7, role: 'defender' },
      { x: -35, y: 20, role: 'defender' },
      { x: -15, y: -20, role: 'midfielder' },
      { x: -15, y: -7, role: 'midfielder' },
      { x: -15, y: 7, role: 'midfielder' },
      { x: -15, y: 20, role: 'midfielder' },
      { x: 5, y: -10, role: 'forward' },
      { x: 5, y: 10, role: 'forward' },
    ]
  },
  '4-3-3': {
    name: '4-3-3',
    positions: [
      { x: -45, y: 0, role: 'goalkeeper' },
      { x: -35, y: -20, role: 'defender' },
      { x: -35, y: -7, role: 'defender' },
      { x: -35, y: 7, role: 'defender' },
      { x: -35, y: 20, role: 'defender' },
      { x: -15, y: -12, role: 'midfielder' },
      { x: -15, y: 0, role: 'midfielder' },
      { x: -15, y: 12, role: 'midfielder' },
      { x: 5, y: -15, role: 'forward' },
      { x: 5, y: 0, role: 'forward' },
      { x: 5, y: 15, role: 'forward' },
    ]
  },
  '3-5-2': {
    name: '3-5-2',
    positions: [
      { x: -45, y: 0, role: 'goalkeeper' },
      { x: -35, y: -15, role: 'defender' },
      { x: -35, y: 0, role: 'defender' },
      { x: -35, y: 15, role: 'defender' },
      { x: -15, y: -20, role: 'midfielder' },
      { x: -15, y: -10, role: 'midfielder' },
      { x: -15, y: 0, role: 'midfielder' },
      { x: -15, y: 10, role: 'midfielder' },
      { x: -15, y: 20, role: 'midfielder' },
      { x: 5, y: -10, role: 'forward' },
      { x: 5, y: 10, role: 'forward' },
    ]
  },
  '4-5-1': {
    name: '4-5-1',
    positions: [
      { x: -45, y: 0, role: 'goalkeeper' },
      { x: -35, y: -20, role: 'defender' },
      { x: -35, y: -7, role: 'defender' },
      { x: -35, y: 7, role: 'defender' },
      { x: -35, y: 20, role: 'defender' },
      { x: -15, y: -20, role: 'midfielder' },
      { x: -15, y: -10, role: 'midfielder' },
      { x: -15, y: 0, role: 'midfielder' },
      { x: -15, y: 10, role: 'midfielder' },
      { x: -15, y: 20, role: 'midfielder' },
      { x: 5, y: 0, role: 'forward' },
    ]
  },
  '4-2-3-1': {
    name: '4-2-3-1',
    positions: [
      { x: -45, y: 0, role: 'goalkeeper' },
      { x: -35, y: -20, role: 'defender' },
      { x: -35, y: -7, role: 'defender' },
      { x: -35, y: 7, role: 'defender' },
      { x: -35, y: 20, role: 'defender' },
      { x: -25, y: -8, role: 'midfielder' },
      { x: -25, y: 8, role: 'midfielder' },
      { x: -10, y: -15, role: 'midfielder' },
      { x: -10, y: 0, role: 'midfielder' },
      { x: -10, y: 15, role: 'midfielder' },
      { x: 5, y: 0, role: 'forward' },
    ]
  },
  '4-3-2-1': {
    name: '4-3-2-1',
    positions: [
      { x: -45, y: 0, role: 'goalkeeper' },
      { x: -35, y: -20, role: 'defender' },
      { x: -35, y: -7, role: 'defender' },
      { x: -35, y: 7, role: 'defender' },
      { x: -35, y: 20, role: 'defender' },
      { x: -20, y: -12, role: 'midfielder' },
      { x: -20, y: 0, role: 'midfielder' },
      { x: -20, y: 12, role: 'midfielder' },
      { x: -5, y: -10, role: 'midfielder' },
      { x: -5, y: 10, role: 'midfielder' },
      { x: 5, y: 0, role: 'forward' },
    ]
  }
};

// Sample transition scenarios
const TRANSITION_SCENARIOS: TransitionScenario[] = [
  {
    id: 1,
    name: 'Counter Attack',
    description: 'Fast transition from defense to attack after winning the ball',
    type: 'defense_to_attack',
    keyPlayers: [6, 7, 9, 10]
  },
  {
    id: 2,
    name: 'High Press',
    description: 'Immediate pressure after losing possession',
    type: 'attack_to_defense',
    keyPlayers: [7, 8, 9, 10]
  },
  {
    id: 3,
    name: 'Wing Attack',
    description: 'Quick ball to wings for crossing opportunities',
    type: 'defense_to_attack',
    keyPlayers: [3, 5, 7, 11]
  }
];

// AI Strat// Tactical Video Library - Formation vs Formation
// Using verified working YouTube videos for tactical analysis
const TACTICAL_VIDEOS: Record<string, {src: string; title: string; description: string}> = {
  '4-4-2_vs_4-3-3': {
    src: 'https://www.youtube.com/embed/aW2NLCrPpQk',
    title: '4-4-2 vs 4-3-3 Tactical Analysis',
    description: 'How 4-4-2 defends against 4-3-3 wingers and exploits central midfield'
  },
  '4-3-3_vs_4-4-2': {
    src: 'https://www.youtube.com/embed/aW2NLCrPpQk',
    title: '4-3-3 vs 4-4-2 Tactical Analysis',
    description: 'How 4-3-3 uses width to stretch 4-4-2 and create overloads'
  },
  '4-3-3_vs_4-3-3': {
    src: 'https://www.youtube.com/embed/aW2NLCrPpQk',
    title: '4-3-3 vs 4-3-3 Mirror Match',
    description: 'Tactical battle between identical formations'
  },
  '4-4-2_vs_4-4-2': {
    src: 'https://www.youtube.com/embed/aW2NLCrPpQk',
    title: '4-4-2 vs 4-4-2 Classic Battle',
    description: 'Traditional 4-4-2 mirror match tactics'
  },
  '4-2-3-1_vs_4-3-3': {
    src: 'https://www.youtube.com/embed/5nF20bW_kBA',
    title: '4-2-3-1 vs 4-3-3 Analysis',
    description: 'How 4-2-3-1 controls midfield against 4-3-3'
  },
  '4-3-3_vs_4-2-3-1': {
    src: 'https://www.youtube.com/embed/5nF20bW_kBA',
    title: '4-3-3 vs 4-2-3-1 Analysis',
    description: 'How 4-3-3 presses 4-2-3-1 high up the pitch'
  },
  '3-5-2_vs_4-3-3': {
    src: 'https://www.youtube.com/embed/AUWZ7qiAiKM',
    title: '3-5-2 vs 4-3-3 Tactical Battle',
    description: 'How 3-5-2 wing-backs counter 4-3-3 wingers'
  },
  '4-5-1_vs_4-4-2': {
    src: 'https://www.youtube.com/embed/aW2NLCrPpQk',
    title: '4-5-1 Defensive Setup vs 4-4-2',
    description: 'How 4-5-1 absorbs pressure and counters 4-4-2'
  },
  '5-4-1_vs_4-3-3': {
    src: 'https://www.youtube.com/embed/aW2NLCrPpQk',
    title: '5-4-1 Deep Block vs 4-3-3',
    description: 'How 5-4-1 defends narrow and counters quickly'
  },
  // Default fallback
  'default': {
    src: 'https://www.youtube.com/embed/aW2NLCrPpQk',
    title: 'General Tactical Analysis',
    description: 'Understanding formation matchups and tactical principles'
  }
};

// AI Strategy Recommendations
const AI_STRATEGIES: StrategyRecommendation[] = [
  {
    id: 1,
    name: 'Defensive Counter-Attack',
    type: 'defensive',
    formation: '4-5-1',
    description: 'Absorb pressure with deep defensive block and exploit space on counter-attacks',
    instructions: [
      'Maintain compact defensive shape',
      'Quick transitions through central midfield',
      'Exploit opponent\'s high defensive line with long balls',
      'Wingers stay wide to stretch play on counter'
    ],
    markingAssignments: [
      { homePlayer: 6, awayPlayer: 10 },
      { homePlayer: 7, awayPlayer: 7 },
      { homePlayer: 9, awayPlayer: 9 }
    ],
    confidence: 85
  },
  {
    id: 2,
    name: 'Balanced Possession',
    type: 'balanced',
    formation: '4-3-3',
    description: 'Control midfield and build attacks patiently while maintaining defensive solidity',
    instructions: [
      'Dominate midfield with numerical superiority',
      'Build from the back with short passes',
      'Wingers provide width and cutting inside options',
      'Press intelligently when losing possession'
    ],
    markingAssignments: [
      { homePlayer: 6, awayPlayer: 8 },
      { homePlayer: 8, awayPlayer: 10 },
      { homePlayer: 10, awayPlayer: 7 }
    ],
    confidence: 78
  },
  {
    id: 3,
    name: 'High-Intensity Press',
    type: 'offensive',
    formation: '4-2-3-1',
    description: 'Aggressive high press to win ball in opponent\'s half and create quick scoring chances',
    instructions: [
      'Press aggressively from the front',
      'Force opponent into mistakes in their half',
      'Quick combination play in final third',
      'Exploit weak aerial defense with crosses'
    ],
    markingAssignments: [
      { homePlayer: 9, awayPlayer: 5 },
      { homePlayer: 10, awayPlayer: 6 },
      { homePlayer: 7, awayPlayer: 3 }
    ],
    confidence: 72
  }
];

export default function TacticalSimulation() {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const offsideLineRef = useRef<THREE.Line | null>(null);
  const defensiveLineRef = useRef<THREE.Line | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const markingLinesRef = useRef<THREE.Line[]>([]);

  const [homeFormation, setHomeFormation] = useState('4-4-2');
  const [awayFormation, setAwayFormation] = useState('4-3-3');
  const [homePlayers, setHomePlayers] = useState<Player[]>([]);
  const [awayPlayers, setAwayPlayers] = useState<Player[]>([]);
  const [tacticalVideo, setTacticalVideo] = useState<{src: string; title: string; description: string} | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<TransitionScenario | null>(null);
  const [selectedStrategy, setSelectedStrategy] = useState<StrategyRecommendation | null>(null);
  const [showMarkingLines, setShowMarkingLines] = useState(true);
  const [opponentData, setOpponentData] = useState<any>(null);
  const [homeTeamName, setHomeTeamName] = useState('Your Team');
  const [awayTeamName, setAwayTeamName] = useState('Opponent Team');
  
  // Animation states
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(15);
  const [keyframes, setKeyframes] = useState<MovementKeyframe[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  
  // Advanced features
  const [showCollisionWarnings, setShowCollisionWarnings] = useState(true);
  const [collisions, setCollisions] = useState<string[]>([]);
  const [showTeamShape, setShowTeamShape] = useState(false);
  const [teamShapeMetrics, setTeamShapeMetrics] = useState<TeamShapeMetrics | null>(null);
  const [showOffsideLine, setShowOffsideLine] = useState(false);
  const [showDefensiveLine, setShowDefensiveLine] = useState(false);
  const [cameraView, setCameraView] = useState<CameraView>('tactical');
  const [currentPhase, setCurrentPhase] = useState<PlanningPhase>('defense');
  const [showPlayerInstructions, setShowPlayerInstructions] = useState(false);
  const [showAIAdvice, setShowAIAdvice] = useState(false);
  const [aiAdviceText, setAiAdviceText] = useState('');
  
  // Drawing tools state
  const [drawingMode, setDrawingMode] = useState<'none' | 'line' | 'arrow' | 'path'>('none');
  const [drawingColor, setDrawingColor] = useState('#FFFF00');
  const [drawings, setDrawings] = useState<THREE.Object3D[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingPoints, setDrawingPoints] = useState<THREE.Vector3[]>([]);

  // AI Coach mutation
  const aiCoachMutation = trpc.aiCoach.askQuestion.useMutation();

  // Update tactical video when formations change
  useEffect(() => {
    const videoKey = `${homeFormation}_vs_${awayFormation}`;
    const video = TACTICAL_VIDEOS[videoKey] || TACTICAL_VIDEOS['default'];
    setTacticalVideo(video);
    toast.info(`Tactical Analysis: ${video.title}`);
  }, [homeFormation, awayFormation]);

  // Load opponent analysis from sessionStorage
  useEffect(() => {
    const storedAnalysis = sessionStorage.getItem('opponentAnalysis');
    if (storedAnalysis) {
      try {
        const analysis = JSON.parse(storedAnalysis);
        setOpponentData(analysis);
        if (analysis.formation) {
          const formationKey = Object.keys(FORMATIONS).find(key => 
            key === analysis.formation || FORMATIONS[key].name === analysis.formation
          );
          if (formationKey) {
            setAwayFormation(formationKey);
          }
        }
        toast.success('Opponent analysis loaded successfully!');
        sessionStorage.removeItem('opponentAnalysis');
      } catch (error) {
        console.error('Failed to load opponent analysis:', error);
      }
    }
  }, []);

  // Calculate team shape metrics
  useEffect(() => {
    if (homePlayers.length === 0) return;

    const defenders = homePlayers.filter(p => p.role === 'defender');
    const allFieldPlayers = homePlayers.filter(p => p.role !== 'goalkeeper');

    if (allFieldPlayers.length === 0) return;

    const yPositions = allFieldPlayers.map(p => p.y);
    const width = Math.max(...yPositions) - Math.min(...yPositions);

    let totalDistance = 0;
    let count = 0;
    for (let i = 0; i < allFieldPlayers.length; i++) {
      for (let j = i + 1; j < allFieldPlayers.length; j++) {
        const p1 = allFieldPlayers[i];
        const p2 = allFieldPlayers[j];
        const dist = Math.sqrt(
          Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2)
        );
        totalDistance += dist;
        count++;
      }
    }
    const avgDistance = count > 0 ? totalDistance / count : 0;

    const defensiveLineHeight = defenders.length > 0
      ? defenders.reduce((sum, p) => sum + p.x, 0) / defenders.length
      : 0;

    const avgX = allFieldPlayers.reduce((sum, p) => sum + p.x, 0) / allFieldPlayers.length;
    const avgY = allFieldPlayers.reduce((sum, p) => sum + p.y, 0) / allFieldPlayers.length;

    let shape: TeamShape = 'balanced';
    if (width < 30 && avgDistance < 15) {
      shape = 'compact';
    } else if (width > 45 || avgDistance > 20) {
      shape = 'stretched';
    }

    setTeamShapeMetrics({
      shape,
      width,
      compactness: avgDistance,
      defensiveLineHeight,
      averagePosition: { x: avgX, y: avgY }
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
          Math.pow(p1.x - p2.x, 2) +
          Math.pow(p1.y - p2.y, 2)
        );

        if (dist < collisionDistance) {
          newCollisions.push(`${p1.name} & ${p2.name} too close (${dist.toFixed(1)}m)`);
        }
      }
    }

    setCollisions(newCollisions);
  }, [homePlayers, awayPlayers, showCollisionWarnings, currentTime]);

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
    camera.position.set(0, 50, 60);
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
    controls.minDistance = 30;
    controls.maxDistance = 100;
    controlsRef.current = controls;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(20, 40, 20);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.left = -60;
    directionalLight.shadow.camera.right = 60;
    directionalLight.shadow.camera.top = 60;
    directionalLight.shadow.camera.bottom = -60;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    createPitch(scene);
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
      playerMesh.position.set(player.x, 0, player.y);
      playerMesh.castShadow = true;
      playerMesh.userData = { player };
      scene.add(playerMesh);
      player.mesh = playerMesh;
    });

    // Initialize keyframes
    const initialKeyframe: MovementKeyframe = {
      time: 0,
      positions: new Map(),
      phase: 'defense'
    };
    
    [...homePlayers, ...awayPlayers].forEach(player => {
      initialKeyframe.positions.set(player.id, { x: player.x, y: player.y });
    });
    
    // Generate automatic keyframes for realistic movement simulation
    const midKeyframe: MovementKeyframe = { time: 7.5, positions: new Map(), phase: 'transition' };
    const endKeyframe: MovementKeyframe = { time: 15, positions: new Map(), phase: 'attack' };
    
    [...homePlayers, ...awayPlayers].forEach(player => {
      // Mid-game positions (transition phase)
      const midX = player.x + (player.team === 'home' ? 15 : -15) * (player.role === 'forward' ? 1 : 0.5);
      const midY = player.y + (Math.random() - 0.5) * 10;
      midKeyframe.positions.set(player.id, { x: midX, y: midY });
      
      // End positions (attack phase)
      const endX = player.x + (player.team === 'home' ? 25 : -25) * (player.role === 'forward' ? 1.2 : 0.7);
      const endY = player.y + (Math.random() - 0.5) * 15;
      endKeyframe.positions.set(player.id, { x: endX, y: endY });
    });
    
    setKeyframes([initialKeyframe, midKeyframe, endKeyframe]);

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
    
    // Add click listener for drawing tools
    const canvasElement = renderer.domElement;
    const clickHandler = handleCanvasClick as any;
    canvasElement.addEventListener('click', clickHandler);

    return () => {
      canvasElement.removeEventListener('click', clickHandler);
      window.removeEventListener('resize', handleResize);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [homeFormation, awayFormation]);

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

  // Update marking lines
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    
    // Clear existing marking lines
    markingLinesRef.current.forEach(line => {
      scene.remove(line);
    });
    markingLinesRef.current = [];

    if (!showMarkingLines || !selectedStrategy) return;

    // Draw marking lines based on strategy
    selectedStrategy.markingAssignments.forEach(assignment => {
      const homePlayer = homePlayers.find(p => p.id === assignment.homePlayer);
      const awayPlayer = awayPlayers.find(p => p.id === assignment.awayPlayer);

      if (homePlayer && awayPlayer) {
        const points = [
          new THREE.Vector3(homePlayer.x, 0.5, homePlayer.y),
          new THREE.Vector3(awayPlayer.x, 0.5, awayPlayer.y)
        ];
        const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
        const lineMaterial = new THREE.LineBasicMaterial({ 
          color: 0xffff00, 
          linewidth: 2,
          transparent: true,
          opacity: 0.6
        });
        const line = new THREE.Line(lineGeometry, lineMaterial);
        scene.add(line);
        markingLinesRef.current.push(line);
      }
    });
  }, [showMarkingLines, selectedStrategy, homePlayers, awayPlayers]);

  const createPitch = (scene: THREE.Scene) => {
    const groundGeometry = new THREE.PlaneGeometry(110, 70);
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

    // Boundary
    const boundaryPoints = [
      new THREE.Vector3(-55, 0.1, -35),
      new THREE.Vector3(55, 0.1, -35),
      new THREE.Vector3(55, 0.1, 35),
      new THREE.Vector3(-55, 0.1, 35),
      new THREE.Vector3(-55, 0.1, -35)
    ];
    const boundaryGeometry = new THREE.BufferGeometry().setFromPoints(boundaryPoints);
    const boundary = new THREE.Line(boundaryGeometry, lineMaterial);
    scene.add(boundary);

    // Center line
    const centerLinePoints = [
      new THREE.Vector3(0, 0.1, -35),
      new THREE.Vector3(0, 0.1, 35)
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

    // Goals
    [-1, 1].forEach(side => {
      const xPos = side * 55;
      
      const goalAreaPoints = [
        new THREE.Vector3(xPos, 0.1, -9.16),
        new THREE.Vector3(xPos - side * 5.5, 0.1, -9.16),
        new THREE.Vector3(xPos - side * 5.5, 0.1, 9.16),
        new THREE.Vector3(xPos, 0.1, 9.16)
      ];
      const goalAreaGeometry = new THREE.BufferGeometry().setFromPoints(goalAreaPoints);
      const goalArea = new THREE.Line(goalAreaGeometry, lineMaterial);
      scene.add(goalArea);

      const penaltyAreaPoints = [
        new THREE.Vector3(xPos, 0.1, -20.16),
        new THREE.Vector3(xPos - side * 16.5, 0.1, -20.16),
        new THREE.Vector3(xPos - side * 16.5, 0.1, 20.16),
        new THREE.Vector3(xPos, 0.1, 20.16)
      ];
      const penaltyAreaGeometry = new THREE.BufferGeometry().setFromPoints(penaltyAreaPoints);
      const penaltyArea = new THREE.Line(penaltyAreaGeometry, lineMaterial);
      scene.add(penaltyArea);
    });
  };

  const createOffsideLine = (scene: THREE.Scene) => {
    const lineGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0.2, -35),
      new THREE.Vector3(0, 0.2, 35)
    ]);
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 3 });
    const line = new THREE.Line(lineGeometry, lineMaterial);
    line.visible = false;
    scene.add(line);
    offsideLineRef.current = line;
  };

  const createDefensiveLine = (scene: THREE.Scene) => {
    const lineGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0.2, -35),
      new THREE.Vector3(0, 0.2, 35)
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
      .filter(p => p.role === 'defender')
      .sort((a, b) => a.x - b.x);
    
    if (defenders.length >= 2) {
      const xPos = defenders[1].x;
      offsideLineRef.current.position.x = xPos;
      offsideLineRef.current.visible = showOffsideLine;
    }
  };

  const updateDefensiveLine = () => {
    if (!defensiveLineRef.current) return;
    
    const defenders = homePlayers.filter(p => p.role === 'defender');
    
    if (defenders.length > 0) {
      const avgX = defenders.reduce((sum, p) => sum + p.x, 0) / defenders.length;
      defensiveLineRef.current.position.x = avgX;
      defensiveLineRef.current.visible = showDefensiveLine;
    }
  };

  const createTeamPlayers = (team: 'home' | 'away', formation: string): Player[] => {
    const players: Player[] = [];
    const xOffset = team === 'home' ? -1 : 1;
    
    const formationData = FORMATIONS[formation];
    if (!formationData) return players;

    formationData.positions.forEach((pos, index) => {
      const instruction = pos.role === 'goalkeeper' ? 'Organize defense' :
                         pos.role === 'defender' ? 'Hold position, cover space' :
                         pos.role === 'midfielder' ? 'Link play, support attack' :
                         'Press high, make runs';

      players.push({
        id: index + 1 + (team === 'away' ? 100 : 0),
        name: `${team === 'home' ? 'H' : 'A'}${index + 1}`,
        number: index + 1,
        team,
        position: pos.role,
        x: pos.x * xOffset,
        y: pos.y,
        role: pos.role as any,
        instruction
      });
    });

    return players;
  };

  const recordKeyframe = () => {
    const newKeyframe: MovementKeyframe = {
      time: currentTime,
      positions: new Map(),
      phase: currentPhase
    };
    
    [...homePlayers, ...awayPlayers].forEach(player => {
      newKeyframe.positions.set(player.id, { x: player.x, y: player.y });
    });
    
    setKeyframes(prev => [...prev, newKeyframe].sort((a, b) => a.time - b.time));
    toast.success('Keyframe recorded!');
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

        player.mesh.position.set(x, 0, y);
        player.x = x;
        player.y = y;
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
        camera.position.set(0, 80, 0);
        camera.lookAt(0, 0, 0);
        break;
      case 'side':
        camera.position.set(80, 30, 0);
        camera.lookAt(0, 0, 0);
        break;
      case 'tactical':
        camera.position.set(0, 50, 60);
        camera.lookAt(0, 0, 0);
        break;
    }

    controls.update();
    setCameraView(view);
  };

  const applyStrategy = (strategy: StrategyRecommendation) => {
    setSelectedStrategy(strategy);
    setHomeFormation(strategy.formation);
    toast.success(`Applied strategy: ${strategy.name}`);
  };

  const exportAsImage = () => {
    if (!rendererRef.current) return;
    const dataURL = rendererRef.current.domElement.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `tactical-simulation-${Date.now()}.png`;
    link.href = dataURL;
    link.click();
    toast.success('Exported as image!');
  };

  // Drawing tool functions
  const handleCanvasClick = (event: MouseEvent) => {
    if (drawingMode === 'none' || !mountRef.current || !sceneRef.current || !cameraRef.current) return;
    
    const rect = mountRef.current.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);
    
    // Intersect with ground plane
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const point = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, point);
    
    if (point) {
      setDrawingPoints(prev => [...prev, point.clone()]);
      
      if (drawingMode === 'line' && drawingPoints.length === 1) {
        createLine(drawingPoints[0], point);
        setDrawingPoints([]);
      } else if (drawingMode === 'arrow' && drawingPoints.length === 1) {
        createArrow(drawingPoints[0], point);
        setDrawingPoints([]);
      }
    }
  };
  
  const createLine = (start: THREE.Vector3, end: THREE.Vector3) => {
    const scene = sceneRef.current;
    if (!scene) return;
    
    const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
    const material = new THREE.LineBasicMaterial({ color: drawingColor, linewidth: 3 });
    const line = new THREE.Line(geometry, material);
    line.position.y = 0.1;
    scene.add(line);
    setDrawings(prev => [...prev, line]);
    toast.success('Line drawn!');
  };
  
  const createArrow = (start: THREE.Vector3, end: THREE.Vector3) => {
    const scene = sceneRef.current;
    if (!scene) return;
    
    const direction = new THREE.Vector3().subVectors(end, start);
    const length = direction.length();
    const arrowHelper = new THREE.ArrowHelper(
      direction.normalize(),
      start,
      length,
      drawingColor,
      length * 0.2,
      length * 0.15
    );
    arrowHelper.position.y = 0.1;
    scene.add(arrowHelper);
    setDrawings(prev => [...prev, arrowHelper]);
    toast.success('Arrow drawn!');
  };
  
  const createPath = () => {
    const scene = sceneRef.current;
    if (!scene || drawingPoints.length < 2) return;
    
    const curve = new THREE.CatmullRomCurve3(drawingPoints);
    const points = curve.getPoints(50);
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color: drawingColor, linewidth: 3 });
    const path = new THREE.Line(geometry, material);
    path.position.y = 0.1;
    scene.add(path);
    setDrawings(prev => [...prev, path]);
    setDrawingPoints([]);
    toast.success('Path drawn!');
  };
  
  const clearDrawings = () => {
    const scene = sceneRef.current;
    if (!scene) return;
    
    drawings.forEach(drawing => {
      scene.remove(drawing);
      if (drawing instanceof THREE.Line) {
        drawing.geometry.dispose();
        (drawing.material as THREE.Material).dispose();
      }
    });
    setDrawings([]);
    setDrawingPoints([]);
    toast.success('Drawings cleared!');
  };

  const getAIAdvice = async () => {
    try {
      const context = `
        Home Formation: ${homeFormation}
        Away Formation: ${awayFormation}
        Selected Strategy: ${selectedStrategy?.name || 'None'}
        Selected Scenario: ${selectedScenario?.name || 'None'}
        Current Phase: ${currentPhase}
        Team Shape: ${teamShapeMetrics?.shape || 'Unknown'}
        Team Width: ${teamShapeMetrics?.width.toFixed(1)}m
        Collisions: ${collisions.length}
        Opponent: ${opponentData ? JSON.stringify(opponentData) : 'Unknown'}
      `;
      
      const result = await aiCoachMutation.mutateAsync({
        question: `As a professional football coach, analyze this tactical situation and provide specific advice on:
1. Best attacking patterns to exploit opponent weaknesses
2. Defensive positioning to counter opponent strengths
3. Key player instructions
4. Formation adjustments if needed

Tactical Context:
${context}`,
        context: 'tactical'
      });
      
      setAiAdviceText(result.answer);
      setShowAIAdvice(true);
      toast.success('AI Advice received!')
    } catch (error) {
      toast.error('Failed to get AI advice');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="container mx-auto">
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Enhanced Tactical Simulation</h1>
          <p className="text-slate-600">Advanced tactical planning with AI recommendations & real-time analysis</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Panel - Strategies & Scenarios */}
          <Card className="lg:col-span-1 p-4 max-h-[800px] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Target className="w-5 h-5" />
              AI Strategies
            </h3>
            
            <div className="space-y-3 mb-6">
              {AI_STRATEGIES.map((strategy: StrategyRecommendation) => (
                <button
                  key={strategy.id}
                  onClick={() => applyStrategy(strategy)}
                  className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                    selectedStrategy?.id === strategy.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{strategy.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {strategy.confidence}%
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-600 mb-2">{strategy.description}</p>
                  <p className="text-xs text-slate-500">Formation: {strategy.formation}</p>
                </button>
              ))}
            </div>

            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Scenarios
            </h3>
            
            <div className="space-y-2">
              {TRANSITION_SCENARIOS.map(scenario => (
                <button
                  key={scenario.id}
                  onClick={() => setSelectedScenario(scenario)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    selectedScenario?.id === scenario.id
                      ? 'border-green-500 bg-green-50'
                      : 'border-slate-200 hover:border-green-300'
                  }`}
                >
                  <div className="font-medium text-sm mb-1">{scenario.name}</div>
                  <p className="text-xs text-slate-600">{scenario.description}</p>
                </button>
              ))}
            </div>

            <div className="mt-6 space-y-2">
              <Button
                className="w-full"
                variant={isRecording ? 'default' : 'outline'}
                size="sm"
                onClick={() => setIsRecording(!isRecording)}
              >
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

          {/* Center Panel - 3D View */}
          <Card className="lg:col-span-2 p-6">
            {/* Tactical Video Player */}
            {tacticalVideo && (
              <Card className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
                <div className="flex items-center gap-2 mb-2">
                  <Play className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100">{tacticalVideo.title}</h3>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">{tacticalVideo.description}</p>
                <div className="relative" style={{ paddingBottom: '56.25%', height: 0 }}>
                  <iframe
                    src={tacticalVideo.src}
                    title={tacticalVideo.title}
                    className="absolute top-0 left-0 w-full h-full rounded-lg"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </Card>
            )}

            {/* Drawing Tools */}
            <Card className="mb-4 p-4 bg-slate-50">
              <h3 className="text-sm font-semibold mb-3">Drawing Tools</h3>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant={drawingMode === 'line' ? 'default' : 'outline'}
                  onClick={() => setDrawingMode(drawingMode === 'line' ? 'none' : 'line')}
                >
                  Line
                </Button>
                <Button
                  size="sm"
                  variant={drawingMode === 'arrow' ? 'default' : 'outline'}
                  onClick={() => setDrawingMode(drawingMode === 'arrow' ? 'none' : 'arrow')}
                >
                  Arrow
                </Button>
                <Button
                  size="sm"
                  variant={drawingMode === 'path' ? 'default' : 'outline'}
                  onClick={() => setDrawingMode(drawingMode === 'path' ? 'none' : 'path')}
                >
                  Path
                </Button>
                {drawingMode === 'path' && drawingPoints.length >= 2 && (
                  <Button size="sm" variant="default" onClick={createPath}>
                    Finish Path
                  </Button>
                )}
                <div className="flex items-center gap-2">
                  <label className="text-xs">Color:</label>
                  <input
                    type="color"
                    value={drawingColor}
                    onChange={(e) => setDrawingColor(e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer"
                  />
                </div>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={clearDrawings}
                  disabled={drawings.length === 0}
                >
                  Clear All
                </Button>
              </div>
            </Card>

            <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
              <div>
                <h2 className="text-xl font-semibold">Tactical Board</h2>
                <p className="text-xs text-slate-600">
                  {homeTeamName} vs {awayTeamName}
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" size="sm" onClick={getAIAdvice}>
                  <Target className="w-4 h-4 mr-1" /> AI Advice
                </Button>
                <Button variant="outline" size="sm" onClick={exportAsImage}>
                  <Download className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div 
              ref={mountRef} 
              className="w-full bg-slate-900 rounded-lg overflow-hidden"
              style={{ height: '500px' }}
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
                <span className="text-sm font-mono">{currentTime.toFixed(1)}s</span>
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

            {/* Advanced Analysis Features */}
            <div className="mt-4 flex gap-2 flex-wrap">
              <Button
                variant={showMarkingLines ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowMarkingLines(!showMarkingLines)}
              >
                <Users className="w-4 h-4 mr-1" /> Marking
              </Button>
              <Button
                variant={showOffsideLine ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setShowOffsideLine(!showOffsideLine);
                  updateOffsideLine();
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

            {/* Selected Strategy Instructions */}
            {selectedStrategy && (
              <Card className="mt-4 p-4 bg-blue-50 border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2">{selectedStrategy.name}</h4>
                <p className="text-sm text-blue-800 mb-3">{selectedStrategy.description}</p>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-blue-900">Key Instructions:</p>
                  {selectedStrategy.instructions.map((instruction, idx) => (
                    <p key={idx} className="text-xs text-blue-800">• {instruction}</p>
                  ))}
                </div>
              </Card>
            )}
          </Card>

          {/* Right Panel - Team Setup & Analysis */}
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
            ) : (
              <>
                <h3 className="text-lg font-semibold mb-4">Team Setup</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Team Name</label>
                    <Input
                      value={homeTeamName}
                      onChange={(e) => setHomeTeamName(e.target.value)}
                      placeholder="Your Team"
                      className="text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-blue-600 mb-2 block">
                      Your Formation
                    </label>
                    <Select value={homeFormation} onValueChange={setHomeFormation}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(FORMATIONS).map(formation => (
                          <SelectItem key={formation} value={formation}>
                            {formation}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Opponent Name</label>
                    <Input
                      value={awayTeamName}
                      onChange={(e) => setAwayTeamName(e.target.value)}
                      placeholder="Opponent Team"
                      className="text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-red-600 mb-2 block">
                      Opponent Formation
                    </label>
                    <Select value={awayFormation} onValueChange={setAwayFormation}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(FORMATIONS).map(formation => (
                          <SelectItem key={formation} value={formation}>
                            {formation}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {opponentData && (
                    <Card className="p-3 bg-orange-50 border-orange-200">
                      <h4 className="font-semibold text-orange-900 mb-2 text-sm">
                        Opponent Analysis
                      </h4>
                      <div className="space-y-2 text-xs">
                        <div>
                          <p className="font-medium text-orange-800">Strengths:</p>
                          <p className="text-orange-700">{opponentData.strengths?.join(', ')}</p>
                        </div>
                        <div>
                          <p className="font-medium text-orange-800">Weaknesses:</p>
                          <p className="text-orange-700">{opponentData.weaknesses?.join(', ')}</p>
                        </div>
                      </div>
                    </Card>
                  )}

                  <div className="pt-4 border-t">
                    <h4 className="text-sm font-semibold mb-2">Advanced Features</h4>
                    <ul className="text-xs text-slate-600 space-y-1">
                      <li>✅ AI Strategy Recommendations</li>
                      <li>✅ Opponent Analysis Integration</li>
                      <li>✅ Marking Lines System</li>
                      <li>✅ Animation & Keyframes</li>
                      <li>✅ Collision Detection</li>
                      <li>✅ Team Shape Analysis</li>
                      <li>✅ Defensive/Offside Lines</li>
                      <li>✅ Multi-Phase Planning</li>
                      <li>✅ Player Instructions</li>
                      <li>✅ Multiple Camera Angles</li>
                      <li>✅ Transition Scenarios</li>
                      <li>✅ Real-time Metrics</li>
                    </ul>
                  </div>
                </div>
              </>
            )}
          </Card>
        </div>
      </div>

      {/* AI Advice Dialog */}
      <Dialog open={showAIAdvice} onOpenChange={setShowAIAdvice}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-600" />
              AI Coach Tactical Advice
            </DialogTitle>
            <DialogDescription>
              Professional analysis based on current formations and tactical situation
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            {aiCoachMutation.isPending ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-slate-600">Analyzing tactical situation...</span>
              </div>
            ) : (
              <div className="prose prose-sm max-w-none">
                <div className="whitespace-pre-wrap text-slate-700 leading-relaxed">
                  {aiAdviceText}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
