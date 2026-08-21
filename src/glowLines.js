import * as THREE from "three";

export function cubicWire(a, b, { pull = 0.42, lift = 0.2 } = {}) {
  const d = b.clone().sub(a);
  const c1 = a.clone().addScaledVector(d, pull);
  c1.y += lift;
  const c2 = b.clone().addScaledVector(d, -pull * 0.5);
  c2.y -= lift * 0.35;
  return new THREE.CubicBezierCurve3(a, c1, c2, b);
}

function toCurve(points) {
  return new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.15);
}

const pulseVert = `
  varying float vU;
  void main() {
    vU = uv.x;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const pulseFrag = `
  uniform vec3 uColor;
  uniform float uEnergy;
  uniform float uTime;
  varying float vU;
  void main() {
    float pulse = 0.28 + 0.72 * smoothstep(0.25, 1.0, 0.5 + 0.5 * sin(vU * 26.0 - uTime * 5.0));
    float a = (0.07 + uEnergy * 0.78) * pulse;
    gl_FragColor = vec4(uColor, a);
  }
`;

export function createGlowNetwork(scene) {
  const group = new THREE.Group();
  scene.add(group);
  const lines = new Map();
  const uniforms = [];

  function add(key, points, color, opts = {}) {
    const curve = toCurve(points);
    const segs = opts.segments ?? 56;
    const radius = opts.radius ?? 0.006;
    const col = new THREE.Color(color);
    const u = {
      uColor: { value: col },
      uEnergy: { value: opts.rest ?? 0.1 },
      uTime: { value: 0 },
    };
    uniforms.push(u);

    const mesh = new THREE.Mesh(
      new THREE.TubeGeometry(curve, segs, radius, 5, false),
      new THREE.ShaderMaterial({
        uniforms: u,
        vertexShader: pulseVert,
        fragmentShader: pulseFrag,
        transparent: true,
        depthWrite: false,
        toneMapped: false,
      })
    );
    mesh.frustumCulled = false;
    group.add(mesh);

    const handle = {
      key,
      mesh,
      u,
      energy: 0,
      rest: opts.rest ?? 0.1,
      peak: opts.peak ?? 0.95,
      apply() {
        this.u.uEnergy.value = this.rest + this.energy * (this.peak - this.rest);
      },
    };
    handle.apply();
    lines.set(key, handle);
    return handle;
  }

  function setEnergy(key, energy) {
    const line = lines.get(key);
    if (!line) return;
    line.energy = energy;
    line.apply();
  }

  function update(dt) {
    uniforms.forEach((u) => {
      u.uTime.value += dt;
    });
  }

  return { group, lines, add, setEnergy, update };
}
