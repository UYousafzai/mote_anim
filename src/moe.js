import { ATTENTION, LAYOUT, TASKS } from "./config.js";
import { taskZ, tokenX } from "./utils.js";
import * as THREE from "three";

export function createAttentionArcs(glow, layerY) {
  const keys = [];
  const y = layerY + LAYOUT.attentionY + 0.2;

  TASKS.forEach((task, ti) => {
    const z = taskZ(ti, LAYOUT);
    const n = task.tokens.length;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < i; j++) {
        const w = ATTENTION[i]?.[j] ?? 0;
        if (w < 0.08) continue;
        const a = new THREE.Vector3(tokenX(i, n, LAYOUT.tokenGap), y, z);
        const b = new THREE.Vector3(tokenX(j, n, LAYOUT.tokenGap), y, z);
        const mid = a.clone().lerp(b, 0.5);
        mid.y += 0.08;
        mid.z += (0.35 + w * 0.7) * (ti === 1 ? 1 : ti === 0 ? -1 : 1);
        const pts = new THREE.QuadraticBezierCurve3(a, mid, b).getPoints(20);
        const key = `attn-${ti}-${i}-${j}`;
        glow.add(key, pts, task.color, {
          rest: 0,
          peak: 0.85,
          radius: 0.004,
          segments: 24,
        });
        keys.push(key);
      }
    }
  });

  return {
    keys,
    setAmount(v) {
      keys.forEach((k) => glow.setEnergy(k, v));
    },
  };
}
