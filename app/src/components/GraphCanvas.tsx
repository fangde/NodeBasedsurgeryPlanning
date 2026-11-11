import React, { useState, useRef, useEffect } from 'react';
import { FemoralPlan, TibialPlan, GapBalanceResult } from '../types/surgery';
import { Viewport3D } from './Viewport3D';
import {
  Layers,
  Activity,
  Bot,
  Sliders,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Move,
  Ruler,
  Eye,
  FolderOpen
} from 'lucide-react';

interface GraphCanvasProps {
  femoralPlan: FemoralPlan;
  tibialPlan: TibialPlan;
  gapResult: GapBalanceResult;
  onChangeFemur: (plan: FemoralPlan) => void;
  onChangeTibia: (plan: TibialPlan) => void;
  flexionAngle: number;
  onChangeFlexion: (angle: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onOpenRobotModal: () => void;
  preOpVarus: number;
}

interface CanvasNode {
  id: string;
  title: string;
  category: 'input' | 'processing' | 'planning' | 'simulation' | 'robot';
  x: number;
  y: number;
  width: number;
  inputs: { id: string; name: string; type: string }[];
  outputs: { id: string; name: string; type: string }[];
}

interface Connection {
  fromNode: string;
  fromPin: string;
  toNode: string;
  toPin: string;
  color: string;
}

export const GraphCanvas: React.FC<GraphCanvasProps> = ({
  femoralPlan,
  tibialPlan,
  gapResult,
  onChangeFemur,
  onChangeTibia,
  flexionAngle,
  onChangeFlexion,
  isPlaying,
  onTogglePlay,
  onOpenRobotModal,
  preOpVarus
}) => {
  // Canvas Pan & Zoom state
  const [zoom, setZoom] = useState(0.85);
  const [pan, setPan] = useState({ x: 80, y: 60 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0 });

  // 3D Viewport display flags inside node
  const [showPreOpGhost, setShowPreOpGhost] = useState(true);
  const [showCutPlanes, setShowCutPlanes] = useState(true);
  const [showImplants, setShowImplants] = useState(true);
  const [showAxes, setShowAxes] = useState(true);

  // Nodes on Canvas
  const [nodes, setNodes] = useState<CanvasNode[]>([
    {
      id: 'node-xray',
      title: '2D 双向 X-Ray 影像源',
      category: 'input',
      x: 40,
      y: 120,
      width: 320,
      inputs: [],
      outputs: [
        { id: 'ap_img', name: 'AP 正位影像', type: 'Image2D' },
        { id: 'lat_img', name: 'Lat 侧位影像', type: 'Image2D' }
      ]
    },
    {
      id: 'node-recon',
      title: '2D-3D 骨骼形态重建 (SSM)',
      category: 'processing',
      x: 400,
      y: 120,
      width: 290,
      inputs: [
        { id: 'ap_in', name: 'AP 影像输入', type: 'Image2D' },
        { id: 'lat_in', name: 'Lat 影像输入', type: 'Image2D' }
      ],
      outputs: [
        { id: 'femur_mesh', name: '股骨 3D 模型', type: 'Mesh3D' },
        { id: 'tibia_mesh', name: '胫骨 3D 模型', type: 'Mesh3D' }
      ]
    },
    {
      id: 'node-femur-plan',
      title: '股骨侧截骨与假体规划',
      category: 'planning',
      x: 740,
      y: 40,
      width: 330,
      inputs: [{ id: 'femur_in', name: '股骨网格', type: 'Mesh3D' }],
      outputs: [
        { id: 'femur_cut', name: '远端截骨面', type: 'CuttingPlane' },
        { id: 'femur_pose', name: '股骨假体位姿', type: 'Transform3D' }
      ]
    },
    {
      id: 'node-tibia-plan',
      title: '胫骨侧截骨与托盘规划',
      category: 'planning',
      x: 740,
      y: 480,
      width: 330,
      inputs: [{ id: 'tibia_in', name: '胫骨网格', type: 'Mesh3D' }],
      outputs: [
        { id: 'tibia_cut', name: '平台截骨面', type: 'CuttingPlane' },
        { id: 'tibia_pose', name: '胫骨假体位姿', type: 'Transform3D' }
      ]
    },
    {
      id: 'node-gap-balancing',
      title: '屈伸间隙平衡分析 (Gap Balance)',
      category: 'simulation',
      x: 1120,
      y: 220,
      width: 340,
      inputs: [
        { id: 'femur_plan_in', name: '股骨截骨参数', type: 'CuttingPlane' },
        { id: 'tibia_plan_in', name: '胫骨截骨参数', type: 'CuttingPlane' }
      ],
      outputs: [{ id: 'gap_data', name: '间隙张力数据', type: 'GapMetrics' }]
    },
    {
      id: 'node-3d-sim',
      title: '3D 手术交互视口与运动仿真 (Viewport)',
      category: 'simulation',
      x: 1510,
      y: 60,
      width: 540,
      inputs: [
        { id: 'femur_mesh_in', name: '股骨解剖', type: 'Mesh3D' },
        { id: 'tibia_mesh_in', name: '胫骨解剖', type: 'Mesh3D' },
        { id: 'femur_pose_in', name: '股骨假体', type: 'Transform3D' },
        { id: 'tibia_pose_in', name: '胫骨假体', type: 'Transform3D' }
      ],
      outputs: [{ id: 'sim_model', name: '术后装配模型', type: 'SurgicalAssembly' }]
    },
    {
      id: 'node-robot-export',
      title: '手术机器人与配准部署 (ROS2 / OpenIGTLink)',
      category: 'robot',
      x: 1510,
      y: 680,
      width: 540,
      inputs: [
        { id: 'assembly_in', name: '术后装配模型', type: 'SurgicalAssembly' },
        { id: 'gap_in', name: '间隙数据', type: 'GapMetrics' }
      ],
      outputs: [{ id: 'robot_pkg', name: '机器人控制包', type: 'OpenIGTLink_Pkg' }]
    }
  ]);

  // Connections (Edges)
  const connections: Connection[] = [
    { fromNode: 'node-xray', fromPin: 'ap_img', toNode: 'node-recon', toPin: 'ap_in', color: '#38bdf8' },
    { fromNode: 'node-xray', fromPin: 'lat_img', toNode: 'node-recon', toPin: 'lat_in', color: '#38bdf8' },
    { fromNode: 'node-recon', fromPin: 'femur_mesh', toNode: 'node-femur-plan', toPin: 'femur_in', color: '#a855f7' },
    { fromNode: 'node-recon', fromPin: 'tibia_mesh', toNode: 'node-tibia-plan', toPin: 'tibia_in', color: '#a855f7' },
    { fromNode: 'node-femur-plan', fromPin: 'femur_cut', toNode: 'node-gap-balancing', toPin: 'femur_plan_in', color: '#f59e0b' },
    { fromNode: 'node-tibia-plan', fromPin: 'tibia_cut', toNode: 'node-gap-balancing', toPin: 'tibia_plan_in', color: '#06b6d4' },
    { fromNode: 'node-recon', fromPin: 'femur_mesh', toNode: 'node-3d-sim', toPin: 'femur_mesh_in', color: '#a855f7' },
    { fromNode: 'node-recon', fromPin: 'tibia_mesh', toNode: 'node-3d-sim', toPin: 'tibia_mesh_in', color: '#a855f7' },
    { fromNode: 'node-femur-plan', fromPin: 'femur_pose', toNode: 'node-3d-sim', toPin: 'femur_pose_in', color: '#f59e0b' },
    { fromNode: 'node-tibia-plan', fromPin: 'tibia_pose', toNode: 'node-3d-sim', toPin: 'tibia_pose_in', color: '#06b6d4' },
    { fromNode: 'node-3d-sim', fromPin: 'sim_model', toNode: 'node-robot-export', toPin: 'assembly_in', color: '#10b981' },
    { fromNode: 'node-gap-balancing', fromPin: 'gap_data', toNode: 'node-robot-export', toPin: 'gap_in', color: '#10b981' }
  ];

  // Dragging node state
  const draggingNodeIdRef = useRef<string | null>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  // Handle Canvas Pan (Mouse drag on canvas background)
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    // Only pan if clicking canvas background, not inside a node
    if ((e.target as HTMLElement).closest('.canvas-node')) return;
    setIsPanning(true);
    panStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStartRef.current.x,
        y: e.clientY - panStartRef.current.y
      });
    } else if (draggingNodeIdRef.current) {
      const nodeId = draggingNodeIdRef.current;
      const mouseCanvasX = (e.clientX - pan.x) / zoom;
      const mouseCanvasY = (e.clientY - pan.y) / zoom;

      setNodes((prevNodes) =>
        prevNodes.map((n) =>
          n.id === nodeId
            ? {
                ...n,
                x: mouseCanvasX - dragOffsetRef.current.x,
                y: mouseCanvasY - dragOffsetRef.current.y
              }
            : n
        )
      );
    }
  };

  const handleCanvasMouseUp = () => {
    setIsPanning(false);
    draggingNodeIdRef.current = null;
  };

  // Handle Zoom with Mouse Wheel
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = 1.08;
    const newZoom = e.deltaY < 0 ? zoom * zoomFactor : zoom / zoomFactor;
    const clampedZoom = Math.min(2.0, Math.max(0.35, newZoom));

    // Zoom towards cursor
    const mouseX = e.clientX;
    const mouseY = e.clientY;
    const newPanX = mouseX - (mouseX - pan.x) * (clampedZoom / zoom);
    const newPanY = mouseY - (mouseY - pan.y) * (clampedZoom / zoom);

    setZoom(clampedZoom);
    setPan({ x: newPanX, y: newPanY });
  };

  // Node Drag Handler (Mouse down on node title bar)
  const startDragNode = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    draggingNodeIdRef.current = nodeId;
    const targetNode = nodes.find((n) => n.id === nodeId);
    if (!targetNode) return;

    const mouseCanvasX = (e.clientX - pan.x) / zoom;
    const mouseCanvasY = (e.clientY - pan.y) / zoom;

    dragOffsetRef.current = {
      x: mouseCanvasX - targetNode.x,
      y: mouseCanvasY - targetNode.y
    };
  };

  // Calculate pin coordinates for SVG cable curves
  const getPinCoords = (nodeId: string, pinId: string, isOutput: boolean) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return { x: 0, y: 0 };

    const pins = isOutput ? node.outputs : node.inputs;
    const pinIndex = pins.findIndex((p) => p.id === pinId);
    const pinOffset = pinIndex >= 0 ? pinIndex * 24 + 50 : 50;

    return {
      x: isOutput ? node.x + node.width : node.x,
      y: node.y + pinOffset
    };
  };

  // Fit graph to center
  const fitView = () => {
    setZoom(0.68);
    setPan({ x: 40, y: 40 });
  };

  // Kinematic auto-play loop
  useEffect(() => {
    if (!isPlaying) return;
    let dir = 1;
    let ang = flexionAngle;
    const interval = setInterval(() => {
      ang += dir * 2;
      if (ang >= 115) dir = -1;
      if (ang <= 5) dir = 1;
      onChangeFlexion(Math.round(ang));
    }, 40);
    return () => clearInterval(interval);
  }, [isPlaying, onChangeFlexion]);

  const postOpHKA = 180.0 - femoralPlan.varusValgus - tibialPlan.varusValgus;

  return (
    <div
      className="relative w-full h-full bg-[#070b14] overflow-hidden select-none cursor-default"
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleCanvasMouseMove}
      onMouseUp={handleCanvasMouseUp}
      onWheel={handleWheel}
    >
      {/* Top Floating Control Bar */}
      <div className="absolute top-4 left-4 z-40 flex items-center gap-2 bg-slate-900/90 backdrop-blur border border-slate-800/80 p-2 rounded-2xl shadow-2xl">
        <div className="flex items-center gap-2 pl-2 pr-3 border-r border-slate-800">
          <div className="p-1.5 rounded-lg bg-indigo-600 shadow-md shadow-indigo-600/30">
            <Layers className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xs text-white">NodeSurg Canvas</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                DAG Graph
              </span>
            </div>
            <span className="text-[10px] text-slate-400">无限节点画布 (Pan & Zoom)</span>
          </div>
        </div>

        {/* Case Info */}
        <div className="flex items-center gap-2 px-3 py-1 bg-slate-950/80 rounded-xl border border-slate-800 text-xs">
          <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-slate-300">CASE-042 (张女士 68岁)</span>
          <span className="text-rose-400 font-mono text-[11px]">7.5° 内翻</span>
          <span className="text-slate-500">➔</span>
          <span className="text-emerald-400 font-mono text-[11px] font-semibold">{postOpHKA.toFixed(1)}° 中立位</span>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 pl-2">
          <button
            onClick={() => setZoom((z) => Math.min(2.0, z * 1.15))}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
            title="放大"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-mono text-slate-400 w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.max(0.35, z / 1.15))}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
            title="缩小"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={fitView}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 ml-1"
            title="适应全图"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Infinite Grid Background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(circle at 1px 1px, rgba(71, 85, 105, 0.25) 1px, transparent 0)
          `,
          backgroundSize: `${32 * zoom}px ${32 * zoom}px`,
          backgroundPosition: `${pan.x}px ${pan.y}px`
        }}
      />

      {/* Zoomable & Pannable World Container */}
      <div
        className="absolute top-0 left-0 w-full h-full transform-gpu"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0'
        }}
      >
        {/* SVG Cable Layer for Bézier Connection Curves */}
        <svg className="absolute top-0 left-0 w-[4000px] h-[3000px] pointer-events-none overflow-visible z-0">
          <defs>
            <linearGradient id="cablePulse" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#818cf8" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#38bdf8" stopOpacity="1" />
              <stop offset="100%" stopColor="#818cf8" stopOpacity="0.8" />
            </linearGradient>
            <filter id="cableGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {connections.map((conn, idx) => {
            const start = getPinCoords(conn.fromNode, conn.fromPin, true);
            const end = getPinCoords(conn.toNode, conn.toPin, false);
            const dx = Math.max(60, Math.abs(end.x - start.x) * 0.45);

            const pathD = `M ${start.x} ${start.y} C ${start.x + dx} ${start.y}, ${end.x - dx} ${end.y}, ${end.x} ${end.y}`;

            return (
              <g key={idx}>
                {/* Glow under-cable */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={conn.color}
                  strokeWidth="5"
                  opacity="0.25"
                />
                {/* Main cable */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={conn.color}
                  strokeWidth="2.5"
                  opacity="0.9"
                />
                {/* Animated data pulses flowing from left to right */}
                <path
                  d={pathD}
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="2.5"
                  strokeDasharray="6 18"
                  strokeDashoffset={-flexionAngle * 2}
                  opacity="0.8"
                />
              </g>
            );
          })}
        </svg>

        {/* ======================================================== */}
        {/* Canvas Nodes Layer                                       */}
        {/* ======================================================== */}
        {nodes.map((node) => {
          const is3DNode = node.id === 'node-3d-sim';
          const isXRayNode = node.id === 'node-xray';
          const isReconNode = node.id === 'node-recon';
          const isFemurNode = node.id === 'node-femur-plan';
          const isTibiaNode = node.id === 'node-tibia-plan';
          const isGapNode = node.id === 'node-gap-balancing';
          const isRobotNode = node.id === 'node-robot-export';

          return (
            <div
              key={node.id}
              className="canvas-node absolute rounded-2xl bg-slate-900/95 border border-slate-700/80 shadow-2xl backdrop-blur flex flex-col z-10 transition-shadow hover:shadow-indigo-500/10 hover:border-slate-600"
              style={{
                left: node.x,
                top: node.y,
                width: node.width
              }}
            >
              {/* Node Header (Drag Handle) */}
              <div
                onMouseDown={(e) => startDragNode(e, node.id)}
                className="h-10 px-3.5 bg-slate-800/90 border-b border-slate-700/80 rounded-t-2xl flex items-center justify-between cursor-move select-none"
              >
                <div className="flex items-center gap-2">
                  <Move className="w-3.5 h-3.5 text-slate-400 opacity-60" />
                  <span className="font-semibold text-xs text-slate-100">{node.title}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-[10px] font-mono text-emerald-300">就绪</span>
                </div>
              </div>

              {/* Pins layer (Inputs on Left, Outputs on Right) */}
              <div className="relative px-3 py-2 flex justify-between text-[11px] font-mono text-slate-400 border-b border-slate-800/80 bg-slate-950/40">
                {/* Inputs */}
                <div className="space-y-1">
                  {node.inputs.map((inp) => (
                    <div key={inp.id} className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 border border-slate-900 -ml-4" />
                      <span>{inp.name}</span>
                    </div>
                  ))}
                </div>

                {/* Outputs */}
                <div className="space-y-1 text-right">
                  {node.outputs.map((out) => (
                    <div key={out.id} className="flex items-center justify-end gap-1.5">
                      <span>{out.name}</span>
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 border border-slate-900 -mr-4" />
                    </div>
                  ))}
                </div>
              </div>

              {/* =================================================== */}
              {/* Node Internal Content Widgets                       */}
              {/* =================================================== */}
              <div className="p-3 text-xs space-y-3">
                {/* 1. X-Ray Input Node Content */}
                {isXRayNode && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800">
                      <div className="text-center">
                        <span className="text-[10px] text-slate-400 block mb-1">AP 正位片</span>
                        <div className="h-32 bg-black/80 rounded border border-slate-800 flex items-center justify-center relative overflow-hidden">
                          {/* Mini AP contour */}
                          <svg viewBox="0 0 100 120" className="w-full h-full opacity-80">
                            <path d="M 40 10 L 40 40 C 40 50, 25 60, 25 70 C 25 75, 35 77, 45 74 C 55 77, 75 75, 75 70 C 75 60, 60 50, 60 40 L 60 10 Z" fill="#94a3b8" />
                            <path d="M 28 80 C 40 80, 50 82, 50 80 C 50 82, 60 80, 72 80 C 72 90, 60 95, 60 115 L 40 115 C 40 95, 28 90, 28 80 Z" fill="#94a3b8" />
                            <line x1="20" y1="71" x2="80" y2="71" stroke="#f43f5e" strokeWidth="1.5" strokeDasharray="2 2" />
                            <circle cx="18" cy="105" r="5" fill="#38bdf8" />
                          </svg>
                          <span className="absolute bottom-1 left-1 text-[8px] font-mono text-cyan-400">25mm 定标球</span>
                        </div>
                      </div>

                      <div className="text-center">
                        <span className="text-[10px] text-slate-400 block mb-1">Lateral 侧位片</span>
                        <div className="h-32 bg-black/80 rounded border border-slate-800 flex items-center justify-center relative overflow-hidden">
                          {/* Mini Lat contour */}
                          <svg viewBox="0 0 100 120" className="w-full h-full opacity-80">
                            <path d="M 45 10 L 45 40 C 45 55, 30 65, 30 72 C 30 80, 50 82, 65 77 C 75 70, 75 60, 65 40 L 60 10 Z" fill="#94a3b8" />
                            <path d="M 35 83 C 55 84, 70 87, 72 90 C 70 100, 62 105, 62 115 L 45 115 C 45 105, 33 100, 35 83 Z" fill="#94a3b8" />
                            <line x1="30" y1="87" x2="75" y2="92" stroke="#06b6d4" strokeWidth="1.5" strokeDasharray="2 2" />
                          </svg>
                          <span className="absolute bottom-1 right-1 text-[8px] font-mono text-cyan-400">后倾 4°</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center justify-between">
                      <span>定标比例: 1px = 0.52mm</span>
                      <span className="text-emerald-400 font-mono">DICOM 校验通过</span>
                    </div>
                  </div>
                )}

                {/* 2. SSM Reconstruction Node Content */}
                {isReconNode && (
                  <div className="space-y-2">
                    <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5 font-mono text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-slate-400">形态匹配置信度:</span>
                        <span className="text-emerald-400 font-bold">98.4%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">股骨三角面片:</span>
                        <span className="text-slate-300">24,560 面</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">胫骨三角面片:</span>
                        <span className="text-slate-300">18,340 面</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">解剖特征点:</span>
                        <span className="text-indigo-400">24 标记点自动提取</span>
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-400 leading-tight">
                      已自动计算上髁轴线 (TEA) 与后髁轴线 (PCA)。
                    </div>
                  </div>
                )}

                {/* 3. Femoral Cut Plan Node Content */}
                {isFemurNode && (
                  <div className="space-y-2.5">
                    {/* Distal Cut Slider */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400">远端截骨量 (Distal Cut)</span>
                        <span className="font-mono text-amber-400 font-bold">{femoralPlan.distalCutDepth} mm</span>
                      </div>
                      <input
                        type="range"
                        min="6.0"
                        max="13.0"
                        step="0.5"
                        value={femoralPlan.distalCutDepth}
                        onChange={(e) => onChangeFemur({ ...femoralPlan, distalCutDepth: parseFloat(e.target.value) })}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                      />
                    </div>

                    {/* External Rotation Slider */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400">外旋角 (External Rotation)</span>
                        <span className="font-mono text-amber-400 font-bold">{femoralPlan.internalExternalRotation}°</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="6"
                        step="0.5"
                        value={femoralPlan.internalExternalRotation}
                        onChange={(e) => onChangeFemur({ ...femoralPlan, internalExternalRotation: parseFloat(e.target.value) })}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[11px]">
                      <span className="text-slate-400">假体选型:</span>
                      <span className="font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                        {femoralPlan.size} (CoCr 金属)
                      </span>
                    </div>
                  </div>
                )}

                {/* 4. Tibial Cut Plan Node Content */}
                {isTibiaNode && (
                  <div className="space-y-2.5">
                    {/* Resection Depth */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400">平台截骨量 (Cut Depth)</span>
                        <span className="font-mono text-cyan-400 font-bold">{tibialPlan.resectionDepth} mm</span>
                      </div>
                      <input
                        type="range"
                        min="5.0"
                        max="12.0"
                        step="0.5"
                        value={tibialPlan.resectionDepth}
                        onChange={(e) => onChangeTibia({ ...tibialPlan, resectionDepth: parseFloat(e.target.value) })}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                      />
                    </div>

                    {/* Posterior Slope */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400">后倾角 (Posterior Slope)</span>
                        <span className="font-mono text-cyan-400 font-bold">{tibialPlan.posteriorSlope}°</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="8"
                        step="0.5"
                        value={tibialPlan.posteriorSlope}
                        onChange={(e) => onChangeTibia({ ...tibialPlan, posteriorSlope: parseFloat(e.target.value) })}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                      />
                    </div>

                    {/* Insert Thickness */}
                    <div className="space-y-1 pt-1 border-t border-slate-800/80">
                      <span className="text-[10px] text-slate-400 block mb-1">聚乙烯衬垫厚度:</span>
                      <div className="grid grid-cols-4 gap-1">
                        {[9, 10, 11, 12].map((t) => (
                          <button
                            key={t}
                            onClick={() => onChangeTibia({ ...tibialPlan, insertThickness: t })}
                            className={`py-0.5 rounded text-[10px] font-mono border ${
                              tibialPlan.insertThickness === t
                                ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                                : 'bg-slate-800 border-slate-700 text-slate-400'
                            }`}
                          >
                            {t}mm
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. Gap Balancing Node Content */}
                {isGapNode && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800">
                      <div className="p-2 rounded bg-slate-900 border border-slate-800 text-center">
                        <span className="text-[10px] text-slate-400 block mb-1">伸直间隙 (0°)</span>
                        <div className="flex justify-around font-mono text-xs">
                          <div>
                            <span className="text-[8px] text-slate-500 block">内</span>
                            <span className="text-emerald-400 font-bold">{gapResult.extensionMedial}</span>
                          </div>
                          <div>
                            <span className="text-[8px] text-slate-500 block">外</span>
                            <span className="text-sky-400 font-bold">{gapResult.extensionLateral}</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-2 rounded bg-slate-900 border border-slate-800 text-center">
                        <span className="text-[10px] text-slate-400 block mb-1">屈曲间隙 (90°)</span>
                        <div className="flex justify-around font-mono text-xs">
                          <div>
                            <span className="text-[8px] text-slate-500 block">内</span>
                            <span className="text-emerald-400 font-bold">{gapResult.flexionMedial}</span>
                          </div>
                          <div>
                            <span className="text-[8px] text-slate-500 block">外</span>
                            <span className="text-sky-400 font-bold">{gapResult.flexionLateral}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>矩形间隙平衡达标</span>
                      </div>
                      <span className="font-mono font-semibold">Δ 0.2mm</span>
                    </div>
                  </div>
                )}

                {/* 6. Embedded 3D Viewport Node Content */}
                {is3DNode && (
                  <div className="space-y-3">
                    {/* 3D Viewport Container embedded inside node */}
                    <div className="w-full h-80 rounded-xl overflow-hidden border border-slate-800 bg-black relative">
                      <Viewport3D
                        femoralPlan={femoralPlan}
                        tibialPlan={tibialPlan}
                        flexionAngle={flexionAngle}
                        showBones={true}
                        showImplants={showImplants}
                        showCutPlanes={showCutPlanes}
                        showPreOpGhost={showPreOpGhost}
                        showAxes={showAxes}
                        preOpVarus={preOpVarus}
                      />

                      {/* Viewport Overlay Controls */}
                      <div className="absolute top-2 right-2 flex items-center gap-1 z-20">
                        <button
                          onClick={() => setShowPreOpGhost(!showPreOpGhost)}
                          title="术前畸形骨对照 (Ghost)"
                          className={`p-1.5 rounded text-[10px] border ${
                            showPreOpGhost
                              ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                              : 'bg-slate-900/80 border-slate-700 text-slate-400'
                          }`}
                        >
                          <Eye className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => setShowCutPlanes(!showCutPlanes)}
                          title="截骨面开关"
                          className={`p-1.5 rounded text-[10px] border ${
                            showCutPlanes
                              ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                              : 'bg-slate-900/80 border-slate-700 text-slate-400'
                          }`}
                        >
                          截骨面
                        </button>
                      </div>
                    </div>

                    {/* Kinematics ROM Slider inside 3D node */}
                    <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Activity className="w-3.5 h-3.5 text-cyan-400" />
                          <span className="text-xs font-semibold text-slate-200">术后关节屈曲仿真 (ROM)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-cyan-400 font-bold text-xs">{flexionAngle}°</span>
                          <button
                            onClick={onTogglePlay}
                            className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs transition-all ${
                              isPlaying
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : 'bg-indigo-600 text-white hover:bg-indigo-500'
                            }`}
                          >
                            {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                            <span>{isPlaying ? '暂停' : '连续运动'}</span>
                          </button>
                        </div>
                      </div>

                      <input
                        type="range"
                        min="0"
                        max="120"
                        step="1"
                        value={flexionAngle}
                        onChange={(e) => onChangeFlexion(parseInt(e.target.value, 10))}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                      />

                      <div className="flex justify-between text-[10px] font-mono text-slate-400">
                        <span>股骨后移: {(-Math.sin((flexionAngle * Math.PI) / 180 * 0.8) * 9.5).toFixed(1)}mm</span>
                        <span>胫骨自旋: +{((flexionAngle / 120) * 8).toFixed(1)}°</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 7. Robotics & Sensor Export Node Content */}
                {isRobotNode && (
                  <div className="space-y-2.5">
                    <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5 text-[11px] font-mono">
                      <div className="flex justify-between">
                        <span className="text-slate-400">预估配准误差 (TRE):</span>
                        <span className="text-emerald-400 font-bold">0.32 mm (达标)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">机械臂虚拟夹具 (Virtual Fixture):</span>
                        <span className="text-amber-400 font-bold">力控阻尼已激活</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">传感器通信协议:</span>
                        <span className="text-indigo-400">OpenIGTLink_v3 / ROS2</span>
                      </div>
                    </div>

                    <button
                      onClick={onOpenRobotModal}
                      className="w-full py-2 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-lg shadow-rose-600/20"
                    >
                      <Bot className="w-4 h-4" />
                      <span>查看并导出机器人执行工程包</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
