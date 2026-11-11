# User Experience (UX), Personas & Clinical Workflows

**Document Focus:** User Perspective, Personas, Daily Journeys, and Product Design  
*(Technical implementation details deferred)*

---

## 1. Target User Personas

Surgical planning is rarely done by a single person in isolation. It is a collaboration between **engineering precision** and **clinical judgment**.

```
+--------------------------------------------------------------------------------+
|                              THE COLLABORATIVE PAIR                            |
|                                                                                |
|    +-----------------------------+             +--------------------------+    |
|    |     Clinical Engineer       |             |     Attending Surgeon    |    |
|    |  (Biomedical / Planner)     |             |    (Clinical Decision)   |    |
|    +--------------+--------------+             +------------+-------------+    |
|                   |                                         |                  |
|                   | Builds procedural graph                 | Reviews, tweaks, |
|                   | Fine-tunes mesh booleans                | and signs off    |
|                   | Ensures 3D printability                 |                  |
|                   v                                         v                  |
|          +--------------------------------------------------------+            |
|          |         Shared Web Platform (Dual-Mode Interface)       |            |
|          +--------------------------------------------------------+            |
+--------------------------------------------------------------------------------+
```

### Persona 1: The Clinical Engineer (The "Builder / Power User")
- **Background:** Biomedical engineer, hospital 3D print lab technician, or medical device manufacturer specialist.
- **Goals:** 
  - Rapidly process incoming patient DICOMs without repeating manual steps.
  - Create robust, reusable planning templates ("recipes") for common procedures.
  - Ensure exported cutting guides (PSIs) are watertight, accurate, and ready for 3D printing.
- **Pain Points Today:**
  - Trapped in clunky desktop software with high license costs.
  - Doing the exact same 25-step manual sequence for every single knee or jaw case.
  - When a surgeon asks: *"Can we see what happens if we angle the cut $3^\circ$ steeper?"*, they often have to rebuild the entire plan from scratch.

### Persona 2: The Attending Surgeon (The "Reviewer / Decision Maker")
- **Background:** Orthopedic, Maxillofacial, Spine, or Plastic surgeon.
- **Goals:**
  - Spend **5 to 10 minutes** reviewing the preoperative plan, not 2 hours learning CAD software.
  - Verify that the resection margins are safe and the implant fits anatomically.
  - Compare alternatives (e.g., *"Does Implant Size 4 or Size 5 fit the patient's bone better?"*).
  - Give digital sign-off and get a clean 1-page PDF surgical report for the Operating Room.
- **Pain Points Today:**
  - Doesn't have time or desire to wire nodes, edit meshes, or learn complex 3D tools.
  - Receives static PDFs or screenshots via email, unable to rotate the 3D model or tweak an angle themselves.
  - High friction communicating small changes back and forth with the engineering team.

---

## 2. The Core UX Innovation: Dual-Mode Interface

Just as Blender has **Geometry Nodes** (for technical artists) and the **Modifier Panel** (for regular users), NodeSurg provides two synchronized view modes of the same surgical plan:

```
+-----------------------------------------------------------------------------------------+
|                                    TOP BAR: MODE SWITCH                                 |
|          [  🛠️ Recipe Builder Mode  ]      |      [  🩺 Surgeon Review Mode  ]          |
+-----------------------------------------------------------------------------------------+
| MODE A: RECIPE BUILDER (Clinical Engineer)  | MODE B: SURGEON REVIEW (Surgeon / Quick)  |
|                                             |                                           |
| +-------------------+ +-------------------+ | +-------------------+ +-----------------+ |
| |    Node Graph     | |    3D Viewport    | | | Simplified Sliders| |   3D Viewport   | |
| |                   | |                   | | |                   | |                 | |
| | [DICOM]─>[Bone]   | |   [3D Anatomy]    | | | • Cut Angle: 8°   | |  [3D Anatomy]   | |
| |    │       │      | |                   | | | • Slope: 4°       | |                 | |
| |    ▼       ▼      | |                   | | | • Implant: Size 4 | |                 | |
| | [Cut] ─> [Guide]  | |                   | | | • Safety: PASSED  | |                 | |
| |                   | |                   | | |                   | |                 | |
| | Full wiring access| | Synchronized with | | | [Compare Plan B]  | | Interactive 3D  | |
| | & math parameters | | graph selection   | | | [Approve Plan]    | | & 2D MPR slices | |
| +-------------------+ +-------------------+ | +-------------------+ +-----------------+ |
+-----------------------------------------------------------------------------------------+
```

### Mode A: "Recipe Builder" (For Engineers)
- **Node Canvas:** Full visual programming interface.
- Add nodes, connect typed cables, adjust boolean offsets, configure AI segmentation thresholds.
- Expose specific key parameters to the "Surgeon UI" by toggling an **"Expose to Reviewer"** pin (e.g., exposing `Cut Angle`, `Implant Size`, `Guide Margin`).

### Mode B: "Surgeon Review" (For Surgeons & Clinic Teams)
- The node graph is completely hidden behind a clean, uncluttered clinical dashboard.
- The surgeon sees:
  1. **3D Viewport & 2D MPR (CT slices)** showing bone, cut planes, and implant.
  2. **Exposed Sliders & Dropdowns** (e.g., adjust resection slope from $4^\circ$ to $6^\circ$ with live real-time visual feedback).
  3. **Traffic-Light Clinical Safety Indicators:**
     - 🟢 Resection margin $> 5\text{ mm}$ (Safe)
     - 🔴 Screw penetration through cortical wall detected! (Warning)
  4. **One-Click Actions:** "Compare with Alternative Plan", "Approve Plan", "Export Operating Room PDF".

---

## 3. Key User Journeys

### Journey 1: Routine Case Using a Standard Recipe (10 Minutes)
*Example: Dr. Miller planning a High Tibial Osteotomy (knee realignment)*

1. **Upload / Select Case:** Clinical engineer drags the patient's CT DICOM folder into the browser.
2. **Apply Recipe:** Selects the template *"High Tibial Osteotomy (Standard Medial Opening Wedge)"*.
3. **Automated Pipeline Runs:**
   - The graph automatically segments the tibia and femur.
   - Extracts 3D surface meshes.
   - Automatically detects anatomical landmarks (femoral head, knee center, ankle center).
4. **Fine-Tuning:** The engineer visually checks landmark pins in the 3D viewport, drags one landmark slightly to match the tibial spine.
5. **Surgeon Share Link:** Engineer clicks *"Share with Dr. Miller"*.
6. **Surgeon Sign-Off:** Dr. Miller opens the link on his tablet/laptop, reviews the 3D correction angle ($8^\circ$), tests $9^\circ$ on the slider, likes $8^\circ$ better, and clicks **"Approve Plan"**.
7. **Production:** The system generates the 3D-printable surgical guide STL automatically.

---

### Journey 2: Plan A vs. Plan B Comparison (The "What-If" Exploration)
*Example: Choosing between two different implant sizes or two different cutting angles*

In traditional software, testing two different implant brands or sizes means saving two separate files and trying to remember which was better.

In NodeSurg:
1. The user branches the graph at the `Resection` node into two paths:
   - **Branch A:** Implant Brand X, Size 3.
   - **Branch B:** Implant Brand Y, Size 4.
2. In the viewport, the user toggles a **Split Screen** or **Slider Overlay**:
   - Left side: Plan A (shows contact area: $78\%$, bone removal: $12\text{ cc}$).
   - Right side: Plan B (shows contact area: $89\%$, bone removal: $15\text{ cc}$).
3. The surgeon instantly picks Plan B based on quantifiable clinical trade-offs.

---

### Journey 3: Complex Custom Surgery from Scratch
*Example: Mandibular (Jaw) Tumor Resection & Fibula Bone Graft Reconstruction*

1. **Tumor Margin Definition:** The user places 3D boundary points around the jaw tumor with a required $10\text{ mm}$ oncological safety margin.
2. **Resection Node:** The node graph slices the jawbone to remove the tumor segment.
3. **Graft Harvesting Node:** Slices the patient's fibula (leg bone) into 3 angled segments to reconstruct the curve of the jaw.
4. **Parametric Guide Generation:** The graph automatically generates:
   - Guide 1: Cutting jig for the jaw (fits securely over teeth and jawbone).
   - Guide 2: Cutting jig for the fibula leg bone with exact matching angular cut slots.
5. If the surgeon decides to widen the resection margin by $2\text{ mm}$, **the fibula cutting lengths recalculate automatically**.

---

## 4. User Interaction Details: What Makes It Intuitive

### 1. Bidirectional Selection (Viewport $\leftrightarrow$ Graph)
- Click an implant in the 3D viewport $\to$ The corresponding `Implant Node` lights up on the node canvas.
- Click a `Cut Node` in the canvas $\to$ The 3D cutting plane and angle manipulator gizmo highlight in the viewport.

### 2. Live Color Safety Feedback
- Surgeons need instant answers to: *"Is this safe?"*
- **Collision / Proximity Heatmap:**
  - Green: Safe clearance from nerves and tooth roots.
  - Yellow: $< 2\text{ mm}$ proximity warning.
  - Red: Direct cortical perforation or nerve intersection.

### 3. Ghost / Pre-Op Overlay
- A single hotkey (e.g., Spacebar or Hold `Tab`) toggles a semi-transparent "ghost" of the original deformed anatomy over the newly corrected anatomy, so the surgeon can instantly see the before-and-after spatial change.

### 4. Non-Destructive History Slider (Time Travel)
- Because every operation is a node in a graph, the user has a visual timeline:
  `Raw CT` $\to$ `Segmented Bone` $\to$ `Cut Bone` $\to$ `Realigned Bone` $\to$ `Implant Placed` $\to$ `Guide Generated`.
- Users can click any stage to inspect the anatomical state at that exact point in the procedure.

---

## 5. Summary of User Needs Addressed

| Clinical User Need | How the Node-Based UX Solves It |
|---|---|
| *"I need to make a small change without starting over."* | Non-destructive parametric graph: change the upstream input, downstream updates automatically. |
| *"Surgeons don't want to wire node graphs."* | Dual-Mode UI: Engineers build graphs; surgeons get a sleek, slider-based clinical dashboard. |
| *"I need to compare options side-by-side."* | Branching nodes: evaluate Plan A vs. Plan B in one synchronized viewport. |
| *"We need standardized clinical protocols across our hospital."* | Reusable recipe templates that can be shared, versioned, and applied to any new patient scan. |
