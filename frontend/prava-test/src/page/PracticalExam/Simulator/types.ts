export type SimulatorMode = "training" | "practice" | "exam";

export type GearMode = "P" | "R" | "N" | "D";

export type CameraView = "first_person" | "chase" | "top_down";

export interface ExerciseDefinition {
  number: number;
  code: string;
  title: {
    uzl: string;
    uzc: string;
    ru: string;
  };
  description: {
    uzl: string;
    uzc: string;
    ru: string;
  };
  instructorGuide: {
    uzl: string;
    uzc: string;
    ru: string;
  };
  timeLimitSeconds: number;
  maxPenaltyAllowed: number;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  sensorZone: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  };
}

export interface VehicleTelemetry {
  speed: number; // km/h
  rpm: number;
  gear: GearMode;
  steeringAngle: number; // -35 to +35 deg
  handbrake: boolean;
  throttle: number; // 0 to 1
  brake: number; // 0 to 1
  seatbeltFastened: boolean;
  lowBeamsOn: boolean;
  turnSignal: "left" | "right" | "none" | "hazard";
  posX: number;
  posY: number;
  rotation: number; // in radians
  rollbackDistance: number; // for estakada
}

export interface PenaltyEvent {
  id: string;
  exerciseNumber: number;
  code: string;
  points: number;
  title: {
    uzl: string;
    uzc: string;
    ru: string;
  };
  timestampSeconds: number;
}

export interface SimulatorSession {
  sessionId: string;
  mode: SimulatorMode;
  currentExerciseNumber: number;
  totalPenaltyPoints: number;
  elapsedSeconds: number;
  isStarted: boolean;
  isPaused: boolean;
  isFinished: boolean;
  isPassed: boolean;
  penalties: PenaltyEvent[];
  exerciseResults: Record<number, {
    passed: boolean;
    points: number;
    timeSpent: number;
  }>;
}
