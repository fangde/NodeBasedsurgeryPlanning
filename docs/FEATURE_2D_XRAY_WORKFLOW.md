# Feature Specification: Bi-Planar 2D X-Ray Workflow (AP + Lateral to 3D)

**Document Focus:** User Experience & Clinical Flow for Two 2D X-Rays (Anteroposterior & Lateral)  
*(Non-technical, user-centric design)*

---

## 1. Why Bi-Planar 2D X-Rays Matter to Surgeons

In many clinical situations, a patient does **not** have a full 3D CT scan:
1. **Lower Radiation & Cost:** Standard X-rays deliver $\sim 50\times$ less radiation than a pelvic or full-leg CT.
2. **Weight-Bearing Reality:** Standard CT scans are taken with the patient lying flat (supine). But joint deformities, spine scoliosis, and leg alignments look completely different when the patient is **standing under gravity** on an X-ray (e.g., EOS bi-planar imaging or standing full-leg radiographs).
3. **Operating Room Familiarity:** In the actual OR, surgeons use a 2D C-arm fluoroscopy machine. Seeing the 3D plan projected directly onto 2D X-rays mirrors how they actually operate.

---

## 2. What the User Sees: The "Virtual C-Arm" Viewport

When a user works with two 2D X-rays (AP = Front view, Lateral = Side view), the viewport presents an intuitive spatial environment:

```
+-----------------------------------------------------------------------------------------+
|                                    VIEWPORT LAYOUT                                      |
|                                                                                         |
|      [2D AP View (Front)]               [3D Spatial Center]         [2D Lateral (Side)] |
|   +-----------------------+           +---------------------+      +------------------+ |
|   |                       |           |   Virtual C-Arm     |      |                  | |
|   |                       |           |   Frustum           |      |                  | |
|   |     Femur & Knee      |           |     [AP Plane]      |      |   Lateral Knee   | |
|   |     Frontal X-Ray     |           |          \          |      |   Profile X-Ray  | |
|   |                       |           |         [3D Bone]   |      |                  | |
|   |                       |           |          /          |      |                  | |
|   |   • Landmark 1        |           |    [Lat Plane]      |      |   • Landmark 1'  | |
|   +-----------------------+           +---------------------+      +------------------+ |
|                                                                                         |
|   Epipolar Guidance Line: ──────────────────────────────────────────────────────────>    |
|   (Clicking a point on AP shows a horizontal guide line on Lateral to make matching easy)|
+-----------------------------------------------------------------------------------------+
```

### The Spatial Experience:
- Instead of just two flat photos in disconnected windows, the two X-rays stand **at a $90^\circ$ angle to each other** inside the 3D world, exactly like physical film plates in a radiology room.
- In the center where the two projection beams intersect, the **patient's 3D bone model** appears and updates live.

---

## 3. How the Node Graph Represents This

In the **Recipe Builder**, the workflow is clean, modular, and easy to understand:

```
[2D X-Ray (AP Front)] ─────┬───> [Bi-Planar Calibrator] ───> [2D-3D Bone Morphing] ───> [3D Bone Mesh]
                           │        (Scale & Alignment)       (Statistical Shape Model)          │
[2D X-Ray (Lateral Side)] ─┘                                                                     ▼
                                                                                       [Implant Placement]
                                                                                                 │
                                                                                                 ▼
                                                                                    [Live 2D Projection Overlay]
                                                                                      (Projects implant back
                                                                                       onto both 2D X-rays)
```

---

## 4. Step-by-Step User Journey

### Step 1: Drag & Drop the Two 2D X-Rays
- The user drags two files (JPEG, PNG, or 2D DICOM) onto the canvas:
  - Dropzone 1: **AP (Front View)**
  - Dropzone 2: **Lateral (Side View)**
- The system automatically detects image orientations or lets the user flip/rotate with one click.

### Step 2: Calibrate Scale (Real-World Millimeters)
- Standard X-rays have magnification distortions.
- The user clicks two ends of a calibration coin/ruler visible in the X-ray, or enters the known distance:
  - *"Distance between points = 25.0 mm"*
- The software instantly establishes accurate millimeter scale.

### Step 3: Interactive Landmark Placement with "Epipolar Assistance"
- To reconstruct the 3D bone, the user marks a few key anatomical landmarks (e.g., knee center, femoral condyle edges, hip center).
- **The UX Delight (Epipolar Guide):**
  - When the user clicks the medial condyle on the **AP Front X-ray**, the software instantly draws a highlighted **horizontal guide line across the Lateral Side X-ray**.
  - The user simply clicks along that line on the lateral view. No guessing or searching needed!

### Step 4: Instant 2D-to-3D Bone Generation
- The `2D-3D Bone Morphing` node takes the calibrated outlines and landmarks and generates a realistic, patient-specific 3D bone model inside the 3D center view.
- The user can adjust a **Fit Confidence Slider** (from coarse to high-detail).

### Step 5: Implant Planning with "Live 2D Projection" (The Magic Moment)
This is where surgeons get the most value:
- The surgeon places a 3D knee or hip implant onto the reconstructed 3D bone in the center viewport.
- **Instant Dual-View Projection:**
  - As the surgeon moves the 3D implant, **its 2D silhouette is dynamically ray-traced back onto both original 2D X-rays in real time**.
  - The surgeon looks at the front X-ray and side X-ray: *"The implant silhouette matches the patient's cortical contours perfectly on both views!"*
- This gives the surgeon $100\%$ confidence because they are evaluating the plan directly against the raw radiographic evidence.

---

## 5. What If the Surgeon Only Wants Quick Review? (Surgeon Mode)

For the surgeon in a hurry:
1. They open the case on their laptop or tablet.
2. They see the two X-rays side-by-side with the planned 3D implant already overlaid in semi-transparent neon green.
3. They use a simple slider:
   - **Varus/Valgus Angle:** $[-5^\circ \dots +5^\circ]$
   - **Implant Size:** `[Size 3, Size 4, Size 5]`
4. Moving the slider live-updates the overlay on both 2D radiographs.
5. They click **"Approve Plan"**.

---

## 6. Summary of Key User Benefits

| Challenge with 2D X-Rays | How NodeSurg Solves It |
|---|---|
| **Magnification & Distortion** | One-click 25mm calibration marker node ensures millimeter-accurate true scale. |
| **Difficult to Correlate Front & Side** | Epipolar line helper: clicking on Front automatically highlights the corresponding level on Side. |
| **Hard to visualize 3D anatomy from flat images** | Bi-planar intersection view reconstructs a 3D model in the center of the two projection planes. |
| **Surgeon needs to trust the result** | Live reverse projection: the 3D implant is projected as a 2D silhouette right over the original X-rays for visual verification. |
