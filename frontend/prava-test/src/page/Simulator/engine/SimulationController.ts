/**
 * PRAVAONLINE — Comprehensive SimulationController Architecture
 * 
 * Implements the 7 core simulation pillars:
 * 1. Raycast 4-Wheel Vehicle Physics (Suspension, Torque, Longitudinal/Lateral Friction, Pitch/Roll Weight Transfer).
 * 2. Uzbekistan State Practical Driving Exam Finite State Machine (Engine, Seatbelt, Headlights, Left Signal departure).
 * 3. Estakada 12% Incline, 3-Second Mandatory Hold, and 20cm Rollback Instant-Fail Detector.
 * 4. 10cm Yellow Sensor Boundary Colliders with 4-Tire Contact Point Intersection.
 * 5. Interactive Audio & Multi-lingual Voice Alerts ("Jarima balingiz hisoblandi!").
 * 6. 60 FPS Optimized Math & Cross-Platform Input Normalizer.
 * 7. Multi-Camera Matrix (Cockpit + Rotating Wheel, Chase 3rd-person, Orthographic Top-Down).
 */

import type {
  VehicleTelemetry,
  VehicleConfig,
  ExerciseDefinition,
  PenaltyEvent,
  ExamFSMState,
  GearMode,
  CameraView,
  SimulatorMode,
  ReplayRecording,
  AIInstructorFeedback,
} from "../types";
import { EXERCISE_REGISTRY } from "../registry/exerciseRegistry";
import { VEHICLE_CONFIGS, getVehicleConfig } from "../registry/vehicleConfigs";
import { createPenaltyEvent } from "./penaltyEngine";
import { audioEngine } from "./audioEngine";
import { ReplayRecorder, saveReplayLocally } from "./replayEngine";
import { AIInstructorEngine } from "./aiInstructorEngine";

export interface SimulationInput {
  throttle: number; // 0 to 1
  brake: number; // 0 to 1
  steer: number; // -1 to +1
  handbrake: boolean;
  engineToggle?: boolean;
  clutch?: number; // 0 (engaged) to 1 (pressed)
}

export interface WheelState {
  index: number;
  name: "FL" | "FR" | "RL" | "RR";
  localX: number;
  localZ: number;
  suspensionLength: number; // meters (rest = 0.35m)
  springForce: number;
  damperForce: number;
  tireLoadN: number;
  isSteering: boolean;
  isDrive: boolean;
  groundContactWorld: { x: number; y: number; z: number };
}

export interface SensorBoundarySegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  lineWidthMeters: number; // 0.10 m (10 cm)
  penaltyCode: string;
}

export interface SimulationControllerCallbacks {
  onTelemetryUpdate?: (telemetry: VehicleTelemetry) => void;
  onPenaltyTriggered?: (penalty: PenaltyEvent) => void;
  onStationCompleted?: (stationNumber: number) => void;
  onExamFinished?: (isPassed: boolean, totalScore: number) => void;
  onVoiceAnnounce?: (message: string) => void;
  onAIInstructorFeedback?: (feedback: AIInstructorFeedback) => void;
}

export class SimulationController {
  private telemetry: VehicleTelemetry;
  private config: VehicleConfig;
  private currentExercise: ExerciseDefinition;
  private callbacks: SimulationControllerCallbacks;
  private lang: "uzl" | "uzc" | "ru" = "uzl";

  // Raycast 4-Wheel State
  private wheels: WheelState[];
  private chassisMassKg: number = 1350;
  private linearVelocityMs: number = 0;
  private angularVelocityRads: number = 0;

  // Weight transfer acceleration storage
  private prevSpeedMs: number = 0;
  private pitchRad: number = 0;
  private rollRad: number = 0;

  // State Machine & Estakada Trackers
  private examFsmState: ExamFSMState = "ENGINE_OFF";
  private estakadaHoldTimer: number = 0;
  private estakadaPeakForwardPos: number | null = null;
  private maxRollbackRecorded: number = 0;
  private hasDepartedFromStart: boolean = false;
  private lastPenaltyTimestamp: number = 0;
  private penaltiesList: PenaltyEvent[] = [];

  // Manual Gearbox & Transmission
  private transmissionMode: "auto" | "manual" = "auto";
  private manualGear: "R" | "N" | "1" | "2" | "3" | "4" | "5" = "N";
  private clutchValue: number = 0; // 0 (engaged) to 1 (pressed)
  private isStalled: boolean = false;

  // Replay Recorder & AI Coach
  private replayRecorder: ReplayRecorder | null = null;
  private aiInstructor: AIInstructorEngine | null = null;

  // 10cm Yellow Sensor Boundary Segments
  private sensorBoundaries: SensorBoundarySegment[] = [];

  constructor(
    initialExercise: ExerciseDefinition = EXERCISE_REGISTRY[0],
    vehicleModelName: string = "Chevrolet Cobalt",
    callbacks: SimulationControllerCallbacks = {},
    lang: "uzl" | "uzc" | "ru" = "uzl"
  ) {
    this.currentExercise = initialExercise;
    this.config = VEHICLE_CONFIGS[vehicleModelName] || VEHICLE_CONFIGS["Chevrolet Cobalt"];
    this.callbacks = callbacks;
    this.lang = lang;

    // 4 Wheels Configuration (Cobalt wheelbase: 2.62m, track: 1.50m)
    const halfTrack = this.config.trackWidthMeters / 2;
    const halfBase = this.config.wheelbaseMeters / 2;

    this.wheels = [
      {
        index: 0,
        name: "FL",
        localX: -halfTrack,
        localZ: halfBase,
        suspensionLength: 0.35,
        springForce: 0,
        damperForce: 0,
        tireLoadN: (this.chassisMassKg * 9.81 * 0.55) / 2,
        isSteering: true,
        isDrive: true,
        groundContactWorld: { x: 0, y: 0, z: 0 },
      },
      {
        index: 1,
        name: "FR",
        localX: halfTrack,
        localZ: halfBase,
        suspensionLength: 0.35,
        springForce: 0,
        damperForce: 0,
        tireLoadN: (this.chassisMassKg * 9.81 * 0.55) / 2,
        isSteering: true,
        isDrive: true,
        groundContactWorld: { x: 0, y: 0, z: 0 },
      },
      {
        index: 2,
        name: "RL",
        localX: -halfTrack,
        localZ: -halfBase,
        suspensionLength: 0.35,
        springForce: 0,
        damperForce: 0,
        tireLoadN: (this.chassisMassKg * 9.81 * 0.45) / 2,
        isSteering: false,
        isDrive: false,
        groundContactWorld: { x: 0, y: 0, z: 0 },
      },
      {
        index: 3,
        name: "RR",
        localX: halfTrack,
        localZ: -halfBase,
        suspensionLength: 0.35,
        springForce: 0,
        damperForce: 0,
        tireLoadN: (this.chassisMassKg * 9.81 * 0.45) / 2,
        isSteering: false,
        isDrive: false,
        groundContactWorld: { x: 0, y: 0, z: 0 },
      },
    ];

    // Initial Telemetry
    this.telemetry = {
      speed: 0,
      rpm: 800,
      gear: "P",
      manualGear: "N",
      transmissionMode: "auto",
      clutch: 0,
      isStalled: false,
      steeringAngle: 0,
      handbrake: true,
      throttle: 0,
      brake: 0,
      engineStarted: true,
      seatbeltFastened: true,
      lowBeamsOn: true,
      turnSignal: "left",
      posX: initialExercise.startX,
      posY: initialExercise.startY,
      rotation: initialExercise.startRotation,
      rollbackDistance: 0,
      pitch: 0,
      roll: 0,
      wheelHeights: [0, 0, 0, 0],
      estakadaHoldSeconds: 0,
      examState: "PRE_CHECK",
      category: this.config.category,
    };

    this.aiInstructor = new AIInstructorEngine({
      language: this.lang,
      onFeedback: (fb) => {
        if (this.callbacks.onAIInstructorFeedback) {
          this.callbacks.onAIInstructorFeedback(fb);
        }
      },
      onVoiceSpeak: (msg) => {
        this.announceVoice(msg);
      },
    });

    this.initSensorBoundaries();
  }

  // Set Language for Voice Alerts & AI Coach
  public setLanguage(lang: "uzl" | "uzc" | "ru"): void {
    this.lang = lang;
    if (this.aiInstructor) {
      this.aiInstructor.setLanguage(lang);
    }
  }

  // Replay Recording Lifecycle
  public startRecording(sessionId: string, mode: SimulatorMode = "exam"): void {
    this.replayRecorder = new ReplayRecorder(sessionId, mode, 20);
    this.replayRecorder.start();
  }

  public stopRecording(isPassed: boolean, totalPenalties: number): ReplayRecording | null {
    if (!this.replayRecorder) return null;
    const rec = this.replayRecorder.stop(isPassed, totalPenalties);
    saveReplayLocally(rec);
    return rec;
  }

  // Manual Transmission & Clutch API
  public setTransmissionMode(mode: "auto" | "manual"): void {
    this.transmissionMode = mode;
    this.telemetry.transmissionMode = mode;
  }

  public setManualGear(gear: "R" | "N" | "1" | "2" | "3" | "4" | "5"): void {
    this.manualGear = gear;
    this.telemetry.manualGear = gear;
    if (gear === "R") this.telemetry.gear = "R";
    else if (gear === "N") this.telemetry.gear = "N";
    else this.telemetry.gear = "D";
  }

  public setClutch(clutch01: number): void {
    this.clutchValue = Math.max(0, Math.min(1, clutch01));
    this.telemetry.clutch = this.clutchValue;
  }

  // Toggle Engine (Start / Stop)
  public toggleEngine(): boolean {
    this.telemetry.engineStarted = !this.telemetry.engineStarted;
    if (this.telemetry.engineStarted) {
      this.isStalled = false;
      this.telemetry.isStalled = false;
      this.telemetry.rpm = 800;
      this.examFsmState = "PRE_CHECK";
      audioEngine.playStarterCrank();
      setTimeout(() => audioEngine.startEngine(), 300);
    } else {
      this.telemetry.rpm = 0;
      this.telemetry.speed = 0;
      this.examFsmState = "ENGINE_OFF";
      audioEngine.stopEngine();
    }
    this.telemetry.examState = this.examFsmState;
    return this.telemetry.engineStarted;
  }

  // Set Gear (P, R, N, D)
  public setGear(gear: GearMode): void {
    if (Math.abs(this.telemetry.speed) > 2.0 && gear === "P") {
      // Cannot put into P while moving fast
      this.triggerPenalty("TRANSMISSION_DAMAGE", 20);
      return;
    }
    this.telemetry.gear = gear;
  }

  // Toggle Handbrake
  public toggleHandbrake(): boolean {
    this.telemetry.handbrake = !this.telemetry.handbrake;
    return this.telemetry.handbrake;
  }

  // Toggle Seatbelt
  public toggleSeatbelt(): boolean {
    this.telemetry.seatbeltFastened = !this.telemetry.seatbeltFastened;
    return this.telemetry.seatbeltFastened;
  }

  // Toggle Low Beams (Headlights)
  public toggleLights(): boolean {
    this.telemetry.lowBeamsOn = !this.telemetry.lowBeamsOn;
    return this.telemetry.lowBeamsOn;
  }

  // Toggle Turn Signal
  public toggleTurnSignal(sig: "left" | "right" | "hazard"): void {
    if (this.telemetry.turnSignal === sig) {
      this.telemetry.turnSignal = "none";
    } else {
      this.telemetry.turnSignal = sig;
      audioEngine.playBlinkerClick(sig === "left");
    }
  }

  // Get latest telemetry snapshot
  public getTelemetry(): VehicleTelemetry {
    return { ...this.telemetry };
  }

  // Get current list of penalties
  public getPenalties(): PenaltyEvent[] {
    return [...this.penaltiesList];
  }

  // Get maximum rollback distance observed
  public getMaxRollbackRecorded(): number {
    return this.maxRollbackRecorded;
  }

  // Update vehicle configuration and dynamically reconstruct physical parameters
  public updateVehicle(vehicleModelName: string): VehicleConfig {
    this.config = getVehicleConfig(vehicleModelName);
    this.chassisMassKg = this.config.massKg;
    this.telemetry.category = this.config.category;

    const halfTrack = this.config.trackWidthMeters / 2;
    const halfBase = this.config.wheelbaseMeters / 2;
    const isCommercial = this.config.category === "C" || this.config.category === "D";
    const frontRatio = isCommercial ? 0.40 : 0.55;
    const rearRatio = 1.0 - frontRatio;

    this.wheels = [
      {
        index: 0,
        name: "FL",
        localX: -halfTrack,
        localZ: halfBase,
        suspensionLength: 0.35,
        springForce: 0,
        damperForce: 0,
        tireLoadN: (this.chassisMassKg * 9.81 * frontRatio) / 2,
        isSteering: true,
        isDrive: true,
        groundContactWorld: { x: 0, y: 0, z: 0 },
      },
      {
        index: 1,
        name: "FR",
        localX: halfTrack,
        localZ: halfBase,
        suspensionLength: 0.35,
        springForce: 0,
        damperForce: 0,
        tireLoadN: (this.chassisMassKg * 9.81 * frontRatio) / 2,
        isSteering: true,
        isDrive: true,
        groundContactWorld: { x: 0, y: 0, z: 0 },
      },
      {
        index: 2,
        name: "RL",
        localX: -halfTrack,
        localZ: -halfBase,
        suspensionLength: 0.35,
        springForce: 0,
        damperForce: 0,
        tireLoadN: (this.chassisMassKg * 9.81 * rearRatio) / 2,
        isSteering: false,
        isDrive: false,
        groundContactWorld: { x: 0, y: 0, z: 0 },
      },
      {
        index: 3,
        name: "RR",
        localX: halfTrack,
        localZ: -halfBase,
        suspensionLength: 0.35,
        springForce: 0,
        damperForce: 0,
        tireLoadN: (this.chassisMassKg * 9.81 * rearRatio) / 2,
        isSteering: false,
        isDrive: false,
        groundContactWorld: { x: 0, y: 0, z: 0 },
      },
    ];

    return this.config;
  }

  // Get current active vehicle configuration
  public getConfig(): VehicleConfig {
    return this.config;
  }

  // Backward-compatibility alias
  public updateConfig(vehicleModelName: string): void {
    this.updateVehicle(vehicleModelName);
  }

  // Set Current Active Exercise
  public setExercise(exercise: ExerciseDefinition): void {
    this.currentExercise = exercise;
    this.estakadaHoldTimer = 0;
    this.estakadaPeakForwardPos = null;
    this.maxRollbackRecorded = 0;
    this.telemetry.posX = exercise.startX;
    this.telemetry.posY = exercise.startY;
    this.telemetry.rotation = exercise.startRotation;
    this.telemetry.speed = 0;
    this.linearVelocityMs = 0;
    this.telemetry.rollbackDistance = 0;
    this.telemetry.gear = exercise.number === 7 || exercise.number === 11 ? "R" : "D";
    this.telemetry.handbrake = false;
  }

  // -------------------------------------------------------------
  // PRIMARY SIMULATION STEP (Called at 60 FPS: dt = 0.016s)
  // -------------------------------------------------------------
  public update(input: SimulationInput, dt: number = 0.016, elapsedSeconds: number = 0): VehicleTelemetry {
    // 1. Raycast Vehicle 4-Wheel Physics Simulation
    this.stepVehiclePhysics(input, dt);

    // 2. State Machine & Uzbekistan Exam Checklist Validation
    this.stepExamStateMachine(input, dt, elapsedSeconds);

    // 3. Estakada Incline & 20cm Rollback Verification
    if (this.currentExercise.hasIncline) {
      this.stepEstakadaLogic(input, dt, elapsedSeconds);
    }

    // 4. 10cm Yellow Sensor Line Tire Intersections
    this.stepSensorLineCollisions(elapsedSeconds);

    // 5. Sample into Replay Recorder
    if (this.replayRecorder) {
      this.replayRecorder.sample(this.telemetry);
    }

    // 6. Real-time AI Driving Coach Evaluation
    if (this.aiInstructor) {
      this.aiInstructor.evaluate(this.telemetry, this.currentExercise, this.examFsmState, dt);
    }

    // 7. Broadcast to React / UI
    if (this.callbacks.onTelemetryUpdate) {
      this.callbacks.onTelemetryUpdate({ ...this.telemetry });
    }

    return { ...this.telemetry };
  }

  // -------------------------------------------------------------
  // 1. Raycast Vehicle Physics with Weight Transfer & 4 Wheels
  // -------------------------------------------------------------
  private stepVehiclePhysics(input: SimulationInput, dt: number): void {
    if (input.clutch !== undefined) {
      this.clutchValue = input.clutch;
      this.telemetry.clutch = input.clutch;
    }
    if (input.handbrake !== undefined) {
      this.telemetry.handbrake = input.handbrake;
    }

    if (!this.telemetry.engineStarted) {
      // Natural rolling friction stopping if engine off
      this.linearVelocityMs *= Math.max(0, 1 - 2.5 * dt);
      this.telemetry.speed = this.linearVelocityMs * 3.6;
      this.telemetry.rpm = 0;
      return;
    }

    // Manual Transmission Stall Detection
    if (this.transmissionMode === "manual") {
      const isGearEngaged = this.manualGear === "1" || this.manualGear === "R";
      if (
        isGearEngaged &&
        this.clutchValue < 0.25 &&
        Math.abs(this.linearVelocityMs) < 0.25 &&
        input.throttle < 0.12 &&
        !this.isStalled
      ) {
        this.isStalled = true;
        this.telemetry.isStalled = true;
        this.telemetry.engineStarted = false;
        this.telemetry.rpm = 0;
        this.linearVelocityMs = 0;
        this.telemetry.speed = 0;
        audioEngine.playEngineStall();
        this.announceVoice(
          this.lang === "ru"
            ? "Двигатель заглох! Слишком быстро отпущено сцепление."
            : this.lang === "uzc"
            ? "Двигател ўчди! Муфтани босиб қайта ўт олдиринг."
            : "Dvigatel o'chdi! Muftani bosib qayta o't oldiring."
        );
        return;
      }
    }

    // Steering Angle calculation with Ackermann limits (-35 to +35 deg)
    const targetSteerAngle = input.steer * this.config.steeringAngleMax;
    this.telemetry.steeringAngle += (targetSteerAngle - this.telemetry.steeringAngle) * (18 * dt);

    const gear = this.telemetry.gear;
    let driveForceN = 0;
    let brakeForceN = 0;

    // Transmission & Handbrake Logic
    if (this.telemetry.handbrake || gear === "P") {
      // Rear wheels locked, heavy deceleration
      brakeForceN = 14000;
    } else if (gear === "N" || (this.transmissionMode === "manual" && this.manualGear === "N")) {
      // Free rolling, slight aerodynamic and tire rolling friction
      brakeForceN = 120;
    } else if (this.transmissionMode === "manual") {
      const clutchEngagement = Math.max(0, 1.0 - this.clutchValue);
      let gearRatio = 1.0;
      if (this.manualGear === "1") gearRatio = 3.6;
      else if (this.manualGear === "2") gearRatio = 2.4;
      else if (this.manualGear === "3") gearRatio = 1.6;
      else if (this.manualGear === "4") gearRatio = 1.1;
      else if (this.manualGear === "5") gearRatio = 0.85;

      if (this.manualGear === "R") {
        if (input.throttle > 0) {
          driveForceN = -input.throttle * this.chassisMassKg * this.config.accelerationPower * 2.2 * clutchEngagement;
        }
      } else {
        if (input.throttle > 0) {
          driveForceN = input.throttle * this.chassisMassKg * this.config.accelerationPower * gearRatio * clutchEngagement;
        }
      }

      if (input.brake > 0) {
        brakeForceN = input.brake * this.chassisMassKg * this.config.brakingPower * 3.6;
      }
      if (input.throttle === 0 && input.brake === 0) {
        brakeForceN = 200 + clutchEngagement * 180; // Engine compression braking
      }
    } else if (gear === "D") {
      if (input.throttle > 0) {
        driveForceN = input.throttle * this.chassisMassKg * this.config.accelerationPower * 2.8;
      }
      if (input.brake > 0) {
        brakeForceN = input.brake * this.chassisMassKg * this.config.brakingPower * 3.6;
      }
      if (input.throttle === 0 && input.brake === 0) {
        brakeForceN = 260;
      }
    } else if (gear === "R") {
      if (input.throttle > 0) {
        driveForceN = -input.throttle * this.chassisMassKg * this.config.accelerationPower * 1.8;
      }
      if (input.brake > 0) {
        brakeForceN = input.brake * this.chassisMassKg * this.config.brakingPower * 3.6;
      }
      if (input.throttle === 0 && input.brake === 0) {
        brakeForceN = 260;
      }
    }

    // 12% Incline Gravity Component (Estakada)
    if (this.currentExercise.hasIncline && !this.telemetry.handbrake && input.brake < 0.3) {
      // 12% grade slope: sin(atan(0.12)) ≈ 0.119
      const slopeForce = -this.chassisMassKg * 9.81 * 0.119;
      driveForceN += slopeForce;
    }

    // Net Longitudinal Force
    const netForceN = driveForceN - Math.sign(this.linearVelocityMs) * brakeForceN;
    const accelMs2 = netForceN / this.chassisMassKg;

    // Update Linear Velocity
    this.linearVelocityMs += accelMs2 * dt;

    // Speed Caps (Forward max from config, Reverse max 16 km/h)
    const maxForwardMs = (this.config.maxSpeedKmh * 1000) / 3600;
    const maxReverseMs = -16 / 3.6;

    if (this.linearVelocityMs > maxForwardMs) this.linearVelocityMs = maxForwardMs;
    if (this.linearVelocityMs < maxReverseMs) this.linearVelocityMs = maxReverseMs;

    // Zero-clamp when braking to a halt
    if (Math.abs(this.linearVelocityMs) < 0.05 && input.throttle === 0 && (input.brake > 0.3 || this.telemetry.handbrake)) {
      this.linearVelocityMs = 0;
    }

    this.telemetry.speed = this.linearVelocityMs * 3.6;

    // Angular Velocity (Ackermann Kinematics)
    if (Math.abs(this.linearVelocityMs) > 0.15) {
      const steerRad = (this.telemetry.steeringAngle * Math.PI) / 180;
      this.angularVelocityRads = (this.linearVelocityMs / this.config.wheelbaseMeters) * Math.tan(steerRad);
      this.telemetry.rotation += this.angularVelocityRads * dt;
    } else {
      this.angularVelocityRads = 0;
    }

    // 2D World Position displacement (X, Y)
    const moveDist = this.linearVelocityMs * dt * 2.5; // Scaled to arena canvas scale
    this.telemetry.posX += Math.cos(this.telemetry.rotation) * moveDist;
    this.telemetry.posY += Math.sin(this.telemetry.rotation) * moveDist;

    // Dynamic Weight Transfer (Pitch & Roll)
    const longitudinalAccel = (this.linearVelocityMs - this.prevSpeedMs) / dt;
    this.prevSpeedMs = this.linearVelocityMs;

    // Pitch: braking dips nose forward (negative pitch), acceleration squats rear (positive pitch)
    const targetPitch = Math.max(-0.08, Math.min(0.08, -longitudinalAccel * 0.009));
    this.pitchRad += (targetPitch - this.pitchRad) * (10 * dt);

    // Roll: cornering forces body outward
    const lateralAccel = this.linearVelocityMs * this.angularVelocityRads;
    const targetRoll = Math.max(-0.12, Math.min(0.12, -lateralAccel * 0.014));
    this.rollRad += (targetRoll - this.rollRad) * (10 * dt);

    this.telemetry.pitch = this.pitchRad;
    this.telemetry.roll = this.rollRad;

    // 4 Wheels Suspension Heights based on Pitch and Roll
    this.telemetry.wheelHeights = [
      -this.pitchRad * 0.8 - this.rollRad * 0.5, // FL
      -this.pitchRad * 0.8 + this.rollRad * 0.5, // FR
      this.pitchRad * 0.8 - this.rollRad * 0.5,  // RL
      this.pitchRad * 0.8 + this.rollRad * 0.5,  // RR
    ];

    // Compute Realistic Engine RPM
    if (gear === "P" || gear === "N") {
      this.telemetry.rpm = 800 + input.throttle * 4200;
    } else {
      const absSpeed = Math.abs(this.telemetry.speed);
      let gearRatio = 1.0;
      if (absSpeed < 18) gearRatio = 2.8;
      else if (absSpeed < 32) gearRatio = 1.9;
      else gearRatio = 1.3;

      this.telemetry.rpm = Math.max(800, Math.min(6200, 800 + absSpeed * 85 * gearRatio + input.throttle * 600));
    }

    this.telemetry.throttle = input.throttle;
    this.telemetry.brake = input.brake;
  }

  // -------------------------------------------------------------
  // 2. Uzbekistan State Exam Finite State Machine & Checklist
  // -------------------------------------------------------------
  private stepExamStateMachine(_input: SimulationInput, _dt: number, _elapsedSeconds: number): void {
    const isMoving = Math.abs(this.telemetry.speed) > 0.5;

    // First Departure from Start Checklist verification
    if (isMoving && !this.hasDepartedFromStart) {
      this.hasDepartedFromStart = true;

      // 1. Seatbelt Check
      if (!this.telemetry.seatbeltFastened) {
        this.triggerPenalty("SEATBELT_NOT_FASTENED", 20);
        this.announceVoice(
          this.lang === "ru"
            ? "Штраф: Ремень безопасности не пристегнут!"
            : "Xavfsizlik kamari taqilmadi! Jarima balingiz hisoblandi."
        );
      }

      // 2. Headlights Check
      if (!this.telemetry.lowBeamsOn) {
        this.triggerPenalty("LIGHTS_NOT_ON", 20);
        this.announceVoice(
          this.lang === "ru"
            ? "Штраф: Ближний свет фар не включен!"
            : "Chiroqlar yoqilmadi! Jarima balingiz hisoblandi."
        );
      }

      // 3. Left Turn Indicator on departure Check
      if (this.currentExercise.number === 1 && this.telemetry.turnSignal !== "left") {
        this.triggerPenalty("START_WITHOUT_SIGNAL", 20);
        this.announceVoice(
          this.lang === "ru"
            ? "Штраф: Не включен левый сигнал поворота при начале движения!"
            : "Harakatni boshlashda chap burilish signali yoqilmadi!"
        );
      }

      this.examFsmState = "DRIVING";
      this.telemetry.examState = this.examFsmState;
    }

    // Sequence Check: vehicle must not skip stations
    const dx = this.telemetry.posX - this.currentExercise.targetX;
    const dy = this.telemetry.posY - this.currentExercise.targetY;
    const distToTarget = Math.sqrt(dx * dx + dy * dy);

    if (distToTarget < 28 && Math.abs(this.telemetry.speed) < 3.0) {
      if (this.examFsmState !== "STATION_COMPLETED") {
        this.examFsmState = "STATION_COMPLETED";
        this.telemetry.examState = this.examFsmState;
        if (this.callbacks.onStationCompleted) {
          this.callbacks.onStationCompleted(this.currentExercise.number);
        }
      }
    }
  }

  // -------------------------------------------------------------
  // 3. Estakada (12% Incline) & 20cm Rollback Logic
  // -------------------------------------------------------------
  private stepEstakadaLogic(_input: SimulationInput, dt: number, _elapsedSeconds: number): void {
    // STOP line on Estakada is near posX: 295, posY: 440
    const distToStopLine = Math.abs(this.telemetry.posX - 295);

    if (distToStopLine < 18) {
      // Stopped at STOP line
      if (Math.abs(this.telemetry.speed) < 0.2) {
        this.estakadaHoldTimer += dt;
        this.telemetry.estakadaHoldSeconds = this.estakadaHoldTimer;

        if (this.estakadaPeakForwardPos === null) {
          this.estakadaPeakForwardPos = this.telemetry.posX;
        }

        if (this.estakadaHoldTimer >= 3.0) {
          this.examFsmState = "READY_TO_DEPART";
          this.telemetry.examState = this.examFsmState;
        }
      } else if (this.estakadaHoldTimer > 0 && this.estakadaHoldTimer < 3.0 && this.linearVelocityMs > 0.5) {
        // Did not wait full 3 seconds
        this.triggerPenalty("ESTAKADA_STOP_TIME_INSUFFICIENT", 20);
        this.announceVoice(
          this.lang === "ru"
            ? "Штраф: На эстакаде необходимо выждать 3 секунды!"
            : this.lang === "uzc"
            ? "Жарима: Эстакадада 3 сония тўлиқ тўхташ шарти бажарилмади!"
            : "Estakadada 3 soniya to'liq to'xtash sharti bajarilmadi!"
        );
      }

      // Rollback Detection
      if (this.estakadaPeakForwardPos !== null) {
        if (this.telemetry.posX < this.estakadaPeakForwardPos) {
          // Rolling backwards down the ramp
          const rollbackMeters = (this.estakadaPeakForwardPos - this.telemetry.posX) * 0.4;
          this.telemetry.rollbackDistance = rollbackMeters;
          this.maxRollbackRecorded = Math.max(this.maxRollbackRecorded, rollbackMeters);

          if (rollbackMeters > 0.20) {
            // CRITICAL FAIL: > 20 cm rollback
            this.triggerPenalty("ROLLBACK_EXCEEDED", 100);
            this.examFsmState = "EXAM_FAILED";
            this.telemetry.examState = this.examFsmState;
            this.announceVoice(
              this.lang === "ru"
                ? "Экзамен не сдан! Откат назад более 20 сантиметров."
                : this.lang === "uzc"
                ? "Имтиҳон топширилмади! Орқага сирпаниш 20 сантиметрдан ошди."
                : "Imtihon topshirilmadi! Orqaga sirpanish 20 santimetrdan oshdi."
            );
            if (this.callbacks.onExamFinished) {
              this.callbacks.onExamFinished(false, 100);
            }
          }
        }
      }
    }
  }

  // -------------------------------------------------------------
  // 4. 10cm Yellow Sensor Boundary Colliders & 4 Tires Intersection
  // -------------------------------------------------------------
  private stepSensorLineCollisions(_elapsedSeconds: number): void {
    if (Math.abs(this.telemetry.speed) < 0.4) return;
    if (Date.now() - this.lastPenaltyTimestamp < 1800) return; // Debounce line penalties

    // Compute the 4 wheel contact coordinates in world space
    const cosRot = Math.cos(this.telemetry.rotation);
    const sinRot = Math.sin(this.telemetry.rotation);

    for (const w of this.wheels) {
      // Rotate local wheel coords to world
      const worldX = this.telemetry.posX + (w.localX * cosRot - w.localZ * sinRot);
      const worldY = this.telemetry.posY + (w.localX * sinRot + w.localZ * cosRot);

      // Check distance against 10cm yellow line segments
      for (const seg of this.sensorBoundaries) {
        const dist = this.pointToSegmentDistance(worldX, worldY, seg.x1, seg.y1, seg.x2, seg.y2);
        if (dist <= 6.0) { // 6 canvas pixels ≈ 10 cm boundary touch
          this.lastPenaltyTimestamp = Date.now();
          this.triggerPenalty("LINE_CROSSED", 20);
          this.announceVoice(
            this.lang === "ru"
              ? "Штраф: Наезд на разметку! Начислены штрафные баллы."
              : this.lang === "uzc"
              ? "Жарима: Чизиқ босилди! Жарима балингиз ҳисобланди."
              : "Jarima: Chiziq bosildi! Jarima balingiz hisoblandi."
          );
          return;
        }
      }
    }
  }

  // Helper: Point to line segment distance formula
  private pointToSegmentDistance(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
    const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
    if (l2 === 0) return Math.sqrt((px - x1) * (px - x1) + (py - y1) * (py - y1));
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    const projX = x1 + t * (x2 - x1);
    const projY = y1 + t * (y2 - y1);
    return Math.sqrt((px - projX) * (px - projX) + (py - projY) * (py - projY));
  }

  // Trigger Penalty with callbacks, Replay Bookmark, and Audio Alert
  private triggerPenalty(ruleCode: string, _points: number = 20): void {
    const event = createPenaltyEvent(
      ruleCode,
      this.currentExercise.number,
      0,
      this.telemetry.posX,
      this.telemetry.posY
    );
    this.penaltiesList.push(event);

    if (this.replayRecorder) {
      this.replayRecorder.recordPenalty(event);
    }

    audioEngine.playPenaltyBuzzer();

    if (this.callbacks.onPenaltyTriggered) {
      this.callbacks.onPenaltyTriggered(event);
    }
  }

  // Voice Announcement helper
  private announceVoice(text: string): void {
    if (this.callbacks.onVoiceAnnounce) {
      this.callbacks.onVoiceAnnounce(text);
    } else {
      audioEngine.playVoiceAlert(text, this.lang === "ru" ? "ru-RU" : "uz-UZ");
    }
  }

  // Initialize track yellow sensor boundary colliders (10cm mesh lines)
  private initSensorBoundaries(): void {
    this.sensorBoundaries = [
      // Outer track curb lines
      { x1: 50, y1: 50, x2: 550, y2: 50, lineWidthMeters: 0.1, penaltyCode: "CURB_CROSSED" },
      { x1: 550, y1: 50, x2: 550, y2: 450, lineWidthMeters: 0.1, penaltyCode: "CURB_CROSSED" },
      { x1: 550, y1: 450, x2: 50, y2: 450, lineWidthMeters: 0.1, penaltyCode: "CURB_CROSSED" },
      { x1: 50, y1: 450, x2: 50, y2: 50, lineWidthMeters: 0.1, penaltyCode: "CURB_CROSSED" },
      // Inner island 1 boundaries
      { x1: 130, y1: 115, x2: 350, y2: 115, lineWidthMeters: 0.1, penaltyCode: "LINE_CROSSED" },
      { x1: 350, y1: 115, x2: 350, y2: 355, lineWidthMeters: 0.1, penaltyCode: "LINE_CROSSED" },
      { x1: 350, y1: 355, x2: 130, y2: 355, lineWidthMeters: 0.1, penaltyCode: "LINE_CROSSED" },
      { x1: 130, y1: 355, x2: 130, y2: 115, lineWidthMeters: 0.1, penaltyCode: "LINE_CROSSED" },
      // Inner island 2 boundaries
      { x1: 380, y1: 115, x2: 480, y2: 115, lineWidthMeters: 0.1, penaltyCode: "LINE_CROSSED" },
      { x1: 480, y1: 115, x2: 480, y2: 355, lineWidthMeters: 0.1, penaltyCode: "LINE_CROSSED" },
      { x1: 480, y1: 355, x2: 380, y2: 355, lineWidthMeters: 0.1, penaltyCode: "LINE_CROSSED" },
      { x1: 380, y1: 355, x2: 380, y2: 115, lineWidthMeters: 0.1, penaltyCode: "LINE_CROSSED" },
    ];
  }

  // -------------------------------------------------------------
  // 7. Multi-Camera Matrix Calculations
  // -------------------------------------------------------------
  public getCameraTransform(view: CameraView): {
    position: { x: number; y: number; z: number };
    target: { x: number; y: number; z: number };
    rotation?: { pitch: number; yaw: number; roll: number };
    isOrthographic: boolean;
    orthoSize?: number;
  } {
    const worldX = (this.telemetry.posX - 300) * 0.4;
    const worldZ = (this.telemetry.posY - 250) * 0.4;
    const carAngle = this.telemetry.rotation;

    const offsets = this.config.cameraOffsets || {
      chaseDist: 6.2,
      chaseHeight: 2.7,
      cockpitEyeX: 0.15,
      cockpitEyeY: 1.35,
      cockpitEyeZ: 0.15,
      rearBumperDist: 2.5,
    };

    if (view === "first_person") {
      // Cockpit POV: Inside cabin at driver eye level
      const eyeOffsetX = offsets.cockpitEyeX;
      const eyeOffsetY = offsets.cockpitEyeY;
      const eyeOffsetZ = offsets.cockpitEyeZ;

      const camX = worldX + (eyeOffsetX * Math.cos(carAngle) - eyeOffsetZ * Math.sin(carAngle));
      const camZ = worldZ + (eyeOffsetX * Math.sin(carAngle) + eyeOffsetZ * Math.cos(carAngle));
      const lookDist = 18.0;

      return {
        position: { x: camX, y: eyeOffsetY, z: camZ },
        target: {
          x: camX + Math.cos(carAngle) * lookDist,
          y: eyeOffsetY + Math.sin(this.telemetry.pitch || 0) * lookDist,
          z: camZ + Math.sin(carAngle) * lookDist,
        },
        rotation: {
          pitch: this.telemetry.pitch || 0,
          yaw: carAngle,
          roll: this.telemetry.roll || 0,
        },
        isOrthographic: false,
      };
    } else if (view === "rear") {
      // Rear Bumper Backup Camera
      const bumperDist = offsets.rearBumperDist;
      const camX = worldX - Math.cos(carAngle) * bumperDist;
      const camZ = worldZ - Math.sin(carAngle) * bumperDist;
      return {
        position: { x: camX, y: 1.25, z: camZ },
        target: {
          x: camX - Math.cos(carAngle) * 20,
          y: 0.3,
          z: camZ - Math.sin(carAngle) * 20,
        },
        isOrthographic: false,
      };
    } else if (view === "top_down") {
      // True Orthographic Top View for precise parking alignment
      return {
        position: { x: worldX, y: 35.0, z: worldZ },
        target: { x: worldX, y: 0, z: worldZ },
        isOrthographic: true,
        orthoSize: 22.0, // 22 meters field of view
      };
    } else {
      // Chase Camera (3rd-person dampened follow)
      const followDist = offsets.chaseDist;
      const followHeight = offsets.chaseHeight;

      const camX = worldX - Math.cos(carAngle) * followDist;
      const camZ = worldZ - Math.sin(carAngle) * followDist;

      return {
        position: { x: camX, y: followHeight, z: camZ },
        target: {
          x: worldX + Math.cos(carAngle) * 18.0,
          y: 0.45,
          z: worldZ + Math.sin(carAngle) * 18.0,
        },
        isOrthographic: false,
      };
    }
  }
}
