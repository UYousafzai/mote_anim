import * as THREE from "three";
import { CSS2DRenderer } from "three/addons/renderers/CSS2DRenderer.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

export function createScene(canvas) {
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x04060c, 0.012);
  scene.background = new THREE.Color(0x04060c);

  const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 220);
  camera.position.set(18, 14, 28);

  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: "high-performance",
    stencil: false,
  });
  renderer.setPixelRatio(dpr);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.95;
  renderer.shadowMap.enabled = false;

  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.06).texture;
  pmrem.dispose();

  const labels = new CSS2DRenderer();
  labels.domElement.style.position = "absolute";
  labels.domElement.style.inset = "0";
  labels.domElement.style.pointerEvents = "none";
  labels.domElement.style.zIndex = "2";
  canvas.parentElement.appendChild(labels.domElement);

  const look = new THREE.Object3D();
  look.position.set(0, 10, 0);
  scene.add(look);

  scene.add(new THREE.HemisphereLight(0x8aa0c8, 0x080a12, 0.42));
  const key = new THREE.DirectionalLight(0xdfe9ff, 0.85);
  key.position.set(12, 22, 14);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x5ce8ff, 0.28);
  rim.position.set(-18, 8, -10);
  scene.add(rim);

  const fill = new THREE.PointLight(0xffc14d, 0.0, 18, 2);
  fill.position.set(0, 8.6, 0.4);
  scene.add(fill);

  function resize() {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    labels.setSize(w, h);
  }

  window.addEventListener("resize", resize);
  resize();

  return { scene, camera, renderer, labels, look, fill };
}

export function createStars(scene) {
  const n = 500;
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const r = 42 + Math.random() * 70;
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(2 * Math.random() - 1);
    pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
    pos[i * 3 + 1] = r * Math.cos(ph) * 0.55 + 12;
    pos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const stars = new THREE.Points(
    geo,
    new THREE.PointsMaterial({
      color: 0xb9c9ff,
      size: 0.07,
      transparent: true,
      opacity: 0.4,
      depthWrite: false,
    })
  );
  scene.add(stars);
  return stars;
}

export function createFloor(scene) {
  const grid = new THREE.GridHelper(90, 24, 0x1c2a4a, 0x121a30);
  grid.position.y = -12.2;
  grid.material.transparent = true;
  grid.material.opacity = 0.14;
  scene.add(grid);
  return grid;
}
