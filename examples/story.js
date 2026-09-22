import { createStory } from "./story-scene.js";
import { ensureMathJax } from "./mathjax.js";
const $ = (id) => document.getElementById(id);
let scene,
  chapters = [],
  active = -1,
  peekTimer;
const chapterButtons = [];
const source = createStory.toString();
$("source").textContent = source;
function update() {
  const index = Math.max(
    0,
    chapters.findLastIndex((c) => scene.currentTime >= c.time),
  );
  if (index !== active) {
    active = index;
    $("chapter-title").textContent = chapters[index].title;
    $("sentence").textContent = chapters[index].text;
    $("detail").textContent = chapters[index].detail;
  }
  chapterButtons.forEach((button, i) => {
    button.setAttribute("aria-current", String(i === index));
    button.dataset.passed = String(scene.currentTime >= chapters[i].time);
  });
  const ended = scene.currentTime >= scene.duration;
  const label = scene.playing
    ? "Pause story"
    : ended
      ? "Replay story"
      : scene.currentTime === 0
        ? "Begin the story"
        : "Continue story";
  $("play").setAttribute("aria-label", label);
  $("play-icon").toggleAttribute("hidden", scene.playing);
  $("pause-icon").toggleAttribute("hidden", !scene.playing);
  const status = scene.playing
    ? "Playing"
    : ended
      ? "The end"
      : scene.currentTime > 0
        ? "Paused"
        : "Ready";
  if ($("status").textContent !== status) $("status").textContent = status;
  $("opening").hidden = index !== 0;
  $("progress").value = scene.currentTime;
  $("progress").style.setProperty(
    "--progress",
    `${(100 * scene.currentTime) / scene.duration}%`,
  );
  $("progress").setAttribute(
    "aria-valuetext",
    `${scene.currentTime.toFixed(1)} of ${scene.duration.toFixed(1)} seconds. ${chapters[index].title}`,
  );
}
function toggle() {
  if (!scene) return;
  scene.playing
    ? scene.pause()
    : scene.currentTime >= scene.duration
      ? scene.play()
      : scene.resume();
}
$("play").addEventListener("click", toggle);
$("progress").addEventListener("input", () =>
  scene?.seek(Number($("progress").value)),
);
document.addEventListener("keydown", (event) => {
  if (
    event.code !== "Space" ||
    event.repeat ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    $("notes").open
  )
    return;
  if (event.target !== document.body && event.target !== scene?.canvas) return;
  event.preventDefault();
  toggle();
});
$("notes-toggle").addEventListener("click", () => {
  scene?.pause();
  $("notes").showModal();
});
$("notes-close").addEventListener("click", () => $("notes").close());
$("notes").addEventListener("close", () => {
  $("notes-toggle").focus({ preventScroll: true });
});
$("restart").addEventListener("click", () => {
  scene.camera.resetView();
  scene.seek(0);
  $("notes").close();
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches) scene.resume();
});
$("source-toggle").addEventListener("click", () => {
  const open = $("source-panel").hidden;
  $("source-panel").hidden = !open;
  $("source-toggle").setAttribute("aria-expanded", String(open));
});
$("copy").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(source);
    $("copy").textContent = "Copied";
  } catch {
    $("copy").textContent = "Select the source to copy";
  }
});
try {
  await ensureMathJax();
  ({ scene, chapters } = await createStory("#stage"));
  scene.onUpdate(update);
  $("static-story").hidden = true;
  $("status").className = "sr-only";
  $("progress").max = scene.duration;
  chapters.forEach((chapter, i) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "chapter";
    button.style.setProperty(
      "--position",
      `${(100 * chapter.time) / scene.duration}%`,
    );
    const name = `${String(i + 1).padStart(2, "0")} · ${chapter.title}`;
    button.setAttribute("aria-label", name);
    const tooltip = document.createElement("span");
    tooltip.className = "chapter-tooltip";
    tooltip.setAttribute("aria-hidden", "true");
    tooltip.textContent = name;
    button.append(tooltip);
    // A marker remains a chapter button, but dragging from it scrubs the
    // timeline just like dragging the range thumb underneath it.
    let pointer,
      startX,
      dragged = false;
    const scrub = (x) => {
      const rect = $("chapters").getBoundingClientRect();
      scene.seek(
        Math.max(0, Math.min(1, (x - rect.left) / rect.width)) * scene.duration,
      );
    };
    button.addEventListener("pointerdown", (event) => {
      if (!event.isPrimary || event.button !== 0) return;
      pointer = event.pointerId;
      startX = event.clientX;
      dragged = false;
      button.setPointerCapture(pointer);
    });
    button.addEventListener("pointermove", (event) => {
      if (event.pointerId !== pointer) return;
      dragged ||= Math.abs(event.clientX - startX) > 3;
      if (dragged) scrub(event.clientX);
    });
    button.addEventListener("pointerup", (event) => {
      if (event.pointerId !== pointer) return;
      if (dragged) scrub(event.clientX);
      pointer = null;
    });
    button.addEventListener("lostpointercapture", () => {
      pointer = null;
    });
    button.addEventListener("click", (event) => {
      if (dragged && event.detail > 0) return;
      scene.seek(chapter.time);
      clearTimeout(peekTimer);
      chapterButtons.forEach((b) => delete b.dataset.peek);
      button.dataset.peek = "true";
      peekTimer = setTimeout(() => delete button.dataset.peek, 1800);
    });
    $("chapters").append(button);
    chapterButtons.push(button);
    const li = document.createElement("li"),
      strong = document.createElement("strong");
    strong.textContent = chapter.text;
    li.append(strong, document.createTextNode(" " + chapter.detail));
    $("transcript").append(li);
  });
  $("play").disabled = $("restart").disabled = $("progress").disabled = false;
  $("stage").setAttribute("aria-busy", "false");
  update();
  window.storyScene = scene;
  window.storyChapters = chapters;
  window.addEventListener(
    "pagehide",
    () => {
      clearTimeout(peekTimer);
      scene.dispose();
    },
    { once: true },
  );
} catch (error) {
  $("error").hidden = false;
  $("error").textContent =
    `${error.message}. Open Story notes and code to read the story.`;
  $("status").className = "sr-only";
  $("status").textContent = "Unable to load";
  $("opening").hidden = true;
  $("stage").setAttribute("aria-busy", "false");
  $("notes-toggle").style.opacity = "1";
  scene?.dispose();
}
