export type SimulatorMode = "training" | "practice" | "exam";

export type SimulatorSessionStatus =
  | "CREATED"
  | "READY"
  | "RUNNING"
  | "PAUSED"
  | "COMPLETED"
  | "FAILED"
  | "ABORTED";

export type GearMode = "P" | "R" | "N" | "D";

export type CameraView = "first_person" | "chase" | "top_down" | "free" | "rear";

export type VehicleCategory = "B" | "C" | "D";

export type PenaltySeverity = "MINOR" | "MEDIUM" | "MAJOR" | "CRITICAL";

export interface LocalizedString {
  uzl: string;
  uzc: string;
  ru: string;
}

export interface ExerciseZone {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface ExerciseDefinition {
  number: number;
  code: string;
  title: LocalizedString;
  description: LocalizedString;
  instructorGuide: LocalizedString;
  timeLimitSeconds: number;
  maxSpeedKmh: number;
  maxPenaltyAllowed: number;
  startX: number;
  startY: number;
  startRotation: number;
  targetX: number;
  targetY: number;
  sensorZone: ExerciseZone;
  helperPath?: Array<{ x: number; y: number }>;
  cones?: Array<{ x: number; y: number; radius: number }>;
  stopLines?: Array<{ x1: number; y1: number; x2: number; y2: number }>;
  hasIncline?: boolean; // For Estakada
  hasTrafficLight?: boolean; // For Intersection
  hasBarrier?: boolean; // For Railway crossing
}

export interface PenaltyRule {
  code: string;
  title: LocalizedString;
  points: number;
  severity: PenaltySeverity;
  isInstantFail: boolean;
  explanation: LocalizedString;
}

export interface VehicleCameraOffsets {
  chaseDist: number;
  chaseHeight: number;
  cockpitEyeX: number;
  cockpitEyeY: number;
  cockpitEyeZ: number;
  rearBumperDist: number;
}

export interface VehicleConfig {
  id?: string;
  modelName: string;
  category: VehicleCategory;
  massKg: number;
  maxSpeedKmh: number;
  accelerationPower: number;
  brakingPower: number;
  steeringAngleMax: number; // degrees
  steeringRatio?: number;
  wheelbaseMeters: number;
  trackWidthMeters: number;
  lengthMeters: number;
  widthMeters: number;
  heightMeters: number;
  groundClearanceMeters?: number;
  color: string;
  secondaryColor?: string;
  bodyType?: "sedan" | "suv" | "truck" | "bus";
  engineType?: "gasoline" | "turbo" | "diesel";
  transmissionType?: "manual" | "auto";
  hasDualRearWheels?: boolean;
  gearRatios?: number[];
  reverseRatio?: number;
  differentialRatio?: number;
  cameraOffsets?: VehicleCameraOffsets;
}

export type ExamFSMState =
  | "ENGINE_OFF"
  | "PRE_CHECK"
  | "READY_TO_DEPART"
  | "DRIVING"
  | "ESTAKADA_HOLD"
  | "STATION_COMPLETED"
  | "EXAM_PASSED"
  | "EXAM_FAILED";

export interface VehicleTelemetry {
  speed: number; // km/h
  rpm: number;
  gear: GearMode;
  steeringAngle: number; // -35 to +35 deg
  handbrake: boolean;
  throttle: number; // 0 to 1
  brake: number; // 0 to 1
  engineStarted?: boolean;
  seatbeltFastened: boolean;
  lowBeamsOn: boolean;
  turnSignal: "left" | "right" | "none" | "hazard";
  posX: number;
  posY: number;
  rotation: number; // radians
  rollbackDistance: number; // in meters, for estakada
  pitch?: number; // radians, weight transfer longitudinal
  roll?: number; // radians, lateral body roll
  wheelHeights?: [number, number, number, number]; // FL, FR, RL, RR compression offsets
  estakadaHoldSeconds?: number;
  examState?: ExamFSMState;
  clutch?: number; // 0 (fully engaged) to 1 (fully pressed)
  isStalled?: boolean;
  transmissionMode?: "auto" | "manual";
  manualGear?: "R" | "N" | "1" | "2" | "3" | "4" | "5";
  category?: VehicleCategory;
  mirrorsActive?: boolean;
}

export interface TelemetryFrame {
  timestampMs: number;
  posX: number;
  posY: number;
  rotation: number;
  speed: number;
  rpm: number;
  gear: GearMode;
  manualGear?: "R" | "N" | "1" | "2" | "3" | "4" | "5";
  steeringAngle: number;
  throttle: number;
  brake: number;
  clutch?: number;
  handbrake: boolean;
  pitch?: number;
  roll?: number;
  event?: string;
  penaltyId?: string;
}

export interface ReplayRecording {
  sessionId: string;
  mode: SimulatorMode;
  date: string;
  durationSeconds: number;
  isPassed: boolean;
  totalPenalties: number;
  frames: TelemetryFrame[];
  penalties: PenaltyEvent[];
}

export interface AIInstructorFeedback {
  id: string;
  timestamp: number;
  severity: "info" | "warning" | "danger" | "success";
  category: "steering" | "speed" | "positioning" | "clutch" | "checklist" | "hazard";
  message: LocalizedString;
  spokenText?: string;
}

export interface PenaltyEvent {
  id: string;
  exerciseNumber: number;
  ruleCode: string;
  points: number;
  title: LocalizedString;
  explanation: LocalizedString;
  occurredAtSeconds: number;
  posX: number;
  posY: number;
}

export interface ExerciseAttemptResult {
  exerciseNumber: number;
  isPassed: boolean;
  penaltyPoints: number;
  timeSpentSeconds: number;
  penalties: PenaltyEvent[];
}

export interface SimulatorSessionData {
  sessionId: string;
  mode: SimulatorMode;
  status: SimulatorSessionStatus;
  currentExerciseNumber: number;
  totalPenaltyPoints: number;
  isPassed: boolean;
  timeSpentSeconds: number;
  startedAt: string;
  finishedAt?: string;
  vehicleModel: string;
  exerciseResults: Record<number, ExerciseAttemptResult>;
  penalties: PenaltyEvent[];
  replayRecording?: ReplayRecording;
}

export interface UserSimulatorStats {
  totalSessions: number;
  passedSessions: number;
  failedSessions: number;
  passRate: number;
  averageScore: number;
  bestScore: number;
  averageTimeSeconds: number;
  weakExercises: Array<{
    exerciseNumber: number;
    exerciseCode: string;
    title: LocalizedString;
    failCount: number;
  }>;
}

