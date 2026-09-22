import earcut from "earcut";
import { pointsPath } from "./svg.js";

const area = (points) =>
  points.reduce((sum, p, i) => {
    const q = points[(i + 1) % points.length];
    return sum + p.x * q.y - p.y * q.x;
  }, 0) / 2;
function inside(point, polygon) {
  let result = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i],
      b = polygon[j];
    if (
      a.y > point.y !== b.y > point.y &&
      point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x
    )
      result = !result;
  }
  return result;
}

// Build filled regions from contour containment, including nonzero SVG winding.
// Each glyph/path is independent, so overlapping letters keep their own outlines.
function regions(path) {
  const rings = path.contours
    .map((c) => {
      if (!c.closed)
        throw Error(
          "3D vector fills require closed outlines; convert strokes to filled paths",
        );
      if (!c.points.every((p) => Number.isFinite(p.x) && Number.isFinite(p.y)))
        throw Error("Vector coordinates must be finite");
      return { points: c.points, area: area(c.points), parent: null };
    })
    .filter((r) => Math.abs(r.area) > 1e-12)
    .sort((a, b) => Math.abs(b.area) - Math.abs(a.area));
  const result = [];
  rings.forEach((ring, i) => {
    for (let j = i - 1; j >= 0; j--)
      if (inside(ring.points[0], rings[j].points)) {
        ring.parent = rings[j];
        break;
      }
    const before = ring.parent?.winding ?? 0;
    ring.winding =
      path.fillRule === "evenodd" ? 1 - before : before + Math.sign(ring.area);
    if (!before && ring.winding) {
      ring.region = { outer: ring.points, holes: [] };
      result.push(ring.region);
    } else if (before && !ring.winding) {
      let parent = ring.parent;
      while (parent && !parent.region) parent = parent.parent;
      parent?.region.holes.push(ring.points);
    }
  });
  return result;
}

export function compileVector(asset, depth = 0) {
  if (!asset?.paths?.length || asset.paths.length > 256)
    throw Error("A vector needs 1–256 filled paths");
  if (!Number.isFinite(depth) || depth < 0)
    throw Error("Vector depth must be finite and non-negative");
  const positions = [],
    indices = [];
  let count = 0;
  for (const path of asset.paths) {
    if (
      path.fill === "none" ||
      (path.stroke && path.stroke !== "none" && path.strokeWidth > 0)
    )
      throw Error(
        "3D vectors currently require filled outlines without strokes",
      );
    if ((path.opacity ?? 1) !== 1 || (path.fillOpacity ?? 1) !== 1)
      throw Error("3D vectors currently require opaque filled outlines");
    for (const region of regions(path)) {
      const rings = [region.outer, ...region.holes].map((points, i) =>
        area(points) > 0 === (i === 0) ? points : [...points].reverse(),
      );
      const flat = rings.flat(),
        holes = [];
      let offset = rings[0].length;
      for (const ring of rings.slice(1)) {
        holes.push(offset);
        offset += ring.length;
      }
      count += flat.length;
      if (count > 100000) throw Error("3D vector sample budget exceeded");
      const cap = earcut(
          flat.flatMap((p) => [p.x, p.y]),
          holes,
          2,
        ),
        base = positions.length / 3;
      for (const p of flat) positions.push(p.x, p.y, depth / 2);
      for (const i of cap) indices.push(base + i);
      if (depth === 0) continue;
      for (const p of flat) positions.push(p.x, p.y, -depth / 2);
      for (let i = 0; i < cap.length; i += 3)
        indices.push(
          base + flat.length + cap[i + 2],
          base + flat.length + cap[i + 1],
          base + flat.length + cap[i],
        );
      for (const ring of rings) {
        const start = positions.length / 3;
        for (const p of ring)
          positions.push(p.x, p.y, depth / 2, p.x, p.y, -depth / 2);
        for (let i = 0; i < ring.length; i++) {
          const a = start + 2 * i,
            b = start + 2 * ((i + 1) % ring.length);
          indices.push(a, a + 1, b, b, a + 1, b + 1);
        }
      }
    }
  }
  const vertices = Float32Array.from(positions);
  if (!vertices.every(Number.isFinite))
    throw Error("Vector geometry exceeds the finite coordinate range");
  return {
    kind: "mesh",
    positions: vertices,
    indices: Uint32Array.from(indices),
    depth,
    asset,
    vector: true,
    flatShading: true,
    topology: "vector",
  };
}

export function vectorAsset(geometry) {
  if (geometry.asset) return geometry.asset;
  if (!geometry.contours)
    throw Error(
      "A vector morph needs filled contours on both ends; use extrusion for depth",
    );
  const contours = geometry.contours.map((points) => ({
    closed: true,
    points: points.map(([x, y]) => ({ x, y })),
  }));
  return {
    paths: [
      {
        contours,
        d: pointsPath(contours),
        fill: "#000000",
        stroke: "none",
        fillRule: "nonzero",
        opacity: 1,
        fillOpacity: 1,
        strokeOpacity: 1,
        strokeWidth: 0,
      },
    ],
  };
}
