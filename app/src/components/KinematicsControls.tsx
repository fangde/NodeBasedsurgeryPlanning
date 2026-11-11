import React, { useEffect } from 'react';
import { Play, Pause, RotateCcw, Activity } from 'lucide-react';

interface KinematicsControlsProps {
  flexionAngle: number;
  onChangeFlexion: (angle: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
}

export const KinematicsControls: React.FC<KinematicsControlsProps> = ({
  flexionAngle,
  onChangeFlexion,
  isPlaying,
  onTogglePlay
}) => {
  // Auto-play animation loop
  useEffect(() => {
    if (!isPlaying) return;

    let direction = 1;
    let currentAngle = flexionAngle;

    const interval = setInterval(() => {
      currentAngle += direction * 1.5;
      if (currentAngle >= 115) {
        direction = -1;
      } else if (currentAngle <= 5) {
        direction = 1;
      }
      onChangeFlexion(Math.round(currentAngle));
    }, 40);

    return () => clearInterval(interval);
  }, [isPlaying, onChangeFlexion]);

  const rollbackMm = ((-Math.sin((flexionAngle * Math.PI) / 180 * 0.8) * 9.5)).toFixed(1);
  const axialRotDeg = (((flexionAngle / 120) * 8)).toFixed(1);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 shadow-xl backdrop-blur">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-semibold text-slate-200">术后关节动力学仿真 (0° ~ 120° ROM)</span>
        </div>

        {/* Play/Pause & Reset */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onTogglePlay}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
              isPlaying
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-indigo-600 text-white hover:bg-indigo-500'
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? '暂停仿真' : '连续运动仿真'}</span>
          </button>

          <button
            onClick={() => onChangeFlexion(0)}
            title="复位至 0° 伸直位"
            className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Angle Slider */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-mono">
          <span className="text-slate-400">屈伸曲率角度 (Flexion Angle)</span>
          <span className="text-cyan-400 font-bold text-sm">{flexionAngle}°</span>
        </div>
        <input
          type="range"
          min="0"
          max="120"
          step="1"
          value={flexionAngle}
          onChange={(e) => onChangeFlexion(parseInt(e.target.value, 10))}
          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
        />
      </div>

      {/* Preset Quick Angles & Realtime Kinematic Metrics */}
      <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-slate-800 text-[11px]">
        {/* Preset Buttons */}
        <div className="flex items-center gap-1 text-slate-400">
          <span className="text-[10px] mr-1">位姿快照:</span>
          {[0, 30, 60, 90, 115].map((ang) => (
            <button
              key={ang}
              onClick={() => onChangeFlexion(ang)}
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${
                flexionAngle === ang
                  ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                  : 'bg-slate-800/80 border-slate-700/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              {ang}°
            </button>
          ))}
        </div>

        {/* Real-time roll-back & axial rotation metrics */}
        <div className="flex items-center gap-3 font-mono text-[10px]">
          <div>
            <span className="text-slate-500">股骨后移: </span>
            <span className="text-slate-300 font-semibold">{rollbackMm} mm</span>
          </div>
          <div>
            <span className="text-slate-500">胫骨轴旋: </span>
            <span className="text-emerald-400 font-semibold">+{axialRotDeg}°</span>
          </div>
        </div>
      </div>
    </div>
  );
};
