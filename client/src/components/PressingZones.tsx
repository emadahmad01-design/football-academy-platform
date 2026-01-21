import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Save, ZapIcon } from 'lucide-react';

type PressureLevel = 'high' | 'medium' | 'low';

interface PressureZone {
  id: string;
  points: { x: number; z: number }[];
  level: PressureLevel;
  mesh?: THREE.Mesh;
}

export default function PressingZones() {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  
  const [zones, setZones] = useState<PressureZone[]>([]);
  const [currentLevel, setCurrentLevel] = useState<PressureLevel>('high');
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoints, setCurrentPoints] = useState<{ x: number; z: number }[]>([]);
  const [offsideLine, setOffsideLine] = useState<number | null>(null);

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
    camera.position.set(0, 50, 30);
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

    // Create football pitch
    const pitchGeometry = new THREE.PlaneGeometry(105, 68);
    const pitchMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x2d5016,
      side: THREE.DoubleSide 
    });
    const pitch = new THREE.Mesh(pitchGeometry, pitchMaterial);
    pitch.rotation.x = -Math.PI / 2;
    scene.add(pitch);

    // Add pitch lines
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 });
    
    // Outer boundary
    const boundaryPoints = [
      new THREE.Vector3(-52.5, 0.1, -34),
      new THREE.Vector3(52.5, 0.1, -34),
      new THREE.Vector3(52.5, 0.1, 34),
      new THREE.Vector3(-52.5, 0.1, 34),
      new THREE.Vector3(-52.5, 0.1, -34)
    ];
    const boundaryGeometry = new THREE.BufferGeometry().setFromPoints(boundaryPoints);
    const boundary = new THREE.Line(boundaryGeometry, lineMaterial);
    scene.add(boundary);

    // Center line
    const centerPoints = [
      new THREE.Vector3(0, 0.1, -34),
      new THREE.Vector3(0, 0.1, 34)
    ];
    const centerGeometry = new THREE.BufferGeometry().setFromPoints(centerPoints);
    const centerLine = new THREE.Line(centerGeometry, lineMaterial);
    scene.add(centerLine);

    // Penalty boxes
    const penaltyBox1Points = [
      new THREE.Vector3(-52.5, 0.1, -20.15),
      new THREE.Vector3(-35.9, 0.1, -20.15),
      new THREE.Vector3(-35.9, 0.1, 20.15),
      new THREE.Vector3(-52.5, 0.1, 20.15)
    ];
    const penaltyBox1Geometry = new THREE.BufferGeometry().setFromPoints(penaltyBox1Points);
    const penaltyBox1 = new THREE.LineLoop(penaltyBox1Geometry, lineMaterial);
    scene.add(penaltyBox1);

    const penaltyBox2Points = [
      new THREE.Vector3(52.5, 0.1, -20.15),
      new THREE.Vector3(35.9, 0.1, -20.15),
      new THREE.Vector3(35.9, 0.1, 20.15),
      new THREE.Vector3(52.5, 0.1, 20.15)
    ];
    const penaltyBox2Geometry = new THREE.BufferGeometry().setFromPoints(penaltyBox2Points);
    const penaltyBox2 = new THREE.LineLoop(penaltyBox2Geometry, lineMaterial);
    scene.add(penaltyBox2);

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

  // Handle mouse click for drawing zones
  const handleCanvasClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing || !sceneRef.current || !cameraRef.current || !rendererRef.current) return;

    const rect = mountRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouse = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, cameraRef.current);

    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const intersectPoint = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, intersectPoint);

    if (intersectPoint) {
      const newPoint = { x: intersectPoint.x, z: intersectPoint.z };
      setCurrentPoints(prev => [...prev, newPoint]);
    }
  };

  // Complete zone drawing
  const completeZone = () => {
    if (currentPoints.length < 3) {
      alert('Please draw at least 3 points to create a zone');
      return;
    }

    const newZone: PressureZone = {
      id: `zone-${Date.now()}`,
      points: currentPoints,
      level: currentLevel
    };

    // Create 3D mesh for the zone
    if (sceneRef.current) {
      const shape = new THREE.Shape();
      shape.moveTo(currentPoints[0].x, currentPoints[0].z);
      currentPoints.slice(1).forEach(point => {
        shape.lineTo(point.x, point.z);
      });
      shape.closePath();

      const geometry = new THREE.ShapeGeometry(shape);
      const color = currentLevel === 'high' ? 0xff0000 : currentLevel === 'medium' ? 0xffaa00 : 0xffff00;
      const material = new THREE.MeshBasicMaterial({ 
        color, 
        transparent: true, 
        opacity: 0.4,
        side: THREE.DoubleSide 
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.y = 0.2;
      sceneRef.current.add(mesh);

      newZone.mesh = mesh;
    }

    setZones(prev => [...prev, newZone]);
    setCurrentPoints([]);
    setIsDrawing(false);
  };

  // Delete zone
  const deleteZone = (zoneId: string) => {
    const zone = zones.find(z => z.id === zoneId);
    if (zone?.mesh && sceneRef.current) {
      sceneRef.current.remove(zone.mesh);
    }
    setZones(prev => prev.filter(z => z.id !== zoneId));
  };

  // Set offside line
  const setOffsideLineTrap = () => {
    if (!sceneRef.current) return;

    // Remove existing offside line
    const existingLine = sceneRef.current.getObjectByName('offside-line');
    if (existingLine) {
      sceneRef.current.remove(existingLine);
    }

    const lineZ = offsideLine || 20;
    const points = [
      new THREE.Vector3(-52.5, 0.3, lineZ),
      new THREE.Vector3(52.5, 0.3, lineZ)
    ];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 3 });
    const line = new THREE.Line(geometry, material);
    line.name = 'offside-line';
    sceneRef.current.add(line);

    setOffsideLine(lineZ);
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <Card className="p-4 bg-white dark:bg-slate-800">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="text-sm font-medium mb-2 block">Pressure Level</label>
            <Select value={currentLevel} onValueChange={(v) => setCurrentLevel(v as PressureLevel)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">High Press</SelectItem>
                <SelectItem value="medium">Medium Press</SelectItem>
                <SelectItem value="low">Low Press</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={() => {
              setIsDrawing(!isDrawing);
              if (isDrawing) {
                setCurrentPoints([]);
              }
            }}
            variant={isDrawing ? 'destructive' : 'default'}
            className="bg-orange-500 hover:bg-orange-600"
          >
            {isDrawing ? 'Cancel Drawing' : 'Draw Zone'}
          </Button>

          {isDrawing && currentPoints.length >= 3 && (
            <Button onClick={completeZone} variant="outline">
              Complete Zone
            </Button>
          )}

          <Button onClick={setOffsideLineTrap} variant="outline">
            <ZapIcon className="w-4 h-4 mr-2" />
            Set Offside Trap
          </Button>

          <div className="ml-auto">
            <Button variant="outline">
              <Save className="w-4 h-4 mr-2" />
              Save Zones
            </Button>
          </div>
        </div>

        {/* Zone List */}
        {zones.length > 0 && (
          <div className="mt-4 space-y-2">
            <h3 className="font-semibold text-sm">Active Zones ({zones.length})</h3>
            {zones.map(zone => (
              <div key={zone.id} className="flex items-center justify-between p-2 bg-slate-100 dark:bg-slate-700 rounded">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded" 
                    style={{ 
                      backgroundColor: zone.level === 'high' ? '#ff0000' : zone.level === 'medium' ? '#ffaa00' : '#ffff00' 
                    }}
                  />
                  <span className="text-sm capitalize">{zone.level} Press Zone</span>
                  <span className="text-xs text-slate-500">({zone.points.length} points)</span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteZone(zone.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* 3D Canvas */}
      <div 
        ref={mountRef} 
        className="w-full h-[600px] bg-slate-900 rounded-lg overflow-hidden cursor-crosshair"
        onClick={handleCanvasClick}
      />

      {/* Instructions */}
      {isDrawing && (
        <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            <strong>Drawing Mode:</strong> Click on the pitch to add points. Create at least 3 points, then click "Complete Zone" to finish.
          </p>
        </Card>
      )}
    </div>
  );
}
