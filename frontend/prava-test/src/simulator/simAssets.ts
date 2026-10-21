import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

/** Simulyatorda yuklangan model sahnalari — chiqishda bo'shatish uchun. */
const loadedScenes = new Set<THREE.Object3D>();

export function trackSimScene(scene: THREE.Object3D): void {
  loadedScenes.add(scene);
}

function disposeObject(root: THREE.Object3D) {
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    mesh.geometry?.dispose();
    const mats = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : [];
    for (const m of mats) {
      for (const v of Object.values(m)) if (v instanceof THREE.Texture) v.dispose();
      m.dispose();
    }
  });
}

/**
 * Simulyatordan chiqqanda: keshdagi modellar (avtodrom, mashina) geometriya/material/teksturalari
 * bo'shatiladi va drei keshidan olib tashlanadi (WebGL kontekstini R3F Canvas unmount'da o'zi yopadi).
 * Qayta kirilganda modellar qayta yuklanadi.
 */
export function releaseSimulatorAssets(urls: string[]): void {
  loadedScenes.forEach(disposeObject);
  loadedScenes.clear();
  for (const url of urls) useGLTF.clear(url);
}
