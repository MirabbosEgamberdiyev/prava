import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useProgress } from "@react-three/drei";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import * as THREE from "three";
import {
  IconArrowLeft,
  IconRefresh,
  IconCamera,
  IconKeyboard,
  IconDeviceMobile,
  IconPlayerPlay,
  IconFileText,
} from "@tabler/icons-react";
import { QRCodeSVG } from "qrcode.react";
import SimScene, { type SimRuntime } from "./SimScene";
import { type OBB, initialState } from "./carPhysics";
import { detectGpu, canvasSettings } from "./quality";
import "./simulator.css";

/**
 * Kadr tezligini kuzatadi. Agar sahna sekundiga bir necha martadan kam
 * yangilansa (kuchsiz videokarta), simulyatorni to'xtatamiz.
 */
function FpsGuard({ onTooSlow }: { onTooSlow: () => void }) {
  const frames = useRef(0);
  const since = useRef(0);
  const fired = useRef(false);

  useFrame((state) => {
    if (fired.current) return;
    const now = state.clock.elapsedTime;
    if (!since.current) {
      since.current = now;
      return;
    }
    frames.current++;
    const dt = now - since.current;
    if (dt >= 6) {
      const fps = frames.current / dt;
      if (fps < 6) {
        fired.current = true;
        onTooSlow();
      }
      frames.current = 0;
      since.current = now;
    }
  });
  return null;
}

let webglOk: boolean | null = null;
function webglSupported() {
  if (webglOk !== null) return webglOk;
  try {
    const c = document.createElement("canvas");
    const gl = (c.getContext("webgl2") || c.getContext("webgl")) as WebGLRenderingContext | null;
    webglOk = !!gl && !gl.isContextLost();
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    webglOk = false;
  }
  return webglOk;
}

interface Props {
  onBack: () => void;
}

interface Telemetry {
  kmh: number;
  gear: "D" | "R";
  steer: number;
  signal: SimRuntime["signal"];
  collisions: number;
  braking: boolean;
}

const SOUND = (n: string) => `/simulator/sounds/${n}.mp3`;

function LoadingOverlay() {
  const { progress, active } = useProgress();
  const { t } = useTranslation();
  if (!active && progress >= 100) return null;
  return (
    <div className="sim-loading">
      <div className="sim-loading-title">{t("sim.loading", { defaultValue: "Avtodrom yuklanmoqda..." })}</div>
      <div className="sim-loading-bar">
        <div style={{ width: `${Math.round(progress)}%` }} />
      </div>
      <div className="sim-loading-pct">{Math.round(progress)}%</div>
    </div>
  );
}

export default function SimulatorScreen({ onBack }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Mobile vs Web detection
  const [isMobileScreen, setIsMobileScreen] = useState(() => {
    if (typeof window === "undefined") return false;
    return (
      window.innerWidth <= 768 ||
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0
    );
  });
  const [forceWebPreview, setForceWebPreview] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobileScreen(
        window.innerWidth <= 768 ||
        "ontouchstart" in window ||
        navigator.maxTouchPoints > 0
      );
    };
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const rt = useRef<SimRuntime>({
    car: initialState(),
    input: { gas: false, brake: false, left: false, right: false },
    signal: "",
    camera: "chase",
    orbit: { yaw: 0, pitch: 0 },
    resetRequested: false,
    inCollision: false,
  });

  const [world, setWorld] = useState<{ curbs: OBB[]; estacada: THREE.Object3D[] }>({
    curbs: [],
    estacada: [],
  });
  const [started, setStarted] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [forceOpen, setForceOpen] = useState(false);
  const [tooSlow, setTooSlow] = useState(false);
  const [camMode, setCamMode] = useState<SimRuntime["camera"]>("chase");
  const [tele, setTele] = useState<Telemetry>({
    kmh: 0,
    gear: "D",
    steer: 0,
    signal: "",
    collisions: 0,
    braking: false,
  });
  const collisionsRef = useRef(0);
  const [gearHint, setGearHint] = useState(false);

  // Touch pedals visual feedback state
  const [touchGas, setTouchGas] = useState(false);
  const [touchBrake, setTouchBrake] = useState(false);
  const [touchLeft, setTouchLeft] = useState(false);
  const [touchRight, setTouchRight] = useState(false);

  // Audio elements
  const audio = useRef<{
    engine?: HTMLAudioElement;
    brake?: HTMLAudioElement;
    crash?: HTMLAudioElement;
    blinker?: HTMLAudioElement;
  }>({});

  const onWorldReady = useCallback((curbs: OBB[], estacada: THREE.Object3D[]) => {
    setWorld({ curbs, estacada });
  }, []);

  // Collision sound & counter
  useEffect(() => {
    rt.current.onCollision = () => {
      collisionsRef.current += 1;
      const c = audio.current.crash;
      if (c) {
        c.currentTime = 0;
        c.play().catch(() => {});
      }
    };
  }, []);

  const reset = useCallback(() => {
    rt.current.car = initialState();
    rt.current.signal = "";
    rt.current.inCollision = false;
  }, []);

  const toggleGear = useCallback(() => {
    const s = rt.current.car;
    if (Math.abs(s.speed) > 0.3) {
      setGearHint(true);
      setTimeout(() => setGearHint(false), 1600);
      return;
    }
    s.gear = s.gear === "D" ? "R" : "D";
  }, []);

  const toggleSignal = useCallback((w: "left" | "right" | "both") => {
    rt.current.signal = rt.current.signal === w ? "" : w;
  }, []);

  const cycleCamera = useCallback(() => {
    const order: SimRuntime["camera"][] = ["chase", "cockpit", "top"];
    const next = order[(order.indexOf(rt.current.camera) + 1) % order.length];
    rt.current.orbit.yaw = 0;
    rt.current.orbit.pitch = 0;
    rt.current.camera = next;
    setCamMode(next);
  }, []);

  // Keyboard controls
  useEffect(() => {
    if (!started) return;
    const inp = rt.current.input;
    const set = (code: string, v: boolean) => {
      switch (code) {
        case "KeyW":
        case "ArrowUp":
          inp.gas = v;
          return true;
        case "KeyS":
        case "ArrowDown":
        case "Space":
          inp.brake = v;
          return true;
        case "KeyA":
        case "ArrowLeft":
          inp.left = v;
          return true;
        case "KeyD":
        case "ArrowRight":
          inp.right = v;
          return true;
      }
      return false;
    };
    const down = (e: KeyboardEvent) => {
      if (set(e.code, true)) e.preventDefault();
      if (e.repeat) return;
      if (e.code === "KeyF") toggleGear();
      if (e.code === "KeyJ") toggleSignal("left");
      if (e.code === "KeyL") toggleSignal("right");
      if (e.code === "KeyK") toggleSignal("both");
      if (e.code === "KeyR") reset();
      if (e.code === "KeyC") cycleCamera();
      if (e.code === "Escape") onBack();
    };
    const up = (e: KeyboardEvent) => {
      if (set(e.code, false)) e.preventDefault();
    };
    const blur = () => {
      inp.gas = inp.brake = inp.left = inp.right = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, [started, toggleGear, toggleSignal, reset, cycleCamera, onBack]);

  // Telemetry and audio loop (15 fps)
  useEffect(() => {
    if (!started) return;
    let lastBlink = false;
    let blinkT = 0;
    const id = setInterval(() => {
      const r = rt.current;
      const kmh = Math.abs(r.car.speed) * 3.6;
      setTele({
        kmh,
        gear: r.car.gear,
        steer: r.car.steer,
        signal: r.signal,
        collisions: collisionsRef.current,
        braking: r.input.brake,
      });
      const a = audio.current;
      if (a.engine) {
        const load = r.input.gas ? 1 : 0;
        a.engine.playbackRate = Math.min(2.2, 0.8 + kmh / 40 + load * 0.25);
        a.engine.volume = Math.min(1, 0.25 + load * 0.25 + kmh / 120);
      }
      if (a.brake) {
        a.brake.volume = r.input.brake && kmh > 8 ? Math.min(0.6, kmh / 60) : 0;
      }
      blinkT += 1 / 15;
      const on = r.signal !== "" && Math.floor(blinkT * 3) % 2 === 0;
      if (on && !lastBlink && a.blinker) {
        a.blinker.currentTime = 0;
        a.blinker.play().catch(() => {});
      }
      lastBlink = on;
    }, 1000 / 15);
    return () => clearInterval(id);
  }, [started]);

  // Clean audio on unmount
  useEffect(() => () => {
    for (const a of Object.values(audio.current)) {
      a?.pause();
    }
  }, []);

  const start = () => {
    const mk = (n: string, loop: boolean, vol: number) => {
      const a = new Audio(SOUND(n));
      a.loop = loop;
      a.volume = vol;
      (a as HTMLAudioElement & { preservesPitch: boolean }).preservesPitch = false;
      return a;
    };
    audio.current = {
      engine: mk("engine", true, 0.3),
      brake: mk("brake", true, 0),
      crash: mk("crash", false, 0.8),
      blinker: mk("blinker", false, 0.6),
    };
    audio.current.engine!.play().catch(() => {});
    audio.current.brake!.play().catch(() => {});
    setStarted(true);
  };

  const steerDeg = Math.round(tele.steer * 450);
  const gpu = detectGpu();
  const cv = canvasSettings(gpu.quality);

  // ══════════════════════════════════════════════════════════════════════════
  // SCENARIO 1: DESKTOP WEB NOTICE (User: "web uchun Avtodrom Simulyatori 3D kerak emas")
  // ══════════════════════════════════════════════════════════════════════════
  if (!isMobileScreen && !forceWebPreview) {
    const shareUrl = typeof window !== "undefined" ? window.location.href : "https://pravaonline.uz/simulator";
    return (
      <div className="sim-web-notice-overlay">
        <div className="sim-web-notice-card">
          <div
            style={{
              width: 58,
              height: 58,
              borderRadius: "50%",
              background: "rgba(56, 189, 248, 0.15)",
              color: "#38bdf8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <IconDeviceMobile size={32} />
          </div>

          <h2 style={{ margin: "0 0 8px", fontSize: "22px", fontWeight: 800 }}>
            {t("sim.mobileOnlyTitle", { defaultValue: "Avtodrom Simulyatori 3D mobil qurilmalar uchun" })}
          </h2>

          <p style={{ margin: "0 0 16px", fontSize: "14px", color: "#94a3b8", lineHeight: 1.6 }}>
            {t("sim.mobileOnlyDesc", {
              defaultValue:
                "3D Avtodrom haydash simulyatori sensorli ekran, mobil rul va pedallar uchun maxsus moslashtirilgan. Mobil telefoningizda ochish uchun kamerangiz bilan ushbu QR-kodni skanerlang:",
            })}
          </p>

          <div className="sim-web-notice-qr">
            <QRCodeSVG value={shareUrl} size={180} level="M" />
          </div>

          <p style={{ margin: "6px 0 20px", fontSize: "12px", color: "#64748b" }}>
            {t("sim.mobileScanPrompt", { defaultValue: "Telefoningiz kamerasi orqali skanerlang" })}
          </p>

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
            <button
              className="sim-btn"
              onClick={() => navigate("/practical-exam")}
              style={{ background: "#0284c7", borderColor: "#0284c7", fontWeight: 700 }}
            >
              <IconFileText size={18} />
              {t("practicalExam.guideTitle", { defaultValue: "Amaliy imtihon qoidalari" })}
            </button>

            <button className="sim-btn sim-btn-ghost" onClick={onBack}>
              <IconArrowLeft size={18} />
              {t("common.back", { defaultValue: "Orqaga" })}
            </button>

            <button
              className="sim-btn sim-btn-ghost"
              onClick={() => setForceWebPreview(true)}
              style={{ fontSize: "12px", opacity: 0.8 }}
            >
              <IconPlayerPlay size={16} />
              {t("sim.previewOnPc", { defaultValue: "Kompyuterda sinab ko'rish" })}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SCENARIO 2: HARDWARE & WEBGL GUARDS
  // ══════════════════════════════════════════════════════════════════════════
  if (gpu.quality === "software" && !forceOpen) {
    return (
      <div className="sim-screen sim-nogl">
        <div className="sim-nogl-box">
          <h2>{t("sim.slowGpuTitle", { defaultValue: "Videokarta quvvati yetarli emas" })}</h2>
          <p>
            {t("sim.slowGpuDesc", {
              defaultValue: "Ushbu qurilmada 3D grafika juda sekin ishlashi mumkin.",
            })}
          </p>
          <div className="sim-nogl-actions">
            <button className="sim-btn" onClick={onBack}>
              <IconArrowLeft size={18} /> {t("sim.exit", { defaultValue: "Chiqish" })}
            </button>
            <button className="sim-btn sim-btn-ghost" onClick={() => setForceOpen(true)}>
              {t("sim.slowGpuOpen", { defaultValue: "Baribir ochish" })}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (tooSlow) {
    return (
      <div className="sim-screen sim-nogl">
        <div className="sim-nogl-box">
          <h2>{t("sim.tooSlowTitle", { defaultValue: "Kadr tezligi juda past" })}</h2>
          <p>
            {t("sim.tooSlowDesc", {
              defaultValue: "Qurilma 3D sahnani yetarli tezlikda renderlay olmadi.",
            })}
          </p>
          <button className="sim-btn" onClick={onBack}>
            <IconArrowLeft size={18} /> {t("sim.exit", { defaultValue: "Chiqish" })}
          </button>
        </div>
      </div>
    );
  }

  if (!webglSupported()) {
    return (
      <div className="sim-screen sim-nogl">
        <div className="sim-nogl-box">
          <h2>{t("sim.noWebglTitle", { defaultValue: "WebGL qo'llab-quvvatlanmaydi" })}</h2>
          <p>
            {t("sim.noWebglDesc", {
              defaultValue: "Brauzeringizda 3D WebGL texnologiyasi yoqilmagan.",
            })}
          </p>
          <button className="sim-btn" onClick={onBack}>
            <IconArrowLeft size={18} /> {t("sim.exit", { defaultValue: "Chiqish" })}
          </button>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SCENARIO 3: FULL 3D AVTODROM SIMULATOR (Identical to Prava-desktop + Mobile Controls)
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="sim-screen">
      <Canvas
        className="sim-canvas"
        dpr={cv.dpr}
        camera={{ fov: 60, near: 0.1, far: cv.far, position: [15, 6, -10] }}
        gl={{ antialias: cv.antialias, powerPreference: "high-performance" }}
      >
        <Suspense fallback={null}>
          <SimScene
            rt={rt}
            curbs={world.curbs}
            estacada={world.estacada}
            onWorldReady={onWorldReady}
            low={gpu.quality !== "high"}
          />
          <FpsGuard onTooSlow={() => setTooSlow(true)} />
        </Suspense>
      </Canvas>

      <LoadingOverlay />

      {/* ── Top Bar ── */}
      <div className="sim-topbar">
        <button className="sim-btn" onClick={onBack} title="Esc">
          <IconArrowLeft size={18} /> {t("sim.exit", { defaultValue: "Chiqish" })}
        </button>

        <div className="sim-topbar-right">
          <button className="sim-btn" onClick={cycleCamera} title="C">
            <IconCamera size={18} />{" "}
            {camMode === "chase"
              ? t("sim.camChase", { defaultValue: "Orqadan" })
              : camMode === "cockpit"
              ? t("sim.camCockpit", { defaultValue: "Salondan" })
              : t("sim.camTop", { defaultValue: "Tepadan" })}
          </button>
          <button className="sim-btn" onClick={reset} title="R">
            <IconRefresh size={18} /> {t("sim.reset", { defaultValue: "Qayta" })}
          </button>
          <button className="sim-btn" onClick={() => setShowHelp((v) => !v)}>
            <IconKeyboard size={18} />
          </button>
        </div>
      </div>

      {/* ── Dashboard: Gauges & Indicators ── */}
      {started && (
        <div className="sim-dash">
          <button
            className={`sim-signal ${tele.signal === "left" || tele.signal === "both" ? "on" : ""}`}
            onClick={(e) => {
              toggleSignal("left");
              e.currentTarget.blur();
            }}
            title={`${t("sim.kSignals")} (J)`}
            aria-pressed={tele.signal === "left"}
          >
            ◀
          </button>
          <div className="sim-speed">
            <span className="sim-speed-val">{Math.round(tele.kmh)}</span>
            <span className="sim-speed-unit">{t("sim.kmh")}</span>
          </div>
          <div className="sim-wheel" style={{ transform: `rotate(${-steerDeg}deg)` }} aria-hidden="true">
            <div className="sim-wheel-spoke" />
          </div>
          <button
            className={`sim-gear ${tele.gear === "R" ? "rev" : ""}`}
            onClick={(e) => {
              toggleGear();
              e.currentTarget.blur();
            }}
            title={`${t("sim.kGear")} (F)`}
          >
            <span className={tele.gear === "D" ? "act" : ""}>D</span>
            <span className={tele.gear === "R" ? "act" : ""}>R</span>
          </button>
          <button
            className={`sim-hazard ${tele.signal === "both" ? "on" : ""}`}
            onClick={(e) => {
              toggleSignal("both");
              e.currentTarget.blur();
            }}
            title={`${t("sim.kHazard")} (K)`}
            aria-pressed={tele.signal === "both"}
          >
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
              <path
                d="M12 3 L22 20 H2 Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinejoin="round"
              />
              <path
                d="M12 9.5 L16.2 17 H7.8 Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <div className="sim-hits" title={t("sim.collisions")}>
            <span>{tele.collisions}</span>
            <small>{t("sim.collisions")}</small>
          </div>
          <button
            className={`sim-signal ${tele.signal === "right" || tele.signal === "both" ? "on" : ""}`}
            onClick={(e) => {
              toggleSignal("right");
              e.currentTarget.blur();
            }}
            title={`${t("sim.kSignals")} (L)`}
            aria-pressed={tele.signal === "right"}
          >
            ▶
          </button>
        </div>
      )}

      {/* ── Mobile Touch Controls (Steering Left/Right & Pedals) ── */}
      {started && (
        <div className="sim-mobile-controls" aria-label={t("sim.touchControls")}>
          {/* Steer buttons (Left / Right) */}
          <div className="sim-touch-steer-group">
            <button
              type="button"
              className={`sim-touch-btn ${touchLeft ? "pressed" : ""}`}
              onPointerDown={(e) => {
                e.preventDefault();
                setTouchLeft(true);
                rt.current.input.left = true;
              }}
              onPointerUp={(e) => {
                e.preventDefault();
                setTouchLeft(false);
                rt.current.input.left = false;
              }}
              onPointerCancel={() => {
                setTouchLeft(false);
                rt.current.input.left = false;
              }}
              aria-label={t("sim.touchLeft")}
            >
              ◀
            </button>
            <button
              type="button"
              className={`sim-touch-btn ${touchRight ? "pressed" : ""}`}
              onPointerDown={(e) => {
                e.preventDefault();
                setTouchRight(true);
                rt.current.input.right = true;
              }}
              onPointerUp={(e) => {
                e.preventDefault();
                setTouchRight(false);
                rt.current.input.right = false;
              }}
              onPointerCancel={() => {
                setTouchRight(false);
                rt.current.input.right = false;
              }}
              aria-label={t("sim.touchRight")}
            >
              ▶
            </button>
          </div>

          {/* Pedals (Brake & Gas) */}
          <div className="sim-touch-pedals-group">
            <button
              type="button"
              className={`sim-touch-pedal sim-pedal-brake ${touchBrake ? "pressed" : ""}`}
              onPointerDown={(e) => {
                e.preventDefault();
                setTouchBrake(true);
                rt.current.input.brake = true;
              }}
              onPointerUp={(e) => {
                e.preventDefault();
                setTouchBrake(false);
                rt.current.input.brake = false;
              }}
              onPointerCancel={() => {
                setTouchBrake(false);
                rt.current.input.brake = false;
              }}
              aria-label={t("sim.touchBrake")}
            >
              <span style={{ fontSize: "20px" }}>⏹</span>
              <span className="sim-pedal-label">{t("sim.touchBrake")}</span>
            </button>

            <button
              type="button"
              className={`sim-touch-pedal sim-pedal-gas ${touchGas ? "pressed" : ""}`}
              onPointerDown={(e) => {
                e.preventDefault();
                setTouchGas(true);
                rt.current.input.gas = true;
              }}
              onPointerUp={(e) => {
                e.preventDefault();
                setTouchGas(false);
                rt.current.input.gas = false;
              }}
              onPointerCancel={() => {
                setTouchGas(false);
                rt.current.input.gas = false;
              }}
              aria-label={t("sim.touchGas")}
            >
              <span style={{ fontSize: "22px" }}>▲</span>
              <span className="sim-pedal-label">{t("sim.touchGas")}</span>
            </button>
          </div>
        </div>
      )}

      {gearHint && (
        <div className="sim-toast">
          {t("sim.gearHint", { defaultValue: "Uzatmani faqat to'xtab turganda almashtirish mumkin" })}
        </div>
      )}

      {/* ── Start / Help Modal ── */}
      {(!started || showHelp) && (
        <div className="sim-help-overlay">
          <div className="sim-help">
            <h2>{t("sim.title", { defaultValue: "Avtodrom Simulyatori 3D" })}</h2>
            <p className="sim-help-sub">
              {t("sim.subtitle", {
                defaultValue: "Boshqaruv: Sensorli pedallar va rul yoki klaviatura tugmalari orqali",
              })}
            </p>

            <div className="sim-keys">
              <div>
                <kbd>W</kbd>
                <kbd>↑</kbd>
                <span>{t("sim.kGas", { defaultValue: "Gaz (Oldinga)" })}</span>
              </div>
              <div>
                <kbd>S</kbd>
                <kbd>↓</kbd>
                <kbd>Space</kbd>
                <span>{t("sim.kBrake", { defaultValue: "Tormoz" })}</span>
              </div>
              <div>
                <kbd>A</kbd>
                <kbd>←</kbd>
                <span>{t("sim.kLeft", { defaultValue: "Chapga" })}</span>
              </div>
              <div>
                <kbd>D</kbd>
                <kbd>→</kbd>
                <span>{t("sim.kRight", { defaultValue: "O'ngga" })}</span>
              </div>
              <div>
                <kbd>F</kbd>
                <span>{t("sim.kGear", { defaultValue: "Uzatma (D / R)" })}</span>
              </div>
              <div>
                <kbd>J</kbd>
                <kbd>L</kbd>
                <span>{t("sim.kSignals", { defaultValue: "Burilish chiroqlari" })}</span>
              </div>
              <div>
                <kbd>K</kbd>
                <span>{t("sim.kHazard", { defaultValue: "Avariya chirog'i" })}</span>
              </div>
              <div>
                <kbd>C</kbd>
                <span>{t("sim.kCamera", { defaultValue: "Kamera burchagi" })}</span>
              </div>
              <div>
                <kbd>R</kbd>
                <span>{t("sim.kReset", { defaultValue: "Boshlang'ich holat" })}</span>
              </div>
              <div>
                <kbd>Esc</kbd>
                <span>{t("sim.exit", { defaultValue: "Chiqish" })}</span>
              </div>
            </div>

            <button
              className="sim-start"
              onClick={() => (started ? setShowHelp(false) : start())}
            >
              {started
                ? t("sim.continue", { defaultValue: "Davom etish" })
                : t("sim.start", { defaultValue: "Mashinani yurgizish" })}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
