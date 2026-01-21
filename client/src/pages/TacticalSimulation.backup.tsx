import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { 
  Play, 
  Pause, 
  RotateCcw,
  Users,
  Target,
  TrendingUp,
  Shield,
  Swords
} from 'lucide-react';
import { RealisticPlayer3D } from '@/components/RealisticPlayer3D';
import { toast } from 'sonner';

// Player type
interface Player {
  id: number;
  name: string;
  number: number;
  team: 'home' | 'away';
  position: string;
  x: number;
  y: number;
  marking?: number | null; // ID of opponent player to mark
  role: 'defender' | 'midfielder' | 'forward' | 'goalkeeper';
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
  confidence: number; // 0-100
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

// AI Strategy Recommendations (sample data - will be generated by AI based on opponent)
const STRATEGY_RECOMMENDATIONS: StrategyRecommendation[] = [
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
  const sceneRef = useRef<THREE.Scene | undefined>(undefined);
  const cameraRef = useRef<THREE.PerspectiveCamera | undefined>(undefined);
  const rendererRef = useRef<THREE.WebGLRenderer | undefined>(undefined);
  const controlsRef = useRef<OrbitControls | undefined>(undefined);
  const homePlayersRef = useRef<THREE.Group[]>([]);
  const awayPlayersRef = useRef<THREE.Group[]>([]);
  const markingLinesRef = useRef<THREE.Line[]>([]);
  const arrowsRef = useRef<THREE.ArrowHelper[]>([]);
  const zonesRef = useRef<THREE.Mesh[]>([]);
  const pathsRef = useRef<THREE.Line[]>([]);

  const [homeFormation, setHomeFormation] = useState('4-4-2');
  const [awayFormation, setAwayFormation] = useState('4-3-3');
  const [homePlayers, setHomePlayers] = useState<Player[]>([]);
  const [awayPlayers, setAwayPlayers] = useState<Player[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<TransitionScenario | null>(null);
  const [showMarkingLines, setShowMarkingLines] = useState(true);
  const [opponentData, setOpponentData] = useState<any>(null);
  const [homeTeamName, setHomeTeamName] = useState('Your Team');
  const [awayTeamName, setAwayTeamName] = useState('Opponent Team');
  const animationFrameRef = useRef<number | undefined>(undefined);
  const simulationTimeRef = useRef<number>(0);

  // Load opponent analysis from sessionStorage if available
  useEffect(() => {
    const storedAnalysis = sessionStorage.getItem('opponentAnalysis');
    if (storedAnalysis) {
      try {
        const analysis = JSON.parse(storedAnalysis);
        setOpponentData(analysis);
        // Auto-set opponent formation if available
        if (analysis.formation) {
          const formationKey = Object.keys(FORMATIONS).find(key => 
            key === analysis.formation || FORMATIONS[key].name === analysis.formation
          );
          if (formationKey) {
            setAwayFormation(formationKey);
          }
        }
        toast.success('Opponent analysis loaded successfully!');
        // Clear after loading to avoid re-loading on refresh
        sessionStorage.removeItem('opponentAnalysis');
      } catch (error) {
        console.error('Failed to load opponent analysis:', error);
      }
    }
  }, []);

  // Initialize players from formation
  useEffect(() => {
    const homeFormationData = FORMATIONS[homeFormation];
    if (!homeFormationData) {
      console.error(`Formation ${homeFormation} not found, using default 4-4-2`);
      setHomeFormation('4-4-2');
      return;
    }
    const newHomePlayers: Player[] = homeFormationData.positions.map((pos, idx) => ({
      id: idx + 1,
      name: `Player ${idx + 1}`,
      number: idx + 1,
      team: 'home',
      position: pos.role,
      x: pos.x,
      y: pos.y,
      marking: null,
      role: pos.role as any
    }));
    setHomePlayers(newHomePlayers);
  }, [homeFormation]);

  useEffect(() => {
    const awayFormationData = FORMATIONS[awayFormation];
    if (!awayFormationData) {
      console.error(`Formation ${awayFormation} not found, using default 4-3-3`);
      setAwayFormation('4-3-3');
      return;
    }
    const newAwayPlayers: Player[] = awayFormationData.positions.map((pos, idx) => ({
      id: idx + 100,
      name: `Opponent ${idx + 1}`,
      number: idx + 1,
      team: 'away',
      position: pos.role,
      x: -pos.x, // Mirror for away team
      y: -pos.y,
      marking: null,
      role: pos.role as any
    }));
    setAwayPlayers(newAwayPlayers);
  }, [awayFormation]);

  // Create movement arrows for players
  const createMovementArrows = (scene: THREE.Scene) => {
    // Clear existing arrows
    arrowsRef.current.forEach(arrow => scene.remove(arrow));
    arrowsRef.current = [];

    if (!selectedScenario) return;

    const scenario = TRANSITION_SCENARIOS.find(s => s.id === selectedScenario.id);
    if (!scenario) return;

    // Create arrows for key players
    homePlayers.forEach((player, idx) => {
      if (scenario.keyPlayers.includes(player.number)) {
        const mesh = homePlayersRef.current[idx];
        if (mesh) {
          // Determine arrow direction based on scenario type
          const dir = new THREE.Vector3();
          if (scenario.type === 'defense_to_attack') {
            dir.set(0, 0, -1); // Forward (attacking)
          } else {
            dir.set(0, 0, 1); // Backward (defending)
          }
          
          const origin = new THREE.Vector3(mesh.position.x, 1, mesh.position.z);
          const length = 8;
          const color = scenario.type === 'defense_to_attack' ? 0x00ff00 : 0xff0000;
          
          const arrow = new THREE.ArrowHelper(dir, origin, length, color, 3, 2);
          scene.add(arrow);
          arrowsRef.current.push(arrow);
        }
      }
    });
  };

  // Create highlighted zones
  const createHighlightedZones = (scene: THREE.Scene) => {
    // Clear existing zones
    zonesRef.current.forEach(zone => scene.remove(zone));
    zonesRef.current = [];

    if (!selectedScenario) return;

    const scenario = TRANSITION_SCENARIOS.find(s => s.id === selectedScenario.id);
    if (!scenario) return;

    // Create pressing zone based on scenario
    const zoneGeometry = new THREE.CircleGeometry(15, 32);
    const zoneMaterial = new THREE.MeshBasicMaterial({
      color: scenario.type === 'defense_to_attack' ? 0x00ff00 : 0xff0000,
      transparent: true,
      opacity: 0.2,
      side: THREE.DoubleSide
    });
    
    const zone = new THREE.Mesh(zoneGeometry, zoneMaterial);
    zone.rotation.x = -Math.PI / 2;
    zone.position.y = 0.1;
    
    // Position zone based on scenario type
    if (scenario.type === 'defense_to_attack') {
      zone.position.z = -20; // Attacking third
    } else {
      zone.position.z = 20; // Defensive third
    }
    
    scene.add(zone);
    zonesRef.current.push(zone);
  };

  // Create movement paths
  const createMovementPaths = (scene: THREE.Scene) => {
    // Clear existing paths
    pathsRef.current.forEach(path => scene.remove(path));
    pathsRef.current = [];

    if (!selectedScenario) return;

    const scenario = TRANSITION_SCENARIOS.find(s => s.id === selectedScenario.id);
    if (!scenario) return;

    // Create path for key players
    homePlayers.forEach((player, idx) => {
      if (scenario.keyPlayers.includes(player.number)) {
        const points = [];
        const startZ = player.y;
        const endZ = scenario.type === 'defense_to_attack' ? startZ - 30 : startZ + 30;
        
        // Create curved path
        for (let i = 0; i <= 20; i++) {
          const t = i / 20;
          const x = player.x + Math.sin(t * Math.PI) * 5;
          const z = startZ + (endZ - startZ) * t;
          points.push(new THREE.Vector3(x, 0.5, z));
        }
        
        const pathGeometry = new THREE.BufferGeometry().setFromPoints(points);
        const pathMaterial = new THREE.LineBasicMaterial({
          color: scenario.type === 'defense_to_attack' ? 0x00ff00 : 0xff0000,
          linewidth: 3,
          transparent: true,
          opacity: 0.6
        });
        
        const path = new THREE.Line(pathGeometry, pathMaterial);
        scene.add(path);
        pathsRef.current.push(path);
      }
    });
  };

  // Update visualizations when scenario changes
  useEffect(() => {
    if (sceneRef.current && selectedScenario) {
      createMovementArrows(sceneRef.current);
      createHighlightedZones(sceneRef.current);
      createMovementPaths(sceneRef.current);
    } else if (sceneRef.current) {
      // Clear visualizations when no scenario selected
      arrowsRef.current.forEach(arrow => sceneRef.current!.remove(arrow));
      zonesRef.current.forEach(zone => sceneRef.current!.remove(zone));
      pathsRef.current.forEach(path => sceneRef.current!.remove(path));
      arrowsRef.current = [];
      zonesRef.current = [];
      pathsRef.current = [];
    }
  }, [selectedScenario, homePlayers]);

  // Simulation animation loop
  useEffect(() => {
    if (!isSimulating || !sceneRef.current) return;

    const animate = () => {
      simulationTimeRef.current += 0.016; // ~60fps
      const time = simulationTimeRef.current;

      // Animate players based on selected scenario or default movement
      if (selectedScenario) {
        // Execute scenario-specific movements
        const scenario = TRANSITION_SCENARIOS.find(s => s.id === selectedScenario.id);
        if (scenario) {
          // Simulate player movements for the scenario
          homePlayers.forEach((player, idx) => {
            if (scenario.keyPlayers.includes(player.number)) {
              // Key players move more dynamically
              const mesh = homePlayersRef.current[idx];
              if (mesh) {
                const amplitude = 5;
                const speed = 2;
                mesh.position.x = player.x + Math.sin(time * speed) * amplitude;
                mesh.position.z = player.y + Math.cos(time * speed) * amplitude * 0.5;
                
                // Update arrow position to follow player
                const arrowIdx = scenario.keyPlayers.indexOf(player.number);
                if (arrowIdx >= 0 && arrowsRef.current[arrowIdx]) {
                  arrowsRef.current[arrowIdx].position.set(
                    mesh.position.x,
                    1,
                    mesh.position.z
                  );
                }
              }
            }
          });
        }
      } else {
        // Default simulation: subtle movement to show activity
        homePlayers.forEach((player, idx) => {
          const mesh = homePlayersRef.current[idx];
          if (mesh) {
            const amplitude = 2;
            const speed = 1 + idx * 0.1;
            mesh.position.x = player.x + Math.sin(time * speed) * amplitude;
            mesh.position.z = player.y + Math.cos(time * speed + idx) * amplitude;
          }
        });

        awayPlayers.forEach((player, idx) => {
          const mesh = awayPlayersRef.current[idx];
          if (mesh) {
            const amplitude = 2;
            const speed = 1 + idx * 0.1;
            mesh.position.x = player.x + Math.sin(time * speed + Math.PI) * amplitude;
            mesh.position.z = player.y + Math.cos(time * speed + idx + Math.PI) * amplitude;
          }
        });
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isSimulating, selectedScenario, homePlayers, awayPlayers]);

  // Reset simulation time when stopped
  useEffect(() => {
    if (!isSimulating) {
      simulationTimeRef.current = 0;
      // Reset player positions
      homePlayers.forEach((player, idx) => {
        const mesh = homePlayersRef.current[idx];
        if (mesh) {
          mesh.position.x = player.x;
          mesh.position.z = player.y;
        }
      });
      awayPlayers.forEach((player, idx) => {
        const mesh = awayPlayersRef.current[idx];
        if (mesh) {
          mesh.position.x = player.x;
          mesh.position.z = player.y;
        }
      });
    }
  }, [isSimulating, homePlayers, awayPlayers]);

  // Initialize Three.js scene
  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
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
    scene.add(directionalLight);

    // Create pitch
    createFootballPitch(scene);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
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

  // Update players when formations change
  useEffect(() => {
    if (!sceneRef.current) return;
    
    // Remove old players
    homePlayersRef.current.forEach(marker => sceneRef.current?.remove(marker));
    awayPlayersRef.current.forEach(marker => sceneRef.current?.remove(marker));
    homePlayersRef.current = [];
    awayPlayersRef.current = [];

    // Add home team players
    homePlayers.forEach(player => {
      const realisticPlayer = new RealisticPlayer3D({
        position: [player.x, 0, player.y],
        jerseyNumber: player.number,
        teamColor: '#0066ff', // Blue team
        name: player.name
      });
      
      realisticPlayer.group.userData.playerId = player.id;
      realisticPlayer.group.userData.team = 'home';
      sceneRef.current!.add(realisticPlayer.group);
      homePlayersRef.current.push(realisticPlayer.group);
    });

    // Add away team players
    awayPlayers.forEach(player => {
      const realisticPlayer = new RealisticPlayer3D({
        position: [player.x, 0, player.y],
        jerseyNumber: player.number,
        teamColor: '#ff0000', // Red team
        name: player.name
      });
      
      realisticPlayer.group.userData.playerId = player.id;
      realisticPlayer.group.userData.team = 'away';
      sceneRef.current!.add(realisticPlayer.group);
      awayPlayersRef.current.push(realisticPlayer.group);
    });

    updateMarkingLines();
  }, [homePlayers, awayPlayers]);

  // Update marking lines
  const updateMarkingLines = () => {
    if (!sceneRef.current) return;

    // Remove old lines
    markingLinesRef.current.forEach(line => sceneRef.current?.remove(line));
    markingLinesRef.current = [];

    if (!showMarkingLines) return;

    // Draw marking lines
    homePlayers.forEach(homePlayer => {
      if (homePlayer.marking) {
        const awayPlayer = awayPlayers.find(p => p.id === homePlayer.marking);
        if (awayPlayer) {
          const points = [
            new THREE.Vector3(homePlayer.x, 1, homePlayer.y),
            new THREE.Vector3(awayPlayer.x, 1, awayPlayer.y)
          ];
          const geometry = new THREE.BufferGeometry().setFromPoints(points);
          const material = new THREE.LineDashedMaterial({
            color: 0xffff00,
            dashSize: 2,
            gapSize: 1
          });
          const line = new THREE.Line(geometry, material);
          line.computeLineDistances();
          sceneRef.current!.add(line);
          markingLinesRef.current.push(line);
        }
      }
    });
  };

  useEffect(() => {
    updateMarkingLines();
  }, [showMarkingLines]);

  // Create football pitch
  const createFootballPitch = (scene: THREE.Scene) => {
    const pitchLength = 105;
    const pitchWidth = 68;

    // Grass
    const grassGeometry = new THREE.PlaneGeometry(pitchLength, pitchWidth);
    const grassMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x2d5016,
      roughness: 0.8
    });
    const grass = new THREE.Mesh(grassGeometry, grassMaterial);
    grass.rotation.x = -Math.PI / 2;
    grass.receiveShadow = true;
    scene.add(grass);

    // White lines
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 });

    // Boundary
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
  };

  // Assign marking
  const assignMarking = (homePlayerId: number, awayPlayerId: number) => {
    setHomePlayers(prev => prev.map(p => 
      p.id === homePlayerId ? { ...p, marking: awayPlayerId } : p
    ));
    updateMarkingLines();
    toast.success('Marking assigned');
  };

  // Run scenario
  const runScenario = (scenario: TransitionScenario) => {
    setSelectedScenario(scenario);
    setIsSimulating(true);
    toast.success(`Running: ${scenario.name}`);
    
    // Simulate for 5 seconds
    setTimeout(() => {
      setIsSimulating(false);
      toast.success('Scenario complete');
    }, 5000);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-[1800px] mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Tactical Simulation Lab</h1>
          <p className="text-gray-600 mt-2">معمل المحاكاة التكتيكية - محاكاة المباريات وتحليل الخصم</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 3D Viewport */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Match Simulation</span>
                <div className="flex gap-2">
                  <Button
                    variant={isSimulating ? "default" : "outline"}
                    size="sm"
                    onClick={() => setIsSimulating(!isSimulating)}
                  >
                    {isSimulating ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  <Button variant="outline" size="sm">
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div 
                ref={mountRef} 
                className="w-full h-[600px] bg-gray-100 rounded-lg"
              />
            </CardContent>
          </Card>

          {/* Controls Sidebar */}
          <div className="space-y-4">
            {/* Team Setup */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Team Setup
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-blue-600">Your Team (Blue)</label>
                  <Input 
                    value={homeTeamName}
                    onChange={(e) => setHomeTeamName(e.target.value)}
                    placeholder="Enter team name"
                    className="mb-2"
                  />
                  <Select value={homeFormation} onValueChange={setHomeFormation}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="4-4-2">4-4-2</SelectItem>
                      <SelectItem value="4-3-3">4-3-3</SelectItem>
                      <SelectItem value="3-5-2">3-5-2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-red-600">Opponent (Red)</label>
                  <Input 
                    value={awayTeamName}
                    onChange={(e) => setAwayTeamName(e.target.value)}
                    placeholder="Enter opponent name"
                    className="mb-2"
                  />
                  <Select value={awayFormation} onValueChange={setAwayFormation}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="4-4-2">4-4-2</SelectItem>
                      <SelectItem value="4-3-3">4-3-3</SelectItem>
                      <SelectItem value="3-5-2">3-5-2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setShowMarkingLines(!showMarkingLines)}
                >
                  {showMarkingLines ? 'Hide' : 'Show'} Marking Lines
                </Button>
              </CardContent>
            </Card>

            {/* Transition Scenarios */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Transition Scenarios
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {TRANSITION_SCENARIOS.map(scenario => (
                  <button
                    key={scenario.id}
                    onClick={() => runScenario(scenario)}
                    className="w-full text-left p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start gap-2">
                      {scenario.type === 'defense_to_attack' ? (
                        <Swords className="h-4 w-4 text-green-600 mt-1" />
                      ) : (
                        <Shield className="h-4 w-4 text-blue-600 mt-1" />
                      )}
                      <div className="flex-1">
                        <div className="font-medium text-sm">{scenario.name}</div>
                        <div className="text-xs text-gray-500">{scenario.description}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* Player Marking Assignment */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Marking Assignment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-gray-600">تعيين المهام الدفاعية - اختر لاعب من فريقك ثم اختر اللاعب المنافس الذي سيراقبه</p>
                
                {selectedPlayer ? (
                  <div className="space-y-2">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <div className="text-sm font-medium text-blue-600">
                        Selected: #{selectedPlayer.number} {selectedPlayer.name}
                      </div>
                      <div className="text-xs text-gray-600">{selectedPlayer.position}</div>
                    </div>
                    
                    <div className="text-xs font-medium">Assign to mark:</div>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {awayPlayers.map(opponent => (
                        <button
                          key={opponent.id}
                          onClick={() => {
                            assignMarking(selectedPlayer.id, opponent.id);
                            setSelectedPlayer(null);
                          }}
                          className="w-full text-left p-2 rounded hover:bg-red-50 transition-colors text-xs border border-gray-200"
                        >
                          <div className="font-medium text-red-600">#{opponent.number} {opponent.name}</div>
                          <div className="text-gray-500">{opponent.position}</div>
                        </button>
                      ))}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => setSelectedPlayer(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-blue-600">Your Players:</div>
                    <div className="space-y-1 max-h-60 overflow-y-auto">
                      {homePlayers.filter(p => p.role !== 'goalkeeper').map(player => (
                        <button
                          key={player.id}
                          onClick={() => setSelectedPlayer(player)}
                          className="w-full text-left p-2 rounded hover:bg-blue-50 transition-colors text-xs border border-gray-200"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-blue-600">#{player.number} {player.name}</div>
                              <div className="text-gray-500">{player.position}</div>
                            </div>
                            {player.marking && (
                              <div className="text-xs text-yellow-600">
                                Marking #{awayPlayers.find(p => p.id === player.marking)?.number}
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* AI Strategy Recommendations */}
            <Card className="border-2 border-blue-200 bg-blue-50/50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  AI Strategy Recommendations
                </CardTitle>
                <p className="text-xs text-gray-600 mt-1">اقتراحات ذكية بناءً على تحليل الخصم</p>
              </CardHeader>
              <CardContent className="space-y-3">
                {STRATEGY_RECOMMENDATIONS.map((strategy) => (
                  <div key={strategy.id} className="p-3 bg-white rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {strategy.type === 'defensive' && <Shield className="h-4 w-4 text-blue-600" />}
                        {strategy.type === 'balanced' && <Users className="h-4 w-4 text-green-600" />}
                        {strategy.type === 'offensive' && <Swords className="h-4 w-4 text-red-600" />}
                        <div className="font-semibold text-sm">{strategy.name}</div>
                      </div>
                      <div className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                        {strategy.confidence}% Confidence
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-600 mb-2">
                      Formation: <span className="font-semibold">{strategy.formation}</span>
                    </div>
                    
                    <p className="text-xs text-gray-700 mb-2">{strategy.description}</p>
                    
                    <div className="text-xs font-medium mb-1">Key Instructions:</div>
                    <ul className="text-xs text-gray-600 space-y-1 mb-2">
                      {strategy.instructions.slice(0, 2).map((instruction, idx) => (
                        <li key={idx} className="flex items-start gap-1">
                          <span className="text-blue-600">•</span>
                          <span>{instruction}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        // Apply strategy - change formation and marking assignments
                        setHomeFormation(strategy.formation);
                        
                        // Apply marking assignments after a short delay to allow formation to update
                        setTimeout(() => {
                          setHomePlayers(prev => {
                            const updated = [...prev];
                            strategy.markingAssignments.forEach(assignment => {
                              const playerIdx = updated.findIndex(p => p.number === assignment.homePlayer);
                              if (playerIdx !== -1) {
                                updated[playerIdx] = {
                                  ...updated[playerIdx],
                                  marking: assignment.awayPlayer + 100 // Adjust for away player IDs
                                };
                              }
                            });
                            return updated;
                          });
                          
                          toast.success(
                            `Applied ${strategy.name}!\n` +
                            `Formation: ${strategy.formation}\n` +
                            `Marking assignments: ${strategy.markingAssignments.length} players`,
                            { duration: 4000 }
                          );
                        }, 500);
                      }}
                    >
                      Apply This Strategy
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Opponent Analysis */}
            <Card className={opponentData ? 'border-2 border-green-200 bg-green-50/30' : ''}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Opponent Analysis
                  {opponentData && (
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full ml-auto">
                      AI Analyzed
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-sm font-medium">Formation</div>
                  <div className="text-lg font-bold text-red-600">{opponentData?.formation || awayFormation}</div>
                </div>
                {opponentData?.playingStyle && (
                  <div>
                    <div className="text-sm font-medium">Playing Style</div>
                    <div className="text-sm text-gray-700">{opponentData.playingStyle}</div>
                  </div>
                )}
                <div>
                  <div className="text-sm font-medium">Strengths</div>
                  <ul className="text-xs text-gray-600 list-disc list-inside">
                    {opponentData?.strengths ? (
                      opponentData.strengths.slice(0, 3).map((strength: string, idx: number) => (
                        <li key={idx}>{strength}</li>
                      ))
                    ) : (
                      <>
                        <li>Strong midfield control</li>
                        <li>Fast wing attacks</li>
                      </>
                    )}
                  </ul>
                </div>
                <div>
                  <div className="text-sm font-medium">Weaknesses</div>
                  <ul className="text-xs text-gray-600 list-disc list-inside">
                    {opponentData?.weaknesses ? (
                      opponentData.weaknesses.slice(0, 3).map((weakness: string, idx: number) => (
                        <li key={idx}>{weakness}</li>
                      ))
                    ) : (
                      <>
                        <li>Vulnerable to counter-attacks</li>
                        <li>Weak aerial defense</li>
                      </>
                    )}
                  </ul>
                </div>
                {opponentData?.keyPlayers && opponentData.keyPlayers.length > 0 && (
                  <div>
                    <div className="text-sm font-medium mb-2">Key Players</div>
                    <div className="space-y-1">
                      {opponentData.keyPlayers.slice(0, 2).map((player: any, idx: number) => (
                        <div key={idx} className="text-xs bg-white p-2 rounded border">
                          <span className="font-semibold">#{player.number}</span> - {player.position}
                          <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] ${
                            player.threat === 'high' ? 'bg-red-100 text-red-700' :
                            player.threat === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {player.threat}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
