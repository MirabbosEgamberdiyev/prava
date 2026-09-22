import type { VehicleConfig } from "../types";

export const VEHICLE_CONFIGS: Record<string, VehicleConfig> = {
  "Chevrolet Cobalt": {
    modelName: "Chevrolet Cobalt",
    massKg: 1250,
    maxSpeedKmh: 45,
    accelerationPower: 0.35,
    brakingPower: 0.55,
    steeringAngleMax: 35,
    wheelbaseMeters: 2.62,
    trackWidthMeters: 1.73,
    color: "#1e3799",
  },
  "Chevrolet Gentra": {
    modelName: "Chevrolet Gentra",
    massKg: 1300,
    maxSpeedKmh: 45,
    accelerationPower: 0.33,
    brakingPower: 0.52,
    steeringAngleMax: 34,
    wheelbaseMeters: 2.6,
    trackWidthMeters: 1.72,
    color: "#2c3e50",
  },
  "Chevrolet Malibu": {
    modelName: "Chevrolet Malibu",
    massKg: 1480,
    maxSpeedKmh: 50,
    accelerationPower: 0.4,
    brakingPower: 0.6,
    steeringAngleMax: 33,
    wheelbaseMeters: 2.83,
    trackWidthMeters: 1.85,
    color: "#b71540",
  },
};
