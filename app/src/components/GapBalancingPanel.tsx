import React from 'react';
import { FemoralPlan, TibialPlan, GapBalanceResult } from '../types/surgery';
import { Activity, Sliders, CheckCircle2, AlertTriangle } from 'lucide-react';

interface GapBalancingPanelProps {
  femoralPlan: FemoralPlan;
  tibialPlan: TibialPlan;
  gapResult: GapBalanceResult;
  onChangeFemur: (plan: FemoralPlan) => void;
  onChangeTibia: (plan: TibialPlan) => void;
}

export const GapBalancingPanel: React.FC<GapBalancingPanelProps> = ({
  femoralPlan,
  tibialPlan,
  gapResult,
  onChangeFemur,
  onChangeTibia
}) => {
  return (
    <div className="flex flex-col h-full bg-slate-900/60 border-l border-slate-800 p-4 overflow-y-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-slate-100">屈伸间隙平衡 (Gap Balancing)</h3>
        </div>

        {/* Status Badge */}
        {gapResult.status === 'balanced' ? (
          <span className="flex items-center gap-1 text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="w-3 h-3" />
            矩形平衡 (Balanced)
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full">
            <AlertTriangle className="w-3 h-3" />
            间隙不对称
          </span>
        )}
      </div>

      {/* 2x2 Rectangular Gap Visualizer */}
      <div className="grid grid-cols-2 gap-3 p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 shadow-inner">
        {/* Extension Gap Card */}
        <div className="flex flex-col p-2.5 rounded-lg bg-slate-900 border border-slate-800">
          <div className="text-[11px] text-slate-400 mb-1 font-medium flex justify-between">
            <span>伸直位间隙 (0°)</span>
            <span className="text-indigo-400 font-mono">Δ {gapResult.extensionDelta}mm</span>
          </div>
          <div className="flex items-baseline justify-between mt-1 pt-1 border-t border-slate-800/80">
            <div>
              <span className="text-[10px] text-slate-500 block">内侧 Med</span>
              <span className="text-base font-bold font-mono text-emerald-400">
                {gapResult.extensionMedial}
                <span className="text-[10px] text-slate-400 font-normal ml-0.5">mm</span>
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-500 block">外侧 Lat</span>
              <span className="text-base font-bold font-mono text-sky-400">
                {gapResult.extensionLateral}
                <span className="text-[10px] text-slate-400 font-normal ml-0.5">mm</span>
              </span>
            </div>
          </div>
        </div>

        {/* Flexion Gap Card */}
        <div className="flex flex-col p-2.5 rounded-lg bg-slate-900 border border-slate-800">
          <div className="text-[11px] text-slate-400 mb-1 font-medium flex justify-between">
            <span>屈曲位间隙 (90°)</span>
            <span className="text-indigo-400 font-mono">Δ {gapResult.flexionDelta}mm</span>
          </div>
          <div className="flex items-baseline justify-between mt-1 pt-1 border-t border-slate-800/80">
            <div>
              <span className="text-[10px] text-slate-500 block">内侧 Med</span>
              <span className="text-base font-bold font-mono text-emerald-400">
                {gapResult.flexionMedial}
                <span className="text-[10px] text-slate-400 font-normal ml-0.5">mm</span>
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-500 block">外侧 Lat</span>
              <span className="text-base font-bold font-mono text-sky-400">
                {gapResult.flexionLateral}
                <span className="text-[10px] text-slate-400 font-normal ml-0.5">mm</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Surgical Cut & Implant Parameters */}
      <div className="space-y-4 pt-1">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
          <Sliders className="w-3.5 h-3.5 text-amber-400" />
          <span>股骨侧截骨与假体微调 (Femur)</span>
        </div>

        {/* Femoral Distal Cut Slider */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">远端截骨量 (Distal Resection)</span>
            <span className="font-mono text-slate-200 font-medium">{femoralPlan.distalCutDepth} mm</span>
          </div>
          <input
            type="range"
            min="6.0"
            max="13.0"
            step="0.5"
            value={femoralPlan.distalCutDepth}
            onChange={(e) =>
              onChangeFemur({ ...femoralPlan, distalCutDepth: parseFloat(e.target.value) })
            }
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
        </div>

        {/* Femoral External Rotation */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">股骨外旋角 (External Rotation)</span>
            <span className="font-mono text-slate-200 font-medium">{femoralPlan.internalExternalRotation}°</span>
          </div>
          <input
            type="range"
            min="0"
            max="6"
            step="0.5"
            value={femoralPlan.internalExternalRotation}
            onChange={(e) =>
              onChangeFemur({
                ...femoralPlan,
                internalExternalRotation: parseFloat(e.target.value)
              })
            }
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
        </div>

        {/* Tibial Parameters */}
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200 pt-2 border-t border-slate-800">
          <Sliders className="w-3.5 h-3.5 text-cyan-400" />
          <span>胫骨侧截骨与假体微调 (Tibia)</span>
        </div>

        {/* Tibial Resection Depth */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">近端截骨量 (Tibial Cut Depth)</span>
            <span className="font-mono text-slate-200 font-medium">{tibialPlan.resectionDepth} mm</span>
          </div>
          <input
            type="range"
            min="5.0"
            max="12.0"
            step="0.5"
            value={tibialPlan.resectionDepth}
            onChange={(e) =>
              onChangeTibia({ ...tibialPlan, resectionDepth: parseFloat(e.target.value) })
            }
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
          />
        </div>

        {/* Tibial Posterior Slope */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">胫骨后倾角 (Posterior Slope)</span>
            <span className="font-mono text-slate-200 font-medium">{tibialPlan.posteriorSlope}°</span>
          </div>
          <input
            type="range"
            min="0"
            max="8"
            step="0.5"
            value={tibialPlan.posteriorSlope}
            onChange={(e) =>
              onChangeTibia({ ...tibialPlan, posteriorSlope: parseFloat(e.target.value) })
            }
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
          />
        </div>

        {/* Polyethylene Insert Thickness Selector */}
        <div className="space-y-1.5 pt-1">
          <span className="text-xs text-slate-400">聚乙烯衬垫厚度 (Insert Thickness)</span>
          <div className="grid grid-cols-4 gap-1.5">
            {[9, 10, 11, 12].map((thick) => (
              <button
                key={thick}
                onClick={() => onChangeTibia({ ...tibialPlan, insertThickness: thick })}
                className={`py-1 rounded text-xs font-mono font-medium border transition-all ${
                  tibialPlan.insertThickness === thick
                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                    : 'bg-slate-800 border-slate-700/80 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {thick}mm
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
