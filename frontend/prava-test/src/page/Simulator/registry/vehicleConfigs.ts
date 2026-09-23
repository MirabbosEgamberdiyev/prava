import type { VehicleConfig, VehicleCategory } from "../types";

export const VEHICLE_CONFIGS: Record<string, VehicleConfig> = {
  // =========================================================================
  // CATEGORY B — PASSENGER VEHICLES
  // =========================================================================
  "Chevrolet Cobalt": {
    id: "cobalt",
    modelName: "Chevrolet Cobalt",
    category: "B",
    bodyType: "sedan",
    engineType: "gasoline",
    transmissionType: "auto",
    massKg: 1250,
    maxSpeedKmh: 45,
    accelerationPower: 0.35,
    brakingPower: 0.55,
    steeringAngleMax: 35,
    steeringRatio: 15.2,
    wheelbaseMeters: 2.62,
    trackWidthMeters: 1.73,
    lengthMeters: 4.45,
    widthMeters: 1.73,
    heightMeters: 1.51,
    groundClearanceMeters: 0.155,
    color: "#f8fafc", // Summit White
    secondaryColor: "#334155",
    hasDualRearWheels: false,
    gearRatios: [3.82, 2.15, 1.48, 1.05, 0.82],
    reverseRatio: 3.75,
    differentialRatio: 3.94,
    cameraOffsets: {
      chaseDist: 8.2,
      chaseHeight: 4.2,
      cockpitEyeX: 0.15,
      cockpitEyeY: 1.35,
      cockpitEyeZ: -0.28,
      rearBumperDist: 2.5,
    },
  },

  "Chevrolet Gentra": {
    id: "gentra",
    modelName: "Chevrolet Gentra",
    category: "B",
    bodyType: "sedan",
    engineType: "gasoline",
    transmissionType: "manual",
    massKg: 1300,
    maxSpeedKmh: 45,
    accelerationPower: 0.33,
    brakingPower: 0.52,
    steeringAngleMax: 34,
    steeringRatio: 15.6,
    wheelbaseMeters: 2.60,
    trackWidthMeters: 1.72,
    lengthMeters: 4.51,
    widthMeters: 1.72,
    heightMeters: 1.44,
    groundClearanceMeters: 0.15,
    color: "#1e293b", // Carbon Flash Metallic
    secondaryColor: "#0f172a",
    hasDualRearWheels: false,
    gearRatios: [3.75, 2.10, 1.42, 1.02, 0.81],
    reverseRatio: 3.65,
    differentialRatio: 4.05,
    cameraOffsets: {
      chaseDist: 8.2,
      chaseHeight: 4.2,
      cockpitEyeX: 0.14,
      cockpitEyeY: 1.30,
      cockpitEyeZ: -0.28,
      rearBumperDist: 2.55,
    },
  },

  "Chevrolet Onix": {
    id: "onix",
    modelName: "Chevrolet Onix",
    category: "B",
    bodyType: "sedan",
    engineType: "turbo",
    transmissionType: "auto",
    massKg: 1180,
    maxSpeedKmh: 48,
    accelerationPower: 0.38,
    brakingPower: 0.58,
    steeringAngleMax: 36,
    steeringRatio: 14.8,
    wheelbaseMeters: 2.60,
    trackWidthMeters: 1.73,
    lengthMeters: 4.47,
    widthMeters: 1.73,
    heightMeters: 1.47,
    groundClearanceMeters: 0.14,
    color: "#e2e8f0", // Switchblade Silver
    secondaryColor: "#1e293b",
    hasDualRearWheels: false,
    gearRatios: [4.04, 2.37, 1.56, 1.16, 0.85],
    reverseRatio: 3.85,
    differentialRatio: 3.87,
    cameraOffsets: {
      chaseDist: 8.2,
      chaseHeight: 4.2,
      cockpitEyeX: 0.14,
      cockpitEyeY: 1.32,
      cockpitEyeZ: -0.28,
      rearBumperDist: 2.48,
    },
  },

  "Chevrolet Malibu": {
    id: "malibu",
    modelName: "Chevrolet Malibu",
    category: "B",
    bodyType: "sedan",
    engineType: "turbo",
    transmissionType: "auto",
    massKg: 1480,
    maxSpeedKmh: 50,
    accelerationPower: 0.42,
    brakingPower: 0.62,
    steeringAngleMax: 33,
    steeringRatio: 16.0,
    wheelbaseMeters: 2.83,
    trackWidthMeters: 1.85,
    lengthMeters: 4.92,
    widthMeters: 1.85,
    heightMeters: 1.46,
    groundClearanceMeters: 0.135,
    color: "#b91c1c", // Cajun Red Tintcoat
    secondaryColor: "#18181b",
    hasDualRearWheels: false,
    gearRatios: [4.12, 2.35, 1.55, 1.12, 0.85],
    reverseRatio: 3.90,
    differentialRatio: 3.78,
    cameraOffsets: {
      chaseDist: 8.5,
      chaseHeight: 4.3,
      cockpitEyeX: 0.18,
      cockpitEyeY: 1.32,
      cockpitEyeZ: -0.30,
      rearBumperDist: 2.75,
    },
  },

  "Chevrolet Tracker": {
    id: "tracker",
    modelName: "Chevrolet Tracker",
    category: "B",
    bodyType: "suv",
    engineType: "turbo",
    transmissionType: "auto",
    massKg: 1350,
    maxSpeedKmh: 46,
    accelerationPower: 0.36,
    brakingPower: 0.56,
    steeringAngleMax: 35,
    steeringRatio: 15.4,
    wheelbaseMeters: 2.57,
    trackWidthMeters: 1.79,
    lengthMeters: 4.27,
    widthMeters: 1.79,
    heightMeters: 1.62,
    groundClearanceMeters: 0.19,
    color: "#0369a1", // Coastal Blue Metallic
    secondaryColor: "#0f172a",
    hasDualRearWheels: false,
    gearRatios: [3.95, 2.25, 1.50, 1.10, 0.84],
    reverseRatio: 3.80,
    differentialRatio: 3.92,
    cameraOffsets: {
      chaseDist: 8.2,
      chaseHeight: 4.4,
      cockpitEyeX: 0.15,
      cockpitEyeY: 1.48,
      cockpitEyeZ: -0.30,
      rearBumperDist: 2.45,
    },
  },

  // =========================================================================
  // CATEGORY C — COMMERCIAL CARGO TRUCK
  // =========================================================================
  "Isuzu NPR Truck": {
    id: "isuzu_truck",
    modelName: "Isuzu NPR Truck",
    category: "C",
    bodyType: "truck",
    engineType: "diesel",
    transmissionType: "manual",
    massKg: 5200,
    maxSpeedKmh: 40,
    accelerationPower: 0.26,
    brakingPower: 0.50,
    steeringAngleMax: 38,
    steeringRatio: 18.5,
    wheelbaseMeters: 3.81,
    trackWidthMeters: 2.05,
    lengthMeters: 6.60,
    widthMeters: 2.20,
    heightMeters: 2.75,
    groundClearanceMeters: 0.22,
    color: "#0284c7", // Commercial Blue
    secondaryColor: "#334155",
    hasDualRearWheels: true,
    gearRatios: [5.31, 2.91, 1.65, 1.00, 0.72],
    reverseRatio: 5.06,
    differentialRatio: 4.77,
    cameraOffsets: {
      chaseDist: 10.8,
      chaseHeight: 5.2,
      cockpitEyeX: 0.25,
      cockpitEyeY: 2.05,
      cockpitEyeZ: -0.45,
      rearBumperDist: 4.8,
    },
  },

  // =========================================================================
  // CATEGORY D — PASSENGER TRANSIT BUS
  // =========================================================================
  "Isuzu SAZ Bus": {
    id: "isuzu_bus",
    modelName: "Isuzu SAZ Bus",
    category: "D",
    bodyType: "bus",
    engineType: "diesel",
    transmissionType: "manual",
    massKg: 7800,
    maxSpeedKmh: 35,
    accelerationPower: 0.22,
    brakingPower: 0.46,
    steeringAngleMax: 40,
    steeringRatio: 21.0,
    wheelbaseMeters: 4.90,
    trackWidthMeters: 2.25,
    lengthMeters: 8.20,
    widthMeters: 2.35,
    heightMeters: 3.05,
    groundClearanceMeters: 0.24,
    color: "#059669", // Emerald City Transit Green
    secondaryColor: "#1e293b",
    hasDualRearWheels: true,
    gearRatios: [5.98, 3.25, 1.82, 1.00, 0.69],
    reverseRatio: 5.75,
    differentialRatio: 5.12,
    cameraOffsets: {
      chaseDist: 12.8,
      chaseHeight: 5.6,
      cockpitEyeX: 0.30,
      cockpitEyeY: 2.20,
      cockpitEyeZ: -0.50,
      rearBumperDist: 6.2,
    },
  },
};

export const DEFAULT_VEHICLE_FOR_CATEGORY: Record<VehicleCategory, string> = {
  B: "Chevrolet Cobalt",
  C: "Isuzu NPR Truck",
  D: "Isuzu SAZ Bus",
};

export function getVehiclesByCategory(category: VehicleCategory): VehicleConfig[] {
  return Object.values(VEHICLE_CONFIGS).filter((v) => v.category === category);
}

export function getVehicleConfig(modelNameOrCategory: string): VehicleConfig {
  if (VEHICLE_CONFIGS[modelNameOrCategory]) {
    return VEHICLE_CONFIGS[modelNameOrCategory];
  }
  // Try finding by category
  if (modelNameOrCategory === "B" || modelNameOrCategory === "C" || modelNameOrCategory === "D") {
    const defName = DEFAULT_VEHICLE_FOR_CATEGORY[modelNameOrCategory as VehicleCategory];
    return VEHICLE_CONFIGS[defName];
  }
  // Loose matching (e.g. "Cobalt" -> "Chevrolet Cobalt")
  const loose = Object.keys(VEHICLE_CONFIGS).find((k) =>
    k.toLowerCase().includes(modelNameOrCategory.toLowerCase())
  );
  if (loose && VEHICLE_CONFIGS[loose]) {
    return VEHICLE_CONFIGS[loose];
  }
  return VEHICLE_CONFIGS["Chevrolet Cobalt"];
}
