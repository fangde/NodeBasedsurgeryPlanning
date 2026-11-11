# 战略定位：构建 Web 时代、节点化的开源科研平台（对标 3D Slicer）
## Positioning: The Next-Gen Web-Native, Node-Driven Research Platform for Surgical Planning & IGT

**对标对象：** 3D Slicer / SlicerIGT（哈佛医学院 BWH、MIT、Kitware 历时 20 年打造的全球医学影像与手术导航科研黄金标准）  
**核心愿景：** 继承 3D Slicer 强大的医学计算与机器人导航生态，以 **“Web 原生 (Web-First)”** 和 **“可视化节点图 (Node/DAG-Driven)”** 为核心范式，打造下一代开放式科研底座。

---

## 1. 为什么科研界迫切需要一个“现代化、节点化”的 3D Slicer？

3D Slicer 是过去 20 年医学图像计算与图像引导治疗（IGT - Image-Guided Therapy）的基石。然而，面对当今 AI 大模型时代、跨学科协作与多中心科研，其传统桌面架构暴露出显著的科研痛点：

| 痛点维度 | 传统 3D Slicer 的科研瓶颈 | NodeSurg 现代化科研平台的解决方式 |
|---|---|---|
| **复现性与协作** | 论文实验很难一键复现。操作分散在数十个独立下拉模块中，难以记录每一步操作参数。 | **图即论文代码 (Graph as Pipeline)：** 整个科研流程保存为一个轻量 `.nodesurg` 节点图文件，同行拖入网页即可 $100\%$ 精确复现。 |
| **安装与环境依赖** | 笨重的桌面安装包（几个GB），配 Python 环境、CUDA 驱动、OpenIGTLink 拓展经常遇到版本冲突。 | **零安装 Web 访问 (Zero-Install)：** 浏览器打开即可运行。前端借助 WebAssembly/WebGPU，后端无缝调度云端/服务器 GPU。 |
| **算法封装门槛** | 为 Slicer 写一个交互式模块需要掌握复杂的 PythonQt、MRML 场景树和 UI 绑定。 | **极简节点 SDK (像 ComfyUI 一样)：** 科研人员写一个几十行的标准 Python 函数，用装饰器一标，即可自动生成可视化节点。 |
| **硬件与临床脱节** | 实验室写的 Slicer 算法，很难低成本带进手术室给外科医生测试。 | **双模式交互：** 学生/科研人员在后台搭建复杂算法节点，医生在平板/浏览器上以极简临床界面直接验证。 |

---

## 2. 核心架构对照：3D Slicer vs. NodeSurg

```
+-----------------------------------------------------------------------------------------+
|                                    经典 vs. 现代化架构                                  |
|                                                                                         |
|   【经典 3D Slicer 架构 (Desktop C++/Python)】                                          |
|   ┌─────────────────────────────────────────────────────────────────────────────────┐   |
|   │ Qt UI  ──> 200+ 独立下拉 Modules ──> MRML 集中式单例场景树 ──> VTK/ITK 底层运算  │   |
|   │ (高度耦合、依赖本地操作系统、学习曲线陡峭)                                      │   |
|   └─────────────────────────────────────────────────────────────────────────────────┘   |
|                                                                                         |
|   【NodeSurg 下一代科研平台架构 (Web-Native / DAG)】                                    |
|   ┌─────────────────────────────────────────────────────────────────────────────────┐   |
|   │ Web 视口 (vtk.js / Three.js) ──► 响应式有向无环图 (Reactive DAG)                │   |
|   │              ▲                                   │                              │   |
|   │              │                                   ▼                              │   |
|   │   Dual-Mode 医生操作界面          极简节点注册系统 (Python / Wasm SDK)          │   |
|   │   (科研成果秒变临床工具)          (TotalSegmentator / OpenIGTLink / ROS2)       │   |
|   └─────────────────────────────────────────────────────────────────────────────────┘   |
+-----------------------------------------------------------------------------------------+
```

---

## 3. 科研平台的三大支柱生态 (Research Pillars)

### 支柱一：极简的“自定义算法节点 SDK”（类似 ComfyUI 爆发的秘诀）
ComfyUI 之所以能迅速席卷开源生成式 AI 社区，是因为**任何人写一个 Python 函数就能立刻变成全球共享的节点**。

NodeSurg 为医学与机器人科研人员设计同等优雅的开发体验：
```python
# 示例：科研人员开发一个“新型自适应截骨切面”节点
from nodesurg.sdk import register_node, Mesh3D, CuttingPlane, Point3D

@register_node(
    category="Surgical/Osteotomy",
    name="Adaptive Wedge Cut",
    description="Based on Dr. Li's 2026 IEEE TMI paper on personalized knee alignment"
)
def compute_adaptive_cut(bone: Mesh3D, apex: Point3D, target_angle_deg: float) -> CuttingPlane:
    # 科研人员在这里写自己的核心数学/几何算法（支持 NumPy, PyTorch, SciPy, ITK）
    normal_vector = calculate_optimal_normal(bone.vertices, apex, target_angle_deg)
    return CuttingPlane(origin=apex, normal=normal_vector)
```
- **零 UI 代码负担：** 只要声明入参类型为 `float`，网页端自动生成平滑滑动条；入参为 `Point3D`，3D 视口里自动出现可拖动的空间小球吸附工具。

---

### 支柱二：无缝继承 3D Slicer 核心技术资产（Interoperability）
不重复发明轮子，全面拥抱科研界成熟的协议与格式：
1. **OpenIGTLink 原生兼容：**
   - 能够直接与现有的 **SlicerIGT** 插件、NDI 光学定位仪、机器人控制器（如 KUKA iiwa、UR、Franka Emika）进行网络姿态数据包收发。
2. **标准医学科研格式全支持：**
   - 读写 `DICOM`, `NIfTI (.nii.gz)`, `NRRD`（Slicer 默认格式）, `STL`, `PLY`, `OBJ`。
3. **AI 医疗生态直通（MONAI & PyTorch）：**
   - 支持一键接入开源医学大模型：如 TotalSegmentator、SAM-Med3D、nnU-Net。

---

### 支柱三：多中心临床科研协同（Cloud-Native Collaboration）
传统 Slicer 时代，两个医院的课题组合作，必须用网盘传几十个 G 的脱敏 CT 文件，各自摸索参数。

在 NodeSurg 平台中：
- **实时协作房间 (Google Docs 式协作)：** 工程师在北京调整算法节点的容差参数，上海的规培医生在浏览器里就能实时看到 3D 骨骼和机器人进针轨迹的变化。
- **科研版本控制与审计链：** 每次算法迭代都有版本指纹，论文发表时直接附带一个平台超链接（如 `nodesurg.org/p/knee-planning-v2`），审稿人打开浏览器就能复现论文里的所有三维计算。

---

## 4. 科研用户的典型场景 (Use Cases)

### 场景 A：高校课题组（算法与论文原型验证）
- **痛点：** 博士生提出了一个基于图神经网络的骨骼标志点自动识别算法，但写完算法后要花 3 个月时间写界面给医生测试，耽误发论文。
- **在 NodeSurg：** 封装成一个 `[AI Landmark Node]`，拖到现成的规划节点流水线中，直接连上 3D 视口。当天就能交给合作医生在网页上标定盲测。

### 场景 B：手术机器人实验室（从仿真到真机控制）
- **痛点：** 机械臂抓着摆锯要切骨头，缺乏一个直观的术前规划与配准标定软件。
- **在 NodeSurg：**
  1. 用节点做 2D X光/3D CT 骨骼重建。
  2. 连入 `[Paired-Point Registration]` 配准节点。
  3. 连入 `[ROS2 / OpenIGTLink Broadcast]` 节点，直接把规划好的六自由度末端目标位姿实时发布给机器人底座。

### 场景 C：医疗器械研发商与 3D 打印中心（批量化参数测试）
- **痛点：** 研发一款新型多孔骨小梁接骨板，需要测试 500 例真实患者解剖库的贴合度。
- **在 NodeSurg：** 节点图支持**“批处理模式 (Batch Mode)”**。同一套规划与贴合度计算节点图，输入 500 例骨骼网格，自动跑完并生成贴合度统计柱状图和偏离热力图。

---

## 5. 成为新一代 3D Slicer 的阶段演进路径

```
+-----------------------------------------------------------------------------------------+
|                                    平台演进三步走战略                                   |
|                                                                                         |
|   阶段一：最小可用科研闭环 (MVP)                                                        |
|   • Web 端节点画布 + 3D/MPR 视口                                                        |
|   • 基础解剖运算节点 (DICOM/Mesh 导入, 标志点拾取, 截骨裁切, 假体姿态变换)              |
|   • 能够保存与加载可复现的 .nodesurg 实验工程文件                                       |
|                                                                                         |
|   阶段二：IGT 与机器人扩展 (SlicerIGT 对齐)                                             |
|   • 术中配准方案节点 (点对点配准, ICP 表面拟合)                                         |
|   • OpenIGTLink / ROS2 实时通信节点 (打通真实光学跟踪仪与机械臂)                        |
|   • 开放 Python Custom Node SDK，允许开发者自由编写新节点                               |
|                                                                                         |
|   阶段三：繁荣开源社区生态 (The "ComfyUI of Medical Robotics")                          |
|   • 节点应用市场 (NodeSurg Hub)：全球学者分享专科手术节点包与工作流                     |
|   • 完善的医学伦理脱敏与多中心云端协同平台                                              |
|   • 成为顶级医学影像与机器人会议 (MICCAI, IEEE TMRB, ICRA, IPCAI) 官方推荐研究工具    |
+-----------------------------------------------------------------------------------------+
```
