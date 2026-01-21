import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, Save, Plus } from 'lucide-react';
import { toast } from 'sonner';

type SetPieceType = 'corner_near' | 'corner_far' | 'corner_short' | 'free_kick_direct' | 'free_kick_indirect' | 'free_kick_wall';

interface PlayerMovement {
  playerId: number;
  startX: number;
  startZ: number;
  endX: number;
  endZ: number;
  timing: number; // seconds after kick
}

interface SetPiecePlan {
  id: string;
  name: string;
  type: SetPieceType;
  description: string;
  movements: PlayerMovement[];
  kickerPosition: { x: number; z: number };
}

// Pre-built set piece plans
const SET_PIECE_LIBRARY: SetPiecePlan[] = [
  {
    id: 'corner_near_post_1',
    name: 'Near Post Flick-On',
    type: 'corner_near',
    description: 'Target near post for flick-on to runners',
    kickerPosition: { x: 35, z: -52 },
    movements: [
      { playerId: 9, startX: 0, startZ: -45, endX: -3, endZ: -50, timing: 1 }, // Striker near post
      { playerId: 10, startX: 5, startZ: -42, endX: 2, endZ: -48, timing: 1.5 }, // CAM follows
      { playerId: 11, startX: -5, startZ: -43, endX: 3, endZ: -49, timing: 1.2 }, // Second striker
      { playerId: 5, startX: 0, startZ: -40, endX: 0, endZ: -47, timing: 1.8 }, // CB attacks
      { playerId: 6, startX: 0, startZ: 20, endX: 0, endZ: -30, timing: 2 }, // DM edge of box
    ]
  },
  {
    id: 'corner_far_post_1',
    name: 'Far Post Header',
    type: 'corner_far',
    description: 'Deliver to far post for powerful header',
    kickerPosition: { x: 35, z: -52 },
    movements: [
      { playerId: 5, startX: 0, startZ: -40, endX: 5, endZ: -50, timing: 1.5 }, // CB far post
      { playerId: 9, startX: 0, startZ: -45, endX: 3, endZ: -49, timing: 1.2 }, // Striker central
      { playerId: 10, startX: 5, startZ: -42, endX: -2, endZ: -48, timing: 1.8 }, // CAM near post
      { playerId: 11, startX: -5, startZ: -43, endX: 0, endZ: -47, timing: 1.4 }, // Second striker
      { playerId: 6, startX: 0, startZ: 20, endX: 0, endZ: -35, timing: 2 }, // DM edge
    ]
  },
  {
    id: 'corner_short_1',
    name: 'Short Corner Play',
    type: 'corner_short',
    description: 'Short pass to create better angle',
    kickerPosition: { x: 35, z: -52 },
    movements: [
      { playerId: 8, startX: 25, startZ: -45, endX: 30, endZ: -48, timing: 0.5 }, // Winger receives
      { playerId: 9, startX: 0, startZ: -45, endX: -2, endZ: -50, timing: 1.5 }, // Striker near post
      { playerId: 10, startX: 5, startZ: -42, endX: 3, endZ: -48, timing: 1.8 }, // CAM central
      { playerId: 5, startX: 0, startZ: -40, endX: 2, endZ: -49, timing: 2 }, // CB attacks
      { playerId: 11, startX: -5, startZ: -43, endX: 5, endZ: -49, timing: 1.6 }, // Far post
    ]
  },
  {
    id: 'free_kick_direct_1',
    name: 'Direct Shot on Goal',
    type: 'free_kick_direct',
    description: 'Powerful direct shot over/around wall',
    kickerPosition: { x: 0, z: -30 },
    movements: [
      { playerId: 9, startX: -5, startZ: -35, endX: -3, endZ: -48, timing: 1 }, // Striker follows
      { playerId: 10, startX: 5, startZ: -35, endX: 3, endZ: -48, timing: 1 }, // CAM follows
      { playerId: 11, startX: 0, startZ: -32, endX: 5, endZ: -47, timing: 1.2 }, // Far post
      { playerId: 6, startX: 0, startZ: 10, endX: 0, endZ: -20, timing: 1.5 }, // DM supports
    ]
  },
  {
    id: 'free_kick_indirect_1',
    name: 'Indirect Combination',
    type: 'free_kick_indirect',
    description: 'Pass to create shooting opportunity',
    kickerPosition: { x: -15, z: -25 },
    movements: [
      { playerId: 10, startX: -10, startZ: -30, endX: -8, endZ: -35, timing: 0.8 }, // CAM receives
      { playerId: 9, startX: 0, startZ: -35, endX: -2, endZ: -48, timing: 1.5 }, // Striker runs
      { playerId: 11, startX: 5, startZ: -33, endX: 3, endZ: -47, timing: 1.6 }, // Second striker
      { playerId: 8, startX: 15, startZ: -28, endX: 10, endZ: -40, timing: 1.8 }, // Winger cuts in
    ]
  },
  {
    id: 'free_kick_wall_1',
    name: 'Wall Setup & Block',
    type: 'free_kick_wall',
    description: 'Defensive wall to block direct shot',
    kickerPosition: { x: 0, z: 35 }, // Opponent's free kick
    movements: [
      { playerId: 6, startX: 0, startZ: 30, endX: -2, endZ: 32, timing: 0 }, // DM in wall
      { playerId: 10, startX: 0, startZ: 25, endX: 0, endZ: 32, timing: 0 }, // CAM in wall
      { playerId: 9, startX: 0, startZ: 20, endX: 2, endZ: 32, timing: 0 }, // Striker in wall
      { playerId: 5, startX: -3, startZ: 35, endX: -5, endZ: 40, timing: 0.5 }, // CB covers
      { playerId: 4, startX: 3, startZ: 35, endX: 5, endZ: 40, timing: 0.5 }, // CB covers
    ]
  }
];

export default function SetPiecesLibrary() {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const playersRef = useRef<Map<number, THREE.Mesh>>(new Map());
  const ballRef = useRef<THREE.Mesh | null>(null);
  
  const [selectedPlan, setSelectedPlan] = useState<SetPiecePlan>(SET_PIECE_LIBRARY[0]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationProgress, setAnimationProgress] = useState(0);

  // Initialize 3D scene
  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 60, 40);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controlsRef.current = controls;

    // Create pitch
    createPitch(scene);

    // Create players
    createPlayers(scene);

    // Create ball
    const ballGeometry = new THREE.SphereGeometry(0.8, 16, 16);
    const ballMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const ball = new THREE.Mesh(ballGeometry, ballMaterial);
    ball.position.set(selectedPlan.kickerPosition.x, 0.8, selectedPlan.kickerPosition.z);
    scene.add(ball);
    ballRef.current = ball;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 50, 10);
    scene.add(directionalLight);

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

    return () => {
      window.removeEventListener('resize', handleResize);
      mountRef.current?.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, []);

  // Update positions when plan changes
  useEffect(() => {
    if (!ballRef.current) return;
    
    // Reset ball position
    ballRef.current.position.set(selectedPlan.kickerPosition.x, 0.8, selectedPlan.kickerPosition.z);
    
    // Reset player positions
    selectedPlan.movements.forEach(movement => {
      const playerMesh = playersRef.current.get(movement.playerId);
      if (playerMesh) {
        playerMesh.position.set(movement.startX, 2, movement.startZ);
      }
    });
    
    setAnimationProgress(0);
    setIsAnimating(false);
  }, [selectedPlan]);

  // Animation effect
  useEffect(() => {
    if (!isAnimating) return;

    const duration = 3000; // 3 seconds
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setAnimationProgress(progress);

      // Update player positions
      selectedPlan.movements.forEach(movement => {
        const playerMesh = playersRef.current.get(movement.playerId);
        if (playerMesh && progress >= movement.timing / 3) {
          const localProgress = Math.min((progress - movement.timing / 3) / (1 - movement.timing / 3), 1);
          playerMesh.position.x = movement.startX + (movement.endX - movement.startX) * localProgress;
          playerMesh.position.z = movement.startZ + (movement.endZ - movement.startZ) * localProgress;
        }
      });

      // Move ball
      if (ballRef.current && progress > 0.2) {
        const targetPlayer = selectedPlan.movements[0];
        const ballProgress = (progress - 0.2) / 0.8;
        ballRef.current.position.x = selectedPlan.kickerPosition.x + (targetPlayer.endX - selectedPlan.kickerPosition.x) * ballProgress;
        ballRef.current.position.z = selectedPlan.kickerPosition.z + (targetPlayer.endZ - selectedPlan.kickerPosition.z) * ballProgress;
        ballRef.current.position.y = 0.8 + Math.sin(ballProgress * Math.PI) * 5;
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
      }
    };

    animate();
  }, [isAnimating, selectedPlan]);

  const createPitch = (scene: THREE.Scene) => {
    const pitchGeometry = new THREE.PlaneGeometry(70, 105);
    const pitchMaterial = new THREE.MeshStandardMaterial({ color: 0x2d5016, side: THREE.DoubleSide });
    const pitch = new THREE.Mesh(pitchGeometry, pitchMaterial);
    pitch.rotation.x = -Math.PI / 2;
    scene.add(pitch);

    // Lines
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 });
    
    // Boundary
    const boundaryPoints = [
      new THREE.Vector3(-35, 0.1, -52.5),
      new THREE.Vector3(35, 0.1, -52.5),
      new THREE.Vector3(35, 0.1, 52.5),
      new THREE.Vector3(-35, 0.1, 52.5),
      new THREE.Vector3(-35, 0.1, -52.5)
    ];
    const boundaryGeometry = new THREE.BufferGeometry().setFromPoints(boundaryPoints);
    const boundary = new THREE.Line(boundaryGeometry, lineMaterial);
    scene.add(boundary);

    // Goals
    const goalMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc });
    const goalGeometry = new THREE.BoxGeometry(14, 4, 0.5);
    const goal1 = new THREE.Mesh(goalGeometry, goalMaterial);
    goal1.position.set(0, 2, -53);
    scene.add(goal1);
    const goal2 = new THREE.Mesh(goalGeometry, goalMaterial);
    goal2.position.set(0, 2, 53);
    scene.add(goal2);
  };

  const createPlayers = (scene: THREE.Scene) => {
    const playerGeometry = new THREE.CylinderGeometry(1, 1, 4, 16);
    const playerMaterial = new THREE.MeshStandardMaterial({ color: 0x0066cc });

    selectedPlan.movements.forEach(movement => {
      const player = new THREE.Mesh(playerGeometry, playerMaterial);
      player.position.set(movement.startX, 2, movement.startZ);
      scene.add(player);
      playersRef.current.set(movement.playerId, player);
    });
  };

  const handlePlayAnimation = () => {
    setIsAnimating(true);
    setAnimationProgress(0);
  };

  const handleSavePlan = () => {
    toast.success(`Set piece plan "${selectedPlan.name}" saved!`);
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <Card className="p-4 bg-white dark:bg-slate-800">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium mb-2 block">Set Piece Plan</label>
            <Select 
              value={selectedPlan.id} 
              onValueChange={(id) => {
                const plan = SET_PIECE_LIBRARY.find(p => p.id === id);
                if (plan) setSelectedPlan(plan);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SET_PIECE_LIBRARY.map(plan => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handlePlayAnimation}
            disabled={isAnimating}
            className="bg-orange-500 hover:bg-orange-600"
          >
            <Play className="w-4 h-4 mr-2" />
            Play Animation
          </Button>

          <Button onClick={handleSavePlan} variant="outline">
            <Save className="w-4 h-4 mr-2" />
            Save Plan
          </Button>

          <Button variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Create Custom
          </Button>
        </div>

        {/* Plan Description */}
        <div className="mt-4 p-3 bg-slate-100 dark:bg-slate-700 rounded">
          <h3 className="font-semibold text-sm mb-1">{selectedPlan.name}</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400">{selectedPlan.description}</p>
          <div className="mt-2 text-xs text-slate-500">
            <span className="font-medium">Type:</span> {selectedPlan.type.replace('_', ' ').toUpperCase()} • 
            <span className="font-medium ml-2">Players:</span> {selectedPlan.movements.length}
          </div>
        </div>
      </Card>

      {/* 3D Canvas */}
      <div 
        ref={mountRef} 
        className="w-full h-[600px] bg-slate-900 rounded-lg overflow-hidden"
      />

      {/* Progress Bar */}
      {isAnimating && (
        <Card className="p-4 bg-white dark:bg-slate-800">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">Animation Progress:</span>
            <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-orange-500 transition-all duration-100"
                style={{ width: `${animationProgress * 100}%` }}
              />
            </div>
            <span className="text-sm text-slate-600 dark:text-slate-400">
              {Math.round(animationProgress * 100)}%
            </span>
          </div>
        </Card>
      )}
    </div>
  );
}
