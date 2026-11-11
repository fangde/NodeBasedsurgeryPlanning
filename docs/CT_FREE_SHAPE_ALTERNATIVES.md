# CT-Free Surgical Planning: Getting 3D Anatomy Without a 3D CT Scan

**Document Focus:** User Perspective, Clinical Modalities, and Input Independence  
*(Why clinical teams want CT-free planning and how users experience it)*

---

## 1. Why Clinical Teams Want Alternatives to 3D CT

While 3D CT has historically been the gold standard for surgical planning, in daily clinical practice it introduces significant barriers:

```
+-----------------------------------------------------------------------------------------+
|                               WHY USERS AVOID 3D CT                                     |
|                                                                                         |
|   1. Radiation Hazard:   ~50x to 100x higher radiation dose. Unacceptable for pediatric |
|                          scoliosis or young patients requiring frequent follow-ups.      |
|                                                                                         |
|   2. Cost & Access:      CT scans cost $800–$2,500+ and have days-long scheduling delays |
|                          in many outpatient surgical centers (ASCs) and clinics.        |
|                                                                                         |
|   3. Lying Down Flaw:    CT requires lying flat (supine). Joint collapse, leg axis,     |
|                          and pelvic tilt can ONLY be accurately assessed standing up.   |
|                                                                                         |
|   4. Metal Artifacts:    Existing metal screws/plates cause bright starburst streaks on  |
|                          CT scans that completely destroy bone surface geometry.       |
+-----------------------------------------------------------------------------------------+
```

---

## 2. The User Experience of "CT-Free" Shape Providers

In NodeSurg, a **3D Bone Shape** does not have to come from a CT scan. The platform treats anatomical shape as a modular, interchangeable input.

From the user's perspective, the rest of the plan (cutting, realigning, placing implants, generating 3D printed guides) **stays identical**, regardless of how the 3D shape was created.

```
+-----------------------------------------------------------------------------------------+
|                    MODULAR "SHAPE PROVIDER" NODES (USER PERSPECTIVE)                   |
|                                                                                         |
|  Option 1: Two 2D X-Rays (AP + Lat)                                                     |
|  [Front X-Ray] ───┬───> [2D-to-3D Morphing] ─────────────┐                             |
|  [Side X-Ray]  ───┘     (Silhouettes match 2D views)     │                             |
|                                                          ▼                             |
|  Option 2: Anthropometric Landmarks             [3D Bone Mesh] ──> [Osteotomy Cut]     |
|  [Patient Height, Gender, 8 Key Points] ──>              ▲         (Same surgical plan)|
|  [Parametric Deformable Template] ───────────────────────┤                             |
|                                                          │                             |
|  Option 3: Surface Optical / Ultrasound Probe            │                             |
|  [Handheld Scanner / Tracked Stylus] ────────────────────┘                             |
+-----------------------------------------------------------------------------------------+
```

---

## 3. Four CT-Free Ways Users Can Generate 3D Shape

### Method 1: Bi-Planar 2D X-Ray Reconstruction (Most Popular)
- **User Input:** 1 Frontal (AP) X-ray + 1 Lateral (Side) X-ray.
- **User Action:**
  - The user marks 4 to 6 anatomical contours or points (e.g., femoral head circle, condylar widths).
  - The software deforms a 3D Statistical Shape Model (SSM) until its virtual shadows perfectly match the two 2D radiographs.
- **Clinical Best Fit:** Knee replacement (TKA), Hip replacement (THA), Spine deformity correction (scoliosis).

---

### Method 2: Landmark & Anthropometric Parametric Morphing
- **User Input:** No 3D scan at all. Just clinical measurements and a single calibrated X-ray or physical examination.
- **User Action:**
  - The user enters: *Height: 175 cm, Gender: Male, Transcondylar Width: 74 mm, Femoral Head Diameter: 48 mm*.
  - The system adjusts a parametric 3D bone model that mathematically matches the patient’s exact skeletal proportions.
- **Clinical Best Fit:** Fast standard implant sizing, outpatient pre-consultations, low-resource hospitals.

---

### Method 3: Intraoperative Surface Point Cloud / Optical Painting
- **User Input:** Handheld 3D optical scanner (or surgical navigation pointer).
- **User Action:**
  - Inside the operating room, the surgeon or assistant lightly touches or "paints" 30–50 points on the exposed bone surface.
  - The software snaps and wraps a 3D bone shape onto those points in real time.
- **Clinical Best Fit:** Trauma fracture reduction, revision surgery where metal hardware blocks pre-op imaging.

---

### Method 4: Tracked Ultrasound (A-Mode / B-Mode)
- **User Input:** Standard ultrasound probe with optical tracking tags.
- **User Action:**
  - The user glides the ultrasound wand over the patient's skin (e.g. over the knee or hip).
  - The bone surface reflection is detected and instantly converted into a 3D bone cloud without any ionizing radiation.
- **Clinical Best Fit:** Pediatric orthopedics, pregnant patients, sports medicine.

---

## 4. Why This Architecture Delights the User

### 1. "Zero-Rework" Flexibility
If a clinic starts a case with **Two 2D X-rays**, but the surgeon later orders a localized **CT scan** because of an unexpected bone cyst, the user does not have to rebuild the plan:
- **Disconnect** the `[2D X-Ray Node]`.
- **Connect** the `[CT DICOM Node]`.
- All downstream cut angles, implant alignments, and measurements **stay intact** and update to the higher-resolution mesh immediately.

### 2. Side-by-Side Fidelity Check
The user can connect both the 2D-reconstructed shape and an actual CT shape into a **"Compare Deviation" Node**:
- The viewport displays a color deviation map showing where the 2D-reconstructed bone differs from a full CT (e.g. $\pm 0.8\text{ mm}$ tolerance across the articular surface).
- This gives the surgical team complete transparency and peace of mind regarding the geometric fidelity of the CT-free approach.

---

## 5. Summary: CT-Free vs. 3D CT for the Surgeon

| Dimension | Standard 3D CT | 2D X-Ray Alternative (NodeSurg) |
|---|---|---|
| **Patient Radiation** | High ($2–10\text{ mSv}$) | Very Low ($0.05–0.2\text{ mSv}$) |
| **Patient Posture** | Lying down (non-functional) | Standing up (weight-bearing gravity load) |
| **Acquisition Cost** | Expensive (\$800–\$2,500) | Low-cost (\$50–\$150) |
| **Availability** | Requires major radiology suite | Available in almost every clinic worldwide |
| **Planning Capabilities** | Full 3D osteotomy & implants | Identical 3D osteotomy & implants |
| **Guide (PSI) Generation** | Watertight fit | Good fit over key bony ridges / landmarks |
