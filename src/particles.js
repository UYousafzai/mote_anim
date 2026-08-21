import * as THREE from "three";
import { LAYOUT, TASKS } from "./config.js";
import { expertPos, makeCurve, taskZ } from "./utils.js";

const vert = `
  attribute float aAlpha;
  attribute float aSize;
  attribute vec3 aColor;
  varying float vAlpha;
  varying vec3 vColor;
  uniform float uPixel;
  void main() {
    vAlpha = aAlpha;
    vColor = aColor;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * (uPixel / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;

const frag = `
  varying float vAlpha;
  varying vec3 vColor;
  void main() {
    vec2 p = gl_PointCoord * 2.0 - 1.0;
    float d = dot(p, p);
    if (d > 1.0) discard;
    float g = exp(-d * 3.2);
    gl_FragColor = vec4(vColor, vAlpha * g);
  }
`;

export function createParticles(scene, heroY) {
  const paths = [];
  const router = new THREE.Vector3(0, heroY + LAYOUT.routerY, 0.12);
  const combine = new THREE.Vector3(0, heroY + LAYOUT.combineY, 0);

  TASKS.forEach((task, ti) => {
    const ex = expertPos(task.expert, heroY, LAYOUT);
    const from = new THREE.Vector3(0, router.y, taskZ(ti, LAYOUT));
    const entry = ex.clone();
    entry.y -= 0.9;
    const exit = ex.clone();
    exit.y += 0.95;
    paths.push({
      curve: makeCurve(from, entry, 0.35, 0),
      color: new THREE.Color(task.color),
      count: 24,
      active: 0,
      speed: 0.16,
      phase: Math.random(),
      key: `in-${ti}`,
    });
    paths.push({
      curve: makeCurve(exit, combine, 0.4, 0),
      color: new THREE.Color(task.color),
      count: 20,
      active: 0,
      speed: 0.15,
      phase: Math.random(),
      key: `out-${ti}`,
    });
  });

  for (let s = 0; s < 6; s++) {
    const z = taskZ(s % 3, LAYOUT) * 0.35;
    const x = (s - 2.5) * 0.9;
    paths.push({
      curve: makeCurve(
        new THREE.Vector3(x * 0.25, LAYOUT.embedY, z),
        new THREE.Vector3(x * 0.08, LAYOUT.outputY, z * 0.2),
        0,
        0
      ),
      color: new THREE.Color("#6aa8d4"),
      count: 16,
      active: 0.12,
      speed: 0.035 + s * 0.003,
      phase: Math.random(),
      key: `stack-${s}`,
    });
  }

  const total = paths.reduce((n, p) => n + p.count, 0);
  const pos = new Float32Array(total * 3);
  const col = new Float32Array(total * 3);
  const alpha = new Float32Array(total);
  const size = new Float32Array(total);

  let idx = 0;
  const BAKED = 48;
  const tmp = new THREE.Vector3();
  paths.forEach((p) => {
    p.offset = idx;
    p.baked = new Float32Array(BAKED * 3);
    for (let s = 0; s < BAKED; s++) {
      p.curve.getPoint(s / (BAKED - 1), tmp);
      p.baked[s * 3] = tmp.x;
      p.baked[s * 3 + 1] = tmp.y;
      p.baked[s * 3 + 2] = tmp.z;
    }
    for (let i = 0; i < p.count; i++) {
      size[idx] = 3.5 + Math.random() * 4;
      col[idx * 3] = p.color.r;
      col[idx * 3 + 1] = p.color.g;
      col[idx * 3 + 2] = p.color.b;
      idx++;
    }
  });

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("aColor", new THREE.BufferAttribute(col, 3));
  geo.setAttribute("aAlpha", new THREE.BufferAttribute(alpha, 1));
  geo.setAttribute("aSize", new THREE.BufferAttribute(size, 1));

  const mat = new THREE.ShaderMaterial({
    uniforms: { uPixel: { value: 380 } },
    vertexShader: vert,
    fragmentShader: frag,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  });

  const cloud = new THREE.Points(geo, mat);
  cloud.frustumCulled = false;
  scene.add(cloud);

  let time = 0;

  function setPrefix(prefix, amount) {
    paths.forEach((p) => {
      if (p.key.startsWith(prefix)) p.active = amount;
    });
  }

  function update(dt) {
    time += dt;
    const last = BAKED - 1;
    paths.forEach((p) => {
      if (p.active < 0.01) {
        for (let i = 0; i < p.count; i++) alpha[p.offset + i] = 0;
        return;
      }
      for (let i = 0; i < p.count; i++) {
        const t = (p.phase + i / p.count + time * p.speed) % 1;
        const f = t * last;
        const i0 = f | 0;
        const i1 = i0 === last ? last : i0 + 1;
        const u = f - i0;
        const a = i0 * 3;
        const b = i1 * 3;
        const j = p.offset + i;
        pos[j * 3] = p.baked[a] + (p.baked[b] - p.baked[a]) * u;
        pos[j * 3 + 1] = p.baked[a + 1] + (p.baked[b + 1] - p.baked[a + 1]) * u;
        pos[j * 3 + 2] = p.baked[a + 2] + (p.baked[b + 2] - p.baked[a + 2]) * u;
        alpha[j] = p.active * Math.sin(t * Math.PI);
      }
    });
    geo.attributes.position.needsUpdate = true;
    geo.attributes.aAlpha.needsUpdate = true;
  }

  return { cloud, paths, update, setPrefix };
}
