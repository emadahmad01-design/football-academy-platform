import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeftRight, Target, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import * as THREE from 'three';

interface TeamComparisonProps {
  yourTeam: {
    formation: string;
    players: Array<{ name: string; position: string; number: number }>;
  };
  opponentTeam: {
    formation: string;
    playingStyle: string;
    strengths: string[];
    weaknesses: string[];
    keyPlayers: Array<{ number: number; position: string; threat: string; description: string }>;
  };
}

export default function TeamComparison({ yourTeam, opponentTeam }: TeamComparisonProps) {
  const yourTeamCanvasRef = useRef<HTMLCanvasElement>(null);
  const opponentCanvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedMatchup, setSelectedMatchup] = useState<string | null>(null);

  useEffect(() => {
    if (!yourTeamCanvasRef.current || !opponentCanvasRef.current) return;

    // Create 3D scene for your team
    const yourScene = new THREE.Scene();
    yourScene.background = new THREE.Color(0x1a472a);
    
    const yourCamera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
    yourCamera.position.set(0, 50, 30);
    yourCamera.lookAt(0, 0, 0);

    const yourRenderer = new THREE.WebGLRenderer({ 
      canvas: yourTeamCanvasRef.current,
      antialias: true 
    });
    yourRenderer.setSize(400, 600);

    // Create pitch for your team
    createPitch(yourScene);
    createFormation(yourScene, yourTeam.formation, 0x3b82f6); // Blue for your team

    // Create 3D scene for opponent
    const oppScene = new THREE.Scene();
    oppScene.background = new THREE.Color(0x1a472a);
    
    const oppCamera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
    oppCamera.position.set(0, 50, 30);
    oppCamera.lookAt(0, 0, 0);

    const oppRenderer = new THREE.WebGLRenderer({ 
      canvas: opponentCanvasRef.current,
      antialias: true 
    });
    oppRenderer.setSize(400, 600);

    // Create pitch for opponent
    createPitch(oppScene);
    createFormation(oppScene, opponentTeam.formation, 0xef4444); // Red for opponent

    // Animation loop
    function animate() {
      requestAnimationFrame(animate);
      yourRenderer.render(yourScene, yourCamera);
      oppRenderer.render(oppScene, oppCamera);
    }
    animate();

    // Cleanup
    return () => {
      yourRenderer.dispose();
      oppRenderer.dispose();
    };
  }, [yourTeam, opponentTeam]);

  const createPitch = (scene: THREE.Scene) => {
    // Grass
    const grassGeometry = new THREE.PlaneGeometry(40, 60);
    const grassMaterial = new THREE.MeshBasicMaterial({ color: 0x1a472a });
    const grass = new THREE.Mesh(grassGeometry, grassMaterial);
    grass.rotation.x = -Math.PI / 2;
    scene.add(grass);

    // White lines
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
    
    // Outer boundary
    const boundaryPoints = [
      new THREE.Vector3(-20, 0.1, -30),
      new THREE.Vector3(20, 0.1, -30),
      new THREE.Vector3(20, 0.1, 30),
      new THREE.Vector3(-20, 0.1, 30),
      new THREE.Vector3(-20, 0.1, -30)
    ];
    const boundaryGeometry = new THREE.BufferGeometry().setFromPoints(boundaryPoints);
    scene.add(new THREE.Line(boundaryGeometry, lineMaterial));

    // Center line
    const centerPoints = [
      new THREE.Vector3(-20, 0.1, 0),
      new THREE.Vector3(20, 0.1, 0)
    ];
    const centerGeometry = new THREE.BufferGeometry().setFromPoints(centerPoints);
    scene.add(new THREE.Line(centerGeometry, lineMaterial));

    // Center circle
    const circleGeometry = new THREE.CircleGeometry(8, 32);
    const circleEdges = new THREE.EdgesGeometry(circleGeometry);
    const circle = new THREE.LineSegments(circleEdges, lineMaterial);
    circle.rotation.x = -Math.PI / 2;
    circle.position.y = 0.1;
    scene.add(circle);

    // Penalty boxes
    const penaltyPoints1 = [
      new THREE.Vector3(-15, 0.1, -30),
      new THREE.Vector3(-15, 0.1, -15),
      new THREE.Vector3(15, 0.1, -15),
      new THREE.Vector3(15, 0.1, -30)
    ];
    const penaltyGeometry1 = new THREE.BufferGeometry().setFromPoints(penaltyPoints1);
    scene.add(new THREE.Line(penaltyGeometry1, lineMaterial));

    const penaltyPoints2 = [
      new THREE.Vector3(-15, 0.1, 30),
      new THREE.Vector3(-15, 0.1, 15),
      new THREE.Vector3(15, 0.1, 15),
      new THREE.Vector3(15, 0.1, 30)
    ];
    const penaltyGeometry2 = new THREE.BufferGeometry().setFromPoints(penaltyPoints2);
    scene.add(new THREE.Line(penaltyGeometry2, lineMaterial));
  };

  const createFormation = (scene: THREE.Scene, formation: string, color: number) => {
    const positions = getFormationPositions(formation);
    
    positions.forEach((pos, index) => {
      // Player marker
      const geometry = new THREE.CylinderGeometry(1, 1, 0.5, 16);
      const material = new THREE.MeshBasicMaterial({ color });
      const player = new THREE.Mesh(geometry, material);
      player.position.set(pos.x, 0.5, pos.z);
      scene.add(player);

      // Player number
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d')!;
      canvas.width = 64;
      canvas.height = 64;
      context.fillStyle = 'white';
      context.font = 'bold 32px Arial';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText((index + 1).toString(), 32, 32);

      const texture = new THREE.CanvasTexture(canvas);
      const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
      const sprite = new THREE.Sprite(spriteMaterial);
      sprite.position.set(pos.x, 3, pos.z);
      sprite.scale.set(3, 3, 1);
      scene.add(sprite);
    });
  };

  const getFormationPositions = (formation: string): Array<{ x: number; z: number }> => {
    const formations: Record<string, Array<{ x: number; z: number }>> = {
      '4-3-3': [
        // GK
        { x: 0, z: -25 },
        // Defenders
        { x: -12, z: -18 }, { x: -4, z: -18 }, { x: 4, z: -18 }, { x: 12, z: -18 },
        // Midfielders
        { x: -8, z: -5 }, { x: 0, z: -5 }, { x: 8, z: -5 },
        // Forwards
        { x: -10, z: 10 }, { x: 0, z: 15 }, { x: 10, z: 10 }
      ],
      '4-4-2': [
        // GK
        { x: 0, z: -25 },
        // Defenders
        { x: -12, z: -18 }, { x: -4, z: -18 }, { x: 4, z: -18 }, { x: 12, z: -18 },
        // Midfielders
        { x: -12, z: -5 }, { x: -4, z: -5 }, { x: 4, z: -5 }, { x: 12, z: -5 },
        // Forwards
        { x: -6, z: 12 }, { x: 6, z: 12 }
      ],
      '4-2-3-1': [
        // GK
        { x: 0, z: -25 },
        // Defenders
        { x: -12, z: -18 }, { x: -4, z: -18 }, { x: 4, z: -18 }, { x: 12, z: -18 },
        // Defensive Midfielders
        { x: -5, z: -10 }, { x: 5, z: -10 },
        // Attacking Midfielders
        { x: -10, z: 0 }, { x: 0, z: 2 }, { x: 10, z: 0 },
        // Forward
        { x: 0, z: 15 }
      ],
      '4-3-2-1': [
        // GK
        { x: 0, z: -25 },
        // Defenders
        { x: -12, z: -18 }, { x: -4, z: -18 }, { x: 4, z: -18 }, { x: 12, z: -18 },
        // Midfielders
        { x: -8, z: -8 }, { x: 0, z: -8 }, { x: 8, z: -8 },
        // Attacking Midfielders
        { x: -6, z: 3 }, { x: 6, z: 3 },
        // Forward
        { x: 0, z: 15 }
      ]
    };

    return formations[formation] || formations['4-4-2'];
  };

  const getTacticalAdvice = () => {
    const advice = [];
    
    if (opponentTeam.weaknesses.length > 0) {
      advice.push({
        type: 'opportunity',
        title: 'Exploit Weaknesses',
        description: `Target their ${opponentTeam.weaknesses[0].toLowerCase()} to create scoring opportunities.`
      });
    }

    if (opponentTeam.strengths.length > 0) {
      advice.push({
        type: 'caution',
        title: 'Defensive Focus',
        description: `Be cautious of their ${opponentTeam.strengths[0].toLowerCase()} - reinforce defensive coverage in these areas.`
      });
    }

    if (opponentTeam.keyPlayers.filter(p => p.threat === 'high').length > 0) {
      advice.push({
        type: 'alert',
        title: 'Mark Key Players',
        description: 'Assign dedicated markers to their high-threat players to limit their impact.'
      });
    }

    return advice;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          Team Comparison
        </h2>
        <Badge variant="outline" className="text-orange-600 border-orange-600">
          <ArrowLeftRight className="w-4 h-4 mr-1" />
          Tactical Analysis
        </Badge>
      </div>

      {/* Side-by-Side Pitches */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Your Team */}
        <Card>
          <CardHeader className="bg-blue-50 dark:bg-blue-900/20">
            <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
              <Target className="w-5 h-5" />
              Your Team - {yourTeam.formation}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <canvas ref={yourTeamCanvasRef} className="w-full rounded-lg" />
            <div className="mt-4 space-y-2">
              <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-300">Formation</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {yourTeam.formation} - Balanced approach with strong midfield presence
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Opponent Team */}
        <Card>
          <CardHeader className="bg-red-50 dark:bg-red-900/20">
            <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <AlertTriangle className="w-5 h-5" />
              Opponent - {opponentTeam.formation}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <canvas ref={opponentCanvasRef} className="w-full rounded-lg" />
            <div className="mt-4 space-y-2">
              <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-300">Playing Style</h4>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {opponentTeam.playingStyle}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Strengths vs Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <TrendingUp className="w-5 h-5" />
              Opponent Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {opponentTeam.strengths.map((strength, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <span className="text-green-600 dark:text-green-400">✓</span>
                  <span className="text-slate-700 dark:text-slate-300">{strength}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <TrendingDown className="w-5 h-5" />
              Opponent Weaknesses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {opponentTeam.weaknesses.map((weakness, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <span className="text-red-600 dark:text-red-400">✗</span>
                  <span className="text-slate-700 dark:text-slate-300">{weakness}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Tactical Advice */}
      <Card className="bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20">
        <CardHeader>
          <CardTitle className="text-orange-700 dark:text-orange-400">
            Counter-Strategy Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {getTacticalAdvice().map((item, index) => (
              <div key={index} className="p-3 bg-white dark:bg-slate-800 rounded-lg">
                <h4 className="font-semibold text-sm text-slate-900 dark:text-white mb-1">
                  {item.title}
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
