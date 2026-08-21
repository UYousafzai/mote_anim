import gsap from "gsap";
import { DURATION, LAYOUT, TASKS, TASK_BEATS } from "./config.js";
import { expertPos, taskZ } from "./utils.js";
import { rowTokens, stackGroups, stackTokens } from "./tokens.js";

const EXPERTS_IDLE = [3, 4];
const PULL = 1.26;

function polar(a, r, y) {
  return { x: Math.sin(a) * r, y, z: Math.cos(a) * r };
}

function pulled(x, y, z, lx, ly, lz) {
  return {
    x: lx + (x - lx) * PULL,
    y: ly + (y - ly) * PULL,
    z: lz + (z - lz) * PULL,
    lx,
    ly,
    lz,
  };
}

function moveSamples(tl, samples, y, t, dur, zScale = 1) {
  samples.forEach((s, i) => {
    tl.to(
      s.group.position,
      {
        x: 0,
        y,
        z: taskZ(s.ti, LAYOUT) * zScale,
        duration: dur,
        ease: "power2.inOut",
      },
      t + i * 0.07
    );
  });
}

function energy(tl, glow, key, value, dur, t) {
  const line = glow.lines.get(key);
  if (!line) return;
  tl.to(
    line,
    {
      energy: value,
      duration: dur,
      ease: "power2.out",
      onUpdate: () => line.apply(),
    },
    t
  );
}

export function createCinematic({ camera, look, fill, tokens, hero, arcs, glow }) {
  const samples = tokens.samples;
  const heroY = hero.spec.y;
  const orbit = { a: 0.58, r: 40.5, y: 17.4 };
  const orbitB = { a: -0.55, r: 23.2, y: 14.8 };

  const p0 = polar(orbit.a, orbit.r, orbit.y);
  const rig = { x: p0.x, y: p0.y, z: p0.z, lx: 0, ly: 13.5, lz: 0 };

  const applyRig = () => {
    camera.position.set(rig.x, rig.y, rig.z);
    look.position.set(rig.lx, rig.ly, rig.lz);
  };

  const tl = gsap.timeline({
    repeat: -1,
    defaults: { ease: "power2.inOut" },
    onUpdate: applyRig,
  });

  function camTo(vars, t, dur, ease = "power2.inOut") {
    tl.fromTo(
      rig,
      { x: vars._from.x, y: vars._from.y, z: vars._from.z, lx: vars._from.lx, ly: vars._from.ly, lz: vars._from.lz },
      {
        x: vars.x,
        y: vars.y,
        z: vars.z,
        lx: vars.lx,
        ly: vars.ly,
        lz: vars.lz,
        duration: dur,
        ease,
        immediateRender: false,
        overwrite: "auto",
      },
      t
    );
  }

  samples.forEach((s) => {
    s.group.position.set(0, LAYOUT.embedY + 0.55, taskZ(s.ti, LAYOUT));
    s.group.scale.set(1, 1, 1);
    s.shared.visible = false;
    s.shared.position.copy(s.group.position);
    s.shared.scale.set(1, 1, 1);
  });
  hero.experts.forEach((ex, i) => {
    ex.userData.heat.value = i < 3 ? 0.05 : 0.02;
  });
  arcs.setAmount(0);
  applyRig();

  tl.to(
    orbit,
    {
      a: 1.48,
      r: 36.8,
      y: 19.2,
      duration: 7.2,
      ease: "none",
      onUpdate: () => {
        const p = polar(orbit.a, orbit.r, orbit.y);
        rig.x = p.x;
        rig.y = p.y;
        rig.z = p.z;
      },
    },
    0
  );
  tl.to(fill, { intensity: 0.15, duration: 2 }, 0);

  const afterOrbit = { ...polar(1.48, 36.8, 19.2), lx: 0, ly: 13.5, lz: 0 };
  const tokensShot = pulled(1.2, -3.2, 16.5, 0, -5.2, 0);
  camTo({ _from: afterOrbit, ...tokensShot }, 7.2, 2.5);

  moveSamples(tl, samples, LAYOUT.layers[0].y + LAYOUT.attentionY, 8.8, 1.8, 1);

  const attnLow = pulled(8.2, -2.4, 13.5, 0, LAYOUT.layers[0].y + LAYOUT.attentionY, 0);
  camTo({ _from: tokensShot, ...attnLow }, 9.7, 2.5);

  const heroAttn = pulled(10.8, 6.8, 13.2, 0, 6.3, 0);
  camTo({ _from: attnLow, ...heroAttn }, 12.2, 3.6);
  moveSamples(tl, samples, heroY + LAYOUT.attentionY + 0.15, 12.6, 2.0, 1);

  const attn = { a: 0 };
  tl.to(attn, { a: 1, duration: 2.2, ease: "power2.out", onUpdate: () => arcs.setAmount(attn.a) }, 15.0);

  const truck = pulled(-10.6, 7.4, 11.5, 0.3, 6.4, 0);
  camTo({ _from: heroAttn, ...truck }, 15.8, 5.6, "power1.inOut");
  tl.to(attn, { a: 0.12, duration: 1.1, onUpdate: () => arcs.setAmount(attn.a) }, 22.0);

  moveSamples(tl, samples, heroY + LAYOUT.attnAddY, 22.4, 1.2, 0.85);
  energy(tl, glow, "res-attn", 1, 0.4, 22.5);
  energy(tl, glow, "attn-add", 1, 0.4, 22.5);

  moveSamples(tl, samples, heroY + LAYOUT.norm2Y, 24.0, 1.15, 0.75);
  const mote = pulled(0.6, 12.6, 20.2, 0, 10.4, 0);
  camTo({ _from: truck, ...mote }, 21.4, 3.2);

  energy(tl, glow, "to-shared", 1, 0.45, 25.4);
  energy(tl, glow, "to-switch", 1, 0.45, 25.4);
  energy(tl, glow, "res-ffn", 0.7, 0.4, 25.6);

  samples.forEach((s, i) => {
    tl.set(s.shared.position, { x: 0, y: heroY + LAYOUT.norm2Y, z: taskZ(i, LAYOUT) * 0.75 }, 25.5);
    tl.set(s.shared, { visible: true }, 25.5);
    tl.to(
      s.shared.position,
      {
        x: LAYOUT.sharedX + (i - 1) * 0.48,
        y: heroY + LAYOUT.sharedY,
        z: 0,
        duration: 1.35,
        ease: "power2.inOut",
      },
      25.55 + i * 0.05
    );
    stackGroups(tl, s.sharedToks, 25.55 + i * 0.05, 0.9);
  });
  energy(tl, glow, "shared-out", 0.85, 0.4, 26.8);

  moveSamples(tl, samples, heroY + LAYOUT.switchY, 26.2, 1.2, 0.55);
  const hold = pulled(5.2, 9.7, 10.2, 0, heroY + LAYOUT.switchY, 0);
  camTo({ _from: mote, ...hold }, 24.6, 2.6);

  TASK_BEATS.forEach((beat) => {
    const task = TASKS[beat.task];
    const s = samples[beat.task];
    const t0 = beat.t;
    const ex = expertPos(task.expert, heroY, LAYOUT);

    EXPERTS_IDLE.forEach((i) => energy(tl, glow, `route-${i}`, 0.05, 0.25, t0));
    energy(tl, glow, `route-${task.expert}`, 1, 0.45, t0);
    tl.to(hero.experts[task.expert].userData.heat, { value: 0.7, duration: 0.4 }, t0 + 0.12);

    const park = { x: ex.x, y: ex.y, z: ex.z };
    tl.to(s.group.position, { ...park, duration: 1.3, ease: "power2.inOut" }, t0 + 0.25);
    stackTokens(tl, s.tokens, t0 + 0.25, 0.85);
    tl.set(s.badge, { visible: false }, t0 + 0.45);
  });

  const orbitBStart = { ...polar(orbitB.a, orbitB.r, orbitB.y), lx: 0, ly: heroY + LAYOUT.expertY, lz: 0 };
  camTo({ _from: hold, ...orbitBStart }, 44.2, 1.9);
  tl.to(
    orbitB,
    {
      a: 1.05,
      r: 21.6,
      y: 15.4,
      duration: 5.0,
      ease: "none",
      onUpdate: () => {
        const p = polar(orbitB.a, orbitB.r, orbitB.y);
        rig.x = p.x;
        rig.y = p.y;
        rig.z = p.z;
      },
    },
    46.1
  );

  const combineY = heroY + LAYOUT.combineY;
  samples.forEach((s, i) => {
    const task = TASKS[i];
    energy(tl, glow, `exit-${task.expert}`, 0.95, 0.4, 51.15);
    tl.to(s.group.position, { x: 0, y: combineY, z: taskZ(i, LAYOUT) * 0.35, duration: 1.25 }, 51.25 + i * 0.05);
    rowTokens(tl, s.tokens, 51.25 + i * 0.05, 0.9);
    tl.set(s.badge, { visible: true }, 51.5 + i * 0.05);
    tl.to(s.shared.position, { x: 0, y: combineY, z: 0, duration: 1.15 }, 51.25 + i * 0.05);
    tl.to(s.shared.scale, { x: 1, y: 1, z: 1, duration: 1.0 }, 51.3 + i * 0.05);
    tl.set(s.shared, { visible: false }, 52.55 + i * 0.04);
    energy(tl, glow, `route-${task.expert}`, 0.1, 0.6, 52.6);
    tl.to(hero.experts[task.expert].userData.heat, { value: 0.08, duration: 0.6 }, 52.6);
  });

  const afterB = { ...polar(1.05, 21.6, 15.4), lx: 0, ly: heroY + LAYOUT.expertY, lz: 0 };
  const combine = pulled(3.6, 14.4, 10.8, 0, combineY, 0);
  camTo({ _from: afterB, ...combine }, 51.1, 1.8);
  const combineNode = hero.combine.userData.node;
  tl.to(combineNode.scale, { x: 1.25, y: 1.25, z: 1.25, duration: 0.3 }, 52.5);
  tl.to(combineNode.scale, { x: 1, y: 1, z: 1, duration: 0.35 }, 52.85);

  moveSamples(tl, samples, LAYOUT.layers[2].y + 1, 54.2, 1.3, 0.85);
  moveSamples(tl, samples, LAYOUT.layers[3].y + 1, 56.0, 1.2, 0.8);
  moveSamples(tl, samples, LAYOUT.outputY + 0.5, 57.6, 1.3, 0.55);

  const wide = pulled(18, 19.5, 34, 0, 14.5, 0);
  camTo({ _from: combine, ...wide }, 57.6, 2.4);

  const finale = { a: Math.atan2(wide.x, wide.z), r: Math.hypot(wide.x, wide.z), y: wide.y };
  tl.to(
    finale,
    {
      a: 1.52,
      r: 44,
      y: 18.6,
      duration: 8.0,
      ease: "none",
      onUpdate: () => {
        const p = polar(finale.a, finale.r, finale.y);
        rig.x = p.x;
        rig.y = p.y;
        rig.z = p.z;
      },
    },
    60.0
  );
  tl.to(rig, { ly: 13, duration: 8.0, ease: "none" }, 60.0);
  tl.to(fill, { intensity: 0.12, duration: 2 }, 60.0);

  tl.to({}, { duration: 0.05 }, DURATION);
  tl.eventCallback("onRepeat", () => {
    samples.forEach((s) => {
      s.group.scale.set(1, 1, 1);
      s.badge.visible = true;
      s.shared.visible = false;
      s.shared.scale.set(1, 1, 1);
      s.tokens.forEach((tok) => {
        tok.group.position.set(tok.homeX, 0, 0);
        tok.label.position.set(0, 0.16, 0);
      });
      s.sharedToks.forEach((g, i) => {
        g.position.set(s.tokens[i].homeX, 0, 0);
      });
    });
    orbit.a = 0.58;
    orbit.r = 40.5;
    orbit.y = 17.4;
  });

  tl.applyRig = applyRig;
  return tl;
}
