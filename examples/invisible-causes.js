// Page runtime for "The Statistical Geometry of Invisible Causes".
// The script lives in the HTML. Each chapter names a scene; each beat names a
// moment in that scene's timeline. Scrolling to a beat plays its moment.
import { ensureMathJax } from "./mathjax.js";
import { scenes } from "./invisible-causes-scenes.js";

const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const reduced = matchMedia("(prefers-reduced-motion: reduce)");
const stageHost = $("#stage");
const labelLayer = $("#labels");
const beats = $$(".beat");
const chaptersEls = $$("[data-scene]");

let current = null, // { name, built, host }
  loading = null,
  active = null,
  stopAt = null,
  generation = 0,
  watching = null;

for (const beat of beats) {
  const chapter = beat.closest("[data-scene]");
  beat.dataset.sceneName = chapter.dataset.scene;
}

// ------------------------------------------------------------ scene lifecycle

async function load(name) {
  if (current?.name === name) return current;
  if (loading?.name === name) return loading.promise;
  const id = ++generation;
  const host = document.createElement("div");
  host.className = "scene-host";
  stageHost.append(host);
  $("#dock").dataset.loading = "true";
  const promise = (async () => {
    const built = await scenes[name](host);
    if (id !== generation) {
      built.scene.dispose();
      host.remove();
      return null;
    }
    const previous = current;
    current = { name, built, host };
    built.scene.onUpdate(onSceneUpdate);
    buildLabels(built);
    requestAnimationFrame(() => host.classList.add("visible"));
    if (previous) {
      previous.host.classList.remove("visible");
      setTimeout(() => {
        previous.built.scene.dispose();
        previous.host.remove();
      }, 450);
    }
    window.storyScene = built.scene;
    window.storyBeats = built.beats;
    window.storySceneName = name;
    $("#dock").dataset.loading = "false";
    $("#stage-error").hidden = true;
    return current;
  })();
  loading = { name, promise };
  try {
    return await promise;
  } catch (error) {
    console.error(error);
    showError(error);
    host.remove();
    return null;
  } finally {
    if (loading?.promise === promise) loading = null;
  }
}

function showError(error) {
  $("#dock").dataset.loading = "false";
  $("#stage-error").hidden = false;
  $("#stage-error").textContent = /is not a function/.test(error.message)
    ? `This page loaded an older cached copy of rhyform-3d.js (${error.message}). Reload without the cache to see the scene.`
    : `This scene could not load (${error.message}). The script still reads in full.`;
}

function onSceneUpdate(scene) {
  if (stopAt !== null && scene.playing && scene.currentTime >= stopAt - 1e-3) {
    const target = stopAt;
    stopAt = null;
    queueMicrotask(() => {
      if (!scene.disposed) scene.seek(target);
      finishBeat();
    });
  }
  updateReadout();
}

// ------------------------------------------------------------ beats

async function activate(el) {
  if (active?.el === el) return;
  const name = el.dataset.sceneName,
    beatName = el.dataset.beat;
  const previous = active;
  active = { el, done: false };
  $$(".beat.is-active").forEach((b) => b.classList.remove("is-active"));
  el.classList.add("is-active");
  setChapterHud(el);
  if (previous?.el) resetPanel(previous.el);
  unmountPanel();
  const scene = await load(name);
  if (!scene || active?.el !== el) return;
  const { built } = scene;
  const beat = built.beats.find((b) => b.name === beatName);
  if (!beat) {
    console.warn(`Beat ${beatName} is missing from scene ${name}`);
    return;
  }
  active.beat = beat;
  active.built = built;
  mountPanel(el, built);
  const s = built.scene;
  const continuing =
    previous?.beat &&
    previous.built === built &&
    Math.abs(s.currentTime - beat.start) < 0.05;
  if (reduced.matches || beat.end - beat.start < 0.02) {
    s.seek(beat.end);
    finishBeat();
    return;
  }
  if (!continuing) s.seek(beat.start);
  stopAt = beat.end;
  s.resume();
}

function finishBeat() {
  if (!active) return;
  active.done = true;
  active.el.classList.add("is-done");
  active.resolve?.();
}

function replay() {
  if (!active?.beat) return;
  const s = active.built.scene;
  s.camera.resetView();
  s.seek(active.beat.start);
  stopAt = active.beat.end;
  s.resume();
}

function setChapterHud(el) {
  const chapter = el.closest("[data-scene]");
  $("#hud-kicker").textContent = chapter.dataset.kicker ?? "";
  $("#hud-title").textContent = chapter.dataset.title ?? "";
  const index = chaptersEls.indexOf(chapter);
  $$("#toc a").forEach((a, i) => a.toggleAttribute("aria-current", i === index));
  const all = beats.indexOf(el);
  $("#progress-bar").style.setProperty(
    "--progress",
    `${(100 * (all + 1)) / beats.length}%`,
  );
}

// Beats become active when they cross a reading line. A short settle delay means a
// fast flick through several beats loads only the one the reader lands on.
let observer, settle;
function observe() {
  observer?.disconnect();
  const narrow = matchMedia("(max-width: 900px)").matches;
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries)
        if (entry.isIntersecting) {
          clearTimeout(settle);
          const target = entry.target;
          settle = setTimeout(() => activate(target), watching ? 0 : 140);
        }
    },
    { rootMargin: narrow ? "-74% 0px -25% 0px" : "-46% 0px -53% 0px" },
  );
  beats.forEach((b) => observer.observe(b));
}

// ------------------------------------------------------------ panels

// Controls live where the reader's eyes are: docked over the stage on wide screens,
// and just under the beat's "Try it" line on phones, where the stage sits above.
let panelEl = null,
  panelCleanup = [];
const narrowQuery = matchMedia("(max-width: 900px)");
function mountPanel(el, built) {
  unmountPanel();
  const spec = built.panels[el.dataset.beat];
  if (!spec) return;
  const panel = document.createElement("div");
  panel.className = "panel";
  panel.setAttribute("role", "group");
  panel.setAttribute("aria-label", "Interactive controls for this passage");
  const title = document.createElement("p");
  title.className = "panel-title";
  title.textContent = "Try it";
  panel.append(title);
  for (const p of spec.params ?? []) {
    const row = document.createElement("label");
    row.className = "slider";
    const name = document.createElement("span");
    name.className = "slider-name";
    name.innerHTML = p.label ?? p.name;
    const input = document.createElement("input");
    Object.assign(input, { type: "range", min: p.min, max: p.max, step: p.step });
    input.setAttribute("aria-label", name.textContent);
    const out = document.createElement("output");
    const format = p.format ?? ((v) => v.toFixed(p.step < 0.1 ? 2 : 1));
    const show = () => {
      input.value = p.value;
      out.textContent = format(p.value);
      input.setAttribute("aria-valuetext", out.textContent);
      input.style.setProperty("--fill", `${(100 * (p.value - p.min)) / (p.max - p.min)}%`);
    };
    const change = () => {
      p.value = Number(input.value);
      show();
      updateReadout();
    };
    input.addEventListener("input", change);
    panelCleanup.push(p.subscribe(show));
    show();
    row.append(name, input, out);
    panel.append(row);
  }
  const row = document.createElement("div");
  row.className = "presets";
  for (const preset of spec.presets ?? []) {
    const b = document.createElement("button");
    b.type = "button";
    b.innerHTML = preset.label;
    b.addEventListener("click", () => {
      for (const [param, value] of preset.set) param.value = value;
      updateReadout();
    });
    row.append(b);
  }
  const reset = document.createElement("button");
  reset.type = "button";
  reset.className = "panel-reset";
  reset.textContent = "Reset";
  reset.addEventListener("click", () => resetPanel(el));
  row.append(reset);
  panel.append(row);
  const readout = document.createElement("p");
  readout.className = "readout";
  readout.setAttribute("aria-live", "polite");
  panel.append(readout);
  panelEl = panel;
  placePanel();
  updateReadout();
}
function placePanel() {
  if (!panelEl || !active?.el) return;
  if (narrowQuery.matches) {
    const anchor = $(".try", active.el) ?? $("p", active.el);
    anchor.after(panelEl);
    $("#dock").style.removeProperty("--stage-bottom");
  } else {
    $("#dock-panel").append(panelEl);
    // Reframe the stage above the docked panel instead of letting it cover the scene.
    $("#dock").style.setProperty("--stage-bottom", `${panelEl.offsetHeight + 76}px`);
  }
  requestAnimationFrame(() => panelEl?.classList.add("shown"));
}
function unmountPanel() {
  panelCleanup.splice(0).forEach((off) => off());
  panelEl?.remove();
  panelEl = null;
  $("#dock").style.removeProperty("--stage-bottom");
}
function resetPanel(el) {
  const spec = current?.built.panels[el.dataset.beat];
  if (!spec) return;
  for (const p of spec.params ?? []) if (p.value !== p.initial) p.value = p.initial;
  updateReadout();
}
function updateReadout() {
  if (!active?.built || !panelEl) return;
  const spec = active.built.panels[active.el.dataset.beat];
  if (spec?.readout) $(".readout", panelEl).innerHTML = spec.readout();
}
narrowQuery.addEventListener("change", placePanel);

// ------------------------------------------------------------ labels

let labelNodes = [];
function setLabelContent(entry, html) {
  entry.html = html;
  const span = entry.span;
  span.innerHTML = "";
  if (entry.item.tex && window.MathJax?.tex2svg)
    span.append(MathJax.tex2svg(html, { display: false }));
  else span.innerHTML = html;
  entry.size = null;
}
function buildLabels(built) {
  labelLayer.innerHTML = "";
  labelNodes = built.labels.map((item, order) => {
    const node = document.createElement("div");
    node.className = `label ${item.cls}`;
    const span = document.createElement("span");
    node.append(span);
    labelLayer.append(node);
    const entry = { item, node, span, order, html: null, size: null, shown: false };
    if (typeof item.html !== "function") setLabelContent(entry, item.html);
    return entry;
  });
}
// Labels are placed like captions: pinned to their 3D point when there is room,
// nudged to the nearest free spot when they would collide, and always kept inside
// the stage, clear of the chapter title and the replay control.
const CANDIDATES = [
  [0, 0], [0, -1], [0, 1], [1, 0], [-1, 0], [1, -1], [-1, -1], [1, 1], [-1, 1], [0, -2], [0, 2],
];
function drawLabels() {
  requestAnimationFrame(drawLabels);
  if (!current || current.built.scene.disposed) return;
  const s = current.built.scene,
    t = s.currentTime,
    visibleHost = current.host.classList.contains("visible");
  const W = labelLayer.clientWidth,
    H = labelLayer.clientHeight;
  const narrow = W < 560;
  const top = $(".hud").getBoundingClientRect().bottom - labelLayer.getBoundingClientRect().top + 6;
  const docked = !!$("#dock").style.getPropertyValue("--stage-bottom");
  const bottom = H - (docked ? 10 : narrow ? 44 : 58);
  const placed = [];
  for (const entry of labelNodes) {
    const { item, node } = entry;
    // Labels stay through the paused end of their beat and fade early in the next one.
    const fade = Math.min((t - item.from) / 0.35 + (t >= item.from ? 0.001 : 0), 1 - (t - item.to) / 0.35);
    let opacity = visibleHost ? Math.max(0, Math.min(1, fade)) : 0;
    if (narrow && item.cls.includes("soft")) opacity = 0;
    if (opacity <= 0) {
      if (entry.shown) {
        node.style.opacity = "0";
        entry.shown = false;
      }
      continue;
    }
    if (typeof item.html === "function") {
      const html = item.html();
      if (html !== entry.html) setLabelContent(entry, html);
    }
    const at = typeof item.at === "function" ? item.at() : item.at;
    const p = s.project(at);
    if (!p.visible) {
      node.style.opacity = "0";
      entry.shown = false;
      continue;
    }
    if (!entry.size || !entry.shown) entry.size = [entry.span.offsetWidth, entry.span.offsetHeight];
    const [w, h] = entry.size;
    const pad = 4;
    let best = null;
    for (const [dx, dy] of CANDIDATES) {
      let x = p.x + dx * (w / 2 + 10),
        y = p.y + dy * (h + 4);
      x = Math.max(w / 2 + 8, Math.min(W - w / 2 - 8, x));
      y = Math.max(top + h / 2, Math.min(bottom - h / 2, y));
      const box = [x - w / 2 - pad, y - h / 2 - pad, x + w / 2 + pad, y + h / 2 + pad];
      const hit = placed.some((b) => box[0] < b[2] && box[2] > b[0] && box[1] < b[3] && box[3] > b[1]);
      if (!hit) {
        best = { x, y, box };
        break;
      }
      best ??= { x, y, box, crowded: true };
    }
    placed.push(best.box);
    node.style.opacity = String(best.crowded ? opacity * 0.35 : opacity);
    node.style.transform = `translate(${best.x.toFixed(1)}px, ${best.y.toFixed(1)}px)`;
    entry.shown = true;
  }
}

// ------------------------------------------------------------ watch mode

const synth = window.speechSynthesis;
function pickVoice() {
  const voices = synth?.getVoices() ?? [];
  const preferred = ["Daniel", "Samantha", "Google UK English Male", "Karen", "Moira", "Alex"];
  for (const name of preferred) {
    const v = voices.find((voice) => voice.name.startsWith(name) && voice.lang.startsWith("en"));
    if (v) return v;
  }
  return voices.find((v) => v.lang.startsWith("en")) ?? null;
}
function speak(text, signal) {
  return new Promise((resolve) => {
    if (!synth || !$("#voice").checked) return resolve();
    const u = new SpeechSynthesisUtterance(text);
    u.voice = pickVoice();
    u.rate = 1.02;
    u.onend = u.onerror = () => resolve();
    signal.addEventListener("abort", () => {
      synth.cancel();
      resolve();
    });
    synth.speak(u);
  });
}
const wait = (ms, signal) =>
  new Promise((resolve) => {
    const id = setTimeout(resolve, ms);
    signal.addEventListener("abort", () => {
      clearTimeout(id);
      resolve();
    });
  });

async function watch() {
  if (watching) return stopWatching();
  const controller = new AbortController();
  watching = controller;
  document.body.dataset.watching = "true";
  $("#watch").setAttribute("aria-pressed", "true");
  $("#watch-label").textContent = "Stop";
  let index = Math.max(0, beats.indexOf(active?.el ?? beats[0]));
  try {
    while (index < beats.length && !controller.signal.aborted) {
      const el = beats[index];
      scrollToBeat(el);
      await wait(700, controller.signal);
      await activate(el);
      const text = $$("p, blockquote, li", el)
        .filter((p) => !p.closest(".panel"))
        .map((p) => p.textContent.trim())
        .join(" ");
      const words = text.split(/\s+/).length;
      const beatDone = new Promise((resolve) => {
        if (active?.done) resolve();
        else if (active) active.resolve = resolve;
      });
      const reading = $("#voice").checked && synth
        ? speak(text, controller.signal)
        : wait(Math.max(3500, (words / 4.2) * 1000), controller.signal);
      await Promise.all([reading, Promise.race([beatDone, wait(30000, controller.signal)])]);
      await wait(panelEl ? 2200 : 600, controller.signal);
      index++;
    }
  } finally {
    if (watching === controller) stopWatching();
  }
}
function stopWatching() {
  watching?.abort();
  watching = null;
  synth?.cancel();
  delete document.body.dataset.watching;
  $("#watch").setAttribute("aria-pressed", "false");
  $("#watch-label").textContent = "Watch";
}
let programmaticScroll = 0;
function scrollToBeat(el) {
  programmaticScroll = performance.now();
  const narrow = matchMedia("(max-width: 900px)").matches;
  const rect = el.getBoundingClientRect();
  const line = innerHeight * (narrow ? 0.74 : 0.46);
  window.scrollTo({
    top: scrollY + rect.top - line + Math.min(rect.height * 0.25, 60),
    behavior: reduced.matches ? "auto" : "smooth",
  });
}
for (const type of ["wheel", "touchstart"])
  addEventListener(type, () => watching && stopWatching(), { passive: true });
addEventListener("keydown", (e) => {
  if (watching && ["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Space", "Escape"].includes(e.code))
    stopWatching();
});

// ------------------------------------------------------------ start

$("#watch").addEventListener("click", watch);
$("#replay").addEventListener("click", replay);
$$("#toc a").forEach((a) =>
  a.addEventListener("click", (event) => {
    const target = document.querySelector(a.getAttribute("href"));
    const first = target?.querySelector(".beat");
    if (!first) return;
    event.preventDefault();
    scrollToBeat(first);
  }),
);
if (!synth) $("#voice-row").hidden = true;

try {
  await ensureMathJax();
} catch (error) {
  console.warn(error);
}
document.body.classList.add("ready");
// Passages ease in once as they reach the reader, rather than all being present at once.
const reveal = new IntersectionObserver(
  (entries) => {
    for (const entry of entries)
      if (entry.isIntersecting) {
        entry.target.classList.add("seen");
        reveal.unobserve(entry.target);
      }
  },
  { rootMargin: "0px 0px -8% 0px" },
);
$$(".beat > *, .chapter-head > *").forEach((el, i) => {
  el.classList.add("reveal");
  el.style.setProperty("--delay", `${(i % 4) * 60}ms`);
  reveal.observe(el);
});
observe();
matchMedia("(max-width: 900px)").addEventListener("change", observe);
requestAnimationFrame(drawLabels);
// Make sure the first beat is live even before any scrolling.
if (!active) activate(beats[0]);
