import { createStory } from "./story-scene.js";
import { ensureMathJax } from "./mathjax.js";
const $ = (id) => document.getElementById(id);
let scene,
  chapters = [],
  active = -1;
const source = createStory.toString();
$("source").textContent = source;
function update() {
  const index = Math.max(
    0,
    chapters.findLastIndex((c) => scene.currentTime >= c.time),
  );
  if (index !== active) {
    active = index;
    const chapter = chapters[index];
    $("chapter-number").textContent =
      `${String(index + 1).padStart(2, "0")} / ${String(chapters.length).padStart(2, "0")}`;
    $("chapter-title").textContent = chapter.title;
    $("sentence").textContent = chapter.text;
    $("detail").textContent = chapter.detail;
    [...$("chapters").children].forEach((button, i) =>
      button.setAttribute("aria-current", String(i === index)),
    );
  }
  const ended = scene.currentTime >= scene.duration;
  $("play").textContent = scene.playing
    ? "Pause story"
    : ended
      ? "Replay story"
      : scene.currentTime === 0
        ? "Begin the story"
        : "Continue story";
  $("status").textContent = scene.playing
    ? "Playing"
    : ended
      ? "The end"
      : scene.currentTime > 0
        ? "Paused"
        : "Ready";
  $("next").disabled = active >= chapters.length - 1;
}
$("play").addEventListener("click", () =>
  scene.playing
    ? scene.pause()
    : scene.currentTime >= scene.duration
      ? scene.play()
      : scene.resume(),
);
$("restart").addEventListener("click", () => {
  scene.seek(0);
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches) scene.resume();
});
$("next").addEventListener("click", () =>
  scene.seek(chapters[Math.min(active + 1, chapters.length - 1)].time),
);
$("source-toggle").addEventListener("click", () => {
  const open = $("source-panel").hidden;
  $("source-panel").hidden = !open;
  $("source-toggle").setAttribute("aria-expanded", String(open));
  if (open)
    $("source-panel").scrollIntoView({ block: "start", behavior: "instant" });
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
  scene.slider("#controls");
  scene.onUpdate(update);
  $("static-story").hidden = true;
  chapters.forEach((chapter, i) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = `${String(i + 1).padStart(2, "0")} ${chapter.title}`;
    button.addEventListener("click", () => scene.seek(chapter.time));
    $("chapters").append(button);
    const li = document.createElement("li"),
      strong = document.createElement("strong");
    strong.textContent = chapter.text;
    li.append(strong, document.createTextNode(" " + chapter.detail));
    $("transcript").append(li);
  });
  $("play").disabled = $("restart").disabled = $("next").disabled = false;
  $("stage").setAttribute("aria-busy", "false");
  update();
  window.storyScene = scene;
  window.storyChapters = chapters;
  window.addEventListener("pagehide", () => scene.dispose(), { once: true });
} catch (error) {
  $("error").hidden = false;
  $("error").textContent = error.message;
  $("status").textContent = "Unable to load";
  $("stage").setAttribute("aria-busy", "false");
  scene?.dispose();
}
