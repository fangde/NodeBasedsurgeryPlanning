import React, { useState } from 'react';
import { FemoralPlan, TibialPlan } from '../types/surgery';
import { Eye, Ruler, Crosshair } from 'lucide-react';

interface XRayViewerProps {
  femoralPlan: FemoralPlan;
  tibialPlan: TibialPlan;
  preOpVarus: number;
}

export const XRayViewer: React.FC<XRayViewerProps> = ({
  femoralPlan,
  tibialPlan,
  preOpVarus
}) => {
  const [activeTab, setActiveTab] = useState<'both' | 'ap' | 'lat'>('both');
  const [showOverlays, setShowOverlays] = useState(true);

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Top Header */}
      <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Crosshair className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-semibold text-slate-200">
            双平面 2D X-Ray 透视视口 (AP 正位 + Lateral 侧位)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowOverlays(!showOverlays)}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md border transition-all ${
              showOverlays
                ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>规划截骨面投影</span>
          </button>

          <div className="flex bg-slate-800 rounded-lg p-0.5 border border-slate-700 text-xs">
            <button
              onClick={() => setActiveTab('both')}
              className={`px-2 py-0.5 rounded ${activeTab === 'both' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
            >
              正侧双显
            </button>
            <button
              onClick={() => setActiveTab('ap')}
              className={`px-2 py-0.5 rounded ${activeTab === 'ap' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
            >
              正位 (AP)
            </button>
            <button
              onClick={() => setActiveTab('lat')}
              className={`px-2 py-0.5 rounded ${activeTab === 'lat' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
            >
              侧位 (Lat)
            </button>
          </div>
        </div>
      </div>

      {/* Main X-Ray Display Area */}
      <div className="flex-1 grid grid-cols-2 gap-2 p-3 overflow-hidden bg-slate-950">
        {/* 1. AP View (Frontal Radiograph) */}
        {(activeTab === 'both' || activeTab === 'ap') && (
          <div className="relative flex flex-col items-center justify-center bg-black border border-slate-800/80 rounded-lg overflow-hidden p-2">
            <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5 bg-slate-900/80 px-2 py-0.5 rounded text-[11px] text-slate-300 border border-slate-700">
              <span>正位 (AP View)</span>
              <span className="text-amber-400">重度内翻 {preOpVarus}°</span>
            </div>

            {/* Simulated Clinical X-Ray AP Radiograph with SVG */}
            <svg viewBox="0 0 200 300" className="w-full h-full max-h-[340px]">
              <defs>
                <filter id="xrayGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="1.5" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <linearGradient id="boneGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#475569" stopOpacity="0.4" />
                  <stop offset="30%" stopColor="#cbd5e1" stopOpacity="0.85" />
                  <stop offset="70%" stopColor="#cbd5e1" stopOpacity="0.85" />
                  <stop offset="100%" stopColor="#475569" stopOpacity="0.4" />
                </linearGradient>
              </defs>

              {/* Background X-ray Noise / Exposure */}
              <rect width="200" height="300" fill="#030712" />

              {/* Distal Femur Contour */}
              <path
                d="M 85 20 L 85 80 C 85 110, 60 125, 60 145 C 60 155, 78 158, 92 153 C 100 150, 108 150, 116 153 C 130 158, 148 155, 148 145 C 148 125, 125 110, 125 80 L 125 20 Z"
                fill="url(#boneGrad)"
                stroke="#94a3b8"
                strokeWidth="1.2"
                filter="url(#xrayGlow)"
              />

              {/* Proximal Tibia Contour (Showing medial joint space collapse) */}
              <path
                d="M 64 163 C 78 163, 90 166, 100 160 C 110 166, 122 163, 144 163 C 144 185, 122 195, 122 230 L 122 290 L 88 290 L 88 230 C 88 195, 64 185, 64 163 Z"
                fill="url(#boneGrad)"
                stroke="#94a3b8"
                strokeWidth="1.2"
                filter="url(#xrayGlow)"
              />

              {/* Fibula silhouette */}
              <path
                d="M 148 180 C 158 185, 158 200, 150 215 L 146 290 L 138 290 L 142 205 Z"
                fill="url(#boneGrad)"
                stroke="#64748b"
                strokeWidth="0.8"
                opacity="0.6"
              />

              {/* 25mm Calibration Reference Ball */}
              <circle cx="28" cy="260" r="12" fill="#e2e8f0" opacity="0.9" stroke="#38bdf8" strokeWidth="1" />
              <text x="18" y="285" fill="#38bdf8" fontSize="8" fontFamily="monospace">
                25.0mm 定标球
              </text>

              {/* Overlaid Planned Resection Lines */}
              {showOverlays && (
                <g>
                  {/* Femoral distal cut line */}
                  <line
                    x1="55"
                    y1={155 - femoralPlan.distalCutDepth}
                    x2="153"
                    y2={155 - femoralPlan.distalCutDepth}
                    stroke="#f43f5e"
                    strokeWidth="1.8"
                    strokeDasharray="3 2"
                  />
                  <text
                    x="156"
                    y={155 - femoralPlan.distalCutDepth + 3}
                    fill="#f43f5e"
                    fontSize="7"
                    fontFamily="monospace"
                  >
                    股骨远端截骨 {femoralPlan.distalCutDepth}mm
                  </text>

                  {/* Tibial proximal resection cut line */}
                  <line
                    x1="58"
                    y1={163 + tibialPlan.resectionDepth}
                    x2="150"
                    y2={163 + tibialPlan.resectionDepth}
                    stroke="#06b6d4"
                    strokeWidth="1.8"
                    strokeDasharray="3 2"
                  />
                  <text
                    x="154"
                    y={163 + tibialPlan.resectionDepth + 3}
                    fill="#06b6d4"
                    fontSize="7"
                    fontFamily="monospace"
                  >
                    胫骨平台截骨 {tibialPlan.resectionDepth}mm
                  </text>

                  {/* Projected Mechanical Axis */}
                  <line x1="104" y1="20" x2="104" y2="290" stroke="#10b981" strokeWidth="1" strokeDasharray="4 4" />
                </g>
              )}
            </svg>
          </div>
        )}

        {/* 2. Lateral View (Sagittal Radiograph) */}
        {(activeTab === 'both' || activeTab === 'lat') && (
          <div className="relative flex flex-col items-center justify-center bg-black border border-slate-800/80 rounded-lg overflow-hidden p-2">
            <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5 bg-slate-900/80 px-2 py-0.5 rounded text-[11px] text-slate-300 border border-slate-700">
              <span>侧位 (Lateral View)</span>
              <span className="text-cyan-400">后倾角规划 {tibialPlan.posteriorSlope}°</span>
            </div>

            {/* Simulated Clinical X-Ray Lateral Radiograph */}
            <svg viewBox="0 0 200 300" className="w-full h-full max-h-[340px]">
              <rect width="200" height="300" fill="#030712" />

              {/* Lateral Femoral Condyle (curved posterior roll) */}
              <path
                d="M 90 20 L 90 85 C 90 115, 65 130, 65 145 C 65 160, 95 165, 125 155 C 145 145, 150 120, 135 95 C 125 80, 120 70, 120 20 Z"
                fill="url(#boneGrad)"
                stroke="#94a3b8"
                strokeWidth="1.2"
                filter="url(#xrayGlow)"
              />

              {/* Patella (Kneecap anterior) */}
              <path
                d="M 50 100 C 42 110, 42 130, 52 140 C 60 135, 62 115, 54 100 Z"
                fill="url(#boneGrad)"
                stroke="#94a3b8"
                strokeWidth="1.2"
                opacity="0.8"
              />

              {/* Proximal Tibia with Posterior Slope */}
              <path
                d="M 72 165 C 105 167, 135 174, 140 178 C 135 200, 124 220, 124 290 L 90 290 L 90 220 C 85 200, 68 185, 72 165 Z"
                fill="url(#boneGrad)"
                stroke="#94a3b8"
                strokeWidth="1.2"
                filter="url(#xrayGlow)"
              />

              {/* Overlaid Posterior Slope and Cut Line */}
              {showOverlays && (
                <g>
                  {/* Tibial posterior slope cut line */}
                  <line
                    x1="65"
                    y1="172"
                    x2="148"
                    y2={172 + tibialPlan.posteriorSlope * 1.5}
                    stroke="#06b6d4"
                    strokeWidth="2"
                    strokeDasharray="4 2"
                  />
                  <text
                    x="68"
                    y="192"
                    fill="#06b6d4"
                    fontSize="8"
                    fontFamily="monospace"
                  >
                    后倾角 {tibialPlan.posteriorSlope}° (Slope Cut)
                  </text>
                </g>
              )}
            </svg>
          </div>
        )}
      </div>

      {/* Footer info bar */}
      <div className="px-3 py-2 bg-slate-900 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Ruler className="w-3.5 h-3.5 text-indigo-400" />
          <span>解剖比例尺: 1px = 0.52mm | 畸形纠正: 7.5° 内翻 ➔ 0.0° 中立位</span>
        </div>
        <span className="font-mono text-emerald-400">2D-3D 模型匹配重合度: 98.4%</span>
      </div>
    </div>
  );
};
