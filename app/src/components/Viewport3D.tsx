import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { FemoralPlan, TibialPlan } from '../types/surgery';
import {
  createFemurGeometry,
  createTibiaGeometry,
  createFemoralImplantGeometry,
  createTibialTrayGeometry,
  createPolyInsertGeometry
} from '../utils/geometry';
import { calculateKinematics } from '../utils/kinematics';

interface Viewport3DProps {
  femoralPlan: FemoralPlan;
  tibialPlan: TibialPlan;
  flexionAngle: number;
  showBones: boolean;
  showImplants: boolean;
  showCutPlanes: boolean;
  showPreOpGhost: boolean;
  showAxes: boolean;
  preOpVarus: number;
}

export const Viewport3D: React.FC<Viewport3DProps> = ({
  femoralPlan,
  tibialPlan,
  flexionAngle,
  showBones,
  showImplants,
  showCutPlanes,
  showPreOpGhost,
  showAxes,
  preOpVarus
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  // Group references for dynamic transformation
  const femurGroupRef = useRef<THREE.Group | null>(null);
  const tibiaGroupRef = useRef<THREE.Group | null>(null);
  const preOpFemurGhostRef = useRef<THREE.Mesh | null>(null);
  const femoralCutPlaneRef = useRef<THREE.Mesh | null>(null);
  const tibialCutPlaneRef = useRef<THREE.Mesh | null>(null);
  const femoralImplantMeshRef = useRef<THREE.Mesh | null>(null);
  const tibialTrayMeshRef = useRef<THREE.Mesh | null>(null);
  const polyInsertMeshRef = useRef<THREE.Mesh | null>(null);
  const axesGroupRef = useRef<THREE.Group | null>(null);

  // Orbit control state
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const cameraRotationRef = useRef({ theta: 0.1, phi: 1.5 });
  const cameraDistanceRef = useRef(260);

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x090d16);

    // Grid Floor
    const gridHelper = new THREE.GridHelper(300, 30, 0x1e293b, 0x0f172a);
    gridHelper.position.y = -100;
    scene.add(gridHelper);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 1000);
    cameraRef.current = camera;
    updateCameraPosition();

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight1.position.set(100, 150, 120);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x38bdf8, 0.6); // Medical blue rim
    dirLight2.position.set(-100, -50, -100);
    scene.add(dirLight2);

    // 5. Materials
    const boneMaterial = new THREE.MeshStandardMaterial({
      color: 0xf1efe7,
      roughness: 0.45,
      metalness: 0.05
    });

    const ghostMaterial = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      transparent: true,
      opacity: 0.35,
      wireframe: true
    });

    const metalMaterial = new THREE.MeshStandardMaterial({
      color: 0xd4d4d8,
      roughness: 0.22,
      metalness: 0.88
    });

    const polyMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.15,
      metalness: 0.1,
      transparent: true,
      opacity: 0.82
    });

    const cutPlaneFemurMat = new THREE.MeshBasicMaterial({
      color: 0xf43f5e,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide
    });

    const cutPlaneTibiaMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.4,
      side: THREE.DoubleSide
    });

    // 6. Femur Group
    const femurGroup = new THREE.Group();
    femurGroupRef.current = femurGroup;
    scene.add(femurGroup);

    const femurGeom = createFemurGeometry();
    const femurMesh = new THREE.Mesh(femurGeom, boneMaterial);
    femurMesh.position.y = 12;
    femurGroup.add(femurMesh);

    // Pre-op Ghost Femur (with pre-op varus deformity)
    const preOpGhostMesh = new THREE.Mesh(femurGeom, ghostMaterial);
    preOpGhostMesh.position.y = 12;
    preOpFemurGhostRef.current = preOpGhostMesh;
    scene.add(preOpGhostMesh);

    // Femoral Implant
    const femoralImplantGeom = createFemoralImplantGeometry();
    const femoralImplantMesh = new THREE.Mesh(femoralImplantGeom, metalMaterial);
    femoralImplantMeshRef.current = femoralImplantMesh;
    femurGroup.add(femoralImplantMesh);

    // Femoral Cut Plane
    const femoralCutPlaneGeom = new THREE.PlaneGeometry(60, 50);
    const femoralCutPlaneMesh = new THREE.Mesh(femoralCutPlaneGeom, cutPlaneFemurMat);
    femoralCutPlaneMesh.rotateX(Math.PI * 0.5);
    femoralCutPlaneMesh.position.y = 10;
    femoralCutPlaneRef.current = femoralCutPlaneMesh;
    femurGroup.add(femoralCutPlaneMesh);

    // 7. Tibia Group
    const tibiaGroup = new THREE.Group();
    tibiaGroupRef.current = tibiaGroup;
    scene.add(tibiaGroup);

    const tibiaGeom = createTibiaGeometry();
    const tibiaMesh = new THREE.Mesh(tibiaGeom, boneMaterial);
    tibiaMesh.position.y = -8;
    tibiaGroup.add(tibiaMesh);

    // Tibial Tray
    const tibialTrayGeom = createTibialTrayGeometry();
    const tibialTrayMesh = new THREE.Mesh(tibialTrayGeom, metalMaterial);
    tibialTrayMesh.position.y = -7;
    tibialTrayMeshRef.current = tibialTrayMesh;
    tibiaGroup.add(tibialTrayMesh);

    // Poly Insert
    const polyInsertGeom = createPolyInsertGeometry(tibialPlan.insertThickness);
    const polyInsertMesh = new THREE.Mesh(polyInsertGeom, polyMaterial);
    polyInsertMesh.position.y = -2;
    polyInsertMeshRef.current = polyInsertMesh;
    tibiaGroup.add(polyInsertMesh);

    // Tibial Cut Plane
    const tibialCutPlaneGeom = new THREE.PlaneGeometry(55, 45);
    const tibialCutPlaneMesh = new THREE.Mesh(tibialCutPlaneGeom, cutPlaneTibiaMat);
    tibialCutPlaneMesh.rotateX(Math.PI * 0.5);
    tibialCutPlaneMesh.position.y = -8;
    tibialCutPlaneRef.current = tibialCutPlaneMesh;
    tibiaGroup.add(tibialCutPlaneMesh);

    // 8. Mechanical Axes lines
    const axesGroup = new THREE.Group();
    axesGroupRef.current = axesGroup;
    scene.add(axesGroup);

    const axisMaterialFemur = new THREE.LineBasicMaterial({ color: 0x3b82f6, linewidth: 2 });
    const axisPointsFemur = [new THREE.Vector3(0, 160, 0), new THREE.Vector3(0, 12, 0)];
    const axisGeomFemur = new THREE.BufferGeometry().setFromPoints(axisPointsFemur);
    const axisLineFemur = new THREE.Line(axisGeomFemur, axisMaterialFemur);
    axesGroup.add(axisLineFemur);

    const axisMaterialTibia = new THREE.LineBasicMaterial({ color: 0x10b981, linewidth: 2 });
    const axisPointsTibia = [new THREE.Vector3(0, -8, 0), new THREE.Vector3(0, -150, 0)];
    const axisGeomTibia = new THREE.BufferGeometry().setFromPoints(axisPointsTibia);
    const axisLineTibia = new THREE.Line(axisGeomTibia, axisMaterialTibia);
    axesGroup.add(axisLineTibia);

    // 9. Mouse Orbit Event Handlers
    const handleMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const deltaX = e.clientX - previousMousePositionRef.current.x;
      const deltaY = e.clientY - previousMousePositionRef.current.y;

      cameraRotationRef.current.theta -= deltaX * 0.008;
      cameraRotationRef.current.phi = Math.max(
        0.1,
        Math.min(Math.PI - 0.1, cameraRotationRef.current.phi - deltaY * 0.008)
      );

      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
      updateCameraPosition();
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      cameraDistanceRef.current = Math.max(80, Math.min(500, cameraDistanceRef.current + e.deltaY * 0.25));
      updateCameraPosition();
    };

    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('wheel', handleWheel, { passive: false });

    // 10. Resize Observer
    const resizeObserver = new ResizeObserver(() => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      cameraRef.current.aspect = newW / newH;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(newW, newH);
    });
    resizeObserver.observe(container);

    // 11. Animation Loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('wheel', handleWheel);
      resizeObserver.disconnect();
      if (rendererRef.current?.domElement) {
        container.removeChild(rendererRef.current.domElement);
      }
      rendererRef.current?.dispose();
    };
  }, []);

  function updateCameraPosition() {
    if (!cameraRef.current) return;
    const { theta, phi } = cameraRotationRef.current;
    const r = cameraDistanceRef.current;

    cameraRef.current.position.x = r * Math.sin(phi) * Math.sin(theta);
    cameraRef.current.position.y = r * Math.cos(phi);
    cameraRef.current.position.z = r * Math.sin(phi) * Math.cos(theta);
    cameraRef.current.lookAt(0, 0, 0);
  }

  // Update dynamic transforms and visibility based on props
  useEffect(() => {
    // Kinematic motion calculation
    const kinematics = calculateKinematics(flexionAngle);

    if (femurGroupRef.current) {
      femurGroupRef.current.rotation.x = kinematics.rotationX;
      femurGroupRef.current.position.y = 12 + kinematics.translationY;
      femurGroupRef.current.position.z = kinematics.translationZ;

      // Femoral Varus/Valgus & Rotation adjustments
      const varusRad = (femoralPlan.varusValgus * Math.PI) / 180;
      const rotRad = (femoralPlan.internalExternalRotation * Math.PI) / 180;
      femurGroupRef.current.rotation.z = varusRad;
      femurGroupRef.current.rotation.y = rotRad;
    }

    if (tibiaGroupRef.current) {
      const slopeRad = (tibialPlan.posteriorSlope * Math.PI) / 180;
      const tibVarusRad = (tibialPlan.varusValgus * Math.PI) / 180;
      tibiaGroupRef.current.rotation.x = -slopeRad;
      tibiaGroupRef.current.rotation.z = tibVarusRad;
      tibiaGroupRef.current.rotation.y = kinematics.axialRotationY;
    }

    // Pre-op Ghost representation
    if (preOpFemurGhostRef.current) {
      preOpFemurGhostRef.current.visible = showPreOpGhost;
      const preOpRad = (preOpVarus * Math.PI) / 180;
      preOpFemurGhostRef.current.rotation.z = preOpRad;
    }

    // Cut plane heights and orientations
    if (femoralCutPlaneRef.current) {
      femoralCutPlaneRef.current.visible = showCutPlanes;
      femoralCutPlaneRef.current.position.y = 12 - femoralPlan.distalCutDepth;
      femoralCutPlaneRef.current.rotation.y = (femoralPlan.varusValgus * Math.PI) / 180;
    }

    if (tibialCutPlaneRef.current) {
      tibialCutPlaneRef.current.visible = showCutPlanes;
      tibialCutPlaneRef.current.position.y = -8 - tibialPlan.resectionDepth * 0.5;
    }

    if (femoralImplantMeshRef.current) {
      femoralImplantMeshRef.current.visible = showImplants;
    }

    if (tibialTrayMeshRef.current) {
      tibialTrayMeshRef.current.visible = showImplants;
    }

    if (polyInsertMeshRef.current) {
      polyInsertMeshRef.current.visible = showImplants;
    }

    if (axesGroupRef.current) {
      axesGroupRef.current.visible = showAxes;
    }
  }, [
    femoralPlan,
    tibialPlan,
    flexionAngle,
    showBones,
    showImplants,
    showCutPlanes,
    showPreOpGhost,
    showAxes,
    preOpVarus
  ]);

  return (
    <div className="relative w-full h-full">
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Floating 3D Navigation Compass / Tips */}
      <div className="absolute bottom-4 left-4 pointer-events-none bg-slate-900/80 backdrop-blur border border-slate-800 rounded-lg p-2.5 text-xs text-slate-400 space-y-1 shadow-lg">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-semibold text-slate-200">3D 手术视口 (WebGPU / Three.js)</span>
        </div>
        <div>左键拖拽: 自由旋转 | 滚轮: 缩放视角</div>
        <div>当前屈曲角度: <span className="font-mono text-cyan-400 font-bold">{flexionAngle}°</span></div>
      </div>
    </div>
  );
};
