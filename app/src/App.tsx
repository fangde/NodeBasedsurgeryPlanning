import React, { useState } from 'react';
import { PatientCase, FemoralPlan, TibialPlan } from './types/surgery';
import { calculateGaps } from './utils/kinematics';
import { GraphCanvas } from './components/GraphCanvas';
import { Viewport3D } from './components/Viewport3D';
import { RoboticExportModal } from './components/RoboticExportModal';
import {
  Layers,
  Bot,
  Maximize2,
  Minimize2,
  FolderOpen
} from 'lucide-react';

// Default Clinical Case #042 Data
const demoCase: PatientCase = {
  id: 'CASE-042',
  name: '张女士 (Zhang Xiu)',
  age: 68,
  gender: 'Female',
  diagnosis: '重度膝关节内翻骨性关节炎 (Kellgren-Lawrence IV 级)',
  affectedSide: 'Right',
  preOpHKA: 172.5,
  preOpVarus: 7.5,
  targetHKA: 180.0,
  description: '右膝内侧间隙完全狭窄磨损，伴随 7.5° 内翻畸形及轻度屈曲挛缩。'
};

export const App: React.FC = () => {
  // View mode: 'canvas' (Infinite Node Canvas) or 'fullscreen-3d'
  const [viewMode, setViewMode] = useState<'canvas' | 'fullscreen-3d'>('canvas');

  // Surgical Planning Parameters
  const [femoralPlan, setFemoralPlan] = useState<FemoralPlan>({
    size: 'Size 4',
    varusValgus: 0.0,
    flexionExtension: 3.0,
    distalCutDepth: 9.0,
    internalExternalRotation: 3.0,
    anteriorCutDepth: 8.0,
    posteriorCutDepth: 9.0
  });

  const [tibialPlan, setTibialPlan] = useState<TibialPlan>({
    size: 'Size 4',
    varusValgus: 0.0,
    posteriorSlope: 4.0,
    resectionDepth: 8.0,
    internalExternalRotation: 0.0,
    insertThickness: 10.0
  });

  // Kinematic Motion Simulation State
  const [flexionAngle, setFlexionAngle] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Robotic Export Modal
  const [isRobotModalOpen, setIsRobotModalOpen] = useState(false);

  // Calculate Real-time Gaps
  const gapResult = calculateGaps(femoralPlan, tibialPlan, demoCase.preOpVarus);

  // Calculate Post-Op HKA
  const postOpHKA = 180.0 - femoralPlan.varusValgus - tibialPlan.varusValgus;

  return (
    <div className="flex flex-col h-screen w-screen bg-[#070b14] text-slate-100 font-sans overflow-hidden select-none">
      {/* Top Application Header */}
      <header className="h-12 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between px-4 z-30 backdrop-blur">
        {/* Brand & Specialty */}
        <div className="flex items-center gap-2.5">
          <div className="p-1 rounded-lg bg-indigo-600 shadow-md shadow-indigo-600/30">
            <Layers className="w-4 h-4 text-white" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs tracking-wide text-white">NodeSurg</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Knee TKA Canvas
            </span>
          </div>
        </div>

        {/* Center Case Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
            <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-300">案例: {demoCase.id} ({demoCase.name})</span>
            <span className="text-[11px] text-rose-400 font-mono">术前内翻 {demoCase.preOpVarus}°</span>
            <span className="text-slate-500">➔</span>
            <span className="text-[11px] text-emerald-400 font-mono font-semibold">
              矫正至中立位 {postOpHKA.toFixed(1)}°
            </span>
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Switch between Canvas and Fullscreen 3D View */}
          <button
            onClick={() => setViewMode(viewMode === 'canvas' ? 'fullscreen-3d' : 'canvas')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-lg border transition-all ${
              viewMode === 'fullscreen-3d'
                ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {viewMode === 'canvas' ? (
              <>
                <Maximize2 className="w-3.5 h-3.5" />
                <span>全屏 3D 视口</span>
              </>
            ) : (
              <>
                <Minimize2 className="w-3.5 h-3.5" />
                <span>返回节点画布</span>
              </>
            )}
          </button>

          {/* Robot Deploy Button */}
          <button
            onClick={() => setIsRobotModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-lg bg-gradient-to-r from-rose-600 to-amber-600 text-white hover:from-rose-500 hover:to-amber-500 shadow-md shadow-rose-600/20"
          >
            <Bot className="w-3.5 h-3.5" />
            <span>部署机器人</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Body */}
      <div className="flex-1 w-full h-full relative overflow-hidden">
        {viewMode === 'canvas' ? (
          /* Infinite Node Canvas (Pan, Zoom, Drag Nodes, Bézier Cables) */
          <GraphCanvas
            femoralPlan={femoralPlan}
            tibialPlan={tibialPlan}
            gapResult={gapResult}
            onChangeFemur={setFemoralPlan}
            onChangeTibia={setTibialPlan}
            flexionAngle={flexionAngle}
            onChangeFlexion={setFlexionAngle}
            isPlaying={isPlaying}
            onTogglePlay={() => setIsPlaying(!isPlaying)}
            onOpenRobotModal={() => setIsRobotModalOpen(true)}
            preOpVarus={demoCase.preOpVarus}
          />
        ) : (
          /* Fullscreen 3D Viewport Option */
          <div className="w-full h-full relative">
            <Viewport3D
              femoralPlan={femoralPlan}
              tibialPlan={tibialPlan}
              flexionAngle={flexionAngle}
              showBones={true}
              showImplants={true}
              showCutPlanes={true}
              showPreOpGhost={true}
              showAxes={true}
              preOpVarus={demoCase.preOpVarus}
            />
          </div>
        )}
      </div>

      {/* Robotic Deployment Modal */}
      <RoboticExportModal
        isOpen={isRobotModalOpen}
        onClose={() => setIsRobotModalOpen(false)}
        femoralPlan={femoralPlan}
        tibialPlan={tibialPlan}
      />
    </div>
  );
};

export default App;
