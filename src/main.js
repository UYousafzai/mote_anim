import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { DURATION, TASK_BEATS, TASKS } from "./config.js";
import { createFloor, createScene, createStars } from "./scene.js";
import { createGlowNetwork } from "./glowLines.js";
import { buildTransformer } from "./transformer.js";
import { createTokens } from "./tokens.js";
import { createAttentionArcs } from "./moe.js";
import { createCinematic } from "./camera.js";
import { createUI } from "./ui.js";

const canvas = document.getElementById("c");
const { scene, camera, renderer, labels, look, fill } = createScene(canvas);

createStars(scene);
createFloor(scene);

const glow = createGlowNetwork(scene);
const { hero } = buildTransformer(scene, glow);
const tokens = createTokens(scene);
const arcs = createAttentionArcs(glow, hero.spec.y);
const ui = createUI();

const clock = new THREE.Clock();
let exploring = false;
let paused = false;

const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.enabled = false;
controls.maxDistance = 80;
controls.minDistance = 5;

const tl = createCinematic({ camera, look, fill, tokens, hero, arcs, glow });

function setExplore(on) {
  exploring = on;
  controls.enabled = on;
  ui.setExplore(on);
  if (on) {
    tl.pause();
    paused = true;
    ui.setPlaying(false);
    controls.target.copy(look.position);
  } else {
    controls.enabled = false;
    tl.play();
    paused = false;
    ui.setPlaying(true);
  }
}

ui.playBtn.addEventListener("click", () => {
  if (exploring) setExplore(false);
  paused = !paused;
  paused ? tl.pause() : tl.play();
  ui.setPlaying(!paused);
});

ui.exploreBtn.addEventListener("click", () => setExplore(!exploring));

ui.scrub.addEventListener("click", (e) => {
  const rect = ui.scrub.getBoundingClientRect();
  const p = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
  tl.progress(p);
  if (exploring) setExplore(false);
});

window.addEventListener("keydown", (e) => {
  if (e.code === "Space") {
    e.preventDefault();
    ui.playBtn.click();
  }
  if (e.key === "e" || e.key === "E") setExplore(!exploring);
  if (e.key === "ArrowRight") tl.time((tl.time() + 6) % DURATION);
  if (e.key === "ArrowLeft") tl.time((tl.time() - 6 + DURATION) % DURATION);
  if (e.key === "0") tl.time(0);
});

function animateCores(t) {
  hero.experts.forEach((ex) => {
    const mat = ex.userData.core?.material;
    if (mat?.uniforms) mat.uniforms.uTime.value = t;
  });
  const r = hero.router.userData.core;
  if (r) r.rotation.y = t * 0.55;
  tokens.items.forEach((tok, i) => {
    tok.ring.rotation.z = t * 1.15 + i;
  });
}

let legendKey = "";
function syncLegend() {
  const t = tl.time();
  const close = t >= 22 && t < 57;
  const showTok = t >= 7 && t < 54;
  let hi = "none";
  if (t >= 28.6 && t <= 53) {
    if (t >= 44) hi = "all";
    else {
      let idx = 0;
      for (const beat of TASK_BEATS) {
        if (t >= beat.t) idx = beat.task;
      }
      hi = String(idx);
    }
  }
  const key = `${close}|${showTok}|${hi}`;
  if (key === legendKey) return;
  legendKey = key;
  hero.experts.forEach((ex) => {
    ex.userData.label?.element.classList.toggle("dim", !close);
  });
  tokens.items.forEach((tok) => tok.label.element.classList.toggle("dim", !showTok));
  tokens.samples.forEach((s) => s.badgeEl.classList.toggle("dim", !showTok));
  if (hi === "none") ui.highlight([]);
  else if (hi === "all") ui.highlight(TASKS.map((task) => task.expert));
  else ui.highlight([TASKS[Number(hi)].expert]);
}

function frame() {
  requestAnimationFrame(frame);
  const dt = clock.getDelta();
  const t = clock.elapsedTime;
  animateCores(t);
  glow.update(dt);
  if (exploring) controls.update();
  else {
    tl.applyRig();
    camera.lookAt(look.position);
  }
  renderer.render(scene, camera);
  labels.render(scene, camera);
  ui.tick(tl.time());
  syncLegend();
}

tl.time(0);
ui.setPlaying(true);
requestAnimationFrame(() => {
  ui.hideLoader();
  frame();
});
