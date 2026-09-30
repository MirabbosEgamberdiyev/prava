import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF, Environment } from "@react-three/drei";
import * as THREE from "three";
import {
  CAR,
  carCenter,
  forward,
  step,
  type CarState,
  type DriveInput,
  type OBB,
} from "./carPhysics";
import { applyBranding, LOGO_URL } from "./carBranding";
import { setupCarLights, type CarLights } from "./carLights";

export const MODEL_AVTODROM = "/simulator/models/avtodrom.glb";
export const MODEL_CAR = "/simulator/models/cobalt.glb";
export const SKY_HDR = "/simulator/models/sky.hdr";
/** Draco dekoderi dastur ichida — internet kerak emas */
const DRACO_PATH = "/draco/";

export type CameraMode = "chase" | "cockpit" | "top";

/** Fizika holati va boshqaruv — React render'larisiz, ref orqali almashiladi */
export interface SimRuntime {
  car: CarState;
  input: DriveInput;
  signal: "" | "left" | "right" | "both";
  camera: CameraMode;
  /** Sichqoncha bilan aylantirilgan kamera burchagi (mashinaga nisbatan) */
  orbit: { yaw: number; pitch: number };
  resetRequested: boolean;
  /** Oxirgi 1 s ichida bordyurga tegilganmi (false qilinsa kontakt unutiladi) */
  inCollision: boolean;
  onCollision?: () => void;
}

// ═══════════════════════ Avtodrom ═══════════════════════

const TL_CYCLE: [string, number][] = [
  ["RED", 10], ["YELLOW_RED", 3], ["GREEN", 10], ["YELLOW_GREEN", 3],
];

function Avtodrom({ onReady }: { onReady: (curbs: OBB[], estacada: THREE.Object3D[]) => void }) {
  const { scene, materials } = useGLTF(MODEL_AVTODROM, DRACO_PATH);

  useEffect(() => {
    scene.updateMatrixWorld(true);

    // Ko'rinmas to'qnashuv qobiqlarini yashirish, chiziqlarni yerdan biroz ko'tarish
    scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        const mat = m.material as THREE.Material;
        if (mat?.name === "invisible") m.visible = false;
      }
      if (o.name === "solid_lines" || o.name === "stroke_lines") o.position.y = 0.01;
    });
    // Maydon chetidagi 3 m lik qora devorlar — o'rniga atrofda maysazor ko'rinadi
    // (mashina baribir WORLD chegarasidan chiqmaydi)
    scene.getObjectByName("ground")?.children.forEach((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      if (!m.geometry.boundingBox) m.geometry.computeBoundingBox();
      if (m.geometry.boundingBox!.max.y > 2) m.visible = false;
    });
    scene.updateMatrixWorld(true);

    // Bordyurlar → 2D yo'naltirilgan to'rtburchaklar
    const curbs: OBB[] = [];
    const curbRoot = scene.getObjectByName("curbs");
    curbRoot?.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      const g = m.geometry;
      if (!g.boundingBox) g.computeBoundingBox();
      const bb = g.boundingBox!;
      const w = m.matrixWorld;
      const c = new THREE.Vector3().addVectors(bb.min, bb.max).multiplyScalar(0.5).applyMatrix4(w);
      const ax = new THREE.Vector3(1, 0, 0).transformDirection(w);
      const az = new THREE.Vector3(0, 0, 1).transformDirection(w);
      const sc = new THREE.Vector3().setFromMatrixScale(w);
      const hx = ((bb.max.x - bb.min.x) / 2) * sc.x;
      const hz = ((bb.max.z - bb.min.z) / 2) * sc.z;
      // Yuqoriga yotqizilgan (juda past) bo'laklarni ham hisobga olamiz
      const lu = Math.hypot(ax.x, ax.z) || 1, lv = Math.hypot(az.x, az.z) || 1;
      curbs.push({
        cx: c.x, cz: c.z,
        ux: ax.x / lu, uz: ax.z / lu, hu: hx,
        vx: az.x / lv, vz: az.z / lv, hv: hz,
        r: Math.hypot(hx, hz),
      });
    });

    const estacada: THREE.Object3D[] = [];
    scene.getObjectByName("estacada")?.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) estacada.push(o);
    });

    onReady(curbs, estacada);
  }, [scene, onReady]);

  // Svetoforlar
  const tl = useRef({ idx: 0, t: 0 });
  useEffect(() => {
    for (const n of ["tl_red_1", "tl_yellow_1", "tl_green_1", "tl_red_2", "tl_yellow_2", "tl_green_2"]) {
      const m = materials[n] as THREE.MeshStandardMaterial | undefined;
      if (!m) continue;
      m.color = new THREE.Color(n.includes("red") ? "#220000" : n.includes("green") ? "#002200" : "#222200");
      // Modelda emissive rangi yo'q (qora) — bermasak svetofor hech qachon yonmaydi
      m.emissive = new THREE.Color(n.includes("red") ? "#ff2020" : n.includes("green") ? "#20ff40" : "#ffcc00");
      m.toneMapped = false;
      m.emissiveIntensity = 0;
      m.needsUpdate = true;
    }
  }, [materials]);

  useFrame((_, dt) => {
    const M = materials as Record<string, THREE.MeshStandardMaterial>;
    if (!M.tl_red_1) return;
    const st = tl.current;
    st.t += dt;
    const phase = TL_CYCLE[st.idx][0];
    if (phase === "RED") {
      M.tl_red_1.emissiveIntensity = 1; M.tl_green_1.emissiveIntensity = 0; M.tl_yellow_1.emissiveIntensity = 0;
      M.tl_red_2.emissiveIntensity = 0; M.tl_green_2.emissiveIntensity = 1; M.tl_yellow_2.emissiveIntensity = 0;
    } else if (phase === "GREEN") {
      M.tl_red_1.emissiveIntensity = 0; M.tl_green_1.emissiveIntensity = 1; M.tl_yellow_1.emissiveIntensity = 0;
      M.tl_red_2.emissiveIntensity = 1; M.tl_green_2.emissiveIntensity = 0; M.tl_yellow_2.emissiveIntensity = 0;
    } else {
      const on = Math.floor(st.t * 2) % 2 === 0;
      M.tl_yellow_1.emissiveIntensity = on ? 1 : 0;
      M.tl_yellow_2.emissiveIntensity = on ? 1 : 0;
    }
    if (st.t > TL_CYCLE[st.idx][1]) { st.t = 0; st.idx = (st.idx + 1) % TL_CYCLE.length; }
  });

  return <primitive object={scene} />;
}

// ═══════════════════════ Maysazor ═══════════════════════

/** Maysa teksturasi — tasvir fayli kerak emas, canvas'da chiziladi */
function grassTexture() {
  const size = 256;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  g.fillStyle = "#4a7a2c";
  g.fillRect(0, 0, size, size);
  // Turli yashil tuslardagi mayda dog'lar — o't tuzilishi
  const tones = ["#3f6d25", "#568a33", "#467528", "#5f9338", "#3a6421"];
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 5000; i++) {
    g.fillStyle = tones[i % tones.length];
    g.globalAlpha = 0.35 + rnd() * 0.5;
    g.fillRect(rnd() * size, rnd() * size, 1 + rnd() * 2, 2 + rnd() * 4);
  }
  g.globalAlpha = 1;
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

const GRASS_SIZE = 2400;

function Grass() {
  const map = useMemo(() => {
    const t = grassTexture();
    t.repeat.set(GRASS_SIZE / 6, GRASS_SIZE / 6); // har 6 m da takrorlanadi
    return t;
  }, []);
  useEffect(() => () => map.dispose(), [map]);
  // Maydon markazi (95, -67); asfalt y=0 da — maysa biroz pastda, ustma-ust chiqmaydi
  return (
    <mesh rotation-x={-Math.PI / 2} position={[95, -0.06, -67]} receiveShadow>
      <planeGeometry args={[GRASS_SIZE, GRASS_SIZE]} />
      <meshStandardMaterial map={map} roughness={1} metalness={0} />
    </mesh>
  );
}

// ═══════════════════════ Mashina ═══════════════════════

const WHEELS = ["car-wheel.Ft.L", "car-wheel.Ft.R", "car-wheel.Bk.L", "car-wheel.Bk.R"];

/** Kuzovdagi yozuv/stikerlar (O'QUV AVTOMOBILI, orqa oynadagi stiker) va Chevrolet emblemalari */
const LOGO_NODES = [
  "body_back.001", "body_front.001", "body_left.001", "body_right.001",
  "glass.001", "emblem.Bk", "emblem.Bk.001", "emblem.Ft",
];

/** Kuzov rangi — oq */
const BODY_COLOR = 0xf2f4f7;

/**
 * Salon va qora plastik detallar rangi.
 *
 * Modelda "blackPlastic" materiali SOF QORA (0,0,0) qilib berilgan. Sof qora
 * yuza hech qanday yorug'likni qaytarmaydi — qancha chiroq qo'yilsa ham qora
 * bo'lib qolaveradi. Shu sababli salon ichidan qaralganda panel, rul va
 * eshiklar umuman ko'rinmas edi. To'q kulrangga o'tkazamiz: tashqaridan
 * baribir qora ko'rinadi, lekin ichkarida shakllar ajralib turadi.
 */
const TRIM_COLOR = 0x1b1e23;

function paintBody(scene: THREE.Object3D) {
  scene.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh || Array.isArray(m.material)) return;
    const mat = m.material as THREE.MeshStandardMaterial;
    if (!mat.color) return;
    if (mat.name === "body") mat.color.setHex(BODY_COLOR);
    else if (mat.name === "blackPlastic") mat.color.setHex(TRIM_COLOR);
    else if (mat.name === "glass") {
      // Modelda oyna to'q kulrang (0.24) va metalness = 1.0 qilib berilgan.
      // Metall shaffof yuza fizik jihatdan noto'g'ri: yorug'likning katta
      // qismini yutadi, shuning uchun salondan qaralganda tashqaridagi
      // hamma narsa hira ko'rinardi. Deyarli rangsiz shishaga o'tkazamiz.
      mat.color.setHex(0xe8eef5);
      mat.metalness = 0;
      mat.roughness = 0.05;
      mat.opacity = 0.22;
      mat.transparent = true;
      mat.needsUpdate = true;
    }
  });
}

/** GLTFLoader nomdagi nuqta va boshqa belgilarni olib tashlaydi — ikkala ko'rinishda ham qidiramiz */
function findNode(root: THREE.Object3D, name: string) {
  return root.getObjectByName(name) ?? root.getObjectByName(THREE.PropertyBinding.sanitizeNodeName(name));
}

function Car({ rt, groupRef }: { rt: React.MutableRefObject<SimRuntime>; groupRef: React.RefObject<THREE.Group | null> }) {
  const { scene } = useGLTF(MODEL_CAR, DRACO_PATH);
  const wheels = useMemo(() => WHEELS.map((n) => findNode(scene, n)), [scene]);
  const blink = useRef(0);
  const lights = useRef<CarLights | null>(null);

  useEffect(() => {
    for (const n of ["car-hull", ...LOGO_NODES]) findNode(scene, n)?.traverse((o) => { o.visible = false; });
    paintBody(scene);
    // Olib tashlangan yozuvlar o'rniga — Pravaonline logosi
    const logo = new Image();
    logo.onload = () => applyBranding(scene, logo);
    logo.src = LOGO_URL;
    for (const w of wheels) if (w) w.rotation.order = "YXZ";
    lights.current = setupCarLights(scene);
  }, [scene, wheels]);

  useFrame((_, dt) => {
    const g = groupRef.current;
    if (!g) return;
    const s = rt.current.car;
    const c = carCenter(s);
    g.position.set(c.x, s.y, c.z);
    g.rotation.set(s.pitch, s.heading, 0, "YXZ");

    const steerAngle = s.steer * CAR.maxSteer;
    wheels.forEach((w, i) => {
      if (!w) return;
      w.rotation.x = s.wheelSpin;
      w.rotation.y = i < 2 ? steerAngle : 0;
    });

    // Chiroqlar
    const L = lights.current;
    if (L) {
      blink.current += dt;
      const on = Math.floor(blink.current * 3) % 2 === 0;
      const sig = rt.current.signal;
      L.set("left", (sig === "left" || sig === "both") && on);
      L.set("right", (sig === "right" || sig === "both") && on);
      L.set("stop", rt.current.input.brake);
      L.set("rear", s.gear === "R");
    }
  });

  return (
    <group ref={groupRef}>
      <primitive object={scene} />
      {/* Salon chirog'i: kuzov tashqi yorug'likni to'sadi, shuning uchun
          ichkarida yumshoq yoritish kerak. Radiusi kichik — tashqi
          ko'rinishga ta'sir qilmaydi. */}
      <pointLight position={[0, 1.2, 0.25]} intensity={0.35} distance={3.0} decay={2} color="#dce8f7" />
    </group>
  );
}

// ═══════════════════════ Kamera ═══════════════════════

/** Kamerani sichqoncha bilan qancha ko'tarish/tushirish mumkin (radian) */
const PITCH_MIN = -0.25;
const PITCH_MAX = 1.15;
/** Sichqoncha sezgirligi — 1 piksel necha radian */
const DRAG_SPEED = 0.006;
/**
 * Haydovchi ko'zining mashina markaziga nisbatan o'rni (metr).
 * side — manfiy qiymat chap tomon (O'zbekistonda rul chapda),
 * front — markazdan oldinga, up — model markazidan tepaga.
 */
const EYE = { side: -0.38, front: 0.05, up: 1.30 };

function CameraRig({ rt }: { rt: React.MutableRefObject<SimRuntime> }) {
  const { camera, gl } = useThree();
  const pos = useRef(new THREE.Vector3());
  const look = useRef(new THREE.Vector3());
  const first = useRef(true);

  // ── Sichqoncha bilan mashina atrofida aylanish ──
  useEffect(() => {
    const el = gl.domElement;
    let dragging = false;
    let lastX = 0;
    let lastY = 0;

    const down = (e: PointerEvent) => {
      if (e.button !== 0 && e.button !== 2) return;
      dragging = true;
      lastX = e.clientX;
      lastY = e.clientY;
      el.setPointerCapture(e.pointerId);
      el.style.cursor = "grabbing";
    };

    const move = (e: PointerEvent) => {
      if (!dragging) return;
      const o = rt.current.orbit;
      o.yaw -= (e.clientX - lastX) * DRAG_SPEED;
      o.pitch = THREE.MathUtils.clamp(
        o.pitch + (e.clientY - lastY) * DRAG_SPEED,
        PITCH_MIN,
        PITCH_MAX,
      );
      lastX = e.clientX;
      lastY = e.clientY;
    };

    const up = (e: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
      el.style.cursor = "grab";
    };

    // O'ng tugma bilan ham aylantirish mumkin — kontekst menyusi chiqmasin
    const menu = (e: Event) => e.preventDefault();

    el.style.cursor = "grab";
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    el.addEventListener("contextmenu", menu);
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      el.removeEventListener("contextmenu", menu);
      el.style.cursor = "";
    };
  }, [gl]);

  useFrame((_, dt) => {
    const s = rt.current.car;
    const c = carCenter(s);
    const f = forward(s.heading);
    const wantPos = new THREE.Vector3();
    const wantLook = new THREE.Vector3(c.x, s.y + 1.0, c.z);

    if (rt.current.camera === "cockpit") {
      // ── Salon ichidan (haydovchi o'rindig'i) ──
      const { yaw, pitch } = rt.current.orbit;
      // Mashinaning lokal +X o'qi dunyo koordinatasida
      const side = { x: Math.cos(s.heading), z: -Math.sin(s.heading) };
      const eyeX = c.x + f.x * EYE.front + side.x * EYE.side;
      const eyeZ = c.z + f.z * EYE.front + side.z * EYE.side;
      const eyeY = s.y + EYE.up;
      // Qarash yo'nalishi — sichqoncha bilan boshni burish
      const dir = forward(s.heading + yaw);
      wantPos.set(eyeX, eyeY, eyeZ);
      wantLook.set(
        eyeX + dir.x * 10,
        eyeY - Math.sin(pitch) * 10,
        eyeZ + dir.z * 10,
      );
      // Salonda kamera mashinadan orqada qolmasligi kerak — silliqlashsiz
      pos.current.copy(wantPos);
      look.current.copy(wantLook);
      first.current = false;
      camera.position.copy(pos.current);
      camera.lookAt(look.current);
      return;
    }

    if (rt.current.camera === "top") {
      wantPos.set(c.x - f.x * 2, s.y + 26, c.z - f.z * 2);
    } else {
      const { yaw, pitch } = rt.current.orbit;
      // Mashina orqasidan — sichqoncha bilan atrofida aylantirish mumkin
      const dir = forward(s.heading + yaw);
      const dist = 8.5 * Math.cos(pitch);
      wantPos.set(c.x - dir.x * dist, s.y + 3.6 + 8.5 * Math.sin(pitch), c.z - dir.z * dist);
      // Kamera burilgan sari nigoh mashinaning o'ziga siljiydi (silliq o'tish)
      const turned = Math.min(1, (Math.abs(yaw) + Math.abs(pitch)) / 0.4);
      const ahead = 3 * (1 - turned);
      wantLook.set(c.x + f.x * ahead, s.y + 1.0, c.z + f.z * ahead);
    }
    // Kamera maydondan chiqib ketmasin
    wantPos.x = THREE.MathUtils.clamp(wantPos.x, 0.5, 190);
    wantPos.z = THREE.MathUtils.clamp(wantPos.z, -134.5, -0.5);

    const k = first.current ? 1 : 1 - Math.exp(-dt * 6);
    pos.current.lerp(wantPos, k);
    look.current.lerp(wantLook, k);
    first.current = false;
    camera.position.copy(pos.current);
    camera.lookAt(look.current);
  });
  return null;
}

// ═══════════════════════ Fizika tsikli ═══════════════════════

function Driver({ rt, curbs, estacada }: {
  rt: React.MutableRefObject<SimRuntime>;
  curbs: OBB[];
  estacada: THREE.Object3D[];
}) {
  const ray = useMemo(() => new THREE.Raycaster(), []);
  const down = useMemo(() => new THREE.Vector3(0, -1, 0), []);
  const origin = useMemo(() => new THREE.Vector3(), []);

  const groundHeight = useMemo(() => (x: number, z: number) => {
    if (!estacada.length) return 0;
    origin.set(x, 20, z);
    ray.set(origin, down);
    ray.far = 40;
    const hit = ray.intersectObjects(estacada, false)[0];
    return hit ? Math.max(0, hit.point.y) : 0;
  }, [estacada, ray, down, origin]);

  // Bordyurga tiralib turganda (gaz bosilgan) kontakt har kadrda yonib-o'chadi —
  // oxirgi kontaktdan keyin 1 s tegmasdan yurgandagina yangi urilish sanaladi
  const sinceContact = useRef(Infinity);

  useFrame((_, rawDt) => {
    const r = rt.current;
    if (r.resetRequested) {
      r.resetRequested = false;
      return;
    }
    if (!r.inCollision) sinceContact.current = Infinity;
    // Katta dt (oyna fonga o'tganda) fizikani buzmasligi uchun kichik qadamlarga bo'lamiz
    let dt = Math.min(rawDt, 0.1);
    while (dt > 0) {
      const h = Math.min(dt, 1 / 60);
      const res = step(r.car, r.input, h, curbs, groundHeight);
      if (res.collided) {
        if (sinceContact.current > 1) r.onCollision?.();
        sinceContact.current = 0;
      } else {
        sinceContact.current += h;
      }
      r.inCollision = sinceContact.current <= 1;
      dt -= h;
    }
  });
  return null;
}

// ═══════════════════════ Sahna ═══════════════════════

export default function SimScene({ rt, curbs, estacada, onWorldReady, low }: {
  rt: React.MutableRefObject<SimRuntime>;
  curbs: OBB[];
  estacada: THREE.Object3D[];
  onWorldReady: (curbs: OBB[], estacada: THREE.Object3D[]) => void;
  /** Kuchsiz videokarta — HDR osmon o'rniga oddiy rang ishlatiladi */
  low?: boolean;
}) {
  const carRef = useRef<THREE.Group>(null);
  return (
    <>
      <ambientLight intensity={low ? 0.85 : 0.5} />
      <directionalLight position={[60, 80, -30]} intensity={low ? 1.5 : 1.2} />
      {low ? (
        // HDR osmon (sky.hdr) yuklanishi va PMREM tayyorlanishi kuchsiz
        // videokartada juda qimmat — o'rniga oddiy rang va fon beramiz.
        <>
          <color attach="background" args={["#8fb8dd"]} />
          <hemisphereLight args={["#cfe4f7", "#4a5a3a", 0.8]} />
          <fog attach="fog" args={["#9dc2e3", 90, 300]} />
        </>
      ) : (
        <Environment
          files={SKY_HDR}
          background
          environmentRotation={[0, Math.PI, 0]}
          backgroundRotation={[0, Math.PI, 0]}
        />
      )}
      <Grass />
      <Avtodrom onReady={onWorldReady} />
      <Car rt={rt} groupRef={carRef} />
      <Driver rt={rt} curbs={curbs} estacada={estacada} />
      <CameraRig rt={rt} />
    </>
  );
}

useGLTF.preload(MODEL_AVTODROM, DRACO_PATH);
useGLTF.preload(MODEL_CAR, DRACO_PATH);
