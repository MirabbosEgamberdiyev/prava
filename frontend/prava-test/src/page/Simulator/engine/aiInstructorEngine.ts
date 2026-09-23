/**
 * PRAVAONLINE — Real-Time AI Driving Instructor Engine
 * 
 * Heuristic real-time driving coach that analyzes candidate inputs, vehicle telemetry,
 * and track geometry to provide proactive, constructive feedback in Uzbek (Latin/Cyrillic) and Russian.
 */

import type {
  VehicleTelemetry,
  ExerciseDefinition,
  AIInstructorFeedback,
  ExamFSMState,
} from "../types";

export interface AIInstructorOptions {
  language: "uzl" | "uzc" | "ru";
  onFeedback?: (feedback: AIInstructorFeedback) => void;
  onVoiceSpeak?: (text: string) => void;
}

export class AIInstructorEngine {
  private lang: "uzl" | "uzc" | "ru" = "uzl";
  private onFeedback?: (feedback: AIInstructorFeedback) => void;
  private onVoiceSpeak?: (text: string) => void;

  private lastFeedbackTimestamp: number = -100000;
  private minIntervalBetweenTipsMs: number = 4500; // Debounce tips to avoid audio spam
  private lastSteerAngle: number = 0;
  private prevSpeed: number = 0;

  constructor(options: AIInstructorOptions) {
    this.lang = options.language;
    this.onFeedback = options.onFeedback;
    this.onVoiceSpeak = options.onVoiceSpeak;
  }

  public setLanguage(lang: "uzl" | "uzc" | "ru"): void {
    this.lang = lang;
  }

  /**
   * Evaluates current telemetry and exercise context every tick
   */
  public evaluate(
    telemetry: VehicleTelemetry,
    exercise: ExerciseDefinition,
    fsmState: ExamFSMState,
    _dt: number
  ): void {
    const now = performance.now();
    if (now - this.lastFeedbackTimestamp < this.minIntervalBetweenTipsMs) {
      this.lastSteerAngle = telemetry.steeringAngle;
      this.prevSpeed = telemetry.speed;
      return;
    }

    // 1. Pre-Drive Checklist Coaching
    if (fsmState === "ENGINE_OFF" && !telemetry.engineStarted) {
      this.emit({
        id: "IGNITION_HINT",
        timestamp: now,
        severity: "info",
        category: "checklist",
        message: {
          uzl: "Mashqni boshlash uchun avval dvigatelni o't oldiring ('I' tugmasi)",
          uzc: "Машқни бошлаш учун аввал двигателни ўт олдиринг ('I' тугмаси)",
          ru: "Для начала движения заведите двигатель (клавиша 'I')",
        },
      });
      return;
    }

    if (fsmState === "PRE_CHECK") {
      if (!telemetry.seatbeltFastened) {
        this.emit({
          id: "SEATBELT_HINT",
          timestamp: now,
          severity: "warning",
          category: "checklist",
          message: {
            uzl: "Xavfsizlik kamarini taqing ('B' tugmasi)",
            uzc: "Хавфсизлик камарини тақинг ('B' тугмаси)",
            ru: "Пристегните ремень безопасности (клавиша 'B')",
          },
        });
        return;
      }
      if (!telemetry.lowBeamsOn) {
        this.emit({
          id: "LIGHTS_HINT",
          timestamp: now,
          severity: "warning",
          category: "checklist",
          message: {
            uzl: "Yaqinni yorituvchi chiroqlarni yoqing ('L' tugmasi)",
            uzc: "Яқинни ёритувчи чироқларни ёқинг ('L' тугмаси)",
            ru: "Включите ближний свет фар (клавиша 'L')",
          },
        });
        return;
      }
      if (telemetry.turnSignal !== "left") {
        this.emit({
          id: "SIGNAL_HINT",
          timestamp: now,
          severity: "warning",
          category: "checklist",
          message: {
            uzl: "Harakatni boshlashdan oldin chap burilish signalini yoqing ('Q' tugmasi)",
            uzc: "Ҳаракатни бошлашдан олдин чап бурилиш сигналини ёқинг ('Q' тугмаси)",
            ru: "Перед началом движения включите левый указатель поворота ('Q')",
          },
        });
        return;
      }
    }

    // 2. Speed Monitoring inside Station
    if (telemetry.speed > exercise.maxSpeedKmh) {
      this.emit({
        id: "OVERSPEED_HINT",
        timestamp: now,
        severity: "danger",
        category: "speed",
        message: {
          uzl: `Tezlikni pasaytiring! Ushbu mashqda ruxsat etilgan tezlik: ${exercise.maxSpeedKmh} km/soat`,
          uzc: `Тезликни пасайтиринг! Ушбу машқда рухсат этилган тезлик: ${exercise.maxSpeedKmh} км/соат`,
          ru: `Снизьте скорость! Максимум для этого упражнения: ${exercise.maxSpeedKmh} км/ч`,
        },
      });
      return;
    }

    // 3. Erratic Steering Jerk Analysis
    const steerDelta = Math.abs(telemetry.steeringAngle - this.lastSteerAngle);
    if (steerDelta > 28 && telemetry.speed > 10) {
      this.emit({
        id: "SMOOTH_STEER_HINT",
        timestamp: now,
        severity: "warning",
        category: "steering",
        message: {
          uzl: "Rulni keskin burmang, silliq harakatlaning",
          uzc: "Рулни кескин бурманг, силлиқ ҳаракатланинг",
          ru: "Избегайте резких рывков руля, управляйте плавно",
        },
      });
      return;
    }

    // Harsh Braking Detection
    const speedDrop = this.prevSpeed - telemetry.speed;
    if (speedDrop > 16 && telemetry.brake > 0.7) {
      this.emit({
        id: "HARSH_BRAKE_HINT",
        timestamp: now,
        severity: "warning",
        category: "speed",
        message: {
          uzl: "Keskin tormoz bermang, sekinroq to'xtang",
          uzc: "Кескин тормоз берманг, секинроқ тўхтанг",
          ru: "Избегайте резкого торможения, тормозите плавнее",
        },
      });
      return;
    }

    // 4. Estakada Stop Zone Coaching
    if (exercise.hasIncline && telemetry.speed > 0.5 && telemetry.speed < 8) {
      this.emit({
        id: "ESTAKADA_STOP_HINT",
        timestamp: now,
        severity: "info",
        category: "positioning",
        message: {
          uzl: "STOP chizig'ida to'liq to'xtang va 3 soniya ushlab turing",
          uzc: "STOP чизиғида тўлиқ тўхтанг ва 3 сония ушлаб туринг",
          ru: "Остановитесь у линии СТОП и задержитесь на 3 секунды",
        },
      });
      return;
    }

    // 5. Manual Clutch Stall Warning
    if (telemetry.transmissionMode === "manual" && telemetry.isStalled) {
      this.emit({
        id: "STALL_RECOVERY_HINT",
        timestamp: now,
        severity: "danger",
        category: "clutch",
        message: {
          uzl: "Dvigatel o'chdi! Muftani (clutch) bosing, neytralga o'tkazing va qayta o't oldiring",
          uzc: "Двигател ўчди! Муфтани (clutch) босинг, нейтралга ўтказинг ва қайта ўт олдиринг",
          ru: "Двигатель заглох! Выжмите сцепление, перейдите в нейтраль и заведите",
        },
      });
      return;
    }

    this.lastSteerAngle = telemetry.steeringAngle;
    this.prevSpeed = telemetry.speed;
  }

  private emit(feedback: AIInstructorFeedback): void {
    this.lastFeedbackTimestamp = performance.now();

    const spokenText =
      this.lang === "ru"
        ? feedback.message.ru
        : this.lang === "uzc"
        ? feedback.message.uzc
        : feedback.message.uzl;

    feedback.spokenText = spokenText;

    if (this.onFeedback) {
      this.onFeedback(feedback);
    }

    if (this.onVoiceSpeak) {
      this.onVoiceSpeak(spokenText);
    }
  }
}
