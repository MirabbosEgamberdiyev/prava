import type { VehicleTelemetry, VehicleConfig } from "../types";

export interface ControlInput {
  throttle: number; // 0 to 1
  brake: number; // 0 to 1
  steer: number; // -1 (full left) to +1 (full right)
  handbrake: boolean;
}

export function updateVehiclePhysics(
  current: VehicleTelemetry,
  input: ControlInput,
  config: VehicleConfig,
  deltaSeconds: number = 0.016,
  hasIncline: boolean = false
): VehicleTelemetry {
  let speed = current.speed;
  let rotation = current.rotation;
  let posX = current.posX;
  let posY = current.posY;
  let rollback = current.rollbackDistance;

  // Steering angle with interpolation
  const targetSteerAngle = input.steer * config.steeringAngleMax;
  const steeringAngle = current.steeringAngle + (targetSteerAngle - current.steeringAngle) * 0.2;

  // Estakada Incline effect (16% slope = ~9.1 degrees incline)
  if (hasIncline && current.gear === "D" && !input.handbrake && input.throttle < 0.2 && input.brake < 0.2) {
    // Gravity pulls backwards
    const rollbackAccel = -1.2; // km/h/s
    speed += rollbackAccel * deltaSeconds * 10;
    if (speed < 0) {
      rollback += Math.abs(speed * (1000 / 3600) * deltaSeconds);
    }
  } else if (!hasIncline || input.handbrake || input.brake > 0.5) {
    if (input.handbrake || input.brake > 0.5) {
      // stopped rollback
    }
  }

  // Gear logic & Power application
  if (input.handbrake || current.gear === "P") {
    // Heavy braking
    speed *= Math.max(0, 1 - 12 * deltaSeconds);
    if (Math.abs(speed) < 0.1) speed = 0;
  } else if (current.gear === "N") {
    // Rolling friction
    speed *= Math.max(0, 1 - 0.8 * deltaSeconds);
    if (Math.abs(speed) < 0.1) speed = 0;
  } else if (current.gear === "D") {
    if (input.throttle > 0) {
      const accel = input.throttle * config.accelerationPower * 45;
      speed += accel * deltaSeconds;
      if (speed > config.maxSpeedKmh) speed = config.maxSpeedKmh;
    }
    if (input.brake > 0) {
      const decel = input.brake * config.brakingPower * 55;
      speed = Math.max(0, speed - decel * deltaSeconds);
    }
    // Natural engine resistance
    if (input.throttle === 0 && input.brake === 0 && !hasIncline) {
      speed = Math.max(0, speed - 3.5 * deltaSeconds);
    }
  } else if (current.gear === "R") {
    if (input.throttle > 0) {
      const accel = input.throttle * config.accelerationPower * 25;
      speed -= accel * deltaSeconds; // Negative speed for reverse
      if (speed < -15) speed = -15;
    }
    if (input.brake > 0) {
      const decel = input.brake * config.brakingPower * 55;
      speed = Math.min(0, speed + decel * deltaSeconds);
    }
    if (input.throttle === 0 && input.brake === 0) {
      speed = Math.min(0, speed + 3.5 * deltaSeconds);
    }
  }

  // Angular displacement based on Ackermann steering model
  if (Math.abs(speed) > 0.2) {
    const steerRad = (steeringAngle * Math.PI) / 180;
    const speedMs = (speed * 1000) / 3600;
    const angularVelocity = (speedMs / config.wheelbaseMeters) * Math.tan(steerRad);
    rotation += angularVelocity * deltaSeconds * 1.5;
  }

  // Displacement in 2D space
  const speedScale = 0.08;
  const moveDist = speed * speedScale;
  posX += Math.cos(rotation) * moveDist;
  posY += Math.sin(rotation) * moveDist;

  // Track arena bounds clamp (30 to 570 in X, 30 to 470 in Y)
  const clampedX = Math.max(25, Math.min(575, posX));
  const clampedY = Math.max(25, Math.min(475, posY));

  // Compute RPM
  let rpm = 800;
  if (current.gear === "P" || current.gear === "N") {
    rpm = 800 + input.throttle * 2200;
  } else {
    rpm = 800 + Math.abs(speed) * 65 + input.throttle * 400;
  }

  return {
    ...current,
    speed: Math.round(speed * 10) / 10,
    rpm: Math.round(rpm),
    steeringAngle: Math.round(steeringAngle * 10) / 10,
    handbrake: input.handbrake,
    throttle: input.throttle,
    brake: input.brake,
    posX: clampedX,
    posY: clampedY,
    rotation,
    rollbackDistance: Math.round(rollback * 100) / 100,
  };
}
