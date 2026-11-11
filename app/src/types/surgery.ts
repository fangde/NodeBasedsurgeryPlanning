export interface PatientCase {
  id: string;
  name: string;
  age: number;
  gender: 'Female' | 'Male';
  diagnosis: string;
  affectedSide: 'Left' | 'Right';
  preOpHKA: number; // e.g. 172.5° (7.5° varus)
  preOpVarus: number; // 7.5°
  targetHKA: number; // 180.0° (neutral)
  description: string;
}

export interface FemoralPlan {
  size: string; // 'Size 3', 'Size 4', 'Size 5'
  varusValgus: number; // degrees, e.g. 0° (neutral to mechanical axis)
  flexionExtension: number; // degrees, e.g. 3° flexion
  distalCutDepth: number; // mm, default 9.0mm
  internalExternalRotation: number; // degrees, e.g. 3° external relative to posterior condyles
  anteriorCutDepth: number; // mm
  posteriorCutDepth: number; // mm
}

export interface TibialPlan {
  size: string; // 'Size 3', 'Size 4', 'Size 5'
  varusValgus: number; // degrees, e.g. 0° (neutral)
  posteriorSlope: number; // degrees, e.g. 4.0°
  resectionDepth: number; // mm, e.g. 8.0mm from high side
  internalExternalRotation: number; // degrees, e.g. 0° aligned with medial 1/3 tuberosity
  insertThickness: number; // mm, e.g. 10.0mm (9, 10, 11, 12, 14)
}

export interface GapBalanceResult {
  extensionMedial: number; // mm
  extensionLateral: number; // mm
  flexionMedial: number; // mm
  flexionLateral: number; // mm
  extensionDelta: number; // mm
  flexionDelta: number; // mm
  status: 'balanced' | 'tight_medial' | 'tight_lateral' | 'loose';
}

export interface NodeGraphItem {
  id: string;
  title: string;
  category: 'input' | 'processing' | 'planning' | 'simulation' | 'robot';
  status: 'ready' | 'computing' | 'dirty';
  x: number;
  y: number;
  inputs: { id: string; name: string; type: string }[];
  outputs: { id: string; name: string; type: string }[];
  summary: string;
}
