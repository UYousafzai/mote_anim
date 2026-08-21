import * as THREE from "three";
import { CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";
import { EXPERTS, LAYOUT } from "./config.js";
import { cubicWire } from "./glowLines.js";
import { darkGlass, expertPos, hexColor, lineMat } from "./utils.js";

function chassis(w, h, d, color, heavy = false) {
  const g = new THREE.Group();
  const t = heavy ? 0.045 : 0.032;
  const postMat = new THREE.MeshStandardMaterial({
    color: 0x152033,
    metalness: 0.55,
    roughness: 0.38,
  });
  const postGeo = new THREE.BoxGeometry(t, h, t);
  const hw = w * 0.5;
  const hd = d * 0.5;
  for (const x of [-hw, hw]) {
    for (const z of [-hd, hd]) {
      const post = new THREE.Mesh(postGeo, postMat);
      post.position.set(x, 0, z);
      g.add(post);
    }
  }
  g.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, d)), lineMat(color, heavy ? 0.5 : 0.22)));
  return g;
}

function makeLabel(text, cls = "label") {
  const el = document.createElement("div");
  el.className = cls;
  el.textContent = text;
  const obj = new CSS2DObject(el);
  obj.userData.el = el;
  return obj;
}

function sumNode() {
  const g = new THREE.Group();
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.16, 0.018, 10, 32),
    new THREE.MeshStandardMaterial({ color: 0xd7def4, metalness: 0.4, roughness: 0.35 })
  );
  g.add(ring);
  const label = makeLabel("+", "label sum-label");
  g.add(label);
  g.userData.node = ring;
  return g;
}

function block(w, h, d, color, title, detailed) {
  const g = new THREE.Group();
  const glass = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), darkGlass(0x0c1424, detailed ? 0.1 : 0.07));
  glass.material.depthWrite = false;
  g.add(glass);
  g.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, d)), lineMat(color, detailed ? 0.55 : 0.14)));
  if (detailed && title) {
    const label = makeLabel(title, "label expert-label");
    label.position.y = h * 0.62;
    g.add(label);
    g.userData.label = label;
  }
  return g;
}

function buildExpert(i, layerY, detailed) {
  const group = new THREE.Group();
  group.position.copy(expertPos(i, layerY, LAYOUT));
  const color = hexColor(EXPERTS[i].color);
  const heat = { value: EXPERTS[i].task ? 0.05 : 0.02 };
  const h = detailed ? 2.05 : 1.4;
  const w = detailed ? 1.05 : 0.62;
  const d = w * 0.72;
  const inner = block(w, h, d, color, EXPERTS[i].name, detailed);
  group.add(inner);

  const core = new THREE.Mesh(
    new THREE.CylinderGeometry(0.022, 0.022, h * 0.7, 10),
    new THREE.ShaderMaterial({
      uniforms: { uColor: { value: color }, uHeat: heat, uTime: { value: 0 } },
      transparent: true,
      depthWrite: false,
      toneMapped: false,
      vertexShader: `varying float vY; void main(){ vY=position.y; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: `
        uniform vec3 uColor; uniform float uHeat; uniform float uTime; varying float vY;
        void main(){
          float scan = 0.5 + 0.5 * sin(vY * 10.0 - uTime * 3.0);
          gl_FragColor = vec4(uColor, uHeat * (0.25 + 0.55 * scan));
        }`,
    })
  );
  group.add(core);
  group.userData = { ...inner.userData, heat, color, index: i, core, h };
  return group;
}

function buildSwitch(layerY, detailed) {
  const group = new THREE.Group();
  group.position.set(-1.2, layerY + LAYOUT.switchY, 0.1);
  group.add(block(4.2, 0.55, 1.6, hexColor("#e8c37a"), detailed ? "SWITCH" : "", detailed));
  const core = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.16, 0),
    new THREE.MeshStandardMaterial({
      color: 0xc9a35a,
      metalness: 0.8,
      roughness: 0.25,
      emissive: 0x8a6a30,
      emissiveIntensity: 0.12,
    })
  );
  core.position.y = 0.02;
  group.add(core);
  const dummyA = new THREE.Object3D();
  const dummyB = new THREE.Object3D();
  group.add(dummyA, dummyB);
  group.userData.core = core;
  group.userData.ringA = dummyA;
  group.userData.ringB = dummyB;
  return group;
}

function buildAttention(layerY, detailed) {
  const group = new THREE.Group();
  group.position.set(0, layerY + LAYOUT.attentionY, 0);
  group.add(chassis(11.2, 0.85, 4.6, 0x8b9ed9, detailed));
  if (detailed) {
    const n = makeLabel("NORM", "label layer-label");
    n.position.set(-5.6, 0.55, 0);
    const a = makeLabel("ATTENTION", "label layer-label");
    a.position.set(-5.6, 0.12, 0);
    group.add(n, a);
  }
  return group;
}

function wireHero(glow, spec, experts, shared, attnAdd, ffnAdd, sw) {
  const y = spec.y;
  const left = -8.35;
  const attn = new THREE.Vector3(0, y + LAYOUT.attentionY + 0.45, 0);
  const add1 = attnAdd.position.clone();
  const add2 = ffnAdd.position.clone();
  const swPos = sw.position.clone();
  swPos.y += 0.28;
  const sharedIn = shared.position.clone();
  sharedIn.y -= 1.0;
  const sharedOut = shared.position.clone();
  sharedOut.y += 1.0;
  const below = new THREE.Vector3(0, y + LAYOUT.attentionY - 0.7, 0);

  glow.add("res-attn", [below.clone().setX(left), add1.clone().setX(left), add1], "#9aa7c2", {
    rest: 0.16,
    peak: 0.55,
    radius: 0.005,
  });
  glow.add("attn-add", [attn, add1], "#8b9ed9", { rest: 0.14, peak: 0.7, radius: 0.005 });
  glow.add(
    "res-ffn",
    [add1.clone().setX(left), add2.clone().setX(left), add2],
    "#9aa7c2",
    { rest: 0.16, peak: 0.55, radius: 0.005 }
  );

  const norm2 = new THREE.Vector3(0, y + LAYOUT.norm2Y, 0);
  glow.add("to-switch", cubicWire(norm2, swPos, { pull: 0.3, lift: 0.1 }).getPoints(36), "#e8c37a", {
    rest: 0.12,
    peak: 0.85,
    radius: 0.006,
  });
  glow.add("to-shared", cubicWire(norm2, sharedIn, { pull: 0.35, lift: 0.15 }).getPoints(40), "#7dd3fc", {
    rest: 0.14,
    peak: 0.9,
    radius: 0.006,
  });
  glow.add("shared-out", cubicWire(sharedOut, add2, { pull: 0.28, lift: 0.1 }).getPoints(36), "#7dd3fc", {
    rest: 0.12,
    peak: 0.85,
    radius: 0.006,
  });

  experts.forEach((ex, i) => {
    const half = (ex.userData.h || 2) * 0.5;
    const entry = ex.position.clone();
    entry.y -= half;
    const exit = ex.position.clone();
    exit.y += half;
    glow.add(`route-${i}`, cubicWire(swPos, entry, { pull: 0.38, lift: 0.18 }).getPoints(40), EXPERTS[i].color, {
      rest: 0.08,
      peak: 0.95,
      radius: 0.006,
    });
    glow.add(`exit-${i}`, cubicWire(exit, add2, { pull: 0.3, lift: 0.12 }).getPoints(40), EXPERTS[i].color, {
      rest: 0.06,
      peak: 0.9,
      radius: 0.006,
    });
  });
}

function buildLayer(root, spec, index, glow) {
  const group = new THREE.Group();
  const h = LAYOUT.layerH;
  const frame = chassis(19.2, h, 5.4, spec.hero ? 0x7ec4e8 : 0x3a4a66, spec.hero);
  frame.position.set(0, spec.y + 1.2, 0);
  if (!spec.hero) frame.scale.set(0.92, 0.92, 0.92);
  group.add(frame);

  if (spec.hero) {
    const tag = makeLabel(`LAYER ${index + 1}  ·  MoTE DECODER`, "label layer-label");
    tag.position.set(-8.4, spec.y + h * 0.42, 2.0);
    group.add(tag);
  }

  const attention = buildAttention(spec.y, spec.hero);
  const router = buildSwitch(spec.y, spec.hero);
  group.add(attention, router);

  const attnAdd = sumNode();
  attnAdd.position.set(0, spec.y + LAYOUT.attnAddY, 0);
  group.add(attnAdd);

  const ffnAdd = sumNode();
  ffnAdd.position.set(0, spec.y + LAYOUT.combineY, 0);
  if (spec.hero) {
    const sl = makeLabel("Σ  expert + shared + residual", "label layer-label");
    sl.position.set(2.6, 0.28, 0);
    ffnAdd.add(sl);
  }
  group.add(ffnAdd);

  const experts = [];
  for (let i = 0; i < EXPERTS.length; i++) {
    const ex = buildExpert(i, spec.y, spec.hero);
    group.add(ex);
    experts.push(ex);
  }

  const shared = new THREE.Group();
  shared.position.set(LAYOUT.sharedX, spec.y + LAYOUT.sharedY, 0);
  const sh = spec.hero ? 2.05 : 1.4;
  shared.add(chassis(2.2, sh + 0.15, 1.25, hexColor("#7dd3fc"), spec.hero));
  const sharedGlass = new THREE.Mesh(
    new THREE.BoxGeometry(2.05, sh, 1.1),
    darkGlass(0x0c1424, spec.hero ? 0.07 : 0.05)
  );
  sharedGlass.material.depthWrite = false;
  shared.add(sharedGlass);
  if (spec.hero) {
    const sl = makeLabel("SHARED (FFN)", "label expert-label");
    sl.position.y = sh * 0.62;
    shared.add(sl);
    shared.userData.label = sl;
  }
  shared.userData = { ...shared.userData, heat: { value: 0.08 }, core: sharedGlass };
  group.add(shared);

  if (spec.hero) {
    const mote = chassis(13.4, 3.55, 3.4, 0xc4b5fd, false);
    mote.position.set(-1.35, spec.y + 1.45, 0);
    group.add(mote);
    const ml = makeLabel("MoTE", "label layer-label");
    ml.position.set(-6.8, spec.y + 3.05, 1.6);
    group.add(ml);
    wireHero(glow, spec, experts, shared, attnAdd, ffnAdd, router);
  }

  root.add(group);
  return {
    group,
    spec,
    attention,
    router,
    experts,
    shared,
    attnAdd,
    combine: ffnAdd,
    frame,
    beams: [],
  };
}

function buildPlate(y, title, w = 11) {
  const g = new THREE.Group();
  g.position.y = y;
  g.add(chassis(w, 0.55, 2.0, 0x6aa8d4, true));
  const label = makeLabel(title, "label layer-label");
  label.position.set(0, 0.48, 0);
  g.add(label);
  return g;
}

export function buildTransformer(scene, glow) {
  const root = new THREE.Group();
  scene.add(root);
  root.add(buildPlate(LAYOUT.embedY, "TOKEN EMBEDDING"));
  const layers = LAYOUT.layers.map((spec, i) => buildLayer(root, spec, i, glow));
  root.add(buildPlate(LAYOUT.outputY, "UNEMBED  ·  LOGITS", 12));
  return { root, layers, hero: layers[1] };
}
