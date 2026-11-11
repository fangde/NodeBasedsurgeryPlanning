# Web-Based Node-Driven Surgical Planning Platform (NodeSurg)
## System Architecture & Technical Specification (SRS / SAD)

**Document Version:** 1.0.0-DRAFT  
**Status:** Architecture Blueprint & Technical Roadmap  
**Target Domain:** Medical Image Computing, Surgical Simulation, Patient-Specific Planning (SaMD)

---

## 1. Executive Summary & Vision

Modern surgical planning (orthopedics, cranio-maxillofacial, neurosurgery, spinal, and oncology) demands multi-step spatial workflows: DICOM volume loading, AI segmentation, 3D reconstruction, landmark identification, osteotomy/resection planning, implant placement, and patient-specific surgical guide generation.

Traditional desktop systems (e.g., Materialise Mimics/3-matic, 3D Slicer, Brainlab) rely on monolithic workflows with rigid menus or high learning curves. **NodeSurg** aims to be a **cloud-native, web-based, node-driven surgical planning platform** that brings the visual DAG (Directed Acyclic Graph) paradigm (pioneered by Houdini, Blender Geometry Nodes, and ComfyUI) to clinical engineering and surgical simulation.

### Key Value Propositions
1. **Procedural & Reproducible:** Surgical recipes are encoded as shareable, deterministic computational graphs. Changing a patient landmark automatically propagates downstream to osteotomies, implant alignments, and cut guides.
2. **Hybrid Client-Cloud Execution:** Interactive geometric operations (transformations, clipping, real-time measurements) run client-side in WebAssembly/WebGPU; heavy compute (nnU-Net/TotalSegmentator, boolean mesh carving, FEA) runs on elastic GPU backend clusters.
3. **Multi-Disciplinary Viewport:** Synchronized multi-planar reconstruction (MPR: Axial, Sagittal, Coronal) and 3D volume/surface rendering alongside the interactive node canvas.

---

## 2. Core Architectural Pillars

```
+-----------------------------------------------------------------------------------------+
|                                    Web Browser (UI)                                     |
|  +------------------------------+  +-------------------------------------------------+  |
|  |     Node Canvas (React Flow) |  |   Surgical Viewport (vtk.js / Three.js / WebGPU)|  |
|  |   - DAG editor               |  |   - 2D MPR (Axial / Sagittal / Coronal)         |  |
|  |   - Parameter controls       |  |   - 3D Surface & Volume Rendering               |  |
|  |   - Dataflow inspection      |  |   - Transform Gizmos & Measurement Overlays     |  |
|  +--------------+---------------+  +------------------------+------------------------+  |
|                 |                                           |                           |
|                 +---------------------+---------------------+                           |
|                                       |                                                 |
|                         Client Execution Orchestrator                                   |
|                     (Dirty Node Tracker & Cache Manager)                                |
|                                       |                                                 |
|          +----------------------------+----------------------------+                    |
|          | Local (Fast / Interactive)                              | Remote (Heavy)     |
|          v                                                         v                    |
|  +-------------------------------+                       +-------------------+          |
|  | WebAssembly / WebGPU Engine   |                       | WebSocket / gRPC  |          |
|  | - Transform matrices          |                       | Streaming Client  |          |
|  | - Raymarching / Clip planes   |                       +---------+---------+          |
|  | - Local mesh slicing / decimate|                                |                     |
|  +-------------------------------+                                 |                     |
+--------------------------------------------------------------------|--------------------+
                                                                     |
                                                                     v
+-----------------------------------------------------------------------------------------+
|                               Backend Services (Cloud / On-Prem)                       |
|  +-----------------------+   +------------------------+   +--------------------------+  |
|  | API Gateway / Auth    |---| Graph Execution Engine |---| Task Queue (Redis/Celery)|  |
|  | (FastAPI, OIDC/OAuth2)|   | (Async DAG Runner)     |   +------------+-------------+  |
|  +-----------------------+   +------------------------+                |                |
|                                                                        v                |
|  +-----------------------------------------------------------------------------------+  |
|  | Worker Compute Nodes (Python / C++ / PyTorch / CUDA)                             |  |
|  | - AI Segmentation (TotalSegmentator, nnU-Net, SAM-Med3D)                          |  |
|  | - Robust Mesh Booleans (CGAL, Manifold3D, Open3D)                                 |  |
|  | - DICOM PACS Ingestion & ITK Image Processing                                    |  |
|  +-----------------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------------+
```

---

## 3. Node Graph Architecture & Data Contract

### 3.1 Directed Acyclic Graph (DAG) Mechanics
- **Nodes:** Stateless calculation units with typed inputs, outputs, and configurable properties.
- **Edges:** Data pipelines transmitting immutable or versioned artifacts.
- **Evaluation Model:** **Push-Pull Reactive Execution with Content-Addressable Caching (Hash-based dirty checking).**
  - Changing an implant translation matrix only dirties visualization and collision detection nodes; upstream bone segmentation is never recomputed.

### 3.2 Standard Edge Data Types
Medical computing requires strictly typed pin sockets:

| Type Key | Description | Representation (Client / Server) |
|---|---|---|
| `DicomSeries` | Raw 3D DICOM image volume | Metadata + Raw binary array / Zarr / NIfTI |
| `LabelMap` | Multi-label discrete voxel segmentation | UInt8/UInt16 3D buffer or RLE compressed volume |
| `Mesh3D` | Surface mesh (bone, vessel, implant) | Indexed triangle buffer (vertices, normals, indices) |
| `LandmarkSet` | Anatomical points / fiducials | Array of named 3D vectors (`{ id, name, position: [x,y,z] }`) |
| `Transform3D` | 4x4 Affine Transformation Matrix | `Float32Array[16]` / SE(3) matrix |
| `CuttingPlane` | Surgical osteotomy definition | Origin point + Normal vector + Slicing boundary polygon |
| `Measurement` | Quantitative clinical values | Distance (mm), Angle (°), Volume (cc), Deviation map |
| `GuideConfig` | PSI (Patient-Specific Instrument) params | Contact shell thickness, drill cylinder tolerance, margin |

---

## 4. Standard Node Library Taxonomy

### A. Data I/O & Ingestion
- **DICOM Loader:** Connects to PACS (DICOMWeb / WADO-RS) or parses local `.dcm` / `.zip`.
- **Mesh Importer:** Imports standard implant CAD (`STL`, `OBJ`, `PLY`, `STEP`).
- **Patient Metadata Node:** Anonymization, demographic checks, DICOM tag extraction.

### B. Preprocessing & Segmentation
- **Window/Level (HU Filter):** Hounsfield Unit thresholding (Bone: 200–2000 HU, Soft Tissue: -100–100 HU).
- **AI Auto-Segmentor:** Triggers remote nnU-Net / TotalSegmentator for automated multi-organ/bone isolation.
- **Interactive Region Growing:** Seed-point based segmentation.
- **Morphology Ops:** Dilate, Erode, Fill Holes, Island Removal.

### C. Mesh Generation & Geometry Processing
- **Marching Cubes / Iso-Surface:** Converts voxel segmentations to 3D surface meshes (with Laplace/Taubin smoothing).
- **Remeshing & Decimation:** Reduces polygon count for high-performance browser rendering while preserving anatomical boundaries.
- **Manifold Repair:** Closes non-manifold edges, removes self-intersections, ensures watertight meshes for 3D printing.

### D. Surgical Planning & Biomechanical Ops
- **Landmark Extractor:** Identifies mechanical axes (e.g., femoral head center, tibial intercondylar eminence).
- **Osteotomy Cut:** Cuts a bone mesh using planar or curved surfaces, splitting it into proximal and distal fragments.
- **Fragment Alignment / Reduction:** Repositions severed bone segments based on target anatomical/mechanical axes.
- **Implant Placement:** Positions prosthetic CAD models with interactive snapping, collision feedback, and bone contact area evaluation.
- **Screw Trajectory Planner:** Defines drill vectors with cortical penetration checks and danger-zone avoidance.

### E. Patient-Specific Instrumentation (PSI) & 3D Printing
- **Negative Mold / Contact Surface Generator:** Offsets bone surface to build conformable guide underside.
- **Drill Bushing Extruder:** Merges cylindrical guide sleeves along screw trajectories.
- **Surgical Guide Boolean:** Joins contact pads, inspection windows, and drill guides into a watertight 3D-printable STL.

### F. Quality Control & Clinical Reporting
- **Distance Deviation Heatmap:** Signed distance color-mapping (planned vs. pre-op or target geometry).
- **Clinical Metrics Calculator:** Mechanical Axis Deviation (MAD), Cobb angle, limb length discrepancy.
- **PDF Surgical Plan Generator:** Exports snapshot views, step-by-step resections, screw lists, and implant sizing.

---

## 5. Technology Stack Recommendations

| Layer | Recommended Technology | Alternative Considerations | Rationale |
|---|---|---|---|
| **Frontend Framework** | **React 19 + TypeScript + Vite** | Next.js (App Router), Svelte 5 | Strong ecosystem for medical visualization widgets and rich UI state. |
| **Node Graph Editor** | **React Flow (`@xyflow/react`)** | Rete.js, LiteGraph.js, custom WebGL canvas | Robust custom node styling, zooming/minimap, high maintainability. |
| **Medical 3D / MPR Viewport**| **vtk.js + ITK-Wasm + Three.js** | Cornerstone3D, Babylon.js | `vtk.js` excels at DICOM MPR slicing and volume rendering; `Three.js` handles interactive implant gizmos and CAD materials. |
| **Client Geometric Ops** | **Manifold3D (Wasm) + Open Cascade (Wasm)** | CGAL (Emscripten), Three-CSG | Extremely fast, guaranteed watertight boolean mesh operations directly inside the browser. |
| **Backend API Gateway** | **FastAPI (Python 3.11+)** | Node.js (NestJS), Go (Fiber) | Native compatibility with scientific Python, PyTorch, ITK, and MONAI. |
| **Heavy Mesh Engine** | **C++ / Trimesh / PyVista / CGAL** | Open3D, LibIGL | Robust industrial-grade geometric algorithms for non-trivial boolean cuts and remeshing. |
| **AI Inference** | **Triton Inference Server / ONNX Runtime** | TorchScript, TensorRT | Scalable multi-model inference for 3D CT/MRI volumetric segmentation. |
| **Communication Layer** | **WebSocket + WebRTC DataChannel** | gRPC-Web, Server-Sent Events | Low latency streaming for progressive mesh updates and long-running job progress. |

---

## 6. Regulatory & Security Compliance (SaMD)

Because surgical planning tools are classified as **Software as a Medical Device (SaMD)** (Class II in US FDA, Class IIa/IIb in EU MDR):
1. **Traceability & Audit Logs:** Every node execution step, input parameter, and user override must be logged immutably with timestamp and user ID.
2. **Determinism:** Given the same input DICOM and node graph configuration, output STL coordinates must match within strict tolerances ($< 0.05 \text{ mm}$).
3. **Data Privacy:** Client-side DICOM header de-identification (HIPAA Safe Harbor standard: stripping patient name, DOB, hospital ID) prior to any cloud transmission.
4. **Human-in-the-Loop Safeguards:** Visual alerts for unverified automated segmentations or collision intersections before exporting final surgical plans.

---

## 7. Development Roadmap (Milestones)

### Phase 1: MVP Core (Foundational Pipeline)
- [ ] Multi-panel layout: Node editor canvas on the left, synchronized 3D + 2D MPR viewports on the right.
- [ ] DICOM ingestion & local client parsing (Cornerstone / vtk.js).
- [ ] HU thresholding node & Marching Cubes surface extraction (Wasm).
- [ ] Basic landmark placement node + measurement node (point-to-point distance).
- [ ] Graph execution engine with dirty-checking and state caching.

### Phase 2: Surgical Interaction & Simulation
- [ ] Planar Osteotomy node: Interactive cutting plane with fragment splitting.
- [ ] Transform & Alignment node: 3D Gizmo for reorienting bone fragments.
- [ ] STL Implant loading and snap-to-surface positioning.
- [ ] Remote AI segmentation integration (nnU-Net / TotalSegmentator microservice).

### Phase 3: Advanced PSI & Guide Generation
- [ ] Client/Server Boolean engine (Manifold3D / CGAL) for negative bone molds.
- [ ] Drill sleeve trajectory insertion and guide base meshing.
- [ ] Watertight manifold validation & STL export.
- [ ] Automated surgical planning report generation (PDF with 3D captures).

### Phase 4: Enterprise & Cloud Collaboration
- [ ] Cloud workspace synchronization (collaborative real-time planning via WebSockets/CRDTs).
- [ ] PACS DICOMWeb connectivity (dcm4chee / Orthanc).
- [ ] Comprehensive validation suite for FDA 510(k) / CE MDR verification.
