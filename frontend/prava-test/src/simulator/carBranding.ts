import * as THREE from "three";
import { DecalGeometry } from "three/examples/jsm/geometries/DecalGeometry.js";

export const LOGO_URL = "/logo.png";
const BRAND_COLOR = "#1f7dd3";
const BRAND_TEXT = "PRAVAONLINE.UZ";
/** Raqam plastinkasidagi yozuv — uzoqdan ham o'qilishi uchun to'q ko'k */
const PLATE_TEXT_COLOR = "#0a2a52";

/** Logoni doira shaklida kesib, kichik (512px) tekstura qilamiz — asl rasm 4188px */
function logoTexture(img: HTMLImageElement) {
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const g = c.getContext("2d")!;
  g.beginPath();
  g.arc(256, 256, 254, 0, Math.PI * 2);
  g.clip();
  g.drawImage(img, 0, 0, 512, 512);
  return finish(new THREE.CanvasTexture(c));
}

function textTexture() {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 128;
  const g = c.getContext("2d")!;
  g.fillStyle = BRAND_COLOR;
  g.font = "800 96px Montserrat, Arial, sans-serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(BRAND_TEXT, 512, 68, 1000);
  return finish(new THREE.CanvasTexture(c));
}

/**
 * Davlat raqami ko'rinishidagi plastinka: oq fon, ko'k hoshiya va
 * "PRAVAONLINE" yozuvi. O'zbekiston raqami nisbati 520x112 mm.
 */
function plateTexture() {
  const W = 1040, H = 224, R = 18;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d")!;

  const round = (x: number, y: number, w: number, h: number, r: number) => {
    g.beginPath();
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.closePath();
  };

  // Oq fon + ko'k hoshiya
  round(0, 0, W, H, R);
  g.fillStyle = "#ffffff";
  g.fill();
  round(7, 7, W - 14, H - 14, R - 5);
  g.strokeStyle = BRAND_COLOR;
  g.lineWidth = 11;
  g.stroke();

  // Yozuv
  g.fillStyle = PLATE_TEXT_COLOR;
  g.font = "800 118px Montserrat, Arial, sans-serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText("PRAVAONLINE", W / 2, H / 2 + 4, W - 70);

  return finish(new THREE.CanvasTexture(c));
}

function finish(t: THREE.CanvasTexture) {
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function decalMaterial(map: THREE.Texture) {
  return new THREE.MeshStandardMaterial({
    map,
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -4,
    roughness: 0.35,
    metalness: 0.1,
  });
}

interface Placement {
  /** Nur boshlanadigan nuqta va yo'nalishi (mashina lokal koordinatalarida, old = -Z) */
  from: [number, number, number];
  dir: [number, number, number];
  /** Rasmning "tepa" tomoni qaysi yo'nalishga qarasin */
  up: [number, number, number];
  size: [number, number];
  kind: "logo" | "text" | "plate";
}

const PLACEMENTS: Placement[] = [
  // Old eshiklar — logo
  { from: [3, 0.72, -0.25], dir: [-1, 0, 0], up: [0, 1, 0], size: [0.5, 0.5], kind: "logo" },
  { from: [-3, 0.72, -0.25], dir: [1, 0, 0], up: [0, 1, 0], size: [0.5, 0.5], kind: "logo" },
  // Orqa eshiklar — yozuv
  { from: [3, 0.72, 0.75], dir: [-1, 0, 0], up: [0, 1, 0], size: [1.1, 0.14], kind: "text" },
  { from: [-3, 0.72, 0.75], dir: [1, 0, 0], up: [0, 1, 0], size: [1.1, 0.14], kind: "text" },
  // Kapot va tom — logo (tepa tomoni mashina oldiga qaraydi)
  { from: [0, 4, -1.98], dir: [0, -1, 0], up: [0, 0, -1], size: [0.55, 0.55], kind: "logo" },
  { from: [0, 4, 0.35], dir: [0, -1, 0], up: [0, 0, -1], size: [0.7, 0.7], kind: "logo" },
  // Davlat raqami o'rni — old va orqa bamper (o'lchamlar modeldan o'lchab olingan)
  { from: [0, 0.50, -6], dir: [0, 0, 1], up: [0, 1, 0], size: [0.62, 0.135], kind: "plate" },
  { from: [0, 0.56, 6], dir: [0, 0, -1], up: [0, 1, 0], size: [0.62, 0.135], kind: "plate" },
];

/**
 * Mashina kuzoviga Pravaonline logosi va yozuvini yopishtiradi (DecalGeometry —
 * rasm kuzovning egri yuzasiga moslashadi). Model keshda bo'lgani uchun faqat bir marta.
 */
export function applyBranding(scene: THREE.Object3D, logo: HTMLImageElement) {
  if (scene.userData.branded) return;
  scene.userData.branded = true;

  const body: THREE.Mesh[] = [];
  scene.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh || !m.visible) return;
    const mat = m.material as THREE.Material;
    if (!Array.isArray(m.material) && mat.name === "body") body.push(m);
  });
  if (!body.length) return;

  // Hisob-kitob mashinaning o'z koordinatalarida bo'lishi uchun ota-obyektdan vaqtincha ajratamiz
  const parent = scene.parent;
  const saved = scene.matrix.clone();
  scene.parent = null;
  scene.matrix.identity();
  scene.matrixAutoUpdate = false;
  scene.updateMatrixWorld(true);

  const mats = {
    logo: decalMaterial(logoTexture(logo)),
    text: decalMaterial(textTexture()),
    plate: decalMaterial(plateTexture()),
  };
  const ray = new THREE.Raycaster();
  const dummy = new THREE.Object3D();
  const group = new THREE.Group();
  group.name = "pravaonline-branding";

  for (const p of PLACEMENTS) {
    ray.set(new THREE.Vector3(...p.from), new THREE.Vector3(...p.dir).normalize());
    const hit = ray.intersectObjects(body, false)[0];
    if (!hit || !hit.face) continue;
    const normal = hit.face.normal.clone().transformDirection(hit.object.matrixWorld);
    dummy.position.copy(hit.point);
    dummy.up.set(...p.up);
    dummy.lookAt(hit.point.clone().add(normal));
    const size = new THREE.Vector3(p.size[0], p.size[1], 0.4);
    // Decal bir necha kuzov bo'lagiga tushishi mumkin — har biriga alohida
    for (const m of body) {
      const geo = new DecalGeometry(m, hit.point, dummy.rotation, size);
      if (!geo.attributes.position || geo.attributes.position.count === 0) { geo.dispose(); continue; }
      // Ba'zi kuzov meshlarida normal yo'q (Draco siqilishida tushib qolgan) —
      // u holda decal ham normalsiz chiqadi va yorug'lik tushmay qop-qora ko'rinadi.
      if (!geo.attributes.normal) geo.computeVertexNormals();
      group.add(new THREE.Mesh(geo, mats[p.kind]));
    }
  }

  scene.add(group);
  scene.matrix.copy(saved);
  scene.matrixAutoUpdate = true;
  scene.parent = parent;
  scene.updateMatrixWorld(true);
}
