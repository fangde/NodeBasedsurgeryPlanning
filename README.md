# NodeSurg - Web-Based Node-Driven Surgical Planning Platform

A modular, web-first surgical planning and simulation platform leveraging visual programming (Directed Acyclic Graphs), WebGPU/WebAssembly, and AI-assisted medical geometry processing.

## 🚀 膝关节手术规划与机器人仿真原型 (Live Prototype)

一个完整运行的膝关节全膝置换 (TKA) 节点驱动手术规划与动力学仿真交互原型：

```bash
cd app
npm install
npm run dev
```
访问本地服务：**`http://127.0.0.1:3000/`**

### 原型已实现功能：
1. **真实临床案例载入：** 预设「案例 #042: 68岁女性, 右膝重度内翻骨关节炎 (7.5° Varus)」。
2. **双平面 2D X-Ray 透视系统：** AP 正位 + Lateral 侧位 X 光片，带 25mm 定标球与动态截骨线投影。
3. **3D 骨骼形态与假体装配：** 股骨远端截骨、假体微调（外旋 3°、外翻 0°）、胫骨平台截骨（后倾 4°、衬垫 10mm）。
4. **术后效果与下肢力线矫正：** 术前 172.5° 内翻畸形 ➔ 术后矫正至 180.0° 中立位，支持红色透明 Pre-op Ghost 骨骼对比。
5. **屈伸间隙平衡 (Gap Balancing)：** 实时 2x2 伸直/屈曲间隙动态矩形平衡监控（内侧 vs 外侧）。
6. **术后关节动力学仿真 (ROM 0° ~ 120°)：** 连续屈曲运动仿真，支持股骨后移 (Rollback) 与胫骨轴向自旋。
7. **双模式切换：** 🛠️ 节点流程图模式 (Builder Mode) 与 🩺 主刀医生审查模式 (Surgeon Review)。
8. **部署至手术机器人：** 一键导出术中 5 点骨性配准清单、TRE 误差预测 (0.32mm)、机械臂主动安全阻尼边界 (Virtual Fixture) 及 OpenIGTLink / ROS2 控制包。

## 📖 Documentation
- [通用硬件接口与多术式抽象层：面向传感器与机械臂](docs/UNIVERSAL_HARDWARE_BRIDGE_SPEC.md) 🦾 ⚡ *(多术式规划解耦、NDI/OptiTrack传感器、KUKA/UR/Franka机械臂驱动)*
- [战略定位：构建 Web 时代、节点化的开源科研平台（对标 3D Slicer）](docs/POSITIONING_NEXT_GEN_RESEARCH_PLATFORM.md) 🔬 🌟 *(科研生态、论文复现、自定义节点扩展与多中心协同)*
- [闭环数字化手术体系：从规划、配准到机器人执行](docs/ROBOTIC_SURGERY_AND_NAVIGATION_WORKFLOW.md) 🤖 ⭐ *(规划 ➔ 配准方案 ➔ 导航生成 ➔ 部署机器人)*
- [User Experience (UX), Personas & Clinical Workflows](docs/USER_EXPERIENCE_AND_WORKFLOWS.md) ⭐ *(User perspective, clinical journeys & interface design)*
- [CT-Free Shape Alternatives: Getting 3D Anatomy Without 3D CT](docs/CT_FREE_SHAPE_ALTERNATIVES.md) 🦴 *(Bi-planar X-rays, statistical shape models & parametric morphology)*
- [Bi-Planar 2D X-Ray Workflow (AP + Lateral to 3D)](docs/FEATURE_2D_XRAY_WORKFLOW.md) 🩺 *(Planning surgeries from two 2D X-rays with live projection)*
- [The Node-Based Paradigm: From 3D Procedural Modeling to Surgical Planning](docs/NODE_PARADIGM_FOR_SURGERY.md)
- [Comprehensive Technical Specification & Architecture Design](docs/SURGICAL_PLANNING_PLATFORM_SPEC.md)

## 🎯 Key Features
- **Visual Node Canvas:** Compose complex multi-step surgical workflows (Ingestion $\to$ Segmentation $\to$ Osteotomy $\to$ Implant Fit $\to$ PSI Guide Generation).
- **Synchronized Viewports:** Simultaneous 2D Multi-Planar Reconstruction (MPR: Axial, Sagittal, Coronal) and interactive 3D volume/surface rendering.
- **Hybrid Compute Engine:** Fast client-side manipulations (Wasm / WebGPU) coupled with scalable cloud AI segmentation and geometric boolean processing.
- **Reproducible & Parametric:** Graph-based state allows immediate parametric adjustments with automatic downstream dependency recomputation.

## 📁 Repository Structure (Planned)
```text
├── docs/                      # Architecture, regulatory specifications, and RFCs
├── frontend/                  # React + React Flow + vtk.js / Three.js client
│   ├── src/
│   │   ├── nodes/             # Custom React Flow nodes & UI inspectors
│   │   ├── viewport/          # 2D MPR and 3D WebGL/WebGPU viewports
│   │   ├── engine/            # Client-side DAG execution & cache manager
│   │   └── wasm/              # Geometry & mesh processing modules
├── backend/                   # Python FastAPI & microservices
│   ├── app/
│   │   ├── routers/           # REST & WebSocket endpoints
│   │   ├── workers/           # Heavy AI segmentation & boolean mesh tasks
│   │   └── services/          # DICOM, PACS, and geometric algorithms
└── scripts/                   # Development, testing, and deployment scripts
```
