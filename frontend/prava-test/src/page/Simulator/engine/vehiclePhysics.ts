/**
 * PRAVAONLINE — Modular Vehicle Physics Simulation Engine
 * 
 * Implements realistic automotive drivetrain & chassis physics:
 * Engine → Transmission → Clutch → Differential → Wheels → Brakes → Suspension → Vehicle Body
 */

import type { VehicleTelemetry, VehicleConfig } from "../types";

export interface ControlInput {
  throttle: number; // 0.0 to 1.0
  brake: number; // 0.0 to 1.0
  steer: number; // -1.0 (left) to +1.0 (right)
  handbrake: boolean;
  clutch?: number; // 0.0 (engaged) to 1.0 (pressed)
}

// 1. ENGINE SUBSYSTEM
export class EngineSubsystem {
  public static readonly IDLE_RPM = 800;
  public static readonly REDLINE_RPM = 6200;

  /**
   * Progressive electronic throttle mapping (Drive-By-Wire curve):
   * Maps 0..1 pedal position with high-precision low-speed modulation:
   * 10% pedal -> ~3.5% effective throttle (smooth maneuvering / parking)
   * 25% pedal -> ~12.5% effective throttle
   * 50% pedal -> ~38% effective throttle
   * 75% pedal -> ~71% effective throttle
   * 100% pedal -> 100% effective throttle (full acceleration power)
   */
  public static getProgressiveThrottle(pedalInput: number): number {
    const raw = Math.max(0, Math.min(1, pedalInput));
    if (raw <= 0.01) return 0;
    return 0.55 * Math.pow(raw, 2) + 0.45 * Math.pow(raw, 3);
  }

  public static calculateTorque(rpm: number, throttle: number, maxTorqueNm: number = 180): number {
    const effectiveThrottle = EngineSubsystem.getProgressiveThrottle(throttle);
    if (effectiveThrottle <= 0.005) return 0;
    // Parabolic torque curve peaking around 3800 RPM
    const normRpm = Math.max(0, Math.min(1, (rpm - 800) / 5400));
    const torqueFactor = Math.sin(normRpm * Math.PI * 0.95);
    return effectiveThrottle * maxTorqueNm * Math.max(0.2, torqueFactor);
  }

  public static updateRpm(
    currentRpm: number,
    throttle: number,
    gearRatio: number,
    speedKmh: number,
    isClutchDisengaged: boolean,
    dt: number
  ): number {
    if (isClutchDisengaged || Math.abs(gearRatio) < 0.01) {
      // Neutral or clutch disengaged: engine revs freely with flywheel inertia
      const targetRpm = EngineSubsystem.IDLE_RPM + throttle * (EngineSubsystem.REDLINE_RPM - EngineSubsystem.IDLE_RPM);
      const lerpSpeed = throttle > 0 ? 8.0 : 4.5;
      return currentRpm + (targetRpm - currentRpm) * Math.min(1, lerpSpeed * dt);
    }

    // Engine mechanically linked to drive wheels (with clutch/torque converter slip at low speed)
    const wheelRpm = (Math.abs(speedKmh) * 1000 / 60) / (2 * Math.PI * 0.32);
    const driveRpm = wheelRpm * Math.abs(gearRatio) * 3.9;
    // At low vehicle speeds, clutch/converter slip allows engine to rev up with throttle
    const slipFloorRpm = EngineSubsystem.IDLE_RPM + (throttle > 0.05 ? throttle * 1600 : 0);
    const targetRpm = Math.max(slipFloorRpm, Math.min(EngineSubsystem.REDLINE_RPM, driveRpm));
    return currentRpm + (targetRpm - currentRpm) * Math.min(1, 14.0 * dt);
  }
}

// 2. TRANSMISSION & CLUTCH SUBSYSTEM
export class TransmissionSubsystem {
  public static getEffectiveRatio(
    gear: string,
    manualGear?: string,
    configGearRatios?: number[],
    configReverseRatio?: number
  ): number {
    const ratios = configGearRatios || [3.82, 2.15, 1.48, 1.05, 0.82];
    const reverse = configReverseRatio || 3.75;

    if (manualGear) {
      switch (manualGear) {
        case "1": return ratios[0] || 3.82;
        case "2": return ratios[1] || 2.15;
        case "3": return ratios[2] || 1.48;
        case "4": return ratios[3] || 1.05;
        case "5": return ratios[4] || 0.82;
        case "R": return -reverse;
        case "N": default: return 0;
      }
    }

    switch (gear) {
      case "D": return ratios[0] || 3.82;
      case "R": return -reverse;
      case "N":
      case "P":
      default: return 0;
    }
  }

  public static checkEngineStall(
    clutch: number,
    gear: string,
    manualGear: string | undefined,
    speedKmh: number,
    throttle: number
  ): boolean {
    const isGearEngaged = (manualGear === "1" || manualGear === "R" || gear === "D" || gear === "R");
    if (!isGearEngaged) return false;

    // If clutch is abruptly released (< 0.25) when vehicle is stalled/barely moving (< 0.8 km/h) with no throttle (< 0.1)
    return clutch < 0.25 && Math.abs(speedKmh) < 0.8 && throttle < 0.1;
  }
}

// 3. SUSPENSION & WEIGHT TRANSFER SUBSYSTEM
export class SuspensionSubsystem {
  public static calculatePitchAndRoll(
    accelMs2: number,
    angularVelocityRads: number,
    speedMs: number,
    currentPitch: number = 0,
    currentRoll: number = 0,
    dt: number = 0.016
  ): { pitch: number; roll: number } {
    // Pitch (longitudinal weight transfer): Nose dives on braking (negative accel), squats on acceleration
    const targetPitch = Math.max(-0.08, Math.min(0.08, -accelMs2 * 0.015));

    // Roll (lateral centrifugal force): Vehicle body leans outside turn
    const lateralAccel = speedMs * angularVelocityRads;
    const targetRoll = Math.max(-0.1, Math.min(0.1, lateralAccel * 0.02));

    const pitch = currentPitch + (targetPitch - currentPitch) * Math.min(1, 10.0 * dt);
    const roll = currentRoll + (targetRoll - currentRoll) * Math.min(1, 10.0 * dt);

    return { pitch, roll };
  }
}

// 4. MAIN MODULAR VEHICLE PHYSICS STEPPER
export function updateVehiclePhysics(
  current: VehicleTelemetry,
  input: ControlInput,
  config: VehicleConfig,
  deltaSeconds: number = 0.016,
  hasIncline: boolean = false
): VehicleTelemetry {
  const dt = Math.min(0.05, Math.max(0.001, deltaSeconds));
  let speed = current.speed;
  let rotation = current.rotation;
  let posX = current.posX;
  let posY = current.posY;
  let rollback = current.rollbackDistance;
  let engineStarted = current.engineStarted ?? true;
  let isStalled = current.isStalled ?? false;

  const clutchVal = input.clutch !== undefined ? input.clutch : (current.clutch ?? 0);

  // If engine is not running, stop linear power
  if (!engineStarted || isStalled) {
    speed *= Math.max(0, 1 - 2.8 * dt);
    if (Math.abs(speed) < 0.05) speed = 0;
    return {
      ...current,
      speed: Math.round(speed * 10) / 10,
      rpm: 0,
      throttle: input.throttle,
      brake: input.brake,
      handbrake: input.handbrake,
      clutch: clutchVal,
      isStalled,
      engineStarted: false,
      pitch: (current.pitch || 0) * (1 - 4 * dt),
      roll: (current.roll || 0) * (1 - 4 * dt),
    };
  }

  // 1. Steering with Ackermann limits & self-aligning caster return
  const targetSteerAngle = input.steer * config.steeringAngleMax;
  let steerInterp = Math.min(1, 14 * dt);
  // Caster self-centering effect: when steering input is released (|steer| < 0.05),
  // rolling wheels naturally return to center proportional to vehicle speed
  if (Math.abs(input.steer) < 0.05 && Math.abs(speed) > 1.0) {
    const casterSelfCenterRate = 14 + Math.min(16, Math.abs(speed) * 0.6);
    steerInterp = Math.min(1, casterSelfCenterRate * dt);
  }
  const steeringAngle = current.steeringAngle + (targetSteerAngle - current.steeringAngle) * steerInterp;

  // 2. Transmission & Gear Ratio
  const gearRatio = TransmissionSubsystem.getEffectiveRatio(
    current.gear,
    current.manualGear,
    config.gearRatios,
    config.reverseRatio
  );
  const clutchEngagement = Math.max(0, 1.0 - clutchVal);

  // 3. Engine Stall check
  if (current.transmissionMode === "manual" && TransmissionSubsystem.checkEngineStall(clutchVal, current.gear, current.manualGear, speed, input.throttle)) {
    isStalled = true;
    engineStarted = false;
    speed = 0;
  }

  // 4. Force Calculations
  const mass = config.massKg || 1300;
  let driveForceN = 0;
  let brakeForceN = 0;

  // Handbrake or Park Gear locks rear wheels
  if (input.handbrake || current.gear === "P") {
    brakeForceN = 16000;
  } else if (current.gear === "N" || current.manualGear === "N") {
    brakeForceN = 140; // Free rolling tire friction
  } else {
    // Forward / Reverse Drive Force
    if (input.throttle > 0 && Math.abs(gearRatio) > 0.01) {
      const engineTorque = EngineSubsystem.calculateTorque(current.rpm, input.throttle);
      const wheelTorque = engineTorque * Math.abs(gearRatio) * (config.differentialRatio || 3.9) * clutchEngagement;
      const wheelRadiusM = 0.32;
      const rawForce = (wheelTorque / wheelRadiusM) * config.accelerationPower * 1.5;
      driveForceN = Math.sign(gearRatio) * rawForce;
    }

    // Service Brake
    if (input.brake > 0) {
      brakeForceN = input.brake * mass * config.brakingPower * 4.2;
    }

    // Engine Compression Braking when coasting
    if (input.throttle === 0 && input.brake === 0) {
      brakeForceN = 220 + clutchEngagement * 180;
    }
  }

  // 5. 12% Incline Gravity Component (Estakada)
  if (hasIncline && !input.handbrake && input.brake < 0.3) {
    // 12% slope: sin(atan(0.12)) ≈ 0.119
    const slopeGravityN = -mass * 9.81 * 0.119;
    driveForceN += slopeGravityN;
  }

  // 6. Net Longitudinal Force & Acceleration
  const linearSpeedMs = (speed * 1000) / 3600;
  const rollingResistanceN = 0.015 * mass * 9.81;
  const aeroDragN = 0.5 * 1.225 * 0.35 * 2.2 * (linearSpeedMs * linearSpeedMs);

  let netForceN = driveForceN;
  if (Math.abs(linearSpeedMs) > 0.1) {
    netForceN -= Math.sign(linearSpeedMs) * (brakeForceN + rollingResistanceN + aeroDragN);
  } else {
    netForceN -= Math.sign(driveForceN) * Math.min(Math.abs(driveForceN), brakeForceN);
  }

  const accelMs2 = netForceN / mass;
  let newLinearSpeedMs = linearSpeedMs + accelMs2 * dt;

  // Friction braking cannot propel or reverse vehicle past zero
  if (input.throttle === 0 && input.brake > 0.05) {
    if (linearSpeedMs > 0 && newLinearSpeedMs < 0) {
      newLinearSpeedMs = 0;
    } else if (linearSpeedMs < 0 && newLinearSpeedMs > 0) {
      newLinearSpeedMs = 0;
    }
  }

  // Max Speed Caps
  const maxForwardMs = (config.maxSpeedKmh * 1000) / 3600;
  const maxReverseMs = -16 / 3.6;
  newLinearSpeedMs = Math.max(maxReverseMs, Math.min(maxForwardMs, newLinearSpeedMs));

  // Zero-speed deadband
  if (Math.abs(newLinearSpeedMs) < 0.05 && input.throttle === 0 && (input.brake > 0.1 || input.handbrake || current.gear === "P")) {
    newLinearSpeedMs = 0;
  }

  speed = (newLinearSpeedMs * 3600) / 1000;

  // Track Estakada Rollback
  if (hasIncline && newLinearSpeedMs < 0) {
    rollback += Math.abs(newLinearSpeedMs) * dt;
  }

  // 7. Ackermann Steering & Angular Velocity
  let angularVelocityRads = 0;
  if (Math.abs(newLinearSpeedMs) > 0.08) {
    const steerRad = (steeringAngle * Math.PI) / 180;
    angularVelocityRads = (newLinearSpeedMs / (config.wheelbaseMeters || 2.62)) * Math.tan(steerRad);
    rotation += angularVelocityRads * dt * 1.45;
  }

  // 8. 2D Coordinate Displacement
  const speedScale = 0.08;
  const moveDist = speed * speedScale * (dt / 0.016);
  posX += Math.cos(rotation) * moveDist;
  posY += Math.sin(rotation) * moveDist;

  // Arena Bounds Clamp (25 to 575 in X, 25 to 475 in Y)
  const clampedX = Math.max(25, Math.min(575, posX));
  const clampedY = Math.max(25, Math.min(475, posY));

  // 9. Suspension Pitch and Roll
  const { pitch, roll } = SuspensionSubsystem.calculatePitchAndRoll(
    accelMs2,
    angularVelocityRads,
    newLinearSpeedMs,
    current.pitch || 0,
    current.roll || 0,
    dt
  );

  // 10. Engine RPM
  const rpm = EngineSubsystem.updateRpm(
    current.rpm || 800,
    input.throttle,
    gearRatio,
    speed,
    clutchVal > 0.7 || current.gear === "N" || current.gear === "P",
    dt
  );

  return {
    ...current,
    speed: Math.round(speed * 10) / 10,
    rpm: Math.round(rpm),
    steeringAngle: Math.round(steeringAngle * 10) / 10,
    handbrake: input.handbrake,
    throttle: input.throttle,
    brake: input.brake,
    clutch: clutchVal,
    posX: clampedX,
    posY: clampedY,
    rotation,
    rollbackDistance: Math.round(rollback * 1000) / 1000,
    pitch,
    roll,
    isStalled,
    engineStarted,
  };
}
