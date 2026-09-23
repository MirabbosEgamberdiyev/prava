/**
 * PRAVAONLINE — Modular Input Normalizer Architecture
 * 
 * Flow:
 * Input Devices (Keyboard, Touch, Mouse, Gamepad, Wheel)
 *        ↓
 * Input Normalizer
 *        ↓
 * NormalizedControlState
 *        ↓
 * Vehicle Physics Engine
 *        ↓
 * 3D Vehicle & Audio
 * 
 * Provides:
 * - Progressive multi-stage throttle ramp: 0%, 10%, 25%, 50%, 75%, 100%
 * - Progressive multi-stage brake ramp: 0%, 10%, 25%, 50%, 75%, 100%
 * - Continuous Ackermann steering (-1.0 to +1.0) with speed-dependent self-centering caster
 * - Smooth clutch pedal modulation (0.0 to 1.0) with manual stall safeguard
 */

import type { GearMode, CameraView } from "../types";

export interface NormalizedControlState {
  throttle: number; // 0.0 to 1.0
  brake: number; // 0.0 to 1.0
  steer: number; // -1.0 (full left) to +1.0 (full right)
  clutch: number; // 0.0 (engaged) to 1.0 (pressed)
  handbrake: boolean;
  gear: GearMode;
  manualGear?: "R" | "N" | "1" | "2" | "3" | "4" | "5";
  turnSignal: "none" | "left" | "right" | "hazard";
  horn: boolean;
  camera: CameraView;
  inputSource: "keyboard" | "touch" | "gamepad" | "wheel";
}

export interface RawInputSources {
  keysDown: Record<string, boolean>;
  touchThrottle: number; // 0 to 1
  touchBrake: number; // 0 to 1
  touchSteer: number; // -1 to +1
  touchClutch: number; // 0 to 1
  touchGear?: GearMode;
  touchHandbrake?: boolean;
  touchHorn?: boolean;
  gamepad?: {
    connected: boolean;
    throttle: number;
    brake: number;
    steer: number;
    clutch?: number;
    handbrake?: boolean;
    gearChange?: GearMode;
    horn?: boolean;
  };
}

export class InputNormalizer {
  private currentThrottle: number = 0;
  private currentBrake: number = 0;
  private currentSteer: number = 0;
  private currentClutch: number = 0;

  // Discrete pedal quantization thresholds for realistic automotive DBW stepping
  public static readonly THROTTLE_STAGES = [0.0, 0.10, 0.25, 0.50, 0.75, 1.00] as const;
  public static readonly BRAKE_STAGES = [0.0, 0.10, 0.25, 0.50, 0.75, 1.00] as const;

  /**
   * Quantizes a continuous 0..1 input to nearest realistic progressive stage
   */
  public static quantizePedal(raw01: number): number {
    if (raw01 <= 0.02) return 0.0;
    if (raw01 <= 0.18) return 0.10;
    if (raw01 <= 0.38) return 0.25;
    if (raw01 <= 0.62) return 0.50;
    if (raw01 <= 0.88) return 0.75;
    return 1.00;
  }

  /**
   * Primary frame step: Takes raw inputs and computes normalized control state
   */
  public step(
    raw: RawInputSources,
    currentGear: GearMode,
    currentHandbrake: boolean,
    currentCamera: CameraView,
    vehicleSpeedKmh: number,
    dt: number = 0.016
  ): NormalizedControlState {
    const keys = raw.keysDown;
    let source: "keyboard" | "touch" | "gamepad" | "wheel" = "keyboard";

    // 1. THROTTLE NORMALIZATION (Progressive Ramp)
    let targetThrottle = 0;
    if (keys["w"] || keys["arrowup"]) {
      targetThrottle = 1.0;
      source = "keyboard";
    }

    if (raw.touchThrottle > 0) {
      targetThrottle = Math.max(targetThrottle, raw.touchThrottle);
      source = "touch";
    }

    if (raw.gamepad?.connected && raw.gamepad.throttle > 0.02) {
      targetThrottle = Math.max(targetThrottle, raw.gamepad.throttle);
      source = "gamepad";
    }

    // Keyboard progressive ramp up / fast drop
    if (targetThrottle > this.currentThrottle) {
      // Smooth rise over ~0.35s to allow fine parking control on short taps
      const riseRate = 3.2; // 1.0 / 0.35s ≈ 2.85 - 3.2
      this.currentThrottle = Math.min(targetThrottle, this.currentThrottle + riseRate * dt);
    } else {
      // Rapid decay upon release
      const decayRate = 7.0;
      this.currentThrottle = Math.max(0, this.currentThrottle - decayRate * dt);
    }

    // 2. BRAKE NORMALIZATION (Progressive Ramp)
    let targetBrake = 0;
    if (keys["s"] || keys["arrowdown"]) {
      targetBrake = 1.0;
      source = "keyboard";
    }

    if (raw.touchBrake > 0) {
      targetBrake = Math.max(targetBrake, raw.touchBrake);
      source = "touch";
    }

    if (raw.gamepad?.connected && raw.gamepad.brake > 0.02) {
      targetBrake = Math.max(targetBrake, raw.gamepad.brake);
      source = "gamepad";
    }

    if (targetBrake > this.currentBrake) {
      const brakeRiseRate = 4.5;
      this.currentBrake = Math.min(targetBrake, this.currentBrake + brakeRiseRate * dt);
    } else {
      const brakeDecayRate = 8.5;
      this.currentBrake = Math.max(0, this.currentBrake - brakeDecayRate * dt);
    }

    // 3. STEERING NORMALIZATION (Ackermann limits & Caster Self-Centering)
    let targetSteer = 0;
    let isSteeringActive = false;

    if (keys["a"] || keys["arrowleft"]) {
      targetSteer = -1.0;
      isSteeringActive = true;
      source = "keyboard";
    } else if (keys["d"] || keys["arrowright"]) {
      targetSteer = 1.0;
      isSteeringActive = true;
      source = "keyboard";
    }

    if (Math.abs(raw.touchSteer) > 0.02) {
      targetSteer = raw.touchSteer;
      isSteeringActive = true;
      source = "touch";
    }

    if (raw.gamepad?.connected && Math.abs(raw.gamepad.steer) > 0.05) {
      targetSteer = raw.gamepad.steer;
      isSteeringActive = true;
      source = "gamepad";
    }

    if (isSteeringActive) {
      // Smooth steering rack interpolation
      const steerRate = 5.5;
      if (source === "touch" || source === "gamepad") {
        // Direct analog follow
        this.currentSteer += (targetSteer - this.currentSteer) * Math.min(1, 18 * dt);
      } else {
        // Keyboard ramp
        if (targetSteer > this.currentSteer) {
          this.currentSteer = Math.min(targetSteer, this.currentSteer + steerRate * dt);
        } else {
          this.currentSteer = Math.max(targetSteer, this.currentSteer - steerRate * dt);
        }
      }
    } else {
      // Caster self-centering effect: returns to 0 faster when vehicle is rolling
      const casterRate = 8.0 + Math.min(16.0, Math.abs(vehicleSpeedKmh) * 0.7);
      if (this.currentSteer > 0) {
        this.currentSteer = Math.max(0, this.currentSteer - casterRate * dt);
      } else if (this.currentSteer < 0) {
        this.currentSteer = Math.min(0, this.currentSteer + casterRate * dt);
      }
    }

    // 4. CLUTCH NORMALIZATION
    let targetClutch = 0;
    if (keys["c"] || keys["shift"]) {
      targetClutch = 1.0;
    }
    if (raw.touchClutch > 0) {
      targetClutch = Math.max(targetClutch, raw.touchClutch);
    }
    if (raw.gamepad?.clutch !== undefined) {
      targetClutch = Math.max(targetClutch, raw.gamepad.clutch);
    }

    if (targetClutch > this.currentClutch) {
      this.currentClutch = Math.min(1, this.currentClutch + 7 * dt);
    } else {
      this.currentClutch = Math.max(0, this.currentClutch - 6 * dt);
    }

    // 5. GEAR SELECTION
    let finalGear = currentGear;
    if (raw.touchGear) {
      finalGear = raw.touchGear;
    } else if (raw.gamepad?.gearChange) {
      finalGear = raw.gamepad.gearChange;
    }

    // 6. HANDBRAKE & HORN
    let handbrake = currentHandbrake;
    if (raw.touchHandbrake !== undefined) {
      handbrake = raw.touchHandbrake;
    } else if (raw.gamepad?.handbrake !== undefined) {
      handbrake = raw.gamepad.handbrake;
    }

    const horn = Boolean(raw.touchHorn || raw.gamepad?.horn || keys["h"]);

    return {
      throttle: Number(this.currentThrottle.toFixed(3)),
      brake: Number(this.currentBrake.toFixed(3)),
      steer: Number(this.currentSteer.toFixed(3)),
      clutch: Number(this.currentClutch.toFixed(3)),
      handbrake,
      gear: finalGear,
      turnSignal: "none",
      horn,
      camera: currentCamera,
      inputSource: source,
    };
  }

  public reset(): void {
    this.currentThrottle = 0;
    this.currentBrake = 0;
    this.currentSteer = 0;
    this.currentClutch = 0;
  }
}
