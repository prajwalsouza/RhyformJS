// Chapter scenes for "The Statistical Geometry of Invisible Causes".
// Each builder authors one Rhyform timeline and names its beats; the page plays
// the beat the reader has reached. Sliders drive live shapes through parameters.
import {
  palette as C,
  TAU,
  studio,
  ball,
  box,
  arrow,
  cloud,
  segment,
  polyline,
  curve,
  grid,
  lattice,
  arc,
  quad,
  disc,
  doubleCone,
  faceToward,
  rotateAxis,
  random,
  add,
  sub,
  mul,
  dot,
  len,
  unit,
  lerp3,
  clamp,
  ease,
  mix,
  normalPdf,
  laplacePdf,
  tPdf,
  tTail,
  correlation,
  slope,
  pCenter,
  pDistance,
  CLOUD_LIMIT,
} from "./invisible-causes-kit.js";

const fmt = (x, d = 2) => (Math.abs(x) < 5e-10 ? 0 : x).toFixed(d);

// Measurement space: the three readings (m1, m2, m3) sit on x, z and y (up).
const S = 0.5;
const room = ([a, b, c]) => [a * S, c * S, b * S];

function axes(k, length = 3.9, names = ["m<sub>1</sub>", "m<sub>2</sub>", "m<sub>3</sub>"]) {
  const style = { radius: 0.018, head: 0.2, headRadius: 0.07, color: C.chalk };
  const list = [
    k.shape(arrow([0, 0, 0], [length, 0, 0], style)),
    k.shape(arrow([0, 0, 0], [0, 0, length], style)),
    k.shape(arrow([0, 0, 0], [0, length, 0], style)),
  ];
  const ticks = [];
  for (let i = 1; i * S <= length - 0.25; i++)
    ticks.push(room([i, 0, 0]), room([0, i, 0]), room([0, 0, i]));
  const tickCloud = k.shape(cloud(ticks, 0.022, { color: C.chalk }));
  const labels = [
    k.label(names[0], [length + 0.25, 0, 0], { cls: "axis", from: Infinity, persist: true }),
    k.label(names[1], [0, 0, length + 0.25], { cls: "axis", from: Infinity, persist: true }),
    k.label(names[2], [0, length + 0.25, 0], { cls: "axis", from: Infinity, persist: true }),
  ];
  return {
    objects: [...list, tickCloud],
    draw(seconds = 1.2) {
      const t = k.now();
      labels.forEach((l) => (l.from = t + seconds * 0.6));
      list.forEach((o) => o.draw(seconds).startNextImmediately());
      return tickCloud.show(seconds);
    },
    hide(seconds = 0.6) {
      const t = k.now();
      labels.forEach((l) => (l.to = t));
      list.forEach((o) => o.hide(seconds).startNextImmediately());
      return tickCloud.hide(seconds);
    },
    labels,
  };
}

async function equation(k, tex, { at, toward, width = 2.4, color = C.paper, depth = 0.03 }) {
  return k.scene.equation(tex, {
    at,
    width,
    depth,
    color,
    rotation: faceToward(sub(toward, at)),
  });
}

// =================================================================== prologue

async function prologue(host) {
  const k = studio(host, {
    projection: "perspective",
    camera: { at: [13, 8.5, 12], lookAt: [2.4, 2.3, 2.4] },
    description: "An unseen knotted shape casts three shadows on the floor and two walls of a room.",
  });
  const W = 6;
  const floor = k.shape(grid([0, W], [0, W], 1, 0, { color: C.slate }));
  const back = k.shape(lattice([0, 0, 0], [1, 0, 0], [0, 1, 0], W, 5, { color: C.slate }));
  const side = k.shape(lattice([0, 0, 0], [0, 0, 1], [0, 1, 0], W, 5, { color: C.slate }));
  const center = [3.2, 2.5, 3.2];
  const axis = unit([0.35, 1, 0.2]);
  const angle = () => 0.32 * k.T() + 0.6;
  const knotPoint = (a) => {
    const p = 2,
      q = 3,
      R = 1.35,
      r = 0.55,
      s = R + r * Math.cos(q * a);
    const local = [s * Math.cos(p * a), r * Math.sin(q * a), s * Math.sin(p * a)];
    return add(center, rotateAxis(rotateAxis(local, [1, 0, 0], 0.9), axis, angle()));
  };
  const shadow = (project, color) =>
    k.live(() => curve((a) => project(knotPoint(a)), [0, TAU], 240), {
      color,
      lineWidth: 3,
    });
  const onFloor = shadow(([x, , z]) => [x, 0.01, z], "#7fa79a");
  const onBack = shadow(([x, y]) => [x, y, 0.01], "#8fa6c4");
  const onSide = shadow(([, y, z]) => [0.01, y, z], "#b49a86");
  const knot = k.live(
    () => ({
      type: "tube",
      curve: curve(knotPoint, [0, TAU], 200),
      radius: 0.13,
      uSegments: 200,
      vSegments: 10,
    }),
    { color: C.amber },
  );

  k.beat("title");
  floor.draw(1.2).startNextImmediately();
  back.draw(1.2).startNextImmediately();
  side.draw(1.2);
  onBack.draw(2.2).startNextImmediately();
  onFloor.draw(2.2).startNextImmediately();
  onSide.draw(2.2);
  k.hold(3);

  k.beat("caboose");
  k.hold(6);

  k.beat("reveal");
  knot.show(1.6);
  k.label("the thing itself", () => add(knotPoint(0.3), [0.3, 0.5, 0.3]), { cls: "tag" }).end(k.now() + 7);
  k.label("its shadows", [4.6, 0.02, 5.4], { cls: "tag soft" }).end(k.now() + 7);
  k.hold(6);

  k.beat("question");
  knot.hide(1.2);
  k.cam([3.2, 2.6, 15.5], [3.2, 2.6, 0], 3);
  k.hold(3);

  k.beat("cast");
  k.cam([13, 8.5, 12], [2.4, 2.3, 2.4], 3);
  k.hold(5);
  return k.finish();
}

// =================================================================== 1805 · Legendre

async function legendre(host) {
  const k = studio(host, {
    projection: "perspective",
    camera: { at: [8.8, 5.6, 8.2], lookAt: [1.4, 1.6, 1.3] },
    description: "Three measurements become one point in space; the mean is its shadow on the line of agreement.",
  });
  const { scene } = k;
  const view = [-4.6, 6.4, 12.6];

  // --- comets and noisy sightings, in the orbit's own tilted frame
  const frame = { at: [1.4, 1.7, 1.3], rotation: [-62, 28, 8] };
  const rx = 2.4,
    ry = 1.5;
  const E = (t) => [rx * Math.cos(t), ry * Math.sin(t), 0];
  const N = (t) => unit([ry * Math.cos(t), rx * Math.sin(t), 0]);
  const T = (t) => unit([-rx * Math.sin(t), ry * Math.cos(t), 0]);
  const rnd = random(1805);
  const sightings = Array.from({ length: 11 }, (_, i) => {
    const t = -0.6 + i * 0.36 + 0.08 * rnd();
    const e = 0.34 * rnd.normal();
    return { t, e, p: add(E(t), mul(N(t), e)) };
  });
  const orbit = k.shape({ type: "ellipse", radiusX: rx, radiusY: ry, segments: 160, color: C.mint, lineWidth: 2.5, ...frame });
  const sun = k.shape(ball([0, 0, 0], 0.16, { color: C.amber, ...frame }));
  const obs = k.shape(cloud(sightings.map((s) => s.p), 0.075, { color: C.paper, ...frame }));
  const misses = sightings.map((s) =>
    k.shape(segment(E(s.t), s.p, { color: C.coral, lineWidth: 2, ...frame })),
  );
  const squares = sightings.map((s) => {
    const a = E(s.t),
      b = s.p,
      w = mul(T(s.t), Math.abs(s.e));
    return k.shape(quad(a, b, add(b, w), add(a, w), { color: "#7a4a3f", ...frame }));
  });

  k.beat("comets");
  sun.show(0.6);
  obs.show(1.2);
  k.hold(1);
  orbit.draw(2.5);
  k.label("sightings from different nights and cities", add(frame.at, [0.6, 1.9, 0.2]), { cls: "tag" }).end(k.now() + 4.5);
  k.hold(1);
  misses.forEach((m) => m.draw(0.12));
  k.hold(1.5);

  k.beat("least-squares");
  squares.forEach((q) => q.draw(0.18));
  k.label("each miss, squared, is an area", add(frame.at, [-1.8, -0.6, 1.4]), { cls: "tag" }).end(k.now() + 6);
  k.hold(1);
  orbit.transformTo({ type: "ellipse", radiusX: rx * 1.1, radiusY: ry * 0.92, segments: 160 }, { duration: 1.4 });
  orbit.transformTo({ type: "ellipse", radiusX: rx, radiusY: ry, segments: 160 }, { duration: 1.4 });
  k.hold(2.5);

  // --- three weighings on a number line, balanced at their center of gravity
  k.beat("weighings");
  [...squares, ...misses].forEach((o) => o.hide(0.5).startNextImmediately());
  orbit.hide(0.8).startNextImmediately();
  obs.hide(0.8).startNextImmediately();
  sun.hide(0.8);
  k.cam([1.9, 2.3, 7.4], [1.7, 0.2, 0], 2.2);
  const line = k.shape(segment([-0.2, 0, 0], [3.9, 0, 0], { color: C.chalk, lineWidth: 2 }));
  const numberTicks = k.shape(cloud([1, 2, 3, 4, 5, 6, 7].map((i) => [i * S, 0, 0]), 0.03, { color: C.chalk }));
  const pivot = [1.5, 0, 0];
  const plank = k.shape(box([-1.6, -0.09, -0.14], [2.15, -0.03, 0.14], { color: "#51605f", at: pivot }));
  const fulcrum = k.shape({ type: "cone", radius: 0.26, height: 0.5, uSegments: 32, vSegments: 2, color: C.sky, at: [1.5, -0.34, 0] });
  const onPlank = k.shape(cloud([[-1, 0.06, 0], [-0.5, 0.06, 0], [1.5, 0.06, 0]], 0.1, { color: C.amber, at: pivot }));
  line.draw(1).startNextImmediately();
  numberTicks.show(1);
  const tickLabels = [1, 2, 6].map((v) =>
    k.label(`${v} kg`, [v * S, -0.32, 0], { cls: "tick" }),
  );
  onPlank.show(0.8);
  plank.show(0.6).startNextImmediately();
  fulcrum.show(0.6);
  const balance = k.label("balance point: 3", [1.5, -0.8, 0], { cls: "tag accent-sky" });
  plank.rotateTo([0, 0, 7], 0.7).startNextImmediately();
  onPlank.rotateTo([0, 0, 7], 0.7);
  plank.rotateTo([0, 0, -4], 0.7).startNextImmediately();
  onPlank.rotateTo([0, 0, -4], 0.7);
  plank.rotateTo([0, 0, 0], 1).startNextImmediately();
  onPlank.rotateTo([0, 0, 0], 1);
  k.hold(2);

  // --- the flip: three dots on a line become one point in a room
  k.beat("one-point");
  balance.end();
  tickLabels.forEach((l) => l.end());
  const beads = [0.5, 1, 3].map((x) => k.shape(ball([0, 0, 0], 0.1, { color: C.amber, at: [x, 0.06, 0] })));
  beads.forEach((b) => b.show(0).startNextImmediately());
  onPlank.hide(0.01);
  plank.hide(0.6).startNextImmediately();
  fulcrum.hide(0.6).startNextImmediately();
  line.hide(0.6).startNextImmediately();
  numberTicks.hide(0.6).startNextImmediately();
  k.cam(view, [1.3, 1.4, 1.3], 2.4);
  const floor = k.shape(grid([0, 3.5], [0, 3.5], 0.5, 0, { color: C.slate }));
  const ax = axes(k);
  floor.draw(1).startNextImmediately();
  ax.draw(1.2);
  beads[0].moveTo(room([1, 0, 0]), 1.2).startNextImmediately();
  beads[1].moveTo(room([0, 2, 0]), 1.2).startNextImmediately();
  beads[2].moveTo(room([0, 0, 6]), 1.2);
  const readingLabels = [
    k.label("1", add(room([1, 0, 0]), [0, -0.25, 0.1]), { cls: "tick" }),
    k.label("2", add(room([0, 2, 0]), [-0.15, -0.25, 0]), { cls: "tick" }),
    k.label("6", add(room([0, 0, 6]), [-0.25, 0, 0]), { cls: "tick" }),
  ];
  k.hold(0.6);

  // Live geometry: the reader's measurements (defaults 1, 2, 6) and a candidate constant.
  const m1 = k.param("m1", 1, 0, 8, 0.1, { label: "first reading m<sub>1</sub>" });
  const m2 = k.param("m2", 2, 0, 8, 0.1, { label: "second reading m<sub>2</sub>" });
  const m3 = k.param("m3", 6, 0, 8, 0.1, { label: "third reading m<sub>3</sub>" });
  const cand = k.param("c", 5, 0, 8, 0.1, { label: "candidate constant c" });
  const data = () => [m1.value, m2.value, m3.value];
  const mean = () => (m1.value + m2.value + m3.value) / 3;
  const P = () => room(data());
  const F = () => room([mean(), mean(), mean()]);
  const walk = k.live(() => polyline([[0, 0, 0], room([m1.value, 0, 0]), room([m1.value, m2.value, 0]), P()]), { color: "#a98a52", lineWidth: 2.5 });
  const point = k.live(() => ball(P(), 0.14, { u: 20, v: 10 }), { color: C.amber });
  walk.draw(2.4);
  point.show(0.6);
  readingLabels.forEach((l) => l.end());
  beads.forEach((b) => b.hide(0.4).startNextImmediately());
  const pointLabel = k.label("one point: (1, 2, 6)", () => add(P(), [0.25, 0.35, 0]), { cls: "tag accent-amber" });
  k.hold(2.5);

  k.beat("agreement");
  walk.hide(0.8);
  const diagonal = k.shape(segment([0, 0, 0], [3.9, 3.9, 3.9], { color: C.mint, lineWidth: 3 }));
  const diagTicks = k.shape(cloud([1, 2, 3, 4, 5, 6, 7].map((a) => room([a, a, a])), 0.05, { color: C.mint }));
  diagonal.draw(1.8);
  diagTicks.show(0.8);
  const agreeLabel = k.label("the line of agreement (a, a, a)", [3.7, 3.7, 3.7], { cls: "tag accent-mint" });
  k.label("(1, 1, 1)", add(room([1, 1, 1]), [0.35, -0.1, 0]), { cls: "tick" }).end(k.now() + 3.5);
  k.label("(2, 2, 2)", add(room([2, 2, 2]), [0.35, -0.1, 0]), { cls: "tick" }).end(k.now() + 3.5);
  k.hold(3.5);

  k.beat("shadow");
  const residual = k.live(() => segment(P(), F()), { color: C.coral, lineWidth: 4 });
  const foot = k.live(() => ball(F(), 0.12, { u: 20, v: 10 }), { color: C.sky });
  const corner = k.live(() => {
    const u = unit([1, 1, 1]),
      w = unit(sub(P(), F())),
      s = 0.22;
    return polyline([add(F(), mul(w, s)), add(add(F(), mul(w, s)), mul(u, -s)), add(F(), mul(u, -s))]);
  }, { color: C.paper, lineWidth: 2 });
  k.cam([-4.4, 6.6, 13.6], [1.2, 2.0, 1.2], 2.5).startNextImmediately();
  residual.draw(1.6);
  foot.show(0.5).startNextImmediately();
  corner.draw(0.8);
  const footLabel = k.label("(3, 3, 3)", () => add(F(), [0.1, -0.35, 0.3]), { cls: "tag accent-sky" });
  const meanEq = await equation(k, String.raw`\bar{x}=\tfrac{1+2+6}{3}=3`, {
    at: [0.3, 4.75, 0.9],
    toward: [-4.4, 6.6, 13.6],
    width: 1.9,
  });
  meanEq.draw(1.6);
  k.hold(3);

  k.beat("pythagoras");
  const O = [0, 0, 0];
  const triangle = k.live(() => quad(O, F(), P(), P()), { color: "#24444c" });
  const alongLine = k.live(() => segment(O, F()), { color: C.sky, lineWidth: 5 });
  const hyp = k.live(() => segment(O, P()), { color: C.paper, lineWidth: 2 });
  triangle.show(1).startNextImmediately();
  alongLine.draw(1.2).startNextImmediately();
  hyp.draw(1.2);
  const sq = (v) => v.reduce((s, x) => s + x * x, 0);
  const lab1 = k.label(`shadow² = 27`, () => add(mul(F(), 0.5), [0.35, -0.2, 0]), { cls: "tag accent-sky" });
  const lab2 = k.label(`miss² = 14`, () => lerp3(P(), F(), 0.5), { cls: "tag accent-coral" });
  const lab3 = k.label(`whole² = 41`, () => add(mul(P(), 0.5), [-0.5, 0.1, 0]), { cls: "tag" });
  const pyEq = await k.scene.equationDescriptor(String.raw`1^2+2^2+6^2=3\cdot3^2+\left(2^2+1^2+3^2\right)`, {
    width: 3.6,
    depth: 0.03,
    color: C.paper,
  });
  const sumEq = await k.scene.equationDescriptor(String.raw`41=27+14`, { width: 1.9, depth: 0.03, color: C.paper });
  meanEq.transformTo({ ...pyEq, at: [0.1, 4.75, 0.9] }, { duration: 2.2 });
  k.hold(1.2);
  meanEq.transformTo({ ...sumEq, at: [0.3, 4.75, 0.9] }, { duration: 1.8 });
  k.hold(3.5);

  k.beat("explore");
  meanEq.hide(0.6).startNextImmediately();
  [pointLabel, footLabel, lab1, lab2, lab3].forEach((l) => l.end());
  triangle.hide(0.6);
  k.cam(view, [1.5, 1.6, 1.5], 1.6);
  const C_ = () => room([cand.value, cand.value, cand.value]);
  const candidate = k.live(() => ball(C_(), 0.11, { u: 20, v: 10 }), { color: C.coral });
  const toCandidate = k.live(() => segment(P(), C_()), { color: C.coral, lineWidth: 2 });
  const shell = k.live(() => ball(P(), Math.max(0.02, len(sub(P(), C_()))), { u: 28, v: 14 }), { color: "#3a3230", wireframe: true });
  residual.colorTo(C.sky, 0.5).startNextImmediately();
  candidate.show(0.6).startNextImmediately();
  toCandidate.draw(0.8).startNextImmediately();
  shell.show(0.8);
  k.label("c", () => add(C_(), [0.25, -0.1, 0]), { cls: "tag accent-coral" });
  k.label("mean", () => add(F(), [0.2, -0.3, 0.2]), { cls: "tag accent-sky" });
  k.label("your data", () => add(P(), [0.25, 0.3, 0]), { cls: "tag accent-amber" });
  k.hold(1);
  k.panel({
    params: [m1, m2, m3, cand],
    presets: [
      { label: "Put c at the mean", set: [[cand, Math.round(mean() * 10) / 10]] },
      { label: "Readings 1, 2, 6", set: [[m1, 1], [m2, 2], [m3, 6], [cand, 5]] },
    ],
    readout() {
      const y = data(),
        c = cand.value,
        m = mean();
      const at = y.reduce((s, v) => s + (v - c) ** 2, 0);
      const best = y.reduce((s, v) => s + (v - m) ** 2, 0);
      return `Mean <b class="sky">${fmt(m)}</b>. Squared error at c = ${fmt(c, 1)}: <b class="coral">${fmt(at, 1)}</b>. The smallest possible is <b>${fmt(best, 1)}</b>, and it only happens where the miss meets the line at a right angle.`;
    },
  });
  return k.finish();
}

// =================================================================== why squares

async function squares(host) {
  const k = studio(host, {
    projection: "perspective",
    camera: { at: [-5.2, 6.2, 12.8], lookAt: [1.2, 1.9, 1.1] },
    description: "A sphere and a diamond grow around the data point (0, 0, 10) until each touches the line of agreement.",
  });
  const s2 = 0.35;
  const R2 = ([a, b, c]) => [a * s2, c * s2, b * s2];
  const floor = k.shape(grid([0, 3.5], [0, 3.5], 0.35, 0, { color: C.slate }));
  const ax = axes(k, 3.9);
  const diagonal = k.shape(segment(R2([-2, -2, -2]), R2([11, 11, 11]), { color: C.mint, lineWidth: 3 }));
  const third = k.param("m3", 10, 0, 20, 0.5, { label: "third reading m<sub>3</sub>" });
  const q = k.param("p", 2, 1, 8, 0.05, {
    label: "distance rule p",
    format: (v) => (v >= 8 ? "∞" : v.toFixed(2)),
  });
  const ys = () => [0, 0, third.value];
  const P = () => R2(ys());
  // Authored motion before the explore beat, the reader's sliders after it.
  let exploreAt = Infinity;
  let sphereWin = () => 0,
    shrinkWin = () => 0,
    diamondWin = () => 0;
  const pNow = () => (k.T() >= exploreAt ? (q.value >= 8 ? Infinity : q.value) : shrinkWin() > 0 ? 1 : 2);
  const center = () => pCenter(ys(), pNow());
  const touch = () => R2([center(), center(), center()]);
  const radius = () => {
    const c = center(),
      d = pDistance(ys().map((y) => y - c), pNow()) * s2;
    if (k.T() >= exploreAt) return d;
    if (shrinkWin() > 0) return d * (diamondWin() > 0 ? diamondWin() : 1 - shrinkWin());
    return d * sphereWin();
  };
  const point = k.live(() => ball(P(), 0.13, { u: 16, v: 8 }), { color: C.amber });
  const blob = k.live(() => ball(P(), Math.max(radius(), 0.001), { p: pNow(), u: 48, v: 24 }), { color: "#6f5a8c" });
  const shell = k.live(() => ball(P(), Math.max(radius(), 0.001), { p: pNow(), u: 24, v: 12 }), { color: "#b59ce6", wireframe: true });
  const kiss = k.live(() => ball(touch(), 0.1, { u: 16, v: 8 }), { color: C.sky });

  k.beat("why");
  floor.draw(0.8).startNextImmediately();
  ax.draw(1);
  diagonal.draw(1.2);
  point.show(0.6);
  k.label("data (0, 0, 10)", () => add(P(), [0.3, 0.3, 0]), { cls: "tag accent-amber" });
  k.label("line of agreement", R2([10, 10, 10]), { cls: "tag accent-mint" });
  k.hold(2.5);

  k.beat("sphere");
  let t0 = k.now();
  shell.show(0.3).startNextImmediately();
  blob.fadeTo(0.3, 0.3);
  k.scene.wait(3.7);
  sphereWin = k.window(t0, t0 + 4);
  kiss.show(0.4);
  const meanLabel = k.label("closest in ordinary distance: 3.33 = the mean", () => add(touch(), [0.5, -0.35, 0]), { cls: "tag accent-sky" });
  k.hold(3);

  k.beat("diamond");
  meanLabel.end();
  kiss.hide(0.3);
  t0 = k.now();
  k.scene.wait(1.6);
  shrinkWin = k.window(t0, t0 + 1.6);
  t0 = k.now();
  k.scene.wait(4);
  diamondWin = k.window(t0, t0 + 4);
  kiss.show(0.4);
  const medianLabel = k.label("closest in absolute distance: 0 = the median", () => add(touch(), [1.1, 0.25, 0]), { cls: "tag accent-sky" });
  k.cam([-6.4, 3.8, 11.6], [1.1, 1.5, 1.2], 2.5);
  k.hold(2.5);

  k.beat("explore");
  medianLabel.end();
  exploreAt = k.now();
  k.cam([-5.2, 6.2, 12.8], [1.2, 1.9, 1.1], 1.5);
  k.label("closest point", () => add(touch(), [0.7, -0.3, 0]), { cls: "tag accent-sky" });
  k.hold(0.5);
  k.panel({
    params: [q, third],
    presets: [
      { label: "p = 1 (absolute)", set: [[q, 1]] },
      { label: "p = 2 (squared)", set: [[q, 2]] },
      { label: "p = ∞ (worst miss)", set: [[q, 8]] },
    ],
    readout() {
      const y = ys(),
        c = center();
      const sorted = [...y].sort((a, b) => a - b);
      return `Closest constant <b class="sky">${fmt(c)}</b>. For these readings the median is <b>${fmt(sorted[1])}</b>, the mean is <b>${fmt((y[0] + y[1] + y[2]) / 3)}</b>, and the midrange is <b>${fmt((sorted[0] + sorted[2]) / 2)}</b>. Drag the third reading: the mean chases the outlier, the median ignores it.`;
    },
  });

  // --- the shape of the noise decides the penalty
  k.beat("noise");
  [blob, shell, kiss, point].forEach((o) => o.hide(0.5).startNextImmediately());
  ax.hide(0.5);
  floor.hide(0.4).startNextImmediately();
  diagonal.hide(0.4);
  const plot = { at: [0.6, 0.2, 0] };
  const gauss = (x) => [x, 3.2 * normalPdf(x), 0];
  const lap = (x) => [x, 3.2 * laplacePdf(x), 0];
  const baseline = k.shape(segment([-3.4, 0, 0], [3.4, 0, 0], { color: C.dim, lineWidth: 1.5, ...plot }));
  const bell = k.shape(curve(gauss, [-3.2, 3.2], 160, { color: C.sky, lineWidth: 3.5, ...plot }));
  const peak = k.shape(curve(lap, [-3.2, 3.2], 160, { color: C.coral, lineWidth: 3.5, ...plot }));
  k.cam([0.6, 1.6, 11], [0.6, 1.1, 0], 2).startNextImmediately();
  baseline.draw(0.8);
  bell.draw(1.4).startNextImmediately();
  peak.draw(1.4);
  const gl = k.label("Gaussian noise: big misses are very rare", [2.3, 1.2, 0], { cls: "tag accent-sky" });
  const ll = k.label("Laplace noise: sharper peak, fatter tails", [-2.3, 1.9, 0], { cls: "tag accent-coral" });
  k.hold(2.5);
  gl.end();
  ll.end();
  // Maximum likelihood: the penalty is minus the log of the noise's shape.
  bell.transformTo(curve((x) => [x, 0.42 * x * x, 0], [-3.2, 3.2], 160), { duration: 2.4 }).startNextImmediately();
  peak.transformTo(curve((x) => [x, 0.42 * Math.SQRT2 * Math.abs(x) * 1.25, 0], [-3.2, 3.2], 160), { duration: 2.4 });
  k.label("−log(Gaussian) ∝ error²", [2.9, 3.1, 0], { cls: "tag accent-sky" });
  k.label("−log(Laplace) ∝ |error|", [-2.9, 2.2, 0], { cls: "tag accent-coral" });
  k.hold(3);

  k.beat("pythagoras-of-noise");
  [baseline, bell, peak].forEach((o) => o.hide(0.5).startNextImmediately());
  k.hold(0.5);
  const o = [-1.6, 0, 0],
    a = [1.6, 0, 0],
    b = [1.6, 2.2, 0];
  const legA = k.shape(arrow(o, a, { color: C.sky, radius: 0.04 }));
  const legB = k.shape(arrow(a, b, { color: C.coral, radius: 0.04 }));
  const hyp = k.shape(arrow(o, b, { color: C.paper, radius: 0.04 }));
  const corner = k.shape(polyline([[1.35, 0, 0], [1.35, 0.25, 0], [1.6, 0.25, 0]], { color: C.paper, lineWidth: 2 }));
  legA.draw(1).startNextImmediately();
  legB.draw(1);
  corner.draw(0.4);
  hyp.draw(1.2);
  k.label("noise from source 1: σ₁", [0, -0.3, 0], { cls: "tag accent-sky" });
  k.label("independent noise: σ₂", [2.7, 1.1, 0], { cls: "tag accent-coral" });
  k.label("combined: √(σ₁² + σ₂²)", [-0.6, 1.5, 0], { cls: "tag" });
  const eq = await equation(k, String.raw`\sigma^2_{\text{total}}=\sigma_1^2+\sigma_2^2`, {
    at: [0.3, 3.2, 0],
    toward: [0.6, 1.6, 11],
    width: 3,
  });
  eq.draw(1.5);
  k.hold(3);
  return k.finish();
}

// =================================================================== n − 1

async function bessel(host) {
  const k = studio(host, {
    projection: "perspective",
    camera: { at: [-4.6, 6.4, 12.6], lookAt: [1.2, 1.4, 1.2] },
    description: "Residuals always add to zero, so centered data lie on a plane: one direction is spent on the mean.",
  });
  const floor = k.shape(grid([0, 3.5], [0, 3.5], 0.5, 0, { color: C.slate }));
  const ax = axes(k);
  const diagonal = k.shape(segment(room([-4, -4, -4]), room([8, 8, 8]), { color: C.mint, lineWidth: 3 }));
  const P = room([1, 2, 6]),
    F = room([3, 3, 3]),
    r = sub(P, F);
  const point = k.shape(ball(P, 0.13, { u: 16, v: 8, color: C.amber }));
  const foot = k.shape(ball(F, 0.11, { u: 16, v: 8, color: C.sky }));
  const miss = k.shape(arrow(F, P, { color: C.coral, radius: 0.035, head: 0.25, headRadius: 0.09 }));

  k.beat("locked");
  floor.show(0.6).startNextImmediately();
  ax.draw(1).startNextImmediately();
  diagonal.draw(1);
  point.show(0.4).startNextImmediately();
  foot.show(0.4).startNextImmediately();
  miss.draw(0.8);
  k.label("(1, 2, 6)", add(P, [0.3, 0.25, 0]), { cls: "tag accent-amber" }).end(k.now() + 1.5);
  k.hold(1);
  miss.moveTo(mul(F, -1), 1.8);
  k.label("residuals r = (−2, −1, +3)", add(r, [0.2, 0.35, 0]), { cls: "tag accent-coral" });
  const sumLabel = k.label("−2 + (−1) + 3 = 0, always", [-1.4, -0.4, 0.4], { cls: "tag" });
  k.hold(2.5);

  k.beat("plane");
  sumLabel.end();
  const plane = k.shape(disc([0, 0, 0], [1, 1, 1], 3.1, { color: "#23373b" }));
  const rim = k.shape(curve((t) => {
    const u = unit([1, -1, 0]),
      w = unit([1, 1, -2]);
    return add(mul(u, 3.1 * Math.cos(t)), mul(w, 3.1 * Math.sin(t)));
  }, [0, TAU], 128, { color: "#4d7a74", lineWidth: 2 }));
  plane.draw(1.6).startNextImmediately();
  rim.draw(1.6);
  floor.hide(0.6).startNextImmediately();
  k.cam([-7.4, 3.2, 10.4], [0.4, 0.4, 0.4], 2.5);
  k.label("every centered data set lives on this plane: r₁ + r₂ + r₃ = 0", [-1.2, -1.5, 1.8], { cls: "tag accent-mint" });
  k.hold(2.5);

  k.beat("cloud");
  const rnd = random(1837);
  const sigma = 1.1;
  const raw = Array.from({ length: CLOUD_LIMIT }, () =>
    [3, 3, 3].map((m) => m + sigma * rnd.normal()),
  );
  const centered = raw.map((y) => {
    const m = (y[0] + y[1] + y[2]) / 3;
    return y.map((v) => v - m);
  });
  const dots = k.shape(cloud(raw.map(room), 0.07, { color: C.amber }));
  [point, foot].forEach((x) => x.hide(0.4).startNextImmediately());
  miss.hide(0.4);
  dots.show(1);
  k.label("64 samples of three readings: a cloud in 3D", add(room([3, 3, 3]), [1.4, 1.3, 0]), { cls: "tag accent-amber" }).end(k.now() + 2.5);
  k.hold(2.5);
  dots.transformTo(cloud(centered.map(room), 0.07), { duration: 3.2 });
  k.label("subtract each sample’s own mean: the cloud is crushed flat", [1.9, 2.4, 0.2], { cls: "tag accent-coral" });
  dots.colorTo(C.coral, 0.8);
  k.hold(2.2);

  k.beat("spent");
  const n = unit([1, 1, 1]),
    u1 = unit([1, -1, 0]),
    u2 = unit([1, 1, -2]);
  const free1 = k.shape(arrow([0, 0, 0], mul(u1, 2.3), { color: C.sky, radius: 0.04 }));
  const free2 = k.shape(arrow([0, 0, 0], mul(u2, 2.3), { color: C.sky, radius: 0.04 }));
  const spent = k.shape(arrow([0, 0, 0], mul(n, 2.6), { color: C.mint, radius: 0.05 }));
  free1.draw(1).startNextImmediately();
  free2.draw(1);
  spent.draw(1);
  k.label("free", mul(u1, 2.6), { cls: "tag accent-sky" });
  k.label("free", mul(u2, 2.6), { cls: "tag accent-sky" });
  k.label("spent on the mean", mul(n, 2.95), { cls: "tag accent-mint" });
  const eq = await equation(k, String.raw`s^2=\frac{r_1^2+r_2^2+r_3^2}{n-1}`, {
    at: [-0.9, 3.5, 0.9],
    toward: [-7.4, 3.2, 10.4],
    width: 2.1,
  });
  eq.draw(1.6);
  k.hold(3);

  k.beat("explore");
  const seed = k.param("seed", 1, 1, 40, 1, { label: "draw another 64 samples", format: (v) => `#${v}` });
  const spread = k.param("σ", 1.1, 0.4, 1.6, 0.05, { label: "true spread σ" });
  const draw = () => {
    const g = random(1837 + seed.value * 97);
    return Array.from({ length: CLOUD_LIMIT }, () => [0, 0, 0].map(() => spread.value * g.normal()));
  };
  const liveRaw = k.live(() => cloud(draw().map((e) => room(e.map((x) => x + 3))), 0.05), { color: "#8a7a55" });
  const liveCentered = k.live(() => cloud(draw().map((e) => {
    const m = (e[0] + e[1] + e[2]) / 3;
    return room(e.map((x) => x - m));
  }), 0.07), { color: C.coral });
  eq.hide(0.5).startNextImmediately();
  dots.hide(0.5).startNextImmediately();
  liveRaw.show(0.5).startNextImmediately();
  liveCentered.show(0.5);
  k.panel({
    params: [seed, spread],
    readout() {
      // Average over many more samples than are drawn, so the numbers settle.
      const g = random(7 + seed.value);
      let full = 0,
        resid = 0;
      const N = 4000;
      for (let i = 0; i < N; i++) {
        const e = [g.normal(), g.normal(), g.normal()];
        const m = (e[0] + e[1] + e[2]) / 3;
        full += e.reduce((a, x) => a + x * x, 0);
        resid += e.reduce((a, x) => a + (x - m) ** 2, 0);
      }
      return `Averaged over ${N.toLocaleString()} samples: squared distance from the true center ≈ <b class="amber">${fmt(full / N)}</b>&thinsp;σ²; squared residual ≈ <b class="coral">${fmt(resid / N)}</b>&thinsp;σ². Three directions of wobble before centering, two after. Divide by 3 and you underestimate σ² by a third; divide by <b>n − 1 = 2</b> and you’re right on average.`;
    },
  });
  k.hold(0.6);
  return k.finish();
}

// =================================================================== 1908 · Gosset

async function gosset(host) {
  const k = studio(host, {
    projection: "perspective",
    camera: { at: [0.6, 3.8, 11.5], lookAt: [0.3, 0.6, 0] },
    description: "Small samples of barley; then Student's t drawn as an angle and a cone in three dimensions.",
  });
  // --- tiny samples: the spread estimate itself is noisy
  const rnd = random(1908);
  const rows = Array.from({ length: 7 }, (_, i) => {
    let v = [0, 0, 0].map(() => rnd.normal());
    if (i === 4) v = [0.72, 0.8, 0.9]; // a sample that happens to agree with itself
    const m = (v[0] + v[1] + v[2]) / 3,
      sd = Math.sqrt(v.reduce((a, x) => a + (x - m) ** 2, 0) / 2);
    return { v, m, sd, t: m / (sd / Math.sqrt(3)), z: -2.4 + i * 0.8 };
  });
  const xs = 1.1;
  const target = k.shape(segment([0, -0.05, -2.9], [0, -0.05, 2.9], { color: C.mint, lineWidth: 2 }));
  const lanes = rows.map((r) => k.shape(segment([-2.8, 0, r.z], [2.8, 0, r.z], { color: C.slate, lineWidth: 1.5 })));
  const dots = rows.map((r) => k.shape(cloud(r.v.map((x) => [x * xs, 0.08, r.z]), 0.09, { color: C.amber })));
  const means = rows.map((r) => k.shape(box([r.m * xs - 0.025, 0, r.z - 0.2], [r.m * xs + 0.025, 0.35, r.z + 0.2], { color: C.sky })));
  const spreads = rows.map((r) =>
    k.shape(box([r.m * xs - r.sd * xs, 0.02, r.z - 0.04], [r.m * xs + r.sd * xs, 0.06, r.z + 0.04], { color: "#5c7fa3" })),
  );

  k.beat("brewery");
  k.cam([0.2, 7.6, 11.2], [0.1, -0.2, -0.2], 1.5).startNextImmediately();
  target.draw(0.8);
  rows.forEach((_, i) => {
    lanes[i].draw(0.25).startNextImmediately();
    dots[i].show(0.35);
  });
  k.label("target value", [0, 0.1, -3.2], { cls: "tag accent-mint" }).end(k.now() + 12);
  k.label("each row: one small sample of three barley extracts", [-2.5, 0.2, 3.3], { cls: "tag" }).end(k.now() + 12);
  k.hold(2);

  k.beat("ratio");
  means.forEach((m) => m.show(0.25).startNextImmediately());
  k.hold(0.3);
  spreads.forEach((m) => m.draw(0.25));
  const tEq = await equation(k, String.raw`t=\frac{\bar{x}-\mu_0}{s/\sqrt{n}}`, {
    at: [0.9, 1.3, -3.7],
    toward: [0.2, 7.6, 11.2],
    width: 1.7,
  });
  tEq.draw(1.4);
  rows.forEach((r) =>
    k.label(`t = ${r.t.toFixed(1)}`, [2.95, 0.1, r.z], { cls: `tick ${Math.abs(r.t) > 4.3 ? "accent-coral" : ""}` }).end(k.now() + 9),
  );
  k.label("by luck, three readings that agree: tiny s, enormous t", [rows[4].m * xs, 0.55, rows[4].z], { cls: "tag accent-coral" }).end(k.now() + 9);
  k.hold(3.5);

  // --- Fisher's picture: t is an angle
  k.beat("angle");
  tEq.hide(0.5).startNextImmediately();
  [target, ...lanes, ...dots, ...means, ...spreads].forEach((o) => o.hide(0.5).startNextImmediately());
  k.hold(0.5);
  const R = 2.3;
  const d = unit([1, 1, 1]);
  const sample = room([1.9, 1.1, 2.9]);
  const shadowPt = mul(d, dot(sample, d));
  const diag = k.shape(segment(mul(d, -3.4), mul(d, 3.4), { color: C.mint, lineWidth: 3 }));
  const ax = axes(k, 2.6, ["", "", ""]);
  const pt = k.shape(ball(sample, 0.11, { u: 16, v: 8, color: C.amber }));
  const toPt = k.shape(segment([0, 0, 0], sample, { color: C.paper, lineWidth: 2 }));
  const shadowSeg = k.shape(segment([0, 0, 0], shadowPt, { color: C.sky, lineWidth: 5 }));
  const missSeg = k.shape(segment(shadowPt, sample, { color: C.coral, lineWidth: 4 }));
  const angle = k.shape(arc([0, 0, 0], d, sample, 0.7, { color: C.amber, lineWidth: 3 }));
  k.cam([-4.2, 3.4, 9.2], [0.4, 0.8, 0.4], 2).startNextImmediately();
  ax.draw(0.8);
  diag.draw(1).startNextImmediately();
  pt.show(0.6);
  toPt.draw(0.8);
  shadowSeg.draw(0.8).startNextImmediately();
  missSeg.draw(0.8);
  angle.draw(0.6);
  k.label("shadow on the line ∝ the mean", mul(shadowPt, 0.55), { cls: "tag accent-sky" }).end(k.now() + 8);
  k.label("miss ∝ the spread s", add(lerp3(shadowPt, sample, 0.5), [0.35, 0, 0]), { cls: "tag accent-coral" }).end(k.now() + 8);
  k.label("θ", add(mul(unit(add(d, unit(sample))), 0.95), [0, 0.05, 0]), { cls: "axis accent-amber" }).end(k.now() + 8);
  const cotEq = await equation(k, String.raw`t=\sqrt{2}\,\cot\theta`, {
    at: [0.2, 3.1, 0.4],
    toward: [-4.2, 3.4, 9.2],
    width: 1.6,
  });
  cotEq.draw(1.2);
  k.hold(3.5);

  // --- no effect + round noise = a direction chosen uniformly at random
  k.beat("cone");
  cotEq.hide(0.5).startNextImmediately();
  [pt, toPt, shadowSeg, missSeg, angle].forEach((o) => o.hide(0.5).startNextImmediately());
  k.hold(0.5);
  const g = random(1925);
  const dirs = Array.from({ length: 3 * CLOUD_LIMIT }, () => unit([g.normal(), g.normal(), g.normal()]));
  const tc = k.param("t*", 4.3, 1, 8, 0.01, { label: "significance threshold t*" });
  let exploreAt = Infinity,
    widen = () => 0,
    narrow = () => 0;
  const threshold = () => {
    if (k.T() >= exploreAt) return tc.value;
    return mix(mix(4.303, 1.96, widen()), 4.303, narrow());
  };
  const theta = () => Math.atan(Math.SQRT2 / threshold());
  const inside = (v) => Math.abs(dot(v, d)) >= Math.cos(theta());
  const sphere = k.shape(ball([0, 0, 0], R, { u: 36, v: 18, color: "#27383d", wireframe: true }));
  const chunks = [0, 1, 2].map((c) => dirs.slice(c * CLOUD_LIMIT, (c + 1) * CLOUD_LIMIT));
  const hits = chunks.map((ch) => k.live(() => cloud(ch.map((v) => mul(v, R)), ch.map((v) => (inside(v) ? 0.075 : 0))), { color: C.coral }));
  const misses = chunks.map((ch) => k.live(() => cloud(ch.map((v) => mul(v, R)), ch.map((v) => (inside(v) ? 0 : 0.05))), { color: "#8d9a96" }));
  const cone = k.live(() => doubleCone(d, theta(), 2.9), { color: "#6b4a3e" });
  const coneWire = k.live(() => doubleCone(d, theta(), 2.9), { color: C.coral, wireframe: true });
  sphere.show(0.8);
  misses.forEach((m) => m.show(0.8).startNextImmediately());
  k.hold(0.8);
  cone.show(1).startNextImmediately();
  coneWire.show(1);
  hits.forEach((m) => m.show(0.5).startNextImmediately());
  const count = () => dirs.filter(inside).length;
  k.label("each dot: the direction of one ‘nothing is going on’ sample", [2.2, -1.7, 1.2], { cls: "tag" }).end(k.now() + 6);
  k.label("Student’s cone: t > 4.30, θ < 18.2°", mul(d, 3.25), { cls: "tag accent-coral" }).end(k.now() + 4);
  k.hold(3.5);

  k.beat("normal-table");
  let t0 = k.now();
  k.scene.wait(2.5);
  widen = k.window(t0, t0 + 2.5);
  k.label("normal table: t > 1.96, θ < 35.8° — about 19% false alarms", mul(d, 3.25), { cls: "tag accent-coral" }).end(k.now() + 3);
  k.hold(3);
  t0 = k.now();
  k.scene.wait(2.5);
  narrow = k.window(t0, t0 + 2.5);
  k.label("Student’s table: t > 4.30 — 5%, as promised", mul(d, 3.25), { cls: "tag accent-mint" });
  k.hold(2.5);

  k.beat("explore");
  exploreAt = k.now();
  k.hold(0.3);
  k.panel({
    params: [tc],
    presets: [
      { label: "Normal table: 1.96", set: [[tc, 1.96]] },
      { label: "Student, n = 3: 4.30", set: [[tc, 4.3]] },
    ],
    readout() {
      const t = threshold(),
        th = (theta() * 180) / Math.PI,
        rate = 1 - t / Math.sqrt(2 + t * t);
      return `Cone half-angle <b class="amber">${th.toFixed(1)}°</b>. Chance that pure noise lands inside (the two caps’ share of the sphere, 1 − cos θ): <b class="coral">${(100 * rate).toFixed(1)}%</b>. Simulated: <b>${count()}</b> of ${dirs.length} dots, ${((100 * count()) / dirs.length).toFixed(1)}%.`;
    },
  });

  // --- the family of t curves
  k.beat("tails");
  [sphere, cone, coneWire, ...hits, ...misses].forEach((o) => o.hide(0.6).startNextImmediately());
  ax.hide(0.4);
  diag.hide(0.4);
  const zOf = (nu) => -2.6 + (5.2 * Math.log(nu)) / Math.log(30);
  const nuOf = (z) => Math.exp(((z + 2.6) / 5.2) * Math.log(30));
  const H = 6;
  const family = k.shape({
    type: "heightField",
    x: [-4, 4],
    z: [-2.6, 2.6],
    uSegments: 96,
    vSegments: 40,
    fn: (x, z) => H * tPdf(x, nuOf(z)),
    color: "#2f5d58",
  });
  const normalCurve = k.shape(curve((x) => [x, H * normalPdf(x), 3.1], [-4, 4], 160, { color: C.paper, lineWidth: 3 }));
  const df = k.param("df", 2, 1, 30, 1, { label: "sample size − 1 (degrees of freedom)", format: (v) => v.toFixed(0) });
  const pick = k.live(() => curve((x) => [x, H * tPdf(x, df.value) + 0.02, zOf(df.value)], [-4, 4], 160), { color: C.amber, lineWidth: 4 });
  k.cam([11.8, 7.8, 13.2], [0, 0.6, 0], 2.5).startNextImmediately();
  family.draw(2.5);
  normalCurve.draw(1.2).startNextImmediately();
  pick.draw(1.2);
  k.label("the normal curve (known noise)", [-2.6, 0.8, 3.3], { cls: "tag" });
  k.label("1 degree of freedom: very fat tails", [-3.6, 0.5, zOf(1)], { cls: "tag accent-coral" });
  k.label("30: almost normal", [3.2, 0.6, zOf(30)], { cls: "tag accent-mint" });
  k.label(() => `ν = ${df.value}`, () => [0.4, H * tPdf(0, df.value) + 0.35, zOf(df.value)], { cls: "tag accent-amber" });
  k.hold(1);
  k.panel({
    params: [df],
    readout() {
      const nu = df.value;
      return `With ${nu + 1} measurements (ν = ${nu}), a |t| beyond 1.96 happens <b class="amber">${(100 * tTail(1.96, nu)).toFixed(1)}%</b> of the time by pure chance&thinsp;—&thinsp;not the 5% the normal table promises.`;
    },
  });
  return k.finish();
}

// =================================================================== 1886 · Galton

async function galton(host) {
  const k = studio(host, {
    projection: "perspective",
    camera: { at: [7.8, 7.4, 9.6], lookAt: [0, 0.6, 0] },
    description: "Parents' and children's heights as a cloud; the density rises into an elliptical mountain whose tangent points trace the regression line.",
  });
  const rho = k.param("ρ", 0.5, -0.9, 0.95, 0.01, { label: "correlation ρ" });
  let exploreAt = Infinity;
  const r = () => (k.T() >= exploreAt ? rho.value : 0.5);
  const q = () => Math.sqrt(1 - r() * r());
  const rnd = random(1886);
  const base = Array.from({ length: 2 * CLOUD_LIMIT }, () => [rnd.normal(), rnd.normal()]);
  const pt = ([u, v]) => [u, 0.03, r() * u + q() * v];
  const H = 5.2;
  const density = (x, z) => {
    const R = r(),
      Q = (x * x - 2 * R * x * z + z * z) / (1 - R * R);
    return (H * Math.exp(-Q / 2)) / (TAU * Math.sqrt(1 - R * R)) * 2.2;
  };
  const floor = k.shape(grid([-3, 3], [-3, 3], 0.5, 0, { color: C.slate }));
  const xAxis = k.shape(arrow([-3.2, 0, 0], [3.4, 0, 0], { color: C.chalk, radius: 0.018, head: 0.2, headRadius: 0.07 }));
  const zAxis = k.shape(arrow([0, 0, -3.2], [0, 0, 3.4], { color: C.chalk, radius: 0.018, head: 0.2, headRadius: 0.07 }));
  const people = [0, 1].map((c) =>
    k.live(() => cloud(base.slice(c * CLOUD_LIMIT, (c + 1) * CLOUD_LIMIT).map(pt), 0.06), { color: C.amber }),
  );

  k.beat("heights");
  floor.draw(1).startNextImmediately();
  xAxis.draw(1).startNextImmediately();
  zAxis.draw(1);
  people.forEach((p) => p.show(1.2).startNextImmediately());
  k.hold(1.2);
  const axisNames = [
    k.label("parents’ height", [3.6, 0, 0.3], { cls: "tag", persist: true }),
    k.label("child’s height", [0.4, 0, 3.6], { cls: "tag", persist: true }),
  ];
  k.label("one family", pt(base[3]), { cls: "tag accent-amber" });
  k.hold(2.5);

  k.beat("mountain");
  const hill = k.live(() => ({ type: "heightField", x: [-3, 3], z: [-3, 3], uSegments: 64, vSegments: 64, fn: density }), { color: "#2c5a55" });
  const levels = [0.7, 1.3, 1.9];
  const ring = (c, lift) => () =>
    curve((t) => {
      const x = c * Math.cos(t),
        z = c * (r() * Math.cos(t) + q() * Math.sin(t));
      return [x, lift ? density(x, z) + 0.02 : 0.02, z];
    }, [0, TAU], 128);
  const rings = levels.map((c) => k.live(ring(c, true), { color: C.mint, lineWidth: 2.5 }));
  const shadows = levels.map((c) => k.live(ring(c, false), { color: "#4d7a70", lineWidth: 1.5 }));
  people.forEach((p) => p.fadeTo(0.35, 0.8).startNextImmediately());
  hill.draw(2.6);
  rings.forEach((x) => x.draw(0.7).startNextImmediately());
  shadows.forEach((x) => x.draw(0.7));
  k.label("equal-frequency contours are ellipses", () => [1.9, density(1.9, 1.9 * r()) + 0.2, 1.9 * r() + 0.6], { cls: "tag accent-mint" });
  k.hold(2.5);

  k.beat("tangents");
  const tips = k.live(() => cloud(levels.flatMap((c) => [[c, 0.03, c * r()], [-c, 0.03, -c * r()]]), 0.09), { color: C.coral });
  const regression = k.live(() => segment([-3, 0.04, -3 * r()], [3, 0.04, 3 * r()]), { color: C.coral, lineWidth: 4 });
  const sdLine = k.shape(segment([-3, 0.03, -3], [3, 0.03, 3], { color: C.dim, lineWidth: 2 }));
  k.cam([0.4, 11.5, 2.2], [0, 0, 0], 2.5).startNextImmediately();
  hill.fadeTo(0.25, 1.5);
  tips.show(0.6);
  regression.draw(1.4);
  sdLine.draw(1);
  k.label("where each ellipse stands vertical", [1.9, 0.05, 1.9 * 0.5 - 0.35], { cls: "tag accent-coral" });
  k.label("regression line: slope ρ = 0.5", [-2.6, 0.05, -1.7], { cls: "tag accent-coral" });
  k.label("‘like parent, like child’: slope 1", [2.4, 0.05, 2.9], { cls: "tag soft" });
  k.hold(3);

  k.beat("explore");
  exploreAt = k.now();
  k.cam([6.8, 8.4, 8.6], [0, 0.4, 0], 2);
  k.label(() => `slope ${rho.value.toFixed(2)}`, () => [2.8, 0.1, 2.8 * rho.value], { cls: "tag accent-coral" });
  k.panel({
    params: [rho],
    presets: [
      { label: "Galton’s families (ρ ≈ 0.5)", set: [[rho, 0.5]] },
      { label: "Strong (0.9)", set: [[rho, 0.9]] },
      { label: "None (0)", set: [[rho, 0]] },
    ],
    readout() {
      const R = rho.value;
      return `Correlation <b class="coral">${fmt(R)}</b>. A parent ${fmt(2, 0)} standard deviations above average predicts a child only <b class="coral">${fmt(2 * R)}</b> above average&thinsp;—&thinsp;‘regression toward the mean’. At ρ = 0 the mountain is round and the line lies flat.`;
    },
  });
  k.hold(0.5);

  // --- regression is Legendre's shadow, one dimension up
  k.beat("projection");
  axisNames.forEach((l) => l.end());
  [hill, ...rings, ...shadows, ...people, tips, regression, sdLine, floor, xAxis, zAxis].forEach((o) => o.hide(0.5).startNextImmediately());
  k.hold(0.5);
  const X = [1, 3, 2],
    Y = [2, 4, 5];
  // Least squares: fit y ≈ α·1 + β·x, i.e. project y onto the plane spanned by 1 and x.
  const mx = (X[0] + X[1] + X[2]) / 3,
    my = (Y[0] + Y[1] + Y[2]) / 3;
  const beta = X.reduce((a, x, i) => a + (x - mx) * (Y[i] - my), 0) / X.reduce((a, x) => a + (x - mx) ** 2, 0);
  const alpha = my - beta * mx;
  const Yhat = X.map((x) => alpha + beta * x);
  const one = room([1, 1, 1]),
    xv = room(X),
    yv = room(Y),
    yh = room(Yhat);
  const planeA = mul(one, -1.2),
    planeB = add(mul(one, 3.2), mul(xv, -0.4)),
    planeC = add(mul(one, 1.4), mul(xv, 1.5)),
    planeD = add(mul(one, -2.6), mul(xv, 1.9));
  const plane = k.shape(quad(planeA, planeB, planeC, planeD, { color: "#3b6b63" }));
  const ax = axes(k);
  const oneArrow = k.shape(arrow([0, 0, 0], one, { color: C.mint, radius: 0.035 }));
  const xArrow = k.shape(arrow([0, 0, 0], xv, { color: C.sky, radius: 0.035 }));
  const yArrow = k.shape(arrow([0, 0, 0], yv, { color: C.amber, radius: 0.04 }));
  const fitArrow = k.shape(arrow([0, 0, 0], yh, { color: C.paper, radius: 0.035 }));
  const resid = k.shape(segment(yv, yh, { color: C.coral, lineWidth: 4 }));
  k.cam([-3.4, 4.8, 10.2], [0.9, 1.3, 0.9], 2).startNextImmediately();
  ax.draw(1);
  oneArrow.draw(0.8).startNextImmediately();
  xArrow.draw(0.8);
  plane.fadeTo(0.55, 1.2);
  k.label("1 = (1, 1, 1): the constant", add(one, [0.3, 0.1, 0]), { cls: "tag accent-mint" });
  k.label("x = parents (1, 3, 2)", add(xv, [0.3, 0.2, 0]), { cls: "tag accent-sky" });
  k.label("every prediction a + b·x lives on this plane", planeD, { cls: "tag soft" });
  yArrow.draw(1);
  k.label("y = children (2, 4, 5)", add(yv, [0.3, 0.3, 0]), { cls: "tag accent-amber" });
  resid.draw(1.2).startNextImmediately();
  fitArrow.draw(1.2);
  k.label("the fitted line = y’s shadow on the plane", add(yh, [0.4, -0.3, 0]), { cls: "tag" });
  const eq = await equation(k, String.raw`\hat{y}=${fmt(alpha, 2)}+${fmt(beta, 2)}\,x`, { at: [2.3, 3.4, 0.6], toward: [-3.4, 4.8, 10.2], width: 1.7 });
  eq.draw(1.2);
  k.hold(3);

  k.beat("limitation");
  k.cam([-7.4, 2.8, 7.2], [0.9, 1.3, 0.9], 3);
  k.label("residual ⟂ plane", lerp3(yv, yh, 0.5), { cls: "tag accent-coral" });
  k.hold(3);
  return k.finish();
}

// =================================================================== 1920 · Wright

const guineaPig = `<svg viewBox="0 0 100 60" xmlns="http://www.w3.org/2000/svg"><path d="M12 42C10 28 24 14 48 13C56 12 62 12 66 13L68 5C70 2 75 3 76 7L77 13C86 15 94 22 95 31C96 38 92 44 85 45L84 51L78 51L77 46L42 47L40 53L33 53L32 46C20 46 13 45 12 42Z" fill="#000"/></svg>`;

async function wright(host) {
  const k = studio(host, {
    camera: { at: [0, 0.8, 12], lookAt: [0, 0.2, 0] },
    viewHeight: 8.8,
    description: "Guinea pigs become the nodes of a path diagram; signals travel along arrows and multiply by path coefficients.",
  });
  const Xp = [-2.6, 0.6, 0],
    Mp = [0, 2.7, 0],
    Yp = [2.6, 0.6, 0];
  const sire = k.scene.svg(guineaPig, { width: 1.9, depth: 0.18, color: "#c9a27e", at: [-2.8, 1.9, 0] });
  const dam = k.scene.svg(guineaPig, { width: 1.9, depth: 0.18, color: "#e0c7a4", at: [-2.8, -1.6, 0] });
  const pup = k.scene.svg(guineaPig, { width: 1.5, depth: 0.18, color: "#b88b66", at: [2.4, 0.2, 0] });
  const E = k.shape(ball([0.4, 2.7, 0], 0.32, { color: C.sky, u: 24, v: 12 }));
  const D = k.shape(ball([0.4, -2.5, 0], 0.32, { color: C.violet, u: 24, v: 12 }));
  const a1 = k.shape(arrow([-1.7, 1.6, 0], [1.4, 0.5, 0], { color: C.mint }));
  const a2 = k.shape(arrow([-1.7, -1.3, 0], [1.4, -0.1, 0], { color: C.mint }));
  const a3 = k.shape(arrow([0.6, 2.35, 0], [1.9, 0.9, 0], { color: C.sky }));
  const a4 = k.shape(arrow([0.6, -2.15, 0], [1.9, -0.5, 0], { color: C.violet }));

  k.beat("guinea-pigs");
  sire.draw(1).startNextImmediately();
  dam.draw(1);
  pup.draw(0.8);
  sire.rotateBy([0, 360, 0], 2.2).startNextImmediately();
  dam.rotateBy([0, 360, 0], 2.2).startNextImmediately();
  pup.rotateBy([0, 360, 0], 2.2);
  a1.draw(0.7).startNextImmediately();
  a2.draw(0.7);
  k.label("heredity", [-0.3, 1.5, 0], { cls: "tag accent-mint" });
  k.label("heredity", [-0.3, -1.0, 0], { cls: "tag accent-mint" });
  E.show(0.5);
  a3.draw(0.6);
  k.label("shared environment", [0.4, 3.2, 0], { cls: "tag accent-sky" });
  D.show(0.5);
  a4.draw(0.6);
  k.label("developmental chance", [0.4, -3.0, 0], { cls: "tag accent-violet" });
  k.label("sire", [-2.8, 2.7, 0], { cls: "tick" });
  k.label("dam", [-2.8, -0.8, 0], { cls: "tick" });
  k.label("offspring", [2.4, 0.95, 0], { cls: "tick" });
  k.hold(3);

  // --- from sketches to a machine: the pigs become nodes
  k.beat("path-coefficients");
  [a1, a2, a3, a4].forEach((o) => o.hide(0.5).startNextImmediately());
  E.hide(0.5).startNextImmediately();
  D.hide(0.5);
  const token = (at) => ({ type: "disk", radius: 0.42, depth: 0.2, at, rotation: [0, 0, 0] });
  sire.transformTo({ ...token(Xp), color: C.amber }, { duration: 2 }).startNextImmediately();
  dam.transformTo({ ...token(Mp), color: C.sky }, { duration: 2 }).startNextImmediately();
  pup.transformTo({ ...token(Yp), color: C.mint }, { duration: 2 });
  k.label("X", add(Xp, [0, 0, 0.3]), { cls: "node", persist: true });
  k.label("M", add(Mp, [0, 0, 0.3]), { cls: "node", persist: true });
  k.label("Y", add(Yp, [0, 0, 0.3]), { cls: "node", persist: true });

  // Path coefficients: authored values first, then the reader's sliders.
  const pa = k.param("a", 1, -1.5, 1.5, 0.05, { label: "a (X → M)" });
  const pb = k.param("b", 1, -1.5, 1.5, 0.05, { label: "b (M → Y)" });
  const pc = k.param("c", -1, -1.5, 1.5, 0.05, { label: "c (X → Y, direct)" });
  let exploreAt = Infinity,
    cancelWin = () => 0;
  const coef = () => {
    if (k.T() >= exploreAt) return [pa.value, pb.value, pc.value];
    const w = cancelWin();
    return [mix(0.8, 1, w), mix(0.9, 1, w), mix(0.5, -1, w)];
  };
  const edge = (from, to, pick, sign) => {
    const dir = unit(sub(to, from));
    return k.live(() => {
      const v = coef()[pick],
        on = Math.sign(v) === sign && Math.abs(v) > 0.01;
      const w = on ? 0.02 + 0.05 * Math.abs(v) : 0;
      return arrow(add(from, mul(dir, 0.52)), sub(to, mul(dir, 0.52)), { radius: w, headRadius: on ? 0.1 + 0.08 * Math.abs(v) : 0, head: 0.3 });
    }, { color: sign > 0 ? C.paper : C.coral });
  };
  const XM = [edge(Xp, Mp, 0, 1), edge(Xp, Mp, 0, -1)];
  const MY = [edge(Mp, Yp, 1, 1), edge(Mp, Yp, 1, -1)];
  const XY = [edge(Xp, Yp, 2, 1), edge(Xp, Yp, 2, -1)];
  XM.forEach((e) => e.draw(0.8).startNextImmediately());
  k.hold(0.8);
  k.label(() => `a = ${fmt(coef()[0])}`, [-1.75, 1.3, 0], { cls: "tag" });
  MY.forEach((e) => e.draw(0.8).startNextImmediately());
  k.hold(0.8);
  k.label(() => `b = ${fmt(coef()[1])}`, [1.75, 1.3, 0], { cls: "tag" });
  // A pulse of one unit leaves X, is multiplied by a, then by b.
  const pulse = k.shape(ball([0, 0, 0], 0.2, { color: C.amber, u: 20, v: 10, at: Xp }));
  pulse.show(0.3);
  pulse.moveTo(Mp, 1.4).startNextImmediately();
  pulse.scaleTo(0.8, 1.4);
  k.label("1 × a", Mp, { cls: "tag accent-amber" }).end(k.now() + 1.6);
  pulse.moveTo(Yp, 1.4).startNextImmediately();
  pulse.scaleTo(0.72, 1.4);
  k.label("a × b", add(Yp, [0.9, 0.5, 0]), { cls: "tag accent-amber" });
  k.hold(1.5);

  k.beat("direct");
  pulse.hide(0.3).startNextImmediately();
  pulse.moveTo(Xp, 0.01).startNextImmediately();
  pulse.scaleTo(1, 0.01);
  XY.forEach((e) => e.draw(0.8).startNextImmediately());
  k.hold(0.8);
  k.label(() => `c = ${fmt(coef()[2])}`, [0, 0.25, 0], { cls: "tag" });
  const direct = k.shape(ball([0, 0, 0], 0.2, { color: C.sky, u: 20, v: 10, at: Xp }));
  pulse.show(0.3).startNextImmediately();
  direct.show(0.3);
  pulse.moveTo(Mp, 1.2).startNextImmediately();
  direct.moveTo(Yp, 2.4);
  pulse.moveTo(Yp, 1.2);
  k.label("total effect = c + a·b", add(Yp, [0.2, -1.1, 0]), { cls: "tag accent-mint" });
  k.hold(1.5);

  // --- two strong mechanisms that cancel exactly
  k.beat("cancel");
  pulse.hide(0.3).startNextImmediately();
  direct.hide(0.3);
  let t0 = k.now();
  k.scene.wait(2);
  cancelWin = k.window(t0, t0 + 2);
  pulse.moveTo(Xp, 0.01).startNextImmediately();
  direct.moveTo(Xp, 0.01).startNextImmediately();
  direct.colorTo(C.coral, 0.01);
  pulse.show(0.3).startNextImmediately();
  direct.show(0.3);
  pulse.moveTo(Mp, 1.2).startNextImmediately();
  direct.moveTo(Yp, 2.4);
  pulse.moveTo(Yp, 1.2);
  pulse.scaleTo(0.01, 0.6).startNextImmediately();
  direct.scaleTo(0.01, 0.6);
  k.label("+1 and −1 arrive together: net zero", add(Yp, [0, -1.1, 0]), { cls: "tag accent-coral" });
  // Scatter of X against Y from the same mechanism, with fixed noise.
  const rnd = random(1921);
  const noise = Array.from({ length: CLOUD_LIMIT }, () => [rnd.normal(), rnd.normal(), rnd.normal()]);
  const plotAt = [0, -2.1, 0];
  const frame = k.shape(polyline([[-1.3, -0.75, 0], [1.3, -0.75, 0], [1.3, 0.75, 0], [-1.3, 0.75, 0], [-1.3, -0.75, 0]].map((p) => add(p, plotAt)), { color: C.slate, lineWidth: 1.5 }));
  const sample = () => {
    const [a, b, c] = coef();
    return noise.map(([u, e1, e2]) => {
      const x = u,
        m = a * x + 0.6 * e1,
        y = b * m + c * x + 0.6 * e2;
      return [x, y];
    });
  };
  const scatter = k.live(() => {
    const pts = sample(),
      sy = Math.max(1, ...pts.map((p) => Math.abs(p[1]))) / 0.7;
    return cloud(pts.map(([x, y]) => add(plotAt, [(x / 2.6) * 1.25, y / sy, 0])), 0.045);
  }, { color: C.paper });
  frame.draw(0.6);
  scatter.show(0.8);
  k.label("what a passive observer sees: X against Y", add(plotAt, [0, -1.0, 0]), { cls: "tag soft" });
  k.hold(2.5);

  k.beat("explore");
  exploreAt = k.now();
  k.hold(0.3);
  k.panel({
    params: [pa, pb, pc],
    presets: [
      { label: "Perfect cancellation", set: [[pa, 1], [pb, 1], [pc, -1]] },
      { label: "No direct path", set: [[pa, 1], [pb, 1], [pc, 0]] },
      { label: "Only the direct path", set: [[pa, 0], [pb, 1], [pc, 1]] },
    ],
    readout() {
      const [a, b, c] = coef();
      const pts = sample();
      return `Indirect a·b = <b class="amber">${fmt(a * b)}</b>, direct c = <b class="coral">${fmt(c)}</b>, total = <b>${fmt(a * b + c)}</b>. Correlation in the scatter: <b>${fmt(correlation(pts.map((p) => p[0]), pts.map((p) => p[1])))}</b>. Every arrow can be strong while the total is zero.`;
    },
  });

  k.beat("resistance");
  scatter.hide(0.5).startNextImmediately();
  frame.hide(0.5);
  const eq = await equation(k, String.raw`\text{effect}_{X\to Y}=c+a\,b`, { at: [0, -1.6, 0], toward: [0, 0.8, 12], width: 3.2 });
  eq.draw(1.5);
  k.hold(2.5);
  return k.finish();
}

// =================================================================== 1904 · Spearman

const thermometer = `<svg viewBox="0 0 40 100" xmlns="http://www.w3.org/2000/svg"><path d="M14 12A6 6 0 0 1 26 12L26 66A13 13 0 1 1 14 66Z" fill="#000"/></svg>`;

async function spearman(host) {
  const k = studio(host, {
    camera: { at: [0, 1.6, 12], lookAt: [0, 0.2, 0] },
    viewHeight: 9,
    description: "Six school subjects all correlate; an unseen common cause, g, predicts a strict equality among the visible correlations.",
  });
  // Spearman's 1904 correlations as they are usually reprinted (rounded).
  const names = ["Classics", "French", "English", "Maths", "Pitch", "Music"];
  const R = [
    [1, 0.83, 0.78, 0.7, 0.66, 0.63],
    [0.83, 1, 0.67, 0.67, 0.65, 0.57],
    [0.78, 0.67, 1, 0.64, 0.54, 0.51],
    [0.7, 0.67, 0.64, 1, 0.45, 0.51],
    [0.66, 0.65, 0.54, 0.45, 1, 0.4],
    [0.63, 0.57, 0.51, 0.51, 0.4, 1],
  ];
  const ringAt = (i) => [2.9 * Math.sin((i * TAU) / 6), 0.3 + 2.6 * Math.cos((i * TAU) / 6), 0];
  const tile = (at, color = C.chalk) => box([-0.42, -0.24, -0.14], [0.42, 0.24, 0.14], { color, at });
  const tiles = names.map((_, i) => k.shape(tile(ringAt(i))));
  const edges = [];
  for (let i = 0; i < 6; i++)
    for (let j = i + 1; j < 6; j++)
      edges.push(k.shape(segment(ringAt(i), ringAt(j), { color: "#5f8f82", lineWidth: 1 + 9 * (R[i][j] - 0.35) })));

  k.beat("manifold");
  tiles.forEach((t) => t.show(0.25));
  names.forEach((n, i) => k.label(n, add(ringAt(i), [0, i === 0 ? 0.55 : i === 3 ? -0.55 : 0, 0.3]), { cls: "tag" }));
  edges.forEach((e) => e.draw(0.12));
  k.label("every pair positive: thicker = stronger", [0, -3.4, 0], { cls: "tag soft" });
  k.hold(2.5);

  k.beat("gremlins");
  const g0 = [0, 0.3, 0];
  const ghost = k.shape(ball(g0, 0.62, { color: "#5a6f78", u: 32, v: 16 }));
  const ghostWire = k.shape(ball(g0, 0.64, { color: C.chalk, wireframe: true, u: 20, v: 10 }));
  const spokes = names.map((_, i) => {
    const d = unit(sub(ringAt(i), g0));
    return k.shape(arrow(add(g0, mul(d, 0.7)), sub(ringAt(i), mul(d, 0.5)), { color: C.paper, radius: 0.03, head: 0.22, headRadius: 0.09 }));
  });
  edges.forEach((e) => e.fadeTo(0.15, 0.6).startNextImmediately());
  k.hold(0.6);
  ghost.fadeTo(0.35, 1).startNextImmediately();
  ghostWire.show(1);
  spokes.forEach((sp) => sp.draw(0.3).startNextImmediately());
  k.hold(0.4);
  k.label("g ?", add(g0, [0, 0, 0.8]), { cls: "axis big light" });
  k.hold(2.5);

  // --- three sensors: always solvable, so never a test
  k.beat("three");
  const keep = [0, 1, 3];
  [2, 4, 5].forEach((i) => tiles[i].hide(0.5).startNextImmediately());
  spokes.forEach((sp) => sp.hide(0.4).startNextImmediately());
  edges.forEach((e) => e.hide(0.4).startNextImmediately());
  k.hold(0.5);
  const tri = [[-2.4, 2.2, 0], [2.4, 2.2, 0], [0, -1.6, 0]];
  const gT = [0, 0.95, 0];
  keep.forEach((i, n) => tiles[i].moveTo(tri[n], 1.2).startNextImmediately());
  ghost.moveTo(sub(gT, g0), 1.2).startNextImmediately();
  ghostWire.moveTo(sub(gT, g0), 1.2);
  const triSpokes = tri.map((p) => {
    const d = unit(sub(p, gT));
    return k.shape(arrow(add(gT, mul(d, 0.7)), sub(p, mul(d, 0.52)), { color: C.paper, radius: 0.03, head: 0.22, headRadius: 0.09 }));
  });
  triSpokes.forEach((sp) => sp.draw(0.4).startNextImmediately());
  k.hold(0.5);
  ["Classics", "French", "Maths"].forEach((n, i) => k.label(n, add(tri[i], [0, 0.55, 0.3]), { cls: "tag" }));
  const lam = [Math.sqrt((0.83 * 0.7) / 0.67), Math.sqrt((0.83 * 0.67) / 0.7), Math.sqrt((0.7 * 0.67) / 0.83)];
  lam.forEach((l, i) => k.label(`λ = ${l.toFixed(2)}`, lerp3(gT, tri[i], 0.55), { cls: "tag accent-mint" }));
  const lamEq = await equation(k, String.raw`\lambda_1^2=\frac{r_{12}\,r_{13}}{r_{23}}`, { at: [0, -3.0, 0], toward: [0, 1.6, 12], width: 2.2 });
  lamEq.draw(1.2);
  k.hold(2.5);

  // --- Heywood: the algebra asks for a container to hold more than it can
  k.beat("heywood");
  const r12 = k.param("r12", 0.8, 0.05, 0.95, 0.01, { label: "r<sub>12</sub>" });
  const r13 = k.param("r13", 0.8, 0.05, 0.95, 0.01, { label: "r<sub>13</sub>" });
  const r23 = k.param("r23", 0.5, 0.05, 0.95, 0.01, { label: "r<sub>23</sub>" });
  let heyAt = Infinity,
    heyWin = () => 0;
  const rs = () => {
    if (k.T() >= heyAt) return [r12.value, r13.value, r23.value];
    const w = heyWin();
    return [mix(0.83, 0.8, w), mix(0.7, 0.8, w), mix(0.67, 0.5, w)];
  };
  const loads = () => {
    const [a, b, c] = rs();
    return [(a * b) / c, (a * c) / b, (b * c) / a];
  };
  lamEq.hide(0.5).startNextImmediately();
  triSpokes.forEach((sp) => sp.fadeTo(0.3, 0.5).startNextImmediately());
  k.hold(0.5);
  const cx = [-2.2, 0, 2.2],
    base = -3.4,
    Hc = 1.7;
  const glass = cx.map((x) => k.shape(box([x - 0.32, base, -0.32], [x + 0.32, base + Hc, 0.32], { color: C.chalk, wireframe: true })));
  const common = cx.map((x, i) => k.live(() => box([x - 0.3, base, -0.3], [x + 0.3, base + Hc * Math.min(1, loads()[i]) + 1e-3, 0.3]), { color: "#3f8f79" }));
  const unique = cx.map((x, i) => k.live(() => box([x - 0.3, base + Hc * Math.min(1, loads()[i]), -0.3], [x + 0.3, base + Hc + 1e-3, 0.3]), { color: "#3d4b50" }));
  const over = cx.map((x, i) => k.live(() => box([x - 0.3, base + Hc, -0.3], [x + 0.3, base + Hc * Math.max(1, loads()[i]) + 1e-3, 0.3]), { color: C.coral }));
  const below = cx.map((x, i) => k.live(() => box([x - 0.3, base - Hc * Math.max(0, loads()[i] - 1) - 1e-3, -0.3], [x + 0.3, base, 0.3]), { color: "#7a3328" }));
  k.cam([0, 0.6, 12], [0, -0.8, 0], 1.5).startNextImmediately();
  glass.forEach((gl) => gl.show(0.5).startNextImmediately());
  [...common, ...unique].forEach((o) => o.show(0.8).startNextImmediately());
  k.hold(0.8);
  ["Classics", "French", "Maths"].forEach((n, i) => k.label(() => `λ² = ${loads()[i].toFixed(2)}`, [cx[i], base + Hc + 0.35, 0.4], { cls: "tag accent-mint" }));
  let t0 = k.now();
  k.scene.wait(2.5);
  heyWin = k.window(t0, t0 + 2.5);
  over.forEach((o) => o.show(0.4).startNextImmediately());
  below.forEach((o) => o.show(0.4));
  k.label("the variance each test can share with g: its container holds exactly 1", [0, base - 0.35, 0.4], { cls: "tag soft" });
  k.label(() => (loads()[0] > 1 ? `unique variance ${(1 - loads()[0]).toFixed(2)}: impossible` : "no overflow"), [cx[0], base - 0.9, 0.4], { cls: "tag accent-coral" });
  k.hold(1);
  heyAt = k.now();
  k.panel({
    params: [r12, r13, r23],
    presets: [
      { label: "Heywood: .80 .80 .50", set: [[r12, 0.8], [r13, 0.8], [r23, 0.5]] },
      { label: "Spearman’s .83 .70 .67", set: [[r12, 0.83], [r13, 0.7], [r23, 0.67]] },
    ],
    readout() {
      const L = loads();
      const bad = L.map((l, i) => (l > 1 ? i + 1 : 0)).filter(Boolean);
      return `Shared variance λ² = <b class="mint">${L.map((l) => l.toFixed(2)).join(", ")}</b>. ${bad.length ? `Test ${bad.join(" and ")} would need a <b class="coral">negative</b> unique variance&thinsp;—&thinsp;a Heywood case. The data are telling you the one-factor story doesn’t fit.` : "Every container holds its share: a one-factor story fits, as it always can with three tests."}`;
    },
  });

  // --- a fourth sensor: the cargo net
  k.beat("fourth");
  [...glass, ...common, ...unique, ...over, ...below].forEach((o) => o.hide(0.5).startNextImmediately());
  keep.forEach((i) => tiles[i].hide(0.5).startNextImmediately());
  triSpokes.forEach((sp) => sp.hide(0.5).startNextImmediately());
  ghost.hide(0.5).startNextImmediately();
  ghostWire.hide(0.5);
  const lambdas = [1, 2, 3, 4].map((i, n) => k.param(`λ${i}`, [0.9, 0.8, 0.7, 0.6][n], 0.1, 0.95, 0.01, { label: `loading λ<sub>${i}</sub>` }));
  const gamma = k.param("γ", 0, 0, 0.8, 0.01, { label: "a second hidden cause, shared by tests 1 and 2" });
  const Lv = () => lambdas.map((p) => p.value);
  const corner = [[-2, 0, -1.6], [2, 0, -1.6], [2, 0, 1.6], [-2, 0, 1.6]];
  const lift = (i) => 0.6 + 1.4 * Lv()[i];
  const net = k.live(() => ({
    type: "surface",
    u: [0, 1],
    v: [0, 1],
    uSegments: 16,
    vSegments: 16,
    fn: (u, v) => {
      const h = mix(mix(lift(0), lift(1), u), mix(lift(3), lift(2), u), v);
      const sag = 1.5 * Math.sin(Math.PI * u) * Math.sin(Math.PI * v);
      return [mix(-2, 2, u), h - sag, mix(-1.6, 1.6, v)];
    },
  }), { color: C.mint, wireframe: true });
  const weight = k.live(() => {
    const h = (lift(0) + lift(1) + lift(2) + lift(3)) / 4 - 1.5;
    return ball([0, h - 0.45, 0], 0.42, { u: 24, v: 12 });
  }, { color: "#566a72" });
  const weight2 = k.live(() => {
    const h = (lift(0) + lift(1)) / 2 - 0.25;
    return ball([0, h - 0.3, -1.6], Math.max(0.001, 0.45 * gamma.value), { u: 16, v: 8 });
  }, { color: C.coral });
  const posts = k.live(() => cloud(corner.map((c, i) => [c[0], lift(i), c[2]]), 0.17), { color: C.paper });
  k.cam([0, 6.4, 9.6], [0, 0.4, 0], 2).startNextImmediately();
  posts.show(0.6);
  net.draw(1.6).startNextImmediately();
  weight.show(1.2);
  const testLabels = [1, 2, 3, 4].map((n, i) => k.label(`test ${n}`, () => [corner[i][0] * 1.18, lift(i) + 0.35, corner[i][2] * 1.12], { cls: "tag", persist: true }));
  k.label("g: an invisible weight in the middle", () => [0, (lift(0) + lift(1) + lift(2) + lift(3)) / 4 - 2.5, 0.6], { cls: "tag soft" });
  k.hold(2.5);

  k.beat("tetrad");
  const pairs = [[[0, 1], [2, 3]], [[0, 2], [1, 3]], [[0, 3], [1, 2]]];
  const r = (i, j) => Lv()[i] * Lv()[j] + ((i === 0 && j === 1) ? gamma.value ** 2 : 0);
  const prod = (pp) => r(...pp[0]) * r(...pp[1]);
  const bx = [-1.6, 0, 1.6];
  const bars = pairs.map((pp, n) => k.live(() => box([bx[n] - 0.28, -3.6, -2.6], [bx[n] + 0.28, -3.6 + 6 * prod(pp) + 1e-3, -2.2]), { color: [C.amber, C.sky, C.violet][n] }));
  bars.forEach((b) => b.show(0.6).startNextImmediately());
  k.cam([0, 5, 11.5], [0, -0.4, -0.6], 1.8);
  ["r₁₂·r₃₄", "r₁₃·r₂₄", "r₁₄·r₂₃"].forEach((t, n) => k.label(() => `${t} = ${prod(pairs[n]).toFixed(3)}`, [bx[n], -3.95, -2.4], { cls: `tag accent-${["amber", "sky", "violet"][n]}` }));
  const tetradEq = await equation(k, String.raw`r_{12}\,r_{34}-r_{13}\,r_{24}=0`, { at: [0, 4.2, -2.4], toward: [0, 5, 11.5], width: 3.2 });
  tetradEq.draw(1.4);
  k.hold(2.5);

  k.beat("explore");
  k.panel({
    params: [...lambdas, gamma],
    presets: [
      { label: "One hidden cause", set: [[gamma, 0]] },
      { label: "Add a second cause", set: [[gamma, 0.55]] },
    ],
    readout() {
      const t = prod(pairs[0]) - prod(pairs[1]);
      return `Tetrad difference r₁₂r₃₄ − r₁₃r₂₄ = <b class="${Math.abs(t) < 5e-4 ? "mint" : "coral"}">${t.toFixed(3)}</b>. ${gamma.value < 0.005 ? "Whatever the loadings, one hidden cause forces it to zero." : "A second shared cause breaks the constraint: the one-factor theory is falsified."}`;
    },
  });
  k.hold(0.3);

  // --- reflective or formative?
  k.beat("reflective");
  testLabels.forEach((l) => l.end());
  [net, weight, weight2, posts, ...bars].forEach((o) => o.hide(0.5).startNextImmediately());
  tetradEq.hide(0.5);
  k.cam([0, 1.6, 12], [0, 0.2, 0], 1.6).startNextImmediately();
  const hub = [0, 0.4, 0];
  const heat = k.shape(ball(hub, 0.6, { color: C.coral, u: 32, v: 16 }));
  const spots = [[-2.8, 2.1, 0], [2.8, 2.1, 0], [2.8, -1.5, 0], [-2.8, -1.5, 0]];
  const therms = spots.map((at) => k.scene.svg(thermometer, { width: 0.55, depth: 0.12, color: C.chalk, at }));
  const thermShapes = therms.map((t) => ({ ...t.descriptor }));
  const outward = spots.map((p) => {
    const d = unit(sub(p, hub));
    return [add(hub, mul(d, 0.72)), sub(p, mul(d, 0.75))];
  });
  const links = outward.map(([a, b]) => k.shape(arrow(a, b, { color: C.coral, radius: 0.035 })));
  heat.show(0.8);
  therms.forEach((t) => t.draw(0.5).startNextImmediately());
  k.hold(0.5);
  links.forEach((l) => l.draw(0.4).startNextImmediately());
  k.hold(0.5);
  const hubLabel = k.label("the room’s temperature (a real state)", add(hub, [0, -0.95, 0.6]), { cls: "tag accent-coral" });
  const thermLabels = spots.map((p, i) => k.label(`thermometer ${i + 1}`, add(p, [0, 0.9, 0.2]), { cls: "tick" }));
  k.hold(2.5);

  k.beat("formative");
  // Same arrows, reversed: the index is computed from its inputs.
  links.forEach((l, i) => l.transformTo(arrow(outward[i][1], outward[i][0], { radius: 0.035 }), { duration: 1.6 }).startNextImmediately());
  links.forEach((l) => l.colorTo(C.amber, 1.6).startNextImmediately());
  therms.forEach((t) => t.transformTo({ type: "square", size: 0.8, segments: 192, depth: 0.12 }, { duration: 1.6 }).startNextImmediately());
  heat.hide(0.8);
  const index = k.shape({ type: "prism", sides: 6, radius: 0.7, depth: 0.3, color: C.amber, at: hub });
  index.show(0.8);
  ["rent", "food", "transport", "energy"].forEach((n, i) => k.label(n, add(spots[i], [0, 0.75, 0.2]), { cls: "tag accent-amber" }));
  k.label("cost-of-living index = a weighted sum", add(hub, [0, -0.95, 0.6]), { cls: "tag accent-amber" });
  k.hold(2.5);

  k.beat("method");
  links.forEach((l, i) => l.transformTo(arrow(outward[i][0], outward[i][1], { radius: 0.035 }), { duration: 1.2 }).startNextImmediately());
  links.forEach((l) => l.colorTo(C.coral, 1.2).startNextImmediately());
  index.hide(0.6).startNextImmediately();
  heat.show(0.6).startNextImmediately();
  therms.forEach((t, i) => t.transformTo(thermShapes[i], { duration: 1.2 }).startNextImmediately());
  k.hold(1.2);
  const supply = [0, 0.4, -3];
  const plug = k.shape(box([-0.55, -0.35, -0.3], [0.55, 0.35, 0.3], { color: C.violet, at: supply }));
  const wires = spots.map((p) => k.shape(segment(supply, add(p, [0, -0.2, -0.1]), { color: C.violet, lineWidth: 2 })));
  k.cam([6.5, 3.2, 10.4], [0, 0.4, -1.2], 2).startNextImmediately();
  plug.show(0.6);
  wires.forEach((w) => w.draw(0.3).startNextImmediately());
  k.hold(0.6);
  k.label("…or one faulty power supply", add(supply, [0, 0.8, 0]), { cls: "tag accent-violet" });
  k.label("reliability ≠ validity", [0, -2.8, 0], { cls: "tag" });
  k.hold(2.5);
  return k.finish();
}

// =================================================================== 1946 · Berkson

const hospital = `<svg viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" d="M10 112L10 42L100 8L190 42L190 112ZM86 106L86 72L114 72L114 106ZM92 30H108V40H118V56H108V66H92V56H82V40H92Z" fill="#000"/></svg>`;

async function berkson(host) {
  const k = studio(host, {
    projection: "perspective",
    camera: { at: [0, 9.2, 10.8], lookAt: [0, 0.1, 0.1] },
    description: "Four rooms of coin flips; closing the door on one room creates a correlation among everyone inside.",
  });
  const building = k.scene.svg(hospital, { width: 3.6, depth: 0.25, color: "#9aa9a4", at: [0, 0.9, -3.3] });
  const rooms = [
    { name: "X heads · Z heads", at: [-1.3, 0, -1.3], x: 1, z: 1 },
    { name: "X heads · Z tails", at: [1.3, 0, -1.3], x: 1, z: 0 },
    { name: "X tails · Z heads", at: [-1.3, 0, 1.3], x: 0, z: 1 },
    { name: "X tails · Z tails", at: [1.3, 0, 1.3], x: 0, z: 0 },
  ];
  const tiles = rooms.map((r) => k.shape(box([-1.2, -0.06, -1.2], [1.2, 0, 1.2], { color: "#1f2d31", at: r.at })));
  const rnd = random(1946);
  const crowd = rooms.map((r) =>
    k.shape(cloud(Array.from({ length: 16 }, (_, i) => [((i % 4) - 1.5) * 0.5 + 0.12 * rnd.normal(), 0.1, (Math.floor(i / 4) - 1.5) * 0.5 + 0.12 * rnd.normal()]), 0.1, { color: C.amber, at: r.at })),
  );

  k.beat("rooms");
  building.draw(1.2);
  tiles.forEach((t) => t.show(0.3).startNextImmediately());
  k.hold(0.3);
  crowd.forEach((c) => c.show(0.4));
  rooms.forEach((r) => k.label(r.name, add(r.at, [0, 0.1, 1.35]), { cls: "tag" }));
  k.label("25% in every room", [0, 0.1, 2.9], { cls: "tag soft" });
  k.hold(2.5);

  k.beat("door");
  const tt = rooms[3];
  crowd[3].moveTo(add(tt.at, [1.5, 0, 1.8]), 2).startNextImmediately();
  crowd[3].colorTo("#7e8b88", 1);
  crowd[3].fadeTo(0.25, 0.8);
  const wall = k.shape(box([-1.25, 0, -0.06], [1.25, 1.3, 0.06], { color: C.coral, at: add(tt.at, [0, 0, -1.25]), scale: [1, 0.01, 1] }));
  const wall2 = k.shape(box([-0.06, 0, -1.25], [0.06, 1.3, 1.25], { color: C.coral, at: add(tt.at, [-1.25, 0, 0]), scale: [1, 0.01, 1] }));
  wall.show(0.1).startNextImmediately();
  wall2.show(0.1);
  wall.scaleTo([1, 1, 1], 1).startNextImmediately();
  wall2.scaleTo([1, 1, 1], 1);
  tiles[3].fadeTo(0.3, 0.6);
  k.label("sent home: no admission", add(tt.at, [1.2, 0.2, 2.2]), { cls: "tag accent-coral" });
  k.label("admitted: at least one heads", [-1.3, 0.2, 0.1], { cls: "tag accent-mint" });
  k.hold(2.5);

  k.beat("inside");
  crowd[2].colorTo(C.sky, 0.8).startNextImmediately();
  k.cam([-2.6, 6.8, 9.4], [-0.6, 0.2, 0.4], 2);
  k.label("inside, X tails ⇒ Z must be heads", add(rooms[2].at, [0, 0.4, 0]), { cls: "tag accent-sky" });
  k.label("X and Z: no longer independent", [0.8, 0.3, -0.1], { cls: "tag" });
  k.hold(2.5);

  // --- the same trick with continuous severities
  k.beat("continuous");
  [...crowd, ...tiles, wall, wall2].forEach((o) => o.hide(0.5).startNextImmediately());
  building.hide(0.8);
  const cut = k.param("k", 0.6, -3, 2.2, 0.05, { label: "admission threshold: X + Z must exceed" });
  let exploreAt = Infinity,
    drop = () => 0;
  const kk = () => (k.T() >= exploreAt ? cut.value : 0.6);
  const g = random(46);
  const people = Array.from({ length: 2 * CLOUD_LIMIT }, () => [g.normal(), g.normal()]);
  const sc = 1.05;
  const admitted = (p) => p[0] + p[1] > kk();
  const lower = () => (k.T() >= exploreAt ? 1 : drop());
  const chunks = [0, 1].map((c) => people.slice(c * CLOUD_LIMIT, (c + 1) * CLOUD_LIMIT));
  const inside = chunks.map((ch) => k.live(() => cloud(ch.map(([x, z]) => [x * sc, 0.08, z * sc]), ch.map((p) => (admitted(p) ? 0.075 : 0))), { color: C.amber }));
  const outside = chunks.map((ch) => k.live(() => cloud(ch.map(([x, z]) => [x * sc, 0.08 - 0.9 * lower(), z * sc]), ch.map((p) => (admitted(p) ? 0 : 0.05))), { color: "#6f7c79" }));
  const floor = k.shape(grid([-3, 3], [-3, 3], 0.5, 0, { color: C.slate }));
  const wallLine = k.live(() => {
    const c = kk() * sc;
    return quad([c + 3, 0, -3], [c - 3, 0, 3], [c - 3, 1.2, 3], [c + 3, 1.2, -3]);
  }, { color: C.coral });
  const fit = () => {
    const a = people.filter(admitted);
    return slope(a.map((p) => p[0]), a.map((p) => p[1]));
  };
  const line = k.live(() => {
    const { slope: b, mx, my } = fit();
    return segment([-3, 0.12, (my + b * (-3 / sc - mx)) * sc], [3, 0.12, (my + b * (3 / sc - mx)) * sc]);
  }, { color: C.sky, lineWidth: 4 });
  k.cam([0.2, 9.6, 7.4], [0, -0.2, 0.2], 2).startNextImmediately();
  floor.draw(0.8);
  inside.forEach((c) => c.show(0.6).startNextImmediately());
  outside.forEach((c) => c.show(0.6));
  k.label("severity of disease X", [3.3, 0.1, 0], { cls: "tag" });
  k.label("severity of disease Z", [0, 0.1, 3.3], { cls: "tag" });
  k.label("two independent diseases: a round cloud", [0, 0.1, -3.1], { cls: "tag soft" }).end(k.now() + 2);
  k.hold(1.5);
  wallLine.fadeTo(0.35, 0.8);
  const t0 = k.now();
  k.scene.wait(1.8);
  drop = k.window(t0, t0 + 1.8);
  line.draw(1.2);
  k.label("admitted only if X + Z is high enough", () => [kk() * sc * 0.5 + 1.6, 1.3, kk() * sc * 0.5 - 1.6], { cls: "tag accent-coral" });
  k.label("inside the hospital: a negative slope", [-2.4, 0.2, 2.0], { cls: "tag accent-sky" });
  k.hold(2.5);

  k.beat("explore");
  exploreAt = k.now();
  k.hold(0.3);
  k.panel({
    params: [cut],
    presets: [
      { label: "Admit everyone", set: [[cut, -3]] },
      { label: "Only the very sick", set: [[cut, 1.8]] },
    ],
    readout() {
      const a = people.filter(admitted);
      const r = correlation(a.map((p) => p[0]), a.map((p) => p[1]));
      const all = correlation(people.map((p) => p[0]), people.map((p) => p[1]));
      return `Admitted: <b>${a.length}</b> of ${people.length}. Correlation between the diseases among patients: <b class="sky">${fmt(r)}</b>. In the whole population: <b>${fmt(all)}</b>. The door made the difference.`;
    },
  });
  return k.finish();
}

// =================================================================== 1973 · Berkeley

async function berkeley(host) {
  const k = studio(host, {
    projection: "perspective",
    camera: { at: [0, 5.2, 17.5], lookAt: [0, 3.1, 0] },
    description: "Admissions to six Berkeley departments stacked as blocks, first in aggregate and then department by department.",
  });
  const depts = ["A", "B", "C", "D", "E", "F"];
  const men = [825, 560, 325, 417, 191, 373],
    menRate = [0.62, 0.63, 0.37, 0.33, 0.28, 0.06];
  const women = [108, 25, 593, 375, 393, 341],
    womenRate = [0.82, 0.68, 0.34, 0.35, 0.24, 0.07];
  const U = 1 / 400,
    w = 0.44;
  const block = (h, color) => k.shape(box([-w / 2, 0, -w / 2], [w / 2, Math.max(h, 0.002), w / 2], { color }));
  const build = (counts, rates, colors) =>
    counts.map((n, i) => ({ adm: block(n * rates[i] * U, colors[0]), rej: block(n * (1 - rates[i]) * U, colors[1]), n, rate: rates[i] }));
  const M = build(men, menRate, [C.sky, "#2c4a60"]);
  const Wm = build(women, womenRate, [C.amber, "#5f4b2b"]);
  // Aggregate stacks: admitted blocks at the bottom, rejected on top.
  const stack = (set, x) => {
    let y = 0;
    const at = [];
    set.forEach((d) => {
      at.push({ adm: [x, y, 0] });
      y += d.n * d.rate * U;
    });
    set.forEach((d, i) => {
      at[i].rej = [x, y, 0];
      y += d.n * (1 - d.rate) * U;
    });
    return at;
  };
  const aggM = stack(M, -0.9),
    aggW = stack(Wm, 0.9);
  const place = (set, spots) =>
    set.forEach((d, i) => {
      d.adm.moveTo(spots[i].adm, 0.01).startNextImmediately();
      d.rej.moveTo(spots[i].rej, 0.01).startNextImmediately();
    });
  place(M, aggM);
  place(Wm, aggW);
  k.hold(0.01);
  const all = [...M, ...Wm];
  const floor = k.shape(box([-4.3, -0.05, -0.8], [4.3, 0, 0.8], { color: "#1a2629" }));

  k.beat("aggregate");
  floor.show(0.5);
  M.forEach((d) => d.adm.show(0.15));
  Wm.forEach((d) => d.adm.show(0.15));
  M.forEach((d) => d.rej.show(0.12).startNextImmediately());
  Wm.forEach((d) => d.rej.show(0.12).startNextImmediately());
  k.hold(0.3);
  k.label("men: 44.5% admitted", [-0.9, 7.0, 0.4], { cls: "tag accent-sky" });
  k.label("women: 30.4% admitted", [0.9, 4.9, 0.4], { cls: "tag accent-amber" });
  k.label("bright = admitted · dark = rejected", [0, -0.45, 0.8], { cls: "tag soft" });
  k.hold(2.5);

  k.beat("departments");
  const xd = (i) => -3.3 + i * 1.32;
  k.cam([0, 5.4, 11.8], [0, 1.3, 0], 2.4).startNextImmediately();
  all.forEach((d, j) => {
    const i = j % 6,
      x = xd(i) + (j < 6 ? -0.25 : 0.25);
    d.adm.moveTo([x, 0, 0], 1.6).startNextImmediately();
    d.rej.moveTo([x, d.n * d.rate * U, 0], 1.6).startNextImmediately();
  });
  k.hold(1.8);
  depts.forEach((n, i) =>
    k.label(`${n}: <span class="sky">${Math.round(menRate[i] * 100)}%</span> · <span class="amber">${Math.round(womenRate[i] * 100)}%</span>`, [xd(i), -0.45, 0.8], { cls: "tag", persist: true }),
  );
  k.label("men", [xd(0) - 0.25, 2.3, 0.3], { cls: "tick accent-sky" });
  k.label("women", [xd(0) + 0.25, 0.7, 0.3], { cls: "tick accent-amber" });
  k.hold(2.5);

  k.beat("pools");
  k.label("where most men applied: easy to get into", [xd(0.5), 2.7, 0.4], { cls: "tag accent-sky" });
  k.label("where most women applied: hard for everyone", [xd(3.5), 2.2, 0.4], { cls: "tag accent-amber" });
  k.hold(3);

  k.beat("explore");
  const mix01 = k.param("w", 0, 0, 1, 0.01, { label: "women apply like men do", format: (v) => `${Math.round(v * 100)}%` });
  const menShare = men.map((n) => n / men.reduce((a, b) => a + b, 0));
  const womenTotal = women.reduce((a, b) => a + b, 0);
  const womenCount = (i) => womenTotal * mix(women[i] / womenTotal, menShare[i], mix01.value);
  const liveW = depts.map((_, i) => {
    const x = xd(i) + 0.25;
    return {
      adm: k.live(() => box([x - w / 2, 0, -w / 2], [x + w / 2, womenCount(i) * womenRate[i] * U + 0.002, w / 2]), { color: C.amber }),
      rej: k.live(() => box([x - w / 2, womenCount(i) * womenRate[i] * U, -w / 2], [x + w / 2, womenCount(i) * U + 0.004, w / 2]), { color: "#5f4b2b" }),
    };
  });
  Wm.forEach((d) => {
    d.adm.hide(0.4).startNextImmediately();
    d.rej.hide(0.4).startNextImmediately();
  });
  liveW.forEach((d) => {
    d.adm.show(0.4).startNextImmediately();
    d.rej.show(0.4).startNextImmediately();
  });
  k.hold(0.4);
  const womenAgg = () => depts.reduce((a, _, i) => a + womenCount(i) * womenRate[i], 0) / womenTotal;
  k.panel({
    params: [mix01],
    readout() {
      const wa = womenAgg();
      return `Men overall: <b class="sky">44.5%</b>. Women overall: <b class="amber">${(100 * wa).toFixed(1)}%</b>. Same department rates for women throughout; only <em>where</em> they applied changes. ${mix01.value > 0.95 ? "Apply like the men did, and the women’s overall rate matches or beats theirs." : ""}`;
    },
  });

  k.beat("question");
  const nodeAt = { g: [-2.6, 5.4, 0], d: [0, 6.5, 0], a: [2.6, 5.4, 0] };
  const nodes = Object.values(nodeAt).map((at, i) => k.shape({ type: "disk", radius: 0.36, depth: 0.14, color: [C.violet, C.mint, C.paper][i], at }));
  const e1 = k.shape(arrow(add(nodeAt.g, [0.35, 0.18, 0]), add(nodeAt.d, [-0.4, -0.1, 0]), { color: C.chalk }));
  const e2 = k.shape(arrow(add(nodeAt.d, [0.4, -0.1, 0]), add(nodeAt.a, [-0.35, 0.18, 0]), { color: C.chalk }));
  const e3 = k.shape(arrow(add(nodeAt.g, [0.45, 0, 0]), add(nodeAt.a, [-0.45, 0, 0]), { color: C.coral }));
  k.cam([0, 6.4, 13.5], [0, 3.1, 0], 1.6).startNextImmediately();
  nodes.forEach((n) => n.show(0.4).startNextImmediately());
  k.hold(0.4);
  e1.draw(0.6);
  e2.draw(0.6);
  e3.draw(0.6);
  k.label("gender", add(nodeAt.g, [0, 0.62, 0]), { cls: "tag accent-violet" });
  k.label("department chosen", add(nodeAt.d, [0, 0.62, 0]), { cls: "tag accent-mint" });
  k.label("admission", add(nodeAt.a, [0, 0.62, 0]), { cls: "tag" });
  k.label("the committee’s treatment?", [0, 5.1, 0], { cls: "tag accent-coral" });
  k.hold(3);
  return k.finish();
}

// =================================================================== chain and fork

const WORLD = { a: 0.8, e: 0.6 };
function worldSample(seed = 7) {
  const g = random(seed);
  return Array.from({ length: 2 * CLOUD_LIMIT }, () => {
    const x = g.normal(),
      m = WORLD.a * x + WORLD.e * g.normal(),
      y = WORLD.a * m + WORLD.e * g.normal();
    return [x, m, y];
  });
}
// Build both worlds: a node diagram above, and a cloud of (X, M, Y) below.
function twoWorlds(k, { centers = [-2.7, 2.7], top = 2.9, mid = -0.5, points }) {
  const out = [];
  const sc = 0.42;
  centers.forEach((cx, w) => {
    const o = [cx, mid, 0];
    const P = (v) => add(o, [v[0] * sc, v[2] * sc, v[1] * sc]);
    const tok = [[cx - 1.1, top, 0], [cx, top + 0.7, 0], [cx + 1.1, top, 0]];
    const tokens = tok.map((at, i) => k.shape({ type: "disk", radius: 0.3, depth: 0.12, color: [C.amber, C.sky, C.mint][i], at }));
    const dir = (a, b) => unit(sub(b, a));
    const link = (a, b) => k.shape(arrow(add(a, mul(dir(a, b), 0.36)), sub(b, mul(dir(a, b), 0.36)), { color: C.chalk, radius: 0.03, head: 0.2, headRadius: 0.08 }));
    const arrows = w === 0 ? [link(tok[0], tok[1]), link(tok[1], tok[2])] : [link(tok[1], tok[0]), link(tok[1], tok[2])];
    const s = 1.35;
    const frame = k.shape(polyline([[-s, -s, -s], [s, -s, -s], [s, -s, s], [-s, -s, s], [-s, -s, -s], [-s, s, -s], [s, s, -s], [s, -s, -s], [s, s, -s], [s, s, s], [s, -s, s], [s, s, s], [-s, s, s], [-s, -s, s], [-s, s, s], [-s, s, -s]].map((p) => add(o, p)), { color: C.slate, lineWidth: 1.2 }));
    out.push({ o, P, tok, tokens, arrows, frame });
  });
  return out;
}

async function worlds(host) {
  const k = studio(host, {
    projection: "perspective",
    camera: { at: [0, 3.2, 14.5], lookAt: [0, 1.0, 0] },
    description: "Two different causal worlds, a chain and a fork, produce exactly the same cloud of data.",
  });
  const data = worldSample();
  const W = twoWorlds(k, {});
  const Sigma = [[1, 0.8, 0.64], [0.8, 1, 0.8], [0.64, 0.8, 1]];
  // Cholesky factor of Σ, for the 2-sigma ellipsoid.
  const L = [[1, 0, 0], [0.8, 0.6, 0], [0.64, 0.48, 0.6]];
  const ellipsoid = (P) => ({
    type: "surface",
    u: [0, 1],
    v: [0, 1],
    uSegments: 32,
    vSegments: 16,
    fn: (s, t) => {
      const lat = (t - 0.5) * Math.PI,
        d = [Math.cos(TAU * s) * Math.cos(lat), Math.sin(lat), Math.sin(TAU * s) * Math.cos(lat)].map((x) => 2 * x);
      const v = [0, 1, 2].map((r) => L[r][0] * d[0] + L[r][1] * d[1] + L[r][2] * d[2]);
      return P(v);
    },
  });

  k.beat("two-worlds");
  W.forEach((w) => w.tokens.forEach((t) => t.show(0.3).startNextImmediately()));
  k.hold(0.4);
  W.forEach((w) => w.arrows.forEach((a) => a.draw(0.5)));
  W.forEach((w, i) => {
    ["X", "M", "Y"].forEach((n, j) => k.label(n, add(w.tok[j], [0, 0, 0.2]), { cls: "node", persist: true }));
    k.label(i === 0 ? "World A: a chain" : "World B: a fork", add(w.tok[1], [0, 0.75, 0]), { cls: "tag", persist: true });
  });
  k.label("X causes M, M causes Y", add(W[0].tok[1], [0, -1.1, 0]), { cls: "tag soft" });
  k.label("M causes both X and Y", add(W[1].tok[1], [0, -1.1, 0]), { cls: "tag soft" });
  k.hold(2.5);

  k.beat("same-data");
  const clouds = W.map((w) => [0, 1].map((c) => k.shape(cloud(data.slice(c * CLOUD_LIMIT, (c + 1) * CLOUD_LIMIT).map(w.P), 0.05, { color: C.paper }))));
  const shells = W.map((w) => k.shape({ ...ellipsoid(w.P), color: C.violet, wireframe: true }));
  W.forEach((w) => w.frame.draw(0.8).startNextImmediately());
  k.hold(0.8);
  clouds.flat().forEach((c) => c.show(0.8).startNextImmediately());
  k.hold(0.8);
  shells.forEach((sh) => sh.fadeTo(0.5, 1).startNextImmediately());
  k.hold(1);
  W.forEach((w) => k.label("the same ellipsoid", add(w.o, [0, -1.75, 0]), { cls: "tag accent-violet" }));
  const eq = await equation(k, String.raw`r_{XM}=.8\quad r_{MY}=.8\quad r_{XY}=.64`, { at: [0, -2.75, 0.6], toward: [0, 3.2, 14.5], width: 4.4 });
  eq.draw(1.4);
  k.hold(2.5);

  k.beat("perfect-fit");
  W.forEach((w) => k.label("model fit: perfect ✓", add(w.o, [0, 1.75, 0]), { cls: "tag accent-mint" }));
  k.label("in both: X and Y are unrelated once you know M", [0, 1.9, 0], { cls: "tag" });
  k.hold(3);
  return k.finish();
}

// =================================================================== 1910 · Perrin

async function perrin(host) {
  const k = studio(host, {
    projection: "perspective",
    camera: { at: [0, 2.6, 13], lookAt: [0, 0.4, 0] },
    description: "Jittering particles, then many different experiments converging on the same hidden number.",
  });
  const g = random(1910);
  const walks = Array.from({ length: 6 }, (_, i) => {
    let p = [(i - 2.5) * 0.9, 0.4 + 0.5 * g.normal(), 0.5 * g.normal()];
    const pts = [p];
    for (let n = 0; n < 240; n++) {
      p = add(p, [0.12 * g.normal(), 0.12 * g.normal(), 0.12 * g.normal()]);
      pts.push(p);
    }
    return pts;
  });
  const paths = walks.map((pts, i) => k.shape({ type: "path", points: pts, segments: 480, color: [C.mint, C.sky, C.amber, C.violet, C.coral, C.rose][i], lineWidth: 1.8 }));
  const grains = walks.map((pts) => k.shape(ball(pts.at(-1), 0.11, { color: C.paper, u: 16, v: 8 })));

  k.beat("brownian");
  paths.forEach((p) => p.draw(5).startNextImmediately());
  k.hold(5);
  grains.forEach((g) => g.show(0.3).startNextImmediately());
  k.label("visible grains, shoved by invisible molecules", [0, -2.3, 0], { cls: "tag" });
  k.hold(2);

  k.beat("routes");
  paths.forEach((p) => p.hide(0.8).startNextImmediately());
  grains.forEach((g) => g.hide(0.6).startNextImmediately());
  k.cam([0.6, 1.6, 13], [0.6, 0.4, 0], 1.6).startNextImmediately();
  // A vertical scale for Avogadro's number (×10²³) on the right.
  const yOf = (v) => (v - 6.6) * 3.2;
  const scaleX = 2.8;
  const ruler = k.shape(segment([scaleX, yOf(5.6), 0], [scaleX, yOf(7.8), 0], { color: C.chalk, lineWidth: 2 }));
  const ticks = k.shape(cloud([5.6, 6, 6.4, 6.8, 7.2, 7.6].map((v) => [scaleX, yOf(v), 0]), 0.04, { color: C.chalk }));
  ruler.draw(0.8).startNextImmediately();
  ticks.show(0.8);
  [6, 7].forEach((v) => k.label(`${v} × 10²³`, [scaleX + 0.9, yOf(v), 0], { cls: "tick", persist: true }));
  // Approximate values from Perrin's 1913 summary table.
  const methods = [
    ["grains settling in a column", 6.8],
    ["grains wandering sideways", 6.9],
    ["grains rotating", 6.5],
    ["the blue of the sky", 6.5],
    ["black-body radiation", 6.4],
    ["counting radioactive decays", 6.4],
    ["critical opalescence", 7.5],
  ];
  const starts = methods.map((_, i) => [-3.4, 2.6 - i * 0.86, 0]);
  const stations = starts.map((at, i) => k.shape({ type: "disk", radius: 0.16, depth: 0.1, color: [C.mint, C.mint, C.mint, C.sky, C.amber, C.violet, C.rose][i], at }));
  const arcs = methods.map(([, v], i) =>
    k.shape({ type: "bezier", points: [starts[i], [-0.8, starts[i][1], 0.4], [1.2, yOf(v), 0.4], [scaleX - 0.05, yOf(v), 0]], segments: 96, color: C.paper, lineWidth: 2 }),
  );
  const hits = methods.map(([, v]) => k.shape(ball([scaleX, yOf(v), 0], 0.09, { color: C.amber, u: 16, v: 8 })));
  methods.forEach(([name], i) => {
    stations[i].show(0.2);
    k.label(name, add(starts[i], [0, 0.34, 0]), { cls: "tick" });
    arcs[i].draw(0.5).startNextImmediately();
    k.hold(0.5);
    hits[i].show(0.2);
  });
  const band = k.shape(box([scaleX - 0.18, yOf(6.02) - 0.02, -0.18], [scaleX + 0.18, yOf(6.02) + 0.02, 0.18], { color: C.mint }));
  band.show(0.5);
  k.label("today: 6.022 × 10²³", [scaleX - 0.9, yOf(6.02) - 0.3, 0], { cls: "tag accent-mint" });
  k.hold(2.5);
  return k.finish();
}

// =================================================================== 1943 · Haavelmo

const wrenchSvg = `<svg viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg"><path d="M30 14L112 14A6 6 0 0 1 112 26L30 26C26 34 14 38 7 33L16 24L13 16L4 10C9 2 24 4 30 14Z" fill="#000"/></svg>`;

async function haavelmo(host) {
  const k = studio(host, {
    projection: "perspective",
    camera: { at: [0, 1.6, 12.5], lookAt: [0, 0.6, 0] },
    description: "Supply and demand shift daily; then a wrench sets X in two worlds and only one of them responds.",
  });
  // --- a market: every day both curves move, and we only see where they cross
  const O = [-2.6, -2.4, 0];
  const q2w = ([q, p]) => add(O, [q * 1.05, p * 1.05, 0]);
  const axQ = k.shape(arrow(O, add(O, [5.6, 0, 0]), { color: C.chalk, radius: 0.02, head: 0.2, headRadius: 0.07 }));
  const axP = k.shape(arrow(O, add(O, [0, 5.2, 0]), { color: C.chalk, radius: 0.02, head: 0.2, headRadius: 0.07 }));
  const g = random(1943);
  const days = Array.from({ length: 9 }, () => ({ a: 5 + 0.55 * g.normal(), b: 0.4 + 0.55 * g.normal() }));
  const eq = days.map(({ a, b }) => [(a - b) / 2, (a + b) / 2]);

  k.beat("market");
  axQ.draw(0.8).startNextImmediately();
  axP.draw(0.8);
  k.label("quantity sold", add(O, [5.2, -0.35, 0]), { cls: "tick" });
  k.label("price", add(O, [-0.1, 5.5, 0]), { cls: "tick" });
  const dots = [];
  days.forEach(({ a, b }, i) => {
    const demand = k.shape(segment(q2w([0.2, a - 0.2]), q2w([4.8, a - 4.8]), { color: C.coral, lineWidth: 2.5 }));
    const supply = k.shape(segment(q2w([0.2, b + 0.2]), q2w([4.8, b + 4.8]), { color: C.sky, lineWidth: 2.5 }));
    const dot = k.shape(ball(q2w(eq[i]), 0.1, { color: C.amber, u: 16, v: 8 }));
    dots.push(dot);
    demand.draw(0.35).startNextImmediately();
    supply.draw(0.35);
    dot.show(0.2);
    if (i === 0) {
      k.label("demand", q2w([4.3, a - 4.1]), { cls: "tag accent-coral" }).end(k.now() + 1.4);
      k.label("supply", q2w([4.3, b + 4.6]), { cls: "tag accent-sky" }).end(k.now() + 1.4);
      k.hold(1.2);
    }
    demand.hide(0.35).startNextImmediately();
    supply.hide(0.35);
  });
  const fit = slope(eq.map((e) => e[0]), eq.map((e) => e[1]));
  const reg = k.shape(segment(q2w([0.3, fit.my + fit.slope * (0.3 - fit.mx)]), q2w([4.6, fit.my + fit.slope * (4.6 - fit.mx)]), { color: C.amber, lineWidth: 3 }));
  reg.draw(1);
  k.label(`a line through what we saw: slope ${fit.slope.toFixed(2)}`, q2w([3.6, fit.my + fit.slope * (3.6 - fit.mx) + 0.6]), { cls: "tag accent-amber" });
  k.label("true demand slope: −1 · true supply slope: +1", add(O, [2.6, -0.9, 0]), { cls: "tag soft" });
  k.hold(2.5);

  // --- seeing versus doing
  k.beat("wrench");
  [axQ, axP, reg, ...dots].forEach((o) => o.hide(0.5).startNextImmediately());
  k.hold(0.5);
  const data = worldSample();
  const W = twoWorlds(k, {});
  const x0 = k.param("x0", 1.5, -2, 2, 0.05, { label: "the value of X" });
  const mode = k.param("mode", 1, 0, 1, 1, { label: "watch ⟷ reach in", format: (v) => (v ? "do(X)" : "see X") });
  let exploreAt = Infinity,
    act = () => 0;
  const X0 = () => (k.T() >= exploreAt ? x0.value : 1.5);
  const doing = () => (k.T() >= exploreAt ? mode.value : 1);
  const blend = () => (k.T() >= exploreAt ? 1 : act());
  const intervene = ([x, m, y], world) => {
    const eM = m - WORLD.a * x,
      eY = y - WORLD.a * m;
    if (world === 1) return [X0(), m, y];
    const m2 = WORLD.a * X0() + eM;
    return [X0(), m2, WORLD.a * m2 + eY];
  };
  const near = (p) => Math.abs(p[0] - X0()) < 0.3;
  const cloudsOf = (w, world) =>
    [0, 1].map((c) =>
      k.live(() => {
        const pts = data.slice(c * CLOUD_LIMIT, (c + 1) * CLOUD_LIMIT);
        if (doing()) return cloud(pts.map((p) => w.P(lerp3(p, intervene(p, world), blend()))), 0.05);
        return cloud(pts.map(w.P), pts.map((p) => (near(p) ? 0.07 : 0.025)));
      }, { color: C.paper }),
    );
  const clouds = W.map((w, i) => cloudsOf(w, i));
  const clamp3 = W.map((w) =>
    k.live(() => {
      const x = w.P([X0(), 0, 0])[0],
        s = 1.35,
        y0 = w.o[1];
      return quad([x, y0 - s, -s], [x, y0 - s, s], [x, y0 + s, s], [x, y0 + s, -s]);
    }, { color: C.coral }),
  );
  W.forEach((w) => {
    w.tokens.forEach((t) => t.show(0.3).startNextImmediately());
    w.arrows.forEach((a) => a.draw(0.3).startNextImmediately());
    w.frame.draw(0.3).startNextImmediately();
  });
  clouds.flat().forEach((c) => c.show(0.6).startNextImmediately());
  k.cam([0, 3.2, 14.5], [0, 1.0, 0], 1.2);
  W.forEach((w, i) => {
    ["X", "M", "Y"].forEach((n, j) => k.label(n, add(w.tok[j], [0, 0, 0.2]), { cls: "node", persist: true }));
    k.label(i === 0 ? "World A: chain" : "World B: fork", add(w.tok[1], [0, 0.75, 0]), { cls: "tag", persist: true });
    k.label("X →", add(w.o, [1.6, -1.35, 0]), { cls: "tick", persist: true });
    k.label("Y ↑", add(w.o, [-1.6, 1.35, 0]), { cls: "tick", persist: true });
  });
  const wrenches = W.map((w) => k.scene.svg(wrenchSvg, { width: 1.5, depth: 0.14, color: C.coral, at: add(w.tok[0], [-1.4, 0.9, 0]), rotation: [0, 0, 20] }));
  wrenches.forEach((wr) => wr.draw(0.6).startNextImmediately());
  k.hold(0.6);
  wrenches.forEach((wr, i) => wr.moveTo(add(W[i].tok[0], [-0.95, 0, 0.1]), 0.8).startNextImmediately());
  wrenches.forEach((wr) => wr.rotateTo([0, 0, -10], 0.8).startNextImmediately());
  k.hold(0.8);
  W.forEach((w) => w.arrows[0].fadeTo(w === W[0] ? 1 : 0.15, 0.6).startNextImmediately());
  clamp3.forEach((c) => c.fadeTo(0.3, 0.6).startNextImmediately());
  const t0 = k.now();
  k.scene.wait(2.8);
  act = k.window(t0, t0 + 2.8);
  k.label("M and Y follow X", add(W[0].o, [0, 1.8, 0]), { cls: "tag accent-mint" });
  k.label("M ignores X; Y doesn’t move", add(W[1].o, [0, 1.8, 0]), { cls: "tag accent-coral" });
  k.label("do(X = 1.5)", [0, 0.9, 0], { cls: "tag accent-coral" });
  k.hold(2.5);

  k.beat("see-do");
  exploreAt = k.now();
  k.hold(0.3);
  const meanY = (world) => {
    const pts = doing() ? data.map((p) => intervene(p, world)) : data.filter(near);
    return pts.length ? pts.reduce((a, p) => a + p[2], 0) / pts.length : NaN;
  };
  k.panel({
    params: [x0, mode],
    presets: [
      { label: "Just look: condition on X", set: [[mode, 0]] },
      { label: "Reach in: set X", set: [[mode, 1]] },
    ],
    readout() {
      const verb = doing() ? `after <b>setting</b> X = ${fmt(X0(), 1)}` : `among cases where X ≈ ${fmt(X0(), 1)}`;
      return `Average Y ${verb}: World A <b class="mint">${fmt(meanY(0))}</b>, World B <b class="coral">${fmt(meanY(1))}</b>. ${doing() ? "The worlds finally disagree." : "Watching, the worlds are indistinguishable."}`;
    },
  });

  k.beat("structural");
  const doEq = await equation(k, String.raw`P(Y\mid X=x)\;\neq\;P\big(Y\mid \mathrm{do}(X=x)\big)`, { at: [0, -2.9, 0.6], toward: [0, 3.2, 14.5], width: 4.2 });
  doEq.draw(1.5);
  k.hold(2.5);
  return k.finish();
}

// =================================================================== neural networks

async function network(host) {
  const k = studio(host, {
    projection: "perspective",
    camera: { at: [0, 2.4, 14.5], lookAt: [0, 0.2, 0] },
    description: "A two-layer network: its hidden layer can rotate freely without changing the output.",
  });
  const g = random(2024);
  const xs = Array.from({ length: CLOUD_LIMIT }, () => [g.normal(), g.normal(), g.normal()]);
  const W1 = [[0.9, 0.5, -0.2], [-0.3, 0.6, 0.8]];
  const W2 = [[0.8, -0.4], [0.3, 0.9]];
  const mv = (A, v) => A.map((row) => row.reduce((s, a, i) => s + a * v[i], 0));
  const hs = xs.map((x) => mv(W1, x));
  const ys = hs.map((h) => mv(W2, h));
  const phi = k.param("φ", 0, -180, 180, 1, { label: "rotate the hidden layer", format: (v) => `${v.toFixed(0)}°` });
  let exploreAt = Infinity,
    spin = () => 0,
    snap = () => 0;
  const angle = () => (k.T() >= exploreAt ? (phi.value * Math.PI) / 180 : TAU * spin() + snap() * 0.61);
  const rot = (v, a) => [v[0] * Math.cos(a) - v[1] * Math.sin(a), v[0] * Math.sin(a) + v[1] * Math.cos(a)];
  const inAt = [-2.95, 0, 0],
    hidAt = [0, 0, 0],
    outAt = [2.95, 0, 0];
  const s = 0.4;
  const input = k.shape(cloud(xs.map((x) => add(inAt, mul(x, 0.34))), 0.05, { color: C.sky }));
  const plate = (at) => k.shape(disc(at, [0, 0, 1], 1.25, { color: "#1b292d" }));
  const hPlate = plate(hidAt),
    oPlate = plate(outAt);
  const hidden = k.live(() => cloud(hs.map((h) => add(hidAt, [...mul(rot(h, angle()), s), 0.02])), 0.055), { color: C.amber });
  const output = k.shape(cloud(ys.map((y) => add(outAt, [...mul(y, s * 0.85), 0.02])), 0.055, { color: C.mint }));
  const axis = (i) => k.live(() => {
    const e = rot(i ? [0, 1] : [1, 0], angle());
    return arrow(hidAt, add(hidAt, [e[0] * 1.15, e[1] * 1.15, 0.03]), { radius: 0.03, head: 0.2, headRadius: 0.08 });
  }, { color: i ? C.violet : C.coral });
  const axes2 = [axis(0), axis(1)];
  const wires = [0, 1].map((side) =>
    k.shape(polyline([side ? add(hidAt, [1.3, 0, 0]) : add(inAt, [0.95, 0, 0]), side ? add(outAt, [-1.3, 0, 0]) : add(hidAt, [-1.3, 0, 0])], { color: C.dim, lineWidth: 2 })),
  );

  k.beat("hidden");
  input.show(0.6);
  wires[0].draw(0.5);
  hPlate.show(0.4).startNextImmediately();
  hidden.show(0.6);
  axes2.forEach((a) => a.draw(0.5).startNextImmediately());
  k.hold(0.5);
  wires[1].draw(0.5);
  oPlate.show(0.4).startNextImmediately();
  output.show(0.6);
  k.label("input", add(inAt, [0, 1.9, 0]), { cls: "tag accent-sky", persist: true });
  k.label("hidden layer", add(hidAt, [0, 1.9, 0]), { cls: "tag accent-amber", persist: true });
  k.label("output", add(outAt, [0, 1.9, 0]), { cls: "tag accent-mint", persist: true });
  const t0 = k.now();
  k.scene.wait(5);
  spin = k.window(t0, t0 + 5);
  k.label("rotate the hidden layer all the way around: the output never moves", [0, -2.1, 0], { cls: "tag" });
  k.hold(1.5);

  k.beat("explore");
  exploreAt = k.now();
  k.hold(0.3);
  k.panel({
    params: [phi],
    readout() {
      const a = (phi.value * Math.PI) / 180;
      // Compensating output weights W2·R(−a) exactly undo the rotation.
      const err = hs.reduce((m, h, i) => {
        const r = rot(h, a),
          back = rot(r, -a),
          y = mv(W2, back);
        return Math.max(m, Math.hypot(y[0] - ys[i][0], y[1] - ys[i][1]));
      }, 0);
      return `Hidden coordinates rotated by <b class="amber">${phi.value.toFixed(0)}°</b>. Largest change in any output: <b class="mint">${err.toExponential(1)}</b>. The labels on the hidden axes mean nothing on their own.`;
    },
  });

  k.beat("restrict");
  const t1 = k.now();
  k.scene.wait(1.8);
  snap = k.window(t1, t1 + 1.8);
  k.label("fix a zero: “this indicator measures only factor 1”", add(hidAt, [0, -2.1, 0]), { cls: "tag accent-coral" });
  k.label("the rotation is pinned", add(hidAt, [0, 2.4, 0]), { cls: "tag" });
  k.hold(2.5);
  return k.finish();
}

// =================================================================== finale

async function finale(host) {
  const k = studio(host, {
    camera: { at: [0, 0, 14], lookAt: [0, 0, 0] },
    viewHeight: 8,
    description: "Three shapes cast identical round shadows; turning the view reveals a sphere, a cylinder and a cone.",
  });
  const xs = [-2.1, 0, 2.1];
  const wall = k.shape(quad([-5.5, -3.5, -3], [5.5, -3.5, -3], [5.5, 3.5, -3], [-5.5, 3.5, -3], { color: "#172226" }));
  const shadows = xs.map((x) => k.shape(disc([x, 0, -2.97], [0, 0, 1], 0.8, { color: "#070b0d" })));
  // Near-black while we face the wall: from here they are indistinguishable silhouettes.
  const dark = "#05080a";
  const sphere = k.shape(ball([0, 0, 0], 0.8, { color: dark, u: 48, v: 24, at: [xs[0], 0, 0] }));
  const cylinder = k.shape({ type: "disk", radius: 0.8, depth: 1.5, segments: 128, color: dark, at: [xs[1], 0, 0] });
  const cone = k.shape({ type: "revolve", profile: { type: "path", points: [[0, -0.75], [0.8, -0.75], [0, 0.75]] }, uSegments: 64, vSegments: 64, color: dark, at: [xs[2], 0, 0], rotation: [90, 0, 0] });

  k.beat("recap");
  wall.show(0.8);
  shadows.forEach((d) => d.show(0.5));
  k.label("three shadows", [0, -1.4, -3], { cls: "tag" }).end(k.now() + 2.2);
  k.hold(1.4);
  [sphere, cylinder, cone].forEach((o) => o.show(0.8).startNextImmediately());
  k.hold(1);
  k.label("three objects, from here identical", [0, -1.4, 1], { cls: "tag" });
  k.hold(2);

  k.beat("touch");
  k.cam([9.5, 5.5, 9.5], [0, 0, 0], 3.5);
  k.label("sphere", [xs[0], 1.2, 0], { cls: "tag accent-mint", persist: true });
  k.label("cylinder", [xs[1], 1.2, 0], { cls: "tag accent-sky", persist: true });
  k.label("cone", [xs[2], 1.2, 0], { cls: "tag accent-amber", persist: true });
  sphere.colorTo(C.mint, 1).startNextImmediately();
  cylinder.colorTo(C.sky, 1).startNextImmediately();
  cone.colorTo(C.amber, 1);
  k.hold(2);

  k.beat("end");
  k.cam([-8, 4, 11], [0, 0, 0], 4).startNextImmediately();
  cylinder.rotateBy([0, 180, 0], 4).startNextImmediately();
  cone.rotateBy([0, 0, 180], 4);
  k.hold(2);
  return k.finish();
}

export const scenes = {
  prologue,
  legendre,
  squares,
  bessel,
  gosset,
  galton,
  wright,
  spearman,
  berkson,
  berkeley,
  worlds,
  perrin,
  haavelmo,
  network,
  finale,
};
