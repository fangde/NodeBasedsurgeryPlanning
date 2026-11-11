import * as THREE from 'three';

/**
 * Generates an anatomical 3D distal femur surface mesh
 */
export function createFemurGeometry(): THREE.BufferGeometry {
  const geom = new THREE.BufferGeometry();
  const vertices: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const radialSegments = 32;
  const heightSegments = 40;
  const shaftRadius = 14;
  const totalHeight = 160;

  for (let yIndex = 0; yIndex <= heightSegments; yIndex++) {
    const v = yIndex / heightSegments;
    const y = -v * totalHeight; // 0 at top, -160 at distal condyles

    // Flare out near the distal condyles (y < -100)
    let flare = 1.0;
    if (y < -80) {
      const t = (-y - 80) / 80;
      flare = 1.0 + Math.pow(t, 1.8) * 1.5;
    }

    for (let xIndex = 0; xIndex <= radialSegments; xIndex++) {
      const u = xIndex / radialSegments;
      const theta = u * Math.PI * 2;

      let rx = Math.cos(theta) * shaftRadius * flare;
      let rz = Math.sin(theta) * shaftRadius * (flare * 1.15);

      // Distal condyle bifurcation (two distinct medial and lateral bumps at distal end)
      if (y < -120) {
        const condyleT = (-y - 120) / 40;
        const isMedial = rx < 0;
        const bumpSign = isMedial ? -1 : 1;

        // Spread condyles apart
        rx += bumpSign * condyleT * 12;

        // Posterior condylar curvature (protrudes backwards)
        if (rz < 0) {
          rz -= condyleT * 18 * Math.sin(Math.PI * condyleT);
        }

        // Trochlear groove anteriorly
        if (rz > 0 && Math.abs(rx) < 8) {
          rz -= condyleT * 6;
        }
      }

      vertices.push(rx, y + 80, rz);
      uvs.push(u, v);

      const norm = new THREE.Vector3(rx, 0, rz).normalize();
      normals.push(norm.x, norm.y, norm.z);
    }
  }

  const stride = radialSegments + 1;
  for (let y = 0; y < heightSegments; y++) {
    for (let x = 0; x < radialSegments; x++) {
      const i0 = y * stride + x;
      const i1 = (y + 1) * stride + x;
      const i2 = (y + 1) * stride + (x + 1);
      const i3 = y * stride + (x + 1);

      indices.push(i0, i1, i2);
      indices.push(i0, i2, i3);
    }
  }

  geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geom.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geom.setIndex(indices);
  geom.computeVertexNormals();

  return geom;
}

/**
 * Generates an anatomical 3D proximal tibia surface mesh
 */
export function createTibiaGeometry(): THREE.BufferGeometry {
  const geom = new THREE.BufferGeometry();
  const vertices: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const radialSegments = 32;
  const heightSegments = 40;
  const shaftRadius = 12;
  const totalHeight = 160;

  for (let yIndex = 0; yIndex <= heightSegments; yIndex++) {
    const v = yIndex / heightSegments;
    let y = -v * totalHeight; // 0 at plateau, down to -160

    // Flare out near proximal plateau (y > -60)
    let flare = 1.0;
    if (y > -60) {
      const t = (y + 60) / 60;
      flare = 1.0 + Math.pow(t, 1.6) * 1.7;
    }

    for (let xIndex = 0; xIndex <= radialSegments; xIndex++) {
      const u = xIndex / radialSegments;
      const theta = u * Math.PI * 2;

      let rx = Math.cos(theta) * shaftRadius * flare * 1.35; // Wider in coronal plane
      let rz = Math.sin(theta) * shaftRadius * flare;

      // Anterior tibial crest & tuberosity
      if (rz > 0 && y > -65 && y < -15) {
        const crestT = Math.sin(((y + 65) / 50) * Math.PI);
        if (Math.abs(rx) < 10) {
          rz += crestT * 8;
        }
      }

      // Concave medial & lateral plateaus at top surface
      if (y > -8) {
        if (Math.abs(rx) > 5) {
          y -= 2.0; // slight dishing
        }
      }

      vertices.push(rx, y - 80, rz);
      uvs.push(u, v);

      const norm = new THREE.Vector3(rx, 0, rz).normalize();
      normals.push(norm.x, norm.y, norm.z);
    }
  }

  const stride = radialSegments + 1;
  for (let y = 0; y < heightSegments; y++) {
    for (let x = 0; x < radialSegments; x++) {
      const i0 = y * stride + x;
      const i1 = (y + 1) * stride + x;
      const i2 = (y + 1) * stride + (x + 1);
      const i3 = y * stride + (x + 1);

      indices.push(i0, i1, i2);
      indices.push(i0, i2, i3);
    }
  }

  geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geom.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geom.setIndex(indices);
  geom.computeVertexNormals();

  return geom;
}

/**
 * Generates realistic 3D Femoral Component CAD Implant (CoCr / Ti Alloy)
 */
export function createFemoralImplantGeometry(): THREE.BufferGeometry {
  const geom = new THREE.BufferGeometry();
  const vertices: number[] = [];
  const indices: number[] = [];

  // Dual-condyle curved runner box geometry
  const width = 36;
  const radius = 22;
  const arcSegments = 24;

  for (let i = 0; i <= arcSegments; i++) {
    const angle = -Math.PI * 0.15 + (i / arcSegments) * (Math.PI * 1.1);
    const z = -Math.sin(angle) * radius;
    const y = -Math.cos(angle) * radius + radius * 0.4;

    // Medial condyle runner
    vertices.push(-width * 0.5, y, z);
    vertices.push(-width * 0.18, y, z);

    // Lateral condyle runner
    vertices.push(width * 0.18, y, z);
    vertices.push(width * 0.5, y, z);
  }

  // Anterior trochlear bridge plate
  for (let i = 0; i < arcSegments; i++) {
    const base = i * 4;
    // Medial runner quad
    indices.push(base, base + 4, base + 5);
    indices.push(base, base + 5, base + 1);

    // Lateral runner quad
    indices.push(base + 2, base + 6, base + 7);
    indices.push(base + 2, base + 7, base + 3);

    // Trochlear anterior bridge
    if (i > arcSegments * 0.45) {
      indices.push(base + 1, base + 5, base + 6);
      indices.push(base + 1, base + 6, base + 2);
    }
  }

  geom.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geom.setIndex(indices);
  geom.computeVertexNormals();

  return geom;
}

/**
 * Generates 3D Tibial Baseplate Tray CAD Implant (Titanium)
 */
export function createTibialTrayGeometry(): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  const width = 36;
  const depth = 26;

  // Kidney-bean anatomical tibial plateau perimeter
  shape.moveTo(-width * 0.5, 0);
  shape.bezierCurveTo(-width * 0.5, depth * 0.6, width * 0.5, depth * 0.6, width * 0.5, 0);
  shape.bezierCurveTo(width * 0.48, -depth * 0.5, 0, -depth * 0.6, -width * 0.48, -depth * 0.5);
  shape.closePath();

  const extrudeSettings = {
    steps: 1,
    depth: 4.5,
    bevelEnabled: true,
    bevelThickness: 1.0,
    bevelSize: 0.8,
    bevelSegments: 3
  };

  const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  geom.rotateX(Math.PI * 0.5);
  geom.translate(0, 0, 0);
  geom.computeVertexNormals();

  return geom;
}

/**
 * Generates 3D Polyethylene (UHMWPE) Bearing Insert
 */
export function createPolyInsertGeometry(thickness: number = 10): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  const width = 34;
  const depth = 24;

  shape.moveTo(-width * 0.5, 0);
  shape.bezierCurveTo(-width * 0.48, depth * 0.55, width * 0.48, depth * 0.55, width * 0.5, 0);
  shape.bezierCurveTo(width * 0.45, -depth * 0.45, 0, -depth * 0.55, -width * 0.45, -depth * 0.45);
  shape.closePath();

  const extrudeSettings = {
    steps: 1,
    depth: thickness,
    bevelEnabled: true,
    bevelThickness: 0.8,
    bevelSize: 0.6,
    bevelSegments: 2
  };

  const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  geom.rotateX(-Math.PI * 0.5);
  geom.computeVertexNormals();

  return geom;
}
