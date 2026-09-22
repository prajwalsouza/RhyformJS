import earcut from "earcut";
import { compileVector } from "./vector3d.js";
import { finite, mix } from "./numeric.js";

const TAU = Math.PI * 2;
const CURVES = new Set([
  "curve",
  "line",
  "path",
  "circle",
  "ellipse",
  "helix",
  "spiral",
  "wave",
  "bezier",
  "torusKnot",
]);
const SOLIDS = new Set([
  "disk",
  "square",
  "rectangle",
  "polygon",
  "cube",
  "prism",
  "fill",
  "extrusion",
]);
export const geometryNames = [
  ...CURVES,
  ...SOLIDS,
  "surface",
  "plane",
  "heightField",
  "waveSurface",
  "saddle",
  "sphere",
  "torus",
  "cylinder",
  "cone",
  "between",
  "loft",
  "revolve",
  "tube",
  "ribbon",
  "vector",
];
export function vector(value, label = "point") {
  if (!value || typeof value !== "object")
    throw new TypeError(`${label} must contain x, y, z coordinates`);
  return [
    finite(value.x ?? value[0], label),
    finite(value.y ?? value[1], label),
    finite(value.z ?? value[2] ?? 0, label),
  ];
}
export function positive(value, label = "size") {
  finite(value, label);
  if (value <= 0) throw new RangeError(`${label} must be positive`);
  return value;
}
function count(value, min, max, label) {
  if (!Number.isInteger(value) || value < min || value > max)
    throw new RangeError(`${label} must be an integer from ${min} to ${max}`);
  return value;
}
const add = (a, b) => a.map((x, i) => x + b[i]);
const sub = (a, b) => a.map((x, i) => x - b[i]);
const mul = (a, s) => a.map((x) => x * s);
const lerp = (a, b, t) => a.map((x, i) => mix(x, b[i], t));
const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
function unit(a) {
  const length = Math.hypot(...a);
  if (length < 1e-10)
    throw Error(
      "Curve has a stationary or coincident segment; a sweep needs a tangent",
    );
  return mul(a, 1 / length);
}
function domain(value = [0, 1]) {
  if (
    !Array.isArray(value) ||
    value.length !== 2 ||
    !value.every(Number.isFinite) ||
    value[0] === value[1]
  )
    throw Error("A parameter range needs two different finite endpoints");
  return value;
}
export function describe(input, options = {}) {
  if (typeof input === "string") input = { type: input };
  if (typeof input === "function") input = { type: "curve", fn: input };
  if (!input || !geometryNames.includes(input.type))
    throw new Error(`Unknown 3D shape: ${input?.type ?? input}`);
  return { ...input, ...options };
}

export function curveSampler(input, placed = false) {
  const d = describe(input),
    radius = () => positive(d.radius ?? 1, "radius");
  let sample;
  if (d.type === "curve") {
    if (typeof d.fn !== "function")
      throw Error("A parametric curve needs a function");
    const [a, b] = domain(d.range);
    sample = (t) => vector(d.fn(mix(a, b, t)));
  } else if (d.type === "line") {
    const a = vector(d.from ?? [-2, 0, 0]),
      b = vector(d.to ?? [2, 0, 0]);
    sample = (t) => lerp(a, b, t);
  } else if (d.type === "path" || d.type === "bezier") {
    if (!Array.isArray(d.points)) throw Error(`${d.type} needs points`);
    count(
      d.points.length,
      2,
      d.type === "bezier" ? 32 : 4096,
      "control points",
    );
    const points = d.points.map((p) => vector(p));
    if (d.type === "path")
      sample = (t) => {
        const at = t * (points.length - 1),
          i = Math.min(points.length - 2, Math.floor(at));
        return lerp(points[i], points[i + 1], at - i);
      };
    else
      sample = (t) => {
        let row = points;
        while (row.length > 1)
          row = row.slice(1).map((p, i) => lerp(row[i], p, t));
        return row[0];
      };
  } else if (d.type === "circle" || d.type === "ellipse") {
    const rx = positive(d.radiusX ?? radius()),
      ry = positive(d.radiusY ?? radius());
    sample = (t) => [rx * Math.cos(TAU * t), ry * Math.sin(TAU * t), 0];
  } else if (d.type === "helix") {
    const r = radius(),
      height = finite(d.height ?? 4),
      turns = finite(d.turns ?? 3);
    sample = (t) => [
      r * Math.cos(TAU * turns * t),
      (t - 0.5) * height,
      r * Math.sin(TAU * turns * t),
    ];
  } else if (d.type === "spiral") {
    const r = radius(),
      inner = finite(d.innerRadius ?? 0),
      turns = finite(d.turns ?? 3);
    if (inner < 0) throw Error("innerRadius must be non-negative");
    sample = (t) => [
      mix(inner, r, t) * Math.cos(TAU * turns * t),
      mix(inner, r, t) * Math.sin(TAU * turns * t),
      0,
    ];
  } else if (d.type === "wave") {
    const length = positive(d.length ?? 5),
      amplitude = finite(d.amplitude ?? 1),
      cycles = finite(d.cycles ?? 2),
      phase = finite(d.phase ?? 0);
    sample = (t) => [
      (t - 0.5) * length,
      amplitude * Math.sin(TAU * cycles * t + phase),
      0,
    ];
  } else if (d.type === "torusKnot") {
    const r = radius(),
      tube = positive(d.tubeRadius ?? 0.4),
      p = count(d.p ?? 2, 1, 16, "p"),
      q = count(d.q ?? 3, 1, 16, "q");
    sample = (t) => {
      const a = t * TAU,
        s = r + tube * Math.cos(q * a);
      return [s * Math.cos(p * a), tube * Math.sin(q * a), s * Math.sin(p * a)];
    };
  } else throw Error(`${d.type} is not a curve`);
  if (placed) {
    const at = vector(d.at ?? [0, 0, 0], "at");
    const scale = (
      typeof d.scale === "number"
        ? [d.scale, d.scale, d.scale]
        : vector(d.scale ?? [1, 1, 1], "scale")
    ).map((n) => positive(n, "scale"));
    const [rx, ry, rz] = vector(d.rotation ?? [0, 0, 0], "rotation").map(
      (n) => (n * Math.PI) / 180,
    );
    const original = sample;
    // Match the renderer's XYZ Euler convention: apply Z, then Y, then X.
    sample = (t) => {
      const [x, y, z] = original(t).map((n, i) => n * scale[i]);
      const a = x * Math.cos(rz) - y * Math.sin(rz),
        b = x * Math.sin(rz) + y * Math.cos(rz);
      const c = a * Math.cos(ry) + z * Math.sin(ry),
        e = -a * Math.sin(ry) + z * Math.cos(ry);
      return add(
        [
          c,
          b * Math.cos(rx) - e * Math.sin(rx),
          b * Math.sin(rx) + e * Math.cos(rx),
        ],
        at,
      );
    };
  }
  return sample;
}

// Parallel transport prevents the arbitrary twisting of a Frenet frame near inflections.
function sweepFrames(sample, segments) {
  const points = Array.from({ length: segments + 1 }, (_, i) =>
    sample(i / segments),
  );
  const closed = Math.hypot(...sub(points[0], points.at(-1))) < 1e-6;
  const tangents = points.map((_, i) =>
    unit(sub(points[Math.min(segments, i + 1)], points[Math.max(0, i - 1)])),
  );
  if (closed && dot(tangents[0], tangents.at(-1)) > 0.99)
    tangents[0] = tangents[segments] = unit(add(tangents[0], tangents.at(-1)));
  let normal = unit(
    cross(tangents[0], Math.abs(tangents[0][1]) < 0.9 ? [0, 1, 0] : [1, 0, 0]),
  );
  const normals = [normal];
  for (let i = 1; i <= segments; i++) {
    const axis = cross(tangents[i - 1], tangents[i]),
      length = Math.hypot(...axis),
      cosine = Math.max(-1, Math.min(1, dot(tangents[i - 1], tangents[i])));
    if (length > 1e-8) {
      const n = mul(axis, 1 / length),
        angle = Math.atan2(length, cosine);
      normal = add(
        add(
          mul(normal, Math.cos(angle)),
          mul(cross(n, normal), Math.sin(angle)),
        ),
        mul(n, dot(n, normal) * (1 - Math.cos(angle))),
      );
    } else if (cosine < 0)
      throw Error("A tube cannot sweep through a reversing cusp");
    normal = unit(sub(normal, mul(tangents[i], dot(normal, tangents[i]))));
    normals.push(normal);
  }
  // Distribute residual twist for closed spines whose endpoint tangent also agrees.
  if (
    Math.hypot(...sub(points[0], points.at(-1))) < 1e-6 &&
    dot(tangents[0], tangents.at(-1)) > 0.99
  ) {
    const twist = Math.atan2(
      dot(tangents[0], cross(normals.at(-1), normals[0])),
      dot(normals.at(-1), normals[0]),
    );
    normals.forEach((n, i) => {
      const angle = (twist * i) / segments;
      normals[i] = add(
        mul(n, Math.cos(angle)),
        mul(cross(tangents[i], n), Math.sin(angle)),
      );
    });
  }
  return { points, tangents, normals };
}

export function surfaceSampler(input, segments = 64) {
  const d = describe(input),
    r = () => positive(d.radius ?? 1.6, "radius");
  if (d.type === "surface") {
    if (typeof d.fn !== "function")
      throw Error("A parametric surface needs a function");
    const u = domain(d.u),
      v = domain(d.v);
    return (s, t) => vector(d.fn(mix(...u, s), mix(...v, t)));
  }
  if (["plane", "heightField", "waveSurface", "saddle"].includes(d.type)) {
    const x = domain(d.x ?? [-2, 2]),
      z = domain(d.z ?? [-2, 2]);
    let fn = d.fn;
    if (d.type === "heightField" && typeof fn !== "function")
      throw Error("A height field needs a height function");
    if (d.type === "plane") fn = () => 0;
    if (d.type === "waveSurface") {
      const a = finite(d.amplitude ?? 0.6),
        frequency = finite(d.frequency ?? 2),
        phase = finite(d.phase ?? 0);
      fn = (x, z) =>
        a * Math.sin(x * frequency + phase) * Math.cos(z * frequency + phase);
    }
    if (d.type === "saddle") {
      const a = finite(d.curvature ?? 0.35);
      fn = (x, z) => a * (x * x - z * z);
    }
    return (u, v) => {
      const a = mix(...x, u),
        b = mix(...z, v);
      return [a, finite(fn(a, b), "surface height"), b];
    };
  }
  if (d.type === "sphere") {
    const radius = r();
    return (u, v) => {
      const lat = (v - 0.5) * Math.PI;
      return [
        radius * Math.cos(TAU * u) * Math.cos(lat),
        radius * Math.sin(lat),
        radius * Math.sin(TAU * u) * Math.cos(lat),
      ];
    };
  }
  if (d.type === "torus") {
    const radius = r(),
      tube = positive(d.tubeRadius ?? 0.55);
    return (u, v) => [
      (radius + tube * Math.cos(TAU * v)) * Math.cos(TAU * u),
      tube * Math.sin(TAU * v),
      (radius + tube * Math.cos(TAU * v)) * Math.sin(TAU * u),
    ];
  }
  if (d.type === "cylinder" || d.type === "cone") {
    const radius = r(),
      height = positive(d.height ?? 3);
    return (u, v) => {
      const s = radius * (d.type === "cone" ? 1 - v : 1);
      return [s * Math.cos(TAU * u), (v - 0.5) * height, s * Math.sin(TAU * u)];
    };
  }
  if (d.type === "between" || d.type === "loft") {
    const inputs = d.curves ?? [d.from, d.to];
    if (!Array.isArray(inputs)) throw Error("A loft needs curves");
    count(inputs.length, 2, 32, "loft curves");
    const curves = inputs.map((c) => curveSampler(c, true));
    return (u, v) => {
      const at = v * (curves.length - 1),
        i = Math.min(curves.length - 2, Math.floor(at));
      return lerp(curves[i](u), curves[i + 1](u), at - i);
    };
  }
  if (d.type === "revolve") {
    const profile = curveSampler(d.profile, true),
      angle = finite(d.angle ?? TAU);
    return (u, v) => {
      const p = profile(u);
      if (p[0] < 0 || Math.abs(p[2]) > 1e-7)
        throw Error("Revolve needs an XY profile with non-negative radius X");
      return [p[0] * Math.cos(v * angle), p[1], p[0] * Math.sin(v * angle)];
    };
  }
  if (d.type === "tube") {
    const spine = curveSampler(d.curve, true),
      frames = sweepFrames(spine, segments),
      radius = positive(d.radius ?? 0.12);
    return (u, v) => {
      const at = u * segments,
        i = Math.min(segments - 1, Math.floor(at)),
        t = at - i;
      const tangent = unit(lerp(frames.tangents[i], frames.tangents[i + 1], t));
      const normal = lerp(frames.normals[i], frames.normals[i + 1], t);
      const n = unit(sub(normal, mul(tangent, dot(normal, tangent)))),
        b = cross(tangent, n);
      return add(
        spine(u),
        add(
          mul(n, radius * Math.cos(v * TAU)),
          mul(b, radius * Math.sin(v * TAU)),
        ),
      );
    };
  }
  if (d.type === "ribbon") {
    const spine = curveSampler(d.curve, true),
      width = positive(d.width ?? 0.4),
      normal = unit(vector(d.normal ?? [0, 0, 1]));
    return (u, v) => {
      const tangent = unit(
        sub(spine(Math.min(1, u + 1e-5)), spine(Math.max(0, u - 1e-5))),
      );
      return add(
        spine(u),
        mul(unit(cross(normal, tangent)), width * (v - 0.5)),
      );
    };
  }
  throw Error(`${d.type} is not a sampled surface`);
}

function arrays(points, indices, extra = {}) {
  const positions = Float32Array.from(points.flat());
  if (!positions.every(Number.isFinite))
    throw Error("Geometry exceeds the supported finite coordinate range");
  return {
    positions,
    indices: indices ? Uint32Array.from(indices) : null,
    ...extra,
  };
}
function solid(d) {
  let shape = d.type === "extrusion" ? describe(d.shape) : d;
  const depth = finite(
    d.depth ?? (d.type === "cube" ? (d.size ?? 2) : d.type === "prism" ? 2 : 0),
    "depth",
  );
  if (depth < 0) throw Error("Extrusion depth must be non-negative");
  let rings, cap;
  if (shape.type === "fill") {
    const n = count(shape.segments ?? 128, 8, 2048, "fill segments");
    const boundaries = [shape.boundary, ...(shape.holes ?? [])];
    count(boundaries.length, 1, 32, "contours");
    rings = boundaries.map((input) => {
      const sample = curveSampler(input, true),
        first = sample(0),
        last = sample(1);
      if (Math.hypot(...sub(first, last)) > 1e-6)
        throw Error("Filled boundaries must be closed");
      return Array.from({ length: n }, (_, i) => sample(i / n));
    });
    if (rings.flat().some((p) => Math.abs(p[2]) > 1e-6))
      throw Error("Fill and extrusion boundaries must lie in the XY plane");
    rings.forEach((ring, index) => {
      const area = ring.reduce((sum, p, i) => {
        const q = ring[(i + 1) % ring.length];
        return sum + p[0] * q[1] - q[0] * p[1];
      }, 0);
      if (Math.abs(area) < 1e-10)
        throw Error("Filled boundary has no signed area");
      if (area > 0 !== (index === 0)) ring.reverse();
    });
    const holes = [];
    let total = rings[0].length;
    for (const ring of rings.slice(1)) {
      holes.push(total);
      total += ring.length;
    }
    cap = earcut(
      rings.flat().flatMap((p) => p.slice(0, 2)),
      holes,
      2,
    );
    if (!cap.length) throw Error("Filled region has no area");
  } else {
    if (
      !["disk", "square", "rectangle", "polygon", "cube", "prism"].includes(
        shape.type,
      )
    )
      throw Error("Extrude a disk, square, polygon or filled XY region");
    const sidesForCount = ["polygon", "prism"].includes(shape.type)
      ? count(shape.sides ?? 6, 3, 64, "polygon sides")
      : 4;
    const n = count(
      shape.segments ?? Math.ceil(192 / sidesForCount) * sidesForCount,
      12,
      4096,
      "boundary segments",
    );
    let sample;
    if (shape.type === "disk") {
      const rx = positive(shape.radiusX ?? shape.radius ?? 1.5),
        ry = positive(shape.radiusY ?? shape.radius ?? 1.5);
      sample = (t) => [rx * Math.cos(TAU * t), ry * Math.sin(TAU * t), 0];
    } else if (["square", "rectangle", "cube"].includes(shape.type)) {
      if (n % 8)
        throw Error(
          "Square and rectangle boundary segments must be divisible by eight to preserve corners",
        );
      const w = positive(shape.width ?? shape.size ?? 2),
        h = positive(shape.height ?? shape.size ?? 2);
      sample = (t) => {
        const x = Math.cos(TAU * t),
          y = Math.sin(TAU * t),
          scale = 1 / Math.max(Math.abs(x), Math.abs(y));
        return [(x * scale * w) / 2, (y * scale * h) / 2, 0];
      };
    } else {
      const sides = count(shape.sides ?? 6, 3, 64, "polygon sides"),
        radius = positive(shape.radius ?? 1.5);
      if (n % sides)
        throw Error(
          "Polygon boundary segments must be divisible by the number of sides",
        );
      sample = (t) => {
        const q = t * sides,
          i = Math.floor(q),
          a = (i * TAU) / sides,
          b = ((i + 1) * TAU) / sides;
        return lerp(
          [radius * Math.cos(a), radius * Math.sin(a), 0],
          [radius * Math.cos(b), radius * Math.sin(b), 0],
          q - i,
        );
      };
    }
    rings = [Array.from({ length: n }, (_, i) => sample(i / n))];
    // A center fan keeps circle/square/cube correspondence stable, including collinear boundary points.
    cap = [];
    for (let i = 0; i < n; i++) cap.push(n, i, (i + 1) % n);
  }
  const boundary = rings.flat();
  const hasCenter = shape.type !== "fill",
    face = hasCenter ? [...boundary, [0, 0, 0]] : boundary,
    faceCount = face.length;
  const points = [
    ...face.map((p) => [p[0], p[1], depth / 2]),
    ...face.map((p) => [p[0], p[1], -depth / 2]),
  ];
  const indices = [...cap];
  for (let i = 0; i < cap.length; i += 3)
    indices.push(
      cap[i + 2] + faceCount,
      cap[i + 1] + faceCount,
      cap[i] + faceCount,
    );
  for (const ring of rings) {
    // Separate side vertices give cap edges crisp normals.
    const base = points.length;
    for (const p of ring)
      points.push([p[0], p[1], depth / 2], [p[0], p[1], -depth / 2]);
    for (let i = 0; i < ring.length; i++) {
      const a = base + 2 * i,
        b = base + 2 * ((i + 1) % ring.length);
      indices.push(a, a + 1, b, b, a + 1, b + 1);
    }
  }
  return arrays(points, indices, {
    kind: "mesh",
    topology: `solid:${faceCount}:${indices.join(",")}`,
    depth,
    flatCount: cap.length,
    descriptor: d,
    flatShading: true,
    contours: rings,
  });
}

export function compileGeometry(input) {
  const d = describe(input);
  if (d.type === "vector")
    return { ...compileVector(d.asset, d.depth ?? 0), descriptor: d };
  if (CURVES.has(d.type)) {
    const segments = count(d.segments ?? 256, 2, 16384, "curve segments"),
      sample = curveSampler(d);
    return arrays(
      Array.from({ length: segments + 1 }, (_, i) => sample(i / segments)),
      null,
      { kind: "curve", topology: `curve:${segments}`, sample, descriptor: d },
    );
  }
  if (SOLIDS.has(d.type)) return solid(d);
  const us = count(d.uSegments ?? 64, 2, 256, "uSegments"),
    vs = count(d.vSegments ?? 32, 2, 256, "vSegments");
  if ((us + 1) * (vs + 1) > 66049)
    throw Error("Surface sample budget exceeded");
  const sample = surfaceSampler(d, us),
    points = [],
    indices = [];
  for (let u = 0; u <= us; u++)
    for (let v = 0; v <= vs; v++)
      points.push(vector(sample(u / us, v / vs), "surface point"));
  for (let u = 0; u < us; u++)
    for (let v = 0; v < vs; v++) {
      const a = u * (vs + 1) + v,
        b = a + vs + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  return arrays(points, indices, {
    kind: "mesh",
    topology: `grid:${us}:${vs}`,
    sample,
    grid: [us, vs],
    descriptor: d,
  });
}

export function prepareGeometryMorph(source, target) {
  if (source.vector || target.vector)
    throw Error(
      "Vector geometry needs contour correspondence; use object.transformTo",
    );
  if (source.kind !== target.kind || source.topology !== target.topology)
    throw Error(
      "These shapes need matching sampled topology. Use equal curve segments, equal surface grids, or an explicit extrusion/assembly recipe.",
    );
  return {
    source,
    target,
    sample(t, output) {
      finite(t, "morph progress");
      if (t < 0 || t > 1)
        throw Error("Morph progress must be between zero and one");
      const a = source.positions,
        b = target.positions;
      if (output.length !== a.length)
        throw Error("Morph buffer has the wrong size");
      if (t === 0) output.set(a);
      else if (t === 1) output.set(b);
      else for (let i = 0; i < a.length; i++) output[i] = mix(a[i], b[i], t);
      return output;
    },
  };
}
