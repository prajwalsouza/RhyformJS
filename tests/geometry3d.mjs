import assert from "node:assert/strict";
import {
  compileGeometry as compile,
  prepareGeometryMorph as morph,
  geometryNames,
  curveSampler,
} from "../src/geometry3d.js";
import { createTagTree, selectTag } from "../src/tags3d.js";
let passed = 0;
function test(name, run) {
  run();
  passed++;
  console.log("PASS " + name);
}
const circle = { type: "circle" },
  wave = { type: "wave" },
  line = { type: "line" };
const fixtures = {
  vector: {
    asset: {
      paths: [
        {
          fill: "#000",
          stroke: "none",
          fillRule: "nonzero",
          contours: [
            {
              closed: true,
              points: [
                { x: 0, y: 0 },
                { x: 1, y: 0 },
                { x: 0, y: 1 },
              ],
            },
          ],
        },
      ],
    },
  },
  curve: { fn: (t) => [t, t * t, t * t * t] },
  path: {
    points: [
      [0, 0, 0],
      [1, 1, 0],
      [2, 0, 1],
    ],
  },
  bezier: {
    points: [
      [0, 0, 0],
      [1, 2, 1],
      [2, 0, 0],
    ],
  },
  fill: { boundary: circle, holes: [{ type: "circle", radius: 0.4 }] },
  extrusion: { shape: { type: "disk" }, depth: 2 },
  surface: { fn: (u, v) => [u, v, u * v] },
  heightField: { fn: (x, z) => Math.cos(x) * Math.sin(z) },
  between: { from: wave, to: line },
  loft: { curves: [wave, line, { type: "helix" }] },
  revolve: { profile: { type: "line", from: [1, -1, 0], to: [0.5, 1, 0] } },
  tube: { curve: { type: "helix" } },
  ribbon: { curve: wave },
};
for (const type of geometryNames)
  test(`finite indexed geometry: ${type}`, () => {
    const g = compile({ type, ...fixtures[type] });
    assert.ok(g.positions.length >= 9);
    assert.ok(g.positions.every(Number.isFinite));
    if (g.indices) {
      assert.ok(g.indices.length % 3 === 0);
      assert.ok(g.indices.every((i) => i < g.positions.length / 3));
    }
  });
test("XYZ parametric domain is applied once and preserves endpoints", () => {
  const g = compile({
    type: "curve",
    range: [-2, 3],
    segments: 10,
    fn: (t) => [t, t * t, 7],
  });
  assert.deepEqual([...g.positions.slice(0, 3)], [-2, 4, 7]);
  assert.deepEqual([...g.positions.slice(-3)], [3, 9, 7]);
});
test("curve morph has exact endpoints and deterministic reusable output", () => {
  const a = compile(wave),
    b = compile({ type: "helix" }),
    plan = morph(a, b),
    out = new Float32Array(a.positions.length);
  assert.equal(plan.sample(0.5, out), out);
  const middle = new Float32Array(out);
  plan.sample(1, out);
  assert.deepEqual(out, b.positions);
  plan.sample(0.5, out);
  assert.deepEqual(out, middle);
  plan.sample(0, out);
  assert.deepEqual(out, a.positions);
});
test("disk, square, cube and explicit extrusion share their boundary correspondence", () => {
  const a = compile({ type: "disk" }),
    b = compile({ type: "square" }),
    c = compile({ type: "cube" }),
    d = compile({ type: "extrusion", shape: { type: "square" }, depth: 2 });
  morph(a, b);
  morph(b, c);
  assert.deepEqual(c.positions, d.positions);
  assert.deepEqual(c.indices, d.indices);
  assert.equal(a.depth, 0);
  assert.equal(c.depth, 2);
  assert.ok(a.flatCount < a.indices.length);
});
test("surface fill interpolates the placed boundary curves", () => {
  const g = compile({
    type: "between",
    from: { type: "line", from: [0, 0, 0], to: [2, 0, 0], at: [0, -1, 0] },
    to: { type: "line", from: [0, 0, 0], to: [2, 0, 0], at: [0, 1, 0] },
    uSegments: 4,
    vSegments: 4,
  });
  assert.deepEqual(g.sample(0.25, 0), [0.5, -1, 0]);
  assert.deepEqual(g.sample(0.25, 1), [0.5, 1, 0]);
  assert.deepEqual(g.sample(0.25, 0.5), [0.5, 0, 0]);
});
test("loft passes through each authored cross-section", () => {
  const g = compile({
    type: "loft",
    curves: [
      { type: "line", at: [0, -2, 0] },
      { type: "line", at: [0, 0, 1] },
      { type: "line", at: [0, 2, 0] },
    ],
  });
  assert.deepEqual(g.sample(0.5, 0.5), [0, 0, 1]);
});
test("revolution preserves profile radius and height", () => {
  const g = compile({
    type: "revolve",
    profile: { type: "line", from: [2, -1, 0], to: [1, 1, 0] },
  });
  const p = g.sample(0.5, 0.25);
  assert.ok(Math.abs(p[0]) < 1e-12);
  assert.equal(p[1], 0);
  assert.equal(p[2], 1.5);
});
test("annular fill has a hole and extrusion preserves its cap triangulation", () => {
  const shape = {
    type: "fill",
    boundary: { type: "circle", radius: 2 },
    holes: [{ type: "circle", radius: 1 }],
    segments: 256,
  };
  const a = compile(shape),
    b = compile({ type: "extrusion", shape, depth: 3 });
  morph(a, b);
  let area = 0;
  for (let i = 0; i < a.flatCount; i += 3) {
    const p = [0, 1, 2].map((k) =>
      a.positions.slice(a.indices[i + k] * 3, a.indices[i + k] * 3 + 3),
    );
    area +=
      Math.abs(
        (p[1][0] - p[0][0]) * (p[2][1] - p[0][1]) -
          (p[1][1] - p[0][1]) * (p[2][0] - p[0][0]),
      ) / 2;
  }
  assert.ok(Math.abs(area - Math.PI * 3) < 0.01);
  assert.equal(Math.max(...b.positions.filter((_, i) => i % 3 === 2)), 1.5);
});
test("invalid geometry is rejected before allocating unbounded buffers", () => {
  for (const d of [
    { type: "curve", fn: () => [NaN, 0, 0] },
    { type: "curve", fn: (t) => [t, 0, 0], segments: 1e8 },
    { type: "sphere", radius: -1 },
    { type: "surface", fn: () => [0, 0, Infinity] },
    { type: "fill", boundary: line },
    {
      type: "revolve",
      profile: { type: "line", from: [-1, 0, 0], to: [1, 1, 0] },
    },
    { type: "extrusion", shape: { type: "square" }, depth: -1 },
  ])
    assert.throws(() => compile(d));
  assert.throws(
    () => morph(compile(wave), compile({ type: "sphere" })),
    /topology/,
  );
});
test("tag descendants are deduplicated, ordered, and counted as a tree", () => {
  const a = { tags: new Set(["lesson/curves/first", "lesson/curves"]) },
    b = { tags: new Set(["lesson/curves/second"]) },
    c = { tags: new Set(["other"]) },
    objects = new Set([a, b, c]);
  assert.deepEqual(selectTag(objects, "lesson"), [a, b]);
  assert.deepEqual(selectTag(objects, "lesson/curve"), []);
  const tree = createTagTree(objects);
  assert.equal(tree.children[0].count, 2);
  assert.equal(tree.children[0].children[0].count, 2);
  assert.throws(() => selectTag(objects, "lesson//curves"));
});
test("placed curve descriptors apply scale and XYZ rotations before translation", () => {
  const sample = curveSampler(
    {
      type: "line",
      from: [1, 0, 0],
      to: [2, 0, 0],
      scale: 2,
      rotation: [0, 0, 90],
      at: [3, 4, 5],
    },
    true,
  );
  const p = sample(0);
  assert.ok(Math.abs(p[0] - 3) < 1e-12);
  assert.equal(p[1], 6);
  assert.equal(p[2], 5);
});
test("tube sampling is continuous between grid rows and closes its frame seam", () => {
  const g = compile({
    type: "tube",
    curve: { type: "circle" },
    uSegments: 128,
  });
  const a = g.sample(0.201, 0.2),
    b = g.sample(0.202, 0.2);
  assert.ok(Math.hypot(...a.map((n, i) => n - b[i])) < 0.02);
  for (const v of [0, 0.2, 0.5, 0.9]) {
    const a = g.sample(0, v),
      b = g.sample(1, v);
    assert.ok(Math.hypot(...a.map((n, i) => n - b[i])) < 1e-6);
  }
});
test("invalid progress and square samples cannot silently corrupt the mesh", () => {
  assert.throws(() => compile({ type: "square", segments: 12 }), /eight/);
  const a = compile(wave),
    plan = morph(a, a),
    out = new Float32Array(a.positions.length);
  for (const t of [NaN, Infinity, -0.1, 1.1])
    assert.throws(() => plan.sample(t, out));
});
test("vector triangulation preserves holes under either SVG winding rule", () => {
  const ring = (points) => ({
    closed: true,
    points: points.map(([x, y]) => ({ x, y })),
  });
  const outer = ring([
      [0, 0],
      [4, 0],
      [4, 4],
      [0, 4],
    ]),
    hole = ring([
      [1, 1],
      [1, 3],
      [3, 3],
      [3, 1],
    ]);
  for (const fillRule of ["nonzero", "evenodd"]) {
    const g = compile({
      type: "vector",
      asset: {
        paths: [
          { fill: "#000", stroke: "none", fillRule, contours: [outer, hole] },
        ],
      },
    });
    let area = 0;
    for (let i = 0; i < g.indices.length; i += 3) {
      const p = [0, 1, 2].map((k) =>
        g.positions.slice(g.indices[i + k] * 3, g.indices[i + k] * 3 + 3),
      );
      area +=
        Math.abs(
          (p[1][0] - p[0][0]) * (p[2][1] - p[0][1]) -
            (p[1][1] - p[0][1]) * (p[2][0] - p[0][0]),
        ) / 2;
    }
    assert.equal(area, 12);
  }
});
console.log(`${passed} geometry and tag checks passed.`);
