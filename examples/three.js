import { ensureMathJax } from "./mathjax.js";
// These functions are executed and displayed. The code panel is the actual scene source.
function springStudy() {
  const scene = rhyform.scene("#stage", { dimensions: 3 });
  const curve = scene.wave({ amplitude: 0.7, cycles: 3 });

  curve.draw(1.5);
  scene.wait(0.4);
  curve.transformTo(
    {
      type: "helix",
      radius: 1.1,
      height: 3.6,
      turns: 3,
    },
    { duration: 2.5 },
  );
  scene.wait(0.5);
  curve.rotateTo([0, 90, 0], 1.5);
  curve.moveTo([0, 0.5, 0], 1);
  scene.wait(0.7);
  scene.slider("#controls");
  return scene;
}

function cubeStudy() {
  const scene = rhyform.scene("#stage", { dimensions: 3 });
  const shape = scene.disk({ radius: 1.5, color: "#72a99e" });

  shape.draw(1.2);
  scene.wait(0.4);
  shape.transformTo(
    { type: "square", size: 2.4 },
    {
      duration: 1.8,
    },
  );
  scene.wait(0.4);
  shape.extrude(2.4, { duration: 2 });
  shape.rotateTo([20, 50, 0], 1.6);
  scene.wait(0.8);
  scene.slider("#controls");
  return scene;
}

function fillStudy() {
  const scene = rhyform.scene("#stage", { dimensions: 3 });
  const lower = {
    type: "wave",
    amplitude: 0.3,
    cycles: 1,
    at: [0, -1, 0],
  };
  const upper = {
    type: "wave",
    amplitude: 0.8,
    cycles: 1,
    at: [0, 1, 1.6],
  };

  scene.curve(lower).tag("edges/lower");
  scene.curve(upper).tag("edges/upper");
  scene.tag("edges").draw({ duration: 1, order: "sequential" });

  const sheet = scene.fillBetween(lower, upper, {
    color: "#d4aa72",
  });
  sheet.draw(2);
  scene.camera.moveTo([-5, 3, 8], 2);
  scene.wait(0.8);
  scene.slider("#controls");
  return scene;
}

function surfaceStudy() {
  const scene = rhyform.scene("#stage", { dimensions: 3 });
  const sheet = scene.plane({ color: "#7aa89f" });

  sheet.draw(1.3);
  sheet.transformTo(
    {
      type: "waveSurface",
      amplitude: 0.65,
      frequency: 2,
    },
    { duration: 2 },
  );
  scene.wait(0.5);
  sheet.transformTo(
    { type: "saddle", curvature: 0.35 },
    {
      duration: 2,
    },
  );
  scene.camera.moveTo([7, 5, 5], 1.5);
  scene.wait(0.8);
  scene.slider("#controls");
  return scene;
}

function revolveStudy() {
  const scene = rhyform.scene("#stage", { dimensions: 3 });
  const profile = {
    type: "bezier",
    points: [
      [0, -1.5],
      [2.8, -1.5],
      [0.3, 1],
      [1, 1.5],
    ],
  };
  const outline = scene.curve(profile);
  outline.draw(1.2);

  const vase = scene.revolve(profile, {
    angle: 0,
    color: "#c99d76",
  });
  vase.show(0);
  vase.transformTo(
    {
      type: "revolve",
      profile,
      angle: Math.PI * 2,
    },
    { duration: 3 },
  );
  outline.hide(0.4);
  scene.camera.moveTo([5, 5, 7], 1.5);
  scene.wait(0.8);
  scene.slider("#controls");
  return scene;
}

function tubeStudy() {
  const scene = rhyform.scene("#stage", { dimensions: 3 });
  const helix = { type: "helix", radius: 1, turns: 2.5 };
  const curve = scene.curve(helix);
  curve.draw(1.2);

  const tube = scene.tube(helix, {
    radius: 0.12,
    color: "#b28e7f",
    uSegments: 128,
  });
  tube.draw(2);
  curve.hide(0.3);
  tube.transformTo(
    {
      type: "tube",
      radius: 0.15,
      uSegments: 128,
      curve: { type: "torusKnot", radius: 1.4, tubeRadius: 0.5 },
    },
    { duration: 2.8 },
  );
  tube.rotateTo([0, 70, 0], 1.2);
  scene.wait(0.8);
  scene.slider("#controls");
  return scene;
}

function sphereAssemblyStudy() {
  const scene = rhyform.scene("#stage", { dimensions: 3 });
  const colors = ["#77a99b", "#d2b276", "#8b9cae", "#bd9381"];

  colors.forEach((color, i) => {
    scene
      .plane({
        x: [-0.7, 0.7],
        z: [-0.7, 0.7],
        color,
        at: [((i % 2) - 0.5) * 2.5, (Math.floor(i / 2) - 0.5) * 2.5, 0],
      })
      .tag("form/sheets/" + i);
  });

  scene.tag("form").draw({ duration: 0.6, order: "sequential" });
  scene.wait(0.5);
  scene.tag("form").transformTo(
    {
      type: "sphere",
      radius: 1.7,
    },
    { duration: 3 },
  );
  scene.camera.moveTo([-5, 3, 8], 2);
  scene.wait(0.8);
  scene.slider("#controls");
  return scene;
}

function cubeAssemblyStudy() {
  const scene = rhyform.scene("#stage", {
    dimensions: 3,
    viewHeight: 7.2,
  });
  const faces = ["right", "left", "top", "bottom", "front", "back"];
  const colors = [
    "#b99677",
    "#8499a0",
    "#d0b574",
    "#9a94a4",
    "#76a89d",
    "#a0ad89",
  ];

  faces.forEach((face, i) => {
    scene
      .plane({
        x: [-0.6, 0.6],
        z: [-0.6, 0.6],
        color: colors[i],
        at: [((i % 3) - 1) * 1.9, (Math.floor(i / 3) - 0.5) * 2.5, 0],
      })
      .tag("cube/faces/" + face);
  });

  scene.tag("cube").draw({ duration: 0.45, order: "sequential" });
  scene.wait(0.5);
  scene.tag("cube").transformTo(
    { type: "cube", size: 2.5 },
    {
      duration: 3,
    },
  );
  scene.camera.moveTo([7, 4, 5], 1.8);
  scene.wait(0.8);
  scene.slider("#controls");
  return scene;
}

function openingStudy() {
  const scene = rhyform.scene("#stage", { dimensions: 3 });
  const ring = scene.fill(
    { type: "circle", radius: 1.8 },
    {
      holes: [{ type: "circle", radius: 0.9 }],
      color: "#cca776",
    },
  );

  ring.draw(1.5);
  scene.wait(0.5);
  ring.extrude(0.9, { duration: 2 });
  ring.rotateTo([40, 55, 0], 2);
  scene.wait(0.8);
  scene.slider("#controls");
  return scene;
}

function solidsStudy() {
  const scene = rhyform.scene("#stage", { dimensions: 3 });
  const hexagon = { type: "prism", sides: 6, radius: 1.8, depth: 2.2 };
  const cylinder = { type: "disk", radius: 1.5, depth: 2.2 };
  const solid = scene.cube({ size: 2.2, color: "#78a69d" });

  solid.draw(1);
  solid.rotateTo([20, 25, 0], 1);
  scene.wait(0.5);
  solid.transformTo(hexagon, { duration: 2.4 });
  scene.wait(0.7);
  solid.transformTo(cylinder, { duration: 2.4 });
  solid.rotateBy([0, 100, 0], 1.8);
  scene.wait(0.8);
  scene.slider("#controls");
  return scene;
}

function roundStudy() {
  const scene = rhyform.scene("#stage", { dimensions: 3 });
  const torus = { type: "torus", radius: 1.4, tubeRadius: 0.5 };
  const ball = scene.sphere({ radius: 1.7, color: "#bd997b" });

  ball.draw(1.2);
  scene.wait(0.7);
  ball.transformTo(torus, { duration: 3 });
  ball.rotateTo([35, 0, 0], 1.4);
  scene.wait(0.8);
  ball.transformTo({ type: "sphere", radius: 1.7 }, { duration: 3 });
  scene.wait(0.8);
  scene.slider("#controls");
  return scene;
}

async function equationStudy() {
  const scene = rhyform.scene("#stage", {
    dimensions: 3,
    camera: { at: [3, 2, 10] },
    viewHeight: 5,
  });
  const equation = await scene.equation(String.raw`(x+1)^2=x^2+2x+1`, {
    width: 5.8,
    depth: 0.16,
    color: "#4a887f",
  });

  equation.draw(2);
  scene.wait(0.8);
  equation.rotateTo([10, -25, 0], 1.4);
  await equation.transformTo(String.raw`x^2+2x=(x+1)^2-1`, { duration: 3 });
  scene.wait(1);
  await equation.transformTo(String.raw`x^2+2x+1=(x+1)^2`, { duration: 3 });
  equation.rotateTo([0, 0, 0], 1.2);
  scene.wait(0.8);
  scene.slider("#controls");
  return scene;
}

async function symbolStudy() {
  const scene = rhyform.scene("#stage", { dimensions: 3 });
  const symbol = await scene.equation(String.raw`\pi`, {
    width: 2.7,
    depth: 0.3,
    color: "#c49b70",
  });

  symbol.draw(1.5);
  symbol.rotateTo([0, -30, 0], 1);
  scene.wait(0.6);
  symbol.transformTo(
    { type: "disk", radius: 1.5, depth: 0.3 },
    { duration: 2.5 },
  );
  symbol.transformTo({ type: "cube", size: 2.4 }, { duration: 2.5 });
  symbol.rotateTo([20, 40, 0], 1.5);
  scene.wait(0.8);
  scene.slider("#controls");
  return scene;
}

async function equationSurfaceStudy() {
  const scene = rhyform.scene("#stage", {
    dimensions: 3,
    viewHeight: 7,
    camera: { at: [4, 3, 10] },
  });
  const bowl = { type: "heightField", fn: (x, z) => (x * x + z * z) / 3 };
  const saddle = { type: "heightField", fn: (x, z) => (x * x - z * z) / 3 };
  const surface = scene.shape({ ...bowl, at: [0, -1, 0] });
  const equation = await scene.equation(String.raw`y=\frac{x^2+z^2}{3}`, {
    width: 4,
    at: [0, 2.4, 0],
    depth: 0.07,
  });

  equation.draw(1.5);
  surface.draw(1.8);
  scene.wait(0.8);
  (
    await equation.transformTo(String.raw`y=\frac{x^2-z^2}{3}`, {
      duration: 3,
    })
  ).startNextImmediately();
  surface.transformTo(saddle, { duration: 3 });
  scene.camera.moveTo([-5, 3, 9], 2);
  scene.wait(1);
  scene.slider("#controls");
  return scene;
}

const studies = [
  [
    "spring",
    "A curve gains depth",
    "Wave → helix",
    springStudy,
    "One curve, a little more room.",
    "A named wave becomes a named helix. Move and rotate use world coordinates and degrees.",
  ],
  [
    "cube",
    "Circle to cube",
    "Circle → square → cube",
    cubeStudy,
    "An outline of an idea becomes a solid.",
    "A filled circle changes its boundary, then the square acquires depth. The same object keeps its identity.",
  ],
  [
    "fill",
    "Fill the space",
    "A surface between two curves",
    fillStudy,
    "Two boundaries. Everything between.",
    "Describe the two curves, draw them in sequence, then fill the space between corresponding points.",
  ],
  [
    "surface",
    "Shape a surface",
    "Plane → waves → saddle",
    surfaceStudy,
    "One sheet, many possibilities.",
    "Named surfaces share a parameter grid. A custom function of two parameters can describe a surface too.",
  ],
  [
    "revolve",
    "Spin a profile",
    "A curve becomes a vase",
    revolveStudy,
    "A single profile describes the whole form.",
    "Draw a profile in the XY plane, then revolve it around the Y axis. The angle grows continuously.",
  ],
  [
    "tube",
    "Follow a curve",
    "Helix → tube → knot",
    tubeStudy,
    "Give a line a little substance.",
    "A circular cross-section follows the curve. Transported frames keep the tube oriented through bends.",
  ],
  [
    "sphere-parts",
    "Gather the pieces",
    "Four sheets → one sphere",
    sphereAssemblyStudy,
    "Separate beginnings. A shared destination.",
    "The parent tag selects every sheet below it. Their parameter ranges become adjacent sections of the sphere.",
  ],
  [
    "cube-parts",
    "Build with tags",
    "Six sheets → one cube",
    cubeAssemblyStudy,
    "Each piece knows where it belongs.",
    "Tags form a tree. Draw the children one after another, then map six sheets to six precise cube faces.",
  ],
  [
    "opening",
    "Keep an opening",
    "An annulus acquires depth",
    openingStudy,
    "The space inside remains open.",
    "A filled contour can contain holes. Extrusion builds front and back faces and the inner and outer walls.",
  ],
  [
    "solids",
    "3D to 3D",
    "Cube → hexagonal prism → cylinder",
    solidsStudy,
    "Volume keeps moving.",
    "One closed solid changes its boundary while keeping depth. No crossfade or flat intermediary is used.",
  ],
  [
    "round",
    "A hole opens",
    "Sphere → torus → sphere",
    roundStudy,
    "A different destination for every sample.",
    "The surface grid changes continuously. The sphere poles separate into torus loops; this geometric interpolation is not topology-preserving.",
  ],
  [
    "equations",
    "Equations in space",
    "Rearrange an extruded equation",
    equationStudy,
    "The symbols carry their meaning through space.",
    "MathJax outlines become filled 3D meshes. Structural matching moves retained symbols and grows or shrinks unmatched glyphs without a transition dissolve.",
  ],
  [
    "symbol",
    "Symbol to solid",
    "π → disk → cube",
    symbolStudy,
    "A mathematical mark becomes a solid.",
    "The extruded glyph contour reshapes into a circle, then a square with depth. This explicit one-contour mapping needs no tracing.",
  ],
  [
    "equation-surface",
    "Equation and surface",
    "A plus becomes a minus",
    equationSurfaceStudy,
    "A small change in writing. A large change in space.",
    "The equation and its height field change together. The author supplies both formulas; the engine does not infer algebra from LaTeX.",
  ],
];
const families = [
  ["Curves & solids", [0, 1, 5, 9, 10]],
  ["Surfaces & fills", [2, 3, 4, 8]],
  ["Tagged assemblies", [6, 7]],
  ["Equations in 3D", [11, 12, 13]],
];
const $ = (id) => document.getElementById(id);
let current = null,
  unsubscribe = null,
  source = "";
function highlight(code) {
  $("code").replaceChildren();
  const tokens =
    /(\/\/[^\n]*|'[^'\n]*'|"[^"\n]*"|\b(?:const|let|return|function)\b|\b\d+(?:\.\d+)?\b)/g;
  let last = 0;
  for (const match of code.matchAll(tokens)) {
    $("code").append(document.createTextNode(code.slice(last, match.index)));
    const span = document.createElement("span"),
      text = match[0];
    span.textContent = text;
    span.className =
      "token-" +
      (text.startsWith("//")
        ? "comment"
        : /^['"]/.test(text)
          ? "string"
          : /^\d/.test(text)
            ? "number"
            : "keyword");
    $("code").append(span);
    last = match.index + text.length;
  }
  $("code").append(document.createTextNode(code.slice(last)));
}
function update() {
  if (!current) return;
  $("view-hint").textContent = current.playing ? "Pause to look around" : "Drag to look around · Play restores the view";
  const playLabel = current.playing ? "Pause scene" : "Play scene";
  if ($("play").firstChild?.textContent !== playLabel) {
    $("play").replaceChildren(document.createTextNode(playLabel));
    const icon = document.createElement("span");
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = current.playing ? "Ⅱ" : "▶";
    $("play").append(icon);
  }
  $("play-state").textContent = current.playing
    ? "Playing"
    : current.currentTime >= current.duration
      ? "Complete"
      : current.currentTime > 0
        ? "Paused"
        : "Ready to play";
  if (current.lastError) {
    $("error").hidden = false;
    $("error").textContent = current.lastError.message;
  }
}
let selection = 0;
async function selectStudy(index) {
  const ticket = ++selection;
  const family = families.findIndex(([, members]) => members.includes(index));
  [...$("families").children].forEach((button, i) =>
    button.setAttribute("aria-pressed", String(i === family)),
  );
  [...$("studies").children].forEach(
    (button) =>
      (button.hidden = !families[family][1].includes(
        Number(button.dataset.study),
      )),
  );
  unsubscribe?.();
  current?.dispose();
  current = null;
  window.demoScene = null;
  $("stage").replaceChildren();
  $("controls").replaceChildren();
  $("error").hidden = true;
  const [hash, label, title, make, caption, note] = studies[index];
  $("scene-title").textContent = title;
  $("caption").textContent = caption;
  $("note").textContent = note;
  $("count").textContent =
    `${String(index + 1).padStart(2, "0")} / ${studies.length}`;
  [...$("studies").children].forEach((button, i) =>
    button.setAttribute("aria-pressed", String(i === index)),
  );
  const lines = make
    .toString()
    .split("\n")
    .slice(1, -2)
    .map((line) => line.slice(2));
  source = lines.join("\n") + "\nscene.play();";
  highlight(source);
  try {
    const math = ["equations", "symbol", "equation-surface"].includes(hash);
    $("math-dependency").hidden = !math;
    $("play-state").textContent = math
      ? "Typesetting equations…"
      : "Preparing…";
    if (math) await ensureMathJax();
    if (ticket !== selection) return;
    const candidate = await make();
    if (ticket !== selection) {
      candidate.dispose();
      return;
    }
    current = candidate;
    current.canvas.setAttribute("aria-label", title + ". " + caption);
    current.prepare();
    current.seek(0);
    unsubscribe = current.onUpdate(update);
    update();
    window.demoScene = current;
  } catch (error) {
    if (ticket !== selection) return;
    current = null;
    $("error").hidden = false;
    $("error").textContent = error.message;
    $("play-state").textContent = "Unable to load";
  }
  $("announcement").textContent = title + " ready";
}
families.forEach(([label, members]) => {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.addEventListener("click", () => {
    history.replaceState(null, "", "#" + studies[members[0]][0]);
    selectStudy(members[0]);
  });
  $("families").append(button);
});
studies.forEach(([hash, label], i) => {
  const button = document.createElement("button");
  button.type = "button";
  button.dataset.study = i;
  const number = document.createElement("span");
  number.textContent = String(i + 1).padStart(2, "0");
  button.append(number, label);
  button.addEventListener("click", () => {
    history.replaceState(null, "", "#" + hash);
    selectStudy(i);
  });
  $("studies").append(button);
});
$("play").addEventListener("click", () => {
  if (!current) return;
  current.playing
    ? current.pause()
    : current.currentTime >= current.duration
      ? current.play()
      : current.resume();
});
$("restart").addEventListener("click", () => current?.play());
$("copy").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(source);
    $("copy").textContent = "Copied";
    setTimeout(() => ($("copy").textContent = "Copy code"), 1500);
  } catch {
    $("announcement").textContent = "Select the code to copy it.";
  }
});
const fromHash = () =>
  selectStudy(
    Math.max(
      0,
      studies.findIndex((s) => "#" + s[0] === location.hash),
    ),
  );
window.addEventListener("hashchange", fromHash);
fromHash();
