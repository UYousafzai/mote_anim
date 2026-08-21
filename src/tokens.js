import * as THREE from "three";
import { CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";
import { LAYOUT, TASKS } from "./config.js";
import { glowMat, hexColor, taskZ, tokenX } from "./utils.js";

const STACK_GAP = 0.34;

function makeToken(spec) {
  const group = new THREE.Group();
  group.position.x = tokenX(spec.i, spec.n, LAYOUT.tokenGap);
  const color = hexColor(spec.color);

  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.072, 10, 10),
    new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.22,
      metalness: 0.25,
      roughness: 0.38,
    })
  );
  group.add(core);

  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.005, 6, 16), glowMat(color, 0.22));
  ring.rotation.x = Math.PI / 2;
  group.add(ring);

  const el = document.createElement("div");
  el.className = "label token-label";
  el.textContent = spec.text;
  const label = new CSS2DObject(el);
  label.position.y = 0.16;
  group.add(label);

  group.traverse((ch) => {
    if (ch.isMesh) ch.renderOrder = 3;
  });

  return {
    group,
    spec,
    homeX: group.position.x,
    ring,
    label,
  };
}

export function stackTokens(tl, tokens, t, dur = 0.7) {
  const n = tokens.length;
  tokens.forEach((tok, i) => {
    tl.to(
      tok.group.position,
      {
        x: 0,
        y: ((n - 1) / 2 - i) * STACK_GAP,
        z: 0,
        duration: dur,
        ease: "power2.inOut",
      },
      t
    );
    tl.to(tok.label.position, { x: 0.2, y: 0, z: 0, duration: dur * 0.8, ease: "power2.inOut" }, t);
  });
}

export function rowTokens(tl, tokens, t, dur = 0.7) {
  tokens.forEach((tok) => {
    tl.to(
      tok.group.position,
      { x: tok.homeX, y: 0, z: 0, duration: dur, ease: "power2.inOut" },
      t
    );
    tl.to(tok.label.position, { x: 0, y: 0.16, z: 0, duration: dur * 0.8, ease: "power2.inOut" }, t);
  });
}

export function stackGroups(tl, groups, t, dur = 0.7) {
  const n = groups.length;
  groups.forEach((g, i) => {
    tl.to(
      g.position,
      {
        x: 0,
        y: ((n - 1) / 2 - i) * STACK_GAP,
        z: 0,
        duration: dur,
        ease: "power2.inOut",
      },
      t
    );
  });
}

export function createTokens(scene) {
  const root = new THREE.Group();
  scene.add(root);

  const samples = TASKS.map((task, ti) => {
    const group = new THREE.Group();
    group.position.set(0, LAYOUT.embedY + 0.55, taskZ(ti, LAYOUT));
    root.add(group);

    const badgeEl = document.createElement("div");
    badgeEl.className = "label task-badge";
    badgeEl.textContent = task.name;
    badgeEl.style.color = task.color;
    const badge = new CSS2DObject(badgeEl);
    badge.position.set(-task.tokens.length * LAYOUT.tokenGap * 0.5 - 0.7, 0.12, 0);
    group.add(badge);

    const tokens = task.tokens.map((text, i) => {
      const spec = { text, color: task.color, task: ti, expert: task.expert, i, n: task.tokens.length };
      const tok = makeToken(spec);
      group.add(tok.group);
      tok.sample = ti;
      return tok;
    });

    const shared = group.clone();
    shared.traverse((ch) => {
      if (ch.isCSS2DObject) ch.visible = false;
      if (ch.material) {
        ch.material = ch.material.clone();
        if ("opacity" in ch.material) {
          ch.material.transparent = true;
          ch.material.opacity = 0.45;
        }
        if ("emissiveIntensity" in ch.material) ch.material.emissiveIntensity = 0.08;
      }
    });
    shared.visible = false;
    root.add(shared);
    const sharedToks = shared.children.filter((ch) => ch.type === "Group");

    return { group, shared, sharedToks, task, ti, expert: task.expert, badge, badgeEl, tokens };
  });

  const items = samples.flatMap((s) => s.tokens);

  function reset() {
    samples.forEach((s) => {
      s.group.position.set(0, LAYOUT.embedY + 0.55, taskZ(s.ti, LAYOUT));
    });
  }

  return { root, samples, items, reset };
}
