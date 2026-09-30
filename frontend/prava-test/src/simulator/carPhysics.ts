/**
 * Avtodrom simulyatori — mashina harakati (kinematik "velosiped modeli").
 *
 * Nega fizika dvigateli emas: avtodrom mashqlari past tezlikda (5–20 km/soat)
 * aniq manyovr talab qiladi. Velosiped modeli bunda real mashinaga juda yaqin
 * burilish radiusini beradi, WebAssembly talab qilmaydi va har bir kadrda
 * bir xil natija beradi (mashqlarni baholash uchun muhim).
 *
 * Koordinatalar (cobalt.glb o'lchamlari, metrda):
 *   - mashina oldi lokal -Z tomonga qaragan
 *   - heading = θ bo'lganda oldinga yo'nalish = (-sin θ, -cos θ)
 *   - θ oshsa — mashina chapga buriladi
 */

export const CAR = {
  wheelBase: 3.194,        // old va orqa o'q orasidagi masofa
  rearAxleZ: 1.575,        // orqa o'q model markazidan qancha orqada
  frontAxleZ: 1.619,
  wheelRadius: 0.377,
  halfLength: 2.58,        // to'qnashuv to'rtburchagi (car-hull o'lchamidan)
  halfWidth: 0.98,
  maxSteer: 0.61,          // ~35° — real Cobalt'ga yaqin burilish radiusi
};

export const DRIVE = {
  accel: 2.6,              // m/s² — gaz bosilganda
  brake: 7.5,              // m/s² — tormoz
  rolling: 0.9,            // m/s² — gaz qo'yib yuborilganda sekinlashish
  maxForward: 8.33,        // m/s = 30 km/soat (avtodromdagi eng yuqori tezlik)
  maxReverse: 3.0,         // m/s ≈ 11 km/soat
  steerSpeed: 2.2,         // rul qanchalik tez buriladi (1/s)
  steerReturn: 1.6,        // rul qo'yib yuborilganda markazga qaytish tezligi
  gravity: 9.81,
};

/** Avtodrom chegaralari (avtodrom.glb bounds) */
export const WORLD = { minX: 1, maxX: 189.5, minZ: -134, maxZ: -1 };

/** Boshlang'ich holat — mashina +X tomonga qaragan */
export const SPAWN = { x: 25, z: -10, heading: -Math.PI / 2 };

export type Gear = "D" | "R";

export interface CarState {
  /** Orqa o'q markazi (dunyo koordinatasi) */
  rx: number;
  rz: number;
  heading: number;
  /** Tezlik m/s, oldinga musbat, orqaga manfiy */
  speed: number;
  /** Rul holati -1..1 (musbat = chap) */
  steer: number;
  gear: Gear;
  pitch: number;
  /** Model markazining balandligi */
  y: number;
  /** G'ildiraklar aylanish burchagi (vizual) */
  wheelSpin: number;
}

export interface DriveInput {
  gas: boolean;
  brake: boolean;
  left: boolean;
  right: boolean;
}

/** 2D yo'naltirilgan to'rtburchak (bordyur yoki mashina) */
export interface OBB {
  cx: number; cz: number;
  ux: number; uz: number; hu: number;   // birinchi o'q va yarim uzunligi
  vx: number; vz: number; hv: number;   // ikkinchi o'q va yarim uzunligi
  r: number;                            // tez tekshiruv uchun tashqi aylana radiusi
}

export function initialState(): CarState {
  const s: CarState = {
    rx: 0, rz: 0, heading: SPAWN.heading, speed: 0, steer: 0,
    gear: "D", pitch: 0, y: 0, wheelSpin: 0,
  };
  // SPAWN — model markazi; orqa o'qni undan hisoblaymiz
  const f = forward(s.heading);
  s.rx = SPAWN.x - f.x * CAR.rearAxleZ;
  s.rz = SPAWN.z - f.z * CAR.rearAxleZ;
  return s;
}

export function forward(heading: number) {
  return { x: -Math.sin(heading), z: -Math.cos(heading) };
}

/** Model markazi (render uchun) */
export function carCenter(s: CarState) {
  const f = forward(s.heading);
  return { x: s.rx + f.x * CAR.rearAxleZ, z: s.rz + f.z * CAR.rearAxleZ };
}

export function carOBB(s: CarState): OBB {
  const f = forward(s.heading);
  const c = carCenter(s);
  return {
    cx: c.x, cz: c.z,
    ux: f.x, uz: f.z, hu: CAR.halfLength,
    vx: -f.z, vz: f.x, hv: CAR.halfWidth,
    r: Math.hypot(CAR.halfLength, CAR.halfWidth),
  };
}

function project(o: OBB, ax: number, az: number) {
  const c = o.cx * ax + o.cz * az;
  const e = Math.abs(o.ux * ax + o.uz * az) * o.hu + Math.abs(o.vx * ax + o.vz * az) * o.hv;
  return [c - e, c + e];
}

/** Ikki to'rtburchak kesishadimi (Separating Axis Theorem) */
export function obbOverlap(a: OBB, b: OBB): boolean {
  const dx = a.cx - b.cx, dz = a.cz - b.cz;
  if (dx * dx + dz * dz > (a.r + b.r) * (a.r + b.r)) return false;
  for (const [ax, az] of [[a.ux, a.uz], [a.vx, a.vz], [b.ux, b.uz], [b.vx, b.vz]]) {
    const [a0, a1] = project(a, ax, az);
    const [b0, b1] = project(b, ax, az);
    if (a1 < b0 || b1 < a0) return false;
  }
  return true;
}

function approach(v: number, target: number, step: number) {
  return v < target ? Math.min(v + step, target) : Math.max(v - step, target);
}

export interface StepResult {
  collided: boolean;
}

/**
 * Bitta fizika qadami.
 * @param groundHeight (x,z) nuqtadagi yer balandligi (estakada uchun)
 */
export function step(
  s: CarState,
  input: DriveInput,
  dt: number,
  curbs: OBB[],
  groundHeight: (x: number, z: number) => number,
): StepResult {
  // ── Rul ──
  const target = input.left === input.right ? 0 : input.left ? 1 : -1;
  const rate = target === 0 ? DRIVE.steerReturn : DRIVE.steerSpeed;
  s.steer = approach(s.steer, target, rate * dt);

  // ── Tezlik ──
  const dir = s.gear === "D" ? 1 : -1;
  let v = s.speed;
  if (input.brake) {
    v = approach(v, 0, DRIVE.brake * dt);
  } else if (input.gas) {
    v += dir * DRIVE.accel * dt;
  } else {
    v = approach(v, 0, DRIVE.rolling * dt);
  }
  // Qiyalik: tepalikda gaz/tormoz bo'lmasa mashina orqaga sirpanadi
  if (!input.brake) {
    v -= DRIVE.gravity * Math.sin(s.pitch) * dt;
  }
  v = Math.max(-DRIVE.maxReverse, Math.min(DRIVE.maxForward, v));

  // ── Harakat (orqa o'q bo'yicha velosiped modeli) ──
  const prev = { rx: s.rx, rz: s.rz, heading: s.heading };
  const f = forward(s.heading);
  s.rx += f.x * v * dt;
  s.rz += f.z * v * dt;
  s.heading += (v * Math.tan(s.steer * CAR.maxSteer) / CAR.wheelBase) * dt;
  s.speed = v;

  // ── To'qnashuv: bordyurlar va maydon chegarasi ──
  const overlapsAny = (b: OBB) => {
    if (b.cx < WORLD.minX || b.cx > WORLD.maxX || b.cz < WORLD.minZ || b.cz > WORLD.maxZ) return true;
    for (const c of curbs) if (obbOverlap(b, c)) return true;
    return false;
  };
  let hit = overlapsAny(carOBB(s));
  // Oldingi holat ham to'qnashuvda bo'lgan bo'lsa (masalan boshlang'ich nuqta
  // bordyurga tegib turibdi) — mashina qotib qolmasin, chiqib ketishiga ruxsat
  if (hit) {
    const cur = { rx: s.rx, rz: s.rz, heading: s.heading };
    s.rx = prev.rx; s.rz = prev.rz; s.heading = prev.heading;
    const wasStuck = overlapsAny(carOBB(s));
    s.rx = cur.rx; s.rz = cur.rz; s.heading = cur.heading;
    if (wasStuck) hit = false;
  }
  if (hit) {
    s.rx = prev.rx; s.rz = prev.rz; s.heading = prev.heading;
    s.speed = 0;
  }

  // ── Balandlik va qiyalik (estakada) ──
  const fn = forward(s.heading);
  const fx = s.rx + fn.x * CAR.wheelBase, fz = s.rz + fn.z * CAR.wheelBase;
  const hr = groundHeight(s.rx, s.rz);
  const hf = groundHeight(fx, fz);
  s.pitch = Math.atan2(hf - hr, CAR.wheelBase);
  s.y = hr + Math.sin(s.pitch) * CAR.rearAxleZ;

  s.wheelSpin -= (s.speed * dt) / CAR.wheelRadius;
  return { collided: hit };
}
