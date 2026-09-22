import type { VehicleTelemetry, ExerciseDefinition } from "../types";

export interface SensorEvaluation {
  isExerciseCompleted: boolean;
  isSpeedViolated: boolean;
  isRollbackViolated: boolean;
  distanceToTarget: number;
}

export function evaluateSensors(
  vehicle: VehicleTelemetry,
  exercise: ExerciseDefinition
): SensorEvaluation {
  // Distance to target
  const dx = vehicle.posX - exercise.targetX;
  const dy = vehicle.posY - exercise.targetY;
  const distanceToTarget = Math.sqrt(dx * dx + dy * dy);

  // Exercise completed if vehicle reached target area (within 24 px) and slowed down
  const isExerciseCompleted = distanceToTarget < 25 && Math.abs(vehicle.speed) <= 4;

  // Speed limit check
  const isSpeedViolated = Math.abs(vehicle.speed) > exercise.maxSpeedKmh + 3;

  // Estakada rollback check (> 20 cm = 0.20 m)
  const isRollbackViolated = exercise.hasIncline === true && vehicle.rollbackDistance > 0.20;

  return {
    isExerciseCompleted,
    isSpeedViolated,
    isRollbackViolated,
    distanceToTarget,
  };
}
