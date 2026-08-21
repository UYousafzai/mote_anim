import * as THREE from "three";

export function hexColor(hex) {
  return new THREE.Color(hex);
}

export function tokenX(i, n, gap) {
  return (i - (n - 1) / 2) * gap;
}

export function expertPos(i, layerY, layout) {
  const n = layout.expertCount;
  const mid = (n - 1) / 2;
  const x = (i - mid) * (layout.expertSpread / (n - 1)) + (layout.expertShiftX || 0);
  const z = 0.18 * ((i - mid) / Math.max(mid, 1)) ** 2;
  return new THREE.Vector3(x, layerY + layout.expertY, z);
}

export function taskZ(ti, layout) {
  return (ti - 1) * layout.taskZ;
}

export function glowMat(color, opacity = 0.55) {
  return new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  });
}

export function darkGlass(color = 0x10182c, opacity = 0.22) {
  return new THREE.MeshStandardMaterial({
    color,
    metalness: 0.28,
    roughness: 0.42,
    transparent: true,
    opacity,
    envMapIntensity: 0.25,
  });
}

export function lineMat(color, opacity = 0.35) {
  return new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
}

export function makeCurve(a, b, lift = 1.2, side = 0) {
  const mid = a.clone().lerp(b, 0.5);
  mid.y += lift;
  mid.z += side;
  return new THREE.QuadraticBezierCurve3(a, mid, b);
}

export function disposeObject(obj) {
  obj.traverse((child) => {
    if (child.geometry) child.geometry.dispose();
    if (child.material) {
      const mats = Array.isArray(child.material) ? child.material : [child.material];
      mats.forEach((m) => m.dispose());
    }
  });
}
