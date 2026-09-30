import * as THREE from "three";

export type LightKind = "left" | "right" | "stop" | "rear";

/** Chiroq materiallari: burilish — to'q sariq, tormoz — qizil, orqaga yurish — oq */
const KINDS: Record<string, { kind: LightKind; color: string }> = {
  signalLeft: { kind: "left", color: "#ff8c00" },
  signalRight: { kind: "right", color: "#ff8c00" },
  signalStop: { kind: "stop", color: "#ff1a1a" },
  signalRear: { kind: "rear", color: "#ffffff" },
};

/** Model ichidagi 1 sm lik "nuqta" meshlar — sayt chiroqni aynan shu joyda chizgan */
const MARKER_SIZE = 0.02;

function glowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d")!;
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, "rgba(255,255,255,1)");
  grd.addColorStop(0.25, "rgba(255,255,255,0.8)");
  grd.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export interface CarLights {
  set(kind: LightKind, on: boolean): void;
}

/**
 * Modeldagi chiroq materiallari o'zi yonmaydi (emissive rangi yo'q, ustida shaffof
 * shisha bor, old burilish chiroqlarida esa geometriya umuman yo'q). Shuning uchun:
 *  1) materialga rang beramiz va yonganda yorqin qilamiz;
 *  2) har bir chiroq nuqtasiga porlash (sprite) qo'yamiz — uzoqdan ham ko'rinadi.
 */
export function setupCarLights(scene: THREE.Object3D): CarLights {
  const mats = new Map<LightKind, { m: THREE.MeshStandardMaterial; base: THREE.Color; on: THREE.Color }[]>();
  const glows = new Map<LightKind, THREE.Sprite[]>();
  const tex = glowTexture();
  const points: { kind: LightKind; color: string; pos: THREE.Vector3 }[] = [];
  const seen = new Set<THREE.Material>();

  scene.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(scene.matrixWorld).invert();
  scene.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh || Array.isArray(mesh.material)) return;
    const m = mesh.material as THREE.MeshStandardMaterial;
    const k = KINDS[m.name];
    if (!k) return;

    if (!seen.has(m)) {
      seen.add(m);
      // Asl rangni birinchi marta saqlaymiz (model keshda — qayta ochilganda ham to'g'ri bo'lsin)
      m.userData.baseColor ??= m.color.clone();
      m.toneMapped = false;
      m.emissive.set(k.color);
      m.emissiveIntensity = 0;
      m.color.copy(m.userData.baseColor);
      m.needsUpdate = true;
      const list = mats.get(k.kind) ?? [];
      list.push({ m, base: m.userData.baseColor, on: new THREE.Color(k.color) });
      mats.set(k.kind, list);
    }

    mesh.geometry.computeBoundingBox();
    const bb = mesh.geometry.boundingBox!.clone().applyMatrix4(mesh.matrixWorld).applyMatrix4(inv);
    const size = bb.getSize(new THREE.Vector3());
    const isMarker = Math.max(size.x, size.y, size.z) < MARKER_SIZE;
    // Orqaga yurish chirog'ida nuqta yo'q — lampaning o'zi markaz bo'ladi
    if (isMarker || k.kind === "rear") points.push({ kind: k.kind, color: k.color, pos: bb.getCenter(new THREE.Vector3()) });
  });

  // Oldingi chaqiruvdan qolgan porlashlarni olib tashlaymiz (model keshda qayta ishlatiladi)
  scene.getObjectByName("car-light-glows")?.removeFromParent();
  const group = new THREE.Group();
  group.name = "car-light-glows";
  for (const p of points) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({
      map: tex,
      color: p.color,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
      toneMapped: false,
    }));
    // Nuqta lampa ichida — porlash kuzovga ko'milib qolmasligi uchun tashqariga chiqaramiz
    const out = p.pos.z > 0 ? 0.08 : -0.08;
    s.position.set(p.pos.x, p.pos.y, p.pos.z + out);
    const side = Math.abs(p.pos.z) < 1.5; // yon oynadagi takrorlagich
    s.scale.setScalar(side ? 0.18 : p.kind === "rear" ? 0.3 : 0.4);
    s.visible = false;
    group.add(s);
    const list = glows.get(p.kind) ?? [];
    list.push(s);
    glows.set(p.kind, list);
  }
  scene.add(group);

  const state = new Map<LightKind, boolean>();
  return {
    set(kind, on) {
      if (state.get(kind) === on) return;
      state.set(kind, on);
      for (const { m, base, on: c } of mats.get(kind) ?? []) {
        m.color.copy(on ? c : base);
        m.emissiveIntensity = on ? 2 : 0;
      }
      for (const s of glows.get(kind) ?? []) s.visible = on;
    },
  };
}
