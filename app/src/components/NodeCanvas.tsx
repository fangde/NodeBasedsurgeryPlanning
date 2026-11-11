import React from 'react';
import { NodeGraphItem } from '../types/surgery';
import { Database, Cpu, Layers, Activity, Bot, CheckCircle2, ChevronRight } from 'lucide-react';

interface NodeCanvasProps {
  activeNodeId: string;
  onSelectNode: (nodeId: string) => void;
}

export const NodeCanvas: React.FC<NodeCanvasProps> = ({ activeNodeId, onSelectNode }) => {
  const nodes: NodeGraphItem[] = [
    {
      id: 'node-xray',
      title: '2D 双向 X-Ray 影像输入',
      category: 'input',
      status: 'ready',
      x: 30,
      y: 40,
      inputs: [],
      outputs: [
        { id: 'ap', name: 'AP 正位影像', type: 'Image2D' },
        { id: 'lat', name: 'Lat 侧位影像', type: 'Image2D' }
      ],
      summary: '双平面正侧位 X 光片载入与 25mm 标定定标'
    },
    {
      id: 'node-recon',
      title: '2D-3D 解剖形态重建',
      category: 'processing',
      status: 'ready',
      x: 30,
      y: 190,
      inputs: [
        { id: 'xray_in', name: '双平面影像', type: 'Image2D' }
      ],
      outputs: [
        { id: 'femur_mesh', name: '股骨 3D 网格', type: 'Mesh3D' },
        { id: 'tibia_mesh', name: '胫骨 3D 网格', type: 'Mesh3D' }
      ],
      summary: '统计形状模型 (SSM) 轮廓拟合，生成 3D 骨骼'
    },
    {
      id: 'node-femur-plan',
      title: '股骨远端截骨与假体规划',
      category: 'planning',
      status: 'ready',
      x: 30,
      y: 350,
      inputs: [
        { id: 'femur_in', name: '股骨网格', type: 'Mesh3D' }
      ],
      outputs: [
        { id: 'femur_cut', name: '远端截骨面', type: 'CuttingPlane' },
        { id: 'femur_implant', name: '股骨假体位姿', type: 'Transform3D' }
      ],
      summary: '截骨量 9mm, 外翻角 0°, 外旋 3°, 假体 #4'
    },
    {
      id: 'node-tibia-plan',
      title: '胫骨截骨与托盘规划',
      category: 'planning',
      status: 'ready',
      x: 30,
      y: 520,
      inputs: [
        { id: 'tibia_in', name: '胫骨网格', type: 'Mesh3D' }
      ],
      outputs: [
        { id: 'tibia_cut', name: '近端截骨面', type: 'CuttingPlane' },
        { id: 'tray_implant', name: '胫骨假体位姿', type: 'Transform3D' }
      ],
      summary: '截骨量 8mm, 后倾角 4°, 垫片厚度 10mm'
    },
    {
      id: 'node-gaps',
      title: '屈伸间隙平衡与运动仿真',
      category: 'simulation',
      status: 'ready',
      x: 30,
      y: 690,
      inputs: [
        { id: 'femur_plan_in', name: '股骨方案', type: 'FemoralPlan' },
        { id: 'tibia_plan_in', name: '胫骨方案', type: 'TibialPlan' }
      ],
      outputs: [
        { id: 'gap_metrics', name: '屈伸间隙张力', type: 'GapMetrics' },
        { id: 'rom_sim', name: '0-120° 屈曲运动', type: 'KinematicPath' }
      ],
      summary: '伸直间隙 19.0mm / 屈曲间隙 19.1mm (完美矩形平衡)'
    },
    {
      id: 'node-robot-export',
      title: '机器人执行与配准部署',
      category: 'robot',
      status: 'ready',
      x: 30,
      y: 860,
      inputs: [
        { id: 'kinematics_in', name: '规划方案', type: 'SurgicalPlan' }
      ],
      outputs: [
        { id: 'robot_traj', name: '机械臂路径与安全区', type: 'ROS2/OpenIGTLink' }
      ],
      summary: '配准点集、虚拟阻尼安全边界、目标位姿发布'
    }
  ];

  const getCategoryIcon = (category: NodeGraphItem['category']) => {
    switch (category) {
      case 'input':
        return <Database className="w-4 h-4 text-sky-400" />;
      case 'processing':
        return <Cpu className="w-4 h-4 text-purple-400" />;
      case 'planning':
        return <Layers className="w-4 h-4 text-amber-400" />;
      case 'simulation':
        return <Activity className="w-4 h-4 text-emerald-400" />;
      case 'robot':
        return <Bot className="w-4 h-4 text-rose-400" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/60 border-r border-slate-800">
      {/* Node Canvas Header */}
      <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-400" />
          <h2 className="text-sm font-semibold text-slate-100">手术规划流程图 (DAG Canvas)</h2>
        </div>
        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
          6 节点已就绪
        </span>
      </div>

      {/* Node List / Visual Pipeline */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3.5 scrollbar-thin scrollbar-thumb-slate-800">
        {nodes.map((node, index) => {
          const isActive = activeNodeId === node.id;
          return (
            <div key={node.id} className="relative">
              {/* Vertical connector line */}
              {index < nodes.length - 1 && (
                <div className="absolute left-6 top-14 bottom-[-16px] w-[2px] bg-slate-800 z-0">
                  <div className="absolute top-1/2 left-[-3px] w-2 h-2 rounded-full bg-slate-700"></div>
                </div>
              )}

              {/* Node Card */}
              <div
                onClick={() => onSelectNode(node.id)}
                className={`relative z-10 rounded-xl border p-3.5 cursor-pointer transition-all ${
                  isActive
                    ? 'bg-slate-800/90 border-indigo-500 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/50'
                    : 'bg-slate-900/80 border-slate-800/90 hover:border-slate-700 hover:bg-slate-800/50'
                }`}
              >
                {/* Node Title & Category */}
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-slate-800 border border-slate-700/60">
                      {getCategoryIcon(node.category)}
                    </div>
                    <span className="font-medium text-xs text-slate-200">{node.title}</span>
                  </div>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                </div>

                {/* Node Summary */}
                <p className="text-[11px] text-slate-400 pl-8 mb-2 leading-relaxed">
                  {node.summary}
                </p>

                {/* Pin details (inputs/outputs) */}
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-2 border-t border-slate-800/80">
                  <span>{node.inputs.length > 0 ? `入参: ${node.inputs[0].type}` : '源数据'}</span>
                  <div className="flex items-center text-indigo-400 gap-0.5">
                    <span>{node.outputs[0]?.type || '完成'}</span>
                    <ChevronRight className="w-3 h-3" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
