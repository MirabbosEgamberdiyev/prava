import type { VehicleTelemetry, ExerciseDefinition } from "../types";

export interface CollisionResult {
  hasCollision: boolean;
  type: "cone" | "stop_line" | "curb" | "boundary" | "none";
  details?: string;
  pos?: { x: number; y: number };
}

export function checkCollisions(
  vehicle: VehicleTelemetry,
  exercise: ExerciseDefinition
): CollisionResult {
  const vehRadius = 12; // approximate collision circle for Cobalt

  // 1. Check Cones collision
  if (exercise.cones && exercise.cones.length > 0) {
    for (const cone of exercise.cones) {
      const dx = vehicle.posX - cone.x;
      const dy = vehicle.posY - cone.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < vehRadius + cone.radius) {
        return {
          hasCollision: true,
          type: "cone",
          details: `Cone hit at (${cone.x}, ${cone.y})`,
          pos: { x: cone.x, y: cone.y },
        };
      }
    }
  }

  // 2. Check Stop-Lines Crossing when speed > 5 km/h
  if (exercise.stopLines && exercise.stopLines.length > 0) {
    for (const line of exercise.stopLines) {
      // Distance from vehicle point to line segment
      const lineDist = pointToSegmentDistance(vehicle.posX, vehicle.posY, line.x1, line.y1, line.x2, line.y2);
      if (lineDist < 8 && Math.abs(vehicle.speed) > 5) {
        return {
          hasCollision: true,
          type: "stop_line",
          details: "Overstepped STOP line without proper stop",
          pos: { x: vehicle.posX, y: vehicle.posY },
        };
      }
    }
  }

  // 3. Perimeter Curb collision
  if (vehicle.posX <= 30 || vehicle.posX >= 570 || vehicle.posY <= 30 || vehicle.posY >= 470) {
    return {
      hasCollision: true,
      type: "curb",
      details: "Perimeter curb impact",
      pos: { x: vehicle.posX, y: vehicle.posY },
    };
  }

  // 4. Exercise Zone boundaries (if outside allowed zone)
  const z = exercise.sensorZone;
  const isOutside =
    vehicle.posX < z.minX - 25 ||
    vehicle.posX > z.maxX + 25 ||
    vehicle.posY < z.minY - 25 ||
    vehicle.posY > z.maxY + 25;

  if (isOutside) {
    return {
      hasCollision: true,
      type: "boundary",
      details: "Deviated outside exercise zone boundaries",
      pos: { x: vehicle.posX, y: vehicle.posY },
    };
  }

  return { hasCollision: false, type: "none" };
}

function pointToSegmentDistance(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
  if (l2 === 0) return Math.sqrt((px - x1) * (px - x1) + (py - y1) * (py - y1));
  let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
  t = Math.max(0, Math.min(1, t));
  const projX = x1 + t * (x2 - x1);
  const projY = y1 + t * (y2 - y1);
  const dx = px - projX;
  const dy = py - projY;
  return Math.sqrt(dx * dx + dy * dy);
}
