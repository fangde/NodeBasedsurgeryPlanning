import { FemoralPlan, TibialPlan, GapBalanceResult } from '../types/surgery';

/**
 * Calculates Extension Gap and Flexion Gap (Medial & Lateral)
 * based on clinical bone cuts, implant alignment, and insert thickness
 */
export function calculateGaps(
  femur: FemoralPlan,
  tibia: TibialPlan,
  preOpVarus: number
): GapBalanceResult {
  // Baseline nominal gap components (in mm)
  // Standard distal cut = 9mm, Tibial cut = 8mm, Total nominal gap = 17mm + joint laxity
  const baseExtension = femur.distalCutDepth + tibia.resectionDepth + 2.0;
  const baseFlexion = 9.0 + tibia.resectionDepth + 2.0;

  // Femoral Varus/Valgus effect on Extension Gap
  // 1° varus cut decreases medial extension gap by ~0.85mm and increases lateral by ~0.85mm
  // Femoral External Rotation (3° standard) opens medial flexion gap by ~0.9mm/deg
  const femurVarusEffect = femur.varusValgus * 0.85;
  const femurRotEffect = femur.internalExternalRotation * 0.75; // external opens medial flexion

  // Tibial Varus/Valgus effect (affects both extension and flexion)
  const tibiaVarusEffect = tibia.varusValgus * 0.9;

  // Tibial Posterior Slope effect (primarily increases flexion gap)
  // ~0.85mm increase in flexion gap per degree of posterior slope
  const slopeFlexionEffect = (tibia.posteriorSlope - 3.0) * 0.85;

  // Pre-op contracture release simulation
  // Pre-op varus knee typically has tight medial collateral ligament (MCL)
  const residualContracture = Math.max(0, preOpVarus - (femur.varusValgus + tibia.varusValgus + 6.0)) * 0.4;

  const extMed = Number((baseExtension - femurVarusEffect - tibiaVarusEffect - residualContracture).toFixed(1));
  const extLat = Number((baseExtension + femurVarusEffect + tibiaVarusEffect).toFixed(1));

  const flexMed = Number((baseFlexion + femurRotEffect - tibiaVarusEffect).toFixed(1));
  const flexLat = Number((baseFlexion - femurRotEffect + slopeFlexionEffect + tibiaVarusEffect).toFixed(1));

  const extensionDelta = Number(Math.abs(extMed - extLat).toFixed(1));
  const flexionDelta = Number(Math.abs(flexMed - flexLat).toFixed(1));

  let status: GapBalanceResult['status'] = 'balanced';
  if (extMed < extLat - 1.5 || flexMed < flexLat - 1.5) {
    status = 'tight_medial';
  } else if (extLat < extMed - 1.5 || flexLat < flexMed - 1.5) {
    status = 'tight_lateral';
  } else if (extMed > tibia.insertThickness + 5.0 || flexMed > tibia.insertThickness + 5.0) {
    status = 'loose';
  }

  return {
    extensionMedial: extMed,
    extensionLateral: extLat,
    flexionMedial: flexMed,
    flexionLateral: flexLat,
    extensionDelta,
    flexionDelta,
    status
  };
}

/**
 * Calculates instantaneous 3D coupled kinematics for the knee during flexion
 * (flexion rotation, posterior rollback in Z, and slight internal tibial rotation)
 */
export function calculateKinematics(flexionDegrees: number) {
  const rad = (flexionDegrees * Math.PI) / 180;

  // Femoral rollback: as knee flexes from 0° to 120°, lateral condyle rolls back ~10-12mm, medial rolls back ~4-5mm
  const rollbackZ = -Math.sin(rad * 0.8) * 9.5;

  // Dynamic vertical lift due to cam-post or condylar curvature
  const elevationY = -Math.sin(rad * 0.5) * 3.0;

  // Screw-home mechanism / axial rotation: tibia internally rotates ~8° as knee flexes
  const axialRotationRad = (flexionDegrees / 120) * (8 * Math.PI / 180);

  return {
    rotationX: rad,
    translationY: elevationY,
    translationZ: rollbackZ,
    axialRotationY: axialRotationRad
  };
}
