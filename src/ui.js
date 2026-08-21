import { CHAPTERS, DURATION, EXPERTS } from "./config.js";

export function createUI() {
  const playBtn = document.getElementById("btn-play");
  const exploreBtn = document.getElementById("btn-explore");
  const caption = document.getElementById("caption");
  const chapterIdx = document.getElementById("chapter-idx");
  const fill = document.getElementById("scrub-fill");
  const scrub = document.getElementById("scrub");
  const legend = document.getElementById("legend");
  const list = document.getElementById("expert-list");
  const loader = document.getElementById("loader");

  EXPERTS.forEach((ex, i) => {
    const li = document.createElement("li");
    li.dataset.i = String(i);
    li.innerHTML = `<i style="background:${ex.color};color:${ex.color}"></i>${ex.name}`;
    list.appendChild(li);
  });

  caption.textContent = CHAPTERS[0].body;

  function hideLoader() {
    loader.classList.add("gone");
  }

  function setPlaying(playing) {
    playBtn.textContent = playing ? "Pause" : "Play";
  }

  function setExplore(on) {
    exploreBtn.classList.toggle("active", on);
    exploreBtn.textContent = on ? "Cinematic" : "Explore";
  }

  function highlight(indices) {
    [...list.children].forEach((li) => {
      li.classList.toggle("on", indices.includes(Number(li.dataset.i)));
    });
  }

  function tick(time, duration = DURATION) {
    const t = ((time % duration) + duration) % duration;
    fill.style.width = `${(t / duration) * 100}%`;
    let ch = CHAPTERS[0];
    let idx = 0;
    for (let i = 0; i < CHAPTERS.length; i++) {
      if (t >= CHAPTERS[i].t) {
        ch = CHAPTERS[i];
        idx = i;
      }
    }
    chapterIdx.textContent = String(idx + 1).padStart(2, "0");
    if (caption.textContent !== ch.body) caption.textContent = ch.body;
    legend.classList.toggle("visible", t >= 22 && t < 57);
  }

  return {
    playBtn,
    exploreBtn,
    scrub,
    hideLoader,
    setPlaying,
    setExplore,
    highlight,
    tick,
  };
}
