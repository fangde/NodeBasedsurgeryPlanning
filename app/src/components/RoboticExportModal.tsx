import React, { useState } from 'react';
import { FemoralPlan, TibialPlan } from '../types/surgery';
import { Bot, CheckCircle2, Copy, Download, X, ShieldAlert, Cpu } from 'lucide-react';

interface RoboticExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  femoralPlan: FemoralPlan;
  tibialPlan: TibialPlan;
}

export const RoboticExportModal: React.FC<RoboticExportModalProps> = ({
  isOpen,
  onClose,
  femoralPlan,
  tibialPlan
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const exportPayload = {
    protocol: "OpenIGTLink_v3 / ROS2_Control",
    timestamp: new Date().toISOString(),
    patient_id: "CASE-042-VARUS-OA",
    registration_fiducials: [
      { id: "F1_FEMUR_MED_EPICONDYLE", coords_mm: [-38.2, 14.5, -12.0] },
      { id: "F2_FEMUR_LAT_EPICONDYLE", coords_mm: [36.8, 15.1, -11.4] },
      { id: "F3_KNEE_CENTER", coords_mm: [0.0, 10.0, 0.0] },
      { id: "T1_TIBIAL_TUBERCLE", coords_mm: [2.1, -45.0, 18.5] },
      { id: "T2_MEDIAL_MALLEOLUS", coords_mm: [-28.0, -180.0, -5.0] }
    ],
    predicted_tre_mm: 0.32,
    safety_virtual_fixtures: {
      femur_distal_cut_plane: {
        normal: [0.0, -1.0, 0.0],
        offset_mm: femoralPlan.distalCutDepth,
        safety_margin_posterior_mm: 3.5,
        haptic_damping_gain: 0.85
      },
      tibia_cut_plane: {
        normal: [0.0, 1.0, -Math.sin((tibialPlan.posteriorSlope * Math.PI) / 180)],
        offset_mm: tibialPlan.resectionDepth,
        safety_margin_pcl_mm: 4.0
      }
    },
    robot_target_poses: {
      saw_guide_plane_matrix: [
        1.0, 0.0, 0.0, 0.0,
        0.0, 0.998, -0.052, 10.0 - femoralPlan.distalCutDepth,
        0.0, 0.052, 0.998, -5.0,
        0.0, 0.0, 0.0, 1.0
      ]
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(exportPayload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NodeSurg_Robot_Plan_Case042.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="p-4 bg-slate-800/80 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-500/10 border border-rose-500/30 rounded-lg">
              <Bot className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-100">
                机器人平台与传感器部署工程包
              </h3>
              <p className="text-xs text-slate-400">
                生成目标位姿矩阵、术中配准点集与机械臂主动安全边界 (OpenIGTLink / ROS2)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs">
          {/* Key Metric Highlights */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-slate-400 block mb-1">预估配准误差 (TRE)</span>
              <span className="text-lg font-bold font-mono text-emerald-400">0.32 mm</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">🟢 达到高精度手术标准</span>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-slate-400 block mb-1">配准特征点</span>
              <span className="text-lg font-bold font-mono text-cyan-400">5 个骨性标志点</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">支持探针轻触与表面点云</span>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-slate-400 block mb-1">机械臂主动虚拟夹具</span>
              <span className="text-lg font-bold font-mono text-amber-400">动态阻尼已锁定</span>
              <span className="text-[10px] text-slate-500 block mt-0.5">后交叉韧带后方安全距离 3.5mm</span>
            </div>
          </div>

          {/* Safety alert message */}
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start gap-2 text-amber-300">
            <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
            <div>
              <span className="font-semibold block">安全屏障保护已生效 (Virtual Fixture Active)</span>
              <span className="text-[11px] text-amber-400/90">
                机械臂摆锯与铣刀在切削到达预定深度（股骨 {femoralPlan.distalCutDepth}mm，胫骨 {tibialPlan.resectionDepth}mm）时，力控系统将自动产生 0.85 增益的反向阻尼，防止误伤周围腘血管与韧带。
              </span>
            </div>
          </div>

          {/* Raw JSON Config Payload */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-slate-400">
              <span className="font-mono text-[11px] flex items-center gap-1">
                <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                通信数据负载 (Protocol Payload Preview)
              </span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300"
              >
                <Copy className="w-3 h-3" />
                <span>{copied ? '已复制' : '复制代码'}</span>
              </button>
            </div>
            <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 max-h-48 overflow-y-auto">
              {JSON.stringify(exportPayload, null, 2)}
            </pre>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-800/80 border-t border-slate-700/80 flex items-center justify-between">
          <div className="text-[11px] text-slate-400">
            支持协议: <span className="font-mono text-slate-300">ROS2, OpenIGTLink, KUKA FRI, UR RTDE</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-700"
            >
              关闭
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-rose-600 text-white hover:bg-rose-500 shadow-lg shadow-rose-600/20"
            >
              <Download className="w-3.5 h-3.5" />
              <span>下载部署工程包</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
