import { chromium, webkit, firefox } from "playwright";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname } from "node:path";
import assert from "node:assert/strict";
const root = resolve(".");
const server = createServer(async (req, res) => {
  try {
    const path = resolve(
      root,
      "." + decodeURIComponent(new URL(req.url, "http://localhost").pathname),
    );
    if (!path.startsWith(root + "/")) throw Error();
    res.setHeader(
      "Content-Type",
      {
        ".html": "text/html",
        ".js": "text/javascript",
        ".mjs": "text/javascript",
        ".css": "text/css",
      }[extname(path)] ?? "application/octet-stream",
    );
    res.end(await readFile(path));
  } catch {
    res.writeHead(404);
    res.end();
  }
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}`;
const engine = process.env.TEST_BROWSER ?? "chromium";
let browser;
const launchOptions = { headless: process.env.TEST_HEADED !== "1" };
if (engine === "chromium") {
  try {
    browser = await chromium.launch({ ...launchOptions, channel: "chrome" });
  } catch {
    browser = await chromium.launch({
      ...launchOptions,
      args: ["--enable-unsafe-swiftshader"],
    });
  }
} else browser = await { webkit, firefox }[engine].launch(launchOptions);
let passed = 0,
  failed = 0;
async function test(name, fn) {
  const page = await browser.newPage(),
    errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  try {
    await page.goto(base + "/tests/fixture-3d.html");
    await fn(page);
    assert.deepEqual(errors, []);
    console.log("PASS " + name);
    passed++;
  } catch (e) {
    console.error("FAIL " + name + "\n" + e.stack);
    failed++;
  } finally {
    await page.close();
  }
}
await test("one import, canvas only, visible GPU geometry, no optional globals", async (p) => {
  const result = await p.evaluate(() => {
    const s = rhyform.scene("#stage", { dimensions: 3 });
    s.helix().draw(1);
    s.seek(0.7);
    const canvas = s.canvas,
      copy = document.createElement("canvas");
    copy.width = canvas.width;
    copy.height = canvas.height;
    const c = copy.getContext("2d");
    c.drawImage(canvas, 0, 0);
    const pixels = c.getImageData(0, 0, copy.width, copy.height).data;
    let varied = 0;
    for (let i = 0; i < pixels.length; i += 4)
      if (Math.abs(pixels[i] - pixels[0]) > 30) varied++;
    return {
      svg: document.querySelectorAll("svg").length,
      canvas: document.querySelectorAll("#stage canvas").length,
      picks: s.stats().pickTests,
      optional: [typeof THREE, typeof MathJax, typeof Potrace],
      varied,
    };
  });
  assert.equal(result.svg, 0);
  assert.equal(result.canvas, 1);
  assert.equal(result.picks, 0);
  assert.deepEqual(result.optional, ["undefined", "undefined", "undefined"]);
  assert.ok(result.varied > 100);
});
await test("curve morph, move, rotate, scale and reverse seek preserve authored states", async (p) => {
  const r = await p.evaluate(() => {
    const s = rhyform.scene("#stage", { dimensions: 3 }),
      c = s.wave();
    c.draw(1);
    c.transformTo({ type: "helix" }, { duration: 2 });
    c.moveTo([2, 1, -1], 1);
    c.rotateTo([0, 90, 0], 1);
    c.scaleTo(2, 1);
    s.seek(2);
    const mid = [...c.snapshot().positions];
    s.seek(6);
    const end = c.snapshot();
    s.seek(0);
    const start = c.snapshot();
    s.seek(2);
    return {
      same: JSON.stringify(mid) === JSON.stringify([...c.snapshot().positions]),
      end: { at: end.position, scale: end.scale, rotation: end.rotation },
      start: start.reveal,
    };
  });
  assert.equal(r.same, true);
  assert.deepEqual(r.end.at, [2, 1, -1]);
  assert.deepEqual(r.end.scale, [2, 2, 2]);
  assert.ok(Math.abs(r.end.rotation[1] - Math.SQRT1_2) < 1e-6);
  assert.equal(r.start, 0);
});
await test("disk becomes square then cube through extrusion without replacing object identity", async (p) => {
  const r = await p.evaluate(() => {
    const s = rhyform.scene("#stage", { dimensions: 3 }),
      shape = s.disk();
    shape.draw(0.2);
    shape.transformTo({ type: "square" }, { duration: 1 });
    shape.extrude(2, { duration: 1 });
    s.seek(1.7);
    const mid = shape.snapshot();
    s.seek(2.2);
    return {
      depth: shape.snapshot().depth,
      mid: mid.depth,
      count: s.stats().objects,
      finite: [...shape.positions].every(Number.isFinite),
    };
  });
  assert.equal(r.depth, 2);
  assert.ok(r.mid > 0 && r.mid < 2);
  assert.equal(r.count, 1);
  assert.equal(r.finite, true);
});
await test("tag tree selects descendants once and draws sequentially", async (p) => {
  const r = await p.evaluate(() => {
    const s = rhyform.scene("#stage", { dimensions: 3 }),
      a = s.line().tag("lesson/curves/a").tag("lesson"),
      b = s.circle().tag("lesson/curves/b");
    s.tag("lesson").draw({ duration: 1, order: "sequential" });
    s.prepare();
    s.seek(0.5);
    const first = [a.snapshot().reveal, b.snapshot().reveal];
    s.seek(1.5);
    return {
      count: s.tag("lesson").count,
      duration: s.duration,
      first,
      second: [a.snapshot().reveal, b.snapshot().reveal],
      tree: s.tags.tree(),
    };
  });
  assert.equal(r.count, 2);
  assert.equal(r.duration, 2);
  assert.deepEqual(r.first, [0.5, 0]);
  assert.deepEqual(r.second, [1, 0.5]);
  assert.equal(r.tree.children[0].count, 2);
});
await test("staggered tag animations, group translation and next-clip timing", async (p) => {
  const r = await p.evaluate(() => {
    const s = rhyform.scene("#stage", { dimensions: 3 });
    s.line({ at: [-1, 0, 0] }).tag("parts");
    s.line({ at: [1, 0, 0] }).tag("parts");
    s.tag("parts").draw({ duration: 1, stagger: 0.5 });
    s.tag("parts").moveTo([0, 2, 0], { duration: 1 });
    s.wait(0.5);
    s.seek(2.5);
    return {
      duration: s.duration,
      at: s.tag("parts").objects.map((o) => o.snapshot().position),
    };
  });
  assert.equal(r.duration, 3);
  assert.deepEqual(r.at, [
    [-1, 2, 0],
    [1, 2, 0],
  ]);
});
await test("tagged surface patches assemble into one sphere with complete parameter coverage", async (p) => {
  const r = await p.evaluate(() => {
    const s = rhyform.scene("#stage", { dimensions: 3 });
    for (let i = 0; i < 4; i++)
      s.plane({ at: [i, 0, 0], uSegments: 8, vSegments: 8 }).tag("sheets/" + i);
    s.tag("sheets").show({ duration: 0 });
    s.tag("sheets").transformTo({ type: "sphere", radius: 2 }, { duration: 2 });
    s.seek(2);
    const a = s.tag("sheets").objects.map((o) => o.snapshot());
    return {
      count: a.length,
      at: a.map((o) => o.position),
      radii: a.flatMap((o) => {
        const r = [];
        for (let i = 0; i < o.positions.length; i += 3)
          r.push(Math.hypot(...o.positions.slice(i, i + 3)));
        return r;
      }),
    };
  });
  assert.equal(r.count, 4);
  assert.ok(r.at.every((a) => a.every((n) => n === 0)));
  assert.ok(r.radii.every((r) => Math.abs(r - 2) < 1e-5));
});
await test("six tagged surfaces assemble into exact cube faces", async (p) => {
  const r = await p.evaluate(() => {
    const s = rhyform.scene("#stage", { dimensions: 3 });
    for (let i = 0; i < 6; i++)
      s.plane({ uSegments: 4, vSegments: 4 }).tag("faces/" + i);
    s.tag("faces").show(0);
    s.tag("faces").transformTo({ type: "cube", size: 4 }, { duration: 1 });
    s.seek(1);
    return s.tag("faces").objects.map((o) => {
      const p = o.snapshot().positions;
      return [0, 1, 2].map(
        (k) =>
          Math.max(...p.filter((_, i) => i % 3 === k)) -
          Math.min(...p.filter((_, i) => i % 3 === k)),
      );
    });
  });
  assert.ok(
    r.every(
      (extents) =>
        extents.filter((n) => n === 0).length === 1 &&
        extents.filter((n) => n === 4).length === 2,
    ),
  );
});
await test("invalid batch transforms leave the whole authored schedule unchanged", async (p) => {
  const r = await p.evaluate(() => {
    const s = rhyform.scene("#stage", { dimensions: 3 }),
      a = s.line().tag("curves"),
      b = s.circle().tag("curves");
    a.draw(1);
    const before = Object.keys(s.animations).length;
    let error;
    try {
      s.tag("curves").transformTo([{ type: "helix" }, { type: "sphere" }]);
    } catch (e) {
      error = e.message;
    }
    return {
      before,
      after: Object.keys(s.animations).length,
      type: a.descriptor.type,
      error,
    };
  });
  assert.equal(r.before, r.after);
  assert.equal(r.type, "line");
  assert.match(r.error, /topology/);
});
await test("parameter controls update live geometry and reject changing topology", async (p) => {
  const r = await p.evaluate(() => {
    const s = rhyform.scene("#stage", { dimensions: 3 }),
      radius = s.parameter("Radius", { value: 1, min: 0.5, max: 2, step: 0.1 }),
      shape = s.liveShape(() => ({ type: "helix", radius: radius.value }));
    shape.show(0);
    s.wait(1);
    const panel = s.controls("#controls");
    s.seek(0);
    radius.value = 1.5;
    s.seek(0);
    const before = shape.snapshot().positions[0];
    const samples = s.parameter("Samples", {
      value: 8,
      min: 8,
      max: 16,
      step: 8,
    });
    const other = s.liveShape(() => ({
      type: "circle",
      segments: samples.value,
    }));
    let error;
    try {
      samples.value = 16;
    } catch (e) {
      error = e.message;
    }
    return {
      x: before,
      inputs: panel.inputs.size,
      controls: document.querySelectorAll("input").length,
      error,
      rolledBack: samples.value,
      vertices: other.snapshot().positions.length,
    };
  });
  assert.equal(r.x, 1.5);
  assert.equal(r.inputs, 1);
  assert.equal(r.controls, 2);
  assert.match(r.error, /topology/);
  assert.equal(r.rolledBack, 8);
  assert.equal(r.vertices, 27);
});
await test("paused scenes stop drawing and clear/dispose release GPU objects and controls", async (p) => {
  await p.evaluate(() => {
    window.s = rhyform.scene("#stage", { dimensions: 3 });
    s.sphere().show(0.1);
    s.controls("#controls");
    s.seek(0.1);
  });
  await p.waitForTimeout(100);
  const draws = await p.evaluate(() => s.stats().draws);
  await p.waitForTimeout(120);
  assert.equal(await p.evaluate(() => s.stats().draws), draws);
  await p.evaluate(() => {document.getElementById('stage').style.width='420px';});
  await p.waitForFunction(before=>s.stats().draws>before,draws);
  const resized=await p.evaluate(()=>({width:s.canvas.clientWidth,draws:s.stats().draws}));
  assert.equal(resized.width,420);
  await p.waitForTimeout(120);
  assert.equal(await p.evaluate(()=>s.stats().draws),resized.draws);
  const r = await p.evaluate(() => {
    s.clear();
    const cleared = s.stats().objects;
    s.cube().show(0);
    s.seek(0);
    const reloaded = s.stats().objects;
    s.dispose();
    s.dispose();
    return {
      cleared,
      reloaded,
      canvas: document.querySelectorAll("canvas").length,
      controls: document.querySelectorAll("#controls input").length,
    };
  });
  assert.deepEqual(r, { cleared: 0, reloaded: 1, canvas: 0, controls: 0 });
});
await test("2D compatibility works alongside a 3D scene in the superset bundle", async (p) => {
  const r = await p.evaluate(() => {
    const second = document.createElement("div");
    second.id = "second";
    second.style.cssText = "width:400px;height:300px";
    document.body.append(second);
    const a = rhyform.scene("#stage", { dimensions: 3 }),
      b = rhyform.scene("#second");
    a.helix().draw(1);
    b.circle().draw(1);
    a.seek(0.5);
    b.seek(0.5);
    return [
      document.querySelectorAll("canvas").length,
      document.querySelectorAll("svg").length,
    ];
  });
  assert.deepEqual(r, [1, 1]);
});
await test("ES module distribution imports directly without globals or a bundler", async (p) => {
  await p.goto(base + "/tests/fixture-3d.html");
  const r = await p.evaluate(async () => {
    const { default: api } = await import("/rhyform-3d.module.js");
    const s = api.scene("#stage", { dimensions: 3 });
    s.torus().show(0);
    s.seek(0);
    return s.stats().objects;
  });
  assert.equal(r, 1);
});
await test("tagged curves join continuously into a helix with exact endpoints", async (p) => {
  const r = await p.evaluate(() => {
    const s = rhyform.scene("#stage", { dimensions: 3 });
    for (let i = 0; i < 3; i++) s.line().tag("parts/" + i);
    s.tag("parts").draw({ duration: 0.2, order: "sequential" });
    s.tag("parts").transformTo({ type: "helix", height: 4, turns: 2 }, 1);
    s.seek(1.6);
    return s.tag("parts").objects.map((o) => [...o.snapshot().positions]);
  });
  for (let i = 0; i < 2; i++)
    assert.deepEqual(r[i].slice(-3), r[i + 1].slice(0, 3));
  assert.deepEqual(r[0].slice(0, 3), [1, -2, 0]);
  assert.equal(r[2].at(-2), 2);
});
await test("rotateBy preserves full turns and camera moves start at the previous destination", async (p) => {
  const r = await p.evaluate(() => {
    const s = rhyform.scene("#stage", { dimensions: 3 }),
      shape = s.cube();
    shape.show(0);
    shape.rotateBy([0, 360, 0], 2);
    s.camera.moveTo([2, 3, 8], 1);
    s.camera.moveTo([-2, 3, 8], 1);
    s.seek(1);
    const rotation = shape.snapshot().rotation;
    s.seek(3);
    const before = s.project([1, 0, 0]);
    s.seek(3.001);
    const after = s.project([1, 0, 0]);
    s.seek(4);
    s.seek(3);
    return { rotation, before, after, replayed: s.project([1, 0, 0]) };
  });
  assert.ok(Math.abs(r.rotation[1] - 1) < 1e-6);
  assert.ok(Math.abs(r.before.x - r.after.x) < 0.01);
  assert.deepEqual(r.before, r.replayed);
});
await test("removed objects release their own clips and do not return on replay", async (p) => {
  const r = await p.evaluate(() => {
    const s = rhyform.scene("#stage", { dimensions: 3 }),
      a = s.line().tag("parts"),
      b = s.circle().tag("parts");
    s.tag("parts").draw({ duration: 1, order: "sequential" });
    a.moveTo([2, 0, 0], 1);
    s.seek(2);
    a.remove();
    s.play();
    s.pause();
    return {
      objects: s.stats().objects,
      animations: s.stats().animations,
      duration: s.duration,
      count: s.tag("parts").count,
    };
  });
  assert.deepEqual(r, { objects: 1, animations: 1, duration: 1, count: 1 });
});
await test("a failed update cannot lock rendering, and disposed scenes reject sampling", async (p) => {
  await p.evaluate(() => {
    window.s = rhyform.scene("#stage", { dimensions: 3 });
    window.radius = s.parameter("Radius", { value: 1, min: 0.5, max: 2 });
    s.liveShape(() => ({ type: "helix", radius: radius.value })).draw(1);
    s.seek(0);
    const off = s.onUpdate(() => {
      if (s.currentTime > 0.25) throw Error("intentional update failure");
    });
    try {
      s.seek(0.5);
    } catch {}
    off();
    window.before = s.stats().draws;
    radius.value = 1.5;
  });
  await p.waitForFunction(() => s.stats().draws > before);
  const errors = await p.evaluate(() => {
    s.dispose();
    return ["seek", "prepare"].map((name) => {
      try {
        s[name](0);
      } catch (e) {
        return e.message;
      }
    });
  });
  assert.ok(errors.every((e) => /disposed/.test(e)));
});
await test("minified distribution draws without loading extra scripts or pointer handlers", async (p) => {
  await p.goto(base + "/tests/fixture-3d.html");
  const r = await p.evaluate(async () => {
    const script = document.createElement("script");
    script.src = "/rhyform-3d.min.js";
    await new Promise((resolve, reject) => {
      script.onload = resolve;
      script.onerror = reject;
      document.head.append(script);
    });
    const registrations = [],
      original = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function (type, ...args) {
      if (/^(pointer|mouse|touch|click)/.test(type)) registrations.push(type);
      return original.call(this, type, ...args);
    };
    try {
      const s = rhyform.scene("#stage", { dimensions: 3 });
      s.cube().draw(1);
      s.seek(0.5);
      return { objects: s.stats().objects, registrations };
    } finally {
      EventTarget.prototype.addEventListener = original;
    }
  });
  assert.equal(r.objects, 1);
  assert.deepEqual(r.registrations, []);
});
await test("box assembly honors all dimensions and unsupported colors cannot silently turn white", async (p) => {
  const r = await p.evaluate(() => {
    const s = rhyform.scene("#stage", { dimensions: 3 });
    for (let i = 0; i < 6; i++) s.plane().tag("box");
    s.tag("box").show(0);
    s.tag("box").transformTo(
      { type: "cube", width: 4, height: 6, depth: 8 },
      1,
    );
    s.seek(1);
    const points = s
      .tag("box")
      .objects.flatMap((o) => [...o.snapshot().positions]);
    const spans = [0, 1, 2].map((k) => {
      const values = points.filter((_, i) => i % 3 === k);
      return Math.max(...values) - Math.min(...values);
    });
    const errors = [
      "var(--missing)",
      "currentColor",
      "#f008",
      "oklch(60% .1 100)",
    ].map((color) => {
      try {
        s.cube({ color });
      } catch (e) {
        return e.message;
      }
    });
    return { spans, errors, objects: s.stats().objects };
  });
  assert.deepEqual(r.spans, [4, 6, 8]);
  assert.ok(r.errors.every(Boolean));
  assert.equal(r.objects, 6);
});
await test("MathJax equations are extruded meshes with semantic transforms and reversible sampling", async (p) => {
  await p.addScriptTag({ url: base + "/node_modules/mathjax/es5/tex-svg.js" });
  await p.waitForFunction(() => typeof MathJax.tex2svgPromise === "function");
  const r = await p.evaluate(async () => {
    const s = rhyform.scene("#stage", { dimensions: 3 });
    const e = await s.equation("(x+1)^2=x^2+2x+1", { depth: 0.2 });
    e.draw(1);
    const transition = await e.transformTo("x^2+2x=(x+1)^2-1", { duration: 2 });
    e.rotateBy([0, 180, 0], 1);
    s.seek(2);
    const mid = [...e.snapshot().positions];
    s.seek(4);
    const end = e.snapshot();
    s.seek(2);
    const same =
      JSON.stringify(mid) === JSON.stringify([...e.snapshot().positions]);
    return {
      strategy: transition.strategy,
      map: transition.correspondence,
      mid,
      depth: end.depth,
      same,
      svg: document.querySelectorAll("#stage svg").length,
      geometries: s.stats().geometries,
    };
  });
  assert.equal(r.strategy, "semantic-match");
  assert.ok(r.map.matched > 5);
  assert.ok(r.mid.every(Number.isFinite));
  assert.equal(r.depth, 0.2);
  assert.equal(r.same, true);
  assert.equal(r.svg, 0);
  assert.equal(r.geometries, 1);
});
await test("an extruded pi glyph morphs to a disk and then a cube without opacity loss", async (p) => {
  await p.addScriptTag({ url: base + "/node_modules/mathjax/es5/tex-svg.js" });
  await p.waitForFunction(() => typeof MathJax.tex2svgPromise === "function");
  const r = await p.evaluate(async () => {
    const s = rhyform.scene("#stage", { dimensions: 3 }),
      e = await s.equation("\\pi", { depth: 0.2 });
    e.show(0);
    const a = e.transformTo({ type: "disk", radius: 1.5, depth: 0.2 }, 1);
    e.transformTo({ type: "cube", size: 2 }, 1);
    s.seek(0.5);
    const opacity = e.snapshot().opacity;
    s.seek(2);
    const end = e.snapshot();
    return {
      strategy: a.strategy,
      opacity,
      depth: end.depth,
      finite: [...end.positions].every(Number.isFinite),
    };
  });
  assert.equal(r.strategy, "contour-morph");
  assert.equal(r.opacity, 1);
  assert.equal(r.depth, 2);
  assert.equal(r.finite, true);
});
await test("clearing a 3D scene cancels pending equation imports and prevents resurrection", async (p) => {
  const r = await p.evaluate(async () => {
    const s = rhyform.scene("#stage", { dimensions: 3 });
    window.MathJax = { startup: { promise: new Promise(() => {}) } };
    const pending = s.equation("x");
    s.clear();
    let error;
    try {
      await pending;
    } catch (e) {
      error = e.name;
    }
    return { error, objects: s.stats().objects, pending: s.pendingAssets.size };
  });
  assert.deepEqual(r, { error: "AbortError", objects: 0, pending: 0 });
});
await test("the complete story plays to its ending, reconstructs chapters, and explains the rendered formula", async (p) => {
  await p.goto(base + "/examples/story.html");
  await p.waitForFunction(
    () => window.storyScene || !document.getElementById("error").hidden,
  );
  assert.equal(await p.locator("#error").isVisible(), false);
  const r = await p.evaluate(() => {
    const s = storyScene,
      chapters = storyChapters;
    for (const chapter of [...chapters].reverse()) {
      s.seek(chapter.time);
      const bounds = (tag) => {
        const o = s.tag(tag).objects[0].snapshot(),
          ys = [];
        for (let i = 0; i < o.positions.length; i += 3)
          ys.push(
            s.project([0, 1, 2].map((k) => o.positions[i + k] + o.position[k]))
              .y,
          );
        return {
          top: Math.min(...ys),
          bottom: Math.max(...ys),
          opacity: o.opacity,
        };
      };
      const equation = bounds("story/equation"),
        mesh = bounds("story/surface");
      if (
        equation.opacity === 1 &&
        mesh.opacity === 1 &&
        (equation.top < 0 || equation.bottom >= mesh.top)
      )
        throw Error("The equation is clipped or overlaps the surface");

      if (
        document.getElementById("chapter-title").textContent !== chapter.title
      )
        throw Error("Caption and scene are out of sync");
    }
    s.seek(s.duration);
    const surface = s.tag("story/surface").objects[0].snapshot();
    let residual = 0;
    for (let i = 0; i < surface.positions.length; i += 3) {
      const [x, y, z] = surface.positions.slice(i, i + 3);
      residual = Math.max(residual, Math.abs(y - (x * x - z * z) / 3));
    }
    const ending = document.getElementById("status").textContent;
    s.seek(0);
    return {
      residual,
      ending,
      duration: s.duration,
      chapters: chapters.length,
      playing: s.playing,
    };
  });
  assert.ok(r.residual < 1e-5);
  assert.equal(r.ending, "The end");
  assert.equal(r.chapters, 7);
  assert.equal(r.playing, false);
  await p.locator("#play").click();
  await p.waitForFunction(
    () => document.getElementById("status").textContent === "The end",
    null,
    { timeout: 65000 },
  );
  assert.equal(await p.locator("#play").innerText(), "Replay story");
  assert.equal(await p.evaluate(() => storyScene.playing), false);
  await p.locator("#source-toggle").click();
  assert.equal(await p.locator("#source-panel").isVisible(), true);
  await p.setViewportSize({ width: 390, height: 844 });
  assert.equal(
    await p.evaluate(() => document.documentElement.scrollWidth > innerWidth),
    false,
  );
  await p.emulateMedia({ reducedMotion: "reduce" });
  await p.locator("#restart").click();
  assert.equal(await p.evaluate(() => storyScene.playing), false);
  assert.equal(await p.evaluate(() => storyScene.currentTime), 0);
});
await browser.close();
await new Promise((r) => server.close(r));
console.log(`${passed} passed, ${failed} failed (${engine}, 3D).`);
if (failed) process.exitCode = 1;
